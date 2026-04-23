import { useState } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../../hooks/useAuth.ts";
import Button from "../../components/ui/Button.tsx";
import Input from "../../components/ui/Input.tsx";
import Card from "../../components/ui/Card.tsx";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    referenceCurrency: "MAD",
  });

  const register = useRegister();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text-primary mb-5">Créer un compte</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); register.mutate(form); }}
        className="space-y-4"
      >
        <Input label="Nom complet" type="text" value={form.name} onChange={set("name")} required />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
        <Input
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={set("password")}
          hint="8 caractères minimum"
          required
          minLength={8}
        />
        <Input
          label="Devise de référence"
          type="text"
          value={form.referenceCurrency}
          onChange={set("referenceCurrency")}
          maxLength={3}
          hint="MAD, EUR, USD…"
        />
        {register.error && (
          <p className="text-sm text-danger">{register.error.message}</p>
        )}
        <Button type="submit" loading={register.isPending} className="w-full">
          Créer mon compte
        </Button>
      </form>
      <p className="text-sm text-text-secondary text-center mt-4">
        Déjà un compte ?{" "}
        <Link to="/login" className="text-text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
