import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme, AlertState } from '../theme';

// Tarjeta base. state 'danger'/'warn' tiñe el borde.
export function Card({
  children,
  style,
  state,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  state?: AlertState;
}) {
  const ring =
    state === 'danger'
      ? 'rgba(255,59,48,0.45)'
      : state === 'warn'
        ? 'rgba(255,184,0,0.40)'
        : theme.colors.hairline;
  return <View style={[styles.card, { borderColor: ring }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    padding: 16,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
});
