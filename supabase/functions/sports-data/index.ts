import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const scrapeExtract = async (
  url: string,
  prompt: string,
  schema: Record<string, unknown>,
  retries = 2
): Promise<any> => {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`Scraping (attempt ${attempt + 1}): ${url}`);
    try {
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
          waitFor: 3000,
          timeout: 45000,
        }),
      });

      if (res.status === 408 && attempt < retries) {
        console.warn(`Timeout 408, retrying in ${(attempt + 1) * 2}s...`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Firecrawl HTTP ${res.status}:`, errText);
        throw new Error(`Firecrawl error: ${res.status}`);
      }

      const result = await res.json();
      const extracted = result.data?.extract || result.extract;
      console.log("Extracted keys:", extracted ? Object.keys(extracted) : "null");
      return extracted;
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      throw err;
    }
  }
};

const firecrawlSearch = async (query: string, limit = 5): Promise<any[]> => {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  const data = await res.json();
  return data.data || [];
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

const matchesSchema = {
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    let result: any = {};

    if (action === "standings") {
      const { leagueUrl } = body;
      if (!leagueUrl) throw new Error("leagueUrl required");

      const data = await scrapeExtract(
        leagueUrl,
        `Extract the complete league standings table. For each team: position number, full team name, short name/abbreviation, games played (J/GP), wins (V/W), draws (E/D), losses (D/L), goals or points scored (GP/GF), goals or points conceded (GC/GA), total points (Pts/P).`,
        standingsSchema
      );

      result = {
        teams: (data?.teams || []).map((t: any, i: number) => ({
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
        })),
      };
    } else if (action === "matches_last" || action === "matches_next") {
      const { leagueUrl } = body;
      if (!leagueUrl) throw new Error("leagueUrl required");
      const isLast = action === "matches_last";

      const data = await scrapeExtract(
        leagueUrl,
        `Extract ${isLast ? "the most recent completed/finished" : "the upcoming/scheduled"} matches. For each match: home team name, away team name, ${isLast ? "home score, away score," : ""} status (Finished/Scheduled), date and time as ISO string, round number.`,
        matchesSchema
      );

      result = (data?.matches || []).map((m: any, i: number) => ({
        id: (isLast ? 1000 : 5000) + i,
        homeTeam: m.homeTeam || "Unknown",
        awayTeam: m.awayTeam || "Unknown",
        homeScore: isLast ? (m.homeScore ?? null) : null,
        awayScore: isLast ? (m.awayScore ?? null) : null,
        status: m.status || (isLast ? "Finished" : "scheduled"),
        startTimestamp: m.date
          ? Math.floor(new Date(m.date).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        roundInfo: m.round || null,
      }));
    } else if (action === "live") {
      try {
        const data = await scrapeExtract(
          "https://www.placardefutebol.com.br/jogos-de-hoje",
          `Extract ALL football matches currently being played LIVE right now (ao vivo, em andamento). For each match include: home team name, away team name, current home score, current away score, match minute or time elapsed, tournament/league name. ONLY include matches with status "ao vivo" or "em andamento" or that show a running minute. Do NOT include matches that are scheduled or finished.`,
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
                    minute: { type: "string" },
                    tournament: { type: "string" },
                  },
                },
              },
            },
          },
          1
        );
        result = (data?.matches || []).map((m: any, i: number) => ({
          id: 9000 + i,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore ?? 0,
          awayScore: m.awayScore ?? 0,
          status: "Live",
          minute: m.minute || null,
          tournament: m.tournament || "Desconhecido",
        }));
      } catch {
        result = [];
      }
    } else if (action === "today_matches") {
      try {
        const data = await scrapeExtract(
          "https://www.placardefutebol.com.br/jogos-de-hoje",
          `Extract ALL football matches listed for today. For each match: home team name, away team name, home score (if started/finished), away score (if started/finished), status (ao vivo / agendado / encerrado / intervalo), time or minute, tournament/league name.`,
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
                    time: { type: "string" },
                    tournament: { type: "string" },
                  },
                },
              },
            },
          },
          1
        );
        result = (data?.matches || []).map((m: any, i: number) => ({
          id: 8000 + i,
          homeTeam: m.homeTeam || "Unknown",
          awayTeam: m.awayTeam || "Unknown",
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          status: m.status || "agendado",
          time: m.time || null,
          tournament: m.tournament || "Desconhecido",
        }));
      } catch {
        result = [];
      }
    } else if (action === "player_search") {
      const { query } = body;
      if (!query) throw new Error("query required");

      const results = await firecrawlSearch(
        `${query} footballer stats site:sofascore.com/player`,
        8
      );
      result = results
        .filter((r: any) => {
          if (!r.url || !r.url.includes("sofascore.com/player")) return false;
          const desc = (r.description || "").toLowerCase();
          const title = (r.title || "").toLowerCase();
          // Filter out youth/women/futsal teams
          const excludePatterns = [
            /\bef\s*u\d+/i, /\bunder\s*\d+/i, /\bu\d{2}\b/i,
            /\bwomen\b/i, /\bfeminino\b/i, /\bfemale\b/i,
            /\bfutsal\b/i, /\bjuvenil\b/i, /\bjunior\b/i,
            /\byouth\b/i, /\bacademy\b/i, /\bsub-?\d+/i,
          ];
          const text = `${title} ${desc}`;
          return !excludePatterns.some((p) => p.test(text));
        })
        .slice(0, 5)
        .map((r: any, i: number) => ({
          id: i,
          name: r.title?.replace(/ - SofaScore.*$/, "").replace(/ \|.*$/, "").replace(/ stats.*$/i, "").replace(/ statistics.*$/i, "").trim() || query,
          url: r.url,
          description: r.description || "",
        }));
    } else if (action === "player_stats") {
      const { playerUrl } = body;
      if (!playerUrl) throw new Error("playerUrl required");

      const data = await scrapeExtract(
        playerUrl,
        `Extract all player information and statistics. Get: player full name, current team, position, nationality, age, height, preferred foot, shirt number. Also extract the complete season-by-season statistics table with: season year (e.g. "24/25"), team name, matches played (MP), minutes played (MIN), goals scored (GLS), assists (AST), and average SofaScore rating (ASR). Include ALL available seasons from the table.`,
        {
          type: "object",
          properties: {
            name: { type: "string" },
            team: { type: "string" },
            position: { type: "string" },
            nationality: { type: "string" },
            age: { type: "number" },
            height: { type: "string" },
            foot: { type: "string" },
            shirtNumber: { type: "number" },
            seasons: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  season: { type: "string" },
                  team: { type: "string" },
                  matchesPlayed: { type: "number" },
                  minutes: { type: "number" },
                  goals: { type: "number" },
                  assists: { type: "number" },
                  rating: { type: "number" },
                },
              },
            },
          },
        }
      );
      result = data || {};
    } else if (action === "odds") {
      try {
        const data = await scrapeExtract(
          "https://www.oddspedia.com/br/futebol",
          `Extract betting odds for the next upcoming football matches. For each match: home team name, away team name, best odds for home win (decimal), best odds for draw (decimal), best odds for away win (decimal), bookmaker name, match date/time. Get at least 10 matches.`,
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
                    homeOdds: { type: "number" },
                    drawOdds: { type: "number" },
                    awayOdds: { type: "number" },
                    bookmaker: { type: "string" },
                    date: { type: "string" },
                    tournament: { type: "string" },
                  },
                },
              },
            },
          },
          1
        );
        result = (data?.matches || []).map((m: any, i: number) => ({
          id: 7000 + i,
          homeTeam: m.homeTeam || "Unknown",
          awayTeam: m.awayTeam || "Unknown",
          homeOdds: m.homeOdds || 0,
          drawOdds: m.drawOdds || 0,
          awayOdds: m.awayOdds || 0,
          bookmaker: m.bookmaker || "",
          date: m.date || null,
          tournament: m.tournament || "",
        }));
      } catch {
        result = [];
      }
    } else if (action === "team_players") {
      const { teamName } = body;
      if (!teamName) throw new Error("teamName required");

      // First, find the team page on SofaScore
      const teamResults = await firecrawlSearch(
        `${teamName} men's football team squad site:sofascore.com/team/football`,
        3
      );
      const teamPage = teamResults.find((r: any) => 
        r.url && r.url.includes("sofascore.com/team/football") && !(/women|feminino|futsal|u\d{2}|sub-?\d+|youth|junior/i.test(r.url))
      );

      if (!teamPage) {
        result = [];
      } else {
        const squadData = await scrapeExtract(
          teamPage.url,
          `Extract the CURRENT squad/roster of this men's professional football team. For each player get: full name, position (Goalkeeper/Defender/Midfielder/Forward), shirt number, nationality, age. Only include players from the MAIN/FIRST team squad, do NOT include youth or reserve players. List ALL players in the current squad.`,
          {
            type: "object",
            properties: {
              teamName: { type: "string" },
              players: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    position: { type: "string" },
                    shirtNumber: { type: "number" },
                    nationality: { type: "string" },
                    age: { type: "number" },
                  },
                },
              },
            },
          }
        );

        // Now search for each player's individual SofaScore page
        const players = squadData?.players || [];
        result = players.map((p: any, i: number) => ({
          id: i,
          name: p.name || "Unknown",
          position: p.position || "",
          shirtNumber: p.shirtNumber || null,
          nationality: p.nationality || "",
          age: p.age || null,
          url: "", // Will be resolved on click via player_search
        }));
      }
    } else if (action === "team_stats") {
      result = {};

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sports-data error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
