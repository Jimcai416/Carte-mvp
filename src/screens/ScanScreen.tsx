import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { scanMenu } from "../lib/api";
import { incrementScanCount } from "../lib/scanLimit";
import { getHistory, saveScan, describeWhen, SavedScan } from "../lib/history";
import {
  LANGUAGES,
  useT,
  getLanguage,
  getLanguageLabel,
  setLanguage,
  initLanguage,
} from "../lib/i18n";
import FeedbackSheet from "../components/FeedbackSheet";
import { ScanResult } from "../types";
import { colors, fonts, radius, space } from "../theme";

const STAMP_CODES: Record<string, string> = {
  Italian: "IT", French: "FR", Japanese: "JP", Korean: "KR", Spanish: "ES",
  Thai: "TH", Chinese: "CN", Cantonese: "HK", Greek: "GR", Turkish: "TR",
  Vietnamese: "VN", Indian: "IN", Mexican: "MX", Portuguese: "PT", German: "DE",
};

function stampFor(cuisine: string): string {
  const hit = Object.keys(STAMP_CODES).find((k) =>
    (cuisine || "").toLowerCase().includes(k.toLowerCase())
  );
  return hit ? STAMP_CODES[hit] : (cuisine || "??").slice(0, 2).toUpperCase();
}

function Barcode() {
  const widths = [2, 4, 2, 6, 2, 3, 5, 2, 4, 2, 6, 3];
  return (
    <View style={styles.barcode}>
      {widths.map((w, i) => (
        <View key={i} style={{ width: w, height: 24, backgroundColor: colors.gold }} />
      ))}
    </View>
  );
}

export default function ScanScreen({
  onResult,
}: {
  onResult: (result: ScanResult, locked: boolean) => void;
}) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [loadingLine, setLoadingLine] = useState(0);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [history, setHistory] = useState<SavedScan[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const ticketAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initLanguage();
    getHistory().then(setHistory);
    Animated.timing(ticketAnim, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  async function pick(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permTitle"), fromCamera ? t("permCamera") : t("permPhotos"));
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
    const ticker = setInterval(() => setLoadingLine((n) => (n + 1) % 3), 2200);

    try {
      const asset = picked.assets[0];
      const mediaType = asset.mimeType ?? "image/jpeg";
      const result = await scanMenu(asset.base64!, mediaType, getLanguage());

      await incrementScanCount();
      saveScan(result, getLanguage()); // fire-and-forget
      // TEST PHASE: paywall disabled.
      onResult(result, false);
    } catch (e: any) {
      Alert.alert(t("scanErrTitle"), e?.message ?? t("scanErrBody"));
    } finally {
      clearInterval(ticker);
      setBusy(false);
    }
  }

  if (busy) {
    const lines = [t("loading1"), t("loading2"), t("loading3")];
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>{lines[loadingLine]}</Text>
        <Text style={styles.loadingSub}>{t("loadingSub")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>Carte</Text>
        <Pressable style={styles.langPill} onPress={() => setShowLangPicker(true)}>
          <Text style={styles.langPillText}>🌐 {getLanguageLabel()}</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.ticket,
          {
            opacity: ticketAnim,
            transform: [
              {
                translateY: ticketAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.ticketTop}>
          <View style={styles.ticketLabelRow}>
            <Text style={styles.mono}>MENU PASS · {t("menuPassLocal")}</Text>
            <Text style={styles.mono}>№ 0042</Text>
          </View>
          <View style={styles.routeRow}>
            <View>
              <Text style={styles.routeBig}>{t("anyMenu")}</Text>
              <Text style={styles.monoSmall}>ANY MENU</Text>
            </View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.routeBig, { color: colors.gold }]}>
                {getLanguageLabel()}
              </Text>
              <Text style={styles.monoSmall}>YOUR LANGUAGE</Text>
            </View>
          </View>
          <Text style={styles.ticketDesc}>{t("ticketDesc")}</Text>
        </View>

        <View style={styles.perforation}>
          <View style={[styles.notch, { left: -11 }]} />
          <View style={[styles.notch, { right: -11 }]} />
          <View style={styles.stubRow}>
            <Barcode />
            <Text style={styles.mono}>LDN → {t("everywhere")}</Text>
          </View>
        </View>
      </Animated.View>

      {history.length > 0 && (
        <View style={styles.recent}>
          <Text style={styles.recentTitle}>{t("recent")}</Text>
          {history.slice(0, 3).map((s) => (
            <Pressable
              key={s.id}
              style={styles.recentRow}
              onPress={() => onResult(s.result, false)}
            >
              <View style={styles.recentLeft}>
                <View style={styles.stamp}>
                  <Text style={styles.stampText}>{stampFor(s.result.cuisine)}</Text>
                </View>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.recentMain} numberOfLines={1}>
                    {s.result.cuisine || "Menu"} · {s.result.dishes.length} {t("dishesWord")}
                  </Text>
                  <Text style={styles.recentWhen}>{describeWhen(s.date)}</Text>
                </View>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{ flex: 1 }} />

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={() => pick(true)}>
          <Text style={styles.primaryBtnText}>{t("scanMenu")}</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => pick(false)}>
          <Text style={styles.secondaryBtnText}>{t("choosePhotos")}</Text>
        </Pressable>
        <Text style={styles.footnote}>{t("footnote")}</Text>
        <Pressable onPress={() => setShowFeedback(true)} hitSlop={8}>
          <Text style={styles.bugLink}>{t("bugLink")}</Text>
        </Pressable>
      </View>

      <FeedbackSheet visible={showFeedback} onClose={() => setShowFeedback(false)} />

      <Modal
        visible={showLangPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLangPicker(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLangPicker(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("langTitle")}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(l) => l.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.langRow}
                  onPress={() => {
                    setLanguage(item.code);
                    setShowLangPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.langRowText,
                      item.code === getLanguage() && styles.langRowActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.code === getLanguage() && <Text style={styles.langCheck}>✓</Text>}
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
  container: { flex: 1, backgroundColor: colors.night },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space(4),
    paddingTop: space(2),
    marginBottom: space(5),
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 3,
    color: colors.gold,
  },
  langPill: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
  },
  langPillText: { fontFamily: fonts.body, fontSize: 13, fontWeight: "600", color: colors.cream },

  ticket: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    marginHorizontal: space(4),
    overflow: "hidden",
  },
  ticketTop: { padding: space(5), paddingBottom: space(4) },
  ticketLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: space(4) },
  mono: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1.5, color: colors.muted },
  monoSmall: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.muted, marginTop: space(1.5) },
  routeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space(2) },
  routeBig: { fontFamily: fonts.display, fontSize: 29, color: colors.cream },
  routeArrow: { fontSize: 25, color: colors.gold },
  ticketDesc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: space(4) },
  perforation: {
    borderTopWidth: 2,
    borderTopColor: colors.line,
    borderStyle: "dashed",
    position: "relative",
  },
  notch: {
    position: "absolute",
    top: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.night,
  },
  stubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space(5),
    paddingVertical: space(3.5),
  },
  barcode: { flexDirection: "row", alignItems: "flex-end", gap: 2 },

  recent: { paddingHorizontal: space(4), marginTop: space(5) },
  recentTitle: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.muted,
    marginBottom: space(2),
  },
  recentRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card - 2,
    paddingHorizontal: space(3.5),
    paddingVertical: space(2.5),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space(2),
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: space(2.5), flexShrink: 1 },
  stamp: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 6,
    paddingHorizontal: space(1.5),
    paddingVertical: space(0.75),
    transform: [{ rotate: "-4deg" }],
  },
  stampText: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, color: colors.gold },
  recentMain: { fontFamily: fonts.body, fontSize: 14, fontWeight: "500", color: colors.cream },
  recentWhen: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 1 },
  chev: { color: colors.muted, fontSize: 18 },

  actions: { padding: space(4), paddingTop: space(2), gap: space(2.5) },
  primaryBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  primaryBtnText: { color: colors.goldInk, fontFamily: fonts.body, fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    borderColor: colors.lineSoft,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: space(3.5),
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.cream, fontFamily: fonts.body, fontSize: 15, fontWeight: "600" },
  footnote: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: "center" },
  bugLink: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    textDecorationLine: "underline",
  },

  loading: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: "center",
    justifyContent: "center",
    gap: space(4),
  },
  loadingText: { fontFamily: fonts.display, fontSize: 20, color: colors.cream },
  loadingSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: space(8),
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: space(4),
    maxHeight: "70%",
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.cream, marginBottom: space(3) },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  langRowText: { fontFamily: fonts.body, fontSize: 16, color: colors.cream },
  langRowActive: { color: colors.gold, fontWeight: "700" },
  langCheck: { color: colors.gold, fontSize: 16, fontWeight: "700" },
});
