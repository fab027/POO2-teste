import { useSport } from "@/contexts/SportContext";
import FavoriteButton from "@/components/FavoriteButton";
import { footballAthletes, basketballAthletes } from "@/data/mockData";

const AthletesPage = () => {
  const { sport, sportLabel } = useSport();
  const isFootball = sport === "football";
  const athletes = isFootball ? footballAthletes : basketballAthletes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Atletas — {sportLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estatísticas individuais dos atletas</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atleta</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Posição</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Equipe</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {isFootball ? "Gols" : "PPG"}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                {isFootball ? "Assistências" : "RPG"}
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">⭐</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a: any) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{a.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.posicao}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.equipe}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-sport-light px-2 py-0.5 text-xs font-semibold text-sport">
                    {isFootball ? a.gols : a.pontos}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{isFootball ? a.assistencias : a.rebotes}</td>
                <td className="px-4 py-3 text-center">
                  <FavoriteButton tipo="atleta" referenciaId={a.id} nome={a.nome} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AthletesPage;
