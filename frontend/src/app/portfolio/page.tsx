/** Портфолио: демонстрационные проекты с честным статусом. */

import type { Metadata } from "next";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Проекты и решения",
  description:
    "Демонстрационные проекты по автоматизации: AI-консультант, поиск по документам, автоматизация заявок, парсеры и интеграции. С описанием архитектуры.",
  alternates: { canonical: canonicalUrl("/portfolio/") },
  openGraph: {
    title: "Проекты и решения — Дмитрий Аляев",
    description: "Демонстрационные проекты по автоматизации бизнеса: архитектура, технологии, результаты.",
    url: canonicalUrl("/portfolio/"),
    type: "website",
  },
};

/** Демонстрационные проекты. Статус указывается честно, показатели не выдумываются. */
const PROJECTS = [
  {
    title: "Telegram AI-консультант",
    problem: "Клиенты задают одни и те же вопросы, менеджер отвечает вручную.",
    solution: "Бот отвечает по материалам компании и передаёт сложные вопросы живому менеджеру.",
    stack: ["Telegram Bot API", "Python", "LLM"],
    status: "демонстрация",
  },
  {
    title: "AI-поиск по документам",
    problem: "Нужную информацию в регламентах и инструкциях долго искать вручную.",
    solution: "Поиск по смыслу с ответом и ссылкой на конкретный документ и страницу.",
    stack: ["RAG", "Python", "PostgreSQL", "LLM"],
    status: "демонстрация",
  },
  {
    title: "Автоматизация заявок",
    problem: "Заявки с сайта приходят на почту и теряются среди других писем.",
    solution: "Заявка сразу попадает в базу, в Telegram руководителю и в таблицу или CRM.",
    stack: ["FastAPI", "PostgreSQL", "Telegram Bot API"],
    status: "демонстрация",
  },
  {
    title: "Парсер данных",
    problem: "Нужно регулярно собирать данные с сайтов, а вручную это долго и с ошибками.",
    solution: "Сбор по расписанию, очистка, дедупликация и выгрузка в удобном формате.",
    stack: ["Python", "PostgreSQL"],
    status: "демонстрация",
  },
  {
    title: "Интеграция с 1С",
    problem: "Данные между сайтом и 1С переносятся вручную.",
    solution: "Обмен заказами и справочниками через API с логированием ошибок и повторными попытками.",
    stack: ["1С", "REST API", "Python"],
    status: "демонстрация",
  },
  {
    title: "AI-дайджест",
    problem: "Просматривать новости и отчёты по теме вручную занимает время каждый день.",
    solution: "Ежедневная автоматическая сводка с ключевыми пунктами в Telegram.",
    stack: ["Python", "LLM", "Telegram Bot API"],
    status: "демонстрация",
  },
];

/** Список кейсов: проблема, решение, стек, статус. */
export default function PortfolioPage() {
  return (
    <Section id="portfolio" title="Проекты и решения" subtitle="Демонстрационные проекты: как устроено решение и какие технологии использованы. Коммерческих внедрений с показателями здесь пока нет — процентные улучшения не придумываю.">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((project) => (
          <article key={project.title} className="flex h-full flex-col rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Badge variant="status">{project.status}</Badge>
            </div>
            <h2 className="mb-3 text-lg font-semibold leading-snug">{project.title}</h2>
            <p className="mb-2 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
              <span className="text-[color:var(--c-text)]">Проблема: </span>
              {project.problem}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-[color:var(--c-text-muted)]">
              <span className="text-[color:var(--c-text)]">Решение: </span>
              {project.solution}
            </p>
            <div className="mt-auto flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <Badge key={tech} variant="tech">{tech}</Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-6">
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
