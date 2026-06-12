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
import { colors, fonts, radius, space } from "../theme";

const APP_VERSION = "0.3.0";

export default function FeedbackSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const message = text.trim();
    if (!message) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          meta: `${Platform.OS} ${Platform.Version} · v${APP_VERSION}`,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setText("");
      onClose();
      Alert.alert("Thank you!", "Your report has been sent.");
    } catch {
      Alert.alert(
        "Couldn't send",
        "Check your connection and try again in a moment."
      );
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
          <Text style={styles.title}>Report a bug</Text>
          <Text style={styles.sub}>
            What went wrong? Which menu were you scanning?
          </Text>
          <TextInput
            style={styles.input}
            multiline
            placeholder="e.g. Scanned a Thai menu, prices came back wrong…"
            placeholderTextColor={colors.inkSoft}
            value={text}
            onChangeText={setText}
            maxLength={2000}
            editable={!sending}
          />
          <View style={styles.row}>
            <Pressable style={styles.cancel} onPress={onClose} disabled={sending}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
              onPress={send}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>{sending ? "Sending…" : "Send"}</Text>
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
    backgroundColor: "rgba(34,28,22,0.45)",
    justifyContent: "center",
    padding: space(6),
  },
  sheet: {
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: space(5),
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: space(1),
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.image,
    minHeight: 120,
    padding: space(3),
    marginTop: space(4),
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: space(3),
    marginTop: space(4),
  },
  cancel: { paddingVertical: space(3), paddingHorizontal: space(4) },
  cancelText: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft },
  send: {
    backgroundColor: colors.lacquer,
    borderRadius: radius.pill,
    paddingVertical: space(3),
    paddingHorizontal: space(6),
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: "#FFF", fontFamily: fonts.body, fontSize: 15, fontWeight: "700" },
});
