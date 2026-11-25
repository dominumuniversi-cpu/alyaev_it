/** Главная страница: hero, услуги, сценарий, преимущества, этапы, заявка. */

import { ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import type { IconName } from "@/components/ui/Icon";
import { ProcessFlow } from "@/components/ui/ProcessFlow";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/site/Hero";
import { ServiceRow } from "@/components/site/ServiceRow";
import { JsonLd, websiteSchema } from "@/components/seo/JsonLd";
import { fetchServices } from "@/lib/api";
import { LeadForm } from "@/components/site/LeadForm";
import { canonicalUrl, siteBase } from "@/lib/seo";

/** Иконки преимуществ — по листу advantages-icons-sheet. */
const ADVANTAGES = [
  { icon: "shield", title: "Понимание бизнес-процессов", text: "Сначала разбираю процесс, потом предлагаю решение — не наоборот." },
  { icon: "handshake", title: "Системный подход", text: "Автоматизация встраивается в существующие системы, а не живёт отдельно." },
  { icon: "headset", title: "Интеграция с инфраструктурой", text: "Работа с 1С, CRM и внутренними сервисами через API." },
  { icon: "bolt", title: "Контроль качества", text: "Тестирование на реальных данных и обработка ошибок." },
  { icon: "cloud-up", title: "Документирование", text: "Инструкции и схема решения — чтобы система была понятна не только разработчику." },
  { icon: "gear", title: "Возможность развития", text: "Архитектура рассчитана на добавление новых функций." },
];

const STAGES = [
  { marker: "01", title: "Заявка", text: "Вы описываете задачу в форме или в Telegram." },
  { marker: "02", title: "Обсуждение", text: "Уточняю процесс и ожидаемый результат." },
  { marker: "03", title: "Анализ", text: "Смотрю, что уже есть и какие системы надо связать." },
  { marker: "04", title: "Оценка", text: "Согласуем стоимость и сроки до начала работ." },
  { marker: "05", title: "Разработка", text: "Делаю, тестирую на реальных данных, показываю результат." },
];

const SCENARIO = [
  { title: "Клиент оставляет заявку", text: "Сайт, Telegram или форма обратной связи." },
  { title: "Система обрабатывает данные", text: "Проверка, классификация, при необходимости AI." },
  { title: "Информация передаётся", text: "CRM, таблица, 1С или другая система." },
  { title: "Ответственные получают уведомление", text: "Telegram или рабочая система." },
  { title: "Руководитель видит результат", text: "Статистика, отчётность и контроль." },
];

export const metadata = {
  alternates: { canonical: canonicalUrl("/") },
};

/** Собирает главную на сервере и берёт услуги из БД. */
export default async function HomePage() {
  const services = await fetchServices();
  const taskOptions = services.map((service) => ({ value: service.slug, label: service.title }));

  return (
    <>
      <JsonLd
        data={websiteSchema(
          siteBase(),
          "Дмитрий Аляев — автоматизация бизнеса и AI-разработка",
        )}
      />
      <Hero />

      <Section
        id="services"
        title="Услуги"
        subtitle="Понятные цены и сроки. Указанные цены являются стартовыми — итоговая стоимость определяется после анализа задачи."
      >
        {services.length > 0 ? (
          <div className="border-t border-[color:var(--c-line)]">
            {services.slice(0, 6).map((service, index) => (
              <ServiceRow key={service.slug} service={service} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-[color:var(--c-text-muted)]">Каталог услуг обновляется.</p>
        )}
        <div className="mt-8">
          <ButtonLink href="/services/" variant="secondary">
            Все услуги и цены
          </ButtonLink>
        </div>
      </Section>

      <Section
        id="scenario"
        surface
        title="Как решаются задачи"
        subtitle="Пример: автоматическая обработка заявки без постоянного участия сотрудника."
      >
        <ProcessFlow steps={SCENARIO} />
      </Section>

      <Section id="advantages" title="Почему со мной">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((item) => (
            <FeatureCard key={item.title} icon={item.icon as IconName} title={item.title} text={item.text} />
          ))}
        </div>
      </Section>

      <Section
        id="stages"
        surface
        title="Этапы работы"
        subtitle="От заявки до поддержки — понятный процесс без сюрпризов."
      >
        <ol className="grid gap-px border-y border-[color:var(--c-line)] bg-[color:var(--c-line)] sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <li key={stage.marker} className="flex flex-col gap-3 bg-[color:var(--c-paper-2)] p-5">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--c-terra-ink)]">
                {stage.marker}
              </span>
              <span className="font-[family-name:var(--font-display)] text-lg font-bold uppercase leading-tight tracking-[-0.01em] text-[color:var(--c-ink)]">
                {stage.title}
              </span>
              <span className="text-sm leading-relaxed text-[color:var(--c-muted)]">{stage.text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="lead" title="Есть задача, которую можно автоматизировать?">
        <div className="grid gap-8 rounded-[var(--radius-md)] border border-[color:var(--c-ink)] bg-[color:var(--c-lime)] p-6 text-[color:var(--c-lime-ink)] sm:p-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="text-base leading-relaxed text-[color:var(--c-text-muted)]">
              Опишите, что сейчас приходится делать вручную. Предложу подходящее решение и предварительно оценю стоимость.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[color:var(--c-text-muted)]">
              <li>— Отвечаю лично, без менеджеров-посредников.</li>
              <li>— Сначала разбираем процесс, потом оцениваем работу.</li>
              <li>— Не берусь за задачи, которые не принесут пользы.</li>
            </ul>
          </div>
          <LeadForm taskOptions={taskOptions} />
        </div>
      </Section>
    </>
  );
}