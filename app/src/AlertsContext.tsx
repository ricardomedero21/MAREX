import React, { createContext, useContext, useEffect, useState } from 'react';
import { AlertOut, fetchAlerts } from './api';
import { useSettings } from './SettingsContext';

type AlertsCtx = {
  alerts: AlertOut[];
  activeCount: number; // alertas en warn o danger
  offline: boolean;
  refresh: () => void;
};

const Ctx = createContext<AlertsCtx | null>(null);

// Polling global de alertas: alimenta tanto el badge de la TabBar como la
// pantalla de Alertas, así el badge refleja el estado real.
export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { serverUrl } = useSettings();
  const [alerts, setAlerts] = useState<AlertOut[]>([]);
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const a = await fetchAlerts(serverUrl);
        if (cancelled) return;
        setAlerts(a);
        setOffline(false);
      } catch {
        if (cancelled) return;
        setAlerts([]);
        setOffline(true);
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [serverUrl, tick]);

  const activeCount = alerts.filter((a) => a.state === 'danger' || a.state === 'warn').length;

  return (
    <Ctx.Provider value={{ alerts, activeCount, offline, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAlerts(): AlertsCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAlerts debe usarse dentro de <AlertsProvider>');
  return v;
}
