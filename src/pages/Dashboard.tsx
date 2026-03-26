import { useSport } from "@/contexts/SportContext";
import StatCard from "@/components/StatCard";
import { Trophy, Users, CalendarDays, BrainCircuit, TrendingUp } from "lucide-react";
import {
  footballTeams, basketballTeams, footballAthletes, basketballAthletes,
  footballMatches, basketballMatches, footballPredictions, basketballPredictions,
  performanceData,
} from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

const Dashboard = () => {
  const { sport, sportLabel } = useSport();
  const isFootball = sport === "football";

  const teams = isFootball ? footballTeams : basketballTeams;
  const athletes = isFootball ? footballAthletes : basketballAthletes;
  const matches = isFootball ? footballMatches : basketballMatches;
  const predictions = isFootball ? footballPredictions : basketballPredictions;
  const chartData = isFootball ? performanceData.football : performanceData.basketball;

  const upcomingMatches = matches.filter(m => m.status === "agendada");
  const chartColor = isFootball ? "hsl(160, 60%, 40%)" : "hsl(30, 90%, 52%)";
  const chartColor2 = isFootball ? "hsl(160, 40%, 65%)" : "hsl(30, 60%, 70%)";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard — {sportLabel}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral de dados e estatísticas de {sportLabel.toLowerCase()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Equipes" value={teams.length} icon={Trophy} subtitle="cadastradas" trend="up" trendValue="2 novas" />
        <StatCard title="Atletas" value={athletes.length} icon={Users} subtitle="monitorados" />
        <StatCard title="Partidas" value={matches.length} icon={CalendarDays} subtitle={`${upcomingMatches.length} agendadas`} />
        <StatCard title="Previsões" value={predictions.length} icon={BrainCircuit} subtitle="geradas pelo modelo" trend="up" trendValue="92% acurácia" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">
            {isFootball ? "Gols & Assistências por Mês" : "Pontos & Rebotes por Mês"}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="mes" fontSize={12} stroke="hsl(220, 10%, 46%)" />
              <YAxis fontSize={12} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey={isFootball ? "gols" : "pontos"}
                fill={chartColor}
                radius={[4, 4, 0, 0]}
                name={isFootball ? "Gols" : "Pontos"}
              />
              <Bar
                dataKey={isFootball ? "assistencias" : "rebotes"}
                fill={chartColor2}
                radius={[4, 4, 0, 0]}
                name={isFootball ? "Assistências" : "Rebotes"}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-sm font-semibold text-foreground">
            Tendência de Desempenho
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
              <XAxis dataKey="mes" fontSize={12} stroke="hsl(220, 10%, 46%)" />
              <YAxis fontSize={12} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                contentStyle={{
                  background: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 15%, 90%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey={isFootball ? "gols" : "pontos"}
                stroke={chartColor}
                strokeWidth={2}
                dot={{ r: 4, fill: chartColor }}
                name={isFootball ? "Gols" : "Pontos"}
              />
              <Line
                type="monotone"
                dataKey={isFootball ? "assistencias" : "rebotes"}
                stroke={chartColor2}
                strokeWidth={2}
                dot={{ r: 4, fill: chartColor2 }}
                name={isFootball ? "Assistências" : "Rebotes"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sport" />
          Próximas Partidas
        </h3>
        {upcomingMatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma partida agendada.</p>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-foreground">{m.casa}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="font-medium text-sm text-foreground">{m.fora}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{m.liga}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.dataHora).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
