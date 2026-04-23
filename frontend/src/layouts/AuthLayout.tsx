import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">Fintrack</h1>
          <p className="text-sm text-text-secondary mt-1">Gestion des finances personnelles</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
