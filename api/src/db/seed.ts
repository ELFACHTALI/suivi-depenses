import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, isNull } from "drizzle-orm";
import { db } from "./index.ts";
import {
  users,
  accounts,
  categories,
  transactions,
  budgets,
  goals,
  debts,
  insights,
} from "./schema/index.ts";
import { seedDefaultCategories } from "../modules/categories/seed.ts";

const DEMO_EMAIL = "karim.alaoui@demo.fintrack.ma";
const DEMO_PASSWORD = "Fintrack123!";

// Helpers
const mad = (amount: number) => Math.round(amount * 100); // MAD → centimes
const d = (iso: string) => iso; // date passthrough

async function main() {
  console.log("[Seed] Démarrage du seed Karim Alaoui…");

  // 1. Catégories système
  await seedDefaultCategories();

  // 2. Idempotence : si Karim existe déjà, on sort
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEMO_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log("[Seed] Karim existe déjà, rien à faire.");
    process.exit(0);
  }

  // 3. Créer l'utilisateur démo
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [karim] = await db
    .insert(users)
    .values({
      email: DEMO_EMAIL,
      passwordHash,
      name: "Karim Alaoui",
      planType: "premium",
    })
    .returning({ id: users.id });

  const userId = karim.id;
  console.log(`[Seed] Utilisateur créé : ${DEMO_EMAIL}`);

  // 4. Récupérer les catégories système
  const cats = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.userId));

  const cat = Object.fromEntries(cats.map((c) => [c.name, c.id])) as Record<
    string,
    string
  >;

  // 5. Comptes
  const [chequePk, savingsPk, cashPk] = await db
    .insert(accounts)
    .values([
      {
        userId,
        name: "CIH Chèque",
        type: "card",
        initialBalance: 0,
        currency: "MAD",
        color: "#6366f1",
        icon: "credit-card",
      },
      {
        userId,
        name: "CIH Épargne",
        type: "savings",
        initialBalance: 0,
        currency: "MAD",
        color: "#0891b2",
        icon: "piggy-bank",
      },
      {
        userId,
        name: "Espèces",
        type: "cash",
        initialBalance: mad(500),
        currency: "MAD",
        color: "#16a34a",
        icon: "banknotes",
      },
    ])
    .returning({ id: accounts.id });

  const cheque = chequePk.id;
  const savings = savingsPk.id;
  const cash = cashPk.id;
  console.log("[Seed] Comptes créés.");

  // 6. Transactions — 6 mois (novembre 2025 → avril 2026)
  // Chaque mois : revenus freelance + dépenses courantes

  const txData = [
    // ── Novembre 2025 ──────────────────────────────────────────────────────────
    // Revenus
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission Acme Corp — design system", amount: mad(18_000), type: "income" as const, date: d("2025-11-03"), fiscalMarker: true },
    // Dépenses
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer novembre", amount: mad(5_500), type: "expense" as const, date: d("2025-11-01") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Carrefour Market", amount: mad(650), type: "expense" as const, date: d("2025-11-05") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marché central", amount: mad(280), type: "expense" as const, date: d("2025-11-12") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "La Sqala — déjeuner client", amount: mad(420), type: "expense" as const, date: d("2025-11-08") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Essence Afriquia", amount: mad(350), type: "expense" as const, date: d("2025-11-09") },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify", amount: mad(220), type: "expense" as const, date: d("2025-11-10") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe Creative Cloud", amount: mad(580), type: "expense" as const, date: d("2025-11-10") },
    { accountId: cheque, categoryId: cat["Santé"], title: "Pharmacie Centrale", amount: mad(185), type: "expense" as const, date: d("2025-11-14") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Cinéma Megarama", amount: mad(80), type: "expense" as const, date: d("2025-11-22") },
    { accountId: cheque, categoryId: cat["Épargne"], title: "Virement épargne novembre", amount: mad(2_000), type: "expense" as const, date: d("2025-11-28") },
    { accountId: savings, categoryId: cat["Autres revenus"], title: "Virement depuis CIH Chèque", amount: mad(2_000), type: "income" as const, date: d("2025-11-28") },

    // ── Décembre 2025 ──────────────────────────────────────────────────────────
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission Wafacash — interface mobile", amount: mad(14_000), type: "income" as const, date: d("2025-12-02"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Freelance"], title: "Rétrocession projet CFC", amount: mad(8_500), type: "income" as const, date: d("2025-12-15"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer décembre", amount: mad(5_500), type: "expense" as const, date: d("2025-12-01") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marjane Hay Ryad", amount: mad(720), type: "expense" as const, date: d("2025-12-06") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "Noël en famille — L'Entrecôte", amount: mad(960), type: "expense" as const, date: d("2025-12-25") },
    { accountId: cheque, categoryId: cat["Cadeaux"], title: "Cadeaux de Noël famille", amount: mad(1_400), type: "expense" as const, date: d("2025-12-20") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Train Casablanca–Marrakech A/R", amount: mad(280), type: "expense" as const, date: d("2025-12-23") },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify + iCloud", amount: mad(265), type: "expense" as const, date: d("2025-12-10") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe CC + GitHub Copilot", amount: mad(680), type: "expense" as const, date: d("2025-12-10") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Soirée Réveillon", amount: mad(450), type: "expense" as const, date: d("2025-12-31") },
    { accountId: cheque, categoryId: cat["Épargne"], title: "Virement épargne décembre", amount: mad(3_500), type: "expense" as const, date: d("2025-12-28") },
    { accountId: savings, categoryId: cat["Autres revenus"], title: "Virement depuis CIH Chèque", amount: mad(3_500), type: "income" as const, date: d("2025-12-28") },

    // ── Janvier 2026 ───────────────────────────────────────────────────────────
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission Inwi — UX audit", amount: mad(15_000), type: "income" as const, date: d("2026-01-07"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer janvier", amount: mad(5_500), type: "expense" as const, date: d("2026-01-01") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Carrefour", amount: mad(590), type: "expense" as const, date: d("2026-01-08") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marché bio Agdal", amount: mad(230), type: "expense" as const, date: d("2026-01-15") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Essence Ziz", amount: mad(340), type: "expense" as const, date: d("2026-01-11") },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify + iCloud", amount: mad(265), type: "expense" as const, date: d("2026-01-10") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe CC + Notion Pro", amount: mad(620), type: "expense" as const, date: d("2026-01-10") },
    { accountId: cheque, categoryId: cat["Santé"], title: "Consultation médecin généraliste", amount: mad(250), type: "expense" as const, date: d("2026-01-20") },
    { accountId: cheque, categoryId: cat["Éducation"], title: "Udemy — cours React Native", amount: mad(180), type: "expense" as const, date: d("2026-01-18") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "Déjeuner de travail", amount: mad(280), type: "expense" as const, date: d("2026-01-22") },
    { accountId: cheque, categoryId: cat["Épargne"], title: "Virement épargne janvier", amount: mad(1_500), type: "expense" as const, date: d("2026-01-30") },
    { accountId: savings, categoryId: cat["Autres revenus"], title: "Virement depuis CIH Chèque", amount: mad(1_500), type: "income" as const, date: d("2026-01-30") },

    // ── Février 2026 ───────────────────────────────────────────────────────────
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission OCP Group — dashboard analytics", amount: mad(20_000), type: "income" as const, date: d("2026-02-04"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer février", amount: mad(5_500), type: "expense" as const, date: d("2026-02-01") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marjane", amount: mad(680), type: "expense" as const, date: d("2026-02-07") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marché Derb Omar", amount: mad(195), type: "expense" as const, date: d("2026-02-14") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "La Maison Arabe — dîner", amount: mad(620), type: "expense" as const, date: d("2026-02-14") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Essence + parking", amount: mad(420), type: "expense" as const, date: d("2026-02-12") },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify + iCloud", amount: mad(265), type: "expense" as const, date: d("2026-02-10") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe CC + Figma Pro", amount: mad(780), type: "expense" as const, date: d("2026-02-10") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Festival Mawazine — billets", amount: mad(350), type: "expense" as const, date: d("2026-02-20") },
    { accountId: cheque, categoryId: cat["Vêtements"], title: "Zara Casa — chemises", amount: mad(480), type: "expense" as const, date: d("2026-02-22") },
    { accountId: cheque, categoryId: cat["Épargne"], title: "Virement épargne février", amount: mad(2_500), type: "expense" as const, date: d("2026-02-26") },
    { accountId: savings, categoryId: cat["Autres revenus"], title: "Virement depuis CIH Chèque", amount: mad(2_500), type: "income" as const, date: d("2026-02-26") },

    // ── Mars 2026 ──────────────────────────────────────────────────────────────
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission Attijari — design system (phase 2)", amount: mad(19_500), type: "income" as const, date: d("2026-03-03"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer mars", amount: mad(5_500), type: "expense" as const, date: d("2026-03-01") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Carrefour Hay Riad", amount: mad(610), type: "expense" as const, date: d("2026-03-05") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Épicerie locale", amount: mad(165), type: "expense" as const, date: d("2026-03-18") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "Le Cabestan — déjeuner client", amount: mad(850), type: "expense" as const, date: d("2026-03-11") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Essence Afriquia", amount: mad(370), type: "expense" as const, date: d("2026-03-08") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Péage A1 A/R Casablanca", amount: mad(80), type: "expense" as const, date: d("2026-03-15") },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify + iCloud", amount: mad(265), type: "expense" as const, date: d("2026-03-10") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe CC + GitHub + Notion", amount: mad(720), type: "expense" as const, date: d("2026-03-10") },
    { accountId: cheque, categoryId: cat["Santé"], title: "Opticien — nouvelles lunettes", amount: mad(950), type: "expense" as const, date: d("2026-03-20") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Weekend à Essaouira", amount: mad(1_200), type: "expense" as const, date: d("2026-03-28") },
    { accountId: cheque, categoryId: cat["Épargne"], title: "Virement épargne mars", amount: mad(2_000), type: "expense" as const, date: d("2026-03-28") },
    { accountId: savings, categoryId: cat["Autres revenus"], title: "Virement depuis CIH Chèque", amount: mad(2_000), type: "income" as const, date: d("2026-03-28") },

    // ── Avril 2026 (mois en cours) ─────────────────────────────────────────────
    { accountId: cheque, categoryId: cat["Maison"], title: "Loyer avril", amount: mad(5_500), type: "expense" as const, date: d("2026-04-01") },
    { accountId: cheque, categoryId: cat["Freelance"], title: "Mission Bank Al-Maghrib — rapport UX", amount: mad(18_000), type: "income" as const, date: d("2026-04-02"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Abonnements"], title: "Netflix + Spotify + iCloud", amount: mad(265), type: "expense" as const, date: d("2026-04-03") },
    { accountId: cheque, categoryId: cat["Logiciels & Pro"], title: "Adobe CC + GitHub Copilot + Notion", amount: mad(750), type: "expense" as const, date: d("2026-04-03") },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Carrefour Market", amount: mad(580), type: "expense" as const, date: d("2026-04-05") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Essence Ziz", amount: mad(360), type: "expense" as const, date: d("2026-04-06") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "La Mamounia Café", amount: mad(480), type: "expense" as const, date: d("2026-04-08") },
    { accountId: cheque, categoryId: cat["Santé"], title: "Pharmacie — vitamines", amount: mad(145), type: "expense" as const, date: d("2026-04-09") },
    { accountId: cheque, categoryId: cat["Éducation"], title: "Masterclass — Product Design", amount: mad(280), type: "expense" as const, date: d("2026-04-10") },
    { accountId: cheque, categoryId: cat["Freelance"], title: "Rétrocession Pixel Agency", amount: mad(6_500), type: "income" as const, date: d("2026-04-15"), fiscalMarker: true },
    { accountId: cheque, categoryId: cat["Alimentation"], title: "Marché Agdal", amount: mad(210), type: "expense" as const, date: d("2026-04-16") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Match RS Berkane — billetterie", amount: mad(120), type: "expense" as const, date: d("2026-04-17") },
    { accountId: cheque, categoryId: cat["Transport"], title: "Parking Casa — réunion client", amount: mad(55), type: "expense" as const, date: d("2026-04-18") },
    { accountId: cheque, categoryId: cat["Restaurants"], title: "Déjeuner networking UX Casablanca", amount: mad(350), type: "expense" as const, date: d("2026-04-19") },
    { accountId: cheque, categoryId: cat["Loisirs & Sorties"], title: "Location vélo Rabat — weekend", amount: mad(80), type: "expense" as const, date: d("2026-04-20") },
    { accountId: cash, categoryId: cat["Restaurants"], title: "Msemen du coin", amount: mad(25), type: "expense" as const, date: d("2026-04-21") },
    { accountId: cash, categoryId: cat["Alimentation"], title: "Fruits & légumes marché", amount: mad(60), type: "expense" as const, date: d("2026-04-22") },
    { accountId: cheque, categoryId: cat["Voyages"], title: "Acompte Voyage Japon — vol A/R", amount: mad(1_200), type: "expense" as const, date: d("2026-04-23") },
  ];

  await db.insert(transactions).values(
    txData.map((t) => ({
      userId,
      accountId: t.accountId,
      categoryId: t.categoryId,
      title: t.title,
      amount: t.amount,
      type: t.type,
      date: t.date,
      currency: "MAD",
      fxRate: "1",
      fiscalMarker: (t as { fiscalMarker?: boolean }).fiscalMarker ?? false,
    }))
  );

  console.log(`[Seed] ${txData.length} transactions insérées.`);

  // 7. Budgets mensuels (liés à avril 2026)
  await db.insert(budgets).values([
    {
      userId,
      categoryId: cat["Restaurants"],
      period: "monthly",
      amount: mad(1_500),
      startDate: d("2026-04-01"),
    },
    {
      userId,
      categoryId: cat["Transport"],
      period: "monthly",
      amount: mad(1_000),
      startDate: d("2026-04-01"),
    },
    {
      userId,
      categoryId: cat["Abonnements"],
      period: "monthly",
      amount: mad(500),
      startDate: d("2026-04-01"),
    },
    {
      userId,
      categoryId: cat["Loisirs & Sorties"],
      period: "monthly",
      amount: mad(800),
      startDate: d("2026-04-01"),
    },
  ]);

  console.log("[Seed] 4 budgets créés.");

  // 8. Objectifs
  await db.insert(goals).values([
    {
      userId,
      name: "Voyage Japon",
      description: "Road trip Tokyo–Kyoto–Osaka pour Noël 2026",
      targetAmount: mad(35_000),
      currentAmount: mad(12_500),
      targetDate: d("2026-12-15"),
      emoji: "🗾",
    },
    {
      userId,
      name: "Apport appartement",
      description: "20% d'apport pour un appartement à Hay Riad",
      targetAmount: mad(150_000),
      currentAmount: mad(45_000),
      targetDate: d("2027-09-01"),
      emoji: "🏠",
    },
    {
      userId,
      name: "MacBook Pro M4",
      description: "Renouvellement du matériel professionnel",
      targetAmount: mad(28_000),
      currentAmount: mad(18_000),
      targetDate: d("2026-07-01"),
      emoji: "💻",
    },
  ]);

  console.log("[Seed] 3 objectifs créés.");

  // 9. Dette (crédit auto)
  await db.insert(debts).values([
    {
      userId,
      creditor: "CIH Bank — Crédit Auto",
      totalAmount: mad(84_000),
      remainingAmount: mad(52_500),
      monthlyPayment: mad(2_500),
      interestRate: "6.50",
      currency: "MAD",
      startDate: d("2024-01-15"),
    },
  ]);

  console.log("[Seed] 1 dette créée.");

  // 10. Score santé (dernier lundi)
  await db.insert(insights).values([
    {
      userId,
      weekStart: d("2026-04-20"),
      score: 72,
      savingsRate: "80.00",
      budgetRespect: "65.00",
      entryRegularity: "75.00",
      debtRatio: "68.00",
      tips: [
        "Vos dépenses restaurants dépassent régulièrement le budget. Essayez la règle des 2 sorties/semaine.",
        "Votre taux d'épargne de 51% est excellent ! Pensez à diversifier via un plan d'épargne.",
        "3 abonnements en double détectés : vérifiez Netflix et la facturation groupée.",
      ],
    },
  ]);

  console.log("[Seed] Score santé inséré.");
  console.log("");
  console.log("✅ Seed terminé !");
  console.log(`   Email    : ${DEMO_EMAIL}`);
  console.log(`   Mot de passe : ${DEMO_PASSWORD}`);
  console.log("   Plan     : Premium");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Seed] Erreur :", err);
  process.exit(1);
});
