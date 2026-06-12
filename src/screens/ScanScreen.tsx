import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scanMenu } from "../lib/api";
import { incrementScanCount } from "../lib/scanLimit";
import { getHistory, saveScan, describeWhen, SavedScan } from "../lib/history";
import FeedbackSheet from "../components/FeedbackSheet";
import { ScanResult } from "../types";
import { colors, fonts, radius, space } from "../theme";

const LANG_KEY = "dishlens.targetLanguage";

export const LANGUAGES = [
  { code: "English", label: "English" },
  { code: "Chinese (Traditional)", label: "繁體中文" },
  { code: "Chinese (Simplified)", label: "简体中文" },
  { code: "French", label: "Français" },
  { code: "Italian", label: "Italiano" },
  { code: "Spanish", label: "Español" },
  { code: "Japanese", label: "日本語" },
  { code: "Korean", label: "한국어" },
];

const LOADING_LINES = [
  "Reading the menu…",
  "Translating dishes…",
  "Finding photos…",
];

export default function ScanScreen({
  onResult,
}: {
  onResult: (result: ScanResult, locked: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [loadingLine, setLoadingLine] = useState(LOADING_LINES[0]);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [history, setHistory] = useState<SavedScan[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) setLanguage(found);
    });
    getHistory().then(setHistory);
  }, []);

  function chooseLanguage(lang: (typeof LANGUAGES)[number]) {
    setLanguage(lang);
    setShowLangPicker(false);
    AsyncStorage.setItem(LANG_KEY, lang.code).catch(() => {});
  }

  async function pick(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        fromCamera
          ? "Allow camera access to scan a menu."
          : "Allow photo access to choose a menu photo."
      );
      return;
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    };
    const picked = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (picked.canceled || !picked.assets?.[0]?.base64) return;

    setBusy(true);
    const ticker = setInterval(
      () =>
        setLoadingLine(
          LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]
        ),
      2200
    );

    try {
      const asset = picked.assets[0];
      const mediaType = asset.mimeType ?? "image/jpeg";
      const result = await scanMenu(asset.base64!, mediaType, language.code);

      await incrementScanCount();
      saveScan(result, language.code); // fire-and-forget
      // TEST PHASE: paywall disabled — everything free while we validate.
      // To re-enable for launch, restore:
      //   const unlocked = await isUnlocked();
      //   const locked = !unlocked && scans > FREE_FULL_SCANS;
      const locked = false;

      onResult(result, locked);
    } catch (e: any) {
      Alert.alert(
        "Couldn't scan that",
        e?.message ?? "Try a closer, sharper photo with good lighting."
      );
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.lacquer} />
        <Text style={styles.loadingText}>{loadingLine}</Text>
        <Text style={styles.loadingSub}>Usually takes 10–20 seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.langPill}
          onPress={() => setShowLangPicker(true)}
        >
          <Text style={styles.langPillText}>🌐 {language.label}</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.wordmark}>DishLens</Text>
        <Text style={styles.tagline}>
          Point it at any menu.{"\n"}See every dish.
        </Text>
      </View>

      {history.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>Recent menus</Text>
          {history.slice(0, 4).map((s) => (
            <Pressable
              key={s.id}
              style={styles.recentRow}
              onPress={() => onResult(s.result, false)}
            >
              <Text style={styles.recentMain} numberOfLines={1}>
                {s.result.cuisine || "Menu"} · {s.result.dishes.length} dishes
              </Text>
              <Text style={styles.recentWhen}>{describeWhen(s.date)}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={() => pick(true)}>
          <Text style={styles.primaryBtnText}>Scan a menu</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => pick(false)}>
          <Text style={styles.secondaryBtnText}>Choose from photos</Text>
        </Pressable>
        <Text style={styles.footnote}>
          Works best on one menu page at a time, shot straight-on.
        </Text>
        <Pressable onPress={() => setShowFeedback(true)} hitSlop={8}>
          <Text style={styles.bugLink}>Found a bug? Tell us</Text>
        </Pressable>
      </View>

      <FeedbackSheet
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
      />

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLangPicker(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Translate menus into</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(l) => l.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.langRow}
                  onPress={() => chooseLanguage(item)}
                >
                  <Text
                    style={[
                      styles.langRowText,
                      item.code === language.code && styles.langRowActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.code === language.code && (
                    <Text style={styles.langCheck}>✓</Text>
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: space(4),
    paddingTop: space(2),
  },
  langPill: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
  },
  langPillText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(34,28,22,0.45)",
    justifyContent: "center",
    padding: space(8),
  },
  modalSheet: {
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: space(4),
    maxHeight: "70%",
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    marginBottom: space(3),
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  langRowText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  langRowActive: { color: colors.lacquer, fontWeight: "700" },
  langCheck: { color: colors.lacquer, fontSize: 16, fontWeight: "700" },
  recent: {
    paddingHorizontal: space(6),
    paddingBottom: space(2),
  },
  recentTitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.inkSoft,
    marginBottom: space(2),
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: space(3),
  },
  recentMain: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  recentWhen: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  hero: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space(6),
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.lacquer,
    letterSpacing: 1,
    marginBottom: space(3),
  },
  tagline: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 46,
    color: colors.ink,
  },
  actions: { padding: space(6), gap: space(3) },
  primaryBtn: {
    backgroundColor: colors.lacquer,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFF",
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderColor: colors.ink,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "600",
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(1),
  },
  bugLink: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  loading: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: space(4),
  },
  loadingText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
  },
  loadingSub: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
});
