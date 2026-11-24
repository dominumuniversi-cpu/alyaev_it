/** Обо мне: опыт, направления и подход. */

import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Обо мне и опыте",
  description:
    "Дмитрий Аляев — IT-специалист, разработчик решений для автоматизации бизнеса. В IT с 2007 года: корпоративные системы, инфраструктура, интеграции.",
  alternates: { canonical: canonicalUrl("/about/") },
  openGraph: {
    title: "Обо мне — Дмитрий Аляев",
    description: "IT-специалист и разработчик решений для автоматизации бизнеса. В IT с 2007 года.",
    url: canonicalUrl("/about/"),
    type: "profile",
  },
};

const FOCUS = [
  { title: "Telegram-боты", text: "Приём заявок, меню, уведомления, база клиентов." },
  { title: "AI-ассистенты", text: "Консультанты и поиск по документам с ссылками на источники." },
  { title: "Автоматизация процессов", text: "Рутинные шаги выполняет система, а не сотрудник." },
  { title: "Интеграции через API", text: "Связь CRM, 1С и внутренних сервисов без ручного переноса." },
  { title: "Парсеры и данные", text: "Сбор, очистка и дедупликация информации с сайтов." },
  { title: "SQL и Python", text: "Работа с данными и разработка серверной логики." },
  
  { title: "IT-инфраструктура", text: "Windows Server, MS SQL, IIS, сети, PowerShell." },
  { title: "LLM и AI-агенты", text: "Проектирование решений на современных языковых моделях." },
];

/** Страница об опыте: факты вместо лозунгов. */
export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Дмитрий Аляев",
          jobTitle: "IT-специалист, разработчик решений для автоматизации бизнеса",
          url: canonicalUrl("/about/"),
          knowsAbout: ["автоматизация бизнеса", "Telegram-боты", "AI-ассистенты", "API-интеграции", "Python", "SQL"],
        }}
      />
      <Section id="about"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Обо мне" }]} title="Обо мне и опыте">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-base leading-relaxed text-[color:var(--c-text)]">
              В IT с 2007 года. Работал с корпоративными информационными системами, IT-инфраструктурой,
              технической поддержкой, автоматизацией процессов и интеграцией программных решений.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--c-text-muted)]">
              Подход основан на понимании не только технической стороны задачи, но и бизнес-процессов,
              для которых создаётся решение. Сначала разбираюсь, как работает процесс и где теряется время,
              затем подбираю архитектуру, разрабатываю, тестирую и документирую.
            </p>
            <h2 className="mt-8 mb-3 text-lg font-semibold">Профессиональный опыт</h2>
            <p className="text-base leading-relaxed text-[color:var(--c-text-muted)]">
              Организация и сопровождение корпоративной IT-инфраструктуры, управление техническими специалистами,
              работа со сложными обращениями пользователей, взаимодействие с разработчиками и интеграторами.
            </p>
            <div className="mt-8">
              <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
            </div>
          </div>
          <aside className="rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
            <h2 className="mb-4 text-base font-semibold">Чем занимаюсь</h2>
            <ul className="space-y-2 text-sm text-[color:var(--c-text-muted)]">
              {[
                "Разработка и внедрение Telegram-ботов",
                "AI-ассистенты и системы работы с базами знаний",
                "Автоматизация бизнес-процессов",
                "Интеграция информационных систем через API",
                "Парсеры и инструменты обработки данных",
                "Проектирование решений на базе LLM и AI-агентов",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="text-[color:var(--c-gold)]">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section id="focus" surface title="Направления работы">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FOCUS.map((item) => (
            <FeatureCard key={item.title} title={item.title} text={item.text} />
          ))}
        </div>
      </Section>

      <Section id="mission" title="Мой подход">
        <p className="max-w-3xl text-base leading-relaxed text-[color:var(--c-text-muted)]">
          Не предлагаю автоматизацию ради автоматизации. Моя цель — создавать инструменты, которые решают
          конкретные задачи бизнеса. Технологии должны упрощать работу, а не создавать новые проблемы.
        </p>
      </Section>
    </>
  );
}
