import React, { createContext, useContext, useState, useCallback } from "react";

export type Sport = "football" | "basketball";

interface SportContextType {
  sport: Sport;
  setSport: (sport: Sport) => void;
  sportLabel: string;
  sportClass: string;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export const SportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sport, setSportState] = useState<Sport>("football");

  const setSport = useCallback((s: Sport) => setSportState(s), []);

  const sportLabel = sport === "football" ? "Futebol" : "Basquete";
  const sportClass = sport === "football" ? "sport-football" : "sport-basketball";

  return (
    <SportContext.Provider value={{ sport, setSport, sportLabel, sportClass }}>
      {children}
    </SportContext.Provider>
  );
};

export const useSport = () => {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error("useSport must be used within SportProvider");
  return ctx;
};
