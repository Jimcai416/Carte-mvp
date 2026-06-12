import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { Dish } from "../types";
import { useT } from "../lib/i18n";
import { colors, fonts, radius, space } from "../theme";

// "Order this" chit. The screen is midnight; the captured card stays light
// paper so it pops when shared into bright chat threads.
// Share requires: npx expo install react-native-view-shot expo-sharing

export default function OrderSheet({
  dish,
  onClose,
}: {
  dish: Dish | null;
  onClose: () => void;
}) {
  const t = useT();
  const cardRef = useRef<View>(null);

  async function share() {
    try {
      const { captureRef } = require("react-native-view-shot");
      const Sharing = require("expo-sharing");
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      Alert.alert(
        "One-time setup needed",
        "Run: npx expo install react-native-view-shot expo-sharing, then restart."
      );
    }
  }

  if (!dish) return null;

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeWrap}>
          <Text style={styles.close}>✕</Text>
        </Pressable>

        <View style={styles.card} ref={cardRef} collapsable={false}>
          {dish.image_url ? (
            <Image source={{ uri: dish.image_url }} style={styles.image} resizeMode="cover" />
          ) : null}

          <Text
            style={styles.original}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
          >
            {dish.original_name}
          </Text>

          {dish.romanized ? <Text style={styles.romanized}>{dish.romanized}</Text> : null}

          <Text style={styles.translated}>{dish.translated_name}</Text>

          {dish.price ? (
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>
                {dish.price}
                {dish.price_gbp ? `  ·  ${dish.price_gbp}` : ""}
              </Text>
            </View>
          ) : null}

          <Text style={styles.wordmark}>Carte</Text>
        </View>

        <Text style={styles.hint}>{t("orderHint")}</Text>

        <View style={styles.buttons}>
          <Pressable style={styles.shareBtn} onPress={share}>
            <Text style={styles.shareBtnText}>{t("shareImage")}</Text>
          </Pressable>
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>{t("done")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night,
    padding: space(5),
    paddingTop: space(14),
  },
  closeWrap: { position: "absolute", top: space(14), right: space(5), zIndex: 2 },
  close: { fontSize: 24, color: colors.muted },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.card,
    padding: space(6),
    alignItems: "center",
    marginTop: space(4),
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: radius.image,
    marginBottom: space(5),
    backgroundColor: colors.paperLine,
  },
  original: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 74,
    color: colors.ink,
    textAlign: "center",
  },
  romanized: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontStyle: "italic",
    color: "#6E6257",
    marginTop: space(2),
    textAlign: "center",
  },
  translated: {
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: "600",
    color: colors.ink,
    marginTop: space(3),
    textAlign: "center",
  },
  pricePill: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: space(4),
    paddingVertical: space(1.5),
    marginTop: space(4),
  },
  priceText: { color: colors.goldInk, fontFamily: fonts.body, fontSize: 15, fontWeight: "700" },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 3,
    color: colors.gold,
    marginTop: space(5),
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginTop: space(4),
  },
  buttons: { marginTop: "auto", gap: space(3) },
  shareBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  shareBtnText: { color: colors.goldInk, fontFamily: fonts.body, fontSize: 16, fontWeight: "700" },
  doneBtn: {
    borderWidth: 1.5,
    borderColor: colors.lineSoft,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  doneBtnText: { color: colors.cream, fontFamily: fonts.body, fontSize: 16, fontWeight: "600" },
});
