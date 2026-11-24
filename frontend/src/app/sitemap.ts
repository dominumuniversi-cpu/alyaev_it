/** sitemap.xml: только проиндексированные страницы с данными из БД. */

import type { MetadataRoute } from "next";

import { fetchArticles, fetchCategories, fetchPortfolio, fetchServices, fetchSolutions } from "@/lib/api";
import { siteBase } from "@/lib/seo";

const SITE = siteBase();

/** Дата правки из БД: карта сайта не должна врать поисковику сегодняшним числом. */
function lastmod(value: string | null | undefined): Date {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date();
}

const STATIC_PATHS = [
  "/",
  "/services/",
  "/contacts/",
  "/about/",
  "/portfolio/",
  "/blog/",
  "/calculator/",
  "/diagnostics/",
  "/privacy/",
  "/personal-data-consent/",
];

/** Карта сайта: статические страницы плюс опубликованные услуги. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, categories, articles, portfolio, solutions] = await Promise.all([
    fetchServices(),
    fetchCategories(),
    fetchArticles(),
    fetchPortfolio(),
    fetchSolutions(),
  ]);
  // Страницы категорий и алиасы из ТЗ, у которых есть услуги
  const categorySlugs = [
    ...categories.map((category) => category.slug),
    "ai-assistants",
    "knowledge-base",
  ];
  // Дата страницы категории — самая свежая правка среди входящих в неё услуг.
  const categoryLastmod = (slug: string): Date => {
    const own = services.filter((service) => service.category_slug === slug || service.slug === slug);
    const dates = own.map((service) => lastmod(service.updated_at).getTime()).concat(Date.now());
    return new Date(Math.max(...dates));
  };
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: SITE + (path === "/" ? "" : path.replace(/\/$/, "")),
    lastModified: new Date(),
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
  const serviceRoutes = services.map((service) => ({
    url: SITE + "/services/" + service.slug,
    lastModified: lastmod(service.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const categoryRoutes = categorySlugs.map((slug) => ({
    url: SITE + "/services/" + slug,
    lastModified: categoryLastmod(slug),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  // Статьи и кейсы появляются в карте только после публикации — их отдаёт публичный API.
  const articleRoutes = articles.map((article) => ({
    url: SITE + "/blog/" + article.slug,
    lastModified: lastmod(article.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  // Пустой каталог решений не попадает в карту: индексировать нечего.
  const solutionRoutes = solutions.length > 0
    ? [
        {
          url: SITE + "/solutions",
          lastModified: new Date(Math.max(...solutions.map((item) => lastmod(item.updated_at).getTime()))),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        ...solutions.map((item) => ({
          url: SITE + "/solutions/" + item.slug,
          lastModified: lastmod(item.updated_at),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        })),
      ]
    : [];
  const portfolioRoutes = portfolio.map((item) => ({
    url: SITE + "/portfolio/" + item.slug,
    lastModified: lastmod(item.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...articleRoutes, ...portfolioRoutes, ...solutionRoutes];
}
