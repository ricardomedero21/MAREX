import { DepthUnit } from './SettingsContext';

const M_TO_FT = 3.28084;

export function depthInUnit(meters: number, unit: DepthUnit): number {
  return unit === 'ft' ? meters * M_TO_FT : meters;
}

export function formatDepth(meters: number, unit: DepthUnit): string {
  return `${depthInUnit(meters, unit).toFixed(1)} ${unit}`;
}

// Grados decimales -> grados + minutos decimales (formato náutico).
function toDM(value: number, pos: string, neg: string): string {
  const hemi = value >= 0 ? pos : neg;
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg}° ${min.toFixed(1)}′ ${hemi}`;
}

export function formatLat(lat: number): string {
  return toDM(lat, 'N', 'S');
}

export function formatLon(lon: number): string {
  return toDM(lon, 'E', 'O');
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

export function cardinal(deg: number): string {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}
