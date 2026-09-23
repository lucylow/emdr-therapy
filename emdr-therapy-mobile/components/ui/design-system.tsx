import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export const DS = {
  ink: '#16252D',
  muted: '#60716F',
  canvas: '#F4F7F5',
  surface: '#FFFFFF',
  deep: '#2F6F68',
  deepDark: '#234F4A',
  mint: '#DCEBE5',
  aqua: '#B8D8D2',
  lavender: '#E8E5F2',
  coral: '#B84C4C',
  amber: '#B97932',
  line: '#D9E2DE',
  darkCanvas: '#14211F',
};

export function BilateralMark({ size = 42, dark = false }: { size?: number; dark?: boolean }) {
  const dot = dark ? '#FFF9E8' : DS.deep;
  const arc = dark ? DS.aqua : DS.aqua;
  return <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: dark ? DS.deepDark : DS.mint }]}><View style={[styles.arc, styles.arcLeft, { width: size * 0.46, height: size * 0.32, borderColor: arc, borderRightColor: 'transparent', borderBottomColor: 'transparent' }]} /><View style={[styles.arc, styles.arcRight, { width: size * 0.46, height: size * 0.32, borderColor: arc, borderLeftColor: 'transparent', borderBottomColor: 'transparent' }]} /><View style={[styles.markDot, { width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09, backgroundColor: dot }]} /></View>;
}

export function SectionLabel({ children, right }: { children: string; right?: string }) { return <View style={styles.sectionRow}><Text style={styles.sectionLabel}>{children}</Text>{right ? <Text style={styles.sectionRight}>{right}</Text> : null}</View>; }

export function Card({ children, tint, style }: { children: React.ReactNode; tint?: string; style?: object }) { return <View style={[styles.card, tint ? { backgroundColor: tint } : null, style]}>{children}</View>; }

export function PrimaryButton({ children, onPress, icon = 'chevron.right', disabled }: PressableProps & { children: string; icon?: any }) { return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{children}</Text>{icon ? <IconSymbol name={icon} size={18} color="#FFFFFF" /> : null}</Pressable>; }

export function Metric({ value, label, accent = DS.deep }: { value: string; label: string; accent?: string }) { return <View style={styles.metric}><Text style={[styles.metricValue, { color: accent }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) { return <View style={styles.segmented}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.segment, option.value === value && styles.segmentActive]}><Text style={[styles.segmentText, option.value === value && styles.segmentTextActive]}>{option.label}</Text></Pressable>)}</View>; }

export function ProgressLine({ values }: { values: number[] }) { return <View style={styles.chart}>{values.map((value, index) => <View key={`${value}-${index}`} style={styles.chartColumn}><View style={[styles.chartBar, { height: Math.max(12, value * 3) }]} /><Text style={styles.chartCaption}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text></View>)}</View>; }

const styles = StyleSheet.create({ mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, markDot: { zIndex: 2 }, arc: { position: 'absolute', borderWidth: 1.6, borderRadius: 999 }, arcLeft: { right: '48%', transform: [{ rotate: '-22deg' }] }, arcRight: { left: '48%', transform: [{ rotate: '22deg' }] }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 }, sectionLabel: { color: DS.ink, fontSize: 17, fontWeight: '700' }, sectionRight: { color: DS.deep, fontSize: 12, fontWeight: '700' }, card: { backgroundColor: DS.surface, borderWidth: 1, borderColor: DS.line, borderRadius: 20, padding: 16 }, primaryButton: { backgroundColor: DS.deep, minHeight: 50, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }, primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, metric: { flex: 1 }, metricValue: { fontSize: 24, fontWeight: '700', marginBottom: 3 }, metricLabel: { color: DS.muted, fontSize: 11 }, segmented: { flexDirection: 'row', backgroundColor: DS.mint, borderRadius: 13, padding: 3 }, segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 }, segmentActive: { backgroundColor: DS.surface }, segmentText: { color: DS.muted, fontSize: 12, fontWeight: '700' }, segmentTextActive: { color: DS.ink }, chart: { height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 8 }, chartColumn: { alignItems: 'center', justifyContent: 'flex-end', gap: 6 }, chartBar: { width: 10, maxHeight: 70, borderRadius: 5, backgroundColor: DS.deep }, chartCaption: { color: DS.muted, fontSize: 9 } });
