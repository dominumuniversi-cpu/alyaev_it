/** Соответствие услуги её иллюстрации в пакете темы (PERSONAL v2.0).
 *
 *  Здесь остались только данные: какой услуге какой сюжет. Сами схемы рисует
 *  KitServiceVisual из пакета — собственные нарисованные сцены удалены 26.11.2026,
 *  чтобы на сайте не было двух конкурирующих наборов инфографики. */

type VisualType = "telegram" | "ai" | "knowledge" | "automation" | "parser" | "integration";

/** Соответствие slug услуги из БД визуалу. Неизвестный slug — по категории. */
const BY_SLUG: Record<string, VisualType> = {
  "telegram-bot-for-business": "telegram",
  "ai-consultant-bot": "ai",
  "knowledge-base-bot": "knowledge",
  "bot-repair": "telegram",
  "service-link": "integration",
  "process-automation": "automation",
  "ai-digest": "ai",
  "site-parser": "parser",
  "api-integration": "integration",
  "1c-integration": "integration",
};

const BY_CATEGORY: Record<string, VisualType> = {
  "telegram-bots": "telegram",
  automation: "automation",
  parsers: "parser",
  integrations: "integration",
  websites: "integration",
};

/** Какой визуал показать для услуги. */
export function visualTypeFor(slug?: string | null, category?: string | null): VisualType {
  if (slug && BY_SLUG[slug]) return BY_SLUG[slug];
  if (category && BY_CATEGORY[category]) return BY_CATEGORY[category];
  return "integration";
}
