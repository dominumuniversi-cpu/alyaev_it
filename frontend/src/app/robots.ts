/** robots.txt: индексируем публичное, закрываем служебное. */

import type { MetadataRoute } from "next";

import { siteBase } from "@/lib/seo";

const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";
const SITE = siteBase();

/** Правила индексации. Кабинет, вход и API закрыты. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [BASE_PATH + "/"],
        disallow: [
          BASE_PATH + "/account/",
          BASE_PATH + "/login/",
          BASE_PATH + "/register/",
          BASE_PATH + "/admin/",
          BASE_PATH + "/api/",
          BASE_PATH + "/search",
        ],
      },
    ],
    sitemap: SITE + "/sitemap.xml",
    host: SITE,
  };
}