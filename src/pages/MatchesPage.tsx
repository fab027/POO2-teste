import { useState } from "react";
import { Search, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSport } from "@/contexts/SportContext";
import { useMatches } from "@/hooks/useSofaScoreData";
import { SofaMatch } from "@/services/sofaScoreService";

const statusConfig = (s: string) => {
  if (s === "scheduled" || s === "Not started")
    return { text: "Agendada", cls: "bg-sport-light text-sport" };
  if (["Finished", "FT", "After Extra Time", "After Penalties"].includes(s))
    return { text: "Finalizada", cls: "bg-secondary text-muted-foreground" };
  if (s === "Postponed") return { text: "Adiada", cls: "bg-orange-100 text-orange-600" };
  return { text: "Ao Vivo 🔴", cls: "bg-destructive/10 text-destructive" };
};

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MatchCard = ({ m }: { m: SofaMatch & { _type?: string } }) => {
  const st = statusConfig(m.status);
  const isUpcoming = m._type === "upcoming" || m.homeScore === null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="text-right flex-1">
              <p className="font-display font-semibold text-foreground">{m.homeTeam}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isUpcoming ? (
                <span className="font-display text-xl font-bold text-foreground">
                  {m.homeScore} — {m.awayScore}
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">vs</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-foreground">{m.awayTeam}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>
              {st.text}
            </span>
            {m.roundInfo && (
              <span className="text-xs text-muted-foreground">Rodada {m.roundInfo}</span>
            )}
            <span className="text-xs text-muted-foreground">{m.tournament}</span>
            <span className="text-xs text-muted-foreground">{formatDate(m.startTimestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchesPage = () => {
  const { sport, sportLabel } = useSport();
  const sofaSport = sport === "football" ? "football" : "basketball";
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "past" | "upcoming">("all");

  const { lastMatches, nextMatches, allMatches, status, error, refetch } = useMatches(sofaSport);
  const isLoading = status === "loading";

  const filtered = allMatches.filter((m) => {
    const q = search.toLowerCase();
    const matchText =
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      m.tournament.toLowerCase().includes(q);
    if (tab === "past") return matchText && (m as any)._type === "past";
    if (tab === "upcoming") return matchText && (m as any)._type === "upcoming";
    return matchText;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Partidas — {sportLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            {isLoading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Carregando...</>
            ) : status === "error" ? (
              <><WifiOff className="h-3.5 w-3.5 text-destructive" /> Dados offline</>
            ) : (
              <><Wifi className="h-3.5 w-3.5 text-sport" />
                {lastMatches.length} recentes · {nextMatches.length} agendadas — SofaScore
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por equipe ou liga..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-secondary p-1 w-fit">
        {[
          { key: "all", label: `Todas (${allMatches.length})` },
          { key: "past", label: `Finalizadas (${lastMatches.length})` },
          { key: "upcoming", label: `Agendadas (${nextMatches.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-sport text-sport-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && allMatches.length === 0 && (
          [...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="flex items-center justify-center gap-8">
                <div className="h-4 bg-secondary rounded w-32" />
                <div className="h-6 bg-secondary rounded w-16" />
                <div className="h-4 bg-secondary rounded w-32" />
              </div>
            </div>
          ))
        )}

        {!isLoading && filtered.length === 0 && !error && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma partida encontrada.</p>
        )}

        {error && allMatches.length === 0 && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <WifiOff className="mx-auto h-8 w-8 text-destructive/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Não foi possível carregar dados do SofaScore.</p>
            <button onClick={refetch} className="rounded-lg bg-sport px-4 py-2 text-xs font-medium text-sport-foreground hover:opacity-90 transition-opacity">
              Tentar novamente
            </button>
          </div>
        )}

        {filtered.map((m) => (
          <MatchCard key={`${m.id}_${(m as any)._type}`} m={m} />
        ))}
      </div>
    </div>
  );
};

export default MatchesPage;
