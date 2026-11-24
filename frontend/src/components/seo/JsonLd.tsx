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