"use client";

/** Калькулятор предварительной оценки. Манифест: docs/manifests/ui/calculator.md
 *  Расчёт повторяет серверную логику (app/core/calculator.py): округление вверх до 1000 ₽,
 *  минимум — базовая цена. Цифры в интерфейсе и в заявке обязаны совпадать. */

import { useEffect, useMemo, useRef, useState } from "react";

import { reachGoal } from "@/components/site/Analytics";

import { ButtonLink } from "@/components/ui/Button";

export type CalcService = { slug: string; title: string; price_from: number };
export type CalcOption = { slug: string; title: string; price_delta: number };
export type CalcComplexity = { slug: string; title: string; factor: number };

/** Округление вверх до 1000 ₽ — то же, что на сервере. */
function roundUp(value: number, step = 1000): number {
  if (value <= 0) return 0;
  return Math.ceil(value / step) * step;
}

/** Предварительная стоимость: (цена + опции) × коэффициент, но не ниже базовой цены. */
function estimate(base: number, deltas: number[], factor: number): number {
  const subtotal = base + deltas.reduce((sum, d) => sum + d, 0);
  return Math.max(roundUp(subtotal * factor), base);
}

/** Формат цены по-русски: 12 000 ₽. */
function formatPrice(value: number): string {
  return value.toLocaleString("ru-RU") + " ₽";
}

export function Calculator({
  services,
  options,
  complexity,
}: {
  services: CalcService[];
  options: CalcOption[];
  complexity: CalcComplexity[];
}) {
  const [serviceSlug, setServiceSlug] = useState(services[0].slug);
  const [complexitySlug, setComplexitySlug] = useState(complexity[0].slug);
  const [selected, setSelected] = useState<string[]>([]);

  const service = services.find((s) => s.slug === serviceSlug) ?? services[0];
  const factor = complexity.find((c) => c.slug === complexitySlug)?.factor ?? 1;

  // Цель считаем один раз за визит и только когда отмечена хотя бы одна функция:
  // иначе простое открытие страницы раздуло бы отчёт.
  const firedRef = useRef(false);
  useEffect(() => {
    if (selected.length > 0 && !firedRef.current) {
      firedRef.current = true;
      reachGoal("calculator_use");
    }
  }, [selected]);

  const total = useMemo(() => {
    const deltas = options.filter((o) => selected.includes(o.slug)).map((o) => o.price_delta);
    return estimate(service.price_from, deltas, factor);
  }, [service, options, selected, factor]);

  // Параметры расчёта уходят в форму заявки, чтобы владелец видел, что клиент насчитал.
  const leadHref =
    "/contacts/#lead?source=calculator" +
    "&service=" + encodeURIComponent(service.slug) +
    "&price=" + total +
    "&options=" + encodeURIComponent(selected.join(","));

  /** Переключает опцию: выбрано несколько или ноль. */
  function toggle(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        {/* Шаг 1: направление */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--c-lime-ink)]">
            1. Что нужно
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {services.map((item) => {
              const active = item.slug === serviceSlug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setServiceSlug(item.slug)}
                  aria-pressed={active}
                  className={"rounded-[var(--radius-md)] border p-3 text-left text-sm transition-colors " +
                    (active
                      ? "border-[color:var(--c-lime-ink)] bg-[rgba(227,188,122,0.08)] text-[color:var(--c-ink)]"
                      : "border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] text-[color:var(--c-muted)] hover:border-[color:var(--c-terra-ink)]")}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Шаг 2: сложность */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--c-lime-ink)]">
            2. Сложность
          </h3>
          <div className="flex flex-wrap gap-2">
            {complexity.map((item) => {
              const active = item.slug === complexitySlug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setComplexitySlug(item.slug)}
                  aria-pressed={active}
                  className={"rounded-lg border px-4 py-2 text-sm transition-colors " +
                    (active
                      ? "border-[color:var(--c-lime-ink)] bg-[rgba(227,188,122,0.08)] text-[color:var(--c-ink)]"
                      : "border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] text-[color:var(--c-muted)] hover:border-[color:var(--c-terra-ink)]")}
                >
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Шаг 3: опции */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--c-lime-ink)]">
            3. Дополнительные функции
          </h3>
          <ul className="space-y-2">
            {options.map((item) => {
              const checked = selected.includes(item.slug);
              return (
                <li key={item.slug}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.slug)}
                      className="h-4 w-4 accent-[color:var(--c-lime-ink)]"
                    />
                    <span className="flex-1 text-[color:var(--c-ink)]">{item.title}</span>
                    <span className="text-[color:var(--c-muted)]">+{formatPrice(item.price_delta)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Итог */}
      <aside
        className="h-fit rounded-[var(--radius-lg)] border border-[color:var(--c-line)] bg-[color:var(--c-paper-2)] p-6 lg:sticky lg:top-24"
        aria-live="polite"
      >
        <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--c-muted)]">Предварительно</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-[color:var(--c-lime-ink)]">
          {formatPrice(total)}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-[color:var(--c-muted)]">
          Демонстрационный расчёт. Суммы ориентировочные, не являются коммерческим предложением.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--c-muted)]">
          Модели, сервер и подписки сервисов оплачиваются отдельно.
        </p>
        <div className="mt-6">
          <ButtonLink
            href={"/contacts/#lead?source=calculator&service=" + service.slug + "&price=" + total + "&options=" + selected.join(",")}
          >
            Обсудить этот проект
          </ButtonLink>
        </div>
      </aside>
    </div>
  );
}
