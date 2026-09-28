import React, { useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, ScrollView, StyleSheet, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { sessionEngine } from "../services/session/sessionEngine";
import { audioAdapter } from "../services/audio/audioAdapter";
import { SESSIONS } from "../data/mock";
import { useAppState } from "../state/AppStateProvider";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { AudioPanel } from "../components/session/AudioPanel";
import { AudioFallbackCard } from "../components/session/AudioFallbackCard";
import { VisualOrb } from "../components/session/VisualOrb";
import { SessionStatusPill } from "../components/session/SessionStatusPill";
import { IconButton } from "../components/ui/IconButton";
import { Button } from "../components/ui/Button";
import { AppText } from "../components/ui/AppText";
import { colors } from "../theme/tokens";
import { formatDuration } from "../utils/date";
import type { SessionState } from "../types/session";

export function ActiveSessionScreen() {
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();
  const { preferences } = useAppState();
  const reduceMotion = useReducedMotion();
  const session = useMemo(
    () => SESSIONS.find((s) => s.id === params.sessionId) ?? SESSIONS[0],
    [params.sessionId],
  );
  const [state, setState] = useState<SessionState>(sessionEngine.getState());
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [visualOnly, setVisualOnly] = useState(false);
  const nativePlayer = useAudioPlayer(
    require("../../assets/sounds/soundscape_hum.wav"),
  );
  const nativeStatus = useAudioPlayerStatus(nativePlayer);

  useEffect(() => sessionEngine.subscribe(setState), []);

  useEffect(() => {
    void sessionEngine.start({
      sessionId: session.id,
      durationSeconds: session.duration * 60,
      audioEnabled:
        preferences.audio.masterVolume > 0 &&
        preferences.audio.selectedTrackId !== "silence",
      visualEnabled: preferences.visual.enabled,
      hapticsEnabled: preferences.hapticsEnabled,
      visualMode: preferences.visual.mode,
      audioVolume: preferences.audio.masterVolume / 100,
    });
  }, [
    session.id,
    session.duration,
    preferences.audio.masterVolume,
    preferences.audio.selectedTrackId,
    preferences.visual.enabled,
    preferences.visual.mode,
    preferences.hapticsEnabled,
  ]);

  useEffect(() => {
    const unsubscribe = audioAdapter.subscribe((snapshot) => {
      setAudioUnavailable(
        snapshot.state === "error" || snapshot.state === "interrupted",
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let active = true;
    const syncNativeAudio = async () => {
      const shouldPlay =
        state.status === "running" &&
        preferences.audio.masterVolume > 0 &&
        preferences.audio.selectedTrackId !== "silence" &&
        !visualOnly;
      try {
        nativePlayer.volume = Math.min(
          1,
          Math.max(0, preferences.audio.masterVolume / 100),
        );
        if (!shouldPlay) {
          nativePlayer.pause();
          return;
        }
        await setAudioModeAsync({ playsInSilentMode: true });
        nativePlayer.play();
        if (active) setAudioUnavailable(false);
      } catch {
        nativePlayer.pause();
        if (active) setAudioUnavailable(true);
      }
    };
    void syncNativeAudio();
    return () => {
      active = false;
      nativePlayer.pause();
    };
  }, [
    nativePlayer,
    preferences.audio.masterVolume,
    preferences.audio.selectedTrackId,
    state.status,
    visualOnly,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (state.status === "running") {
          void sessionEngine.pause();
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [state.status]);

  useEffect(() => {
    if (state.status === "completed") router.replace("/session/complete");
  }, [state.status, router]);

  const toggle = async () => {
    if (state.status === "running") await sessionEngine.pause();
    else if (state.status === "paused" || state.status === "interrupted")
      await sessionEngine.resume();
  };

  const retryAudio = async () => {
    setVisualOnly(false);
    setAudioUnavailable(false);
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      nativePlayer.seekTo(0);
      nativePlayer.play();
    } catch {
      setAudioUnavailable(true);
    }
  };

  const end = () => {
    Alert.alert(
      "End this session?",
      "Your progress can be saved before you leave.",
      [
        { text: "Continue Session", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: async () => {
            await sessionEngine.stop();
            router.replace("/session/complete?stopped=true");
          },
        },
      ],
    );
  };

  const progress = Math.min(1, Math.max(0, state.progress));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon="close"
            label="End session"
            tone="inverse"
            onPress={end}
          />
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText variant="caption" style={{ color: "#CACACE" }}>
              {session.title}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: "#8E8E93", marginTop: 2 }}
            >
              {formatDuration(state.elapsedSeconds)} /{" "}
              {formatDuration(session.duration * 60)}
            </AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.statusLine}>
          <SessionStatusPill status={state.status} />
          <AppText variant="caption" style={{ color: "#8E8E93" }}>
            {Math.round(progress * 100)}%
          </AppText>
        </View>

        <View style={styles.visualStage}>
          {state.visualEnabled ? (
            <VisualOrb
              active={state.status === "running"}
              reducedMotion={
                reduceMotion || preferences.accessibility.reduceMotion
              }
              intensity={preferences.visual.intensity}
              mode={preferences.visual.mode}
            />
          ) : (
            <AppText style={{ color: "#C8C8CC" }}>Visual cue off</AppText>
          )}
          <AppText variant="caption" style={{ color: "#C8C8CC", marginTop: 8 }}>
            {audioUnavailable || visualOnly
              ? "Visual experience continues"
              : nativeStatus.playing
                ? "Audio + visual active"
                : "Audio preparing"}
          </AppText>
        </View>

        <AudioPanel
          title={session.audioTrack === "silence" ? "Silence" : "Soft Focus"}
          elapsed={state.elapsedSeconds}
          total={session.duration * 60}
          progress={progress}
          playing={state.status === "running"}
          unavailable={audioUnavailable && !visualOnly}
          onPlayPause={toggle}
          onOpenSettings={() => router.push("/settings/audio")}
        />

        <View style={styles.actions}>
          <Button
            label={
              state.status === "running" ? "Pause Session" : "Resume Session"
            }
            onPress={toggle}
            style={{ flex: 1 }}
          />
          <Button
            label="End"
            onPress={end}
            variant="secondary"
            style={{ width: 88 }}
          />
        </View>

        {audioUnavailable && !visualOnly ? (
          <View style={{ marginTop: 12 }}>
            <AudioFallbackCard
              onRetry={() => void retryAudio()}
              onContinue={() => setVisualOnly(true)}
            />
            <Button
              label="Back"
              variant="quiet"
              onPress={() => router.back()}
              style={{ marginTop: 8 }}
            />
          </View>
        ) : null}

        {state.status === "interrupted" ? (
          <View style={styles.notice}>
            <AppText variant="bodyStrong">Session interrupted</AppText>
            <AppText variant="caption" muted style={{ marginTop: 4 }}>
              The session paused when the app lost focus.
            </AppText>
          </View>
        ) : null}

        {state.errorMessage ? (
          <View style={styles.notice}>
            <AppText variant="bodyStrong">Audio notice</AppText>
            <AppText variant="caption" muted style={{ marginTop: 4 }}>
              {state.errorMessage}
            </AppText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.graphite },
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center" },
  statusLine: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visualStage: {
    marginVertical: 18,
    minHeight: 280,
    borderRadius: 28,
    backgroundColor: "#222225",
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 16 },
  notice: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#2F2B25",
  },
});
