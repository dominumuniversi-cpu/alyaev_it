/** Главная страница: hero, услуги, сценарий, преимущества, этапы, заявка. */

import { ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Section } from "@/components/ui/Section";
import { Hero } from "@/components/site/Hero";
import { ServiceCard } from "@/components/site/ServiceCard";
import { JsonLd, websiteSchema } from "@/components/seo/JsonLd";
import { fetchServices } from "@/lib/api";

const ADVANTAGES = [
  { title: "Понимание бизнес-процессов", text: "Сначала разбираю процесс, потом предлагаю решение — не наоборот." },
  { title: "Системный подход", text: "Автоматизация встраивается в существующие системы, а не живёт отдельно." },
  { title: "Интеграция с инфраструктурой", text: "Работа с 1С, CRM и внутренними сервисами через API." },
  { title: "Контроль качества", text: "Тестирование на реальных данных и обработка ошибок." },
  { title: "Документирование", text: "Инструкции и схема решения — чтобы система была понятна не только разработчику." },
  { title: "Возможность развития", text: "Архитектура рассчитана на добавление новых функций." },
];

const STAGES = [
  { marker: "01", title: "Заявка", text: "Вы описываете задачу в форме или в Telegram." },
  { marker: "02", title: "Обсуждение", text: "Уточняю процесс и ожидаемый результат." },
  { marker: "03", title: "Анализ", text: "Смотрю, что уже есть и какие системы надо связать." },
  { marker: "04", title: "Оценка", text: "Согласуем стоимость и сроки до начала работ." },
  { marker: "05", title: "Разработка", text: "Делаю, тестирую на реальных данных, показываю результат." },
  { marker: "06", title: "Передача", text: "Отдаю решение с инструкциями и документацией." },
  { marker: "07", title: "Поддержка", text: "Остаюсь на связи для доработок и развития." },
];

const SCENARIO = [
  { title: "Клиент оставляет заявку", text: "Сайт, Telegram или форма обратной связи." },
  { title: "Система обрабатывает данные", text: "Проверка, классификация, при необходимости AI." },
  { title: "Информация передаётся", text: "CRM, таблица, 1С или другая система." },
  { title: "Ответственные получают уведомление", text: "Telegram или рабочая система." },
  { title: "Руководитель видит результат", text: "Статистика, отчётность и контроль." },
];

/** Собирает главную на сервере и берёт услуги из БД. */
export default async function HomePage() {
  const services = await fetchServices();

  return (
    <>
      <JsonLd
        data={websiteSchema(
          (process.env.SITE_URL ?? "https://alyaev.it") + (process.env.BASE_PATH ?? ""),
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <ServiceCard key={service.slug} service={service} />
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
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {SCENARIO.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-bg)] p-5">
              <p className="mb-2 font-[family-name:var(--font-display)] text-sm font-bold text-[color:var(--c-cyan)]">
                Шаг {index + 1}
              </p>
              <h3 className="mb-2 text-sm font-semibold leading-snug">{step.title}</h3>
              <p className="text-sm leading-relaxed text-[color:var(--c-text-muted)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="advantages" title="Почему со мной">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((item) => (
            <FeatureCard key={item.title} title={item.title} text={item.text} />
          ))}
        </div>
      </Section>

      <Section
        id="stages"
        surface
        title="Этапы работы"
        subtitle="От заявки до поддержки — понятный процесс без сюрпризов."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((stage) => (
            <FeatureCard
              key={stage.marker}
              marker={stage.marker}
              title={stage.title}
              text={stage.text}
            />
          ))}
        </div>
      </Section>

      <Section id="lead" title="Есть задача, которую можно автоматизировать?">
        <div className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-8">
          <p className="max-w-2xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
            Опишите, что сейчас приходится делать вручную. Предложу подходящее решение и предварительно оценю стоимость.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contacts/#lead" size="lg">
              Обсудить задачу
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}