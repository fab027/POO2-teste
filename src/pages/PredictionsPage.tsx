import { useSport } from "@/contexts/SportContext";
import { footballPredictions, basketballPredictions } from "@/data/mockData";
import { BrainCircuit } from "lucide-react";

const PredictionsPage = () => {
  const { sport, sportLabel } = useSport();
  const isFootball = sport === "football";
  const predictions = isFootball ? footballPredictions : basketballPredictions;

  const getBarWidth = (prob: number) => `${Math.max(prob, 2)}%`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-sport" />
          Previsões ML — {sportLabel}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Previsões geradas por Machine Learning para partidas agendadas
        </p>
      </div>

      <div className="space-y-4">
        {predictions.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-foreground">
                {p.casa} vs {p.fora}
              </h3>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Modelo: {p.modeloVersao}</span>
                <br />
                <span className="text-xs text-muted-foreground">{p.algoritmo}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Vitória {p.casa}</span>
                  <span className="font-semibold text-sport">{p.probCasa.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-sport transition-all" style={{ width: getBarWidth(p.probCasa) }} />
                </div>
              </div>

              {isFootball && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">Empate</span>
                    <span className="font-semibold text-muted-foreground">{p.probEmpate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-muted-foreground/40 transition-all" style={{ width: getBarWidth(p.probEmpate) }} />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">Vitória {p.fora}</span>
                  <span className="font-semibold text-muted-foreground">{p.probFora.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: getBarWidth(p.probFora) }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictionsPage;
