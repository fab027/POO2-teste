import { useSport } from "@/contexts/SportContext";
import StatCard from "@/components/StatCard";
import { Trophy, Users, CalendarDays, BrainCircuit, TrendingUp, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useStandings, useMatches, useLiveMatches } from "@/hooks/useSofaScoreData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

const Dashboard = () => {
  const { sport, sportLabel } = useSport();
  const isFootball = sport === "football";
  const sofaSport = isFootball ? "football" : "basketball";

  const { data: standings, status: sStatus, refetch: refetchStandings } = useStandings(sofaSport);
  const { lastMatches, nextMatches, status: mStatus, refetch: refetchMatches } = useMatches(sofaSport);
  const { data: liveMatches, status: lStatus } = useLiveMatches(sofaSport);

  const isLoading = sStatus === "loading" || mStatus === "loading";
  const hasError = sStatus === "error" || mStatus === "error";

  const chartData = standings.slice(0, 8).map((t) => ({
    mes: t.shortName || t.name.slice(0, 6),
    gols: t.scored,
    assistencias: t.wins,
    pontos: t.points,
    rebotes: t.played,
  }));

  const chartColor = isFootball ? "hsl(160, 60%, 40%)" : "hsl(30, 90%, 52%)";
  const chartColor2 = isFootball ? "hsl(160, 40%, 65%)" : "hsl(30, 60%, 70%)";

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const matchStatus = (s: string) => {
    if (s === "scheduled" || s === "Not started") return { text: "Agendada", cls: "bg-sport-light text-sport" };
    if (s === "Finished" || s === "FT" || s === "After Extra Time" || s === "After Penalties")
      return { text: "Finalizada", cls: "bg-secondary text-muted-foreground" };
    return { text: "Ao Vivo 🔴", cls: "bg-destructive/10 text-destructive" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard — {sportLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
            {isLoading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Carregando dados...</>
            ) : hasError ? (
              <><WifiOff className="h-3.5 w-3.5 text-destructive" /> Dados offline — tente novamente</>
            ) : (
              <><Wifi className="h-3.5 w-3.5 text-sport" /> Dados em tempo real via SofaScore</>
            )}
          </p>
        </div>
        <button
          onClick={() => { refetchStandings(); refetchMatches(); }}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {liveMatches.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-2 text-xs font-semibold text-destructive uppercase tracking-wider">🔴 Ao Vivo agora</p>
          <div className="flex flex-wrap gap-3">
            {liveMatches.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm border border-border">
                <span className="font-medium">{m.homeTeam}</span>
                <span className="font-bold text-destructive">{m.homeScore} – {m.awayScore}</span>
                <span className="font-medium">{m.awayTeam}</span>
                {m.minute && <span className="text-xs text-muted-foreground">{m.minute}'</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Equipes na Tabela" value={standings.length || "—"} icon={Trophy} subtitle={isFootball ? "Brasileirão Série A" : "NBA"} trend={standings.length > 0 ? "up" : undefined} trendValue={standings.length > 0 ? "Dados reais" : undefined} />
        <StatCard title="Partidas Recentes" value={lastMatches.length || "—"} icon={CalendarDays} subtitle="desta temporada" />
        <StatCard title="Próximos Jogos" value={nextMatches.length || "—"} icon={Users} subtitle="agendados" />
        <StatCard title="Ao Vivo Agora" value={liveMatches.length || 0} icon={BrainCircuit} subtitle="partidas em andamento" trend={liveMatches.length > 0 ? "up" : undefined} trendValue={liveMatches.length > 0 ? "Live" : undefined} />
      </div>

      {chartData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 font-display text-sm font-semibold text-foreground">
              {isFootball ? "Gols Marcados (Top 8)" : "Pontos na Tabela (Top 8)"}
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">Dados reais desta temporada</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 10%, 46%)" />
                <YAxis fontSize={11} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey={isFootball ? "gols" : "pontos"} fill={chartColor} radius={[4, 4, 0, 0]} name={isFootball ? "Gols" : "Pontos"} />
                <Bar dataKey={isFootball ? "assistencias" : "rebotes"} fill={chartColor2} radius={[4, 4, 0, 0]} name={isFootball ? "Vitórias" : "Jogos"} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 font-display text-sm font-semibold text-foreground">Tendência de Desempenho</h3>
            <p className="mb-4 text-xs text-muted-foreground">Pontuação acumulada por time</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="mes" fontSize={11} stroke="hsl(220, 10%, 46%)" />
                <YAxis fontSize={11} stroke="hsl(220, 10%, 46%)" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="pontos" stroke={chartColor} strokeWidth={2} dot={{ r: 3, fill: chartColor }} name="Pontos" />
                <Line type="monotone" dataKey="gols" stroke={chartColor2} strokeWidth={2} dot={{ r: 3, fill: chartColor2 }} name={isFootball ? "Gols" : "Cestinhas"} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {standings.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-sport" />
            Classificação — {isFootball ? "Brasileirão Série A" : "NBA"} (Top 10)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="pb-2 text-left w-8">#</th>
                  <th className="pb-2 text-left">Time</th>
                  <th className="pb-2 text-center">J</th>
                  <th className="pb-2 text-center">V</th>
                  <th className="pb-2 text-center">E</th>
                  <th className="pb-2 text-center">D</th>
                  <th className="pb-2 text-center">{isFootball ? "GP" : "Pts"}</th>
                  <th className="pb-2 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-2 text-muted-foreground text-xs">{t.position}</td>
                    <td className="py-2 font-medium text-foreground">{t.name}</td>
                    <td className="py-2 text-center text-muted-foreground">{t.played}</td>
                    <td className="py-2 text-center text-muted-foreground">{t.wins}</td>
                    <td className="py-2 text-center text-muted-foreground">{t.draws}</td>
                    <td className="py-2 text-center text-muted-foreground">{t.losses}</td>
                    <td className="py-2 text-center text-muted-foreground">{t.scored}</td>
                    <td className="py-2 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-sport-light px-2 py-0.5 text-xs font-bold text-sport">
                        {t.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {nextMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sport" />
            Próximas Partidas
          </h3>
          <div className="space-y-3">
            {nextMatches.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-foreground">{m.homeTeam}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="font-medium text-sm text-foreground">{m.awayTeam}</span>
                </div>
                <div className="text-right">
                  {m.roundInfo && <p className="text-xs text-muted-foreground">Rodada {m.roundInfo}</p>}
                  <p className="text-xs text-muted-foreground">{formatDate(m.startTimestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lastMatches.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">Últimas Partidas</h3>
          <div className="space-y-3">
            {lastMatches.slice(0, 8).map((m) => {
              const st = matchStatus(m.status);
              return (
                <div key={m.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-right flex-1">
                        <p className="font-display font-semibold text-foreground text-sm">{m.homeTeam}</p>
                      </div>
                      <div className="text-center">
                        <span className="font-display text-lg font-bold text-foreground">
                          {m.homeScore ?? 0} — {m.awayScore ?? 0}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-display font-semibold text-foreground text-sm">{m.awayTeam}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
                      {st.text}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(m.startTimestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && standings.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
              <div className="h-8 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {hasError && standings.length === 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <WifiOff className="mx-auto h-8 w-8 text-destructive/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar dados do SofaScore. Verifique a conexão e tente novamente.
          </p>
          <button
            onClick={() => { refetchStandings(); refetchMatches(); }}
            className="mt-3 rounded-lg bg-sport px-4 py-2 text-xs font-medium text-sport-foreground hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
