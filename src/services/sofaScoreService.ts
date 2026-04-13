const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SPORTS_DATA_URL = `${SUPABASE_URL}/functions/v1/sports-data`;

async function callSportsData(body: Record<string, unknown>) {
  const res = await fetch(SPORTS_DATA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type SofaTeamStanding = {
  position: number;
  id: number;
  name: string;
  shortName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  scored: number;
  conceded: number;
  points: number;
};

export type SofaMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  startTimestamp: number;
  tournament: string;
  roundInfo: number | null;
};

export type SofaPlayer = {
  id: number;
  name: string;
  position: string;
  nationality: string;
  age: number | null;
  jersey: string | null;
};

export type SofaLiveMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: number | null;
  tournament: string;
};

export const sofaScoreService = {
  async getStandings(
    sport: "football" | "basketball"
  ): Promise<{ seasonId: number; teams: SofaTeamStanding[] }> {
    return callSportsData({ action: "standings", sport });
  },

  async getLastMatches(sport: "football" | "basketball"): Promise<SofaMatch[]> {
    return callSportsData({ action: "matches_last", sport });
  },

  async getNextMatches(sport: "football" | "basketball"): Promise<SofaMatch[]> {
    return callSportsData({ action: "matches_next", sport });
  },

  async getTeamPlayers(teamId: number): Promise<SofaPlayer[]> {
    return callSportsData({ action: "team_players", teamId });
  },

  async getLiveMatches(
    sport: "football" | "basketball"
  ): Promise<SofaLiveMatch[]> {
    return callSportsData({ action: "live", sport });
  },

  async getTeamStats(
    sport: "football" | "basketball",
    teamId: number
  ): Promise<Record<string, unknown>> {
    return callSportsData({ action: "team_stats", sport, teamId });
  },
};

export const brasileiraoTeamIds: Record<string, number> = {
  Flamengo: 5981,
  Palmeiras: 1963,
  Corinthians: 1957,
  "São Paulo": 1981,
  Internacional: 1966,
  Grêmio: 5926,
  Fluminense: 1961,
  "Atlético MG": 1977,
  "Atlético GO": 7314,
  Santos: 1968,
  Bahia: 1955,
  Ceará: 2001,
  Fortaleza: 2020,
  "Athletico PR": 1967,
  "América MG": 1973,
  "RB Bragantino": 1999,
  Botafogo: 1958,
  Juventude: 1980,
  Cuiabá: 49202,
  Coritiba: 1982,
  Goiás: 1960,
  Avaí: 7315,
  Sport: 1959,
  Chapecoense: 21845,
  Cruzeiro: 1954,
  Vasco: 1974,
};

export const nbaTeamIds: Record<string, number> = {
  "Los Angeles Lakers": 3428,
  "Golden State Warriors": 3428,
  "Boston Celtics": 3410,
  "Miami Heat": 3416,
  "Chicago Bulls": 3411,
  "Brooklyn Nets": 3409,
};
