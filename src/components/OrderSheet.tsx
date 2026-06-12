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
import { colors, fonts, radius, space } from "../theme";

// Full-screen "show this to your server" sheet.
// Share exports the card as an image — requires two optional packages:
//   npx expo install react-native-view-shot expo-sharing
// Without them the screen still works; only the Share button explains itself.

export default function OrderSheet({
  dish,
  onClose,
}: {
  dish: Dish | null;
  onClose: () => void;
}) {
  const cardRef = useRef<View>(null);

  async function share() {
    try {
      // Loaded lazily so the app runs even before these are installed.
      const { captureRef } = require("react-native-view-shot");
      const Sharing = require("expo-sharing");
      const uri = await captureRef(cardRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Sharing unavailable", "This device can't open the share sheet.");
      }
    } catch {
      Alert.alert(
        "One-time setup needed",
        "In the project folder run:\n\nnpx expo install react-native-view-shot expo-sharing\n\nthen restart the app."
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
            <Image
              source={{ uri: dish.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}

          <Text
            style={styles.original}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.4}
          >
            {dish.original_name}
          </Text>

          {dish.romanized ? (
            <Text style={styles.romanized}>{dish.romanized}</Text>
          ) : null}

          <Text style={styles.translated}>{dish.translated_name}</Text>

          {dish.price ? (
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>
                {dish.price}
                {dish.price_gbp ? `  ·  ${dish.price_gbp}` : ""}
              </Text>
            </View>
          ) : null}

          <Text style={styles.wordmark}>DishLens</Text>
        </View>

        <Text style={styles.hint}>Show this to your server 👆</Text>

        <View style={styles.buttons}>
          <Pressable style={styles.shareBtn} onPress={share}>
            <Text style={styles.shareBtnText}>Share as image</Text>
          </Pressable>
          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: space(5),
    paddingTop: space(14),
  },
  closeWrap: { position: "absolute", top: space(14), right: space(5), zIndex: 2 },
  close: { fontSize: 24, color: colors.inkSoft },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(6),
    alignItems: "center",
    marginTop: space(4),
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: radius.image,
    marginBottom: space(5),
    backgroundColor: colors.flagBg,
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
    color: colors.inkSoft,
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
    backgroundColor: colors.lacquer,
    borderRadius: radius.pill,
    paddingHorizontal: space(4),
    paddingVertical: space(1.5),
    marginTop: space(4),
  },
  priceText: { color: "#FFF", fontFamily: fonts.body, fontSize: 15, fontWeight: "700" },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.lacquer,
    marginTop: space(5),
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(4),
  },
  buttons: { marginTop: "auto", gap: space(3) },
  shareBtn: {
    backgroundColor: colors.lacquer,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  shareBtnText: { color: "#FFF", fontFamily: fonts.body, fontSize: 16, fontWeight: "700" },
  doneBtn: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingVertical: space(4),
    alignItems: "center",
  },
  doneBtnText: { color: colors.ink, fontFamily: fonts.body, fontSize: 16, fontWeight: "600" },
});
