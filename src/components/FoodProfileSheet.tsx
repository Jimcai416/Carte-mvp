import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  EMPTY_FOOD_PROFILE,
  FoodPreference,
  FoodProfile,
  getFoodProfile,
  saveFoodProfile,
} from "../lib/preferences";
import { colors, fonts, radius, space } from "../theme";

const AVOID: Array<{ id: FoodPreference; label: string }> = [
  { id: "contains_nuts", label: "Nuts" },
  { id: "contains_shellfish", label: "Shellfish" },
  { id: "contains_gluten", label: "Gluten" },
  { id: "contains_dairy", label: "Dairy" },
  { id: "raw", label: "Raw food" },
  { id: "offal", label: "Offal" },
];

const PREFER: Array<{ id: FoodPreference; label: string }> = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "spicy", label: "Spicy food" },
];

export default function FoodProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<FoodProfile>(EMPTY_FOOD_PROFILE);

  useEffect(() => {
    if (visible) void getFoodProfile().then(setProfile);
  }, [visible]);

  function toggle(group: "avoid" | "prefer", id: FoodPreference) {
    setProfile((current) => {
      const active = current[group].includes(id);
      return { ...current, [group]: active ? current[group].filter((item) => item !== id) : [...current[group], id] };
    });
  }

  async function done() {
    await saveFoodProfile(profile);
    onClose();
  }

  function rows(items: typeof AVOID, group: "avoid" | "prefer") {
    return items.map((item) => {
      const active = profile[group].includes(item.id);
      return (
        <Pressable key={item.id} style={[styles.choice, active && styles.choiceActive]} onPress={() => toggle(group, item.id)}>
          <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item.label}</Text>
          <Text style={[styles.check, active && styles.checkActive]}>{active ? "✓" : "+"}</Text>
        </Pressable>
      );
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.eyebrow}>YOUR CARTE</Text>
          <Text style={styles.title}>The way you eat</Text>
          <Text style={styles.subtitle}>We’ll highlight possible matches on every menu. Always confirm allergies with restaurant staff.</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.section}>I NEED TO AVOID</Text>
            <View style={styles.grid}>{rows(AVOID, "avoid")}</View>
            <Text style={styles.section}>I PREFER</Text>
            <View style={styles.grid}>{rows(PREFER, "prefer")}</View>
          </ScrollView>
          <Pressable style={styles.done} onPress={() => void done()}><Text style={styles.doneText}>Save my profile</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  sheet: { maxHeight: "88%", backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: space(5), paddingBottom: space(7) },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong, alignSelf: "center", marginBottom: space(4) },
  eyebrow: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.8, color: colors.accent },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.text, marginTop: space(1) },
  subtitle: { fontFamily: fonts.body, fontSize: 11, lineHeight: 17, color: colors.muted, marginTop: space(1), marginBottom: space(4) },
  section: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.4, color: colors.muted, marginTop: space(3), marginBottom: space(2) },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space(2) },
  choice: { flexDirection: "row", alignItems: "center", gap: space(2), borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.pill, paddingLeft: space(3), paddingRight: space(2), paddingVertical: space(2) },
  choiceActive: { borderColor: colors.accent, backgroundColor: "#FFF2EF" },
  choiceText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text },
  choiceTextActive: { color: colors.accentStrong },
  check: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.mutedSoft },
  checkActive: { color: colors.accent },
  done: { minHeight: 52, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryAction, borderRadius: radius.button, marginTop: space(5) },
  doneText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.onAccent },
});
