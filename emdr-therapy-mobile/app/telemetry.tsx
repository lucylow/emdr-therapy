import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { BilateralMark, Card, DS, Metric } from '@/components/ui/design-system';
import { FeatureGate } from '@/components/ui/feature-gate';
import { getTelemetry } from '@/lib/session-store';
import { formatTelemetryTime, isNewTelemetryPhase, summarizeTelemetry, TELEMETRY_BOUNDARY, type SessionTelemetry } from '@/lib/telemetry';
import { SIMULATED_SCENARIOS } from '@/lib/scenarios';

const sample: SessionTelemetry = {
  sessionId: 'training-preview', scenarioId: 'steady-start', startedAt: new Date().toISOString(), sets: 2, pauses: 1, initialSud: 6, finalSud: 4,
  events: [
    { id: '1', createdAt: new Date().toISOString(), type: 'set-started', phase: 'Desensitization' },
    { id: '2', createdAt: new Date().toISOString(), type: 'sud-recorded', phase: 'Desensitization', value: 4 },
    { id: '3', createdAt: new Date().toISOString(), type: 'set-paused', phase: 'Desensitization', note: 'Trainee paused to orient.' },
  ],
};

export default function TelemetryScreen() {
  const [saved, setSaved] = useState<SessionTelemetry[]>([]);
  const [usingPreview, setUsingPreview] = useState(false);
  const load = useCallback(async () => { try { setSaved(await getTelemetry()); setUsingPreview(false); } catch (error) { console.warn('[telemetry] local load failed; showing preview data', error); setSaved([]); setUsingPreview(true); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const active = saved[0] ?? sample;
  const previewMode = usingPreview || saved.length === 0;
  const summary = summarizeTelemetry(active);
  const scenario = SIMULATED_SCENARIOS.find((item) => item.id === active.scenarioId);

  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>SESSION TELEMETRY</Text><Text style={styles.heading}>Review the set.{`\n`}Notice the pattern.</Text></View><BilateralMark size={44} /></View>
        {previewMode ? <View style={styles.previewBanner}><Text style={styles.previewTitle}>PREVIEW DATA</Text><Text style={styles.previewBody}>No local telemetry is available, so this screen is showing deterministic training-only example data. It is not a real session result.</Text></View> : null}<View style={styles.boundary}><Text style={styles.boundaryTitle}>Training review only</Text><Text style={styles.boundaryBody}>{TELEMETRY_BOUNDARY}</Text></View>
        <FeatureGate requiredTier="basic" feature="Advanced session telemetry">
          <View>
            <View style={styles.metrics}><Card><Metric value={String(summary.sets)} label="sets" /></Card><Card><Metric value={String(summary.pauses)} label="pauses" /></Card><Card><Metric value={summary.sudChange === null ? '—' : `${summary.sudChange > 0 ? '↓ ' : ''}${summary.sudChange}`} label="SUD change" /></Card></View>
            <Card>
              <Text style={styles.cardTitle}>Event trail</Text>
              {saved.length === 0 ? <Text style={styles.body}>No persisted live telemetry yet. This preview shows the shape of a training event trail.</Text> : null}
              {active.events.map((event, index) => <View key={event.id}>{isNewTelemetryPhase(active.events, index) ? <Text style={styles.phaseHeading}>{event.phase}</Text> : null}<View style={styles.event}><View style={styles.dot} /><View style={styles.eventCopy}><Text style={styles.eventTitle}>{event.type.replaceAll('-', ' ')}</Text><Text style={styles.eventBody}>{formatTelemetryTime(event.createdAt)}{event.value === undefined ? '' : ` · value ${event.value}`}{event.note === undefined ? '' : ` · ${event.note}`}</Text></View></View></View>)}
            </Card>
          </View>
        </FeatureGate>
        <Card tint={DS.lavender}><Text style={styles.cardTitle}>Teaching reflection</Text>{scenario ? <><Text style={styles.scenarioLabel}>CASE · {scenario.name.toUpperCase()}</Text><Text style={styles.body}>{scenario.teachingNote}</Text></> : null}<Text style={styles.body}>The pause is visible in the record. Use it to discuss pacing and orientation; do not treat telemetry as a patient outcome or an instruction to increase intensity.</Text></Card>
        <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>Return</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 13 }, previewBanner: { backgroundColor: '#FFF7E9', borderRadius: 16, padding: 14 }, previewTitle: { color: DS.deep, fontSize: 11, letterSpacing: 1, fontWeight: '800', marginBottom: 4 }, previewBody: { color: DS.muted, fontSize: 12, lineHeight: 18 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, eyebrow: { color: DS.deep, fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginTop: 4 }, heading: { color: DS.ink, fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 6 }, boundary: { backgroundColor: DS.lavender, borderRadius: 16, padding: 14 }, boundaryTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 }, boundaryBody: { color: DS.muted, fontSize: 12, lineHeight: 18 }, metrics: { flexDirection: 'row', gap: 8 }, cardTitle: { color: DS.ink, fontSize: 16, fontWeight: '800', marginBottom: 10 }, scenarioLabel: { color: DS.deep, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 5 }, body: { color: DS.muted, fontSize: 12, lineHeight: 18 }, phaseHeading: { color: DS.deep, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginTop: 4, marginBottom: 8, textTransform: 'uppercase' }, event: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 11 }, eventCopy: { flex: 1 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DS.deep }, eventTitle: { color: DS.ink, fontSize: 13, fontWeight: '800', textTransform: 'capitalize' }, eventBody: { color: DS.muted, fontSize: 11, lineHeight: 16, marginTop: 2 }, back: { color: DS.deep, fontWeight: '800', textAlign: 'center', padding: 8 },
});
