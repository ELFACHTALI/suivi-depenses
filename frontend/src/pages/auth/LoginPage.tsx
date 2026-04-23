import { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../../hooks/useAuth.ts";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import Card from "../../components/ui/Card.tsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needTotp, setNeedTotp] = useState(false);

  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password, ...(totp ? { totpToken: totp } : {}) },
      {
        onError: (err) => {
          if (err.message.includes("2FA")) setNeedTotp(true);
        },
      }
    );
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-5">Connexion</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {needTotp && (
          <Input
            label="Code 2FA (6 chiffres)"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="000000"
          />
        )}
        {login.error && (
          <p className="text-sm text-danger">{login.error.message}</p>
        )}
        <Button type="submit" loading={login.isPending} className="w-full">
          Se connecter
        </Button>
      </form>
      <p className="text-sm text-text-secondary text-center mt-4">
        Pas encore de compte ?{" "}
        <Link to="/register" className="text-text-primary font-medium hover:underline">
          S'inscrire
        </Link>
      </p>
    </Card>
  );
}
