# Манифест схемы БД (source of truth)

> Миграции: `backend/alembic/versions/`.  
> Модели: `backend/app/db/models.py`.  
> **Правило:** сначала правится этот файл, потом — модель, потом — миграция. Расхождение = баг.

## 0. Общие соглашения (читать обязательно)

| Соглашение | Значение |
|---|---|
| PK | `id BIGSERIAL` (в будущем не исключается UUID для публичных сущностей) |
| Время | `timestamptz`, default `now()`. Колонки `created_at`, `updated_at` есть у всех сущностей контента и заявок |
| Мягкое удаление | `deleted_at timestamptz NULL` у контентных таблиц (services, articles, portfolio, reviews, pages) |
| Публикация | `status varchar(16)` в (`draft`,`published`,`archived`) — только `published` и `deleted_at is null` видны публично |
| Слаги | `slug varchar(160) UNIQUE NOT NULL`, только `[a-z0-9-]`, генерируется из названия при сохранении |
| Деньги | `price_from integer` — целые рубли, без float. `price_on_request boolean` |
| Тексты | Markdown в `body_md text`, HTML санитизируется на рендере |
| JSON | `jsonb` только для структурированных списков (examples, features), не для пользовательского HTML |
| Регистр | таблицы и колонки — snake_case, единственное число |
| Индексы | внешние ключи всегда индексируются; публичные выборки — составные индексы `(status, published_at desc)` |

## 1. Справочник ролей и пользователи

### users
| Колонка | Тип | Ограничения |
|---|---|---|
| id | bigserial | PK |
| email | citext | UNIQUE NOT NULL |
| password_hash | text | NOT NULL (argon2id) |
| display_name | varchar(120) | NOT NULL |
| phone | varchar(32) | NULL |
| status | varchar(16) | NOT NULL default 'active' — active / blocked |
| email_verified_at | timestamptz | NULL |
| last_login_at | timestamptz | NULL |
| created_at / updated_at | timestamptz | NOT NULL |

### roles / user_roles
`roles(id, code unique, title)`; `user_roles(user_id, role_id, PK(user_id,role_id))`.
Коды: `admin`, `manager`, `editor`, `client`.

### sessions (будущий кабинет)
`sessions(id uuid pk, user_id fk, token_hash text unique, user_agent text, ip inet, expires_at timestamptz, revoked_at timestamptz NULL)`.

## 2. Заявки (ядро продаж)

### leads
| Колонка | Тип | Ограничения | Примечание |
|---|---|---|---|
| id | bigserial | PK | |
| public_id | uuid | UNIQUE default gen_random_uuid() | Не светить id наружу |
| name | varchar(120) | NOT NULL | |
| contact_type | varchar(16) | NOT NULL — telegram / phone / email | |
| contact_value | varchar(160) | NOT NULL | |
| task_type | varchar(64) | NULL — тек. код услуги/категории | |
| message | text | NOT NULL | Описание задачи |
| company_site | varchar(255) | NULL | |
| source_page | varchar(255) | NULL | С какой страницы пришла |
| utm_json | jsonb | NOT NULL default '{}' | UTM-метки |
| status | varchar(24) | NOT NULL default 'new' — new / in_progress / qualified / proposal / won / lost / spam | |
| consent_version | varchar(16) | NOT NULL | Версия согласия |
| consent_at | timestamptz | NOT NULL | Момент согласия |
| ip_hash | text | NULL | Анонимизированный IP |
| user_agent | text | NULL | |
| created_at / updated_at | timestamptz | NOT NULL | |
| deleted_at | timestamptz | NULL | |

Индексы: `(status, created_at desc)`, `lead_task_type`.

### lead_events
`id, lead_id fk → leads(id) ON DELETE CASCADE, event varchar(32), payload jsonb, actor_user_id fk users NULL, created_at`.
Задача `(lead_id, created_at)`.

## 3. Услуги

### service_categories
`id, slug unique, title, sort_order int default 0, is_active bool default true, created_at, updated_at`.

### services
| Колонка | Тип | Примечание |
|---|---|---|
| id | bigserial | |
| category_id | fk → service_categories | NOT NULL |
| slug | varchar(160) | UNIQUE |
| title | varchar(200) | |
| short_description | varchar(300) | Для карточки |
| body_md | text | Полное описание (Markdown) |
| price_from | integer | NULL если price_on_request |
| price_currency | varchar(3) | default 'RUB' |
| price_on_request | bool | default false |
| duration_text | varchar(64) | «3–5 дней», «по ТЗ» |
| show_problems | jsonb | список бизнес-проблем (string[]) |
| examples | jsonb | 2–3 примера задач (string[]) |
| included | jsonb | что входит |
| excluded | jsonb | что не входит |
| client_data | jsonb | какие данные нужны от заказчика |
| extra_costs | jsonb | дополнительные расходы |
| warranty_text | text | Гарантия |
| faq | jsonb | [{q, a}] |
| seo_meta_id | fk → seo_metadata | NULL |
| status | varchar(16) | draft / published / archived |
| sort_order | int | default 0 |
| deleted_at | timestamptz | |
| created_at / updated_at | timestamptz | |

## 4. SEO (общий механизм для всех публичных страниц)

### seo_metadata
| Колонка | Тип | Примечание |
|---|---|---|
| id | bigserial | PK |
| entity_type | varchar(32) | service / article / portfolio / page / category |
| entity_id | bigint | |
| path | varchar(255) | Канонический путь |
| title | varchar(160) | SEO Title; уникальность проверяет админка |
| description | varchar(320) | |
| h1 | varchar(200) | |
| keywords | text | Внутренний список |
| canonical | varchar(255) | NULL = текущий path |
| robots_index | bool default true | |
| robots_follow | bool default true | |
| og_title / og_description | varchar | |
| og_image | varchar(255) | |
| schema_json | jsonb | JSON-LD |
| created_at / updated_at | timestamptz | |

UNIQUE `(entity_type, entity_id)`, UNIQUE `path`.

## 5. Портал: портфолио, статьи, отзывы

### portfolio
`id, slug, title, problem text, solution text, architecture_md text, tech text[], demo_url, cover_image, status_kind varchar(24) (demo|own|commercial), body_md, seo_meta_id, status, sort_order, deleted_at, created_at, updated_at`.

### articles
`id, slug, title, summary text, body_md, cover_image, published_at timestamptz NULL, author_user_id fk users, seo_meta_id, status, created_at, updated_at`.
Индекс `(status, published_at desc)`.

### article_categories / article_category_links
`category_id fk`, `article_id fk`, PK(article_id, category_id).

### reviews
`id, client_name varchar(120), client_position varchar(120), company varchar(120), body text, project_title varchar(200), published bool default false, published_at timestamptz, created_at`.
Пустая таблица → блок на сайте не рендерится.

## 6. Контакты и медиа

### site_settings
`id, key varchar(64) UNIQUE, value jsonb, updated_at`. Примеры ключей: `telegram_username`, `email`, `phone`, `social_links`, `metrika_id`.

### media_assets
`id, filename, mime varchar(100), size_bytes bigint, width, height, alt_text varchar(200), storage_path, created_at`.

## 7. Кабинет и проекты (Этап 3 — таблицы создаются сразу, используется позже)

### clients
`id, user_id fk users NULL, display_name, company, contact_json jsonb, created_at`.

### projects
`id, client_id fk clients, title, description, status varchar(24) (new/analysis/dev/testing/done), price_rub bigint, started_at, due_at, completed_at, created_at, updated_at`.

### project_tasks
`id, project_id fk, title, description, status, due_at, completed_at, created_at, updated_at`.

### project_status_history
`id, project_id fk, status_from varchar(24), status_to varchar(24), comment text, actor_user_id fk users, created_at`.

### documents
`id, owner_client_id fk clients NULL, owner_user_id fk users NULL, project_id fk projects NULL, title, storage_path, mime, size_bytes, created_at, deleted_at`.

### messages
`id, thread_type varchar(16) (project|lead|support), thread_ref bigint, author_user_id fk, body text, created_at, read_at`.

### notifications
`id, user_id fk, kind varchar(32), title, body, payload jsonb, read_at timestamptz, created_at`.

### telegram_accounts
`id, user_id fk UNIQUE, telegram_user_id bigint UNIQUE, username, link_code varchar(16), linked_at, created_at`.

## 8. Аудит

### audit_log
`id, actor_user_id fk users NULL, action varchar(64), entity_type varchar(32), entity_id bigint, payload jsonb, ip_hash text, created_at`.

## 9. Матрица доступа (обязательно соблюдать в API)

| Ресурс | Гость | Клиент | Менеджер | Редактор | Админ |
|---|---|---|---|---|---|
| published services/articles/portfolio | чтение | чтение | чтение+правка | чтение+правка | всё |
| leads (создание) | да, с rate-limit | — | — | — | — |
| leads (просмотр/статусы) | нет | нет | да | нет | да |
| projects/documents/messages | нет | только свои (`owner_* = текущий`) | все | нет | все |
| seo_metadata | чтение через публичную страницу | — | — | правка | всё |
| users/roles/settings | нет | нет | нет | нет | всё |

**Правило:** проверка прав — только на сервере (FastAPI dependency). Скрытие элементов UI — не безопасность.

## 10. Жизненные циклы (state machine)

```
lead.status:    new → in_progress → qualified → proposal → won
                   ↘ spam | ↘ lost (в любой момент)
project.status:  new → analysis → dev → testing → done
publication:     draft → published → archived (обратно в draft допустимо)
```

Переходы валидируются сервером; изменение статуса создаёт запись в истории/событиях.


## 12. Отзывы (reviews)

> ТЗ раздел 4.4 и 8: отзывы публикуются **только с разрешения автора**. Пока подтверждённых нет —
> раздел `/reviews/` не публикуется и не индексируется (ТЗ раздел 3).

| Поле | Тип | Правило |
|---|---|---|
| `id` | bigint pk | |
| `public_id` | uuid unique | внешний идентификатор |
| `author_name` | varchar(120) | имя или название компании |
| `author_position` | varchar(120) null | должность, по желанию |
| `text` | text | сам отзыв |
| `project_title` | varchar(200) null | связанный проект |
| `consent_given` | boolean not null default false | **разрешение на публикацию**; без него публикация запрещена |
| `consent_at` | timestamptz null | когда получено согласие |
| `consent_version` | varchar(16) null | версия текста согласия |
| `status` | varchar(16) | `draft` / `published` / `hidden` |
| `published_at` | timestamptz null | |
| `sort_order` | int default 0 | |
| `deleted_at` | timestamptz null | мягкое удаление |
| `created_at`, `updated_at` | timestamptz | |

**Правила:**

1. Запись со `status = published` и `consent_given = false` — ошибка данных; сервер не считает её опубликованной.
2. Публичная страница получает отзыв, только если `status = published`, `consent_given = true`, `deleted_at is null`.
3. Если опубликованных отзывов ноль — страница `/reviews/` отдаёт `notFound()` (404) и не попадает в sitemap.
4. Не выдумывать рейтинги и звёзды в разметке: Schema.org `Review` добавляется только к реальным отзывам.

## 13. Калькулятор (calculator_options, calculator_complexity)

> ТЗ 7.1: цены калькулятора настраиваются администратором, а не лежат в коде.

### calculator_options — дополнительные опции

| Поле | Тип | Правило |
|---|---|---|
| `id` | bigint pk | |
| `slug` | varchar(64) unique | стабильный идентификатор для URL |
| `title` | varchar(120) | как видит клиент |
| `price_delta` | integer | надбавка в рублях, может быть 0 |
| `is_active` | boolean default true | выключенная опция не показывается |
| `sort_order` | int default 0 | |
| `created_at`, `updated_at` | timestamptz | |

### calculator_complexity — коэффициенты сложности

| Поле | Тип | Правило |
|---|---|---|
| `id` | bigint pk | |
| `slug` | varchar(32) unique | `basic` / `medium` / `hard` |
| `title` | varchar(60) | базовая / средняя / сложная |
| `factor` | numeric(4,2) | множитель, например 1.00 / 1.35 / 1.80 |
| `is_active` | boolean default true | |
| `sort_order` | int default 0 | |
| `created_at`, `updated_at` | timestamptz | |

**Правила:**

1. `factor` не может быть меньше 1.0 — калькулятор не должен давать цену ниже базовой.
2. Хотя бы одна активная сложность обязательна, иначе калькулятор не работает и страница не публикуется.
3. Цена считается на сервере (`GET /api/v1/public/calculator` отдаёт конфиг, расчёт — в общем модуле),
   а не в браузере: цифры в интерфейсе и в заявке обязаны совпадать.
4. Изменение цен калькулятора не требует пересборки — только изменения в базе.
## 11. Что НЕ делаем

- Не храним пароли в открытом виде и секреты в БД.
- Не храним номера карт и паспортные данные.
- Не пишем в БД IP в открытом виде — только `ip_hash` (SHA-256 с серверной солью).
- Не создаём отдельные таблицы под почти одинаковые сущности: категории/статьи — через связи.