import React, { createContext, useContext, useState, useCallback } from "react";

interface Favorite {
  tipo: "atleta" | "equipe";
  referenciaId: string;
  nome: string;
  esporte: "football" | "basketball";
}

interface FavoritesContextType {
  favorites: Favorite[];
  toggleFavorite: (fav: Favorite) => void;
  isFavorite: (tipo: string, id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    const stored = localStorage.getItem("sportando_favorites");
    return stored ? JSON.parse(stored) : [];
  });

  const toggleFavorite = useCallback((fav: Favorite) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.tipo === fav.tipo && f.referenciaId === fav.referenciaId);
      const next = exists
        ? prev.filter(f => !(f.tipo === fav.tipo && f.referenciaId === fav.referenciaId))
        : [...prev, fav];
      localStorage.setItem("sportando_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((tipo: string, id: string) => {
    return favorites.some(f => f.tipo === tipo && f.referenciaId === id);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
