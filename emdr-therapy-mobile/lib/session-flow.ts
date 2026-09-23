import type { BlsMode } from "./session-store";

export type SessionFlowParams = {
  duration?: string;
  mode?: BlsMode;
  sud?: string;
  sessionId?: string;
  scenarioId?: string;
  scenarioName?: string;
  pausePlan?: "pause" | "ground" | "stop";
  elapsedSeconds?: string;
  audioOn?: string;
  hapticsOn?: string;
  speed?: string;
  resume?: string;
};

export type NormalizedSessionFlowParams = Required<
  Pick<
    SessionFlowParams,
    | "duration"
    | "mode"
    | "sud"
    | "elapsedSeconds"
    | "audioOn"
    | "hapticsOn"
    | "speed"
    | "resume"
  >
> &
  Omit<
    SessionFlowParams,
    | "duration"
    | "mode"
    | "sud"
    | "elapsedSeconds"
    | "audioOn"
    | "hapticsOn"
    | "speed"
    | "resume"
  >;

const MAX_DURATION_MINUTES = 90;
const MAX_ELAPSED_SECONDS = MAX_DURATION_MINUTES * 60;
const MAX_ROUTE_TEXT_LENGTH = 120;

function finiteInteger(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function safeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length <= MAX_ROUTE_TEXT_LENGTH
    ? trimmed
    : undefined;
}

function safeMode(value: string | undefined): BlsMode {
  return value === "audio" ||
    value === "haptic" ||
    value === "mixed" ||
    value === "visual"
    ? value
    : "visual";
}

function safePausePlan(
  value: string | undefined,
): SessionFlowParams["pausePlan"] {
  return value === "pause" || value === "ground" || value === "stop"
    ? value
    : undefined;
}

function safeBoolean(value: string | undefined, fallback: boolean): string {
  if (value === "true") return "true";
  if (value === "false") return "false";
  return String(fallback);
}

/** Normalizes deep-link and recovery parameters before they reach the BLS session. */
export function normalizeSessionParams(
  params: SessionFlowParams,
): NormalizedSessionFlowParams {
  const duration = finiteInteger(params.duration, 10, 1, MAX_DURATION_MINUTES);
  const elapsedSeconds = finiteInteger(
    params.elapsedSeconds,
    0,
    0,
    Math.max(MAX_ELAPSED_SECONDS, duration * 60),
  );
  const speed = finiteInteger(params.speed, 2, 1, 3);
  const mode = safeMode(params.mode);

  return {
    duration: String(duration),
    mode,
    sud: String(finiteInteger(params.sud, 0, 0, 10)),
    elapsedSeconds: String(elapsedSeconds),
    speed: String(speed),
    audioOn: safeBoolean(params.audioOn, mode === "audio" || mode === "mixed"),
    hapticsOn: safeBoolean(
      params.hapticsOn,
      mode === "haptic" || mode === "mixed",
    ),
    resume: String(params.resume === "true"),
    ...(safeText(params.sessionId)
      ? { sessionId: safeText(params.sessionId) }
      : {}),
    ...(safeText(params.scenarioId)
      ? { scenarioId: safeText(params.scenarioId) }
      : {}),
    ...(safeText(params.scenarioName)
      ? { scenarioName: safeText(params.scenarioName) }
      : {}),
    ...(safePausePlan(params.pausePlan)
      ? { pausePlan: safePausePlan(params.pausePlan) }
      : {}),
  };
}

export function createSessionStartParams(input: {
  duration: number;
  mode: BlsMode;
  scenarioId?: string;
  scenarioName?: string;
}): SessionFlowParams {
  return {
    duration: String(
      finiteInteger(String(input.duration), 10, 1, MAX_DURATION_MINUTES),
    ),
    mode: safeMode(input.mode),
    scenarioId: safeText(input.scenarioId) ?? "steady-start",
    scenarioName: safeText(input.scenarioName) ?? "Steady Start",
  };
}

/** Carries only normalized, nonblank route state between session phases. */
export function carrySessionParams(
  params: SessionFlowParams,
): SessionFlowParams {
  const normalized = normalizeSessionParams(params);
  return Object.fromEntries(
    Object.entries(normalized).filter(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(params, key) &&
        value !== undefined &&
        value !== "",
    ),
  ) as SessionFlowParams;
}
