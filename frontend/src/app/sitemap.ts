/** sitemap.xml: только проиндексированные страницы с данными из БД. */

import type { MetadataRoute } from "next";

import { fetchCategories, fetchServices } from "@/lib/api";
import { siteBase } from "@/lib/seo";

const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";
const SITE = siteBase();

const STATIC_PATHS = ["/", "/services/", "/contacts/", "/about/", "/portfolio/", "/blog/", "/privacy/", "/personal-data-consent/"];

/** Карта сайта: статические страницы плюс опубликованные услуги. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const services = await fetchServices();
  const categories = await fetchCategories();
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
  return [...staticRoutes, ...categoryRoutes, ...serviceRoutes];
}