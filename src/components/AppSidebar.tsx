import { NavLink, useLocation } from "react-router-dom";
import { useSport } from "@/contexts/SportContext";
import { useAuth } from "@/contexts/AuthContext";
import SportSwitcher from "./SportSwitcher";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarDays,
  BrainCircuit,
  Star,
  Sparkles,
  LogOut,
  LogIn,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/equipes", label: "Equipes", icon: Trophy },
  { to: "/atletas", label: "Atletas", icon: Users },
  { to: "/partidas", label: "Partidas", icon: CalendarDays },
  { to: "/previsoes", label: "Previsões ML", icon: BrainCircuit },
  { to: "/favoritos", label: "Favoritos", icon: Star },
];

const AppSidebar = () => {
  const { sportClass } = useSport();
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <aside className={`${sportClass} flex h-screen w-64 flex-col border-r border-border bg-card`}>
      <div className="flex items-center gap-2 border-b border-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sport text-sport-foreground font-display font-bold text-sm">
          S
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          Sportando
        </span>
      </div>

      <div className="px-4 py-4">
        <SportSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sport-light text-sport"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sport text-sport-foreground text-xs font-bold">
                {user?.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user?.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.perfil}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Entrar
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;
