#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-gcp.sh — Déploiement Fintrack sur Google Cloud Run
#
# Prérequis :
#   - gcloud CLI installé et authentifié (gcloud auth login)
#   - Docker installé
#   - jq installé
#
# Usage : bash deploy/deploy-gcp.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-europe-west1}"
REPO="fintrack"

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌  Définissez GCP_PROJECT_ID ou configurez gcloud : gcloud config set project <ID>"
  exit 1
fi

AR_HOST="${REGION}-docker.pkg.dev"
AR_REPO="${AR_HOST}/${PROJECT_ID}/${REPO}"

echo "📦 Projet  : $PROJECT_ID"
echo "🌍 Région  : $REGION"
echo "📂 Registry: $AR_REPO"
echo ""

# ── 1. Activer les APIs GCP ────────────────────────────────────────────────────
echo "▶ Activation des APIs GCP…"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID" --quiet

# ── 2. Artifact Registry ───────────────────────────────────────────────────────
echo "▶ Création du dépôt Artifact Registry…"
gcloud artifacts repositories describe "$REPO" \
  --location="$REGION" --project="$PROJECT_ID" &>/dev/null \
  || gcloud artifacts repositories create "$REPO" \
       --repository-format=docker \
       --location="$REGION" \
       --project="$PROJECT_ID" \
       --quiet

gcloud auth configure-docker "${AR_HOST}" --quiet

# ── 3. Cloud SQL (PostgreSQL 16) ───────────────────────────────────────────────
SQL_INSTANCE="fintrack-db"
DB_NAME="fintrack"
DB_USER="fintrack"
DB_PASS="${DB_PASSWORD:-$(openssl rand -base64 24)}"

echo "▶ Création de l'instance Cloud SQL (peut prendre 5 min)…"
gcloud sql instances describe "$SQL_INSTANCE" \
  --project="$PROJECT_ID" &>/dev/null \
  || gcloud sql instances create "$SQL_INSTANCE" \
       --database-version=POSTGRES_16 \
       --tier=db-f1-micro \
       --region="$REGION" \
       --project="$PROJECT_ID" \
       --storage-auto-increase \
       --quiet

gcloud sql databases create "$DB_NAME" \
  --instance="$SQL_INSTANCE" --project="$PROJECT_ID" --quiet &>/dev/null || true

gcloud sql users create "$DB_USER" \
  --instance="$SQL_INSTANCE" \
  --password="$DB_PASS" \
  --project="$PROJECT_ID" --quiet &>/dev/null || true

SQL_CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
echo "   ✅ Cloud SQL : $SQL_CONNECTION"

# ── 4. Secret Manager — variables sensibles ────────────────────────────────────
echo "▶ Stockage des secrets dans Secret Manager…"

store_secret() {
  local name="$1" value="$2"
  echo -n "$value" | gcloud secrets create "$name" \
    --data-file=- --project="$PROJECT_ID" --quiet &>/dev/null \
  || echo -n "$value" | gcloud secrets versions add "$name" \
    --data-file=- --project="$PROJECT_ID" --quiet
}

COOKIE_SECRET="${COOKIE_SECRET:-$(openssl rand -base64 32)}"
TOKEN_ENC_KEY="${TOKEN_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"

store_secret "fintrack-db-password"    "$DB_PASS"
store_secret "fintrack-cookie-secret"  "$COOKIE_SECRET"
store_secret "fintrack-token-enc-key"  "$TOKEN_ENC_KEY"
echo "   ✅ Secrets créés."

# ── 5. Build et push des images Docker ────────────────────────────────────────
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
API_IMAGE="${AR_REPO}/api:${GIT_SHA}"
# Le frontend a besoin de l'URL API définitive — on la construit à l'avance
FRONTEND_IMAGE="${AR_REPO}/frontend:${GIT_SHA}"
API_URL="https://fintrack-api-$(echo $PROJECT_ID | tr '.' '-')-${REGION}.a.run.app"

echo "▶ Build image API…"
docker build -t "$API_IMAGE" ./api
docker push "$API_IMAGE"
echo "   ✅ API : $API_IMAGE"

echo "▶ Build image Frontend (VITE_API_URL=$API_URL/api/v1)…"
docker build \
  --build-arg VITE_API_URL="${API_URL}/api/v1" \
  -t "$FRONTEND_IMAGE" ./frontend
docker push "$FRONTEND_IMAGE"
echo "   ✅ Frontend : $FRONTEND_IMAGE"

# ── 6. Déployer l'API sur Cloud Run ───────────────────────────────────────────
echo "▶ Déploiement API sur Cloud Run…"
gcloud run deploy fintrack-api \
  --image="$API_IMAGE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --add-cloudsql-instances="$SQL_CONNECTION" \
  --set-env-vars="NODE_ENV=production,PORT=3000,FRONTEND_URL=https://fintrack-frontend-$(echo $PROJECT_ID | tr '.' '-')-${REGION}.a.run.app" \
  --set-secrets="COOKIE_SECRET=fintrack-cookie-secret:latest,TOKEN_ENCRYPTION_KEY=fintrack-token-enc-key:latest" \
  --set-env-vars="DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION}" \
  --set-env-vars="REDIS_URL=${REDIS_URL:-redis://localhost:6379}" \
  --quiet

DEPLOYED_API_URL=$(gcloud run services describe fintrack-api \
  --region="$REGION" --project="$PROJECT_ID" \
  --format='value(status.url)')
echo "   ✅ API déployée : $DEPLOYED_API_URL"

# ── 7. Déployer le Frontend sur Cloud Run ─────────────────────────────────────
echo "▶ Déploiement Frontend sur Cloud Run…"
gcloud run deploy fintrack-frontend \
  --image="$FRONTEND_IMAGE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --platform=managed \
  --allow-unauthenticated \
  --port=80 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --quiet

FRONTEND_URL=$(gcloud run services describe fintrack-frontend \
  --region="$REGION" --project="$PROJECT_ID" \
  --format='value(status.url)')
echo "   ✅ Frontend déployé : $FRONTEND_URL"

# ── 8. Migrations de base de données ─────────────────────────────────────────
echo "▶ Exécution des migrations DB via Cloud Run Job…"
gcloud run jobs create fintrack-migrate \
  --image="$API_IMAGE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --add-cloudsql-instances="$SQL_CONNECTION" \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION}" \
  --command="node" \
  --args="node_modules/.bin/drizzle-kit,migrate" \
  --quiet &>/dev/null || true

gcloud run jobs execute fintrack-migrate \
  --region="$REGION" --project="$PROJECT_ID" --wait --quiet
echo "   ✅ Migrations appliquées."

# ── Résumé ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅  Fintrack déployé avec succès !"
echo ""
echo "  🌐  Application : $FRONTEND_URL"
echo "  🔌  API         : $DEPLOYED_API_URL"
echo ""
echo "  Pour charger les données de démo Karim :"
echo "  gcloud run jobs create fintrack-seed \\"
echo "    --image=${API_IMAGE} --region=${REGION} \\"
echo "    --add-cloudsql-instances=${SQL_CONNECTION} \\"
echo "    --set-env-vars=\"NODE_ENV=production,DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}?host=/cloudsql/${SQL_CONNECTION}\" \\"
echo "    --command=node --args=\"node_modules/.bin/tsx,src/db/seed.ts\""
echo "  gcloud run jobs execute fintrack-seed --region=${REGION} --wait"
echo "═══════════════════════════════════════════════════════════"
