import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Prevents an uncaught render error from leaving the user at a blank screen.
 * Error details are intentionally kept out of production UI and logs because
 * this application can display sensitive wellness notes.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.warn("[app] recovered from a render error", error.name);
    }
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        <View accessibilityRole="alert" style={styles.card}>
          <Text style={styles.title}>The screen needs to restart</Text>
          <Text style={styles.body}>
            Your local information has not been sent anywhere. Try reopening
            this screen. If this repeats, close and reopen the app.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try reopening the screen"
            onPress={this.retry}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAF9" },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  title: {
    color: "#14211F",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    color: "#35514B",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 420,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#194B43",
    borderRadius: 12,
    marginTop: 24,
    minHeight: 48,
    minWidth: 148,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
