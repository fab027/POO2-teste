import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
const FOOTBALL_BRASILEIRO_ID = 325;
const NBA_ID = 132;

const fetchSofaScore = async (path: string) => {
  const res = await fetch(`${SOFASCORE_BASE}${path}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      Referer: "https://www.sofascore.com/",
      Origin: "https://www.sofascore.com",
    },
  });
  if (!res.ok) throw new Error(`SofaScore API error: ${res.status}`);
  return res.json();
};

const getLatestSeasonId = async (sport: string, tournamentId: number) => {
  const data = await fetchSofaScore(
    `/sport/${sport}/tournament/${tournamentId}/seasons`
  );
  const seasons: any[] = data.seasons || [];
  if (!seasons.length) throw new Error("No seasons found");
  return seasons[0].id;
};

// ─── Fallback mock data ──────────────────────────────────────────────────────
const footballStandingsMock = {
  seasonId: 0,
  teams: [
    { position: 1, id: 1958, name: "Botafogo", shortName: "BOT", played: 14, wins: 10, draws: 2, losses: 2, scored: 28, conceded: 12, points: 32 },
    { position: 2, id: 1963, name: "Palmeiras", shortName: "PAL", played: 14, wins: 9, draws: 3, losses: 2, scored: 25, conceded: 11, points: 30 },
    { position: 3, id: 5981, name: "Flamengo", shortName: "FLA", played: 14, wins: 9, draws: 2, losses: 3, scored: 27, conceded: 15, points: 29 },
    { position: 4, id: 2020, name: "Fortaleza", shortName: "FOR", played: 14, wins: 8, draws: 4, losses: 2, scored: 22, conceded: 10, points: 28 },
    { position: 5, id: 1966, name: "Internacional", shortName: "INT", played: 14, wins: 8, draws: 3, losses: 3, scored: 20, conceded: 13, points: 27 },
    { position: 6, id: 1981, name: "São Paulo", shortName: "SAO", played: 14, wins: 7, draws: 4, losses: 3, scored: 19, conceded: 12, points: 25 },
    { position: 7, id: 1955, name: "Bahia", shortName: "BAH", played: 14, wins: 7, draws: 3, losses: 4, scored: 21, conceded: 16, points: 24 },
    { position: 8, id: 1954, name: "Cruzeiro", shortName: "CRU", played: 14, wins: 7, draws: 3, losses: 4, scored: 18, conceded: 14, points: 24 },
    { position: 9, id: 1957, name: "Corinthians", shortName: "COR", played: 14, wins: 6, draws: 4, losses: 4, scored: 17, conceded: 15, points: 22 },
    { position: 10, id: 1967, name: "Athletico PR", shortName: "CAP", played: 14, wins: 6, draws: 3, losses: 5, scored: 16, conceded: 14, points: 21 },
    { position: 11, id: 5926, name: "Grêmio", shortName: "GRE", played: 14, wins: 5, draws: 5, losses: 4, scored: 18, conceded: 16, points: 20 },
    { position: 12, id: 1974, name: "Vasco", shortName: "VAS", played: 14, wins: 5, draws: 4, losses: 5, scored: 15, conceded: 17, points: 19 },
    { position: 13, id: 1977, name: "Atlético MG", shortName: "CAM", played: 14, wins: 5, draws: 3, losses: 6, scored: 16, conceded: 18, points: 18 },
    { position: 14, id: 1961, name: "Fluminense", shortName: "FLU", played: 14, wins: 4, draws: 5, losses: 5, scored: 14, conceded: 16, points: 17 },
    { position: 15, id: 1999, name: "RB Bragantino", shortName: "RBB", played: 14, wins: 4, draws: 4, losses: 6, scored: 13, conceded: 18, points: 16 },
    { position: 16, id: 1980, name: "Juventude", shortName: "JUV", played: 14, wins: 4, draws: 3, losses: 7, scored: 12, conceded: 20, points: 15 },
    { position: 17, id: 49202, name: "Cuiabá", shortName: "CUI", played: 14, wins: 3, draws: 4, losses: 7, scored: 11, conceded: 19, points: 13 },
    { position: 18, id: 1968, name: "Santos", shortName: "SAN", played: 14, wins: 3, draws: 3, losses: 8, scored: 10, conceded: 22, points: 12 },
    { position: 19, id: 1960, name: "Goiás", shortName: "GOI", played: 14, wins: 2, draws: 4, losses: 8, scored: 9, conceded: 21, points: 10 },
    { position: 20, id: 1982, name: "Coritiba", shortName: "CFC", played: 14, wins: 2, draws: 3, losses: 9, scored: 8, conceded: 25, points: 9 },
  ],
};

const basketballStandingsMock = {
  seasonId: 0,
  teams: [
    { position: 1, id: 3410, name: "Boston Celtics", shortName: "BOS", played: 82, wins: 64, draws: 0, losses: 18, scored: 9430, conceded: 8820, points: 64 },
    { position: 2, id: 3416, name: "Miami Heat", shortName: "MIA", played: 82, wins: 56, draws: 0, losses: 26, scored: 9150, conceded: 8900, points: 56 },
    { position: 3, id: 3428, name: "Los Angeles Lakers", shortName: "LAL", played: 82, wins: 52, draws: 0, losses: 30, scored: 9300, conceded: 9050, points: 52 },
    { position: 4, id: 3411, name: "Chicago Bulls", shortName: "CHI", played: 82, wins: 48, draws: 0, losses: 34, scored: 9100, conceded: 9000, points: 48 },
    { position: 5, id: 3409, name: "Brooklyn Nets", shortName: "BKN", played: 82, wins: 45, draws: 0, losses: 37, scored: 9050, conceded: 8980, points: 45 },
  ],
};

const now = Math.floor(Date.now() / 1000);
const day = 86400;

const footballMatchesMock = [
  { id: 1001, homeTeam: "Botafogo", awayTeam: "Palmeiras", homeScore: 2, awayScore: 1, status: "Finished", startTimestamp: now - day * 2, tournament: "Brasileirão Série A", roundInfo: 14 },
  { id: 1002, homeTeam: "Flamengo", awayTeam: "Internacional", homeScore: 3, awayScore: 0, status: "Finished", startTimestamp: now - day * 3, tournament: "Brasileirão Série A", roundInfo: 14 },
  { id: 1003, homeTeam: "São Paulo", awayTeam: "Fortaleza", homeScore: 1, awayScore: 1, status: "Finished", startTimestamp: now - day * 3, tournament: "Brasileirão Série A", roundInfo: 14 },
  { id: 1004, homeTeam: "Cruzeiro", awayTeam: "Bahia", homeScore: 0, awayScore: 2, status: "Finished", startTimestamp: now - day * 4, tournament: "Brasileirão Série A", roundInfo: 13 },
  { id: 1005, homeTeam: "Corinthians", awayTeam: "Grêmio", homeScore: 1, awayScore: 0, status: "Finished", startTimestamp: now - day * 4, tournament: "Brasileirão Série A", roundInfo: 13 },
];

const footballNextMatchesMock = [
  { id: 2001, homeTeam: "Palmeiras", awayTeam: "Flamengo", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 3, tournament: "Brasileirão Série A", roundInfo: 15 },
  { id: 2002, homeTeam: "Internacional", awayTeam: "Botafogo", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 4, tournament: "Brasileirão Série A", roundInfo: 15 },
  { id: 2003, homeTeam: "Fortaleza", awayTeam: "Cruzeiro", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 4, tournament: "Brasileirão Série A", roundInfo: 15 },
  { id: 2004, homeTeam: "Bahia", awayTeam: "São Paulo", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 5, tournament: "Brasileirão Série A", roundInfo: 15 },
  { id: 2005, homeTeam: "Vasco", awayTeam: "Corinthians", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 5, tournament: "Brasileirão Série A", roundInfo: 15 },
];

const basketballMatchesMock = [
  { id: 3001, homeTeam: "Boston Celtics", awayTeam: "Miami Heat", homeScore: 112, awayScore: 98, status: "Finished", startTimestamp: now - day * 2, tournament: "NBA", roundInfo: null },
  { id: 3002, homeTeam: "Los Angeles Lakers", awayTeam: "Chicago Bulls", homeScore: 105, awayScore: 101, status: "Finished", startTimestamp: now - day * 3, tournament: "NBA", roundInfo: null },
  { id: 3003, homeTeam: "Brooklyn Nets", awayTeam: "Boston Celtics", homeScore: 95, awayScore: 110, status: "Finished", startTimestamp: now - day * 4, tournament: "NBA", roundInfo: null },
];

const basketballNextMatchesMock = [
  { id: 4001, homeTeam: "Miami Heat", awayTeam: "Los Angeles Lakers", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 2, tournament: "NBA", roundInfo: null },
  { id: 4002, homeTeam: "Chicago Bulls", awayTeam: "Brooklyn Nets", homeScore: null, awayScore: null, status: "scheduled", startTimestamp: now + day * 3, tournament: "NBA", roundInfo: null },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sport, teamId } = await req.json();
    let result: any = {};
    let usedFallback = false;

    if (action === "standings") {
      try {
        const tournamentId = sport === "basketball" ? NBA_ID : FOOTBALL_BRASILEIRO_ID;
        const sportSlug = sport === "basketball" ? "basketball" : "football";
        const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
        const data = await fetchSofaScore(
          `/sport/${sportSlug}/tournament/${tournamentId}/season/${seasonId}/standings/total`
        );
        const rows = data.standings?.[0]?.rows || [];
        result = {
          seasonId,
          teams: rows.map((r: any) => ({
            position: r.position, id: r.team.id, name: r.team.name, shortName: r.team.shortName,
            played: r.matches, wins: r.wins, draws: r.draws, losses: r.losses,
            scored: r.scoresFor, conceded: r.scoresAgainst, points: r.points,
          })),
        };
      } catch {
        usedFallback = true;
        result = sport === "basketball" ? basketballStandingsMock : footballStandingsMock;
      }
    } else if (action === "matches_last") {
      try {
        const tournamentId = sport === "basketball" ? NBA_ID : FOOTBALL_BRASILEIRO_ID;
        const sportSlug = sport === "basketball" ? "basketball" : "football";
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
      } catch {
        usedFallback = true;
        result = sport === "basketball" ? basketballMatchesMock : footballMatchesMock;
      }
    } else if (action === "matches_next") {
      try {
        const tournamentId = sport === "basketball" ? NBA_ID : FOOTBALL_BRASILEIRO_ID;
        const sportSlug = sport === "basketball" ? "basketball" : "football";
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
      } catch {
        usedFallback = true;
        result = sport === "basketball" ? basketballNextMatchesMock : footballNextMatchesMock;
      }
    } else if (action === "team_players" && teamId) {
      try {
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
      } catch {
        usedFallback = true;
        result = [];
      }
    } else if (action === "live") {
      try {
        const sportSlug = sport === "basketball" ? "basketball" : "football";
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
      } catch {
        usedFallback = true;
        result = [];
      }
    } else if (action === "team_stats" && teamId) {
      try {
        const sportSlug = sport === "basketball" ? "basketball" : "football";
        const tournamentId = sport === "basketball" ? NBA_ID : FOOTBALL_BRASILEIRO_ID;
        const seasonId = await getLatestSeasonId(sportSlug, tournamentId);
        const data = await fetchSofaScore(
          `/team/${teamId}/statistics/season/${seasonId}/tournament/${tournamentId}`
        );
        result = data.statistics || {};
      } catch {
        usedFallback = true;
        result = {};
      }
    }

    const response = Array.isArray(result) ? result : { ...result, _fallback: usedFallback };
    return new Response(JSON.stringify(response), {
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
