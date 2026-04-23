import { APIRequestContext, Page } from "@playwright/test";

export const API_BASE =
  process.env.E2E_API_URL ?? "http://localhost:3000/api/v1";

/**
 * Connecte l'utilisateur via l'interface (formulaire Login).
 * Retourne l'accessToken capturé depuis la réponse réseau.
 */
export async function loginUI(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);

  const [res] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().includes("/auth/login") && r.request().method() === "POST"
    ),
    page.getByRole("button", { name: "Se connecter" }).click(),
  ]);

  const { accessToken } = (await res.json()) as { accessToken: string };
  return accessToken;
}

/**
 * Crée un nouveau compte utilisateur via l'API et retourne son accessToken.
 * Utile pour les tests qui ont besoin d'un utilisateur vierge.
 */
export async function registerViaApi(
  request: APIRequestContext,
  overrides?: { name?: string }
): Promise<{ email: string; password: string; accessToken: string }> {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 9999)}@fintrack-test.ma`;
  const password = "TestE2E123!";

  const res = await request.post(`${API_BASE}/auth/register`, {
    data: { email, password, name: overrides?.name ?? "Utilisateur Test" },
  });

  const body = (await res.json()) as { accessToken: string };
  return { email, password, accessToken: body.accessToken };
}

/**
 * Crée un compte bancaire pour un utilisateur via l'API.
 */
export async function createAccount(
  request: APIRequestContext,
  token: string,
  name = "CIH Chèque"
): Promise<{ id: string; name: string }> {
  const res = await request.post(`${API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, type: "card", initialBalance: 0, currency: "MAD" },
  });
  return res.json();
}

/**
 * Récupère les catégories système et retourne un map nom→id.
 */
export async function getCategoryMap(
  request: APIRequestContext,
  token: string
): Promise<Record<string, string>> {
  const res = await request.get(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const cats = (await res.json()) as Array<{ id: string; name: string }>;
  return Object.fromEntries(cats.map((c) => [c.name, c.id]));
}

/**
 * Ouvre la modale "Nouvelle transaction" depuis n'importe quelle page
 * où le bouton "+ Nouvelle transaction" est visible.
 */
export async function openTransactionForm(page: Page) {
  await page.getByRole("button", { name: "+ Nouvelle transaction" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
}
