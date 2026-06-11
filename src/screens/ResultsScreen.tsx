import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import DishCard from "../components/DishCard";
import { ScanResult } from "../types";
import { colors, fonts, radius, space } from "../theme";

export default function ResultsScreen({
  result,
  locked,
  onBack,
  onPaywall,
}: {
  result: ScanResult;
  locked: boolean;
  onBack: () => void;
  onPaywall: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ Scan again</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {result.cuisine}
          {result.menu_language ? ` · ${result.menu_language}` : ""}
        </Text>
      </View>

      {locked && (
        <Pressable style={styles.lockBanner} onPress={onPaywall}>
          <Text style={styles.lockText}>
            Free scan used — translations are yours, photos are Pro.{" "}
            <Text style={styles.lockCta}>Unlock</Text>
          </Text>
        </Pressable>
      )}

      <FlatList
        data={result.dishes}
        keyExtractor={(d, i) => `${d.original_name}-${i}`}
        contentContainerStyle={{ paddingVertical: space(4) }}
        renderItem={({ item }) => (
          <DishCard dish={item} locked={locked} onUnlockPress={onPaywall} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No dishes found on this page. Try a sharper photo of the food
            section.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    paddingHorizontal: space(4),
    paddingBottom: space(3),
    gap: space(1),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.lacquer,
    fontWeight: "600",
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
  },
  lockBanner: {
    backgroundColor: colors.lacquerSoft,
    margin: space(4),
    marginBottom: 0,
    borderRadius: radius.card,
    padding: space(3.5),
  },
  lockText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  lockCta: { color: colors.lacquer, fontWeight: "700" },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(10),
    paddingHorizontal: space(8),
  },
});
