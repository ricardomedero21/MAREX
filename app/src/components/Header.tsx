import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { MarexMark } from './MarexMark';

export function Header({
  title,
  sub,
  right,
  showLogo,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  showLogo?: boolean;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showLogo ? <MarexMark size={30} /> : null}
        <View>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  sub: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 3,
  },
  title: { fontSize: 26, fontWeight: '600', letterSpacing: -0.6, color: theme.colors.text },
});
