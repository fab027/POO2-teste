import { useState, useEffect, useCallback } from "react";
import {
  sofaScoreService,
  SofaTeamStanding,
  SofaMatch,
  SofaPlayer,
  SofaLiveMatch,
} from "@/services/sofaScoreService";

// Simple in-memory cache (TTL 5 min)
const cache: Record<string, { data: unknown; ts: number }> = {};
const TTL = 5 * 60 * 1000;

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache[key];
  if (hit && Date.now() - hit.ts < TTL) return Promise.resolve(hit.data as T);
  return fn().then((data) => {
    cache[key] = { data, ts: Date.now() };
    return data;
  });
}

type Status = "idle" | "loading" | "success" | "error";

// ─── Standings ──────────────────────────────────────────────────────────────
export function useStandings(sport: "football" | "basketball") {
  const [data, setData] = useState<SofaTeamStanding[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await cached(`standings_${sport}`, () =>
        sofaScoreService.getStandings(sport)
      );
      setData(res.teams);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar classificação");
      setStatus("error");
    }
  }, [sport]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, status, error, refetch: fetch };
}

// ─── Matches ─────────────────────────────────────────────────────────────────
export function useMatches(sport: "football" | "basketball") {
  const [lastMatches, setLastMatches] = useState<SofaMatch[]>([]);
  const [nextMatches, setNextMatches] = useState<SofaMatch[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setStatus("loading");
    try {
      const [last, next] = await Promise.all([
        cached(`last_${sport}`, () =>
          sofaScoreService.getLastMatches(sport)
        ),
        cached(`next_${sport}`, () =>
          sofaScoreService.getNextMatches(sport)
        ),
      ]);
      setLastMatches(last);
      setNextMatches(next);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar partidas");
      setStatus("error");
    }
  }, [sport]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const allMatches: SofaMatch[] = [
    ...lastMatches.map((m) => ({ ...m, _type: "past" as const })),
    ...nextMatches.map((m) => ({ ...m, _type: "upcoming" as const })),
  ];

  return { lastMatches, nextMatches, allMatches, status, error, refetch: fetch };
}

// ─── Live Matches ─────────────────────────────────────────────────────────────
export function useLiveMatches(sport: "football" | "basketball") {
  const [data, setData] = useState<SofaLiveMatch[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  const fetch = useCallback(async () => {
    setStatus("loading");
    try {
      const key = `live_${sport}`;
      const hit = cache[key];
      let res: SofaLiveMatch[];
      if (hit && Date.now() - hit.ts < 30_000) {
        res = hit.data as SofaLiveMatch[];
      } else {
        res = await sofaScoreService.getLiveMatches(sport);
        cache[key] = { data: res, ts: Date.now() };
      }
      setData(res);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [sport]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { data, status, refetch: fetch };
}

// ─── Team Players ─────────────────────────────────────────────────────────────
export function useTeamPlayers(teamId: number | null) {
  const [data, setData] = useState<SofaPlayer[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    setStatus("loading");
    cached(`players_${teamId}`, () =>
      sofaScoreService.getTeamPlayers(teamId)
    )
      .then((res) => {
        setData(res);
        setStatus("success");
      })
      .catch((e) => {
        setError(e.message);
        setStatus("error");
      });
  }, [teamId]);

  return { data, status, error };
}
