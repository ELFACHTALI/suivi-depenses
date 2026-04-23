import { useState } from "react";
import { useAuthStore } from "../store/auth.ts";
import { api } from "../lib/api.ts";
import Card, { CardHeader } from "../components/ui/Card.tsx";
import Button from "../components/ui/Button.tsx";
import Input from "../components/ui/Input.tsx";
import { initials } from "../lib/utils.ts";

export default function SettingsPage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [currency, setCurrency] = useState(user?.referenceCurrency ?? "MAD");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const updated = await api.put<typeof user>("/auth/me", { name, referenceCurrency: currency });
      if (updated && accessToken) setAuth(updated as any, accessToken);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-semibold text-text-primary">Paramètres</h1>

      {/* Premium banner */}
      {user?.planType === "premium" && (
        <div className="flex items-center justify-between bg-accent text-white rounded-lg px-5 py-3">
          <div className="flex items-center gap-2">
            <span>⭐</span>
            <span className="font-medium text-sm">Plan Premium actif</span>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
            Gérer
          </Button>
        </div>
      )}

      {/* Profil */}
      <Card>
        <CardHeader title="Profil utilisateur" />
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-surface-secondary flex items-center justify-center text-xl font-semibold text-text-primary">
              {initials(name || user?.name || "?")}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{user?.name}</p>
              <p className="text-xs text-text-tertiary">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" value={user?.email ?? ""} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Devise de référence"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
            />
            <Input label="Langue" value="Français" disabled />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {saved && <p className="text-sm text-success">Modifications enregistrées ✓</p>}
          <div className="flex gap-2">
            <Button type="submit">Enregistrer</Button>
            <Button type="button" variant="ghost" onClick={() => { setName(user?.name ?? ""); setCurrency(user?.referenceCurrency ?? "MAD"); }}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader title="Sécurité" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-surface-border">
            <div>
              <p className="text-sm font-medium text-text-primary">Authentification 2FA</p>
              <p className="text-xs text-text-tertiary">Code TOTP via application d'authentification</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user?.isTotpEnabled ? "bg-success-light text-success" : "bg-surface-secondary text-text-tertiary"}`}>
              {user?.isTotpEnabled ? "Activé" : "Désactivé"}
            </span>
          </div>
        </div>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader title="Export & Données" />
        <p className="text-sm text-text-secondary mb-3">
          Exportez vos données personnelles conformément au RGPD.
        </p>
        <Button variant="outline">Exporter mes données (JSON)</Button>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/30">
        <CardHeader title="Zone dangereuse" />
        <p className="text-sm text-text-secondary mb-3">
          La suppression de votre compte est irréversible après 72 heures.
        </p>
        <Button variant="danger" size="sm">Supprimer mon compte</Button>
      </Card>
    </div>
  );
}
