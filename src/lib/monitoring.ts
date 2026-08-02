import * as Sentry from "@sentry/react-native";
import { APP_NAME, APP_VERSION } from "../config";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";
const enabled = dsn.length > 0;

Sentry.init({
  dsn,
  enabled,
  release: `${APP_NAME}@${APP_VERSION}`,
  environment: process.env.EXPO_PUBLIC_APP_ENV ?? "production",
  sendDefaultPii: false,
  attachScreenshot: false,
  attachViewHierarchy: false,
  enableNativeCrashHandling: true,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Tavue never sends menu photos, menu text or request bodies to Sentry.
    delete event.user;
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.query_string;
      delete event.request.url;
    }
    return event;
  },
});

type SafeErrorContext = {
  operation: "scan" | "feedback" | "startup";
  errorCode?: string;
  source?: "camera" | "library";
  durationMs?: number;
};

export function captureOperationalError(context: SafeErrorContext): void {
  if (!enabled) return;

  Sentry.withScope((scope) => {
    scope.setTag("operation", context.operation);
    if (context.errorCode) scope.setTag("error_code", context.errorCode);
    if (context.source) scope.setTag("source", context.source);
    if (typeof context.durationMs === "number") {
      scope.setExtra("duration_ms", Math.max(0, Math.round(context.durationMs)));
    }
    Sentry.captureException(new Error(`${context.operation}_failed`));
  });
}

export const withMonitoring = Sentry.wrap;
