/** Строка услуги на главной. Манифест: docs/manifests/ui/service-card.md (PERSONAL v2.0).
 *
 * Асимметричная композиция из пакета темы: слева название и описание, справа сцена.
 * Никаких одинаковых карточек в сетке — каждая строка услуги уникальна по сюжету.
 */

import Link from "next/link";

import { PersonalServiceVisual, visualTypeFor } from "@/components/site/PersonalServiceVisual";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, type ServiceCard as ServiceCardData } from "@/lib/api";

/** Строка услуги: номер, название, описание, примеры, цена и срок, сцена справа. */
export function ServiceRow({ service, index }: { service: ServiceCardData; index: number }) {
  const visualType = visualTypeFor(service.slug, service.category_slug);
  const number = String(index + 1).padStart(2, "0");
  return (
    <article data-service-card={service.slug} className="group relative grid gap-6 border-b border-[color:var(--c-line)] py-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-12">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--c-terracotta)]">
            {number}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.18em] text-[color:var(--c-text-muted)]">
            {service.category_title ?? "Услуга"}
          </span>
        </div>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-[clamp(22px,2.6vw,34px)] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-[color:var(--c-ink)]">
          <Link href={"/services/" + service.slug + "/"} className="no-underline after:absolute after:inset-0 after:content-[''] hover:text-[color:var(--c-terracotta)]">
            {service.title}
          </Link>
        </h3>
        <p className="mb-4 max-w-[52ch] text-base leading-relaxed text-[color:var(--c-text-muted)]">
          {service.short_description}
        </p>
        {service.examples.length > 0 ? (
          <ul className="mb-5 space-y-1.5 text-sm text-[color:var(--c-text-muted)]">
            {service.examples.slice(0, 3).map((example) => (
              <li key={example} className="flex gap-2">
                <span aria-hidden="true" className="text-[color:var(--c-terracotta)]">
                  —
                </span>
                <span>
                  {example}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="price">
            {formatPrice(service)}
          </Badge>
          {service.duration_text ? <Badge variant="muted">{service.duration_text}</Badge> : null}
        </div>
      </div>
      <div className="flex items-center justify-center border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] px-4 py-6">
        <PersonalServiceVisual type={visualType} className="h-[190px] w-auto" />
      </div>
    </article>
  );
}
