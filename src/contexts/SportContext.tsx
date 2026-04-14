import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { League, getDefaultLeague, LEAGUES } from "@/data/leagues";

export type Sport = "football" | "basketball";

interface SportContextType {
  sport: Sport;
  setSport: (sport: Sport) => void;
  sportLabel: string;
  sportClass: string;
  league: League;
  setLeague: (league: League) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export const SportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sport, setSportState] = useState<Sport>("football");
  const [league, setLeagueState] = useState<League>(getDefaultLeague("football"));

  const setSport = useCallback((s: Sport) => {
    setSportState(s);
    setLeagueState(getDefaultLeague(s));
  }, []);

  const setLeague = useCallback((l: League) => {
    setLeagueState(l);
    if (l.sport !== sport) setSportState(l.sport);
  }, [sport]);

  const sportLabel = sport === "football" ? "Futebol" : "Basquete";
  const sportClass = sport === "football" ? "sport-football" : "sport-basketball";

  const value = useMemo(() => ({
    sport, setSport, sportLabel, sportClass, league, setLeague,
  }), [sport, setSport, sportLabel, sportClass, league, setLeague]);

  return (
    <SportContext.Provider value={value}>
      {children}
    </SportContext.Provider>
  );
};

export const useSport = () => {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error("useSport must be used within SportProvider");
  return ctx;
};
