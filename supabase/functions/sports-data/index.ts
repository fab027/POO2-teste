import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SOFASCORE_BASE = "https://api.sofascore.com/api/v1";
const FOOTBALL_BRASILEIRO_ID = 325;
const NBA_ID = 132;

// Use Firecrawl to scrape SofaScore API endpoints (bypasses TLS fingerprinting)
const fetchViaFirecrawl = async (path: string) => {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const url = `${SOFASCORE_BASE}${path}`;
  console.log(`Fetching via Firecrawl: ${url}`);

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["html"],
      waitFor: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Firecrawl error ${res.status}:`, err);
    throw new Error(`Firecrawl error: ${res.status}`);
  }

  const result = await res.json();
  // Firecrawl returns the page HTML — for API endpoints returning JSON,
  // the "html" will contain the raw JSON wrapped in <pre> or directly
  const html = result.data?.html || result.html || "";

  // Extract JSON from the response — API endpoints return raw JSON
  let jsonStr = html;
  // Remove HTML wrappers if present
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (preMatch) jsonStr = preMatch[1];
  // Remove any remaining HTML tags
  jsonStr = jsonStr.replace(/<[^>]+>/g, "").trim();
  // Decode HTML entities
  jsonStr = jsonStr.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error("Failed to parse JSON from Firecrawl response. HTML:", html.substring(0, 500));
    throw new Error("Failed to parse SofaScore data from Firecrawl");
  }
};

const getLatestSeasonId = async (sport: string, tournamentId: number) => {
  const data = await fetchViaFirecrawl(`/sport/${sport}/tournament/${tournamentId}/seasons`);
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
      const data = await fetchViaFirecrawl(
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
      const data = await fetchViaFirecrawl(
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
      const data = await fetchViaFirecrawl(
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
      const data = await fetchViaFirecrawl(`/team/${teamId}/players`);
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
      const data = await fetchViaFirecrawl(
        `/team/${teamId}/statistics/season/${seasonId}/tournament/${tournamentId}`
      );
      result = data.statistics || {};
    } else if (action === "live") {
      const data = await fetchViaFirecrawl(`/sport/${sportSlug}/events/live`);
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
