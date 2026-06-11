import { ScanResult } from "../types";

// Set this to your deployed Cloudflare Worker URL after `wrangler deploy`,
// e.g. "https://dishlens-api.<your-subdomain>.workers.dev"
export const API_URL = "https://dishlens-api.jimcai416.workers.dev";

export class ScanError extends Error {}

export async function scanMenu(
  base64: string,
  mediaType: string
): Promise<ScanResult> {
  const res = await fetch(`${API_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mediaType }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ScanError(`Scan failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as ScanResult;
  if (!data || !Array.isArray(data.dishes)) {
    throw new ScanError("The scanner couldn't read this menu. Try a closer, sharper photo.");
  }
  return data;
}
