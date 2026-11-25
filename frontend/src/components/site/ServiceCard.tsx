/** Карточка услуги. Манифест: docs/manifests/ui/service-card.md */

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { formatPrice, type ServiceCard as ServiceCardData } from "@/lib/api";
import { imageForService } from "@/lib/design/images";

/** Карточка услуги: иллюстрация, категория, название, описание, примеры, цена и срок. */
/**
 * Картинка берётся из реестра по slug (запасной вариант — по категории),
 * поэтому в разметке нет ни одного ручного пути. Манифест: docs/manifests/ui/images.md
 */
export function ServiceCard({ service }: { service: ServiceCardData }) {
  const image = imageForService(service.slug, service.category_slug);
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6 transition-all duration-150 hover:-translate-y-0.5 hover:border-[color:rgba(227,188,122,.4)]">
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
        className="mb-4 h-auto w-full max-w-[276px] rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] object-contain"
      />
      {service.category_title ? (
        <div className="mb-4">
          <Badge variant="tech">{service.category_title}</Badge>
        </div>
      ) : null}
      <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold leading-snug">
        <Link
          href={"/services/" + service.slug + "/"}
          className="no-underline after:absolute after:inset-0 after:content-[''] hover:text-[color:var(--c-gold)]"
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
              <span aria-hidden="true" className="text-[color:var(--c-gold)]">
                —
              </span>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <Badge variant="price">{formatPrice(service)}</Badge>
        {service.duration_text ? <Badge variant="muted">{service.duration_text}</Badge> : null}
      </div>
    </article>
  );
}