import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

type CardState = 'normal' | 'warning' | 'danger';

const MAP: Record<CardState, { ring: string; val: string }> = {
  normal: { ring: theme.colors.hairline, val: theme.colors.text },
  warning: { ring: 'rgba(255,184,0,0.45)', val: theme.colors.warning },
  danger: { ring: 'rgba(255,59,48,0.55)', val: theme.colors.danger },
};

export function StatCard({
  label,
  value,
  unit,
  icon,
  state = 'normal',
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: React.ReactNode;
  state?: CardState;
  sub?: string;
}) {
  const m = MAP[state];
  return (
    <View style={[styles.card, { borderColor: m.ring }]}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <View style={{ opacity: 0.8 }}>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: m.val }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 15,
    borderWidth: 0.5,
    gap: 8,
    minWidth: 0,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { fontSize: 32, fontWeight: '300', letterSpacing: -0.8, lineHeight: 34 },
  unit: { fontSize: 15, fontWeight: '400', color: theme.colors.textMuted },
  sub: { fontSize: 12, color: theme.colors.textMuted },
});
