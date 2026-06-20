import { Sample } from './simulator';

// Capa de acceso al backend de Marex (FastAPI en la Jetson / PC).
// Si el backend no responde, las pantallas caen al simulador local.

export type SignalOut = { type: string; value: number; unit: string; timestamp: string };
type StateOut = { signals: SignalOut[] };

// Convierte la respuesta de /state al shape Sample que usan las pantallas.
export function signalsToSample(signals: SignalOut[]): Partial<Sample> {
  const by: Record<string, number> = {};
  for (const s of signals) by[s.type] = s.value;
  const out: Partial<Sample> = {};
  if ('depth' in by) out.depth = by.depth;
  if ('sog' in by) out.sog = by.sog;
  if ('cog' in by) out.cog = by.cog;
  if ('latitude' in by) out.lat = by.latitude;
  if ('longitude' in by) out.lon = by.longitude;
  if ('wind_speed' in by) out.windSpeed = by.wind_speed;
  if ('wind_angle' in by) out.windAngle = by.wind_angle;
  return out;
}

async function withTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function fetchState(baseUrl: string, timeoutMs = 4000): Promise<Partial<Sample>> {
  const res = await withTimeout(`${baseUrl}/state`, {}, timeoutMs);
  if (!res.ok) throw new Error(`state HTTP ${res.status}`);
  const data: StateOut = await res.json();
  return signalsToSample(data.signals);
}

export async function sendChat(baseUrl: string, message: string, timeoutMs = 120000): Promise<string> {
  const res = await withTimeout(
    `${baseUrl}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    },
    timeoutMs,
  );
  if (!res.ok) throw new Error(`chat HTTP ${res.status}`);
  const data: { reply: string } = await res.json();
  return data.reply;
}

export async function checkHealth(baseUrl: string, timeoutMs = 3000): Promise<boolean> {
  try {
    const res = await withTimeout(`${baseUrl}/health`, {}, timeoutMs);
    return res.ok;
  } catch {
    return false;
  }
}
