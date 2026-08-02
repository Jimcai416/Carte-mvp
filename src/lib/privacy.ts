import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";
import { API_URL } from "./api";
import { readMigratedValue } from "./storage";

const AI_CONSENT_KEY = "tavue.aiProcessingConsent.v1";
const LEGACY_AI_CONSENT_KEYS = ["carte.aiProcessingConsent.v1"];

type ConsentCopy = {
  title: string;
  body: string;
  cancel: string;
  viewPolicy: string;
  continue: string;
};

export async function ensureAiProcessingConsent(
  copy: ConsentCopy
): Promise<boolean> {
  if (
    (await readMigratedValue(AI_CONSENT_KEY, LEGACY_AI_CONSENT_KEYS)) ===
    "accepted"
  ) {
    return true;
  }

  if (Platform.OS === "web") {
    const accepted = window.confirm(`${copy.title}\n\n${copy.body}`);
    if (accepted) {
      await AsyncStorage.setItem(AI_CONSENT_KEY, "accepted");
    }
    return accepted;
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (accepted: boolean) => {
      if (settled) return;
      settled = true;
      resolve(accepted);
    };

    Alert.alert(
      copy.title,
      copy.body,
      [
        {
          text: copy.cancel,
          style: "cancel",
          onPress: () => finish(false),
        },
        {
          text: copy.viewPolicy,
          onPress: () => {
            Linking.openURL(`${API_URL}/privacy`).catch(() => {});
            finish(false);
          },
        },
        {
          text: copy.continue,
          onPress: () => {
            AsyncStorage.setItem(AI_CONSENT_KEY, "accepted")
              .then(() => finish(true))
              .catch(() => finish(false));
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => finish(false),
      }
    );
  });
}
