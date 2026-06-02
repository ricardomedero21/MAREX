import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
import { useSimulator } from '../simulator';
import { useSettings } from '../SettingsContext';
import { cardinal, formatLat, formatLon, depthInUnit } from '../format';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Compass } from '../components/Compass';
import { LivePill, StatusBadge } from '../components/Badges';
import { Ic } from '../components/icons';
import { Reveal } from '../components/Reveal';

export function DashboardScreen() {
  const data = useSimulator();
  const { depthUnit, depthAlarm, boatName } = useSettings();

  const depthVal = depthInUnit(data.depth, depthUnit);
  const shallow = data.depth < depthAlarm;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header showLogo sub={`EMBARCACIÓN · ${boatName.toUpperCase()}`} title="A bordo" right={<LivePill />} />

      {/* hero: brújula + profundidad/velocidad */}
      <Reveal delay={60} style={styles.section}>
        <Card style={styles.hero} state={shallow ? 'danger' : undefined}>
          <Compass heading={data.cog} size={150} />
          <View style={styles.heroRight}>
            <View>
              <View style={styles.labelRow}>
                <Ic.anchor size={13} color={theme.colors.textMuted} />
                <Text style={styles.label}>PROFUNDIDAD</Text>
              </View>
              <View style={styles.bigRow}>
                <Text style={[styles.big, shallow && { color: theme.colors.danger }]}>{depthVal.toFixed(1)}</Text>
                <Text style={styles.unit}>{depthUnit}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View>
              <View style={styles.labelRow}>
                <Ic.gauge size={13} color={theme.colors.textMuted} />
                <Text style={styles.label}>VELOCIDAD</Text>
              </View>
              <View style={styles.bigRow}>
                <Text style={styles.big}>{data.sog.toFixed(1)}</Text>
                <Text style={styles.unit}>nudos</Text>
              </View>
            </View>
          </View>
        </Card>
      </Reveal>

      {/* grid de stats */}
      <Reveal delay={140} style={styles.section}>
        <View style={styles.row}>
          <StatCard
            label="Viento"
            value={data.windSpeed.toFixed(0)}
            unit="kt"
            icon={<Ic.wind size={16} color={theme.colors.textMuted} />}
            sub={`${cardinal(data.windAngle)} · ${Math.round(data.windAngle)}°`}
          />
          <StatCard
            label="Temp. agua"
            value="21"
            unit="°C"
            icon={<Ic.temp size={16} color={theme.colors.textMuted} />}
            sub="Estable"
          />
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
          <StatCard
            label="Combustible"
            value="—"
            unit="%"
            icon={<Ic.fuel size={16} color={theme.colors.textMuted} />}
            state="normal"
            sub="Sensor Fase 2"
          />
          <StatCard
            label="Batería"
            value="—"
            unit="V"
            icon={<Ic.battery size={16} color={theme.colors.textMuted} />}
            sub="Sensor Fase 2"
          />
        </View>
      </Reveal>

      {/* posición / geofence */}
      <Reveal delay={220} style={styles.section}>
        <Card>
          <View style={styles.posHead}>
            <Text style={styles.sectionLabel}>Posición</Text>
            <StatusBadge state="ok" text="DENTRO DE ZONA" />
          </View>
          <View style={styles.miniMap}>
            <View style={styles.geofence} />
            <View style={styles.vessel} />
          </View>
          <View style={styles.posRow}>
            <View>
              <Text style={styles.label}>LATITUD</Text>
              <Text style={styles.posVal}>{formatLat(data.lat)}</Text>
            </View>
            <View>
              <Text style={styles.label}>LONGITUD</Text>
              <Text style={styles.posVal}>{formatLon(data.lon)}</Text>
            </View>
            <View>
              <Text style={styles.label}>FONDEO</Text>
              <Text style={[styles.posVal, { color: theme.colors.ok }]}>Firme</Text>
            </View>
          </View>
        </Card>
      </Reveal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 130 },
  section: { paddingHorizontal: 18, marginBottom: 14 },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16 },
  heroRight: { flex: 1, flexDirection: 'column', gap: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    fontSize: 10.5,
    fontFamily: theme.font.label,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 3 },
  big: { fontSize: 42, fontFamily: theme.font.displayThin, letterSpacing: -0.5, color: theme.colors.text },
  unit: { fontSize: 16, fontFamily: theme.font.mono, color: theme.colors.textMuted },
  divider: { height: 0.5, backgroundColor: theme.colors.hairline },
  row: { flexDirection: 'row', gap: 10 },
  posHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: theme.font.label,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
  },
  miniMap: {
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0a1422',
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofence: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.35)',
    borderStyle: 'dashed',
  },
  vessel: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  posRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  posVal: { fontSize: 13.5, fontFamily: theme.font.mono, color: theme.colors.text, marginTop: 4 },
});
