import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { Ic, IconName } from './icons';
import { MarexMark } from './MarexMark';

export type TabKey = 'panel' | 'alertas' | 'ia' | 'ajustes';

const TABS: { id: TabKey; label: string; icon: IconName; badge?: number }[] = [
  { id: 'panel', label: 'Panel', icon: 'gauge' },
  { id: 'alertas', label: 'Alertas', icon: 'bell', badge: 1 },
  { id: 'ia', label: 'Marex IA', icon: 'compass' },
  { id: 'ajustes', label: 'Ajustes', icon: 'gear' },
];

export function TabBar({ active, onNav }: { active: TabKey; onNav: (k: TabKey) => void }) {
  // Inserta el FAB central entre alertas (idx 1) e ia (idx 2).
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const renderTab = (t: (typeof TABS)[number]) => {
    const on = active === t.id;
    const color = on ? theme.colors.accent : theme.colors.textMuted;
    const Icon = Ic[t.icon];
    return (
      <Pressable key={t.id} style={styles.tab} onPress={() => onNav(t.id)}>
        <View>
          <Icon size={23} color={color} strokeWidth={on ? 2 : 1.8} />
          {t.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t.badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color, fontWeight: on ? '600' : '500' }]}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {left.map(renderTab)}
        <Pressable style={styles.fab} onPress={() => onNav('ia')}>
          <MarexMark size={30} variant="white" />
        </Pressable>
        {right.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 22,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  bar: {
    marginHorizontal: 14,
    height: 64,
    borderRadius: 26,
    backgroundColor: theme.colors.surfaceElevated,
    borderWidth: 0.5,
    borderColor: theme.colors.hairlineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  label: { fontSize: 10, letterSpacing: 0.2 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -34,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: theme.colors.background,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -7,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
});
