import { useFavorites } from "@/contexts/FavoritesContext";
import { Star, Trash2 } from "lucide-react";

const FavoritesPage = () => {
  const { favorites, toggleFavorite } = useFavorites();

  const footballFavs = favorites.filter(f => f.esporte === "football");
  const basketballFavs = favorites.filter(f => f.esporte === "basketball");

  const renderGroup = (title: string, items: typeof favorites, emoji: string) => (
    <div>
      <h2 className="mb-3 font-display text-lg font-semibold text-foreground flex items-center gap-2">
        {emoji} {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum favorito ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map((fav) => (
            <div
              key={`${fav.tipo}-${fav.referenciaId}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 fill-basketball text-basketball" />
                <div>
                  <p className="text-sm font-medium text-foreground">{fav.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize">{fav.tipo}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(fav)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus atletas e equipes favoritos para acesso rápido
        </p>
      </div>

      <div className="space-y-8">
        {renderGroup("Futebol", footballFavs, "⚽")}
        {renderGroup("Basquete", basketballFavs, "🏀")}
      </div>
    </div>
  );
};

export default FavoritesPage;
