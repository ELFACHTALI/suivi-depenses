#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-local.sh — Remet l'environnement à zéro et lance les tests E2E
#
# Usage : bash test-local.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          Fintrack — Test local end-to-end                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Créer .env si absent ────────────────────────────────────────────────
if [[ ! -f "$ROOT/.env" ]]; then
  echo "▶ Création du fichier .env depuis .env.example…"
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

# ── 2. Arrêt et nettoyage complet ─────────────────────────────────────────
echo "▶ Arrêt des conteneurs existants et nettoyage des volumes…"
docker compose down -v --remove-orphans 2>/dev/null || true

# ── 3. Démarrage des services ──────────────────────────────────────────────
echo "▶ Démarrage de Docker Compose…"
docker compose up -d --build

# ── 4. Attendre que l'API soit healthy ────────────────────────────────────
echo "▶ Attente que l'API soit prête…"
MAX_WAIT=120
WAITED=0
until curl -sf http://localhost:3000/api/v1/health | grep -q '"db":"ok"'; do
  if [[ $WAITED -ge $MAX_WAIT ]]; then
    echo "❌  Timeout : l'API n'a pas démarré en ${MAX_WAIT}s"
    echo "   Logs API :"
    docker compose logs api --tail=30
    exit 1
  fi
  printf "."
  sleep 3
  WAITED=$((WAITED + 3))
done
echo " ✅ API prête !"

# ── 5. Seed des données de démo ───────────────────────────────────────────
echo "▶ Chargement des données de démo (Karim Alaoui)…"
docker compose exec -T api npm run db:seed 2>&1 \
  | grep -E "(\[Seed\]|✅|Erreur)" || true

# ── 6. Vérifier le frontend ───────────────────────────────────────────────
echo "▶ Vérification du frontend…"
until curl -sf http://localhost:5173 | grep -q "Fintrack"; do
  printf "."
  sleep 2
done
echo " ✅ Frontend prêt !"

# ── 7. Installer Playwright si nécessaire ─────────────────────────────────
echo "▶ Vérification de Playwright…"
cd "$ROOT/e2e"
if [[ ! -d "node_modules" ]]; then
  echo "   Installation des dépendances e2e…"
  npm install
fi
if [[ ! -d "$HOME/.cache/ms-playwright" ]]; then
  echo "   Installation du navigateur Chromium…"
  npx playwright install --with-deps chromium
fi

# ── 8. Lancer les tests E2E ───────────────────────────────────────────────
echo ""
echo "▶ Lancement des tests Playwright (golden path)…"
echo ""
E2E_BASE_URL=http://localhost:5173 npx playwright test --reporter=list

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Tous les tests sont passés !                        ║"
echo "║                                                          ║"
echo "║  Application disponible sur :                            ║"
echo "║  → http://localhost:5173                                 ║"
echo "║                                                          ║"
echo "║  Compte démo :                                           ║"
echo "║  → karim.alaoui@demo.fintrack.ma / Fintrack123!          ║"
echo "╚══════════════════════════════════════════════════════════╝"
