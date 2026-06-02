// Tema oscuro náutico de Marex — tokens del diseño de Claude Design.
// Instrumento marino premium (estilo Garmin/Rolex), glow sutil.
export const theme = {
  colors: {
    background: '#000000', // negro puro — cabina aeroespacial
    backgroundTop: '#0B1220', // tinte azul para el degradado superior
    backgroundMid: '#05070D', // medio del degradado
    surface: 'rgba(18,24,38,0.72)', // tarjetas (glass sobre negro)
    surfaceSolid: '#0E1320', // superficie sólida cuando hace falta
    surfaceElevated: 'rgba(22,28,44,0.86)', // tab bar, sheets
    surfaceHi: '#1A2236', // hover / botones internos
    primary: '#1E6FFF', // azul eléctrico — acento principal
    accent: '#00D4FF', // cyan náutico
    ok: '#00E0A4', // estado seguro
    warning: '#FFB800', // alerta moderada
    danger: '#FF3B30', // peligro / crítico
    text: '#F5F7FF', // texto principal
    textMuted: '#6B7A99', // labels y subtítulos

    // tintes
    hairline: 'rgba(120,150,200,0.10)',
    hairlineStrong: 'rgba(120,150,200,0.18)',
    dangerTint: 'rgba(255,59,48,0.08)',
    okTint: 'rgba(0,224,164,0.10)',
    warningTint: 'rgba(255,184,0,0.10)',
    primaryTint: 'rgba(30,111,255,0.12)',
    accentTint: 'rgba(0,212,255,0.10)',
  },
  // Fuentes aeroespaciales (cargadas en App.tsx).
  font: {
    display: 'Saira_600SemiBold', // títulos
    displayThin: 'Saira_200ExtraLight', // números grandes (telemetría)
    displayLight: 'Saira_300Light',
    displayMed: 'Saira_500Medium',
    label: 'Saira_500Medium', // labels en mayúscula
    mono: 'JetBrainsMono_400Regular', // datos técnicos / coordenadas
    monoMed: 'JetBrainsMono_500Medium',
  },
  radius: 22,
  radiusSm: 14,
};

export type Theme = typeof theme;

// Degradado de fondo tipo malla (cabina): negro con glow azul arriba.
export const BG_GRADIENT = ['#0B1220', '#05070D', '#000000'] as const;

// Estados de alerta (4): OK · ADVERTENCIA · PELIGRO · SIN DATOS
export type AlertState = 'ok' | 'warn' | 'danger' | 'nodata';

export const STATUS: Record<AlertState, { color: string; bg: string; label: string }> = {
  ok: { color: theme.colors.ok, bg: theme.colors.okTint, label: 'OK' },
  warn: { color: theme.colors.warning, bg: theme.colors.warningTint, label: 'ADVERTENCIA' },
  danger: { color: theme.colors.danger, bg: theme.colors.dangerTint, label: 'PELIGRO' },
  nodata: { color: theme.colors.textMuted, bg: 'rgba(107,122,153,0.12)', label: 'SIN DATOS' },
};
