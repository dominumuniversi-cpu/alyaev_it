# Этап 0 — Фундамент

Цель: рабочий стенд, правила, манифесты, задачник. Без этого дальше строить нельзя — иначе сайт будет набором несогласованных страниц.

## T0-01 Структура репозитория

**Готово.** Каталоги: `backend/`, `frontend/`, `infra/`, `docs/`. `.gitignore` исключает `node_modules`, `.next`, `.env`, `backups`.

## T0-02 ТЗ в репозитории

**Готово.** `docs/spec/TZ.md` — рабочая редакция.

## T0-03 Правила разработки

**Готово.** `docs/rules/RULES.md`.

## T0-04 UI-манифесты

**Готово (4 базовых).**

| Манифест | Компонент |
|---|---|
| `docs/manifests/ui/tokens.md` | дизайн-токены |
| `docs/manifests/ui/button.md` | Button |
| `docs/manifests/ui/section.md` | Section |
| `docs/manifests/ui/card.md` | Card / ServiceCard |

Дальше появятся: Header, Footer, Input, Textarea, Select, Form, Badge, Accordion (FAQ), Steps, Timeline, CaseCard, Breadcrumbs, Pagination, Alert, Modal, AdminTable, AdminForm, SeoEditor.

## T0-05 Манифест схемы БД

**Готово.** `docs/manifests/db/schema.md`: соглашения, 30+ таблиц по этапам, матрица доступа, state machine.

## T0-06 Docker-стенд + nginx

**В работе.**

- [x] Каталог данных `E:\DockerData\alyaev-it` (+ `.env`, `pgdata`, `backups`, `logs`)
- [x] `alyaev-db` — postgres 17.12 (pgvector), healthy
- [x] `alyaev-api` — FastAPI, `/api/health` = ok, healthy
- [x] `alyaev-web` — Next.js 15.5.29 (пропатченный), порт 3000
- [x] nginx: `stands/alyaev.conf`, `nginx -t` прошёл, reload выполнен
- [ ] Проверка `https://192.168.8.49/alyaev/` = 200
- [ ] Домен alyaev.it (ждёт DNS от заказчика)

### Ловушки, проверенные на практике

1. `docker compose` как подкоманда не работает → использовать `C:\Program Files\Docker\Docker\resources\cli-plugins\docker-compose.exe` + `--env-file`.
2. `env_file:` в compose отвергается версией плагина (`additional properties 'env_file' not allowed`) — только флаг `--env-file`.
3. Next.js из `package.json` без `public/` падает на `COPY --from=builder /app/public` — держать `frontend/public/.gitkeep`.
4. 15.1.6 имеет CVE-2025-66478 → 15.5.29.
5. `vhosts/*.conf` включаются в `http{}` (нужен `server{}`), `stands/*.conf` — в `server{}` (только `location`).

## T0-07 Скрипты

— деплой: `infra/scripts/deploy.ps1`  
— бэкап: `infra/scripts/backup.ps1` (pg_dump, глубина 14 дней)  
— восстановление: `infra/scripts/restore.ps1`
