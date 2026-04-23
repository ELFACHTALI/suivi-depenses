# Fintrack — Suivi de dépenses personnelles

PWA de gestion des finances personnelles en freemium, ciblant le marché marocain (MAD). Trois personas : Marie (salariée), Karim (freelance) et Sophie+Marc (famille).

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite 5 + TanStack Query + Zustand + Tailwind CSS |
| Backend | Node.js 22 + Express 5 + Drizzle ORM |
| Base de données | PostgreSQL 16 |
| Cache / Files | Redis 7 + BullMQ |
| Auth | JWT RS256 (access 15 min / refresh 7 j en HttpOnly cookie) |
| PWA | vite-plugin-pwa + Workbox |
| Tests | Vitest (unit) + Playwright (E2E) |

## Prérequis

- [Docker](https://www.docker.com/) ≥ 24 et Docker Compose v2
- [Node.js](https://nodejs.org/) ≥ 22 (pour les scripts hors Docker)
- [Git](https://git-scm.com/)

## Démarrage rapide

### 1. Cloner et configurer l'environnement

```bash
git clone https://github.com/elfachtali/suivi-depenses.git
cd suivi-depenses

cp .env.example .env
# Éditez .env si nécessaire (les valeurs par défaut fonctionnent en local)
```

### 2. Lancer les conteneurs

```bash
docker compose up -d
```

Cela démarre 4 services :

| Service | Port local | Rôle |
|---------|-----------|------|
| `db` | 5432 | PostgreSQL 16 |
| `redis` | 6379 | Redis 7 |
| `api` | 3000 | API Express |
| `frontend` | 5173 | Vite dev server |

Vérifier que tous les services sont sains :

```bash
docker compose ps
# Tous les services doivent afficher "healthy"

curl http://localhost:3000/api/v1/health
# {"status":"ok","db":"ok","redis":"ok","timestamp":"...","version":"1.0.0"}
```

### 3. Appliquer les migrations de base de données

```bash
cd api
npm install
npm run db:migrate
```

### 4. Charger les données de démonstration

```bash
npm run db:seed
```

Cela crée le compte de démonstration **Karim Alaoui** avec 6 mois de données réalistes :

| Champ | Valeur |
|-------|--------|
| Email | `karim.alaoui@demo.fintrack.ma` |
| Mot de passe | `Fintrack123!` |
| Plan | Premium |
| Comptes | CIH Chèque, CIH Épargne, Espèces |
| Données | Nov 2025 → Avr 2026 (transactions, budgets, objectifs, dettes) |

### 5. Ouvrir l'application

Ouvrez [http://localhost:5173](http://localhost:5173) et connectez-vous avec les identifiants ci-dessus.

---

## Variables d'environnement

Toutes les variables sont documentées dans `.env.example`. Les principales :

| Variable | Description | Valeur par défaut |
|----------|-------------|------------------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://fintrack:fintrack@localhost:5432/fintrack` |
| `REDIS_URL` | URL Redis | `redis://localhost:6379` |
| `COOKIE_SECRET` | Secret HMAC pour les cookies (≥ 32 chars) | *(à définir)* |
| `TOKEN_ENCRYPTION_KEY` | Clé AES-256 hex (64 chars) pour chiffrer les tokens Open Banking | *(à définir)* |
| `JWT_PRIVATE_KEY` | Clé privée RSA-2048 base64 (optionnel — HS256 utilisé en dev) | *(vide = dev mode)* |
| `JWT_PUBLIC_KEY` | Clé publique RSA correspondante base64 | *(vide = dev mode)* |
| `PORT` | Port de l'API | `3000` |
| `NODE_ENV` | Environnement (`development` / `production`) | `development` |

> **Note RS256 en production :** générez une paire de clés RSA et encodez-les en base64 :
> ```bash
> openssl genrsa -out private.pem 2048
> openssl rsa -in private.pem -pubout -out public.pem
> base64 -w0 private.pem  # → JWT_PRIVATE_KEY
> base64 -w0 public.pem   # → JWT_PUBLIC_KEY
> ```

---

## Structure du projet

```
suivi-depenses/
├── api/                       # Backend Express
│   ├── src/
│   │   ├── auth/              # JWT, middleware, routes auth
│   │   ├── db/
│   │   │   ├── schema/        # Schémas Drizzle ORM
│   │   │   ├── index.ts       # Pool PostgreSQL
│   │   │   └── seed.ts        # Données de démo (Karim)
│   │   ├── jobs/              # Workers BullMQ (récurrences, health score)
│   │   ├── middleware/        # Rate limiter, error handler, Zod validator
│   │   └── modules/           # Domaines métier
│   │       ├── accounts/
│   │       ├── budgets/
│   │       ├── categories/
│   │       ├── dashboard/
│   │       ├── debts/
│   │       ├── goals/
│   │       ├── insights/
│   │       ├── recurring/
│   │       └── transactions/
│   ├── drizzle.config.ts
│   └── package.json
├── frontend/                  # React 18 PWA
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── hooks/             # Hooks React personnalisés
│   │   ├── layouts/           # AppLayout (sidebar) + AuthLayout
│   │   ├── lib/               # API client, offline queue, utils
│   │   ├── pages/             # Pages de l'application
│   │   ├── service-worker/    # Workbox PWA
│   │   └── store/             # Zustand (auth, ui)
│   └── package.json
├── e2e/                       # Tests Playwright
│   └── tests/golden-path.spec.ts
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Commandes utiles

### API

```bash
cd api

npm run dev          # Serveur de développement avec hot-reload (tsx watch)
npm run build        # Compilation TypeScript
npm run test         # Tests unitaires Vitest
npm run typecheck    # Vérification TypeScript sans émission

npm run db:generate  # Génère les migrations à partir des schémas Drizzle
npm run db:migrate   # Applique les migrations en attente
npm run db:studio    # Drizzle Studio sur http://localhost:4983
npm run db:seed      # Charge les données de démo
```

### Frontend

```bash
cd frontend

npm run dev          # Vite dev server sur http://localhost:5173
npm run build        # Build de production (tsc + vite build)
npm run preview      # Prévisualisation du build de production
npm run test         # Tests unitaires Vitest + Testing Library
npm run typecheck    # Vérification TypeScript
npm run lint         # ESLint
```

### E2E

```bash
cd e2e

# Prérequis : API + frontend en cours d'exécution
npm run install:browsers   # Installe Chromium (à faire une fois)
npm run test               # Lance le golden path complet
npm run test:ui            # Interface graphique Playwright
```

---

## Drizzle Studio

Pour explorer la base de données visuellement :

```bash
cd api && npm run db:studio
```

Ouvre [http://localhost:4983](http://localhost:4983) avec un explorateur interactif de toutes les tables.

---

## Architecture PWA & Offline

L'application fonctionne hors ligne grâce à :

- **Service Worker Workbox** : stratégie `stale-while-revalidate` sur les appels API (TTL 5 min), `cache-first` sur les assets
- **IndexedDB** (`offlineQueue`) : les transactions saisies hors ligne sont stockées localement
- **Background Sync** : à la reconnexion, les transactions en attente sont synchronisées dans l'ordre chronologique (RG-23)

---

## Règles métier clés

| Code | Règle |
|------|-------|
| RG-01 | Toute transaction nécessite titre + montant > 0 + date ≤ aujourd'hui + catégorie + compte |
| RG-02 | Un virement crée 2 transactions liées (`transfer_id`), neutres pour les budgets |
| RG-05 | Le taux de change est figé à la date de saisie |
| RG-08 | Alertes budget à 80%, 100% et prédictive (si dépassement prévu avant fin de mois) |
| RG-13 | Score de santé financière recalculé chaque lundi sur les 30 derniers jours |
| RG-18 | Déduplication : même compte + montant (±0,01) + date (±1 jour) |
| RG-23 | Les transactions offline sont synchronisées dans l'ordre chronologique |

---

## Licence

Projet privé — tous droits réservés.
