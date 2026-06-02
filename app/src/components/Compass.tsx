import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { theme } from '../theme';
import { cardinal } from '../format';

// Brújula instrumental: dial con ticks que rota según el rumbo,
// lectura fija al centro y puntero de proa fijo arriba.
export function Compass({ heading, size = 150 }: { heading: number; size?: number }) {
  const h = ((heading % 360) + 360) % 360;
  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const major = i % 9 === 0;
    const a = (i * 5 * Math.PI) / 180;
    const r1 = size / 2 - (major ? 16 : 9);
    const r2 = size / 2 - 5;
    ticks.push(
      <Line
        key={i}
        x1={size / 2 + r1 * Math.sin(a)}
        y1={size / 2 - r1 * Math.cos(a)}
        x2={size / 2 + r2 * Math.sin(a)}
        y2={size / 2 - r2 * Math.cos(a)}
        stroke={major ? 'rgba(0,212,255,0.55)' : 'rgba(120,150,200,0.22)'}
        strokeWidth={major ? 1.6 : 1}
        strokeLinecap="round"
      />,
    );
  }
  const dirs: [string, number][] = [
    ['N', 0],
    ['E', 90],
    ['S', 180],
    ['O', 270],
  ];
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="#0B101D" stroke={theme.colors.hairlineStrong} strokeWidth={1} />
        <G rotation={-h} origin={`${size / 2}, ${size / 2}`}>
          {ticks}
        </G>
      </Svg>
      {/* etiquetas cardinales rotan con el dial */}
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${-h}deg` }] }]}>
        {dirs.map(([d, deg]) => {
          const a = (deg * Math.PI) / 180;
          const r = size / 2 - 26;
          return (
            <Text
              key={d}
              style={{
                position: 'absolute',
                left: size / 2 - 8 + r * Math.sin(a),
                top: size / 2 - 10 - r * Math.cos(a),
                width: 16,
                textAlign: 'center',
                fontSize: d === 'N' ? 15 : 12,
                fontWeight: '600',
                color: d === 'N' ? theme.colors.danger : theme.colors.textMuted,
                transform: [{ rotate: `${h}deg` }],
              }}
            >
              {d}
            </Text>
          );
        })}
      </View>
      {/* lectura fija al centro */}
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.heading}>{Math.round(h)}°</Text>
        <Text style={styles.headingLabel}>RUMBO · {cardinal(h)}</Text>
      </View>
      {/* puntero de proa fijo */}
      <View style={styles.pointer} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 32, fontWeight: '300', letterSpacing: -1, color: theme.colors.text, lineHeight: 34 },
  headingLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  pointer: {
    position: 'absolute',
    left: '50%',
    top: 4,
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.accent,
  },
});
