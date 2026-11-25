/**
 * Сюжеты портфолио: у каждого проекта СВОЯ техническая схема (SVG),
 * чтобы не было двух одинаковых картинок на странице (правило AGENTS.md #3).
 *
 * Это инфографика, а не скриншот: показана структура решения (компоненты и связи).
 * Демо-проекты этот блок обозначает честно: подпись «демо» ставит страница.
 */

export type PortfolioVisual = "dialog" | "search" | "pipeline" | "extract" | "sync" | "digest" | "generic";

/** Сюжет по slug проекта; для новых кейсов из админки — общая схема. */
export function portfolioVisualFor(slug: string): PortfolioVisual {
  const map: Record<string, PortfolioVisual> = {
    "telegram-ai-consultant": "dialog",
    "ai-document-search": "search",
    "lead-automation": "pipeline",
    "data-parser": "extract",
    "1c-integration": "sync",
    "ai-digest": "digest",
  };
  return map[slug] ?? "generic";
}

/** Порядковый номер схемы для подписи (01, 02, ...). */
export function visualNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}
