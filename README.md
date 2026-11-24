# alyaev.it — сайт Дмитрия Аляева

Персональная IT-студия: автоматизация бизнеса, AI-разработка, интеграции.

| Что | Где |
|---|---|
| Задачник | TASKS.md → docs/tasks/ |
| ТЗ (клиентское) | docs/spec/TZ.md |
| Правила разработки | docs/rules/RULES.md |
| UI-манифесты | docs/manifests/ui/ |
| Схема БД | docs/manifests/db/ |
| Архитектура | docs/architecture/ARCHITECTURE.md |

## Стек

- **Frontend** — Next.js (App Router) + Tailwind CSS. SSR/ISR для SEO.
- **Backend** — FastAPI (Python 3.12), SQLAlchemy 2 + Alembic.
- **БД** — PostgreSQL 17 (pgvector).
- **Прокси** — общий nginx на хосте, E:\DockerData\nginx.
- **Данные** — E:\DockerData\alyaev-it.

## Быстрый старт (локально)

См. docs/ops/DEPLOY.md.

## Принципы

1. Любой новый блок/страница/кнопка начинается с **манифеста** в docs/manifests/ui/.
2. Любая работа с БД — только через манифест схемы в docs/manifests/db/.
3. Однородность: одни и те же токены, компоненты и паттерны на всех страницах.
4. Никаких вымышленных цифр, отзывов и рейтингов. Демо-кейсы помечаются честно.
