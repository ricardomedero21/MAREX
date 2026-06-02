// Tema oscuro náutico de Marex — tokens del diseño de Claude Design.
// Instrumento marino premium (estilo Garmin/Rolex), glow sutil.
export const theme = {
  colors: {
    background: '#0A0E1A', // fondo principal — casi negro azul marino
    surface: '#111827', // tarjetas y módulos
    surfaceElevated: '#1C2333', // modales, sheets, tab bar
    surfaceHi: '#232C40', // hover / borde superior elevado
    primary: '#1E6FFF', // azul eléctrico — acento principal
    accent: '#00D4FF', // cyan náutico
    ok: '#00C896', // estado seguro
    warning: '#FFB800', // alerta moderada
    danger: '#FF3B30', // peligro / crítico
    text: '#F5F7FF', // texto principal
    textMuted: '#6B7A99', // labels y subtítulos

    // tintes
    hairline: 'rgba(120,150,200,0.12)',
    hairlineStrong: 'rgba(120,150,200,0.20)',
    dangerTint: 'rgba(255,59,48,0.08)',
    okTint: 'rgba(0,200,150,0.10)',
    warningTint: 'rgba(255,184,0,0.10)',
    primaryTint: 'rgba(30,111,255,0.12)',
    accentTint: 'rgba(0,212,255,0.10)',
  },
  radius: 20,
  radiusSm: 14,
};

export type Theme = typeof theme;

// Estados de alerta (4): OK · ADVERTENCIA · PELIGRO · SIN DATOS
export type AlertState = 'ok' | 'warn' | 'danger' | 'nodata';

export const STATUS: Record<AlertState, { color: string; bg: string; label: string }> = {
  ok: { color: theme.colors.ok, bg: theme.colors.okTint, label: 'OK' },
  warn: { color: theme.colors.warning, bg: theme.colors.warningTint, label: 'ADVERTENCIA' },
  danger: { color: theme.colors.danger, bg: theme.colors.dangerTint, label: 'PELIGRO' },
  nodata: { color: theme.colors.textMuted, bg: 'rgba(107,122,153,0.12)', label: 'SIN DATOS' },
};
