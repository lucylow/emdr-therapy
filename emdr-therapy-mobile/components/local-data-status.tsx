import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type StatusVariant = 'info' | 'warning';

const COLORS = { ink: '#16252D', muted: '#776345', action: '#2F6F68', infoBackground: '#E8F3EF', infoBorder: '#C8DED6', warningBackground: '#FFF7E9', warningBorder: '#E8D7B8' };

export function LocalDataStatus({ title, message, onRetry, busy = false, variant = 'warning' }: { title: string; message: string; onRetry?: () => void; busy?: boolean; variant?: StatusVariant }) {
  const isInfo = variant === 'info';
  return (
    <View accessibilityRole={isInfo ? 'text' : 'alert'} style={[styles.card, isInfo ? styles.infoCard : styles.warningCard]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <Pressable accessibilityRole="button" accessibilityLabel={busy ? 'Retrying local data' : 'Try reading local data again'} accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={onRetry} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        {busy ? <ActivityIndicator size="small" color={COLORS.action} /> : <Text style={styles.actionText}>Try again</Text>}
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  infoCard: { backgroundColor: COLORS.infoBackground, borderColor: COLORS.infoBorder },
  warningCard: { backgroundColor: COLORS.warningBackground, borderColor: COLORS.warningBorder },
  title: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  message: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  action: { alignSelf: 'flex-start', minHeight: 30, flexDirection: 'row', alignItems: 'center', marginTop: 7 },
  actionText: { color: COLORS.action, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
