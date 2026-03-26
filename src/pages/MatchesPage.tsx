import { useSport } from "@/contexts/SportContext";
import { footballMatches, basketballMatches } from "@/data/mockData";

const MatchesPage = () => {
  const { sport, sportLabel } = useSport();
  const matches = sport === "football" ? footballMatches : basketballMatches;

  const statusLabel = (s: string) => {
    switch (s) {
      case "agendada": return { text: "Agendada", cls: "bg-sport-light text-sport" };
      case "finalizada": return { text: "Finalizada", cls: "bg-secondary text-muted-foreground" };
      case "em_andamento": return { text: "Ao Vivo", cls: "bg-destructive/10 text-destructive" };
      default: return { text: s, cls: "bg-secondary text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Partidas — {sportLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Histórico e próximas partidas</p>
      </div>

      <div className="space-y-3">
        {matches.map((m) => {
          const status = statusLabel(m.status);
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="text-right flex-1">
                      <p className="font-display font-semibold text-foreground">{m.casa}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.placarCasa !== null ? (
                        <span className="font-display text-xl font-bold text-foreground">
                          {m.placarCasa} — {m.placarFora}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">vs</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-foreground">{m.fora}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                      {status.text}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.liga}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.dataHora).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchesPage;
