# Манифест: Images (изображения сайта)

---

> **Дизайн-система: PERSONAL v2.0 (25.11.2026).** Цвета и типографика — по `tokens.md`:
> бумага `--c-paper` #EAE7DF, графит `--c-ink` #242522, лайм `--c-lime` #B9E56B,
> терракота `--c-terracotta` #D97859. Где ниже упомянуты старые токены (`--c-gold`, `--c-cyan`,
> `--c-bg`, `--c-surface`, …) — они сохранены как алиасы на новую палитру (см. `tokens.md`, раздел «Совместимость»).
> Радиусы скруглений 0 (кроме полей ввода), декоративные растровые фоны секций отменены.

---


**Файл:** `frontend/src/lib/design/images.ts` · контракт реестра; сами файлы — `frontend/public/images/`

> Статус: DRAFT. Реестра `src/lib/design/images.ts` ещё нет, каталог `src/lib/design/` пуст. В коде `frontend/src` сегодня **нет ни одного** `next/image` и ни одной строки `"/images/..."`. Манифест описывает то, как изображения должны быть устроены, а не то, что уже сделано.

## Назначение

Изображения — фоновое оформление и иллюстрации, не смысловой слой. Текст, цены, подписи и кнопки живут в разметке, картинка их только поддерживает.

- Файлы лежат в `frontend/public/images/` и отдаются с корня сайта: `/images/hero/hero-visual.webp`.
- Источник — дизайн-пакет `docs/personal-site-assets-v1` (архив `docs/personal-site-assets-v1.zip`), раскладывается в проект по задаче «графическое оформление сайта».
- Адрес в браузере собирается из реестра, не из строки в компоненте. Одна картинка — одна запись.

## Инвентаризация

Размеры сняты с самих файлов через `sharp` (формат у всех — WebP). Цифры из `README.md` и `assets-manifest.json` пакета (**540×392** для hero и др.) **неверны** — их не копировать.

| Файл | Размер, px | Вес, КБ |
|---|---|---|
| `hero/hero-visual.webp` | 340×300 | 33 |
| `services/telegram-bot.webp` | 276×220 | 13 |
| `services/ai-assistant.webp` | 271×220 | 20 |
| `services/knowledge-base.webp` | 263×220 | 13 |
| `services/automation.webp` | 276×160 | 13 |
| `services/parsers.webp` | 271×160 | 11 |
| `services/integrations.webp` | 263×160 | 9 |
| `about/about-workspace.webp` | 328×175 | 14 |
| `portfolio/portfolio-dashboard.webp` | 299×175 | 12 |
| `portfolio/business-growth.webp` | 315×175 | 15 |
| `icons/advantages-icons-sheet.webp` | 388×175 | 4 |
| `icons/services-icons-sheet.webp` | 263×175 | 3 |
| `backgrounds/bg-circuit-blue.webp` | 231×230 | 12 |
| `backgrounds/bg-circuit-gold.webp` | 239×230 | 9 |
| `backgrounds/bg-earth-network.webp` | 229×230 | 13 |
| `backgrounds/bg-wave.webp` | 258×230 | 11 |
| `backgrounds/server-racks.webp` | 225×230 | 14 |
| `telegram/mobile-telegram.webp` | 188×230 | 9 |
| `reference/visual-assets-board.webp` | 1672×941 | 345 |

Правила:

- `reference/` — образец для дизайнера, **на сайте не используется**; в HTML не попадает.
- `icons/*-sheet` — спрайт-листы целиком не вставлять: из них режутся отдельные иконки или рисуется SVG.
- Размеры в реестре обязаны совпадать с файлом. Расхождение = ошибка проверки, а не «примерно так».

### Что реально известно про листы иконок

Замеры (sharp + карта яркости по кадрам 6×10 px — единственный доступный способ, вижн в сессии несработал):

- `advantages-icons-sheet.webp`, 388×175: вертикальный разделитель у x≈2–6, дальше **4 ячейки** по ~88–92 px, содержимое в строках y≈60–125.
- `services-icons-sheet.webp`, 263×175: разделитель у x≈8, дальше **3 ячейки** по ~80 px; в каждой предположительно пиктограмма (y≈35–85) и подпись/плашка под ней (y≈90–150).
- Фон обеих пластин — тёмно-синий (RGB ≈ 4,23,46), ячейки **не прозрачные**: это превью, а не PNG с альфой.
- Смысл пиктограмм и текст подписей без вижна прочитать нельзя — угадывать запрещено.

Отсюда правила:

1. Листы — только референс композиции, **не** ассеты сайта: целиком не вставлять, сеткой не нарезать «на глаз».
2. Если понадобится пиктограмма — рисуется SVG (или ставится `lucide-react`), а лист служит образцом стиля.
3. Если лист всё же ставят картинкой — только с `mix-blend-mode: screen` на тёмной карточке, иначе вокруг ячеек видна синяя плашка.
4. Прочитать подписи можно только моделью с приёмом изображений (`zai-coding-cn/glm-5.3-flash`); без этого считать смысл ячеек неизвестным.

В реестре кода эти файлы лежат как `advantagesIconsSheet` / `servicesIconsSheet`, и `devOnlyImages()` возвращает их вместе с `visualAssetsBoard` — то есть список того, что на прод попадать не должно.

## Единый реестр

**Файл реестра:** `repo/frontend/src/lib/design/images.ts` (создан вместе с этим манифестом).
Там экспортируются `SiteImage`, `IMAGES`, `imageForService(slug, category)`, `imageForPortfolio(index)`,
`decorativeBackground(name, basePath)` и `devOnlyImages()`. Пути к картинкам в компонентах не пишутся руками.


Единственный источник правды — `frontend/src/lib/design/images.ts`. Ни один компонент не собирает путь к картинке сам.

```ts
export type ImageCategory = "hero" | "service" | "about" | "portfolio" | "background" | "telegram";

export type SiteImage = {
  src: string;      // путь от корня сайта: "/images/services/telegram-bot.webp"
  width: number;    // реальные px из шарпа
  height: number;
  alt: string;      // по-русски; "" только для декоративных
  category: ImageCategory;
};

export const IMAGES: Record<string, SiteImage> = { /* … */ };

// По slug услуги из БД; неизвестный slug → картинка категории, а не пустота.
export function imageForService(slug: string): SiteImage;
// Фон-декорация: возвращает SiteImage с alt: "".
export function imageForCategory(category: string): SiteImage;
// CSS-значение для background-image, с учётом basePath.
export function decorativeBackground(name: string): string;
```

- Реестр — обычный объект, без запросов и без `fs` в рантайме.
- Пути пишутся от корня сайта (`/images/...`), потому что `next/image` сам добавляет `basePath`.
- Для CSS-фонов `basePath` (по умолчанию `/alyaev`) дописывает хелпер — руками не склеивать.
- Новый файл без записи в реестре — дефект. Так же как запись без файла.

## Правила использования

- Только `next/image`. `<img src="...">` и CSS `url()` в обход реестра запрещены.
- Всегда явные `width` и `height` из реестра (в `next.config.mjs` стоит `images: { unoptimized: true }`, поэтому оптимизации нет — защита от сдвига вёрстки держится только на размерах). Либо `fill` внутри блока с заданным размером.
- Hero: `priority`, `sizes="(max-width: 768px) 100vw, 540px"`. Остальным — ленивая загрузка по умолчанию, без `priority`.
- `alt` — по-русски, описывает, что на картинке. Декоративный фон — не `<img>`, а `background-image` с `aria-hidden`, без `alt`.
- Под текстом поверх фона — затемнение: `--c-text` (#F3F5F8) и `--c-text-muted` (#929CAB) должны держать контраст ≥ 4.5:1.
- Внутри картинок нет текста, цен и подписей интерфейса: их не перевести и не найти поиском.
- Изображения портфолио — иллюстрации, а не скриншоты клиентов. Честная подпись «Демонстрационный проект» из `PORTFOLIO_STATUS_LABELS` (`src/lib/api.ts`) остаётся на месте.
- Мобильные: `max-width: 100%`, без горизонтальной прокрутки. Если картинка hero отодвигает первый экран — ниже 640px её скрывать: LCP — текстовый заголовок, не картинка.

## Сопоставление с услугами из БД

Slug услуги приходит из `GET /api/v1/public/services` (`category_slug` — категория).

| slug услуги | Картинка |
|---|---|
| `telegram-bot-for-business` | `services/telegram-bot` |
| `ai-consultant-bot` | `services/ai-assistant` |
| `knowledge-base-bot` | `services/knowledge-base` |
| `bot-repair` | `services/telegram-bot` |
| `service-link` | `services/integrations` |
| `process-automation` | `services/automation` |
| `ai-digest` | `services/ai-assistant` |
| `site-parser` | `services/parsers` |
| `api-integration` | `services/integrations` |
| `1c-integration` | `services/integrations` |

Запасной вариант — по `category_slug`:

| Категория | Картинка |
|---|---|
| `telegram-bots` | `services/telegram-bot` |
| `automation` | `services/automation` |
| `parsers` | `services/parsers` |
| `integrations` | `services/integrations` |
| `websites` | `services/integrations` |

Остальные страницы:

| Место | Картинка | Условие |
|---|---|---|
| Главная, правая колонка | `hero/hero-visual` | см. противоречие с `hero.md` |
| О компании, блок «Чем занимаюсь» | `about/about-workspace` | под `<h2>`, над списком |
| Страница услуги / карточка | по таблице выше | — |
| Портфолио, кейс «как дашборд» | `portfolio/portfolio-dashboard` | с подписью «Демонстрационный проект» |
| Портфолио, кейс «рост/дайджест» | `portfolio/business-growth` | с подписью |
| Портфолио, прочее | `about/about-workspace` | запасной вариант |
| Контакты, акцент блока заявки | `backgrounds/bg-circuit-gold` | декоративный фон |
| Telegram-блок | `telegram/mobile-telegram` | только если такой блок реально есть |

- Slug из БД не найден ни в одной таблице → картинка категории; категории нет → `services/integrations`.
- Новый slug в БД не ломает страницу: неизвестное имя отдаёт запасную картинку, а не битую ссылку.

## Проверка

- [ ] `grep -r "'/images/|\"/images/" frontend/src` находит совпадения **только** в `lib/design/images.ts`.
- [ ] Каждый файл в `frontend/public/images` есть в реестре, и `width`/`height` совпадают с шарпом (скрипт на `sharp`).
- [ ] В HTML целевых страниц картинка — `<img>` с непустым `alt`; фоны — `background-image` в CSS, не `<img>`.
- [ ] 375 / 768 / 1280 px: горизонтальной прокрутки нет, пропорции не побиты.
- [ ] У всех картинок явные размеры — при загрузке нет сдвига вёрстки (проверка по живому DOM, не по коду ответа).
- [ ] HTML смотреть в собранном виде: 200 OK у страницы ещё не значит, что картинка на месте.

## Запрещено

- Строки `"/images/..."` в компонентах и страницах.
- `<img>` вместо `next/image`; фоны через `<img>`.
- Размеры «на глаз», `width`/`height` без соответствия файлу.
- Текст, цены и UI-подписи внутри картинок.
- Скриншоты клиентов под видом кейсов; снятая подпись «Демонстрационный проект».
- Файлы в `public/images` без записи в реестре.

## Связанные манифесты

- `hero.md` — правая колонка главного экрана. Сейчас там написано «Только SVG и CSS, без тяжёлых изображений»; hero-картинка это правило меняет, `hero.md` надо обновить вместе с кодом.
- `portfolio.md`, `portfolio-articles.md` — «картинок у кейсов нет» больше не верно после подключения иллюстраций портфолио.
- `service-card.md`, `card.md` — описывают иконку, не изображение; решение о картинке в карточке услуги принимается там.
- `tokens.md` — цвета для затемнения. Файл токенов на самом деле `frontend/src/app/globals.css` (в манифесте указан несуществующий `src/styles/tokens.css`, а токена `--c-bg-2` нет — есть `--c-surface-2`).
- `seo-panel.md` — поле OG image есть, но OG-картинка сейчас нигде не отдаётся; внешний вид этой задачи не решает.
- `uploads.md` — загруженные файлы (`/api/v1/public/files/{stored_name}`) не заменяют набор из `public/images`.

## Как пользоваться материалами целиком (разбор доски, 25.11.2026)

Исходная доска `reference/visual-assets-board.webp` разобрана вижном — вот её состав и куда что идёт:

| Блок на доске | Куда на сайте |
|---|---|
| `hero-main` — ноутбук с дашбордом | Hero, правая колонка (сделано) |
| 6 карточек услуг (бот, ИИ, база знаний, автоматизация, парсеры, интеграции) | ServiceCard (сделано) |
| `about-me` — рабочее место с кодом | /about/ (сделано) |
| `portfolio` — 3D-дашборд, `growth` — город со стрелкой роста | /portfolio/ (сделано) |
| `services-icons` — 6 линейных иконок | `Icon` (SVG), манифест `icons.md` (сделано) |
| `advantages-icons` — 5 неоновых плашек | `Icon` в FeatureCard (сделано) |
| `integrations` — схема «облако ↔ 1С/CRM/БД» | инфографика ProcessFlow / будущая схема интеграций |
| `bg-tech-1` (микросхемы), `bg-tech-2` (соты) | подложки технических секций (Hero, «Как решаются задачи») |
| `bg-earth` (цифровой глобус), `bg-wave` (неоновые волны) | фоны секций и CTA-блоков |
| `mobile-telegram`, `servers` | иллюстрации мобильных решений и инфраструктуры (задел) |
| `Структура папок` — дерево проекта | внутренние документы, на сайт не идёт |

Ограничение: доска — эскиз на тёмном фоне, не макет. Текст с неё не переносится (правила HTML-текста
из README пакета), картинки не режутся, пиктограммы рисуются SVG.

## Сборка образа (иначе картинки не отдаются)

`frontend/Dockerfile` объявляет `ARG BASE_PATH=/alyaev`. Если собрать образ без `--build-arg`,
в роуты попадает префикс `/alyaev`, и сайт в корне домена отдаёт 404 — включая `/images/**`.

```
docker build -t alyaev-it-frontend:latest \
  --build-arg BASE_PATH= --build-arg SITE_URL=https://alyaev.ru \
  -f frontend/Dockerfile frontend
```

Проверка после пересборки: `docker exec alyaev-web sh -c "head -c 200 /app/.next/routes-manifest.json"`
должен показать `"basePath": ""`. Затем на самом домене: `curl -sI https://alyaev.ru/images/hero/hero-visual.webp` → 200.

## PERSONAL v2.0 — что изменилось 25.11.2026

| Было | Стало |
|---|---|
| `hero/hero-visual.webp` на первом экране | снята; первый экран — текст + схема конвейера (`HeroSchema` в `Hero.tsx`) |
| `services/*.webp` в карточках услуг (одна картинка на несколько услуг) | **уникальные SVG-сцены** `PersonalServiceVisual`, 6 типов, без повторов |
| `Section backdrop` (bgCircuitBlue и др.) под каждой секцией | удалён из компонента; фон секции — только токен цвета |
| `about/about-workspace.webp` на «Обо мне» | заменена утверждённым портретом `ownerPortrait` (`about/dmitry-alyaev-about.webp`, 1086×1448) |

Правила, которые теперь действуют:

1. Растровые иллюстрации услуг и фонов секций на сайте не используются — их место занимает SVG-инфографика.
2. Портрет владельца — единственная обязательная фотография. Файл кладётся как есть.
3. Внутри изображений нет текста, цен и подписей интерфейса.
4. Новые файлы в `public/images/` без записи в реестре `images.ts` — дефект.

Записи реестра `heroVisual`, `telegramBot`, `aiAssistant`, фоны `bg*` не удалены (на них ссылаются манифесты),
но в компонентах больше не вызываются.
