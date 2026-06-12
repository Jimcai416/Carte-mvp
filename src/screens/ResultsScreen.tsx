import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import DishCard from "../components/DishCard";
import OrderSheet from "../components/OrderSheet";
import OrderCart, { OrderLine, orderTotals } from "../components/OrderCart";
import { Dish, ScanResult } from "../types";
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
  const [selected, setSelected] = useState<Dish | null>(null);
  const [order, setOrder] = useState<OrderLine[]>([]);
  const [showCart, setShowCart] = useState(false);

  const count = order.reduce((n, l) => n + l.qty, 0);
  const totals = orderTotals(order);

  function qtyOf(dish: Dish): number {
    return order.find((l) => l.dish.original_name === dish.original_name)?.qty ?? 0;
  }

  function addToOrder(dish: Dish) {
    setOrder((prev) => {
      const i = prev.findIndex((l) => l.dish.original_name === dish.original_name);
      if (i === -1) return [...prev, { dish, qty: 1 }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });
  }

  function removeFromOrder(dish: Dish) {
    setOrder((prev) =>
      prev
        .map((l) =>
          l.dish.original_name === dish.original_name
            ? { ...l, qty: l.qty - 1 }
            : l
        )
        .filter((l) => l.qty > 0)
    );
  }

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
          <DishCard
            dish={item}
            locked={locked}
            onUnlockPress={onPaywall}
            onPress={() => setSelected(item)}
            onAdd={() => addToOrder(item)}
            qty={qtyOf(item)}
          />
        )}
        ListHeaderComponent={
          <Text style={styles.tapHint}>
            Tap a dish for details · tap + to build your order
          </Text>
        }
        ListFooterComponent={<View style={{ height: space(20) }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No dishes found on this page. Try a sharper photo of the food
            section.
          </Text>
        }
      />

      {count > 0 && (
        <Pressable style={styles.cartPill} onPress={() => setShowCart(true)}>
          <Text style={styles.cartPillText}>
            🛒 {count}
            {totals.gbp > 0 ? `  ·  £${totals.gbp.toFixed(2)}` : ""}
          </Text>
        </Pressable>
      )}

      <OrderCart
        visible={showCart}
        lines={order}
        currency={result.currency}
        onAdd={addToOrder}
        onRemove={removeFromOrder}
        onClear={() => {
          setOrder([]);
          setShowCart(false);
        }}
        onClose={() => setShowCart(false)}
      />

      {selected && (
        <OrderSheet dish={selected} onClose={() => setSelected(null)} />
      )}
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
  tapHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: "center",
    marginBottom: space(3),
  },
  cartPill: {
    position: "absolute",
    right: space(4),
    bottom: space(6),
    backgroundColor: colors.lacquer,
    borderRadius: radius.pill,
    paddingHorizontal: space(4.5),
    paddingVertical: space(3),
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cartPillText: {
    color: "#FFF",
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "700",
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(10),
    paddingHorizontal: space(8),
  },
});
