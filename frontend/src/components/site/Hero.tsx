/** Главный экран. Манифест: docs/manifests/ui/hero.md */

import { ButtonLink } from "@/components/ui/Button";

const DIRECTIONS = ["Telegram-боты", "AI-ассистенты", "CRM", "API", "Парсеры", "Сайты"];
const POINTS = [
  "Проекты под ключ",
  "Индивидуальная оценка задач",
  "Поддержка и развитие решений",
];

/** Первый экран: позиционирование, направления и два действия. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-[color:var(--c-border)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 75% 20%, rgba(34,184,230,.16), transparent 70%), radial-gradient(45% 40% at 10% 0%, rgba(227,188,122,.10), transparent 70%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8 lg:py-24">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--c-gold)]">
            Автоматизация бизнеса и AI-разработка
          </p>
          <h1
            id="hero-title"
            className="font-[family-name:var(--font-display)] text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-[3.25rem]"
          >
            Цифровые решения, которые убирают ручную работу
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[color:var(--c-text-muted)] sm:text-lg">
            Разрабатываю и внедряю автоматизацию: от Telegram-ботов и интеграций до AI-ассистентов и обработки данных. Решение под ваш процесс, а не набор программ.
          </p>
          <p className="mt-5 text-sm text-[color:var(--c-text-muted)]">{DIRECTIONS.join(" · ")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contacts/#lead" size="lg">
              Обсудить проект
            </ButtonLink>
            <ButtonLink href="/services/" variant="secondary" size="lg">
              Посмотреть услуги
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--c-text-muted)]">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden="true" className="text-[color:var(--c-cyan)]">
                  ✔
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <HeroScene />
      </div>
    </section>
  );
}

const SCENE = [
  { label: "Заявка", text: "Сайт или Telegram", tone: "var(--c-cyan)" },
  { label: "Обработка", text: "Проверка и классификация", tone: "var(--c-gold)" },
  { label: "Результат", text: "CRM, таблица, уведомление", tone: "var(--c-cyan)" },
];

/** Схема обработки заявки: три панели со стрелками. Только CSS, без изображений. */
function HeroScene() {
  return (
    <div className="relative rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)]/70 p-5 backdrop-blur">
      <p className="mb-4 text-xs uppercase tracking-widest text-[color:var(--c-text-muted)]">
        Как работает автоматизация
      </p>
      <ol className="space-y-3">
        {SCENE.map((step, index) => (
          <li
            key={step.label}
            className="rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)] p-4"
            style={{ borderLeft: "3px solid " + step.tone }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{step.label}</span>
              <span className="text-xs text-[color:var(--c-text-muted)]">Шаг {index + 1}</span>
            </div>
            <p className="mt-1 text-sm text-[color:var(--c-text-muted)]">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}