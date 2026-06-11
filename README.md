# DishLens — MVP test build

Point it at any menu. See every dish.

Snap a photo of a restaurant menu in any language → every dish comes back as a card with a photo, translation, plain-English description, price in GBP, allergen/spice flags, and one line of ordering advice.

## What's in here

```
menuscan/
  App.tsx                  # entry + state-based navigation (3 screens)
  src/
    screens/ScanScreen     # camera / photo picker
    screens/ResultsScreen  # dish card list (+ lock banner)
    screens/PaywallScreen  # pricing stub w/ Travel Pass SKU + dev unlock
    components/DishCard    # the core UI unit
    lib/api.ts             # client for the worker
    lib/scanLimit.ts       # 1 free full scan, then photos blur
  worker/                  # Cloudflare Worker backend
    src/index.js           # Claude vision call + image lookup + KV cache
```

## Setup — about 20 minutes

### 1. Deploy the backend

```bash
cd worker
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY     # from console.anthropic.com
npx wrangler deploy
```

Copy the deployed URL (e.g. `https://dishlens-api.xxx.workers.dev`).

**Optional, for real dish photos** (skip for first test — placeholders show instead):
- Get a key at console.cloud.google.com → enable "Custom Search API"
- Create a Programmable Search Engine at programmablesearchengine.google.com with **image search ON**, copy the engine ID (cx)
- `npx wrangler secret put GOOGLE_CSE_KEY` and `npx wrangler secret put GOOGLE_CSE_CX`
- Create the cache: `npx wrangler kv namespace create DISH_IMAGES`, paste the id into `wrangler.toml`, uncomment the block, redeploy

### 2. Point the app at the backend

Edit `src/lib/api.ts` → set `API_URL` to your worker URL.

### 3. Run it

```bash
npm install
npx expo start
```

Scan the QR with **Expo Go** on your iPhone. Everything in this build works in Expo Go — no EAS build needed for testing.

## Testing the flow

1. First scan → full results with photos (or glyph placeholders).
2. Second scan → photos blur, lock banner appears → tap → paywall.
3. Paywall "purchase" flips a local flag (test mode). "Dev: reset" at the bottom clears the counter so you can demo repeatedly.

Good test material: Google "茶餐廳 menu", "izakaya menu japanese", "thai menu ภาษาไทย" → screenshot → "Choose from photos".

## Before launch (not in this build)

- RevenueCat + Superwall replacing the paywall stub
- Rate limiting / device auth on the worker (it's an open endpoint right now — fine for private testing, not for shipping)
- App icon, splash, App Store assets
- EAS build + TestFlight

## Cost per scan

~1–2p of Claude tokens + ~0.4p per *uncached* dish image. The KV cache means popular dishes are looked up once globally, ever.
