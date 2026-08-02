import { Platform } from "react-native";
import { API_URL } from "./api";
import { getClientId } from "./identity";

const APP_VERSION = "0.6.0";

export type AnalyticsEventName =
  | "app_opened"
  | "scan_started"
  | "scan_completed"
  | "scan_failed"
  | "dish_detail_opened"
  | "order_item_added"
  | "order_opened"
  | "order_server_view_opened"
  | "history_menu_reopened"
  | "feedback_submitted";

export interface AnalyticsProperties {
  source?: "camera" | "library" | "history" | "card" | "detail";
  durationMs?: number;
  dishCount?: number;
  errorCode?: string;
}

/**
 * Privacy-safe first-party analytics.
 *
 * The Worker accepts only the event names and properties above. Menu photos,
 * menu text, dish names, prices, free-form strings and device details cannot be
 * sent through this API.
 */
export async function track(
  name: AnalyticsEventName,
  properties: AnalyticsProperties = {}
): Promise<void> {
  try {
    const clientId = await getClientId();
    await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-carte-client": clientId,
      },
      body: JSON.stringify({
        name,
        properties,
        appVersion: APP_VERSION,
        platform: Platform.OS,
      }),
    });
  } catch {
    // Analytics must never interrupt the product flow.
  }
}
