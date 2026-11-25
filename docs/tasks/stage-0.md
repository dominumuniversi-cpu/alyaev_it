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

**Готово (проверено 24.11.2026).**

- [x] Каталог данных `E:\DockerData\alyaev-it` (+ `.env`, `pgdata`, `backups`, `logs`)
- [x] `alyaev-db` — postgres 17.12 (pgvector), healthy
- [x] `alyaev-api` — FastAPI, `/api/health` = ok, healthy
- [x] `alyaev-web` — Next.js 15.5.29 (пропатченный), порт 3000
- [x] nginx: `stands/alyaev.conf`, `nginx -t` прошёл, reload выполнен
- [x] Проверка стенда прошла (адрес стенда выведен из оборота 26.11.2026 — проект живёт только на домене)
- [x] `https://188.226.71.169/alyaev` = 200 (исторический адрес стенда; с 25.11.2026 домен `https://alyaev.ru`)
- [ ] Домен alyaev.it — **не подключаем по просьбе заказчика** (сайт публикуется по IP)

### Ловушки, проверенные на практике

1. `docker compose` как подкоманда не работает → использовать `C:\Program Files\Docker\Docker\resources\cli-plugins\docker-compose.exe` + `--env-file`.
2. `env_file:` в compose отвергается версией плагина (`additional properties 'env_file' not allowed`) — только флаг `--env-file`.
3. Next.js из `package.json` без `public/` падает на `COPY --from=builder /app/public` — держать `frontend/public/.gitkeep`.
4. 15.1.6 имеет CVE-2025-66478 → 15.5.29.
5. `vhosts/*.conf` включаются в `http{}` (нужен `server{}`), `stands/*.conf` — в `server{}` (только `location`).

## T0-07 Скрипты

| Скрипт | Что делает | Проверено |
|---|---|---|
| `infra/scripts/deploy.ps1` | сборка + перезапуск + ожидание ответа 200 | ✅ прогон `-NoBuild` |
| `infra/scripts/backup.ps1` | `pg_dump`, глубина 14 дней | ✅ задача `AlyaevIT-Backup`, ежедневно 03:30 |
| `infra/scripts/verify-backup.ps1` | проверка целостности дампа | ✅ |
| `infra/scripts/restore.ps1` | восстановление из дампа | ⚠️ не прогонялся на боевой базе |

```powershell
# полная выкатка
.\infra\scripts\deploy.ps1
# только backend (правился Python)
.\infra\scripts\deploy.ps1 -Service backend
# перезапуск без пересборки (менялся только .env)
.\infra\scripts\deploy.ps1 -NoBuild
```

### Ловушки (проверено на практике)

6. **PS-скрипты сохранять в UTF-8 с BOM.** Без BOM PowerShell 5.1 читает кириллицу как ANSI
   и падает на «Unexpected token» — при этом сам файл выглядит нормально.
7. **Не вызывать docker через `cmd /c` с экранированием кавычек.** В PS 5.1 `\"` ломается на путях
   с пробелами (`C:\Program Files\...`), и команда «не найдена». Вызывать через `&`,
   временно ослабляя `$ErrorActionPreference` — docker пишет прогресс в stderr.
8. `docker network inspect --format "{{range .Containers}}" ` через `cmd /c` не печатает ничего —
   использовать batch-файл или `docker inspect` по контейнеру.
