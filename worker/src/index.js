// DishLens API — Cloudflare Worker
//
// POST /scan  { imageBase64, mediaType }  →  ScanResult JSON
//
// Pipeline:
//   1. One multimodal Claude call: OCR + translate + structure the menu.
//   2. For each dish, resolve a photo: KV cache → Google Image Search → null.
//
// Secrets (set with `wrangler secret put NAME`):
//   ANTHROPIC_API_KEY   required
//   GOOGLE_CSE_KEY      optional — Google Custom Search API key
//   GOOGLE_CSE_CX       optional — Programmable Search Engine ID (image search on)
// KV binding (optional but recommended): DISH_IMAGES

// Haiku: ~3-4x faster than Sonnet for extraction tasks like this.
// Override per-deploy with `wrangler secret put MODEL` if quality needs a bump
// (e.g. back to "claude-sonnet-4-20250514").
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_DISHES = 80;
const MAX_TOKENS = 16000;

const systemPrompt = (lang) => `You are DishLens, an expert menu reader for travellers. You read restaurant menu photos in any language and explain every dish plainly to a ${lang} speaker.

Rules:
- Extract EVERY food and drink item printed on the menu — completeness is critical. If the menu has 60 dishes, return 60 dishes. Never summarise, sample, or skip sections.
- NEVER output section or category headers (e.g. "Antipasti", "Carne e Pollame", "Desserts", "Sides") as dishes. A dish is something a diner can order, usually with its own price. If you catch yourself writing "section header" in a description, omit that item entirely.
- Write "translated_name", "description" and "worth_it" in ${lang}. If the menu is already in ${lang}, still fill these fields (translated_name may match the original).
- Descriptions: ONE short sentence (max 14 words) saying what the dish actually IS. Never marketing language.
- For wine, sake, beer, and spirits lists: the description should give grape/style/region and a 2-3 word flavour profile (e.g. "Tuscan Sangiovese — bold, cherry, dry"). "worth_it" can suggest what it pairs with.
- "worth_it" is one short line (max 10 words) of honest ordering advice. Use null when you have nothing useful — most dishes should be null; reserve it for standouts, classics, and traps.
- For prices: copy exactly as printed into "price". Guess the currency from language/context into "currency" (ISO code) at the top level. Convert each price to GBP using approximate current rates into "price_gbp" formatted like "£4.80". If no price is printed, use null for both.
- "image_query" must ALWAYS be a short English search query that returns photos of this exact dish, e.g. "wonton lo mein noodles" — English regardless of the target language.
- "spice_level": 0 none, 1 mild, 2 medium, 3 hot.
- Respond with ONLY valid JSON. No markdown, no code fences, no preamble.

JSON schema:
{
  "cuisine": string,
  "currency": string | null,
  "menu_language": string,
  "dishes": [
    {
      "original_name": string,
      "romanized": string | null,
      "translated_name": string,
      "description": string,
      "price": string | null,
      "price_gbp": string | null,
      "spice_level": 0 | 1 | 2 | 3,
      "flags": ("spicy"|"raw"|"offal"|"contains_nuts"|"contains_shellfish"|"contains_gluten"|"contains_dairy"|"vegetarian"|"vegan"|"house_special")[],
      "worth_it": string | null,
      "image_query": string
    }
  ]
}`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const url = new URL(request.url);

    // ---- Feedback endpoint: stores bug reports in KV ----
    if (request.method === "POST" && url.pathname === "/feedback") {
      let fb;
      try {
        fb = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400, cors);
      }
      const message = (fb?.message || "").toString().trim().slice(0, 2000);
      if (!message) return json({ error: "message required" }, 400, cors);
      const entry = {
        message,
        meta: (fb?.meta || "").toString().slice(0, 500),
        date: new Date().toISOString(),
      };
      if (!env.FEEDBACK) {
        return json({ error: "Feedback storage not configured" }, 500, cors);
      }
      await env.FEEDBACK.put(`fb:${Date.now()}`, JSON.stringify(entry));
      return json({ ok: true }, 200, cors);
    }

    if (request.method !== "POST" || url.pathname !== "/scan") {
      return json({ error: "POST /scan" }, 404, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, cors);
    }
    const { imageBase64, mediaType, targetLanguage } = body || {};
    if (!imageBase64) return json({ error: "imageBase64 required" }, 400, cors);
    const lang = typeof targetLanguage === "string" && targetLanguage.trim()
      ? targetLanguage.trim().slice(0, 40)
      : "English";

    // ---- 1. Parse the menu with Claude ----
    let parsed;
    try {
      parsed = await parseMenu(env, imageBase64, mediaType || "image/jpeg", lang);
    } catch (e) {
      return json({ error: `Menu parsing failed: ${e.message}` }, 502, cors);
    }

    // ---- 2. Resolve dish images (cache-first, batched to respect rate limits) ----
    // Cloudflare free tier: ~50 subrequests per request. Brave free tier: 1 req/sec.
    // We cap lookups and process in small waves; KV cache fills the gaps over time.
    const dishes = (parsed.dishes || []).slice(0, MAX_DISHES);
    const cap = parseInt(env.IMAGE_LOOKUP_CAP || "45", 10);
    const batchSize = parseInt(env.IMAGE_BATCH_SIZE || "10", 10);
    const toLookup = dishes.slice(0, cap);

    for (let i = 0; i < toLookup.length; i += batchSize) {
      const batch = toLookup.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (dish) => {
          dish.image_url = await resolveImage(env, dish);
        })
      );
    }
    for (const dish of dishes) {
      if (dish.image_url === undefined) dish.image_url = null;
    }
    parsed.dishes = dishes;

    return json(parsed, 200, cors);
  },
};

async function parseMenu(env, imageBase64, mediaType, lang = "English") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt(lang),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: "Read this menu and return the JSON." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  // Strip accidental code fences, then parse.
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Last resort: grab the outermost JSON object.
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Model returned unparseable output");
  }
}

// Cache key: normalised dish identity, shared across all users forever.
function cacheKey(dish) {
  return `img:${dish.original_name}`.toLowerCase().replace(/\s+/g, "");
}

async function resolveImage(env, dish) {
  // KV cache hit → free
  if (env.DISH_IMAGES) {
    const cached = await env.DISH_IMAGES.get(cacheKey(dish));
    if (cached) return cached === "none" ? null : cached;
  }

  let link = null;
  if (env.BRAVE_API_KEY) {
    link = await braveImage(env, dish);
  } else if (env.GOOGLE_CSE_KEY && env.GOOGLE_CSE_CX) {
    link = await googleImage(env, dish);
  } else {
    // No image search configured → graceful null (app shows glyph placeholder)
    return null;
  }

  if (env.DISH_IMAGES) {
    // Cache misses too, so we never pay twice for the same dish.
    await env.DISH_IMAGES.put(cacheKey(dish), link || "none", {
      expirationTtl: link ? 60 * 60 * 24 * 90 : 60 * 60 * 24 * 7,
    });
  }
  return link;
}

// Domains that produce watermarked stock, ad creatives, or recipe title-cards.
const IMAGE_DOMAIN_BLOCKLIST = [
  "pinterest.",
  "alamy.com",
  "shutterstock.com",
  "gettyimages.",
  "istockphoto.com",
  "dreamstime.com",
  "depositphotos.com",
  "123rf.com",
  "stock.adobe.com",
  "vectorstock.com",
  "etsy.com",
  "amazon.",
  "ebay.",
];

function isBlockedSource(result) {
  const src = (
    result?.url ||
    result?.meta_url?.hostname ||
    result?.source ||
    ""
  ).toLowerCase();
  return IMAGE_DOMAIN_BLOCKLIST.some((d) => src.includes(d));
}

async function braveImage(env, dish, attempt = 0) {
  try {
    const q = encodeURIComponent(`${dish.image_query} dish food`);
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${q}&count=3&safesearch=strict`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": env.BRAVE_API_KEY,
        },
      }
    );
    if (res.status === 429 && attempt < 1) {
      // Rate limited — wait a beat and retry once.
      await new Promise((r) => setTimeout(r, 1100));
      return braveImage(env, dish, attempt + 1);
    }
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    // First non-blocklisted candidate; fall back to the first result at all.
    const pick = results.find((r) => !isBlockedSource(r)) || results[0];
    return pick?.properties?.url || pick?.thumbnail?.src || null;
  } catch {
    return null;
  }
}

async function googleImage(env, dish) {
  try {
    const q = encodeURIComponent(`${dish.image_query} dish food`);
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_CSE_KEY}&cx=${env.GOOGLE_CSE_CX}&searchType=image&num=1&imgSize=large&safe=active&q=${q}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.link || null;
  } catch {
    return null;
  }
}

function json(obj, status, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });
}
