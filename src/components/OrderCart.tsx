import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";
import { Dish } from "../types";
import { colors, fonts, radius, space } from "../theme";

export interface OrderLine {
  dish: Dish;
  qty: number;
}

export function parsePrice(p: string | null): number | null {
  if (!p) return null;
  const cleaned = p.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function orderTotals(lines: OrderLine[]) {
  let orig = 0;
  let gbp = 0;
  let missing = 0;
  for (const { dish, qty } of lines) {
    const o = parsePrice(dish.price);
    const g = parsePrice(dish.price_gbp);
    if (o !== null) orig += o * qty;
    else missing += qty;
    if (g !== null) gbp += g * qty;
  }
  return { orig, gbp, missing };
}

export default function OrderCart({
  visible,
  lines,
  currency,
  onAdd,
  onRemove,
  onClear,
  onClose,
}: {
  visible: boolean;
  lines: OrderLine[];
  currency: string | null;
  onAdd: (dish: Dish) => void;
  onRemove: (dish: Dish) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const totals = orderTotals(lines);
  const count = lines.reduce((n, l) => n + l.qty, 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your order</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Show this to your server 👆</Text>

        <FlatList
          data={lines}
          keyExtractor={(l) => l.dish.original_name}
          contentContainerStyle={{ paddingBottom: space(4) }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.original} numberOfLines={2}>
                  {item.dish.original_name}
                </Text>
                <Text style={styles.translated} numberOfLines={1}>
                  {item.dish.translated_name}
                  {item.dish.price ? `  ·  ${item.dish.price}` : ""}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onRemove(item.dish)}
                  hitSlop={8}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qty}>{item.qty}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => onAdd(item.dish)}
                  hitSlop={8}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Nothing here yet — tap + on a dish to add it.
            </Text>
          }
        />

        {count > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total ({count} item{count === 1 ? "" : "s"})
              </Text>
              <Text style={styles.totalValue}>
                {totals.orig > 0
                  ? `${currency ? currency + " " : ""}${totals.orig.toFixed(2)}`
                  : "—"}
                {totals.gbp > 0 ? `  ·  £${totals.gbp.toFixed(2)}` : ""}
              </Text>
            </View>
            {totals.missing > 0 && (
              <Text style={styles.missingNote}>
                {totals.missing} item{totals.missing === 1 ? "" : "s"} without a
                printed price not included.
              </Text>
            )}
            <Pressable onPress={onClear}>
              <Text style={styles.clear}>Clear order</Text>
            </Pressable>
          </View>
        )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  close: { fontSize: 24, color: colors.inkSoft, padding: space(1) },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: space(1),
    marginBottom: space(4),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowText: { flex: 1 },
  original: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  translated: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: space(0.5),
  },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: space(2.5) },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.lacquer,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    color: colors.lacquer,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  qty: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    minWidth: 18,
    textAlign: "center",
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(10),
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: space(4),
    gap: space(2),
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft },
  totalValue: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  missingNote: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  clear: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.lacquer,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: space(2),
  },
});
