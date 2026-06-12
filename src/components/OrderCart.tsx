import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { Dish } from "../types";
import { useT } from "../lib/i18n";
import { colors, fonts, radius, space } from "../theme";

// The order list — Carte themed. Same public API as the original:
// OrderLine, orderTotals(), and the <OrderCart/> props.

export interface OrderLine {
  dish: Dish;
  qty: number;
}

function parseGbp(price_gbp: string | null): number {
  if (!price_gbp) return 0;
  const n = parseFloat(price_gbp.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function orderTotals(lines: OrderLine[]): { gbp: number } {
  return {
    gbp: lines.reduce((sum, l) => sum + parseGbp(l.dish.price_gbp) * l.qty, 0),
  };
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
  const t = useT();
  const totals = orderTotals(lines);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t("orderTitle")}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <FlatList
            data={lines}
            keyExtractor={(l) => l.dish.original_name}
            style={{ flexGrow: 0 }}
            renderItem={({ item }) => (
              <View style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {item.dish.original_name}
                  </Text>
                  <Text style={styles.lineSub} numberOfLines={1}>
                    {item.dish.translated_name}
                    {item.dish.price ? `  ·  ${item.dish.price}` : ""}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable onPress={() => onRemove(item.dish)} hitSlop={8} style={styles.stepBtn}>
                    <Text style={styles.stepText}>−</Text>
                  </Pressable>
                  <Text style={styles.qty}>{item.qty}</Text>
                  <Pressable onPress={() => onAdd(item.dish)} hitSlop={8} style={styles.stepBtn}>
                    <Text style={styles.stepText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("totalWord")}</Text>
            <Text style={styles.totalValue}>
              {totals.gbp > 0 ? `£${totals.gbp.toFixed(2)}` : "—"}
            </Text>
          </View>

          <Pressable style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearText}>{t("orderClear")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card + 6,
    borderTopRightRadius: radius.card + 6,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(5),
    paddingBottom: space(8),
    maxHeight: "75%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: space(3),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space(3),
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.cream },
  close: { fontSize: 20, color: colors.muted },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lineName: { fontFamily: fonts.display, fontSize: 17, color: colors.cream },
  lineSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: space(2.5) },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.gold, fontSize: 17, fontWeight: "700", lineHeight: 20 },
  qty: { fontFamily: fonts.body, fontSize: 15, fontWeight: "700", color: colors.cream, minWidth: 18, textAlign: "center" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: space(4),
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  totalValue: { fontFamily: fonts.body, fontSize: 18, fontWeight: "700", color: colors.gold },
  clearBtn: {
    marginTop: space(4),
    borderWidth: 1.5,
    borderColor: colors.lineSoft,
    borderRadius: radius.pill,
    paddingVertical: space(3),
    alignItems: "center",
  },
  clearText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
