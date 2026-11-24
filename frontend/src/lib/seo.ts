/** Единый источник адресов для canonical, OG и sitemap. */

const SITE_URL = (process.env.SITE_URL ?? "https://alyaev.it").replace(/\/$/, "");
const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";

/** Канонический адрес страницы: домен + basePath + путь со слэшем. */
export function canonicalUrl(path: string): string {
  const clean = path === "/" ? "/" : path.replace(/\/+$/, "") + "/";
  return SITE_URL + BASE_PATH + clean;
}

/** Базовый адрес сайта с префиксом, без слэша на конце. */
export function siteBase(): string {
  return SITE_URL + BASE_PATH;
}

/** Open Graph и Twitter-карточка для страницы. */
export function openGraph(input: {
  title: string;
  description: string;
  path: string;
}): Record<string, unknown> {
  return {
    title: input.title,
    description: input.description,
    url: canonicalUrl(input.path),
    siteName: "Дмитрий Аляев",
    locale: "ru_RU",
    type: "website",
  };
}