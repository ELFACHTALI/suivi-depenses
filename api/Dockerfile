FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Toutes les dépendances nécessaires pour compiler TypeScript
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
# Migrations Drizzle embarquées dans l'image de prod
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
