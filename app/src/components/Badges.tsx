import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { theme, STATUS, AlertState } from '../theme';

// Punto pulsante reutilizable.
function PulseDot({ color, size = 7 }: { color: string; size?: number }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: anim,
        transform: [{ scale: anim }],
      }}
    />
  );
}

export function LivePill({
  label = 'EN VIVO',
  color = theme.colors.ok,
}: {
  label?: string;
  color?: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: 'rgba(0,200,150,0.10)', borderColor: 'rgba(0,200,150,0.30)' }]}>
      <PulseDot color={color} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ state = 'ok', text }: { state?: AlertState; text?: string }) {
  const s = STATUS[state];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, borderColor: s.color + '33' }]}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.color }} />
      <Text style={[styles.badgeText, { color: s.color }]}>{text || s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  pillText: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  badgeText: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.8 },
});
