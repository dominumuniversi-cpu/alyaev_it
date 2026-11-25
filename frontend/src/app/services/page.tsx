/** Каталог услуг: все опубликованные услуги с ценами. */

import type { Metadata } from "next";

import { ServiceCard } from "@/components/site/ServiceCard";
import { Section } from "@/components/ui/Section";
import { fetchServices } from "@/lib/api";
import { canonicalUrl, openGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Услуги и цены",
  description:
    "Каталог услуг по автоматизации бизнеса: Telegram-боты, AI-ассистенты, парсеры, интеграции, сайты. Цены и сроки указаны для стартовой оценки.",
  alternates: { canonical: canonicalUrl("/services/") },
  openGraph: openGraph({
    title: "Услуги и цены — Дмитрий Аляев",
    description:
      "Каталог услуг по автоматизации бизнеса: Telegram-боты, AI-ассистенты, парсеры, интеграции, сайты.",
    path: "/services/",
    type: "website",
  }),
}

/** Все услуги, сгруппированные по категориям. */
export default async function ServicesPage() {
  const services = await fetchServices();
  const groups = new Map<string, typeof services>();
  for (const service of services) {
    const key = service.category_title ?? "Прочее";
    const list = groups.get(key) ?? [];
    list.push(service);
    groups.set(key, list);
  }

  return (
    <Section
      headingLevel={1}
          flat
      id="services"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Услуги" }]}
      title="Услуги и цены"
      subtitle="Цены стартовые: итоговая стоимость определяется после анализа задачи и согласования ТЗ."
    >
      <div className="space-y-12">
        {[...groups.entries()].map(([title, items]) => (
          <div key={title}>
            <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold">{title}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => (
                <ServiceCard key={service.slug} service={service} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}