/** Калькулятор предварительной стоимости. Манифест: docs/manifests/ui/calculator.md
 *  Цены приходят из базы, а не из кода (ТЗ 7.1). Если конфиг пуст — страница не публикуется. */

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Calculator } from "@/components/site/Calculator";
import { Section } from "@/components/ui/Section";
import { fetchCalculator } from "@/lib/api";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Калькулятор стоимости автоматизации",
  description:
    "Оцените стоимость автоматизации за минуту: выберите задачу, сложность и нужные функции. Расчёт ориентировочный, цены из прайса.",
  alternates: { canonical: canonicalUrl("/calculator/") },
};

/** Пустой конфиг = считать нечего, страницу не показываем. */
export default async function CalculatorPage() {
  const config = await fetchCalculator();
  if (config.services.length === 0 || config.complexity.length === 0) notFound();

  return (
    <Section
      headingLevel={1}
          flat
      id="calculator"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Калькулятор" }]}
      title="Предварительная оценка"
      subtitle="Выберите, что нужно, и отметьте функции. Сумма считается по актуальному прайсу."
    >
      <Calculator
        services={config.services}
        options={config.options}
        complexity={config.complexity}
      />
    </Section>
  );
}
