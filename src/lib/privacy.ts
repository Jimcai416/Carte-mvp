import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform } from "react-native";
import { API_URL } from "./api";

const AI_CONSENT_KEY = "carte.aiProcessingConsent.v1";

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
  if ((await AsyncStorage.getItem(AI_CONSENT_KEY)) === "accepted") return true;

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
