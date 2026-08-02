import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { API_URL } from "../lib/api";
import { track } from "../lib/analytics";
import { getClientId } from "../lib/identity";
import { captureOperationalError } from "../lib/monitoring";
import { useT } from "../lib/i18n";
import { colors, fonts, radius, space } from "../theme";

const APP_VERSION = "0.6.1";

export default function FeedbackSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const message = text.trim();
    if (!message) return;
    setSending(true);
    try {
      const clientId = await getClientId();
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-carte-client": clientId,
        },
        body: JSON.stringify({
          message,
          meta: `${Platform.OS} ${Platform.Version} · v${APP_VERSION}`,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      void track("feedback_submitted");
      setText("");
      onClose();
      Alert.alert(t("fbThanksTitle"), t("fbThanksBody"));
    } catch (error) {
      captureOperationalError({
        operation: "feedback",
        errorCode: error instanceof Error ? `http_${error.message}` : "unknown",
      });
      Alert.alert(t("fbErrTitle"), t("fbErrBody"));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{t("fbTitle")}</Text>
          <Text style={styles.sub}>{t("fbSub")}</Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder={t("fbPlaceholder")}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            maxLength={2000}
            editable={!sending}
          />
          <View style={styles.row}>
            <Pressable style={styles.cancel} onPress={onClose} disabled={sending}>
              <Text style={styles.cancelText}>{t("fbCancel")}</Text>
            </Pressable>
            <Pressable
              style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>{sending ? t("fbSending") : t("fbSend")}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: space(6),
  },
  sheet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: space(5),
  },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: space(1) },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.image,
    minHeight: 120,
    padding: space(3),
    marginTop: space(4),
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: space(3), marginTop: space(4) },
  cancel: { paddingVertical: space(3), paddingHorizontal: space(4) },
  cancelText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  send: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space(3),
    paddingHorizontal: space(6),
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: colors.onAccent, fontFamily: fonts.bodyBold, fontSize: 15 },
});
