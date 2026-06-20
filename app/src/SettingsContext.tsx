import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';

export type DepthUnit = 'm' | 'ft';

// URL por defecto del backend. En web/emulador apunta a localhost;
// desde un teléfono físico hay que poner la IP de la PC/Jetson (en Ajustes).
const DEFAULT_SERVER_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.1.100:8000';

type Settings = {
  depthUnit: DepthUnit;
  setDepthUnit: (u: DepthUnit) => void;
  depthAlarm: number; // umbral de profundidad baja, en metros
  setDepthAlarm: (n: number) => void;
  boatName: string;
  setBoatName: (s: string) => void;
  serverUrl: string; // URL del backend de Marex
  setServerUrl: (s: string) => void;
};

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [depthUnit, setDepthUnit] = useState<DepthUnit>('m');
  const [depthAlarm, setDepthAlarm] = useState(12); // metros
  const [boatName, setBoatName] = useState('Marex');
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);

  return (
    <Ctx.Provider
      value={{
        depthUnit,
        setDepthUnit,
        depthAlarm,
        setDepthAlarm,
        boatName,
        setBoatName,
        serverUrl,
        setServerUrl,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings(): Settings {
  const value = useContext(Ctx);
  if (!value) throw new Error('useSettings debe usarse dentro de <SettingsProvider>');
  return value;
}
