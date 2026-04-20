import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function requireFirecrawlKey(): string {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  return key;
}

const scrapeExtract = async (
  url: string,
  prompt: string,
  schema: Record<string, unknown>,
  retries = 2
): Promise<any> => {
  const key = requireFirecrawlKey();

  for (let attempt = 0; attempt <= retries; attempt++) {
    console.log(`Scraping (attempt ${attempt + 1}): ${url}`);
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
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
        console.warn(`Timeout 408, retrying...`);
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
  const key = requireFirecrawlKey();

  console.log(`Searching: "${query}" (limit ${limit})`);
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Search error ${res.status}:`, errText);
    throw new Error(`Search error: ${res.status}`);
  }
  const data = await res.json();
  console.log(`Search returned ${(data.data || []).length} results`);
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

const liveMatchesSchema = {
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
          status: { type: "string" },
        },
      },
    },
  },
};

const todayMatchesSchema = {
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
};

const squadSchema = {
  type: "object",
  properties: {
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

      // Use the dedicated matches tab on SofaScore (more reliable dates + round numbers)
      const matchesUrl = leagueUrl.replace(/\/$/, "") + "/matches";
      const todayIso = new Date().toISOString().slice(0, 10);

      const strictRules = `CRITICAL RULES:
- Use ONLY the REAL club names exactly as they appear on the page (e.g. "Flamengo", "Palmeiras", "Real Madrid", "Manchester City").
- NEVER invent, translate, abbreviate or use placeholders like "Team A", "Team B", "Home", "Away", "Time 1", "Equipe X", "TBD".
- If you cannot clearly read both real team names from the page content, OMIT that match entirely from the output.
- Return an empty matches array if no real matches can be read. Do NOT fabricate examples.`;

      const prompt = isLast
        ? `Today is ${todayIso}. Extract the MOST RECENT FINISHED matches from this league page.
${strictRules}
For each REAL match include: home team name, away team name, home score (final integer), away score (final integer), status "Finished", the EXACT match date and kickoff time as ISO 8601 string INCLUDING THE YEAR (e.g. "2026-04-15T20:00:00"), and the EXACT round/rodada number shown next to that specific match. The date MUST be in the past (before ${todayIso}). Return up to 15 matches sorted newest first. Do NOT include future or not-started matches.`
        : `Today is ${todayIso}. Extract the UPCOMING / SCHEDULED / NOT STARTED matches from this league page.
${strictRules}
For each REAL match include: home team name, away team name, status "Scheduled", the EXACT scheduled date and kickoff time as ISO 8601 string INCLUDING THE YEAR (e.g. "2026-04-22T16:00:00"), and the EXACT round/rodada number for that specific match. The date MUST be in the future (today ${todayIso} or later). Return up to 15 matches sorted soonest first. Do NOT include finished or live matches.`;

      const data = await scrapeExtract(matchesUrl, prompt, matchesSchema);

      const nowSec = Math.floor(Date.now() / 1000);
      const rawMatches = (data?.matches || []).map((m: any, i: number) => {
        let ts = 0;
        if (m.date) {
          const parsed = new Date(m.date).getTime();
          if (!isNaN(parsed)) ts = Math.floor(parsed / 1000);
        }
        return {
          id: (isLast ? 1000 : 5000) + i,
          homeTeam: m.homeTeam || "Unknown",
          awayTeam: m.awayTeam || "Unknown",
          homeScore: isLast ? (m.homeScore ?? null) : null,
          awayScore: isLast ? (m.awayScore ?? null) : null,
          status: m.status || (isLast ? "Finished" : "Scheduled"),
          startTimestamp: ts,
          roundInfo: typeof m.round === "number" && m.round > 0 ? m.round : null,
        };
      });

      // Reject placeholder/generic team names that the LLM sometimes invents
      const placeholderRe = /^(team|equipe|time|home|away|casa|fora)\s*[a-z0-9]?$|^(tbd|n\/a|unknown|---?)$/i;
      const isRealName = (s: string) => !!s && s.trim().length >= 2 && !placeholderRe.test(s.trim());

      // Strict temporal filtering + real-name filtering to avoid stale/mislabeled data
      const filtered = rawMatches.filter((m) => {
        if (!isRealName(m.homeTeam) || !isRealName(m.awayTeam)) return false;
        if (!m.startTimestamp) return false;
        if (isLast) return m.startTimestamp < nowSec;
        return m.startTimestamp >= nowSec - 3600; // allow 1h slack for just-started
      });

      // Sort: last matches desc (newest first), next matches asc (soonest first)
      filtered.sort((a, b) =>
        isLast ? b.startTimestamp - a.startTimestamp : a.startTimestamp - b.startTimestamp
      );

      console.log(`${action}: ${rawMatches.length} raw -> ${filtered.length} after filter`);
      result = filtered;
    } else if (action === "live") {
      try {
        const data = await scrapeExtract(
          "https://www.placardefutebol.com.br/jogos-de-hoje",
          `Look at ALL matches on this page. Extract ONLY the matches that are currently LIVE / "Ao Vivo" / in progress right now - they show a running minute like "32'" or "HT" or "2T" or have a pulsing live indicator. For each live match extract: home team name, away team name, current home score (number), current away score (number), current minute or period (e.g. "32'", "HT", "65'"), tournament/league name. If NO matches are currently live, return an empty matches array. Do NOT include finished or scheduled matches.`,
          liveMatchesSchema,
          1
        );
        const matches = data?.matches || [];
        console.log(`Live matches found: ${matches.length}`);
        result = matches
          .filter((m: any) => m.homeTeam && m.awayTeam)
          .map((m: any, i: number) => ({
            id: 9000 + i,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore ?? 0,
            awayScore: m.awayScore ?? 0,
            status: "Live",
            minute: m.minute || null,
            tournament: m.tournament || "Desconhecido",
          }));
      } catch (err) {
        console.error("Live scraping error:", err);
        result = [];
      }
    } else if (action === "today_matches") {
      try {
        const data = await scrapeExtract(
          "https://www.placardefutebol.com.br/jogos-de-hoje",
          `Extract ALL football matches listed on this page for today. Include matches of ALL statuses: live, scheduled, finished, halftime. For each match: home team full name, away team full name, home score (number, null if not started), away score (number, null if not started), status text (ao vivo/agendado/encerrado/intervalo), scheduled time or current minute, tournament/league name.`,
          todayMatchesSchema,
          1
        );
        const matches = data?.matches || [];
        console.log(`Today matches found: ${matches.length}`);
        result = matches
          .filter((m: any) => m.homeTeam && m.awayTeam)
          .map((m: any, i: number) => ({
            id: 8000 + i,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore ?? null,
            awayScore: m.awayScore ?? null,
            status: m.status || "agendado",
            time: m.time || null,
            tournament: m.tournament || "Desconhecido",
          }));
      } catch (err) {
        console.error("Today matches error:", err);
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
          const text = `${(r.title || "")} ${(r.description || "")}`.toLowerCase();
          const excludePatterns = [
            /\bwomen\b/i, /\bfeminino\b/i, /\bfemale\b/i,
            /\bfutsal\b/i, /\bjuvenil\b/i, /\bjunior\b/i,
            /\byouth\b/i, /\bacademy\b/i, /\bsub-?\d+/i,
            /\bu\d{2}\b/i, /\bunder\s*\d+/i,
          ];
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
          `Extract betting odds for the next upcoming football matches. For each match: home team name, away team name, best odds for home win (decimal), best odds for draw (decimal), best odds for away win (decimal), bookmaker name, match date/time, tournament name. Get at least 10 matches.`,
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

      console.log(`Looking for team: ${teamName}`);

      // Try multiple search strategies
      let teamPageUrl: string | null = null;

      // Strategy 1: Direct SofaScore search
      // Single optimized search
      const searches = [
        `${teamName} football team squad site:sofascore.com`,
      ];

      for (const q of searches) {
        if (teamPageUrl) break;
        try {
          const results = await firecrawlSearch(q, 5);
          console.log(`Search "${q}" returned ${results.length} results`);
          for (const r of results) {
            if (!r.url) continue;
            console.log(`  Result: ${r.url} - ${r.title || ""}`);
            // Match both URL formats: /football/team/ and /team/football/
            const isSofaTeam = r.url.includes("sofascore.com/football/team/") || r.url.includes("sofascore.com/team/football/");
            const isExcluded = /women|feminino|futsal|u\d{2}|sub-?\d+|youth|junior|academia|talento/i.test(r.url + " " + (r.title || ""));
            if (isSofaTeam && !isExcluded) {
              teamPageUrl = r.url;
              break;
            }
          }
        } catch (err) {
          console.error(`Search failed for "${q}":`, err);
        }
      }

      if (!teamPageUrl) {
        console.log("No team page found, returning empty");
        result = [];
      } else {
        console.log(`Scraping squad from: ${teamPageUrl}`);
        try {
          const squadData = await scrapeExtract(
            teamPageUrl,
            `Extract the COMPLETE CURRENT first-team squad/roster of this men's professional football team. For EVERY player in the squad list: full name, playing position (Goalkeeper/Defender/Midfielder/Forward), shirt/jersey number, nationality, age. Include ALL players shown. Do NOT skip any player. This is the main senior men's team only.`,
            squadSchema
          );

          const players = squadData?.players || [];
          console.log(`Squad extracted: ${players.length} players`);
          result = players.map((p: any, i: number) => ({
            id: i,
            name: p.name || "Unknown",
            position: p.position || "",
            shirtNumber: p.shirtNumber || null,
            nationality: p.nationality || "",
            age: p.age || null,
            url: "",
          }));
        } catch (err) {
          console.error("Squad scrape failed:", err);
          result = [];
        }
      }
    } else if (action === "team_stats") {
      result = {};
    }

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
