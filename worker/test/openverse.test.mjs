import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { default: worker } = await import(moduleUrl);

const baseDish = {
  category: "Noodles",
  original_category: "Noodles",
  original_name: "Wonton lo mein",
  romanized: null,
  translated_name: "Wonton lo mein",
  description: "Egg noodles with wontons.",
  ingredients: ["noodles", "wontons"],
  price: "12",
  price_gbp: "£12.00",
  converted_price: "£12.00",
  spice_level: 0,
  flags: [],
  worth_it: null,
  image_query: "wonton lo mein noodles",
};

function anthropicResponse() {
  return new Response(
    JSON.stringify({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            cuisine: "Cantonese",
            currency: "GBP",
            display_currency: "GBP",
            menu_language: "English",
            dishes: [baseDish],
          }),
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

async function scanWithResult(result, env = {}) {
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (url.includes("api.anthropic.com")) return anthropicResponse();
    if (url.endsWith("/auth_tokens/token/")) {
      assert.equal(init.method, "POST");
      return Response.json({ access_token: "test-token", expires_in: 3600 });
    }
    if (url.includes("/images/?")) {
      const parsed = new URL(url);
      assert.equal(init.headers.Authorization, "Bearer test-token");
      assert.equal(parsed.searchParams.get("category"), "photograph");
      assert.equal(parsed.searchParams.get("extension"), "jpg,jpeg,png,webp");
      assert.equal(parsed.searchParams.get("filter_dead"), "true");
      assert.equal(parsed.searchParams.get("mature"), "false");
      assert.match(parsed.searchParams.get("q"), /wonton lo mein noodles/);
      return Response.json({ results: [result] });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  const response = await worker.fetch(
    new Request("https://tavue.test/scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tavue-client": "tavue-test-client-123",
      },
      body: JSON.stringify({
        imageBase64: "dGVzdA==",
        mediaType: "image/jpeg",
        targetLanguage: "English",
        targetCurrency: "GBP",
      }),
    }),
    {
      ANTHROPIC_API_KEY: "test",
      OPENVERSE_CLIENT_ID: "client",
      OPENVERSE_CLIENT_SECRET: "secret",
      ...env,
    }
  );

  assert.equal(response.status, 200);
  return response.json();
}

test("uses a CC0 Openverse photograph and returns its rights metadata", async () => {
  const result = await scanWithResult({
    url: "https://images.example.test/wonton.jpg",
    thumbnail: "https://images.example.test/wonton-thumb.jpg",
    foreign_landing_url: "https://source.example.test/wonton",
    creator: "Example Photographer",
    creator_url: "https://source.example.test/photographer",
    license: "cc0",
    license_version: "1.0",
    license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
    attribution: "Wonton by Example Photographer, CC0 1.0",
    mature: false,
  });

  assert.equal(result.dishes[0].image_url, "https://images.example.test/wonton.jpg");
  assert.equal(result.dishes[0].image_provider, "openverse");
  assert.equal(result.dishes[0].image_license, "CC0 1.0");
  assert.equal(
    result.dishes[0].image_source_url,
    "https://source.example.test/wonton"
  );
});

test("rejects CC BY unless it is explicitly enabled", async () => {
  const result = await scanWithResult({
    url: "https://images.example.test/wonton.jpg",
    foreign_landing_url: "https://source.example.test/wonton",
    creator: "Example Photographer",
    creator_url: "https://source.example.test/photographer",
    license: "by",
    license_version: "4.0",
    license_url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "Wonton by Example Photographer, CC BY 4.0",
    mature: false,
  });

  assert.equal(result.dishes[0].image_url, null);
  assert.equal(result.dishes[0].image_provider, undefined);
});

test("accepts CC BY only with a creator when the attribution tier is enabled", async () => {
  const result = await scanWithResult(
    {
      url: "https://images.example.test/wonton.jpg",
      foreign_landing_url: "https://source.example.test/wonton",
      creator: "Example Photographer",
      creator_url: "https://source.example.test/photographer",
      license: "by",
      license_version: "4.0",
      license_url: "https://creativecommons.org/licenses/by/4.0/",
      attribution: "Wonton by Example Photographer, CC BY 4.0",
      mature: false,
    },
    { OPENVERSE_LICENSES: "cc0,pdm,by" }
  );

  assert.equal(result.dishes[0].image_url, "https://images.example.test/wonton.jpg");
  assert.equal(result.dishes[0].image_creator, "Example Photographer");
  assert.equal(result.dishes[0].image_license, "CC BY 4.0");
});
