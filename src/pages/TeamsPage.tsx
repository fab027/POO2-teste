import { useState } from "react";
import { Search, RefreshCw, Wifi, WifiOff, Trophy, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSport } from "@/contexts/SportContext";
import { useStandings } from "@/hooks/useSofaScoreData";
import { useFavorites } from "@/contexts/FavoritesContext";

const PositionBadge = ({ pos }: { pos: number }) => {
  if (pos <= 4) return <span className="text-sport font-bold text-sm">#{pos}</span>;
  if (pos >= 17) return <span className="text-destructive font-bold text-sm">#{pos}</span>;
  return <span className="text-muted-foreground text-sm">#{pos}</span>;
};

const TeamsPage = () => {
  const { sport, sportLabel } = useSport();
  const sofaSport = sport === "football" ? "football" : "basketball";
  const [search, setSearch] = useState("");
  const { toggleFavorite, isFavorite } = useFavorites();

  const { data: standings, status, error, refetch } = useStandings(sofaSport);
  const isLoading = status === "loading";

  const filtered = standings.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.shortName?.toLowerCase().includes(search.toLowerCase())
  );

  const leagueLabel = sport === "football" ? "Brasileirão Série A" : "NBA";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Equipes — {sportLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            {isLoading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Carregando...</>
            ) : status === "error" ? (
              <><WifiOff className="h-3.5 w-3.5 text-destructive" /> Dados offline</>
            ) : (
              <><Wifi className="h-3.5 w-3.5 text-sport" />
                {standings.length} equipes · {leagueLabel} — SofaScore
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
              placeholder="Buscar equipe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {sport === "football" && standings.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-sport" />
            <span>Classificação para Libertadores (1º–4º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Rebaixamento (18º–20º)</span>
          </div>
        </div>
      )}

      {standings.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">J</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">V</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">E</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">D</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">GP</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">GC</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground">Pts</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">⭐</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const favorited = isFavorite("equipe", String(t.id));
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3"><PositionBadge pos={t.position} /></td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.played}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.wins}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.draws}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.losses}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.scored}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{t.conceded}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-md bg-sport-light px-2 py-0.5 text-xs font-bold text-sport">
                        {t.points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFavorite({ tipo: "equipe", referenciaId: String(t.id), nome: t.name, esporte: sport })}
                        className="transition-colors hover:scale-110"
                      >
                        <Star className={`h-4 w-4 ${favorited ? "fill-basketball text-basketball" : "text-muted-foreground"}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isLoading && standings.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-4 bg-secondary rounded w-3/4 mb-3" />
              <div className="h-4 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && standings.length === 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <WifiOff className="mx-auto h-8 w-8 text-destructive/50 mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Não foi possível carregar dados do SofaScore.</p>
          <button onClick={refetch} className="rounded-lg bg-sport px-4 py-2 text-xs font-medium text-sport-foreground hover:opacity-90">
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
