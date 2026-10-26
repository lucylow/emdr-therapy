import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { LocalDataStatus } from "@/components/local-data-status";
import {
  BilateralMark,
  Card,
  DS,
  PrimaryButton,
} from "@/components/ui/design-system";
import {
  getJournalEntriesWithStatus,
  type JournalEntry,
  deleteJournalEntry,
  saveJournalEntry,
} from "@/lib/session-store";
import { haptic } from "@/lib/haptics";

export default function JournalScreen() {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");
  const [shareError, setShareError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getJournalEntriesWithStatus();
      setEntries(result.entries);
      setLoadError(result.usedFallback);
    } catch (error) {
      console.warn("[journal] local entries load failed", error);
      setEntries([]);
      setLoadError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    const value = text.trim();
    if (!value || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const entry = await saveJournalEntry(value);
      if (!entry) throw new Error("local journal write was not acknowledged");
      setText("");
      setSaved(true);
      haptic.success();
      await load();
    } catch (error) {
      console.warn("[journal] local entry save failed", error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const shareSummary = async () => {
    const message = summaryDraft.trim();
    if (!message) return;
    setShareError(false);
    try {
      await Share.share({ message });
    } catch (error) {
      console.warn("[journal] share sheet failed", error instanceof Error ? error.name : "unknown");
      setShareError(true);
    }
  };

  const confirmDeleteEntry = (id: string) => Alert.alert(
    "Delete this reflection?",
    "This removes the app-managed journal entry from this device. Copies outside the app or in device backups may not be removed.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
        void deleteJournalEntry(id).then((deleted) => {
          if (deleted) {
            setEntries((previous) => previous.filter((entry) => entry.id !== id));
            setDeleteError(false);
          } else setDeleteError(true);
        }).catch(() => setDeleteError(true));
      } },
    ],
  );

  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View>
            <Text style={styles.eyebrow}>PRIVATE JOURNAL</Text>
            <Text style={styles.heading}>
              Give the moment{`\n`}a little space.
            </Text>
          </View>
          <BilateralMark size={44} />
        </View>
        <Text style={styles.sub}>
          Write only what feels useful. Entries are stored on this device in unencrypted app storage in this prototype. Avoid identifiers or details you do not want exposed.
        </Text>
        {loadError ? (
          <LocalDataStatus
            title="Reflections are temporarily unavailable"
            message="Your existing entries were not changed. Try reading this device again."
            onRetry={() => {
              void load();
            }}
          />
        ) : null}
        <Card tint={DS.mint}>
          <Text style={styles.promptLabel}>A gentle prompt</Text>
          <Text style={styles.prompt}>
            What do you notice in your body, breath, or surroundings right now?
          </Text>
        </Card>
        <TextInput
          multiline
          value={text}
          onChangeText={(value) => {
            setText(value);
            setSaved(false);
            setSaveError(false);
          }}
          placeholder="Start with a word, a sentence, or leave it blank…"
          placeholderTextColor="#9AA9A5"
          style={styles.input}
          textAlignVertical="top"
          accessibilityLabel="Private reflection"
        />
        {saveError ? (
          <Text style={styles.saveError}>
            This reflection was not saved. Your text is still here; try again
            when ready.
          </Text>
        ) : null}
        <PrimaryButton
          onPress={save}
          disabled={!text.trim() || saving}
          icon={saved ? "checkmark" : "chevron.right"}
        >
          {saving
            ? "Saving privately…"
            : saved
              ? "Saved privately"
              : "Save reflection"}
        </PrimaryButton>
        {entries.length > 0 ? (
          <>
            <Text style={styles.section}>Recent reflections</Text>
            {entries.slice(0, 3).map((entry) => (
              <View key={entry.id} style={styles.entry}>
                <Text style={styles.entryDate}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.entryText}>{entry.text}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Delete this reflection" onPress={() => confirmDeleteEntry(entry.id)} style={styles.deleteEntry}><Text style={styles.deleteEntryText}>Delete reflection</Text></Pressable>
              </View>
            ))}
            {deleteError ? <Text accessibilityRole="alert" style={styles.saveError}>This reflection could not be deleted. Your other entries were not changed; try again.</Text> : null}
          </>
        ) : null}
        <Card tint={DS.lavender}>
          <Text style={styles.section}>A summary you control</Text>
          <Text style={styles.noteText}>Nothing is generated from your journal. Write only what you choose to share. Review the exact text before opening your device’s share sheet.</Text>
          {!summaryOpen ? (
            <Pressable accessibilityRole="button" onPress={() => { setSummaryDraft(""); setSummaryOpen(true); }} style={styles.summaryAction}>
              <Text style={styles.summaryActionText}>Write a shareable summary</Text>
            </Pressable>
          ) : (
            <>
              <TextInput multiline value={summaryDraft} onChangeText={setSummaryDraft} placeholder="Write a brief note in your own words…" placeholderTextColor="#9AA9A5" accessibilityLabel="Editable summary to share" style={[styles.input, styles.summaryInput]} textAlignVertical="top" />
              {shareError ? <Text accessibilityRole="alert" style={styles.saveError}>Could not open sharing. Your draft remains on screen.</Text> : null}
              <Pressable accessibilityRole="button" disabled={!summaryDraft.trim()} onPress={() => void shareSummary()} style={[styles.summaryAction, !summaryDraft.trim() && styles.disabled]}>
                <Text style={styles.summaryActionText}>Review and choose where to share</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setSummaryOpen(false); setSummaryDraft(""); setShareError(false); }} style={styles.cancelSummary}>
                <Text style={styles.cancelSummaryText}>Discard summary</Text>
              </Pressable>
            </>
          )}
        </Card>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            If writing brings up more than you can hold, pause and use grounding
            instead.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 14 },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    color: DS.deep,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 4,
  },
  heading: { color: DS.ink, fontSize: 30, lineHeight: 36, fontWeight: "700" },
  sub: { color: DS.muted, fontSize: 14, lineHeight: 21 },
  promptLabel: {
    color: DS.deep,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  prompt: { color: DS.ink, fontSize: 17, lineHeight: 24, fontWeight: "600" },
  input: {
    minHeight: 190,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.line,
    borderRadius: 18,
    padding: 16,
    color: DS.ink,
    fontSize: 15,
    lineHeight: 22,
  },
  section: { color: DS.ink, fontSize: 17, fontWeight: "700", marginTop: 6 },
  entry: {
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.line,
    borderRadius: 16,
    padding: 14,
  },
  entryDate: {
    color: DS.deep,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  entryText: { color: DS.ink, fontSize: 14, lineHeight: 20 },
  deleteEntry: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: 4, marginTop: 6 },
  deleteEntryText: { color: "#8A3B34", fontSize: 12, fontWeight: "700" },
  error: {
    backgroundColor: "#FFF7E9",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8D7B8",
  },
  errorTitle: {
    color: DS.ink,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  errorBody: { color: "#776345", fontSize: 12, lineHeight: 17 },
  errorAction: {
    color: DS.deep,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 9,
  },
  saveError: { color: "#9B5A34", fontSize: 12, lineHeight: 17 },
  summaryInput: { minHeight: 110, backgroundColor: DS.surface, marginTop: 12 },
  summaryAction: { minHeight: 46, justifyContent: "center", alignItems: "center", paddingHorizontal: 14, borderRadius: 14, backgroundColor: DS.deep, marginTop: 12 },
  summaryActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.5 },
  cancelSummary: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 },
  cancelSummaryText: { color: DS.deep, fontSize: 12, fontWeight: "700" },
  note: { backgroundColor: DS.lavender, borderRadius: 14, padding: 13 },
  noteText: {
    color: DS.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
