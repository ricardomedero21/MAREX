import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { useSettings } from '../SettingsContext';
import { formatDepth } from '../format';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { MarexMark } from '../components/MarexMark';
import { Ic } from '../components/icons';

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>
        {items.map((c, i) => (
          <View key={i}>
            {i > 0 ? <View style={styles.rowDivider} /> : null}
            {c}
          </View>
        ))}
      </View>
    </View>
  );
}

function Row({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SettingsScreen() {
  const { depthUnit, setDepthUnit, depthAlarm, setDepthAlarm, boatName, setBoatName } = useSettings();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header title="Ajustes" sub="EMBARCACIÓN" />

      {/* tarjeta de embarcación */}
      <View style={styles.section}>
        <Card style={styles.vessel}>
          <View style={styles.vesselIcon}>
            <MarexMark size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.vesselName}
              value={boatName}
              onChangeText={setBoatName}
              placeholder="Marex"
              placeholderTextColor={theme.colors.textMuted}
            />
            <Text style={styles.vesselSub}>Toca para editar el nombre</Text>
          </View>
          <StatusBadge state="ok" text="CONECTADO" />
        </Card>
      </View>

      <Group title="Instrumentos">
        <Row
          icon={<Ic.gauge size={20} color={theme.colors.accent} />}
          title="Unidad de profundidad"
          right={
            <View style={styles.segment}>
              {(['m', 'ft'] as const).map((u) => (
                <Pressable
                  key={u}
                  style={[styles.segBtn, depthUnit === u && styles.segActive]}
                  onPress={() => setDepthUnit(u)}
                >
                  <Text style={[styles.segText, depthUnit === u && styles.segTextActive]}>
                    {u === 'm' ? 'Metros' : 'Pies'}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
        />
      </Group>

      <Group title="Seguridad">
        <Row
          icon={<Ic.anchor size={20} color={theme.colors.accent} />}
          title="Umbral de profundidad baja"
          sub={`Marex avisa por debajo de ${formatDepth(depthAlarm, depthUnit)}`}
          right={
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setDepthAlarm(Math.max(1, depthAlarm - 1))}>
                <Ic.minus size={18} color={theme.colors.text} />
              </Pressable>
              <Text style={styles.stepValue}>{depthAlarm}</Text>
              <Pressable style={styles.stepBtn} onPress={() => setDepthAlarm(depthAlarm + 1)}>
                <Ic.plus size={18} color={theme.colors.text} />
              </Pressable>
            </View>
          }
        />
        <Row icon={<Ic.geofence size={20} color={theme.colors.accent} />} title="Alarma de zona (geofence)" sub="Próximamente" />
      </Group>

      <Group title="Marex IA">
        <Row icon={<Ic.compass size={20} color={theme.colors.accent} />} title="Avisos proactivos" sub="La IA te avisa de riesgos (Fase 2)" />
        <Row icon={<Ic.mic size={20} color={theme.colors.accent} />} title="Control por voz" sub="Próximamente (Fase 2)" />
      </Group>

      <View style={styles.footer}>
        <MarexMark size={22} style={{ opacity: 0.5 }} />
        <Text style={styles.footerText}>MAREX · prototipo Fase 1 · datos simulados</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 130 },
  section: { paddingHorizontal: 18, marginBottom: 18 },
  vessel: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  vesselIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: theme.colors.hairlineStrong,
  },
  vesselName: { fontSize: 18, fontFamily: theme.font.display, color: theme.colors.text, padding: 0 },
  vesselSub: { fontSize: 11.5, fontFamily: theme.font.mono, color: theme.colors.textMuted, marginTop: 3 },
  groupTitle: {
    fontSize: 12,
    fontFamily: theme.font.label,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 9,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
    overflow: 'hidden',
  },
  rowDivider: { height: 0.5, backgroundColor: theme.colors.hairline, marginLeft: 68 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontFamily: theme.font.displayMed, color: theme.colors.text },
  rowSub: { fontSize: 11.5, fontFamily: theme.font.mono, color: theme.colors.textMuted, marginTop: 3 },
  segment: { flexDirection: 'row', backgroundColor: theme.colors.background, borderRadius: 10, padding: 3, gap: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  segActive: { backgroundColor: theme.colors.primary },
  segText: { color: theme.colors.textMuted, fontFamily: theme.font.label, letterSpacing: 0.5, fontSize: 12 },
  segTextActive: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: theme.colors.surfaceHi,
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: 19, fontFamily: theme.font.displayMed, color: theme.colors.text, minWidth: 28, textAlign: 'center' },
  footer: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  footerText: { fontSize: 10.5, fontFamily: theme.font.mono, color: theme.colors.textMuted, letterSpacing: 1 },
});
