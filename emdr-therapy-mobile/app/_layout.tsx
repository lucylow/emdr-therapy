import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/app-error-boundary";
import "@/lib/_core/nativewind-pressable";
import {
  initManusRuntime,
  subscribeSafeAreaInsets,
} from "@/lib/_core/manus-runtime";
import { PreferencesProvider } from "@/lib/preferences-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { ThemeProvider } from "@/lib/theme-provider";
import { createTRPCClient, trpc } from "@/lib/trpc";
import { AppStateProvider } from "@/src/state/AppStateProvider";
import { colors } from "@/src/theme/tokens";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;
  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    return subscribeSafeAreaInsets(handleSafeAreaUpdate);
  }, [handleSafeAreaUpdate]);

  const providerInitialMetrics = useMemo(
    () => ({
      ...(initialWindowMetrics ?? {
        insets: initialInsets,
        frame: initialFrame,
      }),
      insets: {
        ...(initialWindowMetrics?.insets ?? initialInsets),
        top: Math.max((initialWindowMetrics?.insets ?? initialInsets).top, 16),
        bottom: Math.max(
          (initialWindowMetrics?.insets ?? initialInsets).bottom,
          12,
        ),
      },
    }),
    [initialFrame, initialInsets],
  );

  const app = (
    <AppStateProvider>
      <AppErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  contentStyle: { backgroundColor: colors.ivory },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="oauth/callback" />
              </Stack>
              <StatusBar style="dark" />
            </QueryClientProvider>
          </trpc.Provider>
        </GestureHandlerRootView>
      </AppErrorBoundary>
    </AppStateProvider>
  );

  const providers = (
    <ThemeProvider>
      <PreferencesProvider>
        <SubscriptionProvider>{app}</SubscriptionProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );

  if (Platform.OS === "web") {
    return (
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        <SafeAreaFrameContext.Provider value={frame}>
          <SafeAreaInsetsContext.Provider value={insets}>
            {providers}
          </SafeAreaInsetsContext.Provider>
        </SafeAreaFrameContext.Provider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={providerInitialMetrics}>
      {providers}
    </SafeAreaProvider>
  );
}
