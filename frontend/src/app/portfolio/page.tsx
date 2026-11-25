/** Портфолио: демонстрационные проекты с честным статусом. */

import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import type { PortfolioCard } from "@/lib/api";
import { fetchPortfolio, PORTFOLIO_STATUS_LABELS } from "@/lib/api";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl, openGraph } from "@/lib/seo";
import { PortfolioVisual } from "@/components/site/PortfolioVisual";
import { portfolioVisualFor, visualNumber } from "@/lib/design/portfolio";

export const metadata: Metadata = {
  title: "Проекты и решения",
  description:
    "Демонстрационные проекты по автоматизации: AI-консультант, поиск по документам, автоматизация заявок, парсеры и интеграции. С описанием архитектуры.",
  alternates: { canonical: canonicalUrl("/portfolio/") },
  openGraph: openGraph({
    title: "Проекты и решения — Дмитрий Аляев",
    description: "Демонстрационные проекты по автоматизации бизнеса: архитектура, технологии, результаты.",
    path: "/portfolio/",
    type: "website",
  }),
}

/** Демонстрационные проекты. Статус указывается честно, показатели не выдумываются. */
const FALLBACK_PROJECTS: PortfolioCard[] = [
  {
    slug: "telegram-ai-consultant",
    title: "Telegram AI-консультант",
    summary:
      "Клиенты задают одни и те же вопросы, менеджер отвечает вручную. Бот отвечает по материалам компании и передаёт сложные вопросы живому менеджеру.",
    technologies: ["Telegram Bot API", "Python", "LLM"],
    status: "demo",
    updated_at: null,
  },
  {
    slug: "ai-document-search",
    title: "AI-поиск по документам",
    summary:
      "Нужную информацию в регламентах и инструкциях долго искать вручную. Поиск по смыслу с ответом и ссылкой на конкретный документ и страницу.",
    technologies: ["RAG", "Python", "PostgreSQL", "LLM"],
    status: "demo",
    updated_at: null,
  },
  {
    slug: "lead-automation",
    title: "Автоматизация заявок",
    summary:
      "Заявки с сайта приходят на почту и теряются среди других писем. Заявка сразу попадает в базу, в Telegram руководителю и в таблицу или CRM.",
    technologies: ["FastAPI", "PostgreSQL", "Telegram Bot API"],
    status: "demo",
    updated_at: null,
  },
  {
    slug: "data-parser",
    title: "Парсер данных",
    summary:
      "Нужно регулярно собирать данные с сайтов, а вручную это долго и с ошибками. Сбор по расписанию, очистка, дедупликация и выгрузка в удобном формате.",
    technologies: ["Python", "PostgreSQL"],
    status: "demo",
    updated_at: null,
  },
  {
    slug: "1c-integration",
    title: "Интеграция с 1С",
    summary:
      "Данные между сайтом и 1С переносятся вручную. Обмен заказами и справочниками через API с логированием ошибок и повторными попытками.",
    technologies: ["1С", "REST API", "Python"],
    status: "demo",
    updated_at: null,
  },
  {
    slug: "ai-digest",
    title: "AI-дайджест",
    summary:
      "Просматривать новости и отчёты по теме вручную занимает время каждый день. Ежедневная автоматическая сводка с ключевыми пунктами в Telegram.",
    technologies: ["Python", "LLM", "Telegram Bot API"],
    status: "demo",
    updated_at: null,
  },
];

/** Список кейсов: проблема, решение, стек, статус. */
export default async function PortfolioPage() {
  // Кейсы из админки; пока их нет — показываем встроенный набор демонстраций.
  const fromDb = await fetchPortfolio();
  const items: PortfolioCard[] = fromDb.length > 0 ? fromDb : FALLBACK_PROJECTS;

  return (
    <Section
      headingLevel={1}
          flat
      id="portfolio"
      breadcrumbs={[{ label: "Главная", href: "/" }, { label: "Портфолио" }]} title="Проекты и решения" subtitle="Демонстрационные проекты: как устроено решение и какие технологии использованы. Коммерческих внедрений с показателями здесь пока нет — процентные улучшения не придумываю.">
      <div className="grid gap-px border border-[color:var(--c-line)] bg-[color:var(--c-line)] sm:grid-cols-2">
        {items.map((project, index) => (
          <article key={project.slug} className="flex h-full flex-col bg-[color:var(--c-paper-2)] p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[color:var(--c-muted)]">
                {visualNumber(index)} / PROJECT
              </span>
              <Badge variant="status">
                {PORTFOLIO_STATUS_LABELS[project.status] ?? project.status}
              </Badge>
            </div>
            <div className="mb-5 border border-[color:var(--c-line)]">
              <PortfolioVisual type={portfolioVisualFor(project.slug)} />
            </div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl font-bold uppercase leading-tight tracking-[-0.01em]">
              <Link href={"/portfolio/" + project.slug + "/"} className="text-[color:var(--c-ink)] no-underline hover:text-[color:var(--c-terracotta)]">
                {project.title}
              </Link>
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
              {project.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="tech">
                  {tech}
                </Badge>
              ))}
            </div>
            <div className="mt-auto pt-5">
              <Link href={"/portfolio/" + project.slug + "/"} className="text-sm font-semibold text-[color:var(--c-terracotta)] no-underline hover:underline">
                Как устроено решение →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-[var(--space-section)] border-t border-[color:var(--c-line)] pt-8">
        <p className="text-sm text-[color:var(--c-text-muted)]">
          Такие решения собираются под конкретный процесс. Если задача похожа на одну из них — обсудим,
          что именно нужно в вашем случае.
        </p>
        <div className="mt-4">
          <ButtonLink href="/contacts/#lead">Обсудить задачу</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
