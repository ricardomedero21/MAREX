import { useEffect, useRef, useState } from 'react';

// Espejo de backend/marex/sources/simulator.py para ver la app en vivo
// sin depender todavía de la API. Cuando exista la API real, se reemplaza
// useSimulator por un hook que lea del backend (WebSocket).

export type Sample = {
  depth: number; // metros
  sog: number; // nudos
  cog: number; // grados
  lat: number; // grados decimales
  lon: number; // grados decimales
  windSpeed: number; // nudos
  windAngle: number; // grados
};

const BASE_LAT = 25.7617;
const BASE_LON = -80.1918;

export function sample(elapsed: number): Sample {
  return {
    depth: 15 + 5 * Math.sin(elapsed / 30), // 10..20 m
    sog: 6 + 2 * Math.sin(elapsed / 20), // 4..8 kn
    cog: (elapsed * 2) % 360,
    lat: BASE_LAT + 0.0005 * Math.sin(elapsed / 60),
    lon: BASE_LON + 0.0005 * Math.cos(elapsed / 60),
    windSpeed: 12 + 4 * Math.sin(elapsed / 45), // 8..16 kn
    windAngle: (elapsed * 1.5) % 360,
  };
}

export function useSimulator(intervalMs = 1000): Sample {
  const start = useRef(Date.now());
  const [data, setData] = useState<Sample>(() => sample(0));
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - start.current) / 1000;
      setData(sample(elapsed));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return data;
}
