# Карта UI-манифестов — с чего начинать

Это индекс. Здесь только: где лежит манифест и за что он отвечает.
Содержимое (правила, токены, состояния) — в самих файлах рядом, в `docs/manifests/ui/`.
Дублировать правила сюда нельзя: правильный файл один, индекс на него только ссылается.

## Порядок чтения

1. `tokens.md` — цвета, отступы, типографика. Без него любые цвета «на глаз» запрещены.
2. Картинки: `images.md` (что есть, где лежит, куда ставить, реестр `frontend/src/lib/design/images.ts`).
3. Манифест конкретного элемента из таблицы ниже.
4. `docs/rules/RULES.md` — общие правила разработки (если ещё не прочитаны).

## Общие примитивы

| Манифест | Отвечает за |
|---|---|
| [`ui/tokens.md`](ui/tokens.md) | Дизайн-токены (единый источник истины) — дизайн-токены: цвета, отступы, типографика, радиусы |
| [`ui/button.md`](ui/button.md) | Button — кнопки и ссылки-кнопки: варианты, размеры, состояния |
| [`ui/badge.md`](ui/badge.md) | Badge (метка статуса) — метка статуса (демо, цена, категория) |
| [`ui/card.md`](ui/card.md) | Card и ServiceCard — общая карточка и связка Card + ServiceCard |
| [`ui/feature-card.md`](ui/feature-card.md) | FeatureCard (преимущество / этап / факт) — карточка преимущества, этапа, факта |
| [`ui/field.md`](ui/field.md) | Поле формы (Input / Textarea / Select) — поля форм: input, textarea, select, ошибки |
| [`ui/section.md`](ui/section.md) | Section (контейнер секции) — контейнер секции: отступы, фон, ширина |
| [`ui/breadcrumbs.md`](ui/breadcrumbs.md) | Breadcrumbs (хлебные крошки) — хлебные крошки на внутренних страницах |
| [`ui/accordion.md`](ui/accordion.md) | Accordion (FAQ) — FAQ-аккордеон: разметка, доступность, состояния |
| [`ui/icons.md`](ui/icons.md) | Icon — пиктограммы SVG, правила вместо нарезки листов иконок |
| [`ui/process-flow.md`](ui/process-flow.md) | ProcessFlow — инфографика шагов процесса (главная, `#scenario`) |

## Блоки страниц

| Манифест | Отвечает за |
|---|---|
| [`ui/header.md`](ui/header.md) | Header (шапка сайта) — шапка сайта и мобильное меню |
| [`ui/hero.md`](ui/hero.md) | Hero (главный экран) — главный экран: композиция, левая и правая колонки |
| [`ui/service-card.md`](ui/service-card.md) | ServiceCard (карточка услуги) — карточка услуги: состав, иконка, картинка, цена |
| [`ui/lead-form.md`](ui/lead-form.md) | Онлайн-бриф (форма заявки) — онлайн-бриф и форма заявки |
| [`ui/calculator.md`](ui/calculator.md) | Калькулятор стоимости — калькулятор стоимости услуги |
| [`ui/diagnostics.md`](ui/diagnostics.md) | Бесплатный разбор процесса (диагностика) — страница бесплатного разбора процесса |
| [`ui/solutions-library.md`](ui/solutions-library.md) | Библиотека готовых решений — библиотека готовых решений |
| [`ui/footer.md`](ui/footer.md) | Footer (подвал) — подвал сайта |

## Медиа

| Манифест | Отвечает за |
|---|---|
| [`ui/images.md`](ui/images.md) | Images (изображения сайта) — картинки целиком: инвентаризация, реестр кода, правила применения, соответствие услугам |
| [`docs/personal-site-assets-v1/README.md`](../personal-site-assets-v1/README.md) | исходный пакет дизайна: что в архиве, как его ставили в проект |

## Страницы

| Манифест | Отвечает за |
|---|---|
| [`ui/about.md`](ui/about.md) | страница «Обо мне» (`/about/`) — страница /about/: секции, состав, правила текста |
| [`ui/portfolio.md`](ui/portfolio.md) | Портфолио (`/portfolio/`, `/portfolio/<slug>/`) — список и страница проекта портфолио |
| [`ui/portfolio-articles.md`](ui/portfolio-articles.md) | Портфолио и статьи — портфолио в связке со статьями и блогом |
| [`ui/semantic-core.md`](ui/semantic-core.md) | семантическое ядро — семантическое ядро: запросы, посадочные, перелинковка |
| [`ui/seo-panel.md`](ui/seo-panel.md) | SEO-панель страницы — SEO-панель страницы: title, description, OG |

## Админка и кабинет

| Манифест | Отвечает за |
|---|---|
| [`ui/account-login.md`](ui/account-login.md) | Вход клиента в кабинет (ClientLoginForm) — вход клиента в кабинет |
| [`ui/account.md`](ui/account.md) | Личный кабинет клиента (AccountShell) — личный кабинет клиента целиком |
| [`ui/admin-clients.md`](ui/admin-clients.md) | страница админки «Клиенты» (`/admin/clients/`) — админка: список клиентов |
| [`ui/admin-content.md`](ui/admin-content.md) | CMS-редактор контента (портфолио и блог) — админка: CMS-редактор портфолио и блога |
| [`ui/admin-layout.md`](ui/admin-layout.md) | Каркас админки — общий манифест — админка: каркас, навигация, общие блоки |
| [`ui/admin-leads.md`](ui/admin-leads.md) | Таблица заявок (LeadsTable) — админка: таблица заявок |
| [`ui/admin-login.md`](ui/admin-login.md) | Вход в админку (LoginForm) — админка: вход |
| [`ui/admin-projects.md`](ui/admin-projects.md) | страница админки «Проекты» (`/admin/projects/`) — админка: проекты |
| [`ui/admin-reviews.md`](ui/admin-reviews.md) | отзывы клиентов — админка: отзывы |
| [`ui/admin-services.md`](ui/admin-services.md) | Редактор услуг и цен (ServicesEditor) — админка: услуги и цены |
| [`ui/audit-log.md`](ui/audit-log.md) | Журнал действий (audit log) — журнал действий в админке |

## Соседние каталоги (не UI, но рядом)

| Что | Где |
|---|---|
| Схема БД | [`db/schema.md`](db/schema.md) |
| API-контракты | [`access-control.md`](access-control.md), [`uploads.md`](uploads.md), [`analytics.md`](analytics.md), [`telegram-notifications.md`](telegram-notifications.md), [`url-structure.md`](url-structure.md) |
| Правила разработки | [`../rules/RULES.md`](../rules/RULES.md) |
| Задачник (только индекс) | [`../../TASKS.md`](../../TASKS.md) — статусы задач живут в GitHub Issues |

## Если манифеста нет

Новый элемент начинается с манифеста в `docs/manifests/ui/` (см. README, принцип 1) и строки в этой карте.
Манифест снаружи этого каталога не создаётся: правила — в `docs/rules/`, эксплуатация — в `docs/ops/`, схема — в `docs/manifests/db/`.
