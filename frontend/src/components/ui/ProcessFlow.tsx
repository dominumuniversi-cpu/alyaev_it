import type { ProcessStep } from "@/lib/design/process";

/**
 * Конвейер шагов: на десктопе — в строку со стрелками, на мобильном — вертикально.
 * Номера и стрелки декоративные (aria-hidden): смысл несут заголовки карточек.
 */
export function ProcessFlow({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="relative rounded-2xl border border-[color:var(--c-line)] bg-[color:var(--c-paper)]/80 p-5 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--c-terra-ink)] bg-[color:var(--c-paper)] font-[family-name:var(--font-display)] text-xs font-bold text-[color:var(--c-terra-ink)]"
          >
            {index + 1}
          </span>
          <h3 className="mt-2 mb-2 text-sm font-semibold leading-snug">
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed text-[color:var(--c-muted)]">
            {step.text}
          </p>
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 top-1/2 hidden text-lg text-[color:var(--c-terra-ink)]/70 lg:block"
            >
              {"\u2192"}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
