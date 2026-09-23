import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AudioStatusCardModel } from '@/lib/audio-status-card';

export function AudioStatusCard(props: {
  model: AudioStatusCardModel;
  audioRetrying: boolean;
  onRetry: () => void;
}) {
  const { model, audioRetrying, onRetry } = props;
  return <View accessible accessibilityRole="summary" accessibilityLabel={model.accessibilityLabel} style={styles.container}>
    <Text style={styles.title}>{model.title}</Text>
    {model.helperText ? <Text style={styles.helper}>{model.helperText}</Text> : null}
    {model.showRetry ? <Pressable accessibilityRole="button" accessibilityLabel={audioRetrying ? 'Retrying audio cues' : 'Retry audio cues'} accessibilityState={{ busy: audioRetrying, disabled: audioRetrying }} disabled={audioRetrying} onPress={onRetry} style={[styles.retry, audioRetrying && styles.disabled]}><Text style={styles.retryText}>{model.retryLabel}</Text></Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1E3833', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 },
  title: { color: '#B8D8D2', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  helper: { color: '#78958E', fontSize: 10, textAlign: 'center', marginTop: 3 },
  retry: { alignSelf: 'center', marginTop: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#294A44' },
  retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
