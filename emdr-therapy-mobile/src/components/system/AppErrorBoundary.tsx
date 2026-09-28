import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { colors, spacing } from "../../theme/tokens";

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  State
> {
  state: State = { hasError: false, message: "Something went wrong." };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return {
      hasError: true,
      message:
        error instanceof Error
          ? "The screen could not be displayed."
          : "Something went wrong.",
    };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.warn("[ui-error-boundary]", error);
  }

  reset = () =>
    this.setState({ hasError: false, message: "Something went wrong." });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <View style={styles.icon}>
          <AppText
            style={{ color: colors.danger, fontSize: 22, fontWeight: "800" }}
          >
            !
          </AppText>
        </View>
        <AppText variant="h2" style={{ textAlign: "center" }}>
          {"We couldn't open this screen."}
        </AppText>
        <AppText
          muted
          style={{ textAlign: "center", marginTop: 8, maxWidth: 320 }}
        >
          {this.state.message} Your saved session state is not exposed in this
          error message.
        </AppText>
        <Button
          label="Try Again"
          onPress={this.reset}
          style={{ marginTop: 20, minWidth: 180 }}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dangerPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
