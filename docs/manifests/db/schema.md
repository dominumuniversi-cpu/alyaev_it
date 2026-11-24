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
| id | serial | PK |
| email | varchar | UNIQUE NOT NULL |
| password_hash | text | NOT NULL (argon2id) |
| display_name | varchar(120) | NOT NULL |
| phone | varchar(32) | NULL |
| status | varchar(16) | NOT NULL default 'active' — active / blocked |
| email_verified_at | timestamptz | NULL |
| last_login_at | timestamptz | NULL |
| created_at / updated_at | timestamptz | NOT NULL |

**Ловушка (проверено на живой базе):** расширения `citext` в базе НЕТ, колонка email —
обычный `varchar`, и UNIQUE-индекс **регистрозависимый**. Вставка `DIMA@alyaev.local` рядом
с `dima@alyaev.local` проходит успешно — получаются два разных пользователя.

Поэтому: **любое сравнение или запись email обязаны приводить его к нижнему регистру в коде**
(`.strip().lower()`), как это уже сделано в `api/auth.py`. Не полагаться на уникальность базы.
Расширение `citext` не ставить — миграция ломает существующий уникальный индекс.

### roles / user_roles
`roles(id, code UNIQUE, title)`; `user_roles(user_id, role_id)` — составной PK.
Коды: `admin`, `manager`, `editor`, `client`.

### sessions
`id varchar PK` (не uuid), `user_id fk`, `token_hash text`, `user_agent text`,
`ip varchar` (не inet), `expires_at`, `revoked_at` NULL, `created_at`.
Таблица уже работает, а не «на будущее»: вход администратора держится на ней.

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

### uploaded_files
Загруженные файлы. Манифест поведения — `docs/manifests/uploads.md`.

| Колонка | Тип | Ограничения |
|---|---|---|
| id | integer | PK |
| stored_name | varchar | UNIQUE NOT NULL — имя от нас, не от пользователя |
| original_name | varchar | NULL — имя, как его видел пользователь |
| content_type | varchar | NOT NULL — определён по сигнатуре файла, а не по расширению |
| size_bytes | integer | NOT NULL |
| kind | varchar | `image` / `document` |
| checksum | varchar | NULL — для поиска дублей |
| uploaded_by | integer | FK users.id |
| deleted_at | timestamptz | NULL — мягкое удаление |
| created_at / updated_at | timestamptz | NOT NULL |

**Правило:** физический файл лежит не в базе, а в `/app/media` (хост: `E:\DockerData\alyaev-it\media`).
Имя файла генерируем мы. Удаление — мягкое (`deleted_at`), публичная отдача отвечает 404 на удалённые.

## 7. Кабинет и проекты (Этап 3 — таблицы создаются сразу, используется позже)

**Созданы миграцией `e61ebf32d35e`** (24.11.2026). До неё таблиц не было. Сверяться с этим разделом,
а не с ТЗ 12.4: там перечень сущностей, здесь фактическая схема.

### clients
`id, user_id fk users NULL, display_name, company, contact_json jsonb, created_at, updated_at`.

- `user_id NULL` — нормальный случай: карточку заводят по заявке раньше, чем у клиента появляется вход.
- `contact_json` — свободная форма: у одного телефон, у другого Telegram и почта.

### projects
`id, client_id fk clients, title, description, status varchar(24), price_rub int, started_at, due_at, completed_at, created_at, updated_at`.

- `ck_projects_status`: `status IN (new, analysis, dev, testing, done)` — проверено попыткой вставить «wrong».
- `ck_projects_price`: `price_rub IS NULL OR price_rub >= 0`. NULL — цена ещё не согласована, это не ноль.
- Статус меняется **только через сервис**, он же пишет историю. Прямой UPDATE оставит историю без события.

### project_tasks
`id, project_id fk, title, description, status varchar(16), due_at, completed_at, created_at, updated_at`.

- `ck_project_tasks_status`: `status IN (todo, in_progress, done)`.
- Статус задачи не равен статусу проекта: проект в `dev`, а задача может быть `done`.

### project_status_history
`id, project_id fk, status_from varchar(24), status_to varchar(24), comment text, actor_user_id fk users, created_at`.

- `status_from NULL` — первый статус при создании проекта.
- Пишется только сервисом смены статуса, вручную не редактируется.

### Изоляция клиента (ТЗ 9.3)

Клиент видит **только свои** проекты. Отбор идёт в SQL (`WHERE client_id = <свой>`),
а не скрытием строк в интерфейсе. Чужой проект отвечает **404, а не 403** — иначе
перебором можно узнать, какие проекты существуют.

Проверено тестом `tests/test_account.py`: при удалении условия `client_id` из запроса
тест падает (`test_foreign_project_answers_404_not_403`). Значит, тест ловит именно эту дыру.


### Документы проекта (`documents`)

Документ — это **связь** файла с проектом, а не сам файл. Сам файл живёт в `uploaded_files`
(размер, тип, контрольная сумма, мягкое удаление). Разделение важное: один и тот же файл
может принадлежать нескольким проектам, и удаление документа не должно стирать файл с диска.

| Колонка | Тип | Смысл |
| --- | --- | --- |
| `id` | serial | ключ |
| `project_id` | FK → `projects.id`, CASCADE | проект, которому принадлежит документ |
| `file_id` | FK → `uploaded_files.id`, RESTRICT | физический файл |
| `title` | varchar(200) | как документ называется для человека |
| `category` | varchar(32) | `tz`, `act`, `instruction`, `other` |
| `uploaded_by` | FK → `users.id`, SET NULL | кто добавил |
| `deleted_at` | timestamptz | мягкое удаление |

`ON DELETE RESTRICT` на файле: пока документ ссылается на файл, файл удалить нельзя.
Это защита от «документ есть, файла нет».

**Изоляция:** документ доступен клиенту только через его проект. Запрос всегда идёт
`documents.project_id == projects.id AND projects.client_id == <клиент>` — та же проверка,
что и для проектов.

### Переписка по проекту (`messages`)

| Колонка | Тип | Смысл |
| --- | --- | --- |
| `id` | serial | ключ |
| `project_id` | FK → `projects.id`, CASCADE | проект |
| `author_user_id` | FK → `users.id`, SET NULL | автор; NULL — автор удалён |
| `author_role` | varchar(16) | `client` или `staff` — снимок роли на момент отправки |
| `body` | text | текст сообщения (plain text, не HTML) |
| `read_at` | timestamptz | когда прочитано другой стороной |

`author_role` хранится на сообщении, а не вычисляется из роли пользователя сейчас:
роли меняются, а история переписки не должна переписываться задним числом.

**Текст только простой.** Разметку не храним и не рендерим: переписка — не место
для HTML, а экранирование лишнего риска не создаёт.

### Смена статуса проекта — только через сервис

`_set_status` в `app/api/admin_clients.py` — **единственный** способ поменять `projects.status`.
Он пишет запись в `project_status_history` в той же транзакции. Прямой `UPDATE` оставит
историю без события, и клиент увидит статус, которого «не было».

Правила сервиса:

| Случай | Поведение | Почему |
| --- | --- | --- |
| статус вне списка | 422 | иначе CHECK в базе даст 500 вместо понятной ошибки |
| повтор того же статуса | история не пишется | история из повторов бесполезна |
| переход в `done` | ставится `completed_at` | дата завершения должна быть |
| возврат из `done` | `completed_at` очищается | иначе дата врёт |
| первый не-`new` статус | ставится `started_at` | момент старта не задают руками |

### Выдача доступа клиенту

Клиент не регистрируется сам (ТЗ 9.4). Доступ выдаёт администратор:
`POST /api/v1/admin/clients/<id>/access?email=...`.

- Пароль **генерируется на сервере** и возвращается **один раз** в ответе.
- В базе только хеш: «посмотреть пароль клиента» потом невозможно, только перевыпустить.
- Алфавит без похожих символов (`0/O`, `1/l/I`): пароль диктуют голосом.
- Перевыпуск пароля (`reset-password`) **гасит все сессии клиента**: иначе старые cookie
  продолжают работать и смена пароля ничего не защищает.

**Пароль никогда не попадает в журнал действий** — его читают другие роли.

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

**Реализация:** `backend/app/core/permissions.py` — матрица `ROLE_PERMISSIONS` и
`require_permission()`. Эндпоинт объявляет право, а не проверяет роль россыпью `if`.
Подробности и правила расширения — `docs/manifests/access-control.md` (единый источник).

Чужой объект клиенту — **404, не 403**: иначе по коду ответа можно перебрать существующие id.

## 10. Жизненные циклы (state machine)

```
lead.status:    new → in_progress → qualified → proposal → won
                   ↘ spam | ↘ lost (в любой момент)
project.status:  new → analysis → dev → testing → done
publication:     draft → published → archived (обратно в draft допустимо)
```

Переходы валидируются сервером; изменение статуса создаёт запись в истории/событиях.


## 11. Отзывы (reviews)

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

## 12. Калькулятор (calculator_options, calculator_complexity)

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
## 12.1. Семантическое ядро (semantic_queries)

> ТЗ раздел 11.4. Отдельная таблица поисковых запросов с привязкой к целевой странице.
> Таблица нужна не для дизайна, а для работы: что мы целимся занять, каким запросом,
> какой страницей и насколько успешно.

| Поле | Тип | Правило |
|---|---|---|
| `id` | bigint pk | |
| `query` | varchar(200) not null | сам запрос; UNIQUE вместе с `region` |
| `group_slug` | varchar(32) not null | `telegram` / `ai` / `rag` / `automation` / `parsers` / `integrations` / `websites` |
| `frequency` | integer null | частотность из сервиса; NULL = ещё не измеряли |
| `frequency_source` | varchar(32) null | `wordstat` / `gkp` / `hand` — откуда взята цифра |
| `difficulty` | smallint null | конкурентность 0–100; NULL = не оценена |
| `region` | varchar(32) not null default 'ru' | регион запроса |
| `target_path` | varchar(255) not null | целевая страница (обязательна — запрос без цели бесполезен) |
| `priority` | varchar(16) not null default 'medium' | `high` / `medium` / `low` |
| `position` | integer null | текущая позиция; NULL = не проверяли |
| `position_checked_at` | timestamptz null | когда проверяли позицию |
| `cluster` | varchar(64) null | метка кластера: одна группа может делиться на подтемы |
| `notes` | text | |
| `created_at`, `updated_at` | timestamptz | |

UNIQUE `(query, region)`. Индексы: `(group_slug)`, `(target_path)`, `(priority)`.

**Правила:**

1. **Одна страница закрывает группу запросов, а не один запрос.** Не создаём страницу под
   каждую формулировку — иначе получаем каннибализацию: две страницы против друг друга.
   Проверка каннибализации в админке: один `target_path` — много запросов это норма, а вот
   два *разных* запроса одной группы на *разные* страницы — повод задуматься.
2. `target_path` хранится **без** замыкающего слеша (`/services/ai-assistants`),
   а `seo_metadata.path` — **с** замыкающим (`/services/`). Это не расхождение,
   а разные соглашения, зафиксированные по факту:
   - `seo_metadata.path` — адрес страницы в том виде, в каком он попадает в sitemap
     и canonical, то есть с замыкающим слешем;
   - `semantic_queries.target_path` — путь для сопоставления запросов с услугами,
     нормализованный без слеша, как слаги.
   При сравнении двух таблиц путь нормализуется (убрать замыкающий слеш) — иначе
   одна и та же страница выглядит как две разные.
3. `frequency = NULL` — это **не ноль**, а «не измеряли». Сортировать по частотности с NULLs last,
   иначе неизмеренные запросы уедут вверх или вниз случайно.
4. Ключевые слова из `seo_metadata.keywords` — снимок для поисковика (и то не влияет на ранжирование).
   Ядро — рабочая таблица. Они **не дублируют друг друга**: keywords статичны, ядро живёт.
5. Позиции обновляет человек раз в квартал (ТЗ 11.8); автоматического парсера выдачи нет
   и не планируется — Яндекс и Google блокируют такие запросы.
## 12.2. Библиотека готовых решений (solutions)

> ТЗ раздел 7.4. Каталог готовых модулей: боты, AI-ассистенты, парсеры,
> отчёты, интеграционные модули, скрипты обработки данных.
> Отличие от «услуги»: услуга — работа под заказ, решение — готовый модуль,
> который можно внедрить быстрее и дешевле, чем писать с нуля.

| Поле | Тип | Правило |
|---|---|---|
| `id` | integer pk | |
| `slug` | varchar(160) not null unique | латиница, как у услуг и кейсов |
| `title` | varchar(200) not null | |
| `summary` | varchar(320) not null | одна-две фразы для карточки каталога |
| `kind` | varchar(32) not null | `bot` / `ai` / `parser` / `report` / `integration` / `script` |
| `description_md` | text not null default '' | что делает и как устроено |
| `included` | jsonb not null default '[]' | что входит: список строк (правило 6.5 ТЗ) |
| `requirements_md` | text not null default '' | что нужно от заказчика для запуска |
| `technologies` | jsonb not null default '[]' | список строк |
| `price_from` | integer null | стартовая цена внедрения, ₽; NULL при `price_on_request` |
| `price_on_request` | boolean not null default false | «по запросу» вместо цены |
| `demo_url` | varchar(255) null | ссылка на живую демонстрацию; NULL = демо нет |
| `service_slug` | varchar(160) null | услуга, по которой внедряется модуль; NULL = модуль не привязан |
| `status` | varchar(16) not null default 'draft' | `draft` / `published` / `archived` |
| `sort_order` | integer not null default 0 | порядок в каталоге |
| `deleted_at` | timestamptz null | soft-delete: слаг остаётся занятым |
| `created_at` / `updated_at` | timestamptz not null | `updated_at` меняется триггером |

### Правила работы с solutions

1. **Цена — стартовая, не итоговая.** Поле `price_from` означает «внедрение от».
   Точно как у услуг: доп. расходы (сервер, токены, API-подписки) в неё не входят
   и описываются в `requirements_md`.
2. **`demo_url` заполняется только реальной ссылкой.** Демо, которое не работает,
   хуже отсутствия демо. NULL честнее выдуманного адреса.
3. **Публикация — только через `status = 'published'`.** Публичный API отдаёт
   исключительно опубликованные и неудалённые строки; черновик → 404.
4. **Удаление — soft-delete.** `deleted_at` ставится, `status` уходит в `archived`.
   Слаг остаётся занятым: создать второй «тот же» модуль нельзя.
5. **Связь с услугами через услуги, а не через отдельную таблицу.** У решения нет
   отдельной таблицы связи: каталог ссылается на услугу текстом в
   `description_md`. Если появится реальная потребность в связях «много ко многому»
   (один модуль внедряется по нескольким услугам), тогда заводится
   `solution_services` — но не раньше.

### Чего нет и почему

- **Нет поля «скачивания» файла.** Готовый модуль — это работа по внедрению, а не
  файл в архиве. Модуль, который можно скачать и запустить самостоятельно, — другая
  бизнес-модель, и её в ТЗ нет.
- **Нет числовых метрик эффективности.** Экономия «30% времени» без измерения
  превращается в выдумку; ТЗ 5 прямо запрещает фиктивные цифры.

## 12.3  `article_articles` — связи статей между собой

Двунаправленная перелинковка статей (ТЗ 11.10): «Читайте также».

| Колонка | Тип | Правила |
|---|---|---|
| `source_id` | int, FK → articles.id, PK | статья, на странице которой показывается блок |
| `target_id` | int, FK → articles.id, PK | статья, на которую ведём |

Правила:

1. `ON DELETE CASCADE` с обеих сторон: удаление статьи не оставляет висящих ссылок.
2. `CHECK (source_id <> target_id)` — статья не ссылается на саму себя.
3. Связь **направленная**. Если взаимность нужна, её заводит человек двумя строками.
   Автоматически не симметрируем: обратное направление бывает неуместным («RAG» → «как
   выбрать бота» имеет смысл, обратно — нет).
4. Не больше 3 связей на статью — ограничение в запросе, как у `article_services`.
5. Показываются только опубликованные статьи (`status = 'published'` и `deleted_at IS NULL`).

## 12.3. Связь статей с услугами (article_services)

> ТЗ 11.10 «Внутренняя перелинковка». Статья сама по себе — лист: из неё
> можно уйти только в блог или в форму заявки. Связь с услугой превращает
> блог в сеть страниц, где читатель попадает на нужное коммерческое предложение.

| Поле | Тип | Правило |
|---|---|---|
| `article_id` | integer fk → articles.id | ON DELETE CASCADE |
| `service_id` | integer fk → services.id | ON DELETE CASCADE |
| | | PK из двух полей; пара уникальна |

### Правила работы

1. **Связь — явная, руками, а не по совпадению слов.** Услугу выбирает человек:
   автоматический подбор по ключевым словам даёт случайные пары
   («статья про отчёты» → «разработка сайтов»), и перелинковка начинает вредить.
2. **Удаление статьи или услуги убирает связь.** Строки связи — не самостоятельная
   сущность, а отношение; висячих пар быть не должно.
3. **Связанных услуг — не больше трёх на статью.** Пять ссылок под статьёй
   выглядят как рекламный блок и размывают выбор. Если услуг больше, выбираем
   главные.
4. **Пустая связь — нормальное состояние.** Блок на странице не рендерится,
   пока пар нет. Пустая полоса «Услуги по теме» хуже её отсутствия.

## 13. Что НЕ делаем

- Не храним пароли в открытом виде и секреты в БД.
- Не храним номера карт и паспортные данные.
- Не пишем в БД IP в открытом виде — только `ip_hash` (SHA-256 с серверной солью).
- Не создаём отдельные таблицы под почти одинаковые сущности: категории/статьи — через связи.