import { useSport } from "@/contexts/SportContext";
import FavoriteButton from "@/components/FavoriteButton";
import { footballTeams, basketballTeams } from "@/data/mockData";

const TeamsPage = () => {
  const { sport, sportLabel } = useSport();
  const teams = sport === "football" ? footballTeams : basketballTeams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Equipes — {sportLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as equipes de {sportLabel.toLowerCase()} cadastradas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-sport/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{team.logoUrl}</span>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{team.nome}</h3>
                  <p className="text-xs text-muted-foreground">{team.liga} • {team.pais}</p>
                </div>
              </div>
              <FavoriteButton tipo="equipe" referenciaId={team.id} nome={team.nome} />
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{team.jogadores} jogadores</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsPage;
