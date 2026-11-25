/** Карточка услуги. Манифест: docs/manifests/ui/service-card.md (PERSONAL v2.0)
 *
 *  Визуал услуги — уникальная SVG-сцена из PersonalServiceVisual:
 *  повторных 3D-иллюстраций (как в черновике дизайн-системы) на сайте не будет.
 */

import Link from "next/link";

import { PersonalServiceVisual, visualTypeFor } from "@/components/site/PersonalServiceVisual";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, type ServiceCard as ServiceCardData } from "@/lib/api";

/** Карточка услуги: визуал, категория, название, описание, примеры, цена и срок. */
export function ServiceCard({ service }: { service: ServiceCardData }) {
  const visualType = visualTypeFor(service.slug, service.category_slug);
  return (
    <article className="group relative flex h-full flex-col border border-[color:var(--c-border)] bg-[color:var(--c-paper-2)] transition-colors duration-150 hover:border-[color:var(--c-ink)]">
      <div className="flex items-center justify-between border-b border-[color:var(--c-border)] bg-[color:var(--c-paper)] px-4 py-2">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[color:var(--c-text-muted)]">
          {service.category_title ?? "Услуга"}
        </span>
        <span aria-hidden="true" className="h-1.5 w-1.5 bg-[color:var(--c-terracotta)]" />
      </div>
      <div className="flex items-center justify-center border-b border-[color:var(--c-border)] px-4 py-5">
        <PersonalServiceVisual type={visualType} className="h-[150px] w-auto" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-bold uppercase leading-tight tracking-[-0.01em] text-[color:var(--c-ink)]">
          <Link
            href={"/services/" + service.slug + "/"}
            className="no-underline after:absolute after:inset-0 after:content-[''] hover:text-[color:var(--c-terracotta)]"
          >
            {service.title}
          </Link>
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
          {service.short_description}
        </p>
        {service.examples.length > 0 ? (
          <ul className="mb-6 space-y-1.5 text-sm text-[color:var(--c-text-muted)]">
            {service.examples.slice(0, 3).map((example) => (
              <li key={example} className="flex gap-2">
                <span aria-hidden="true" className="text-[color:var(--c-terracotta)]">—</span>
                <span>{example}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Badge variant="price">{formatPrice(service)}</Badge>
          {service.duration_text ? <Badge variant="muted">{service.duration_text}</Badge> : null}
        </div>
      </div>
    </article>
  );
}
