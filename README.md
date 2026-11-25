# alyaev.it — сайт Дмитрия Аляева

Персональная IT-студия: автоматизация бизнеса, AI-разработка, интеграции.

| Что | Где |
|---|---|
| Задачник | TASKS.md → docs/tasks/ |
| ТЗ (клиентское) | docs/spec/TZ.md |
| Правила разработки | docs/rules/RULES.md |
| UI-манифесты | docs/manifests/ui/ (карта компонентов — ниже) |
| Схема БД | docs/manifests/db/ |
| Архитектура | docs/architecture/ARCHITECTURE.md |
| Графические материалы | docs/personal-site-assets-v1/ (+ .zip); на сайте — `frontend/public/images/`, реестр `frontend/src/lib/design/images.ts` |

## Где что искать (три источника истины)

| Вопрос | Ответ ищется здесь |
|---|---|
| Что делать, в каком статусе | GitHub Issues `dominumuniversi-cpu/alyaev_it` + TASKS.md (только индекс) |
| Как делать: правила | docs/rules/RULES.md |
| Как выглядит элемент: разметка, токены, состояния | docs/manifests/ui/<компонент>.md |
| Не знаешь, какой манифест нужен | docs/manifests/ui.md — карта всех манифестов с областью ответственности |
| Картинки: какие есть, где лежат, куда ставить | docs/manifests/ui/images.md |
| Решения и ловушки по проекту | kaeru, инициатива `alyaev` |

Новый `.md` заводится только по месту смысла: правила — docs/rules/, манифесты элементов — docs/manifests/ui/,
схема данных — docs/manifests/db/, эксплуатация — docs/ops/. Дублировать правила в нескольких файлах нельзя.

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
