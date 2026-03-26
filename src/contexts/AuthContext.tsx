import React, { createContext, useContext, useState, useCallback } from "react";

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: "analista" | "apostador" | "admin";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => boolean;
  register: (nome: string, email: string, senha: string, perfil: User["perfil"]) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("sportando_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _senha: string) => {
    const mockUser: User = {
      id: "1",
      nome: email.split("@")[0],
      email,
      perfil: "analista",
    };
    setUser(mockUser);
    localStorage.setItem("sportando_user", JSON.stringify(mockUser));
    return true;
  }, []);

  const register = useCallback((nome: string, email: string, _senha: string, perfil: User["perfil"]) => {
    const mockUser: User = { id: "1", nome, email, perfil };
    setUser(mockUser);
    localStorage.setItem("sportando_user", JSON.stringify(mockUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("sportando_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
