import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { BilateralMark, Card, DS, PrimaryButton } from '@/components/ui/design-system';
import { FeatureGate } from '@/components/ui/feature-gate';
import { BILLING_BOUNDARY } from '@/lib/monetization';
import { createDocumentationDraft, DOCUMENTATION_BOUNDARY, formatDocumentationRetryAttempt, getDocumentationRetryMessage, type DocumentationDraft, type DocumentationRetryState } from '@/lib/documentation';

const FALLBACK_DRAFT: DocumentationDraft = {
  id: 'preview-documentation',
  createdAt: '2026-01-01T12:00:00.000Z',
  status: 'needs-review',
  phases: ['Preparation', 'Assessment', 'Closure'],
  source: 'structured session summary',
  clientResponse: 'Preview response: the simulated patient remains oriented to the room.',
  interventions: 'Preview intervention: paced orientation and consent check.',
  riskLanguage: 'Preview boundary: no risk determination is made from this training content.',
  followUp: 'Preview follow-up: clinician review is required before any use.',
  reviewNotes: 'Preview fallback only; clinician correction and approval are required.',
};

export default function DocumentationScreen() {
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState<DocumentationDraft | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [retryState, setRetryState] = useState<DocumentationRetryState>('idle');
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const createDraft = () => {
    if (retrying) return;
    if (!consent) {
      Alert.alert('Consent required', 'Confirm the applicable recording or transcription consent before creating a documentation draft.');
      return;
    }

    setRetrying(true);
    setRetryAttempts((attempt) => attempt + 1);
    setTimeout(() => {
      try {
      setDraft(createDocumentationDraft(true));
      setUsingFallback(false);
      setRetryState('idle');
    } catch (error) {
      console.warn('[documentation] draft creation failed; showing preview fallback', error);
      setDraft(FALLBACK_DRAFT);
      setUsingFallback(true);
      setRetryState(retryState === 'fallback' ? 'retry-failed' : 'fallback');
      } finally {
        setRetrying(false);
      }
    }, 160);
  };

  const resetDraft = () => {
    setDraft(null);
    setUsingFallback(false);
    setRetryState('idle');
    setRetryAttempts(0);
    setRetrying(false);
    setConsent(false);
  };

  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DOCUMENTATION ASSISTANT</Text>
            <Text style={styles.heading}>Draft carefully.{`\n`}Review completely.</Text>
          </View>
          <BilateralMark size={44} />
        </View>

        <View style={styles.boundary}>
          <Text style={styles.boundaryTitle}>Clinician review required</Text>
          <Text style={styles.boundaryBody}>{DOCUMENTATION_BOUNDARY}</Text>
        </View>

        <Card tint={DS.lavender}>
          <Text style={styles.cardTitle}>Professional preview</Text>
          <Text style={styles.body}>The documentation assistant is shown as a Professional plan concept. It drafts from de-identified training material only; it does not sign, submit, or write a clinical record.</Text>
          <Text style={styles.body}>{BILLING_BOUNDARY}</Text>
        </Card>

        {!draft ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>Before you begin</Text>
              <Text style={styles.body}>Use only a de-identified transcript or a structured training-session summary. Do not enter patient names, direct identifiers, or unredacted recordings into this prototype.</Text>
              <View style={styles.consent}>
                <View style={styles.consentCopy}>
                  <Text style={styles.consentTitle}>Consent confirmed</Text>
                  <Text style={styles.consentBody}>I have the applicable recording or transcription consent.</Text>
                </View>
                <Switch accessibilityLabel="Consent confirmed" value={consent} onValueChange={setConsent} trackColor={{ false: '#CBD7D3', true: '#8FC8BC' }} thumbColor="#FFFFFF" />
              </View>
            </Card>
            <FeatureGate requiredTier="professional" feature="Documentation assistant">
              <PrimaryButton onPress={createDraft}>Create training draft</PrimaryButton>
            </FeatureGate>
          </>
        ) : (
          <>
            <Card tint={DS.mint}>
              {usingFallback ? <><Text style={styles.previewStatus}>PREVIEW FALLBACK · NOT GENERATED</Text><Text style={styles.body}>{getDocumentationRetryMessage(retryState)}</Text><Text style={styles.attempt}>{formatDocumentationRetryAttempt(retryAttempts)}</Text></> : null}
              <Text style={styles.status}>NEEDS REVIEW</Text>
              <Text style={styles.cardTitle}>Structured training draft</Text>
              <Text style={styles.body}>Phases: {draft.phases.join(' · ')}</Text>
              <Text style={styles.body}>Source: {draft.source}</Text>
              {usingFallback ? (
                <Pressable accessibilityRole="button" accessibilityLabel={retrying ? 'Retrying the training draft' : 'Try generating the training draft again'} accessibilityState={{ busy: retrying, disabled: retrying }} onPress={createDraft}>
                  {retrying ? <View style={styles.retryRow}><ActivityIndicator size="small" color={DS.deep} /><Text style={styles.retry}>Retrying…</Text></View> : <Text style={styles.retry}>Try generating again</Text>}
                </Pressable>
              ) : null}
            </Card>
            <Section title="Client response" value={draft.clientResponse} />
            <Section title="Interventions" value={draft.interventions} />
            <Section title="Risk language" value={draft.riskLanguage} />
            <Section title="Follow-up" value={draft.followUp} />
            <View style={styles.reviewBox}>
              <Text style={styles.reviewTitle}>Approval step</Text>
              <Text style={styles.body}>A clinician must correct this draft and explicitly approve it before any clinical-record use. Approval is not implemented in this prototype.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Start over and review consent" onPress={resetDraft}>
              <Text style={styles.reset}>Start over and review consent</Text>
            </Pressable>
          </>
        )}

        <Pressable accessibilityRole="button" accessibilityLabel="Return to the previous screen" onPress={() => router.back()}>
          <Text style={styles.back}>Return</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: DS.deep, fontSize: 12, letterSpacing: 1.4, fontWeight: '700', marginTop: 4 },
  heading: { color: DS.ink, fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 6 },
  boundary: { backgroundColor: DS.lavender, borderRadius: 16, padding: 14 },
  boundaryTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  boundaryBody: { color: DS.muted, fontSize: 12, lineHeight: 18 },
  cardTitle: { color: DS.ink, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  body: { color: DS.muted, fontSize: 12, lineHeight: 18 },
  consent: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: DS.line, marginTop: 14, paddingTop: 13 },
  consentCopy: { flex: 1 },
  consentTitle: { color: DS.ink, fontSize: 13, fontWeight: '800', marginBottom: 3 },
  consentBody: { color: DS.muted, fontSize: 11, lineHeight: 16 },
  status: { color: DS.deep, fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 7 },
  previewStatus: { color: DS.amber, fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 7 },
  attempt: { color: DS.muted, fontSize: 11, marginTop: 5 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  sectionTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 5 },
  retry: { color: DS.deep, fontSize: 12, fontWeight: '800', marginTop: 10 },
  reviewBox: { backgroundColor: '#FFF7E9', borderRadius: 16, padding: 14 },
  reviewTitle: { color: DS.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  reset: { color: DS.deep, fontSize: 12, fontWeight: '800', textAlign: 'center', padding: 8 },
  back: { color: DS.deep, fontWeight: '800', textAlign: 'center', padding: 8 },
});

export { FALLBACK_DRAFT };
