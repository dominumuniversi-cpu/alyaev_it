/** Посадочная страница услуги: цена, сроки, состав, FAQ. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { JsonLd, serviceSchema } from "@/components/seo/JsonLd";
import { fetchService, formatPrice } from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

/** Метаданные услуги из БД; 404 если услуги нет. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await fetchService(slug);
  if (!service) return { title: "Услуга не найдена" };
  return {
    title: service.title,
    description: service.short_description,
    alternates: { canonical: "/services/" + service.slug },
  };
};

const List = ({ items, tone }: { items: string[]; tone: "plus" | "minus" }) =>
  items.length === 0 ? null : (
    <ul className="space-y-2 text-sm text-[color:var(--c-text-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span
            aria-hidden="true"
            className={tone === "plus" ? "text-[color:var(--c-success)]" : "text-[color:var(--c-danger)]"}
          >
            {tone === "plus" ? "✓" : "−"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

/** Карточка услуги с обязательным набором блоков из ТЗ. */
export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = await fetchService(slug);
  if (!service) notFound();

  return (
    <>
    <JsonLd
      data={serviceSchema({
        site: (process.env.SITE_URL ?? "https://alyaev.it") + (process.env.BASE_PATH ?? ""),
        name: service.title,
        description: service.short_description,
        priceFrom: service.price_on_request ? null : service.price_from,
      })}
    />
    <Section id="service" title={service.title} subtitle={service.short_description}>
      <div className="mb-8 flex flex-wrap gap-2">
        <Badge variant="price">{formatPrice(service)}</Badge>
        {service.duration_text ? <Badge variant="muted">Срок: {service.duration_text}</Badge> : null}
        {service.category_title ? <Badge variant="tech">{service.category_title}</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что входит в стоимость</h2>
          <List items={service.included} tone="plus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что не входит</h2>
          <List items={service.excluded} tone="minus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Что нужно от вас</h2>
          <List items={service.client_data} tone="plus" />
        </div>
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
          <h2 className="mb-3 text-base font-semibold">Возможные дополнительные расходы</h2>
          <List items={service.extra_costs} tone="minus" />
        </div>
      </div>

      {service.warranty_text ? (
        <p className="mt-6 text-sm text-[color:var(--c-text-muted)]">Гарантия: {service.warranty_text}</p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Указанная цена является стартовой. Итоговая стоимость определяется после анализа задачи и согласования технического задания.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
    </>
  );
}