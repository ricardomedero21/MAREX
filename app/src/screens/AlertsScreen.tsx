import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme, STATUS, AlertState } from '../theme';
import { useSimulator } from '../simulator';
import { useSettings } from '../SettingsContext';
import { formatDepth } from '../format';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { Ic, IconName } from '../components/icons';

type Alert = { state: AlertState; icon: IconName; title: string; desc: string; time: string };

function AlertRow({ a }: { a: Alert }) {
  const s = STATUS[a.state];
  const Icon = Ic[a.icon];
  return (
    <Card state={a.state} style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: s.bg, borderColor: s.color + '40' }]}>
        <Icon size={21} color={s.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.time}>{a.time}</Text>
        </View>
        <Text style={styles.desc}>{a.desc}</Text>
      </View>
    </Card>
  );
}

export function AlertsScreen() {
  const data = useSimulator();
  const { depthUnit, depthAlarm } = useSettings();
  const shallow = data.depth < depthAlarm;

  const alerts: Alert[] = [
    {
      state: shallow ? 'danger' : 'ok',
      icon: 'anchor',
      title: 'Profundidad baja',
      desc: shallow
        ? `Profundidad ${formatDepth(data.depth, depthUnit)} bajo el umbral (${formatDepth(depthAlarm, depthUnit)}).`
        : `Profundidad ${formatDepth(data.depth, depthUnit)} · umbral ${formatDepth(depthAlarm, depthUnit)}.`,
      time: 'Ahora',
    },
    { state: 'nodata', icon: 'battery', title: 'Batería baja', desc: 'Requiere gateway de datos del motor (Fase 2).', time: '—' },
    { state: 'nodata', icon: 'fuel', title: 'Combustible insuficiente', desc: 'Requiere consumo del motor (Fase 2).', time: '—' },
    { state: 'ok', icon: 'geofence', title: 'Garreo del fondeo', desc: 'Sin fondeo activo en este momento.', time: 'Ahora' },
    { state: 'ok', icon: 'gps', title: 'Salida de zona (geofence)', desc: 'Sin zona definida.', time: 'Ahora' },
  ];

  const critical = alerts.filter((a) => a.state === 'danger').length;
  const unresolved = alerts.filter((a) => a.state === 'danger' || a.state === 'warn').length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header
        sub={`${unresolved} SIN RESOLVER`}
        title="Alertas"
        right={critical > 0 ? <StatusBadge state="danger" text={`${critical} CRÍTICA`} /> : <StatusBadge state="ok" text="TODO OK" />}
      />
      <View style={styles.list}>
        {alerts.map((a, i) => (
          <AlertRow key={i} a={a} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 130 },
  list: { paddingHorizontal: 18, gap: 11 },
  row: { flexDirection: 'row', gap: 13, alignItems: 'flex-start', paddingVertical: 15, paddingHorizontal: 16 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.2, color: theme.colors.text, flex: 1 },
  time: { fontSize: 11, color: theme.colors.textMuted },
  desc: { fontSize: 13, color: theme.colors.textMuted, marginTop: 5, lineHeight: 19 },
});
