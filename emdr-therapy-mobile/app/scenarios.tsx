import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { BilateralMark, Card, DS, PrimaryButton } from '@/components/ui/design-system';
import { SIMULATED_SCENARIOS, type SimulatedPatientScenario } from '@/lib/scenarios';

const FALLBACK_SCENARIO: SimulatedPatientScenario = { id: 'preview-case', name: 'Preview Case', presentingTheme: 'A deterministic fictional practice case is available while the scenario catalog is unavailable.', readiness: 'learning', assignedPhases: ['Preparation', 'Assessment', 'Closure'], teachingNote: 'Preview content only. Use this case to inspect the bounded training flow; it is not a patient record or clinical direction.' };

export default function ScenariosScreen() {
  const [selected, setSelected] = useState<SimulatedPatientScenario | null>(null);
  const scenarioCatalog = SIMULATED_SCENARIOS.length ? SIMULATED_SCENARIOS : [FALLBACK_SCENARIO];
  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>SIMULATED PATIENTS</Text><Text style={styles.heading}>Choose a case{`\n`}to practice with.</Text></View><BilateralMark size={44} /></View>
        <View style={styles.boundary}><Text style={styles.boundaryTitle}>De-identified training cases</Text><Text style={styles.boundaryBody}>These are fictional learning scenarios. They are not patient records and do not provide clinical direction.</Text></View>{SIMULATED_SCENARIOS.length === 0 ? <View style={styles.preview}><Text style={styles.previewTitle}>PREVIEW DATA</Text><Text style={styles.previewBody}>The scenario catalog is unavailable, so this deterministic fictional case is shown for interface testing only.</Text></View> : null}
        {selected ? (
          <>
            <Card tint={DS.mint}><Text style={styles.status}>{selected.readiness === 'needs-preparation' ? 'NEEDS PREPARATION' : 'READY TO PRACTICE'}</Text><Text style={styles.cardTitle}>{selected.name}</Text><Text style={styles.body}>{selected.presentingTheme}</Text></Card>
            <Card><Text style={styles.sectionTitle}>Teaching focus</Text><Text style={styles.body}>{selected.teachingNote}</Text><Text style={styles.phaseLabel}>Assigned phases</Text><Text style={styles.body}>{selected.assignedPhases.join(' · ')}</Text></Card>
            <PrimaryButton onPress={() => router.push({ pathname: '/session/setup', params: { scenarioId: selected.id, scenarioName: selected.name } })}>Begin bounded practice</PrimaryButton>
            <Pressable accessibilityRole="button" onPress={() => setSelected(null)}><Text style={styles.back}>Choose another case</Text></Pressable>
          </>
        ) : (
          <>
            {scenarioCatalog.map((scenario) => (
              <Pressable accessibilityRole="button" key={scenario.id} onPress={() => setSelected(scenario)} style={styles.scenario}>
                <View style={styles.scenarioDot}><Text style={styles.scenarioNumber}>{scenario.name.slice(0, 1)}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.scenarioTitle}>{scenario.name}</Text><Text style={styles.scenarioBody}>{scenario.presentingTheme}</Text></View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </>
        )}
        <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>Return</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingBottom: 40, gap: 13 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, eyebrow: { color: DS.deep, fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginTop: 4 }, heading: { color: DS.ink, fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 6 }, boundary: { backgroundColor: DS.lavender, borderRadius: 16, padding: 14 }, boundaryTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 }, boundaryBody: { color: DS.muted, fontSize: 12, lineHeight: 18 }, preview: { backgroundColor: '#FFF7E9', borderRadius: 16, padding: 14 }, previewTitle: { color: DS.deep, fontSize: 11, letterSpacing: 1, fontWeight: '800', marginBottom: 4 }, previewBody: { color: DS.muted, fontSize: 12, lineHeight: 18 }, scenario: { backgroundColor: '#FFFFFF', borderRadius: 17, borderWidth: 1, borderColor: DS.line, padding: 14, flexDirection: 'row', gap: 11, alignItems: 'center' }, scenarioDot: { width: 40, height: 40, borderRadius: 14, backgroundColor: DS.mint, alignItems: 'center', justifyContent: 'center' }, scenarioNumber: { color: DS.deep, fontWeight: '800', fontSize: 17 }, scenarioTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 3 }, scenarioBody: { color: DS.muted, fontSize: 11, lineHeight: 16 }, chevron: { color: DS.muted, fontSize: 24 }, status: { color: DS.deep, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 7 }, cardTitle: { color: DS.ink, fontSize: 18, fontWeight: '800', marginBottom: 6 }, sectionTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 5 }, phaseLabel: { color: DS.deep, fontSize: 11, fontWeight: '800', marginTop: 15, marginBottom: 3 }, body: { color: DS.muted, fontSize: 12, lineHeight: 18 }, back: { color: DS.deep, fontWeight: '800', textAlign: 'center', padding: 8 } });
