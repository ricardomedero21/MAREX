import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { theme, BG_GRADIENT } from '../theme';

// Fondo de cabina: degradado vertical negro + dos glows radiales (azul/cyan)
// que dan profundidad atmosférica, estilo Tesla/SpaceX.
export function ScreenBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={BG_GRADIENT} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowTop" cx="50%" cy="0%" r="70%">
            <Stop offset="0%" stopColor="#1E6FFF" stopOpacity={0.22} />
            <Stop offset="60%" stopColor="#1E6FFF" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowAccent" cx="85%" cy="22%" r="55%">
            <Stop offset="0%" stopColor="#00D4FF" stopOpacity={0.12} />
            <Stop offset="70%" stopColor="#00D4FF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowTop)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowAccent)" />
      </Svg>
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.root, style]}>
      <ScreenBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
});
