import React, { useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import ScanScreen from "./src/screens/ScanScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import PaywallScreen from "./src/screens/PaywallScreen";
import { Screen, ScanResult } from "./src/types";
import { colors } from "./src/theme";

// Deliberately no react-navigation at MVP stage — three screens,
// one state machine, zero native nav dependencies to debug in Expo Go.

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "scan" });
  const [lastResult, setLastResult] = useState<{
    result: ScanResult;
    locked: boolean;
  } | null>(null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {screen.name === "scan" && (
        <ScanScreen
          onResult={(result, locked) => {
            setLastResult({ result, locked });
            setScreen({ name: "results", result, locked });
          }}
        />
      )}

      {screen.name === "results" && (
        <ResultsScreen
          result={screen.result}
          locked={screen.locked}
          onBack={() => setScreen({ name: "scan" })}
          onPaywall={() => setScreen({ name: "paywall" })}
        />
      )}

      {screen.name === "paywall" && (
        <PaywallScreen
          onClose={() =>
            lastResult
              ? setScreen({ name: "results", ...lastResult })
              : setScreen({ name: "scan" })
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
});
