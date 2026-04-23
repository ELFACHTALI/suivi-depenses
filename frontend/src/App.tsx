import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from "react-router-dom";
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
  return <RouterProvider router={router} />;
}
