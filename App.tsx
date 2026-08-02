import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { CormorantGaramond_500Medium } from "@expo-google-fonts/cormorant-garamond/500Medium";
import { CormorantGaramond_600SemiBold } from "@expo-google-fonts/cormorant-garamond/600SemiBold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { DMSans_700Bold } from "@expo-google-fonts/dm-sans/700Bold";
import ScanScreen from "./src/screens/ScanScreen";
import ResultsScreen from "./src/screens/ResultsScreen";
import { Screen, ScanResult } from "./src/types";
import { colors } from "./src/theme";
import { AmbientBackdrop } from "./src/components/GlassSurface";
import { track } from "./src/lib/analytics";
import { withMonitoring } from "./src/lib/monitoring";

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "scan" });
  const [fontsLoaded] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    void track("app_opened");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (viewport && !viewport.content.includes("viewport-fit=cover")) {
      viewport.content = `${viewport.content}, viewport-fit=cover`;
    }

    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    document.documentElement.style.overscrollBehaviorY = "none";
    document.body.style.overscrollBehaviorY = "none";
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.fontLoading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={[styles.canvas, Platform.OS === "web" && styles.webCanvas]}>
        <View style={[styles.root, Platform.OS === "web" && styles.webRoot]}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />
          <AmbientBackdrop />

          {screen.name === "scan" && (
            <ScanScreen
              onResult={(result: ScanResult) =>
                setScreen({ name: "results", result })
              }
            />
          )}

          {screen.name === "results" && (
            <ResultsScreen
              result={screen.result}
              onBack={() => setScreen({ name: "scan" })}
            />
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

export default withMonitoring(App);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  canvas: {
    flex: 1,
    backgroundColor: "#EDE6DF",
    alignItems: "center",
  },
  webCanvas: {
    backgroundColor: colors.background,
  },
  webRoot: {
    width: "100%",
    maxWidth: 640,
    shadowColor: "#50352F",
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
  },
  fontLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
