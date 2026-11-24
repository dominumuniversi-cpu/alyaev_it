/** Единый источник адресов для canonical, OG и sitemap. */

// Адрес сайта берётся из окружения. Пока домена нет, это адрес стенда,
// поэтому сайт не публикует ссылок на несуществующий домен.
import { SITE_NAME, SITE_OG_LOCALE } from "@/lib/locale";

const SITE_URL = (process.env.SITE_URL ?? "http://localhost").replace(/\/$/, "");
const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";

/** Канонический адрес страницы: адрес сайта + basePath + путь со слэшем. */
export function canonicalUrl(path: string): string {
  const clean = path === "/" ? "/" : path.replace(/\/+$/, "") + "/";
  return SITE_URL + BASE_PATH + clean;
}

/** Базовый адрес сайта с префиксом, без слэша на конце. */
export function siteBase(): string {
  return SITE_URL + BASE_PATH;
}

/** Open Graph для страницы.
 *
 *  Next.js заменяет корневой openGraph целиком, а не дополняет его.
 *  Из-за этого страница со своим openGraph теряла locale и siteName --
 *  поля, которые нужны каждой странице и никто не обязан помнить про них.
 *  Поэтому строим объект здесь, а страница передаёт только своё.
 */
export function openGraph(input: {
  /** Заголовок и описание могут отсутствовать: у статьи без анонса description пуст. */
  title: string | undefined;
  description: string | undefined;
  path: string;
  /** og:type: website для обычных страниц, article для статей, profile для «Обо мне». */
  type?: string;
  /** Путь к картинке для соцсетей, если у страницы она есть. */
  image?: string;
  /** Особые поля страницы: publishedTime у статей и подобное. */
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    url: canonicalUrl(input.path),
    siteName: SITE_NAME,
    locale: SITE_OG_LOCALE,
    type: input.type ?? "website",
  };
  if (input.image) result.images = [{ url: input.image }];
  if (input.extra) Object.assign(result, input.extra);
  return result;
}
