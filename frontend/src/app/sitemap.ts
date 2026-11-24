/** sitemap.xml: только проиндексированные страницы с данными из БД. */

import type { MetadataRoute } from "next";

import { fetchArticles, fetchCategories, fetchPortfolio, fetchServices, fetchSolutions } from "@/lib/api";
import { siteBase } from "@/lib/seo";

const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";
const SITE = siteBase();

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
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: SITE + (path === "/" ? "" : path.replace(/\/$/, "")),
    lastModified: new Date(),
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
  const serviceRoutes = services.map((service) => ({
    url: SITE + "/services/" + service.slug,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
  const categoryRoutes = categorySlugs.map((slug) => ({
    url: SITE + "/services/" + slug,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  // Статьи и кейсы появляются в карте только после публикации — их отдаёт публичный API.
  const articleRoutes = articles.map((article) => ({
    url: SITE + "/blog/" + article.slug,
    lastModified: article.published_at ? new Date(article.published_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  // Пустой каталог решений не попадает в карту: индексировать нечего.
  const solutionRoutes = solutions.length > 0
    ? [
        {
          url: SITE + "/solutions",
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        ...solutions.map((item) => ({
          url: SITE + "/solutions/" + item.slug,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.7,
        })),
      ]
    : [];
  const portfolioRoutes = portfolio.map((item) => ({
    url: SITE + "/portfolio/" + item.slug,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...categoryRoutes, ...serviceRoutes, ...articleRoutes, ...portfolioRoutes, ...solutionRoutes];
}