import React, { createContext, useContext, useState } from 'react';

export type DepthUnit = 'm' | 'ft';

type Settings = {
  depthUnit: DepthUnit;
  setDepthUnit: (u: DepthUnit) => void;
  depthAlarm: number; // umbral de profundidad baja, en metros
  setDepthAlarm: (n: number) => void;
  boatName: string;
  setBoatName: (s: string) => void;
};

const Ctx = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [depthUnit, setDepthUnit] = useState<DepthUnit>('m');
  const [depthAlarm, setDepthAlarm] = useState(12); // metros
  const [boatName, setBoatName] = useState('Marex');

  return (
    <Ctx.Provider
      value={{ depthUnit, setDepthUnit, depthAlarm, setDepthAlarm, boatName, setBoatName }}
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
