/** Хлебные крошки: навигация вверх + разметка BreadcrumbList из того же массива.
 *  Манифест: docs/manifests/ui/breadcrumbs.md */

import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { siteBase } from "@/lib/seo";

export type Crumb = { label: string; href?: string };

/** Схема BreadcrumbList ровно по видимым крошкам. */
function breadcrumbSchema(items: Crumb[]): Record<string, unknown> {
  const site = siteBase();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: site + item.href } : {}),
    })),
  };
}

/** Крошки не показываем, если путь короче двух уровней: там они бессмысленны. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length < 2) return null;
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Хлебные крошки" className="mb-6">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--c-text-muted)]">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.label + index} className="flex items-center gap-2">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[color:var(--c-gold)]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={isLast ? "text-[color:var(--c-text)]" : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {isLast ? null : <span aria-hidden="true">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
