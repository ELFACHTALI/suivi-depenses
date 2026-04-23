import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/auth.ts";
import AppLayout from "./layouts/AppLayout.tsx";
import AuthLayout from "./layouts/AuthLayout.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import RegisterPage from "./pages/auth/RegisterPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import TransactionsPage from "./pages/TransactionsPage.tsx";
import BudgetsPage from "./pages/BudgetsPage.tsx";
import ObjectivesPage from "./pages/ObjectivesPage.tsx";
import InsightsPage from "./pages/InsightsPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <RedirectIfAuth><LoginPage /></RedirectIfAuth> },
      { path: "/register", element: <RedirectIfAuth><RegisterPage /></RedirectIfAuth> },
    ],
  },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/budgets", element: <BudgetsPage /> },
      { path: "/objectives", element: <ObjectivesPage /> },
      { path: "/insights", element: <InsightsPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export default function App() {
  const [ready, setReady] = useState(false);
  const { user, setAccessToken, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }
    // user est en localStorage mais accessToken est en mémoire seulement :
    // on tente un refresh silencieux au démarrage (cookie httpOnly)
    const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
    fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ accessToken }: { accessToken: string }) => setAccessToken(accessToken))
      .catch(() => clearAuth())
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) return null;
  return <RouterProvider router={router} />;
}
