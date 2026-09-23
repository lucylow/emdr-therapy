import { ThemedView } from "@/components/themed-view";
import { consumeOAuthState } from "@/constants/oauth";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CallbackParams = { code?: string; state?: string; error?: string };

function getCallbackParams(
  url: string | null,
  initial: CallbackParams,
): CallbackParams {
  if (initial.code || initial.state || initial.error || !url) return initial;
  try {
    const parsed = new URL(url);
    return {
      code: parsed.searchParams.get("code") ?? undefined,
      state: parsed.searchParams.get("state") ?? undefined,
      error: parsed.searchParams.get("error") ?? undefined,
    };
  } catch {
    return {};
  }
}

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<CallbackParams>();
  const { code, error: callbackError, state } = params;
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const handleCallback = async () => {
      try {
        const initialUrl =
          code || state || callbackError ? null : await Linking.getInitialURL();
        const callback = getCallbackParams(initialUrl, {
          code,
          state,
          error: callbackError,
        });
        if (callback.error)
          throw new Error("Authorization was cancelled or declined.");
        if (!callback.code || !callback.state)
          throw new Error(
            "The authentication response was incomplete. Please try signing in again.",
          );
        if (!(await consumeOAuthState(callback.state))) {
          throw new Error(
            "The authentication response could not be verified. Please sign in again.",
          );
        }

        const result = await Api.exchangeOAuthCode(
          callback.code,
          callback.state,
        );
        await Auth.setSessionToken(result.sessionToken);
        if (result.user && typeof result.user === "object") {
          const user = result.user as Partial<Auth.User>;
          if (typeof user.openId === "string") {
            await Auth.setUserInfo({
              id: typeof user.id === "number" ? user.id : 0,
              openId: user.openId,
              name: typeof user.name === "string" ? user.name : null,
              email: typeof user.email === "string" ? user.email : null,
              loginMethod:
                typeof user.loginMethod === "string" ? user.loginMethod : null,
              lastSignedIn: user.lastSignedIn
                ? new Date(user.lastSignedIn)
                : new Date(),
            });
          }
        }
        if (cancelled) return;
        setStatus("success");
        router.replace("/(tabs)");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Authentication could not be completed. Please try again.",
        );
      }
    };
    void handleCallback();
    return () => {
      cancelled = true;
    };
  }, [callbackError, code, router, state]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication…
            </Text>
          </>
        )}
        {status === "success" && (
          <Text className="text-base leading-6 text-center text-foreground">
            Authentication complete.
          </Text>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to the app home screen"
              className="mt-4 rounded-xl bg-primary px-5 py-3"
              onPress={() => router.replace("/(tabs)")}
            >
              <Text className="font-semibold text-background">
                Return to app
              </Text>
            </Pressable>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
