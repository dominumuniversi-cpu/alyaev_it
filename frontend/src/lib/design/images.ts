/**
 * Реестр графических материалов сайта — единственный источник путей к изображениям.
 *
 * Правила:
 *  - компоненты не пишут путь к картинке руками, а берут его отсюда;
 *  - размеры (width/height) сняты через sharp и обязательны для next/image
 *    (в проекте images.unoptimized = true, поэтому ширина/высота нужны явно);
 *  - навигационные документы: docs/manifests/ui/images.md (что где применяется),
 *    docs/manifests/ui/hero.md, service-card.md, about.md, portfolio.md.
 */

export type ImageCategory = "hero" | "service" | "about" | "portfolio" | "background" | "telegram" | "icon" | "reference";

export interface SiteImage {
  /** Путь от корня сайта, без BASE_PATH (его добавляет withBase / фоновая обёртка). */
  src: string;
  width: number;
  height: number;
  /** Русский alt по смыслу, не «картинка». Для декоративного фона не используется. */
  alt: string;
  category: ImageCategory;
}

const BASE = "/images";

/** Утверждённый портрет Дмитрия Аляева (PERSONAL v2.0). Менять файл без разрешения владельца нельзя. */
export const ownerPortrait: SiteImage = { src: BASE + "/about/dmitry-alyaev-about.webp", width: 1086, height: 1448, alt: "Дмитрий Аляев — IT-специалист, автоматизация бизнеса и AI-разработка", category: "about" };
/** Панель автоматизации: бот принимает заявку и передаёт результат */
export const heroVisual: SiteImage = { src: BASE + "/hero/hero-visual.webp", width: 340, height: 300, alt: "Панель автоматизации: бот принимает заявку и передаёт результат", category: "hero" };
/** Telegram-бот для бизнеса: приём заявок в мессенджере */
export const telegramBot: SiteImage = { src: BASE + "/services/telegram-bot.webp", width: 276, height: 220, alt: "Telegram-бот для бизнеса: приём заявок в мессенджере", category: "service" };
/** ИИ-консультант: ответы клиентам в диалоге */
export const aiAssistant: SiteImage = { src: BASE + "/services/ai-assistant.webp", width: 271, height: 220, alt: "ИИ-консультант: ответы клиентам в диалоге", category: "service" };
/** База знаний в боте: ответы по материалам компании */
export const knowledgeBase: SiteImage = { src: BASE + "/services/knowledge-base.webp", width: 263, height: 220, alt: "База знаний в боте: ответы по материалам компании", category: "service" };
/** Автоматизация процессов: сценарии без ручной работы */
export const automation: SiteImage = { src: BASE + "/services/automation.webp", width: 276, height: 160, alt: "Автоматизация процессов: сценарии без ручной работы", category: "service" };
/** Парсеры сайтов: сбор и разбор данных */
export const parsers: SiteImage = { src: BASE + "/services/parsers.webp", width: 271, height: 160, alt: "Парсеры сайтов: сбор и разбор данных", category: "service" };
/** Интеграции: связка сервисов и API в один контур */
export const integrations: SiteImage = { src: BASE + "/services/integrations.webp", width: 263, height: 160, alt: "Интеграции: связка сервисов и API в один контур", category: "service" };
/** Рабочее место разработки: схема проекта и код */
export const aboutWorkspace: SiteImage = { src: BASE + "/about/about-workspace.webp", width: 328, height: 175, alt: "Рабочее место разработки: схема проекта и код", category: "about" };
/** Демонстрационный проект: дашборд с аналитикой */
export const portfolioDashboard: SiteImage = { src: BASE + "/portfolio/portfolio-dashboard.webp", width: 299, height: 175, alt: "Демонстрационный проект: дашборд с аналитикой", category: "portfolio" };
/** Демонстрационный проект: рост показателей бизнеса */
export const portfolioGrowth: SiteImage = { src: BASE + "/portfolio/business-growth.webp", width: 315, height: 175, alt: "Демонстрационный проект: рост показателей бизнеса", category: "portfolio" };
/** Декоративный фон: синяя печатная плата */
export const bgCircuitBlue: SiteImage = { src: BASE + "/backgrounds/bg-circuit-blue.webp", width: 231, height: 230, alt: "Декоративный фон: синяя печатная плата", category: "background" };
/** Декоративный фон: золотые контуры платы */
export const bgCircuitGold: SiteImage = { src: BASE + "/backgrounds/bg-circuit-gold.webp", width: 239, height: 230, alt: "Декоративный фон: золотые контуры платы", category: "background" };
/** Декоративный фон: сеть связей над планетой */
export const bgEarthNetwork: SiteImage = { src: BASE + "/backgrounds/bg-earth-network.webp", width: 229, height: 230, alt: "Декоративный фон: сеть связей над планетой", category: "background" };
/** Декоративный фон: волна из линий */
export const bgWave: SiteImage = { src: BASE + "/backgrounds/bg-wave.webp", width: 258, height: 230, alt: "Декоративный фон: волна из линий", category: "background" };
/** Декоративный фон: серверные стойки */
export const bgServerRacks: SiteImage = { src: BASE + "/backgrounds/server-racks.webp", width: 225, height: 230, alt: "Декоративный фон: серверные стойки", category: "background" };
/** Мобильный Telegram с ботом в диалоге */
export const mobileTelegram: SiteImage = { src: BASE + "/telegram/mobile-telegram.webp", width: 188, height: 230, alt: "Мобильный Telegram с ботом в диалоге", category: "telegram" };
/** Референсный лист иконок преимуществ */
export const advantagesIconsSheet: SiteImage = { src: BASE + "/icons/advantages-icons-sheet.webp", width: 388, height: 175, alt: "Референсный лист иконок преимуществ", category: "icon" };
/** Референсный лист иконок услуг */
export const servicesIconsSheet: SiteImage = { src: BASE + "/icons/services-icons-sheet.webp", width: 263, height: 175, alt: "Референсный лист иконок услуг", category: "icon" };
/** Исходная визуальная доска — только для разработки */
export const visualAssetsBoard: SiteImage = { src: BASE + "/reference/visual-assets-board.webp", width: 1672, height: 941, alt: "Исходная визуальная доска — только для разработки", category: "reference" };

export const IMAGES = {
  ownerPortrait,
  heroVisual,
  telegramBot,
  aiAssistant,
  knowledgeBase,
  automation,
  parsers,
  integrations,
  aboutWorkspace,
  portfolioDashboard,
  portfolioGrowth,
  bgCircuitBlue,
  bgCircuitGold,
  bgEarthNetwork,
  bgWave,
  bgServerRacks,
  mobileTelegram,
  advantagesIconsSheet,
  servicesIconsSheet,
  visualAssetsBoard,
} as const;

/** Все изображения услуг (кроме референсных листов и исходной доски). */
export const SERVICE_IMAGES: readonly SiteImage[] = [telegramBot, aiAssistant, knowledgeBase, automation, parsers, integrations];

/** Соответствие slug услуги из БД (GET /api/v1/public/services) картинке. */
const SERVICE_BY_SLUG: Record<string, SiteImage> = {
  "telegram-bot-for-business": telegramBot,
  "ai-consultant-bot": aiAssistant,
  "knowledge-base-bot": knowledgeBase,
  "bot-repair": telegramBot,
  "service-link": integrations,
  "process-automation": automation,
  "ai-digest": aiAssistant,
  "site-parser": parsers,
  "api-integration": integrations,
  "1c-integration": integrations,
};

/** Запасной вариант, если slug не заведён в БД (категория услуги). */
const SERVICE_BY_CATEGORY: Record<string, SiteImage> = {
  "telegram-bots": telegramBot,
  automation: automation,
  parsers: parsers,
  integrations: integrations,
  websites: integrations,
};

const SERVICE_DEFAULT: SiteImage = integrations;

/** Картинка карточки услуги: сначала по slug, затем по категории, затем общая. */
export function imageForService(slug?: string | null, category?: string | null): SiteImage {
  if (slug && SERVICE_BY_SLUG[slug]) return SERVICE_BY_SLUG[slug];
  if (category && SERVICE_BY_CATEGORY[category]) return SERVICE_BY_CATEGORY[category];
  return SERVICE_DEFAULT;
}

/** Картинка портфолио: сюжеты перебираются по кругу — карточки подряд показывают разные иллюстрации.
 *  В пуле намеренно только демонстрационные картинки проектов: чужое «рабочее место» в портфолио
 *  выдавалось бы за кейс клиента. */
export function imageForPortfolio(index: number): SiteImage {
  const pool = [portfolioDashboard, portfolioGrowth, automation];
  return pool[(index >= 0 ? index : 0) % pool.length];
}

/** Декоративные фоны — только через CSS background-image, всегда под оверлеем. */
export const DECORATIVE_BACKGROUNDS = { bgCircuitBlue, bgCircuitGold, bgEarthNetwork, bgWave, bgServerRacks } as const;

export type DecorativeBackgroundName = keyof typeof DECORATIVE_BACKGROUNDS;

/**
 * Готовая CSS-строка url(...) для backgroundImage с учётом BASE_PATH.
 * Фон декоративный: aria-hidden на элементе-подложке и тёмный оверлей под текстом обязательны.
 */
export function decorativeBackground(name: DecorativeBackgroundName, basePath = ""): string {
  return `url("${basePath}${DECORATIVE_BACKGROUNDS[name].src}")`;
}

/** Проверка согласованности: возвращает записи, которые не должны попадать на прод. */
export function devOnlyImages(): SiteImage[] {
  return [advantagesIconsSheet, servicesIconsSheet, visualAssetsBoard];
}
