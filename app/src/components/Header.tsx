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
    fontSize: 10.5,
    fontFamily: theme.font.mono,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  title: { fontSize: 27, fontFamily: theme.font.display, letterSpacing: -0.3, color: theme.colors.text },
});
