import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { setUnlocked, resetForTesting } from "../lib/scanLimit";
import { colors, fonts, radius, space } from "../theme";

// MVP test-build paywall. No real purchases yet — "Continue" simply flips
// the local unlock flag so you can demo the full flow end to end.
// Before launch: replace with RevenueCat offerings + Superwall.

export default function PaywallScreen({ onClose }: { onClose: () => void }) {
  async function unlock() {
    await setUnlocked(true);
    Alert.alert("Unlocked", "Pro is on for this device (test mode).");
    onClose();
  }

  async function reset() {
    await resetForTesting();
    Alert.alert("Reset", "Scan count and unlock cleared.");
    onClose();
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={onClose} hitSlop={12}>
        <Text style={styles.close}>✕</Text>
      </Pressable>

      <Text style={styles.title}>Never order blind again</Text>
      <Text style={styles.sub}>
        Unlimited scans, every dish with a photo, ordering advice included.
      </Text>

      <View style={styles.plans}>
        <Pressable style={[styles.plan, styles.planFeatured]} onPress={unlock}>
          <Text style={styles.planBadge}>Most popular</Text>
          <Text style={styles.planName}>Travel Pass — 1 week</Text>
          <Text style={styles.planPrice}>£9.99 one-off</Text>
        </Pressable>

        <Pressable style={styles.plan} onPress={unlock}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>£5.99 / month</Text>
        </Pressable>

        <Pressable style={styles.plan} onPress={unlock}>
          <Text style={styles.planName}>Yearly</Text>
          <Text style={styles.planPrice}>£29.99 / year</Text>
        </Pressable>
      </View>

      <Pressable onPress={reset}>
        <Text style={styles.devReset}>Dev: reset scan count + unlock</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    padding: space(6),
  },
  close: {
    fontSize: 22,
    color: colors.inkSoft,
    alignSelf: "flex-end",
    padding: space(2),
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    marginTop: space(4),
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
    marginTop: space(3),
  },
  plans: { marginTop: space(8), gap: space(3) },
  plan: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: space(4),
    backgroundColor: colors.card,
  },
  planFeatured: { borderColor: colors.lacquer },
  planBadge: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: "700",
    color: colors.lacquer,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: space(1),
  },
  planName: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  planPrice: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: space(0.5),
  },
  devReset: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: "center",
    marginTop: space(8),
    textDecorationLine: "underline",
  },
});
