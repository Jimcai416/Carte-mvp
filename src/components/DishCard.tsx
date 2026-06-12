import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Dish } from "../types";
import { colors, fonts, radius, space } from "../theme";

const FLAG_LABELS: Record<string, string> = {
  spicy: "Spicy",
  raw: "Raw",
  offal: "Offal",
  contains_nuts: "Nuts",
  contains_shellfish: "Shellfish",
  contains_gluten: "Gluten",
  contains_dairy: "Dairy",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  house_special: "House special",
};

function Chillies({ level }: { level: number }) {
  if (!level) return null;
  return <Text style={styles.chilli}>{"🌶".repeat(level)}</Text>;
}

export default function DishCard({
  dish,
  locked,
  onUnlockPress,
  onPress,
  onAdd,
  qty = 0,
}: {
  dish: Dish;
  locked: boolean;
  onUnlockPress: () => void;
  onPress?: () => void;
  onAdd?: () => void;
  qty?: number;
}) {
  const hasImage = !!dish.image_url;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        {hasImage ? (
          <Image
            source={{ uri: dish.image_url! }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderGlyph}>
              {dish.original_name.slice(0, 1)}
            </Text>
          </View>
        )}

        {locked && (
          <Pressable style={StyleSheet.absoluteFill} onPress={onUnlockPress}>
            <BlurView intensity={45} tint="light" style={styles.blur}>
              <Text style={styles.blurLabel}>Unlock photos</Text>
            </BlurView>
          </Pressable>
        )}

        {dish.price && (
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>
              {dish.price}
              {dish.price_gbp ? `  ·  ${dish.price_gbp}` : ""}
            </Text>
          </View>
        )}

        {onAdd && (
          <Pressable
            style={[styles.addBtn, qty > 0 && styles.addBtnActive]}
            onPress={onAdd}
            hitSlop={8}
          >
            <Text
              style={[styles.addBtnText, qty > 0 && styles.addBtnTextActive]}
            >
              {qty > 0 ? `${qty} ✓` : "+"}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.originalName}>{dish.original_name}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.translatedName}>{dish.translated_name}</Text>
          <Chillies level={dish.spice_level} />
        </View>
        {dish.romanized ? (
          <Text style={styles.romanized}>{dish.romanized}</Text>
        ) : null}

        <Text style={styles.description}>{dish.description}</Text>

        {dish.worth_it ? (
          <Text style={styles.worthIt}>“{dish.worth_it}”</Text>
        ) : null}

        {dish.flags.length > 0 && (
          <View style={styles.flagRow}>
            {dish.flags.map((f) => (
              <View key={f} style={styles.flag}>
                <Text style={styles.flagText}>{FLAG_LABELS[f] ?? f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    marginHorizontal: space(4),
    marginBottom: space(4),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
  },
  imageWrap: {
    height: 180,
    backgroundColor: colors.flagBg,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.flagBg,
  },
  placeholderGlyph: {
    fontFamily: fonts.display,
    fontSize: 64,
    color: colors.inkSoft,
  },
  blur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  blurLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    backgroundColor: colors.paper,
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  priceTag: {
    position: "absolute",
    left: space(2.5),
    bottom: space(2.5),
    backgroundColor: colors.lacquer,
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
    borderRadius: radius.pill,
  },
  addBtn: {
    position: "absolute",
    right: space(2.5),
    bottom: space(2.5),
    minWidth: 42,
    height: 42,
    paddingHorizontal: space(2),
    borderRadius: 21,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.lacquer,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addBtnActive: { backgroundColor: colors.lacquer },
  addBtnText: {
    color: colors.lacquer,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
  addBtnTextActive: { color: "#FFF", fontSize: 15 },
  priceText: {
    color: "#FFF",
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: "700",
  },
  body: { padding: space(4) },
  originalName: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    marginBottom: space(0.5),
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space(2) },
  translatedName: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  chilli: { fontSize: 13 },
  romanized: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    fontStyle: "italic",
    marginTop: space(0.5),
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkSoft,
    marginTop: space(2),
  },
  worthIt: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.jade,
    marginTop: space(2),
  },
  flagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1.5),
    marginTop: space(3),
  },
  flag: {
    backgroundColor: colors.flagBg,
    borderRadius: radius.pill,
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
  },
  flagText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
});
