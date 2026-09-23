import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';

import { ScreenContainer } from '@/components/screen-container';
import { SessionWizardProgress } from '@/components/session-wizard-progress';
import { getBlsAudioStatusLabel } from '@/lib/bls-audio';
import { getPreferences, savePreferences } from '@/lib/session-store';
import { haptic } from '@/lib/haptics';
import { carrySessionParams, type SessionFlowParams } from '@/lib/session-flow';

export default function PreparationScreen() {
  const params = useLocalSearchParams<SessionFlowParams>();
  const sessionParams = carrySessionParams(params);
  const leftPlayer = useAudioPlayer(require('../../assets/sounds/cue_left.wav'));
  const rightPlayer = useAudioPlayer(require('../../assets/sounds/cue_right.wav'));
  const [audioCheck, setAudioCheck] = useState<'idle' | 'left' | 'right' | 'stereo' | 'failed'>('idle');
  const [stereoFeedback, setStereoFeedback] = useState<'clear' | 'unclear' | null>(null); const [savedStereoFeedback, setSavedStereoFeedback] = useState<'clear' | 'unclear' | null>(null); const [feedbackSaveError, setFeedbackSaveError] = useState(false); const [pausePlan, setPausePlan] = useState<'pause' | 'ground' | 'stop'>('pause');
  const audioRequested = sessionParams.mode === 'audio' || sessionParams.mode === 'mixed'; useEffect(() => { let active = true; void getPreferences().then((preferences) => { if (active && preferences.lastStereoFeedback) setSavedStereoFeedback(preferences.lastStereoFeedback); }).catch((error) => { console.warn('[preparation] stereo feedback hydration failed', error); }); return () => { active = false; }; }, []); const recordStereoFeedback = async (value: 'clear' | 'unclear') => { setStereoFeedback(value); setFeedbackSaveError(false); const saved = await savePreferences({ lastStereoFeedback: value }); if (saved) setSavedStereoFeedback(value); else setFeedbackSaveError(true); };

  const checkCue = async (side: 'left' | 'right') => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = side === 'left' ? leftPlayer : rightPlayer;
      player.seekTo(0);
      player.volume = 0.45;
      player.play();
      setAudioCheck(side);
      setStereoFeedback(null);
    } catch (error) {
      console.warn('[preparation] audio check failed', error);
      setAudioCheck('failed');
    }
  };

  const checkStereo = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      leftPlayer.seekTo(0);
      leftPlayer.volume = 0.45;
      leftPlayer.play();
      setAudioCheck('stereo');
      setStereoFeedback(null);
      setTimeout(() => {
        try {
          rightPlayer.seekTo(0);
          rightPlayer.volume = 0.45;
          rightPlayer.play();
        } catch (error) {
          console.warn('[preparation] stereo right cue failed', error);
          setAudioCheck('failed');
        }
      }, 420);
    } catch (error) {
      console.warn('[preparation] stereo audio check failed', error);
      setAudioCheck('failed');
    }
  };

  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <View style={styles.content}>
        <SessionWizardProgress active={0} />
        <View style={styles.icon}><Text style={styles.iconText}>◌</Text></View>
        <Text style={styles.eyebrow}>PHASE 2 · PREPARATION</Text>
        <Text style={styles.heading}>Find a place inside that feels steady.</Text>
        <Text style={styles.body}>Bring to mind a calm or safe place. It can be real or imagined. Notice one detail you can see, hear, or feel.</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>A gentle check-in</Text>
          <Text style={styles.cardBody}>Are you somewhere private enough to pause if needed? Do you feel supported enough to continue?</Text>
        </View>
        <View accessible accessibilityRole="radiogroup" accessibilityLabel="Choose your pause plan" style={styles.pausePlan}><Text style={styles.pauseTitle}>Choose your pause plan</Text><Text style={styles.pauseBody}>If the set feels too much, use the plan you chose. This is practice guidance, not a clinical instruction.</Text><View style={styles.pauseOptions}>{([{ id: 'pause', label: 'Pause and orient' }, { id: 'ground', label: 'Ground instead' }, { id: 'stop', label: 'Stop and contact therapist' }] as const).map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: pausePlan === item.id }} accessibilityLabel={`${item.label}${pausePlan === item.id ? ', selected' : ''}`} onPress={() => { haptic.light(); setPausePlan(item.id); }} style={[styles.pauseOption, pausePlan === item.id && styles.pauseOptionActive]}><Text style={[styles.pauseOptionText, pausePlan === item.id && styles.pauseOptionTextActive]}>{item.label}</Text></Pressable>)}</View></View>
        {audioRequested ? (
          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={audioCheck === 'failed'
              ? getBlsAudioStatusLabel({ enabled: true, unavailable: true, playing: false, volume: 0.45 })
              : audioCheck === 'idle'
                ? 'Optional audio check. Test each side before continuing, or use visual BLS only.'
                : `${audioCheck === 'stereo' ? 'Stereo' : audioCheck === 'left' ? 'Left' : 'Right'} audio cue played. Test the other side if helpful.`}
            style={styles.audioCard}
          >
            <Text style={styles.cardTitle}>Optional audio check</Text>
            <Text style={styles.cardBody}>Use a low, comfortable volume. The app caps cue volume at a conservative ceiling. If headphones or Bluetooth disconnect, audio may stop; visual BLS remains available.</Text>
            <View style={styles.audioButtons}>
              <Pressable accessibilityRole="button" accessibilityLabel="Test left audio cue" onPress={() => { void checkCue('left'); }} style={styles.audioButton}><Text style={styles.audioButtonText}>Test left</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Test right audio cue" onPress={() => { void checkCue('right'); }} style={styles.audioButton}><Text style={styles.audioButtonText}>Test right</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Test stereo left then right audio cues" onPress={() => { void checkStereo(); }} style={styles.audioButton}><Text style={styles.audioButtonText}>Test stereo</Text></Pressable>
            </View>
            <Text accessibilityRole={audioCheck === 'failed' ? 'alert' : undefined} style={styles.audioStatus}>
              {audioCheck === 'failed' ? 'Audio could not play here. Continue with visual BLS or use grounding.' : audioCheck === 'idle' ? 'Not tested yet' : `${audioCheck === 'stereo' ? 'Stereo sequence played' : `${audioCheck === 'left' ? 'Left' : 'Right'} cue played`}`}
            </Text>
            {audioCheck === 'stereo' ? (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackQuestion}>Did left/right separation feel clear?</Text>
                <View style={styles.feedbackButtons}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Confirm left and right audio separation was clear" onPress={() => { void recordStereoFeedback('clear'); }} style={[styles.feedbackButton, stereoFeedback === 'clear' && styles.feedbackButtonActive]}><Text style={[styles.feedbackText, stereoFeedback === 'clear' && styles.feedbackTextActive]}>Clear</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel="Report that left and right audio separation was unclear" onPress={() => { void recordStereoFeedback('unclear'); }} style={[styles.feedbackButton, stereoFeedback === 'unclear' && styles.feedbackButtonActive]}><Text style={[styles.feedbackText, stereoFeedback === 'unclear' && styles.feedbackTextActive]}>Not sure</Text></Pressable>
                </View>
                {stereoFeedback === 'unclear' ? <Text style={styles.feedbackHint}>Keep audio off or use visual BLS until the route or headphones are checked.</Text> : null}{savedStereoFeedback ? <Text style={styles.feedbackHint}>Last saved check: {savedStereoFeedback === 'clear' ? 'separation was clear.' : 'separation was uncertain.'}</Text> : null}{feedbackSaveError ? <Text accessibilityRole="alert" style={styles.feedbackHint}>This check could not be saved locally. Your current choice remains visible; try again if needed.</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}
        <Pressable onPress={() => { haptic.light(); router.push({ pathname: '/session/assessment', params: { ...sessionParams, pausePlan } as Record<string, string> }); }} style={styles.button}><Text style={styles.buttonText}>I feel ready to continue</Text></Pressable>
        <Pressable onPress={() => router.push('/session/grounding')}><Text style={styles.secondary}>I’d rather ground first</Text></Pressable>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>Back</Text></Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: 16 },
  icon: { width: 72, height: 72, borderRadius: 28, backgroundColor: '#DCEBE5', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  iconText: { fontSize: 42, color: '#2F6F68' },
  eyebrow: { color: '#2F6F68', fontSize: 12, letterSpacing: 1.4, fontWeight: '700', textAlign: 'center' },
  heading: { color: '#16252D', fontSize: 30, lineHeight: 36, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5 },
  body: { color: '#60716F', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  card: { backgroundColor: '#E8E5F2', borderRadius: 18, padding: 18, marginTop: 8 },
  cardTitle: { color: '#16252D', fontSize: 15, fontWeight: '700', marginBottom: 5 },
  cardBody: { color: '#60716F', fontSize: 13, lineHeight: 19 },
  pausePlan: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#D9E2DE' },
  pauseTitle: { color: '#16252D', fontSize: 14, fontWeight: '800', marginBottom: 4 },
  pauseBody: { color: '#60716F', fontSize: 12, lineHeight: 17 },
  pauseOptions: { gap: 8, marginTop: 11 },
  pauseOption: { borderWidth: 1, borderColor: '#D9E2DE', borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12 },
  pauseOptionActive: { backgroundColor: '#DCEBE5', borderColor: '#2F6F68' },
  pauseOptionText: { color: '#60716F', fontSize: 12, fontWeight: '700' },
  pauseOptionTextActive: { color: '#2F6F68' },
  audioCard: { backgroundColor: '#DCEBE5', borderRadius: 18, padding: 18, marginTop: 0 },
  audioButtons: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  audioButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', paddingVertical: 11 },
  audioButtonText: { color: '#2F6F68', fontSize: 12, fontWeight: '800' },
  audioStatus: { color: '#60716F', fontSize: 12, lineHeight: 18, marginTop: 9 },
  feedbackBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#BFD8D0' },
  feedbackQuestion: { color: '#2F6F68', fontSize: 12, fontWeight: '800' },
  feedbackButtons: { flexDirection: 'row', gap: 8, marginTop: 7 },
  feedbackButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', paddingVertical: 8 },
  feedbackButtonActive: { backgroundColor: '#2F6F68' },
  feedbackText: { color: '#2F6F68', fontSize: 11, fontWeight: '800' },
  feedbackTextActive: { color: '#FFFFFF' },
  feedbackHint: { color: '#60716F', fontSize: 11, lineHeight: 16, marginTop: 7 },
  button: { backgroundColor: '#2F6F68', borderRadius: 15, alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondary: { textAlign: 'center', color: '#2F6F68', fontSize: 14, fontWeight: '700', padding: 6 },
  back: { textAlign: 'center', color: '#60716F', fontSize: 13, fontWeight: '700', padding: 6 },
});
