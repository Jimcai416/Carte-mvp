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
import {
  convertedPriceForDish,
  formatMoney,
  parseMoney,
} from "../lib/currency";
import { colors, fonts, radius, space } from "../theme";

// The order list — Carte themed. Same public API as the original:
// OrderLine, orderTotals(), and the <OrderCart/> props.

export interface OrderLine {
  dish: Dish;
  qty: number;
}

export function orderTotals(lines: OrderLine[]): { converted: number } {
  return {
    converted: lines.reduce(
      (sum, line) => sum + parseMoney(convertedPriceForDish(line.dish)) * line.qty,
      0
    ),
  };
}

function lineKey(line: OrderLine): string {
  return [line.dish.category, line.dish.original_name, line.dish.price]
    .filter(Boolean)
    .join("::");
}

export default function OrderCart({
  visible,
  lines,
  displayCurrency,
  showConverted = true,
  onAdd,
  onRemove,
  onClear,
  onClose,
}: {
  visible: boolean;
  lines: OrderLine[];
  displayCurrency: string;
  showConverted?: boolean;
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
            keyExtractor={lineKey}
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
                    {showConverted && convertedPriceForDish(item.dish)
                      ? `  ·  ${convertedPriceForDish(item.dish)}`
                      : ""}
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
              {totals.converted > 0
                ? formatMoney(totals.converted, displayCurrency)
                : "—"}
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
  title: { fontFamily: fonts.display, fontSize: 27, color: colors.text },
  close: { fontSize: 20, color: colors.muted },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(2.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lineName: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.text },
  lineSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: space(2.5) },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 20 },
  qty: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, minWidth: 18, textAlign: "center" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: space(4),
  },
  totalLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
  totalValue: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.accent },
  clearBtn: {
    marginTop: space(4),
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingVertical: space(3),
    alignItems: "center",
  },
  clearText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
