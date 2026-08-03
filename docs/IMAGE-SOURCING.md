# Dish image sourcing

How Tavue puts a picture next to a dish, what it owes the people who took those
pictures, and who to write to when something is wrong.

Implementation: [`worker/src/dishImages.js`](../worker/src/dishImages.js).

## Why it works this way

Menu lines fall into two kinds, and they need different answers:

- **Named dishes** — *Coq au vin*, *麻婆豆腐*, *ほうとう*, *Cacio e pepe*. These
  exist independently of any restaurant, so a real photograph of the real dish
  is both available and correct.
- **Descriptive lines** — *Filet de bar, fenouil confit, jus au safran*. These
  are one kitchen's wording for one plate. No encyclopedia has them.

A Wikidata lookup hit 20 of 20 named dishes and 0 of 2 descriptive lines in
testing. That split is the whole design: named dishes get a real photograph,
descriptive lines get a generated illustration, and the two are labelled
differently in the app because they are different things.

The menu-structuring model decides which kind each line is: it returns
`canonical_name` (the dish's established name in its own script) or `null`. The
test it is given is whether the dish would have its own Wikipedia article, not
whether the name is short.

## The three tiers

Every dish carries an `image_key`, derived by the Worker: a normalised slug of
`canonical_name` when there is one, otherwise the first 16 hex characters of the
SHA-256 of the dish name. The key is what makes each tier below pay off once,
globally, rather than once per scan.

### 1. R2 cache

`DISH_IMAGE_BUCKET` is checked first. A hit returns immediately with no
outbound request. Generated images serve straight from the bucket; a Commons
photograph whose attribution record has been lost is deliberately *not* served
from cache — it is resolved again so the credit comes back with it.

### 2. Wikidata → Wikimedia Commons

Used only when `canonical_name` is not null.

1. `wbsearchentities` with `search=canonical_name` and
   `language=canonical_lang`, five candidates.
2. `wbgetentities` for their claims. A candidate counts as food if `P31`
   (instance of) or `P279` (subclass of) reaches a food class within one parent
   hop, or if `P2012` (cuisine) is present at all — that property only ever
   appears on food.
3. `P18` gives the Commons filename; `Special:FilePath` gives the bytes.
4. Commons `imageinfo` `extmetadata` gives `Artist` and `LicenseShortName`.

The bytes go to R2 and the attribution goes to KV, keyed together.

**Every request to a Wikimedia host sends:**

```
User-Agent: Tavue/0.8.2 (https://tavue.co.uk; jimcai416@gmail.com)
```

This is not politeness. The
[Wikimedia User-Agent policy](https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy)
requires a descriptive agent with a contact address, and unidentified clients
are blocked. Keep the version current and keep the address monitored.

### 3. Cloudflare Workers AI

`@cf/black-forest-labs/flux-1-schnell`, prompted for a plain snapshot rather
than a styled food photograph — ordinary tableware, overhead, indoor
restaurant light, no props and no text. The aim is a picture that reads as
"roughly this, on a plate", not an advertisement.

Butchery vocabulary trips the NSFW filter because it reads as anatomy. On a
safety refusal the prompt is rewritten once (`skin` → `crisp outer surface`,
`breast` → `white meat`, `thigh` → `leg meat`, `flesh` → `meat`, `belly` →
`pork belly cut`, `raw` → `uncooked`, `bloody` → `deep red`) and prefixed with
"Culinary food photograph for a restaurant menu." Whole cuts of pork belly and
chicken thigh are ordinary menu items; this is a required part of the pipeline,
not an edge case.

### 4. Nothing

`resolveDishImage` returns `null`. The app drops the image slot entirely rather
than showing an empty frame: the card becomes a full-width text row and the
detail sheet opens on the dish name.

## Cost and latency

Tiers 2 and 3 only ever run on a cache miss, and a key is resolved once per
scan even when a menu repeats it. A first scan of an unseen menu is therefore
the expensive case: the Commons tier costs two or three Wikimedia requests per
dish, and generation costs one Workers AI inference per dish, which dominates.

Two Worker vars bound it:

- `IMAGE_LOOKUP_CAP` (default 45) — dishes past this get no image at all.
- `IMAGE_BATCH_SIZE` (default 10) — dishes resolved concurrently.

A menu that is mostly descriptive lines will therefore add noticeably more time
to a first scan than one of named dishes. Lower `IMAGE_LOOKUP_CAP` if the wait
matters more than the coverage.

## Attribution obligations

Commons photographs are mostly CC BY or CC BY-SA. Both licences require the
author and the licence to accompany **every** display of the work. A general
statement in a settings screen does not satisfy them.

So, wherever a `source: "commons"` image appears:

- The dish card shows `Author · Licence` beneath the image, tappable.
- The detail sheet shows the same line, tappable, opening the Commons file page.
- The shareable "show the server" card bakes the line into the image itself,
  because that card leaves the app as a picture.

A Commons image that arrives without an author or a licence is not displayed as
a credited photograph. If the attribution record is missing, the image is
re-resolved rather than shown bare.

Generated images carry the opposite obligation — not to be mistaken for the
restaurant's own food. They get a corner marker on the card and a line in the
detail sheet, translated into all nine interface languages:

> Illustration only — the restaurant's dish may look different.

## Complaints, corrections and takedowns

**jimcai416@gmail.com** — the same address published in the Wikimedia
`User-Agent` string, so a rights holder or a Wikimedia administrator who finds
Tavue in a server log reaches a monitored mailbox without having to look
anywhere else. It is also the Worker's `SUPPORT_EMAIL` when that secret is set.

Write to it for:

- an incorrect or missing photo credit
- a photograph that should not be reused, or whose licence Tavue has misread
- a generated illustration that misrepresents a real restaurant's dish
- a request to remove a specific dish image

Handling: acknowledge within five working days. Delete the object from
`DISH_IMAGE_BUCKET` and its `img:` record from KV, which stops that image being
served and prevents the negative-cache path from resurfacing it. Attribution
errors are fixed by deleting the record so the next scan re-resolves the credit
from Commons. Nothing here is a substitute for a formal takedown route once
Tavue is out of beta.
