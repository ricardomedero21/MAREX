import { useEffect, useRef, useState } from 'react';
import { Sample, sample } from './simulator';
import { fetchState } from './api';
import { useSettings } from './SettingsContext';

export type ConnState = 'connecting' | 'live' | 'sim';

// Estado del barco con polling al backend. Si el backend responde, usa sus
// datos reales (ConnState 'live'). Si falla, cae al simulador local ('sim'),
// de modo que la app siempre muestra algo (offline-first).
export function useBoatState(intervalMs = 1000): { data: Sample; conn: ConnState } {
  const { serverUrl } = useSettings();
  const start = useRef(Date.now());
  const [data, setData] = useState<Sample>(() => sample(0));
  const [conn, setConn] = useState<ConnState>('connecting');

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const partial = await fetchState(serverUrl);
        if (cancelled) return;
        setData((prev) => ({ ...prev, ...partial }));
        setConn('live');
      } catch {
        if (cancelled) return;
        const elapsed = (Date.now() - start.current) / 1000;
        setData(sample(elapsed));
        setConn((c) => (c === 'live' ? 'sim' : c === 'connecting' ? 'sim' : 'sim'));
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [serverUrl, intervalMs]);

  return { data, conn };
}
