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

const MODEL = "claude-sonnet-4-20250514";
const MAX_DISHES = 40;

const SYSTEM_PROMPT = `You are DishLens, an expert menu reader for travellers. You read restaurant menu photos in any language and explain every dish plainly to an English speaker.

Rules:
- Extract ONLY food and drink items actually printed on the menu. Skip headers, addresses, slogans.
- Descriptions are one plain sentence saying what the dish actually IS — preparation and key ingredients. Never marketing language.
- "worth_it" is one short line of honest ordering advice (classic order, tourist trap, great value, skip if you dislike X). Use null if you have nothing useful to say.
- For prices: copy exactly as printed into "price". Guess the currency from language/context into "currency" (ISO code) at the top level. Convert each price to GBP using approximate current rates into "price_gbp" formatted like "£4.80". If no price is printed, use null for both.
- "image_query" must be a short English search query that returns photos of this exact dish, e.g. "wonton lo mein noodles".
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
      "ingredients": string[],
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
    if (request.method !== "POST" || url.pathname !== "/scan") {
      return json({ error: "POST /scan" }, 404, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400, cors);
    }
    const { imageBase64, mediaType } = body || {};
    if (!imageBase64) return json({ error: "imageBase64 required" }, 400, cors);

    // ---- 1. Parse the menu with Claude ----
    let parsed;
    try {
      parsed = await parseMenu(env, imageBase64, mediaType || "image/jpeg");
    } catch (e) {
      return json({ error: `Menu parsing failed: ${e.message}` }, 502, cors);
    }

    // ---- 2. Resolve dish images (cache-first, in parallel) ----
    const dishes = (parsed.dishes || []).slice(0, MAX_DISHES);
    await Promise.all(
      dishes.map(async (dish) => {
        dish.image_url = await resolveImage(env, dish);
      })
    );
    parsed.dishes = dishes;

    return json(parsed, 200, cors);
  },
};

async function parseMenu(env, imageBase64, mediaType) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
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

async function braveImage(env, dish) {
  try {
    const q = encodeURIComponent(`${dish.image_query} dish food`);
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${q}&count=1&safesearch=strict`,
      {
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": env.BRAVE_API_KEY,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.results?.[0];
    // Prefer the full image URL; fall back to Brave's hosted thumbnail,
    // which is reliable and hotlink-friendly.
    return first?.properties?.url || first?.thumbnail?.src || null;
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
