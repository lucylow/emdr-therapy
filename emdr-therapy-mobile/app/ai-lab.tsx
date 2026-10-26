import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  BilateralMark,
  Card,
  DS,
  PrimaryButton,
} from "@/components/ui/design-system";
import { createTrace } from "@/lib/ai-contracts";
import { evaluateAIPolicy } from "@/lib/ai-policy";
import { createLocalNlpAssistant } from "@/src/services/nlp/index.ts";

export default function AILabScreen() {
  const [consent, setConsent] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [activated, setActivated] = useState(false);
  const [memoryOptIn, setMemoryOptIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string; actions?: { id: string; label: string; priority: number }[]; safety?: string }[]>([]);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const requestRevision = useRef(0);
  const assistant = useMemo(
    () => createLocalNlpAssistant({ config: { retainConversationState: memoryOptIn, enableEmotionCues: false } }),
    [memoryOptIn],
  );
  useEffect(() => () => {
    requestRevision.current += 1;
    assistant.forget("ai-lab");
  }, [assistant]);
  const runLocalCheck = async () => {
    const text = message.trim();
    if (!text || processing) return;
    const revision = ++requestRevision.current;
    setProcessing(true);
    setError("");
    setMessages((previous) => [...previous, { role: "user", text }].slice(-24));
    setMessage("");
    try {
      const result = await assistant.process({ text, conversationId: "ai-lab" });
      if (!result || typeof result.text !== "string" || !result.text.trim()) {
        throw new Error("The local assistant returned an empty response.");
      }
      if (revision !== requestRevision.current) return;
      setMessages((previous) => [...previous, { role: "assistant", text: result.text, actions: result.actions, safety: result.safety.level }].slice(-24));
    } catch {
      if (revision !== requestRevision.current) return;
      // Local fallback avoids losing the interaction if processing unexpectedly fails.
      setMessages((previous) => [...previous, { role: "assistant", text: "I’m unable to interpret that right now. You can try rephrasing, or use the app’s existing grounding and support resources. This tool is not for emergencies." }].slice(-24));
      setError("Local processing failed; a general fallback message is shown.");
    } finally {
      if (revision === requestRevision.current) setProcessing(false);
    }
  };
  const clearLocalCheck = () => {
    requestRevision.current += 1;
    try { assistant.forget("ai-lab"); } catch { /* UI clearing must still succeed. */ }
    setMessage("");
    setMessages([]);
    setError("");
    setProcessing(false);
  };
  const changeMemorySetting = (enabled: boolean) => {
    requestRevision.current += 1;
    setProcessing(false);
    setMessage("");
    setMessages([]);
    setError("");
    setMemoryOptIn(enabled);
  };
  const openAssistantAction = (id: string, safety?: string) => {
    if (id === "grounding") router.push("/resources");
    else if (id === "breathing") router.push("/breathing");
    else if (id === "contact_support") router.push(safety && safety !== "none" ? "/crisis-resources" : "/therapist-connect");
    else if (id === "privacy_info") router.push("/settings/privacy");
  };
  const result = useMemo(
    () =>
      evaluateAIPolicy({
        consentGiven: consent,
        therapistAssigned: assigned,
        activatedByTrainee: activated,
        fatigue: 0,
        overrideRequested: false,
        traumaReprocessingAllowed: false,
      }),
    [consent, assigned, activated],
  );
  const trace = createTrace("ai-lab-self-check", "local-heuristic", [
    "policy-gates",
  ]);
  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AI LAB</Text>
            <Text style={styles.heading}>
              Test the gates.{`\n`}Keep humans in review.
            </Text>
          </View>
          <BilateralMark size={44} />
        </View>
        <View style={styles.boundary}>
          <Text style={styles.boundaryTitle}>Local self-check only</Text>
          <Text style={styles.boundaryBody}>
            No provider call is made. This screen exercises bounded policy logic
            and produces a review-required trace.
          </Text>
        </View>
        <Card>
          <Text style={styles.boundaryBody}>
            The switches below are a policy demonstration only. They do not gate or verify the local chat; no therapist assignment is checked.
          </Text>
          <Gate
            title="Applicable consent"
            value={consent}
            onChange={setConsent}
          />
          <View style={styles.divider} />
          <Gate
            title="Therapist assigned"
            value={assigned}
            onChange={setAssigned}
          />
          <View style={styles.divider} />
          <Gate
            title="Feature activated by trainee"
            value={activated}
            onChange={setActivated}
          />
        </Card>
        <Card tint={result.allowed ? DS.mint : "#FFF7E9"}>
          <Text style={styles.status}>
            {result.allowed ? "POLICY DEMO · WOULD PASS" : "POLICY DEMO · WOULD BLOCK"}
          </Text>
          <Text style={styles.result}>{result.reason}</Text>
          <Text style={styles.trace}>
            Trace {trace.traceId} · {trace.provider}
          </Text>
        </Card>
        <Card>
          <Text style={styles.gateTitle}>Try local language support</Text>
          <Text style={styles.boundaryBody}>Text is processed on this device for this screen session; it is not sent to a provider or saved as a transcript. This is not therapy, diagnosis, or crisis assessment.</Text>
          <View style={styles.memoryRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.gateTitle}>Temporary context · off by default</Text>
              <Text style={styles.boundaryBody}>When enabled, derived intent, topic, language, and safety-cue labels are kept in memory for this chat. Message text is not retained by NLP context. Leaving or clearing the screen removes it.</Text>
            </View>
            <Switch accessibilityLabel="Remember temporary intent and topic context" value={memoryOptIn} disabled={processing} onValueChange={changeMemorySetting} />
          </View>
          <Text style={styles.boundaryBody}>No emotion or body-sensation interpretation is provided by default. Avoid sharing details you do not want displayed in this temporary transcript.</Text>
          {messages.length === 0 ? (
            <View style={styles.promptRow}>
              {["I feel overwhelmed", "Help me feel present", "What can I try right now?"].map((prompt) => (
                <Pressable key={prompt} accessibilityRole="button" onPress={() => setMessage(prompt)} style={styles.promptChip}>
                  <Text style={styles.promptText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View accessibilityLiveRegion="polite" style={styles.transcript}>
              {messages.map((item, index) => (
                <View key={`${index}-${item.role}`} style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={styles.bubbleLabel}>{item.role === "user" ? "You" : "Local support"}</Text>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                  {item.actions?.filter((action) => ["grounding", "breathing", "contact_support", "privacy_info"].includes(action.id)).map((action) => (
                    <Pressable key={action.id} accessibilityRole="button" onPress={() => openAssistantAction(action.id, item.safety)} style={styles.actionButton}>
                      <Text style={styles.promptText}>{item.safety && item.safety !== "none" && action.id === "contact_support" ? "Open crisis resources" : action.label}</Text>
                    </Pressable>
                  ))}
                  {item.actions?.some((action) => action.id === "stop" || action.id === "pause") ? (
                    <Text style={styles.safetyNote}>This chat cannot pause or stop stimulation. If a session is active, use its separate Pause or Stop control.</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
          <TextInput
            accessibilityLabel="Message for local language support"
            value={message}
            onChangeText={setMessage}
            placeholder="For example: I feel overwhelmed"
            multiline
            maxLength={2000}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: processing }}
            disabled={processing || !message.trim()}
            onPress={runLocalCheck}
            style={[styles.runButton, (processing || !message.trim()) && styles.disabledButton]}
          >
            <Text style={styles.runText}>{processing ? "Processing…" : "Get a local response"}</Text>
          </Pressable>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {messages.length > 0 ? <Pressable accessibilityRole="button" onPress={clearLocalCheck}><Text style={styles.clear}>Clear chat and forget context</Text></Pressable> : null}
        </Card>
        <PrimaryButton onPress={() => router.push("/supervisor")}>
          Open supervisor cues
        </PrimaryButton>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.back}>Return</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
function Gate({
  title,
  value,
  onChange,
}: {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.gate}>
      <Text style={styles.gateTitle}>{title}</Text>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#CBD7D3", true: "#8FC8BC" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 13 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    color: DS.deep,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginTop: 4,
  },
  heading: {
    color: DS.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 6,
  },
  boundary: { backgroundColor: DS.lavender, borderRadius: 16, padding: 14 },
  boundaryTitle: {
    color: DS.ink,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  boundaryBody: { color: DS.muted, fontSize: 12, lineHeight: 18 },
  gate: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memoryRow: { flexDirection: "row", alignItems: "center", marginTop: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: DS.line },
  gateTitle: { color: DS.ink, fontSize: 13, fontWeight: "700" },
  divider: { height: 1, backgroundColor: DS.line },
  status: {
    color: DS.deep,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    marginBottom: 7,
  },
  result: { color: DS.ink, fontSize: 14, lineHeight: 20 },
  trace: { color: DS.muted, fontSize: 10, marginTop: 10 },
  back: { color: DS.deep, fontWeight: "800", textAlign: "center", padding: 8 },
  input: { minHeight: 80, borderWidth: 1, borderColor: DS.line, borderRadius: 12, padding: 12, color: DS.ink, marginTop: 12, textAlignVertical: "top" },
  runButton: { alignSelf: "flex-start", backgroundColor: DS.deep, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, marginTop: 10 },
  runText: { color: "white", fontWeight: "700" },
  clear: { color: DS.deep, fontSize: 12, fontWeight: "700", marginTop: 12 },
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  promptChip: { borderRadius: 18, borderWidth: 1, borderColor: DS.line, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#FFFFFF" },
  promptText: { color: DS.deep, fontSize: 11, fontWeight: "600" },
  actionButton: { alignSelf: "flex-start", borderWidth: 1, borderColor: DS.line, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, marginTop: 8, backgroundColor: "#FFFFFF" },
  safetyNote: { color: DS.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
  transcript: { gap: 8, marginTop: 12 },
  bubble: { borderRadius: 12, padding: 10, maxWidth: "95%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: DS.lavender },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#F3F7F5" },
  bubbleLabel: { color: DS.deep, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  bubbleText: { color: DS.ink, fontSize: 13, lineHeight: 19 },
  disabledButton: { opacity: 0.55 },
  error: { color: "#8A3B34", fontSize: 12, marginTop: 8 },
});
