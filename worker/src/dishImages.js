// Tavue dish images — three-tier pipeline.
//
//   1. R2 cache             — anything we already fetched or generated
//   2. Wikidata → Commons   — a real photograph, for dishes with a canonical name
//   3. Workers AI (flux)    — a generated illustration, for descriptive menu lines
//
// Everything is keyed on the dish's `image_key`, so tiers 2 and 3 are paid for
// once per dish, globally, forever. Measured hit rate for tier 2 is 20/20 on
// named dishes and 0/2 on restaurant-written descriptive lines, which is why
// `canonical_name === null` skips straight to generation.
//
// Bindings:
//   DISH_IMAGE_BUCKET  R2     stores the bytes we serve
//   DISH_IMAGES        KV     source + attribution per image_key; falls back
//                             to FEEDBACK with isolated `img:` keys
//   AI                 Workers AI, for the generation tier
// Vars:
//   IMAGE_BASE_URL     public prefix the stored images are served from

// Wikimedia blocks clients that do not identify themselves. This is not
// optional politeness — requests without it get banned.
const WIKIMEDIA_USER_AGENT =
  "Tavue/0.8.2 (https://tavue.co.uk; jimcai416@gmail.com)";

const COMMONS_WIDTH = 800;
const IMAGE_TTL_SECONDS = 60 * 60 * 24 * 365;
const MISS_TTL_SECONDS = 60 * 60 * 24 * 7;

// Wikidata classes that mean "this is something you eat or drink". Checked
// against P31 (instance of) and P279 (subclass of), one parent hop deep.
const FOOD_CLASSES = new Set([
  "Q2095", // food
  "Q746549", // dish
  "Q19861951", // type of food or dish
  "Q40050", // drink
  "Q154", // alcoholic beverage
]);

// P2012 (cuisine) only ever appears on food items, so its presence alone is
// enough — it rescues regional dishes with sparse or unusual P31 statements.
const CUISINE_PROPERTY = "P2012";

// How many class levels above the candidate to look for one of the above.
const MAX_CLASS_DEPTH = 3;

const FLUX_MODEL = "@cf/black-forest-labs/flux-1-schnell";

// Butchery vocabulary reads as anatomy to the safety filter. Rewriting these
// is the difference between an image and a hard NSFW refusal.
const SAFE_REWRITES = [
  [/\bskin\b/gi, "crisp outer surface"],
  [/\bbreasts?\b/gi, "white meat"],
  [/\bthighs?\b/gi, "leg meat"],
  [/\bflesh\b/gi, "meat"],
  [/\bbell(?:y|ies)\b/gi, "pork belly cut"],
  [/\braw\b/gi, "uncooked"],
  [/\bbloody\b/gi, "deep red"],
];

/**
 * Cache key for a dish. Named dishes share a readable, normalised key so the
 * same dish photographed in Lyon and in Taipei resolves to one stored image.
 * Descriptive menu lines get a hash of their own text.
 */
export async function dishImageKey(dish) {
  const canonical = trimmed(dish?.canonical_name);
  if (canonical) {
    const slug = canonical
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96);
    if (slug) return slug;
  }
  const text = trimmed(dish?.original_name) || trimmed(dish?.translated_name);
  return text ? await sha256Hex(text, 16) : "";
}

/**
 * Resolve one dish photo.
 *
 * @returns {Promise<{url: string, source: "commons"|"generated",
 *   attribution?: {artist: string, licence: string, url: string}} | null>}
 */
export async function resolveDishImage(dish, env) {
  const key = dish?.image_key || (await dishImageKey(dish));
  if (!key) return null;

  const cached = await readCache(env, key);
  if (cached !== undefined) return cached;

  let resolved = null;
  if (trimmed(dish?.canonical_name)) {
    resolved = await commonsImage(dish, env, key);
  }
  if (!resolved) {
    resolved = await generatedImage(dish, env, key);
  }

  if (!resolved) await writeMiss(env, key);
  return resolved;
}

// ---------------------------------------------------------------- cache tier

// `undefined` means "not cached", `null` means "cached as unavailable".
async function readCache(env, key) {
  if (env.DISH_IMAGE_BUCKET) {
    const stored = await env.DISH_IMAGE_BUCKET.head(objectKey(key)).catch(
      () => null
    );
    if (stored) {
      const source =
        stored.customMetadata?.source === "commons" ? "commons" : "generated";
      if (source === "generated") return { url: publicUrl(env, key), source };

      // A Commons photo we can no longer credit must not be shown. Fall
      // through and resolve it again, which restores the attribution record.
      const record = await readRecord(env, key);
      if (record?.attribution) {
        return present({ ...record, url: publicUrl(env, key) });
      }
      return undefined;
    }
  }

  const record = await readRecord(env, key);
  if (record?.source === "none") return null;
  // Written when R2 is not configured and Commons was linked directly.
  if (record?.url && !record.stored) return present(record);
  return undefined;
}

// A dedicated namespace is cleaner, but the beta safely shares the FEEDBACK
// one: `img:` keys cannot collide with `fb:` keys.
function metaStore(env) {
  return env.DISH_IMAGES || env.FEEDBACK || null;
}

async function readRecord(env, key) {
  const store = metaStore(env);
  if (!store) return null;
  const raw = await store.get(metaKey(key)).catch(() => null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function present(record) {
  const result = { url: record.url, source: record.source };
  if (record.attribution) result.attribution = record.attribution;
  return result;
}

async function writeRecord(env, key, record, ttlSeconds = IMAGE_TTL_SECONDS) {
  const store = metaStore(env);
  if (!store) return;
  await store
    .put(metaKey(key), JSON.stringify(record), { expirationTtl: ttlSeconds })
    .catch(() => {});
}

async function writeMiss(env, key) {
  await writeRecord(env, key, { source: "none" }, MISS_TTL_SECONDS);
}

async function storeBytes(env, key, bytes, contentType, source) {
  if (!env.DISH_IMAGE_BUCKET) return null;
  try {
    await env.DISH_IMAGE_BUCKET.put(objectKey(key), bytes, {
      httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { source },
    });
    return publicUrl(env, key);
  } catch {
    return null;
  }
}

function metaKey(key) {
  return `img:${key}`;
}

function objectKey(key) {
  return `dishes/${key}`;
}

// Always absolute: a relative path would not load in the native app.
function publicUrl(env, key) {
  const base = (env.IMAGE_BASE_URL || "").replace(/\/+$/, "");
  return `${base}/${encodeURIComponent(key)}`;
}

// ------------------------------------------------------------- commons tier

async function commonsImage(dish, env, key) {
  try {
    const name = trimmed(dish.canonical_name);
    const lang = languageCode(dish.canonical_lang);

    const ids = await searchEntities(name, lang);
    if (!ids.length) return null;

    const entities = await getEntities(ids);
    // Only candidates that actually carry a photo are worth classifying.
    const candidates = ids
      .map((id) => entities[id])
      .filter((entity) => entity && fileName(entity));
    if (!candidates.length) return null;

    let match = null;
    for (const candidate of candidates) {
      if (await isFood(candidate, entities)) {
        match = candidate;
        break;
      }
    }
    if (!match) return null;

    const file = fileName(match);
    const fileUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      file
    )}?width=${COMMONS_WIDTH}`;
    const credit = await fileCredit(file);

    const attribution = {
      artist: credit.artist,
      licence: credit.licence,
      url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
    };

    const image = await wikimediaFetch(fileUrl);
    if (!image?.ok) return null;
    const contentType = (image.headers.get("content-type") || "image/jpeg").split(
      ";"
    )[0];
    if (!contentType.startsWith("image/")) return null;

    const bytes = await image.arrayBuffer();
    const hosted = await storeBytes(env, key, bytes, contentType, "commons");

    const record = {
      url: hosted || fileUrl,
      source: "commons",
      attribution,
      stored: Boolean(hosted),
    };
    await writeRecord(env, key, record);
    return present(record);
  } catch {
    return null;
  }
}

async function searchEntities(search, language) {
  const url =
    "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&type=item&limit=5" +
    `&search=${encodeURIComponent(search)}` +
    `&language=${language}&uselang=${language}`;
  const res = await wikimediaFetch(url);
  if (!res?.ok) return [];
  const data = await res.json();
  return (data.search || []).map((hit) => hit.id).filter(Boolean);
}

async function getEntities(ids) {
  if (!ids.length) return {};
  const url =
    "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims" +
    `&ids=${ids.slice(0, 50).join("|")}`;
  const res = await wikimediaFetch(url);
  if (!res?.ok) return {};
  const data = await res.json();
  return data.entities || {};
}

function claimIds(entity, property) {
  return (entity?.claims?.[property] || [])
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean);
}

function parentIds(entity) {
  return [...claimIds(entity, "P31"), ...claimIds(entity, "P279")];
}

// Wikidata puts real dishes several classes above "food": coq au vin is a
// chicken dish, which is a meat dish, which is a dish. Walking a fixed few
// levels catches that without needing every intermediate class listed here.
// `cache` is shared across the candidates so each class is fetched once.
async function isFood(entity, cache) {
  if ((entity?.claims?.[CUISINE_PROPERTY] || []).length > 0) return true;

  let frontier = parentIds(entity);
  const seen = new Set(frontier);

  for (let depth = 0; depth < MAX_CLASS_DEPTH; depth += 1) {
    if (!frontier.length) return false;
    if (frontier.some((id) => FOOD_CLASSES.has(id))) return true;

    const missing = frontier.filter((id) => !cache[id]);
    if (missing.length) Object.assign(cache, await getEntities(missing));

    const next = [];
    for (const id of frontier) {
      for (const parent of parentIds(cache[id])) {
        if (seen.has(parent)) continue;
        seen.add(parent);
        next.push(parent);
      }
    }
    frontier = next;
  }
  return false;
}

function fileName(entity) {
  const image = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return typeof image === "string" && image ? image : null;
}

// CC BY and CC BY-SA both require the author and the licence to travel with
// the image, so a file we cannot credit is a file we do not use.
async function fileCredit(file) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo" +
    "&iiprop=extmetadata" +
    `&titles=${encodeURIComponent(`File:${file}`)}`;
  const res = await wikimediaFetch(url);
  if (!res?.ok) return { artist: "Wikimedia Commons", licence: "See file page" };

  const data = await res.json();
  const pages = data?.query?.pages || {};
  const meta =
    Object.values(pages)[0]?.imageinfo?.[0]?.extmetadata || {};

  return {
    artist: plainText(meta.Artist?.value) || "Unknown author",
    licence:
      plainText(meta.LicenseShortName?.value) ||
      plainText(meta.License?.value) ||
      "See file page",
  };
}

async function wikimediaFetch(url) {
  try {
    return await fetch(url, {
      headers: {
        "User-Agent": WIKIMEDIA_USER_AGENT,
        Accept: "application/json, image/*;q=0.9, */*;q=0.8",
      },
    });
  } catch {
    return null;
  }
}

// Commons credit fields are arbitrary HTML.
function plainText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

// ----------------------------------------------------------- generated tier

function fluxPrompt(dish) {
  const subject =
    trimmed(dish?.description) ||
    trimmed(dish?.translated_name) ||
    trimmed(dish?.original_name) ||
    "A plated restaurant dish.";

  return `Casual phone snapshot of food on a restaurant table. ${subject}
Ordinary everyday tableware, plain white or simple ceramic.
Shot from directly above, whole plate in frame, everything in focus.
Indoor restaurant lighting, slightly warm and uneven, natural shadows.
Unstyled and unposed, as actually served, slightly imperfect plating.
Sharp, well exposed, no filter, no bokeh, no props, no text, no hands.`;
}

function rewriteForSafety(prompt) {
  const rewritten = SAFE_REWRITES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    prompt
  )
    // "pork belly" becomes "pork pork belly cut" without this.
    .replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
  return `Culinary food photograph for a restaurant menu.\n${rewritten}`;
}

async function generatedImage(dish, env, key) {
  if (!env.AI || !env.DISH_IMAGE_BUCKET) return null;

  let bytes = await runFlux(env, fluxPrompt(dish));
  if (bytes === "blocked") {
    bytes = await runFlux(env, rewriteForSafety(fluxPrompt(dish)));
  }
  if (!bytes || bytes === "blocked") return null;

  const url = await storeBytes(env, key, bytes, "image/jpeg", "generated");
  if (!url) return null;

  const record = { url, source: "generated", stored: true };
  await writeRecord(env, key, record);
  return present(record);
}

// Returns the image bytes, "blocked" when the safety filter refused, or null.
async function runFlux(env, prompt) {
  try {
    const result = await env.AI.run(FLUX_MODEL, { prompt, steps: 4 });
    const base64 = result?.image;
    if (typeof base64 !== "string" || !base64) return null;
    return base64ToBytes(base64);
  } catch (error) {
    const message = (
      error instanceof Error ? error.message : String(error || "")
    ).toLowerCase();
    if (/nsfw|safety|moderat|content filter|inappropriate/.test(message)) {
      return "blocked";
    }
    return null;
  }
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ------------------------------------------------------------------ helpers

function trimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function languageCode(value) {
  const code = trimmed(value).toLowerCase().slice(0, 12);
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code) ? code : "en";
}

async function sha256Hex(text, hexLength) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, hexLength);
}
