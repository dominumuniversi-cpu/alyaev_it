/** Главный экран. Манифест: docs/manifests/ui/hero.md (PERSONAL v2.0) */

import { ButtonLink } from "@/components/ui/Button";
import { DISPLAY_HERO, EYEBROW } from "@/lib/design/ui";
import { HeroArt } from "@/components/site/HeroArt";

const DIRECTIONS = ["CRM", "API", "1С", "Сайты", "Автоматизация"];
const POINTS = [
  "Проекты под ключ",
  "Индивидуальная оценка задач",
  "Поддержка и развитие решений",
];

const SCHEME = [
  { n: "01", label: "Заявка", text: "Сайт / Telegram", tone: "ink" },
  { n: "02", label: "Обработка", text: "Проверка, классификация, AI", tone: "lime" },
  { n: "03", label: "Результат", text: "CRM, таблица, уведомление", tone: "terra" },
] as const;

/** Первый экран: крупный заголовок на всю ширину, две CTA и техническая схема справа. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-[color:var(--c-line)]">
      <div className="mx-auto grid w-full max-w-[var(--shell-max)] gap-10 px-[var(--shell-gutter)] pb-[var(--space-section)] pt-10 lg:grid-cols-[1.25fr_.75fr] lg:items-end lg:gap-12 lg:pt-14">
        <div>
          <p className={EYEBROW + " mb-6 text-[11px] text-[color:var(--c-terra-ink)]"}>
            Автоматизация бизнеса / AI-разработка / системная интеграция
          </p>
          <h1
            id="hero-title"
            className={DISPLAY_HERO}
          >
            Сложные процессы.
            <br />
            <span className="mt-1 inline-block bg-[color:var(--c-lime)] px-3 pb-1 text-[color:var(--c-lime-ink)]">Понятные</span>
            <br />
            системы.
          </h1>
          <p className="mt-7 max-w-[42ch] text-lg leading-relaxed text-[color:var(--c-ink-2)] sm:text-xl">
            Проектирую и внедряю цифровые решения: AI-ассистентов, автоматизацию, интеграции и инструменты для работы с данными.
          </p>
          <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.16em] text-[color:var(--c-muted)]">
            {DIRECTIONS.join(" · ")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/contacts/#lead" size="lg">
              Обсудить проект ↗
            </ButtonLink>
            <ButtonLink href="/services/" variant="secondary" size="lg">
              Смотреть услуги
            </ButtonLink>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--c-muted)]">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-[color:var(--c-terra-ink)]">—</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <HeroArt />
          <HeroSchema />
        </div>
      </div>
    </section>
  );
}

/** Техническая схема вместо декоративной картинки: объясняет конвейер обработки. */
function HeroSchema() {
  return (
    <div className="border border-[color:var(--c-line-2)] on-dark:bg-[color:var(--c-ink-2)] bg-[color:var(--c-paper-2)]">
      <div className="flex items-center justify-between border-b border-[color:var(--c-line)] px-4 py-3">
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--c-muted)]">
          Схема обработки
        </span>
        <span aria-hidden="true" className="h-2 w-2 bg-[color:var(--c-lime)]" />
      </div>
      <ol className="divide-y divide-[color:var(--c-line)]">
        {SCHEME.map((step) => (
          <li key={step.n} className="flex items-center gap-4 px-4 py-5">
            <span
              className={
                "flex h-10 w-10 shrink-0 items-center justify-center font-[family-name:var(--font-mono)] text-sm font-bold " +
                (step.tone === "lime"
                  ? "bg-[color:var(--c-lime)] text-[color:var(--c-ink)]"
                  : step.tone === "terra"
                    ? "bg-[color:var(--c-terracotta)] text-[color:var(--c-ink)]"
                    : "bg-[color:var(--c-ink)] text-[color:var(--c-paper)]")
              }
            >
              {step.n}
            </span>
            <span>
              <span className="block text-sm font-semibold text-[color:var(--c-ink)]">{step.label}</span>
              <span className="block text-sm text-[color:var(--c-muted)]">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="border-t border-[color:var(--c-line)] px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[color:var(--c-muted)]">
        input → logic → automation
      </p>
    </div>
  );
}
