import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme, STATUS, AlertState } from '../theme';
import { useSettings } from '../SettingsContext';
import { AlertOut, fetchAlerts, fetchConfig, setAnchor, setGeofence } from '../api';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/Badges';
import { Ic, IconName } from '../components/icons';
import { Reveal } from '../components/Reveal';

// Ícono por clave de alerta del backend.
const ICONS: Record<string, IconName> = {
  depth_low: 'anchor',
  battery_low: 'battery',
  fuel_low: 'fuel',
  anchor_drag: 'anchor',
  geofence: 'geofence',
};

function AlertRow({ a }: { a: AlertOut }) {
  const s = STATUS[a.state as AlertState];
  const Icon = Ic[ICONS[a.key] ?? 'alert'];
  return (
    <Card state={a.state as AlertState} style={styles.row}>
      <View style={[styles.iconBox, { backgroundColor: s.bg, borderColor: s.color + '40' }]}>
        <Icon size={21} color={s.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{a.title}</Text>
          <StatusBadge state={a.state as AlertState} />
        </View>
        <Text style={styles.desc}>{a.detail}</Text>
      </View>
    </Card>
  );
}

export function AlertsScreen() {
  const { serverUrl } = useSettings();
  const [alerts, setAlerts] = useState<AlertOut[]>([]);
  const [anchorSet, setAnchorSet] = useState(false);
  const [geofenceSet, setGeofenceSet] = useState(false);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([fetchAlerts(serverUrl), fetchConfig(serverUrl)]);
      setAlerts(a);
      setAnchorSet(c.anchor_set);
      setGeofenceSet(c.geofence_set);
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, [serverUrl]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  async function toggleAnchor() {
    try {
      const c = await setAnchor(serverUrl, anchorSet);
      setAnchorSet(c.anchor_set);
      refresh();
    } catch {
      setOffline(true);
    }
  }

  async function toggleGeofence() {
    try {
      const c = await setGeofence(serverUrl, geofenceSet);
      setGeofenceSet(c.geofence_set);
      refresh();
    } catch {
      setOffline(true);
    }
  }

  const critical = alerts.filter((a) => a.state === 'danger').length;
  const unresolved = alerts.filter((a) => a.state === 'danger' || a.state === 'warn').length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Header
        sub={offline ? 'SIN CONEXIÓN' : `${unresolved} SIN RESOLVER`}
        title="Alertas"
        right={
          critical > 0 ? (
            <StatusBadge state="danger" text={`${critical} CRÍTICA`} />
          ) : (
            <StatusBadge state="ok" text="TODO OK" />
          )
        }
      />

      {/* acciones de seguridad */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.action, anchorSet && styles.actionOn]}
          onPress={toggleAnchor}
        >
          <Ic.anchor size={18} color={anchorSet ? theme.colors.accent : theme.colors.textMuted} />
          <Text style={[styles.actionText, anchorSet && { color: theme.colors.accent }]}>
            {anchorSet ? 'Fondeo activo' : 'Fondear aquí'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.action, geofenceSet && styles.actionOn]}
          onPress={toggleGeofence}
        >
          <Ic.geofence size={18} color={geofenceSet ? theme.colors.accent : theme.colors.textMuted} />
          <Text style={[styles.actionText, geofenceSet && { color: theme.colors.accent }]}>
            {geofenceSet ? 'Zona activa' : 'Definir zona aquí'}
          </Text>
        </Pressable>
      </View>

      {offline ? (
        <Text style={styles.offline}>
          Sin conexión con el servidor de Marex. Verifica que esté encendido (Ajustes › Servidor).
        </Text>
      ) : (
        <View style={styles.list}>
          {alerts.map((a, i) => (
            <Reveal key={a.key} delay={40 + i * 60}>
              <AlertRow a={a} />
            </Reveal>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 130 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, marginBottom: 14 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.colors.surface,
    borderWidth: 0.5,
    borderColor: theme.colors.hairline,
  },
  actionOn: { borderColor: theme.colors.accent + '66', backgroundColor: theme.colors.accentTint },
  actionText: { fontSize: 12.5, fontFamily: theme.font.label, letterSpacing: 0.5, color: theme.colors.textMuted },
  offline: {
    marginHorizontal: 18,
    color: theme.colors.textMuted,
    fontFamily: theme.font.mono,
    fontSize: 13,
    lineHeight: 19,
  },
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
  title: { fontSize: 15.5, fontFamily: theme.font.displayMed, letterSpacing: -0.1, color: theme.colors.text, flex: 1 },
  desc: { fontSize: 12.5, fontFamily: theme.font.mono, color: theme.colors.textMuted, marginTop: 5, lineHeight: 18 },
});
