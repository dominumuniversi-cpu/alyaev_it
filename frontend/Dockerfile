# Next.js standalone build (multi-stage).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* вшиваются в бандл на этапе сборки, а не читаются в рантайме.
# Поэтому они передаются сюда аргументами, иначе счётчик молчит при заданном ID.
ARG NEXT_PUBLIC_YM_ID=""
ARG NEXT_PUBLIC_GA_ID=""
ARG BASE_PATH=/alyaev
# SITE_URL тоже нужен на сборке: robots.txt и sitemap.xml — статические маршруты,
# Next генерирует их один раз при build. Без аргумента в образ вшивается
# http://localhost, и поисковик видит мёртвый Host и Sitemap.
ARG SITE_URL=https://188.226.71.169
ENV NEXT_PUBLIC_YM_ID=${NEXT_PUBLIC_YM_ID}
ENV NEXT_PUBLIC_GA_ID=${NEXT_PUBLIC_GA_ID}
ENV BASE_PATH=${BASE_PATH}
ENV SITE_URL=${SITE_URL}
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
