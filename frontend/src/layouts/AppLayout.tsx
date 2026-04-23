import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn, initials } from "../lib/utils.ts";
import { useAuthStore } from "../store/auth.ts";
import { useLogout } from "../hooks/useAuth.ts";
import Badge from "../components/ui/Badge.tsx";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  premium?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Aperçu",
    items: [
      { to: "/dashboard", label: "Tableau de bord", icon: "⊞" },
      { to: "/transactions", label: "Transactions", icon: "↕" },
    ],
  },
  {
    section: "Pilotage",
    items: [
      { to: "/budgets", label: "Budgets", icon: "◫" },
      { to: "/objectives", label: "Objectifs", icon: "◎" },
      { to: "/insights", label: "Insights", icon: "◈", premium: true },
    ],
  },
  {
    section: "Compte",
    items: [{ to: "/settings", label: "Paramètres", icon: "◉" }],
  },
];

export default function AppLayout() {
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-[#1a1917] flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="text-white font-semibold text-lg">Fintrack</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-1">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map(({ to, label, icon, premium }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 px-2 py-2 rounded-sm text-sm transition-colors",
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )
                      }
                    >
                      <span className="text-base">{icon}</span>
                      <span className="flex-1">{label}</span>
                      {premium && (
                        <Badge variant="premium" className="text-[10px] py-0">★</Badge>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User chip */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user ? initials(user.name) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <p className="text-[11px] text-white/50 capitalize">{user?.planType}</p>
            </div>
            <button
              onClick={() => logout.mutate()}
              title="Déconnexion"
              className="text-white/30 hover:text-white/70 text-xs transition-colors"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[220px] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
