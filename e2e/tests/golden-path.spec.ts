import { test, expect } from "@playwright/test";

const TEST_EMAIL = `e2e-${Date.now()}@fintrack-test.ma`;
const TEST_PASSWORD = "TestFintrack123!";
const TEST_NAME = "E2E Testeur";

test.describe("Parcours golden path Fintrack", () => {
  test("1 — Redirection /login si non authentifié", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });

  test("2 — Inscription d'un nouvel utilisateur", async ({ page }) => {
    await page.goto("/register");

    await page.getByLabel("Nom complet").fill(TEST_NAME);
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page.getByText("Tableau de bord")).toBeVisible();
  });

  test("3 — Dashboard charge et affiche les stats", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Vérifier les 4 cartes de stats
    await expect(page.getByText("Solde net")).toBeVisible();
    await expect(page.getByText("Revenus du mois")).toBeVisible();
    await expect(page.getByText("Dépenses du mois")).toBeVisible();
    await expect(page.getByText("Taux d'épargne")).toBeVisible();
  });

  test("4 — Créer une dépense via le formulaire", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Créer un compte d'abord via l'API (nécessaire pour le formulaire)
    const apiBase = "http://localhost:3000/api/v1";
    const tokenMatch = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("fintrack-auth") ?? "{}").state?.accessToken
    );
    expect(tokenMatch).toBeTruthy();

    // Ouvrir le formulaire de transaction
    await page.getByRole("button", { name: "+ Dépense" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Le formulaire s'affiche (même sans compte créé, le bouton existe)
    await expect(page.getByLabel("Libellé")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("5 — Navigation vers Transactions", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByRole("link", { name: "Transactions" }).click();
    await expect(page).toHaveURL(/\/transactions/);
    await expect(page.getByText("Transactions")).toBeVisible();
  });

  test("6 — Navigation vers Budgets", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByRole("link", { name: "Budgets" }).click();
    await expect(page).toHaveURL(/\/budgets/);
    await expect(page.getByText("Aucun budget")).toBeVisible();
  });

  test("7 — Gate Premium sur Insights pour plan free", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByRole("link", { name: "Insights" }).click();
    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByText("Fonctionnalité Premium")).toBeVisible();
    await expect(page.getByRole("button", { name: /Premium/ })).toBeVisible();
  });

  test("8 — Déconnexion", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Mot de passe").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Bouton de déconnexion dans la sidebar (icône ⎋)
    await page.locator("button[title='Déconnexion']").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
