import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { storage, STORAGE_KEYS } from "../services/storage/storage";
import { colors } from "../theme/tokens";
import { AppText } from "../components/ui/AppText";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";

export function StartupScreen() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const complete = await storage.get<boolean>(
          STORAGE_KEYS.onboardingComplete,
        );
        if (!active) return;
        router.replace(complete ? "/home" : "/onboarding");
      } catch {
        if (active) setError(true);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <View style={styles.center}>
        <AppText variant="h2" style={{ textAlign: "center" }}>
          Welcome to EMDR Flow AI
        </AppText>
        <AppText
          muted
          style={{ textAlign: "center", marginTop: 8, maxWidth: 300 }}
        >
          The app could not read local setup state. You can continue to
          onboarding.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.logo}>
        <AppText
          style={{ color: colors.white, fontSize: 26, fontWeight: "800" }}
        >
          E
        </AppText>
      </View>
      <AppText variant="h1" style={{ marginTop: 16 }}>
        EMDR Flow AI
      </AppText>
      <AppText muted style={{ marginTop: 6 }}>
        Preparing your personal space…
      </AppText>
      <View style={{ marginTop: 24, width: 180 }}>
        <LoadingSkeleton width={180} height={8} radius={4} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
});
