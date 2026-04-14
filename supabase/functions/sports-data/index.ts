import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FOOTBALL_URL = "https://www.sofascore.com/tournament/football/brazil/brasileirao-serie-a/325";
const NBA_URL = "https://www.sofascore.com/tournament/basketball/usa/nba/132";

const scrapeExtract = async (url: string, prompt: string, schema: Record<string, unknown>) => {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  console.log(`Scraping: ${url}`);

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["extract"],
      extract: { schema, prompt },
      waitFor: 1000,
      timeout: 25000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Firecrawl HTTP ${res.status}:`, errText);
    throw new Error(`Firecrawl error: ${res.status}`);
  }

  const result = await res.json();
  const extracted = result.data?.extract || result.extract;
  console.log(`Extracted keys:`, extracted ? Object.keys(extracted) : "null");
  return extracted;
};

const standingsSchema = {
  type: "object",
  properties: {
    teams: {
      type: "array",
      items: {
        type: "object",
        properties: {
          position: { type: "number" },
          name: { type: "string" },
          shortName: { type: "string" },
          played: { type: "number" },
          wins: { type: "number" },
          draws: { type: "number" },
          losses: { type: "number" },
          scored: { type: "number" },
          conceded: { type: "number" },
          points: { type: "number" },
        },
      },
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sport } = await req.json();
    let result: any = {};

    const baseUrl = sport === "basketball" ? NBA_URL : FOOTBALL_URL;
    const leagueName = sport === "basketball" ? "NBA" : "Brasileirão Série A";

    if (action === "standings") {
      const data = await scrapeExtract(
        baseUrl,
        `Extract the complete league standings table. For each team include: position number, full team name, short name/abbreviation, games played (J), wins (V), draws (E), losses (D), goals/points scored (GP), goals/points conceded (GC), and total points (Pts).`,
        standingsSchema
      );

      const teams = (data?.teams || []).map((t: any, i: number) => ({
        position: t.position || i + 1,
        id: i + 1000,
        name: t.name || "Unknown",
        shortName: t.shortName || (t.name || "UNK").substring(0, 3).toUpperCase(),
        played: t.played || 0,
        wins: t.wins || 0,
        draws: t.draws || 0,
        losses: t.losses || 0,
        scored: t.scored || 0,
        conceded: t.conceded || 0,
        points: t.points || 0,
      }));

      result = { seasonId: 0, teams };
    } else if (action === "matches_last" || action === "matches_next") {
      const isLast = action === "matches_last";

      const data = await scrapeExtract(
        baseUrl,
        `Extract ${isLast ? "the most recent completed/finished" : "the upcoming/scheduled"} matches. For each match: home team name, away team name, ${isLast ? "home score, away score," : ""} status (Finished/Scheduled), date and time as ISO string, round number.`,
        {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  homeTeam: { type: "string" },
                  awayTeam: { type: "string" },
                  homeScore: { type: "number" },
                  awayScore: { type: "number" },
                  status: { type: "string" },
                  date: { type: "string" },
                  round: { type: "number" },
                },
              },
            },
          },
        }
      );

      result = (data?.matches || []).map((m: any, i: number) => ({
        id: (isLast ? 1000 : 5000) + i,
        homeTeam: m.homeTeam || "Unknown",
        awayTeam: m.awayTeam || "Unknown",
        homeScore: isLast ? (m.homeScore ?? null) : null,
        awayScore: isLast ? (m.awayScore ?? null) : null,
        status: m.status || (isLast ? "Finished" : "scheduled"),
        startTimestamp: m.date ? Math.floor(new Date(m.date).getTime() / 1000) : Math.floor(Date.now() / 1000),
        tournament: leagueName,
        roundInfo: m.round || null,
      }));
    } else if (action === "live") {
      try {
        const data = await scrapeExtract(
          "https://www.sofascore.com/",
          `Extract any live ${sport === "basketball" ? "basketball" : "football"} matches currently being played right now. Include home team, away team, current scores, match minute, tournament name.`,
          {
            type: "object",
            properties: {
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    homeTeam: { type: "string" },
                    awayTeam: { type: "string" },
                    homeScore: { type: "number" },
                    awayScore: { type: "number" },
                    minute: { type: "number" },
                    tournament: { type: "string" },
                  },
                },
              },
            },
          }
        );
        result = (data?.matches || []).map((m: any, i: number) => ({
          id: 9000 + i,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
          status: "Live",
          minute: m.minute || null,
          tournament: m.tournament || leagueName,
        }));
      } catch {
        result = [];
      }
    } else if (action === "team_players") {
      result = [];
    } else if (action === "team_stats") {
      result = {};
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
