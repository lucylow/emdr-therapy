import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { ScreenContainer } from "@/components/screen-container";
import { AudioStatusCard } from "@/components/audio-status-card";
import { BilateralMark, DS } from "@/components/ui/design-system";
import { getAudioStatusCardModel } from "@/lib/audio-status-card";
import { getBlsToggleAccessibilityLabel } from "@/lib/bls-accessibility";
import {
  BLS_AUDIO_VOLUMES,
  BLS_SOUNDSCAPE_OPTIONS,
  getBlsAudioVolumeLabel,
  getBlsCueIntervalMs,
  getBlsSoundscapeLabel,
  isBlsAudioVolume,
  isBlsSoundscape,
  type BlsAudioVolume,
  type BlsSoundscape,
} from "@/lib/bls-audio";
import { haptic } from "@/lib/haptics";
import { normalizeSessionParams } from "@/lib/session-flow";
import {
  appendTelemetryEvent,
  getPreferences,
  getTelemetryWithStatus,
  savePreferences,
  saveTelemetry,
  updateTelemetryProgress,
} from "@/lib/session-store";

export default function BLSScreen() {
  const rawParams = useLocalSearchParams() as Record<
    string,
    string | string[] | undefined
  >;
  const params = useMemo(
    () =>
      normalizeSessionParams(
        Object.fromEntries(
          Object.entries(rawParams).map(([key, value]) => [
            key,
            Array.isArray(value) ? value[0] : value,
          ]),
        ),
      ),
    [rawParams],
  );
  const sessionId = useRef(
    params.sessionId ?? `training_${Date.now()}`,
  ).current;
  const [running, setRunning] = useState(params.resume !== "true");
  const [seconds, setSeconds] = useState(Number(params.elapsedSeconds));
  const [audioOn, setAudioOn] = useState(params.audioOn === "true");
  const [hapticsOn, setHapticsOn] = useState(params.hapticsOn === "true");
  const [speed, setSpeed] = useState<1 | 2 | 3>(
    Number(params.speed) as 1 | 2 | 3,
  );
  const [audioVolume, setAudioVolume] = useState<BlsAudioVolume>(0.45);
  const [soundscape, setSoundscape] = useState<BlsSoundscape>("none");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [audioRetrying, setAudioRetrying] = useState(false);
  const [ending, setEnding] = useState(false);
  const [telemetryReady, setTelemetryReady] = useState(false);
  const x = useRef(new Animated.Value(0)).current;

  const leftPlayer = useAudioPlayer(
    require("../../assets/sounds/cue_left.wav"),
  );
  const rightPlayer = useAudioPlayer(
    require("../../assets/sounds/cue_right.wav"),
  );
  const rainPlayer = useAudioPlayer(
    require("../../assets/sounds/soundscape_rain.wav"),
  );
  const humPlayer = useAudioPlayer(
    require("../../assets/sounds/soundscape_hum.wav"),
  );
  const leftStatus = useAudioPlayerStatus(leftPlayer);
  const rightStatus = useAudioPlayerStatus(rightPlayer);
  const rainStatus = useAudioPlayerStatus(rainPlayer);
  const humStatus = useAudioPlayerStatus(humPlayer);
  const audioPlaying = leftStatus.playing || rightStatus.playing;
  const audioPreparing =
    leftStatus.isBuffering ||
    rightStatus.isBuffering ||
    rainStatus.isBuffering ||
    humStatus.isBuffering;
  const audioReady = leftStatus.isLoaded && rightStatus.isLoaded;
  const audioInterrupted =
    audioOn &&
    !audioUnavailable &&
    !audioPlaying &&
    !audioPreparing &&
    Boolean(
      leftStatus.reasonForWaitingToPlay ||
      rightStatus.reasonForWaitingToPlay ||
      rainStatus.reasonForWaitingToPlay ||
      humStatus.reasonForWaitingToPlay,
    );

  const stopNativeStimulation = useCallback(() => {
    setRunning(false);
    x.stopAnimation();
    x.setValue(0);
    try {
      leftPlayer.pause();
      rightPlayer.pause();
      rainPlayer.pause();
      humPlayer.pause();
    } catch (error) {
      if (__DEV__)
        console.warn(
          "[bls] could not pause stimulation",
          error instanceof Error ? error.name : "unknown",
        );
    }
  }, [humPlayer, leftPlayer, rainPlayer, rightPlayer, x]);

  useEffect(() => {
    leftPlayer.volume = audioVolume;
    rightPlayer.volume = audioVolume;
    rainPlayer.volume =
      soundscape === "none" ? 0 : Math.min(audioVolume * 0.2, 0.12);
    humPlayer.volume =
      soundscape === "none" ? 0 : Math.min(audioVolume * 0.2, 0.12);
  }, [audioVolume, humPlayer, leftPlayer, rainPlayer, rightPlayer, soundscape]);

  useFocusEffect(
    useCallback(() => {
      void getPreferences().then((preferences) => {
        setReducedMotion(preferences.reducedMotion);
        if (isBlsAudioVolume(preferences.blsAudioVolume ?? -1))
          setAudioVolume(preferences.blsAudioVolume as BlsAudioVolume);
        if (isBlsSoundscape(preferences.blsSoundscape))
          setSoundscape(preferences.blsSoundscape);
      });
      return stopNativeStimulation;
    }, [stopNativeStimulation]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") stopNativeStimulation();
    });
    return () => subscription.remove();
  }, [stopNativeStimulation]);

  const retryAudio = async () => {
    if (audioRetrying) return;
    setAudioRetrying(true);
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      leftPlayer.volume = audioVolume;
      rightPlayer.volume = audioVolume;
      leftPlayer.seekTo(0);
      leftPlayer.play();
      setAudioUnavailable(false);
      setAudioOn(true);
    } catch (error) {
      if (__DEV__)
        console.warn(
          "[bls] audio retry failed",
          error instanceof Error ? error.name : "unknown",
        );
      setAudioUnavailable(true);
      setAudioOn(false);
    } finally {
      setAudioRetrying(false);
    }
  };

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        try {
          await setAudioModeAsync({ playsInSilentMode: true });
        } catch {
          if (active) setAudioUnavailable(true);
        }

        const records = await getTelemetryWithStatus();
        if (records.status === "unavailable" || records.status === "corrupt") {
          if (active) setStorageWarning(true);
          return;
        }

        const existing = records.records.find(
          (item) => item.sessionId === sessionId,
        );
        if (!existing) {
          const saved = await saveTelemetry({
            sessionId,
            scenarioId: params.scenarioId ?? "steady-start",
            scenarioName: params.scenarioName,
            pausePlan: params.pausePlan,
            mode: params.mode,
            audioOn,
            hapticsOn,
            speed,
            durationMinutes: Number(params.duration),
            elapsedSeconds: Number(params.elapsedSeconds),
            startedAt: new Date().toISOString(),
            initialSud: Number(params.sud),
            sets: 1,
            pauses: 0,
            events: [
              {
                id: `${sessionId}_start`,
                createdAt: new Date().toISOString(),
                type: "set-started",
                phase: "Processing",
                note: params.scenarioName
                  ? `Scenario: ${params.scenarioName}`
                  : undefined,
              },
            ],
          });
          if (!saved) {
            if (active) setStorageWarning(true);
            return;
          }
        } else {
          if (active && existing.audioOn !== undefined)
            setAudioOn(existing.audioOn);
          if (active && existing.hapticsOn !== undefined)
            setHapticsOn(existing.hapticsOn);
          if (active && existing.speed !== undefined) setSpeed(existing.speed);
          const progressSaved = await updateTelemetryProgress(sessionId, {
            mode: existing.mode ?? params.mode,
            durationMinutes:
              existing.durationMinutes ?? Number(params.duration),
            elapsedSeconds:
              existing.elapsedSeconds ?? Number(params.elapsedSeconds),
            scenarioName: existing.scenarioName ?? params.scenarioName,
          });
          if (!progressSaved) {
            if (active) setStorageWarning(true);
            return;
          }
          if (params.resume === "true") {
            const recovered = await appendTelemetryEvent(sessionId, {
              id: `${sessionId}_recovery_${Date.now()}`,
              createdAt: new Date().toISOString(),
              type: "recovery-resumed",
              phase: "Recovery",
              note: "Recovered locally; waiting for deliberate restart",
            });
            if (!recovered) {
              if (active) setStorageWarning(true);
              return;
            }
          }
        }
        if (active) setTelemetryReady(true);
      } catch (error) {
        if (__DEV__)
          console.warn(
            "[bls] initialization failed",
            error instanceof Error ? error.name : "unknown",
          );
        if (active) setStorageWarning(true);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, [
    audioOn,
    hapticsOn,
    params.duration,
    params.elapsedSeconds,
    params.mode,
    params.pausePlan,
    params.resume,
    params.scenarioId,
    params.scenarioName,
    params.sud,
    sessionId,
    speed,
  ]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1_000);
    const cycleMs = getBlsCueIntervalMs(speed);
    const loop = reducedMotion
      ? null
      : Animated.loop(
          Animated.sequence([
            Animated.timing(x, {
              toValue: 1,
              duration: cycleMs,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(x, {
              toValue: 0,
              duration: cycleMs,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        );
    const cue = setInterval(() => {
      try {
        if (audioOn) {
          const player =
            Math.floor(Date.now() / cycleMs) % 2 === 0
              ? leftPlayer
              : rightPlayer;
          player.seekTo(0);
          player.play();
        }
      } catch {
        setAudioUnavailable(true);
        setAudioOn(false);
      }
      try {
        if (hapticsOn) haptic.light();
      } catch {
        // Haptic availability must never interrupt the visual session.
      }
    }, cycleMs);
    loop?.start();
    return () => {
      clearInterval(timer);
      clearInterval(cue);
      loop?.stop();
    };
  }, [
    audioOn,
    hapticsOn,
    leftPlayer,
    reducedMotion,
    rightPlayer,
    running,
    speed,
    x,
  ]);

  useEffect(() => {
    if (!running || !audioOn || audioUnavailable || soundscape === "none") {
      rainPlayer.pause();
      humPlayer.pause();
      return;
    }
    const player = soundscape === "rain" ? rainPlayer : humPlayer;
    try {
      rainPlayer.loop = true;
      humPlayer.loop = true;
      player.play();
    } catch {
      setAudioUnavailable(true);
    }
    return () => {
      rainPlayer.pause();
      humPlayer.pause();
    };
  }, [audioOn, audioUnavailable, humPlayer, rainPlayer, running, soundscape]);

  const persistProgress = useCallback(
    async (event?: Parameters<typeof appendTelemetryEvent>[1]) => {
      if (!telemetryReady) return false;
      const progressSaved = await updateTelemetryProgress(sessionId, {
        elapsedSeconds: seconds,
        audioOn,
        hapticsOn,
        speed,
      });
      const eventSaved =
        !event ||
        (progressSaved && (await appendTelemetryEvent(sessionId, event)));
      if (!progressSaved || !eventSaved) setStorageWarning(true);
      return progressSaved && eventSaved;
    },
    [audioOn, hapticsOn, seconds, sessionId, speed, telemetryReady],
  );

  useEffect(() => {
    if (!telemetryReady || seconds <= 0 || seconds % 5 !== 0) return;
    void persistProgress();
  }, [persistProgress, seconds, telemetryReady]);

  useEffect(() => {
    if (!telemetryReady) return;
    void savePreferences({ blsAudioVolume: audioVolume }).then((saved) => {
      if (!saved) setStorageWarning(true);
    });
  }, [audioVolume, telemetryReady]);

  useEffect(() => {
    if (!telemetryReady) return;
    void savePreferences({ blsSoundscape: soundscape }).then((saved) => {
      if (!saved) setStorageWarning(true);
    });
  }, [soundscape, telemetryReady]);

  const groundingParams = {
    ...params,
    sessionId,
    elapsedSeconds: String(seconds),
    audioOn: String(audioOn),
    hapticsOn: String(hapticsOn),
    speed: String(speed),
  };

  const stopToGrounding = () => {
    if (ending) return;
    setEnding(true);
    stopNativeStimulation();
    void persistProgress({
      id: `${sessionId}_stop_${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: "set-stopped",
      phase: "Processing",
      note: "Stopped to grounding",
    });
    router.replace({ pathname: "/session/grounding", params: groundingParams });
  };

  const toggleRunning = () => {
    const next = !running;
    if (!next) stopNativeStimulation();
    else setRunning(true);
    void persistProgress({
      id: `${sessionId}_${next ? "resume" : "pause"}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: next ? "set-started" : "set-paused",
      phase: "Processing",
    });
  };

  const resumeRunning = () => {
    if (running) return;
    setRunning(true);
    void persistProgress({
      id: `${sessionId}_resume_${Date.now()}`,
      createdAt: new Date().toISOString(),
      type: "set-started",
      phase: "Processing",
      note: "Restarted after orientation",
    });
  };

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      containerClassName="bg-[#14211F]"
      className="px-5"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              ending
                ? "Stopping and opening grounding"
                : "Stop BLS and open grounding"
            }
            accessibilityState={{ busy: ending, disabled: ending }}
            disabled={ending}
            hitSlop={12}
            onPress={stopToGrounding}
          >
            <Text style={styles.close}>×</Text>
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.phase}>EMDR SESSION</Text>
            <Text style={styles.subphase}>
              Processing · set {Math.max(1, Math.floor(seconds / 12) + 1)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings; bilateral stimulation will pause"
            hitSlop={12}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Text style={styles.settings}>⚙</Text>
          </Pressable>
        </View>
        {!running ? (
          <View
            accessibilityRole="summary"
            accessibilityLabel={`BLS is paused at ${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}. Take one breath before restarting.`}
            style={styles.pausePanel}
          >
            <Text style={styles.pauseKicker}>PAUSED FOR ORIENTATION</Text>
            <Text style={styles.pauseTitle}>
              Take one breath before restarting.
            </Text>
            <Text style={styles.pauseBody}>
              Notice your feet, the room, and your choice to continue. Stop and
              use grounding whenever you need.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start bilateral stimulation gently"
              onPress={() => {
                haptic.light();
                resumeRunning();
              }}
              style={styles.restartButton}
            >
              <Text style={styles.restartText}>Start BLS gently</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.center}>
          <Text style={styles.instruction}>
            {running
              ? "Follow the dot with your eyes"
              : "Paused · notice your breath"}
          </Text>
          <View style={styles.track}>
            <Animated.View
              style={[
                styles.glow,
                {
                  transform: [
                    {
                      translateX: x.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-125, 125],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateX: x.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-125, 125],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <View style={styles.arrows}>
            <Text style={styles.arrow}>←</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
          <Text style={styles.timer}>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </Text>
        </View>
        {storageWarning ? (
          <Text accessibilityRole="alert" style={styles.actionError}>
            Your local session record could not be saved. Stimulation controls
            remain available; do not rely on recovery history until storage is
            available.
          </Text>
        ) : null}
        <AudioStatusCard
          model={getAudioStatusCardModel({
            audioOn,
            audioUnavailable,
            audioInterrupted,
            audioPreparing,
            audioReady,
            audioPlaying,
            audioRetrying,
            audioVolume,
            soundscape,
          })}
          audioRetrying={audioRetrying}
          onRetry={() => {
            void retryAudio();
          }}
        />
        <View style={styles.controlRow}>
          <ToggleCard
            label="Audio"
            on={audioOn}
            setOn={(value) => {
              setAudioOn(value && !audioUnavailable);
            }}
            icon="◖◗"
            accessibilityLabel={getBlsToggleAccessibilityLabel(
              "audio",
              audioOn,
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              running
                ? "Pause bilateral stimulation"
                : "Resume bilateral stimulation"
            }
            onPress={toggleRunning}
            style={styles.stop}
          >
            <Text style={styles.stopText}>
              {running ? "Ⅱ  Pause" : "▶  Resume"}
            </Text>
          </Pressable>
          <ToggleCard
            label="Haptics"
            on={hapticsOn}
            setOn={setHapticsOn}
            icon="◌"
            accessibilityLabel={getBlsToggleAccessibilityLabel(
              "haptics",
              hapticsOn,
            )}
          />
        </View>
        <OptionPanel
          title="Volume"
          value={getBlsAudioVolumeLabel(audioVolume)}
          options={BLS_AUDIO_VOLUMES}
          selected={audioVolume}
          disabled={!audioOn || audioUnavailable}
          getLabel={(value) => getBlsAudioVolumeLabel(value)}
          onSelect={setAudioVolume}
        />
        <View style={styles.soundscapePanel}>
          <View style={styles.speedHeader}>
            <Text style={styles.panelTitle}>Background sound</Text>
            <Text style={styles.panelValue}>
              {getBlsSoundscapeLabel(soundscape)}
            </Text>
          </View>
          <Text style={styles.soundscapeHint}>
            Optional low-volume ambience. Directional cues stay primary.
          </Text>
          <OptionChoices
            options={BLS_SOUNDSCAPE_OPTIONS}
            selected={soundscape}
            disabled={!audioOn || audioUnavailable}
            getLabel={getBlsSoundscapeLabel}
            onSelect={setSoundscape}
          />
        </View>
        <View style={styles.speedPanel}>
          <View style={styles.speedHeader}>
            <Text style={styles.panelTitle}>Cue pace</Text>
            <Text style={styles.panelValue}>
              {speed === 1 ? "Slow" : speed === 2 ? "Medium" : "Fast"}
            </Text>
          </View>
          <OptionChoices
            options={[1, 2, 3] as const}
            selected={speed}
            getLabel={(value) =>
              `${value === 1 ? "Slow" : value === 2 ? "Medium" : "Fast"}, cue interval ${getBlsCueIntervalMs(value) / 1_000} seconds`
            }
            onSelect={setSpeed}
          />
        </View>
        <View style={styles.customize}>
          <View style={styles.customizeTitle}>
            <Text style={styles.panelTitle}>Customize</Text>
            <BilateralMark size={24} dark />
          </View>
          <View style={styles.customizeItems}>
            <Text style={styles.customizeText}>
              Shape{"\n"}
              <Text style={styles.customizeStrong}>Circle</Text>
            </Text>
            <Text style={styles.customizeText}>
              Color{"\n"}
              <Text style={styles.customizeStrong}>Mint</Text>
            </Text>
            <Text style={styles.customizeText}>
              Size{"\n"}
              <Text style={styles.customizeStrong}>Large</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.footer}>
          Pause or stop anytime. If you feel overwhelmed, use grounding.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

function ToggleCard({
  label,
  on,
  setOn,
  icon,
  accessibilityLabel,
}: {
  label: string;
  on: boolean;
  setOn: (value: boolean) => void;
  icon: string;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.toggleCard}>
      <Text style={styles.toggleIcon}>{icon}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        accessibilityLabel={accessibilityLabel}
        value={on}
        onValueChange={setOn}
        trackColor={{ false: "#35514B", true: "#8FC8BC" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function OptionPanel<T extends number>({
  title,
  value,
  options,
  selected,
  disabled,
  getLabel,
  onSelect,
}: {
  title: string;
  value: string;
  options: readonly T[];
  selected: T;
  disabled?: boolean;
  getLabel: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.volumePanel}>
      <View style={styles.speedHeader}>
        <Text style={styles.panelTitle}>{title}</Text>
        <Text style={styles.panelValue}>{value}</Text>
      </View>
      <OptionChoices
        options={options}
        selected={selected}
        disabled={disabled}
        getLabel={getLabel}
        onSelect={onSelect}
      />
    </View>
  );
}

function OptionChoices<T extends string | number>({
  options,
  selected,
  disabled,
  getLabel,
  onSelect,
}: {
  options: readonly T[];
  selected: T;
  disabled?: boolean;
  getLabel: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.speedRow}>
      {options.map((value) => (
        <Pressable
          key={value}
          accessibilityRole="radio"
          accessibilityLabel={`Set to ${getLabel(value).toLowerCase()}`}
          accessibilityState={{ selected: selected === value, disabled }}
          disabled={disabled}
          onPress={() => onSelect(value)}
          style={[
            styles.speedDot,
            selected === value && styles.speedDotActive,
            disabled && styles.controlDisabled,
          ]}
        >
          <Text
            style={[
              styles.speedText,
              selected === value && styles.speedTextActive,
            ]}
          >
            {getLabel(value).split(",")[0]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 16, paddingBottom: 28 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  close: {
    color: "#D5E7E1",
    fontSize: 34,
    fontWeight: "200",
    minWidth: 44,
    textAlign: "left",
  },
  settings: {
    color: "#D5E7E1",
    fontSize: 22,
    minWidth: 44,
    textAlign: "right",
  },
  topCenter: { alignItems: "center" },
  phase: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  subphase: { color: "#8FC8BC", fontSize: 11, marginTop: 4 },
  pausePanel: {
    backgroundColor: "#294A44",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#476A62",
  },
  pauseKicker: {
    color: "#8FC8BC",
    fontSize: 10,
    letterSpacing: 1.1,
    fontWeight: "800",
    marginBottom: 7,
  },
  pauseTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  pauseBody: { color: "#D5E7E1", fontSize: 12, lineHeight: 18 },
  restartButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 12,
  },
  restartText: { color: DS.deepDark, fontSize: 12, fontWeight: "800" },
  center: { alignItems: "center", marginTop: 12 },
  instruction: {
    color: "#D5E7E1",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 10,
  },
  track: {
    height: 145,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFFDF5",
    boxShadow: "0px 0px 22px rgba(184,216,210,0.8)",
  },
  glow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(143,200,188,0.22)",
  },
  arrows: { width: 190, flexDirection: "row", justifyContent: "space-between" },
  arrow: { color: "#D5E7E1", fontSize: 28, fontWeight: "300" },
  timer: { color: "#8FC8BC", fontSize: 13, marginTop: 8 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  toggleCard: {
    flex: 1,
    backgroundColor: "#1E3833",
    borderRadius: 14,
    padding: 10,
    minHeight: 76,
    justifyContent: "space-between",
  },
  toggleIcon: { color: "#B8D8D2", fontSize: 18 },
  toggleLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  stop: {
    width: 102,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  stopText: { color: DS.deepDark, fontSize: 13, fontWeight: "800" },
  volumePanel: {
    backgroundColor: "#1E3833",
    borderRadius: 16,
    padding: 13,
    marginTop: 9,
  },
  soundscapePanel: {
    backgroundColor: "#1E3833",
    borderRadius: 16,
    padding: 13,
    marginTop: 9,
  },
  soundscapeHint: {
    color: "#78958E",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  speedPanel: {
    backgroundColor: "#1E3833",
    borderRadius: 16,
    padding: 13,
    marginTop: 9,
  },
  speedHeader: { flexDirection: "row", justifyContent: "space-between" },
  panelTitle: { color: "#D5E7E1", fontSize: 12, fontWeight: "700" },
  panelValue: { color: "#8FC8BC", fontSize: 12 },
  speedRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  speedDot: {
    minHeight: 44,
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#47665E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  controlDisabled: { opacity: 0.45 },
  speedDotActive: { backgroundColor: "#8FC8BC" },
  speedText: { color: "#D5E7E1", fontSize: 10, textAlign: "center" },
  speedTextActive: { color: "#FFFFFF", fontWeight: "700" },
  customize: {
    backgroundColor: "#19332E",
    borderRadius: 16,
    padding: 13,
    marginTop: 9,
  },
  customizeTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customizeItems: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  customizeText: { color: "#78958E", fontSize: 11, lineHeight: 16 },
  customizeStrong: { color: "#FFFFFF", fontWeight: "700" },
  actionError: {
    color: "#F3C7B8",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  footer: {
    color: "#78958E",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
});
