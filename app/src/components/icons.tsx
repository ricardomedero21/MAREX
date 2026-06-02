import React from 'react';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

// Iconografía náutica (line icons, stroke currentColor) portada del diseño.
type IconProps = { size?: number; color?: string; strokeWidth?: number };

function make(
  children: (c: string, sw: number) => React.ReactNode,
  defaultSw = 1.8,
) {
  return ({ size = 24, color = '#F5F7FF', strokeWidth }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children(color, strokeWidth ?? defaultSw)}
    </Svg>
  );
}

export const Ic = {
  gauge: make((c, sw) => (
    <>
      <Path d="M3.5 14a8.5 8.5 0 0 1 17 0" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 14l4-3.2" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="14" r="1.4" fill={c} />
      <Path d="M3.5 14v1.5M20.5 14v1.5M12 5.5V7" stroke={c} strokeWidth={1.2} strokeLinecap="round" />
    </>
  )),
  bell: make((c, sw) => (
    <>
      <Path d="M6 10a6 6 0 0 1 12 0c0 5 1.6 6.5 2 7H4c.4-.5 2-2 2-7Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.2 20a2 2 0 0 0 3.6 0" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),
  compass: make((c, sw) => (
    <>
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={sw} />
      <Path d="M15.2 8.8 10.4 10.4 8.8 15.2 13.6 13.6 15.2 8.8Z" fill={c} fillOpacity={0.18} stroke={c} strokeWidth={sw} strokeLinejoin="round" />
    </>
  )),
  gear: make((c, sw) => (
    <>
      <Circle cx="12" cy="12" r="3.2" stroke={c} strokeWidth={sw} />
      <Path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </>
  )),
  anchor: make((c, sw) => (
    <>
      <Circle cx="12" cy="5" r="2" stroke={c} strokeWidth={sw} />
      <Path d="M12 7v13" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 13a7 7 0 0 0 14 0" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 13H3.2M19 13h1.8M9 9.5h6" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </>
  )),
  battery: make((c, sw) => (
    <>
      <Rect x="2.5" y="7.5" width="16" height="9" rx="2" stroke={c} strokeWidth={sw} />
      <Path d="M21 10.5v3" stroke={c} strokeWidth={sw} strokeLinecap="round" />
      <Rect x="4.5" y="9.5" width="6" height="5" rx="1" fill={c} />
    </>
  )),
  fuel: make((c, sw) => (
    <>
      <Path d="M12 3.5c3 3.6 5 6.2 5 9a5 5 0 0 1-10 0c0-2.8 2-5.4 5-9Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" stroke={c} strokeWidth={1.3} strokeLinecap="round" />
    </>
  )),
  gps: make((c, sw) => (
    <>
      <Path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="2.4" stroke={c} strokeWidth={sw} />
    </>
  )),
  wind: make((c, sw) => (
    <>
      <Path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 12.5h15a2.5 2.5 0 1 1-2.5 2.5" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 16.5h8a2 2 0 1 1-2 2" stroke={c} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),
  send: make((c) => (
    <Path d="M4 11.5 20 4l-7.5 16-2.2-6.3L4 11.5Z" stroke={c} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
  )),
  mic: make((c, sw) => (
    <>
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={c} strokeWidth={sw} />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )),
  alert: make((c, sw) => (
    <>
      <Path d="M12 3.5 21.5 20H2.5L12 3.5Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 10v4.5M12 17.4v.1" stroke={c} strokeWidth={sw} strokeLinecap="round" />
    </>
  )),
  check: make((c) => <Path d="M4.5 12.5 9.5 17.5 19.5 6.5" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />),
  geofence: make((c) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={c} strokeWidth={1.8} strokeDasharray="2.5 3" />
      <Circle cx="12" cy="12" r="2.2" fill={c} />
    </>
  )),
  chevron: make((c) => <Path d="M9 5l7 7-7 7" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />),
  plus: make((c) => <Path d="M12 5v14M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round" />),
  minus: make((c) => <Path d="M5 12h14" stroke={c} strokeWidth={2} strokeLinecap="round" />),
  signal: make((c) => <Path d="M5 18v-3M9.5 18v-6M14 18v-9M18.5 18V6" stroke={c} strokeWidth={2} strokeLinecap="round" />),
  temp: make((c, sw) => (
    <>
      <Path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="17" r="1.6" fill={c} />
    </>
  )),
};

export type IconName = keyof typeof Ic;
