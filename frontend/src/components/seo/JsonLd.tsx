/** JSON-LD разметка страницы. Схемы без выдуманных рейтингов и отзывов. */

/** Вставляет структурированные данные в head. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Схема WebSite для главной. */
export function websiteSchema(site: string, name: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: site,
    inLanguage: "ru-RU",
  };
}

/** Схема Service для посадочной страницы услуги. */
/**
 * FAQPage для страниц услуг. Включается только когда вопросы действительно
 * показаны на странице — Google и Яндекс требуют совпадения разметки и текста.
 * Пустой или неполный список не размечаем: разметка без содержимого = обман.
 */
export function faqSchema(items: { q: string; a: string }[]): Record<string, unknown> | null {
  const clean = items.filter((i) => i.q.trim() && i.a.trim());
  if (clean.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: clean.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function serviceSchema(input: {
  site: string;
  name: string;
  description: string;
  priceFrom: number | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    provider: { "@type": "Person", name: "Дмитрий Аляев" },
  };
  if (input.priceFrom !== null) {
    base.offers = {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: input.priceFrom,
      description: "Стартовая цена, итоговая определяется после анализа задачи",
    };
  }
  return base;
}