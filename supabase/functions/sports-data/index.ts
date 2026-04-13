import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Multiple API base URLs — try mirror first, then primary, then web proxy
const API_BASES = [
  "https://api.sofascore.app/api/v1",
  "https://www.sofascore.com/api/v1",
  "https://api.sofascore.com/api/v1",
];

const FOOTBALL_BRASILEIRO_ID = 325;
const NBA_ID = 132;

// Rotate user agents to reduce fingerprinting
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];

const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const buildHeaders = () => ({
  "User-Agent": pickUA(),
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="125", "Not(A:Brand";v="24", "Google Chrome";v="125"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
});

// Try each base URL until one works
const fetchSofaScore = async (path: string) => {
  let lastError: Error | null = null;
  for (const base of API_BASES) {
    try {
      const url = `${base}${path}`;
      console.log(`Trying: ${url}`);
      const res = await fetch(url, { headers: buildHeaders() });
      if (res.ok) {
        const data = await res.json();
        console.log(`Success from ${base}`);
        return data;
      }
      console.warn(`${base} returned ${res.status}`);
      lastError = new Error(`API ${res.status} from ${base}`);
    } catch (e) {
      console.warn(`${base} fetch error:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError || new Error("All API endpoints failed");
};

const getLatestSeasonId = async (sport: string, tournamentId: number) => {
  const data = await fetchSofaScore(`/sport/${sport}/tournament/${tournamentId}/seasons`);
  const seasons: any[] = data.seasons || [];
  if (!seasons.length) throw new Error("No seasons found");
  return seasons[0].id;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sport, teamId } = await req.json();
    let result: any = {};

    const tournamentId = sport === "basketball" ? NBA_ID : FOOTBALL_BRASILEIRO_ID;
    const sportSlug = sport === "basketball" ? "basketball" : "football";

    if (action === "standings") {
      const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
      const data = await fetchSofaScore(
        `/sport/${sportSlug}/tournament/${tournamentId}/season/${seasonId}/standings/total`
      );
      const rows = data.standings?.[0]?.rows || [];
      result = {
        seasonId,
        teams: rows.map((r: any) => ({
          position: r.position, id: r.team.id, name: r.team.name,
          shortName: r.team.shortName, played: r.matches, wins: r.wins,
          draws: r.draws, losses: r.losses, scored: r.scoresFor,
          conceded: r.scoresAgainst, points: r.points,
        })),
      };
    } else if (action === "matches_last") {
      const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
      const data = await fetchSofaScore(
        `/sport/${sportSlug}/tournament/${tournamentId}/season/${seasonId}/events/last/0`
      );
      const events: any[] = data.events || [];
      result = events.slice(0, 20).map((e: any) => ({
        id: e.id, homeTeam: e.homeTeam.name, awayTeam: e.awayTeam.name,
        homeScore: e.homeScore?.current ?? null, awayScore: e.awayScore?.current ?? null,
        status: e.status?.description || "Unknown", startTimestamp: e.startTimestamp,
        tournament: e.tournament?.name || "", roundInfo: e.roundInfo?.round || null,
      }));
    } else if (action === "matches_next") {
      const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
      const data = await fetchSofaScore(
        `/sport/${sportSlug}/tournament/${tournamentId}/season/${seasonId}/events/next/0`
      );
      const events: any[] = data.events || [];
      result = events.slice(0, 20).map((e: any) => ({
        id: e.id, homeTeam: e.homeTeam.name, awayTeam: e.awayTeam.name,
        homeScore: null, awayScore: null, status: "scheduled",
        startTimestamp: e.startTimestamp, tournament: e.tournament?.name || "",
        roundInfo: e.roundInfo?.round || null,
      }));
    } else if (action === "team_players" && teamId) {
      const data = await fetchSofaScore(`/team/${teamId}/players`);
      const players: any[] = data.players || [];
      result = players.map((p: any) => ({
        id: p.player.id, name: p.player.name, position: p.player.position,
        nationality: p.player.country?.name || "",
        age: p.player.dateOfBirthTimestamp
          ? new Date().getFullYear() - new Date(p.player.dateOfBirthTimestamp * 1000).getFullYear()
          : null,
        jersey: p.player.jerseyNumber || null,
      }));
    } else if (action === "team_stats" && teamId) {
      const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
      const data = await fetchSofaScore(
        `/team/${teamId}/statistics/season/${seasonId}/tournament/${tournamentId}`
      );
      result = data.statistics || {};
    } else if (action === "live") {
      const data = await fetchSofaScore(`/sport/${sportSlug}/events/live`);
      const events: any[] = data.events || [];
      result = events.slice(0, 30).map((e: any) => ({
        id: e.id, homeTeam: e.homeTeam.name, awayTeam: e.awayTeam.name,
        homeScore: e.homeScore?.current ?? 0, awayScore: e.awayScore?.current ?? 0,
        status: e.status?.description || "Live",
        minute: e.time?.currentPeriodStartTimestamp
          ? Math.floor((Date.now() / 1000 - e.time.currentPeriodStartTimestamp) / 60)
          : null,
        tournament: e.tournament?.name || "",
      }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sports-data error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
