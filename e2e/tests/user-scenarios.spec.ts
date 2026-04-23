/**
 * Tests E2E — Scénarios utilisateur réels
 *
 * Ces tests simulent un vrai parcours utilisateur de bout en bout :
 *   1. Ajouter une dépense via le formulaire et la voir dans la liste
 *   2. Créer une catégorie personnalisée, l'utiliser pour une transaction
 *   3. Vérifier les totaux du tableau de bord après ajout de transactions
 *
 * Chaque test est autonome : il utilise soit Karim (données riches),
 * soit un utilisateur frais créé pour l'occasion (données contrôlées).
 */

import { test, expect } from "@playwright/test";
import {
  loginUI,
  registerViaApi,
  createAccount,
  getCategoryMap,
  openTransactionForm,
  API_BASE,
} from "../helpers/auth.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 1 — L'utilisateur ajoute une dépense et la voit dans la liste
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scénario 1 — Ajouter une dépense", () => {
  test("saisit une dépense via le formulaire et la retrouve dans la liste", async ({
    page,
  }) => {
    // 1. Connexion avec le compte de démo Karim (données seed)
    await loginUI(page, "karim.alaoui@demo.fintrack.ma", "Fintrack123!");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // 2. Naviguer vers la page Transactions
    await page.getByRole("link", { name: "Transactions" }).click();
    await expect(page).toHaveURL(/\/transactions/);
    await expect(page.getByText("Transactions")).toBeVisible();

    // 3. Ouvrir le formulaire "+ Nouvelle transaction"
    await openTransactionForm(page);
    const dialog = page.getByRole("dialog");

    // 4. Vérifier l'onglet actif par défaut : "Dépense"
    const depenseBtn = dialog.getByRole("button", { name: "Dépense" });
    await expect(depenseBtn).toHaveClass(/bg-white/);

    // 5. Remplir le formulaire
    const txTitle = `Pizza du vendredi ${Date.now()}`;
    await dialog.getByLabel("Libellé").fill(txTitle);
    await dialog.getByLabel(/Montant/).fill("120");

    // Sélectionner le premier compte disponible (CIH Chèque de Karim)
    const compteSelect = dialog.getByLabel("Compte");
    const firstAccount = compteSelect.locator("option").nth(1);
    await compteSelect.selectOption({ value: await firstAccount.getAttribute("value") ?? "" });

    // Sélectionner la catégorie "Restaurants"
    await dialog.getByLabel("Catégorie").selectOption({ label: /🍽.*Restaurants/ });

    // Ajouter une note optionnelle
    await dialog.locator("textarea").fill("Dîner en équipe");

    // 6. Soumettre
    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    // 7. La transaction doit apparaître dans la liste
    await expect(page.getByText(txTitle)).toBeVisible({ timeout: 8_000 });

    // 8. Le montant doit être visible (format fr-MA : "120,00 MAD")
    await expect(
      page.locator("div").filter({ hasText: txTitle }).getByText(/120/)
    ).toBeVisible();
  });

  test("peut aussi ajouter un revenu et le voir dans la liste", async ({ page }) => {
    await loginUI(page, "karim.alaoui@demo.fintrack.ma", "Fintrack123!");
    await page.getByRole("link", { name: "Transactions" }).click();
    await openTransactionForm(page);

    const dialog = page.getByRole("dialog");

    // Passer sur l'onglet "Revenu"
    await dialog.getByRole("button", { name: "Revenu" }).click();

    const txTitle = `Virement client ${Date.now()}`;
    await dialog.getByLabel("Libellé").fill(txTitle);
    await dialog.getByLabel(/Montant/).fill("5000");

    const firstAccount = dialog.getByLabel("Compte").locator("option").nth(1);
    await dialog
      .getByLabel("Compte")
      .selectOption({ value: await firstAccount.getAttribute("value") ?? "" });

    // Catégorie de type income
    await dialog.getByLabel("Catégorie").selectOption({ label: /Freelance/ });

    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    await expect(page.getByText(txTitle)).toBeVisible({ timeout: 8_000 });
    // Un revenu s'affiche avec le préfixe "+"
    await expect(
      page.locator("div").filter({ hasText: txTitle }).getByText(/\+5\s*000|\+5000/)
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 2 — Créer une catégorie personnalisée, l'utiliser pour une dépense
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scénario 2 — Catégorie personnalisée", () => {
  test("crée une catégorie via API et l'utilise dans une nouvelle transaction", async ({
    page,
    request,
  }) => {
    // 1. Connexion UI + récupération du token pour les appels API
    const token = await loginUI(page, "karim.alaoui@demo.fintrack.ma", "Fintrack123!");

    // 2. Créer une catégorie personnalisée via l'API
    const catName = `Sport E2E ${Date.now()}`;
    const catRes = await request.post(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: catName, type: "expense", icon: "⚽", color: "#f97316" },
    });
    expect(catRes.ok()).toBeTruthy();
    const newCategory = (await catRes.json()) as { id: string; name: string };
    expect(newCategory.name).toBe(catName);

    // 3. Naviguer vers Transactions
    //    (les catégories seront rechargées à l'ouverture du formulaire)
    await page.getByRole("link", { name: "Transactions" }).click();
    await openTransactionForm(page);
    const dialog = page.getByRole("dialog");

    // 4. Vérifier que la nouvelle catégorie apparaît dans le select
    const catSelect = dialog.getByLabel("Catégorie");
    await expect(
      catSelect.locator(`option`).filter({ hasText: catName })
    ).toBeAttached({ timeout: 5_000 });

    // 5. Remplir le formulaire avec la nouvelle catégorie
    const txTitle = `Abonnement salle de sport ${Date.now()}`;
    await dialog.getByLabel("Libellé").fill(txTitle);
    await dialog.getByLabel(/Montant/).fill("350");

    const firstAccount = dialog.getByLabel("Compte").locator("option").nth(1);
    await dialog
      .getByLabel("Compte")
      .selectOption({ value: await firstAccount.getAttribute("value") ?? "" });

    // Sélectionner la catégorie nouvellement créée (format : "⚽ catName")
    await catSelect.selectOption({ label: `⚽ ${catName}` });

    // 6. Soumettre
    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 8_000 });

    // 7. La transaction apparaît dans la liste avec l'icône ⚽
    await expect(page.getByText(txTitle)).toBeVisible({ timeout: 8_000 });
    // L'icône de la catégorie est affichée dans la ligne
    const txRow = page.locator("div").filter({ hasText: txTitle }).first();
    await expect(txRow.getByText("⚽")).toBeVisible();
  });

  test("la catégorie personnalisée persiste après rechargement de page", async ({
    page,
    request,
  }) => {
    const token = await loginUI(page, "karim.alaoui@demo.fintrack.ma", "Fintrack123!");

    const catName = `Test Persistance ${Date.now()}`;
    await request.post(`${API_BASE}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: catName, type: "expense", icon: "🧪", color: "#6366f1" },
    });

    // Recharger la page et vérifier que la catégorie est toujours là
    await page.reload();
    await page.getByRole("link", { name: "Transactions" }).click();
    await openTransactionForm(page);

    const catSelect = page.getByRole("dialog").getByLabel("Catégorie");
    await expect(
      catSelect.locator("option").filter({ hasText: catName })
    ).toBeAttached({ timeout: 5_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Scénario 3 — Le tableau de bord affiche les bons totaux
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scénario 3 — Totaux du tableau de bord", () => {
  test("affiche les revenus, dépenses et taux d'épargne exacts", async ({
    page,
    request,
  }) => {
    // 1. Créer un utilisateur frais (données 100% contrôlées)
    const { email, password, accessToken: token } = await registerViaApi(request, {
      name: "Test Totaux Dashboard",
    });

    // 2. Créer un compte bancaire
    const account = await createAccount(request, token);

    // 3. Récupérer les IDs des catégories système
    const cats = await getCategoryMap(request, token);

    const today = new Date().toISOString().slice(0, 10);

    // 4. Injecter des transactions via API avec des montants précis
    //    Revenu : 15 000 MAD = 1 500 000 centimes
    await request.post(`${API_BASE}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "Revenu test dashboard",
        amount: 1_500_000,
        type: "income",
        date: today,
        accountId: account.id,
        categoryId: cats["Freelance"],
      },
    });

    //    Dépense : 4 500 MAD = 450 000 centimes
    await request.post(`${API_BASE}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "Dépense test dashboard",
        amount: 450_000,
        type: "expense",
        date: today,
        accountId: account.id,
        categoryId: cats["Alimentation"],
      },
    });

    // 5. Se connecter via l'interface
    await loginUI(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // 6. Les 4 cartes de statistiques doivent être visibles
    await expect(page.getByText("Solde net")).toBeVisible();
    await expect(page.getByText("Revenus du mois")).toBeVisible();
    await expect(page.getByText("Dépenses du mois")).toBeVisible();
    await expect(page.getByText("Taux d'épargne")).toBeVisible();

    // 7. Vérifier les valeurs numériques dans chaque carte
    //    Revenus : 15 000 MAD (fr-MA affiche "15 000,00 MAD")
    const revenusCard = page
      .locator("div")
      .filter({ hasText: "Revenus du mois" })
      .first();
    await expect(revenusCard).toContainText(/15[\s ]000/, { timeout: 8_000 });

    //    Dépenses : 4 500 MAD
    const depensesCard = page
      .locator("div")
      .filter({ hasText: "Dépenses du mois" })
      .first();
    await expect(depensesCard).toContainText(/4[\s ]500/, { timeout: 8_000 });

    //    Taux d'épargne : (15000 - 4500) / 15000 * 100 = 70%
    const tauxCard = page
      .locator("div")
      .filter({ hasText: "Taux d'épargne" })
      .first();
    await expect(tauxCard).toContainText("70%");

    //    Solde net : 15000 - 4500 = 10 500 MAD
    const soldeCard = page.locator("div").filter({ hasText: "Solde net" }).first();
    await expect(soldeCard).toContainText(/10[\s ]500/);
  });

  test("les transactions récentes apparaissent sur le tableau de bord", async ({
    page,
    request,
  }) => {
    const { email, password, accessToken: token } = await registerViaApi(request, {
      name: "Test Récentes",
    });
    const account = await createAccount(request, token);
    const cats = await getCategoryMap(request, token);
    const today = new Date().toISOString().slice(0, 10);

    // Créer 3 transactions avec des titres identifiables
    const titles = [
      `Transaction A ${Date.now()}`,
      `Transaction B ${Date.now() + 1}`,
      `Transaction C ${Date.now() + 2}`,
    ];

    for (const title of titles) {
      await request.post(`${API_BASE}/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          title,
          amount: 10_000,
          type: "expense",
          date: today,
          accountId: account.id,
          categoryId: cats["Restaurants"],
        },
      });
    }

    await loginUI(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Les transactions récentes doivent apparaître sur le dashboard
    for (const title of titles) {
      await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
    }
  });

  test("le graphique cash flow est affiché avec des données", async ({
    page,
    request,
  }) => {
    const { email, password, accessToken: token } = await registerViaApi(request);
    const account = await createAccount(request, token);
    const cats = await getCategoryMap(request, token);
    const today = new Date().toISOString().slice(0, 10);

    await request.post(`${API_BASE}/transactions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: "Revenu graphique",
        amount: 500_000,
        type: "income",
        date: today,
        accountId: account.id,
        categoryId: cats["Salaire"],
      },
    });

    await loginUI(page, email, password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Le graphique SVG cash flow doit être présent et avoir des tracés
    await expect(page.getByText("Flux de trésorerie")).toBeVisible();
    const svg = page.locator("svg").filter({ hasText: /./ }).first();
    await expect(svg).toBeVisible();
    // Le SVG doit contenir des chemins tracés (path avec coordonnées M/L)
    const paths = svg.locator("path[d*='M']");
    await expect(paths.first()).toBeVisible();
  });
});
