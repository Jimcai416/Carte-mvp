import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { scanMenu } from "../lib/api";
import {
  FREE_FULL_SCANS,
  getScanCount,
  incrementScanCount,
  isUnlocked,
} from "../lib/scanLimit";
import { ScanResult } from "../types";
import { colors, fonts, radius, space } from "../theme";

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
      const result = await scanMenu(asset.base64!, mediaType);

      const scans = await incrementScanCount();
      const unlocked = await isUnlocked();
      const locked = !unlocked && scans > FREE_FULL_SCANS;

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
      <View style={styles.hero}>
        <Text style={styles.wordmark}>DishLens</Text>
        <Text style={styles.tagline}>
          Point it at any menu.{"\n"}See every dish.
        </Text>
      </View>

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
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
