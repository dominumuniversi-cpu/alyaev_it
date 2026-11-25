/** Страница 404: честное сообщение и пути назад. */

import { ButtonLink } from "@/components/ui/Button";

/** 404 без навигационной паники: три коротких пути. */
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--c-lime-ink)]">Ошибка 404</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
        Такой страницы нет
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--c-muted)]">
        Возможно, адрес изменился или страница ещё не опубликована. Ниже — то, что точно существует.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">На главную</ButtonLink>
        <ButtonLink href="/services/" variant="secondary">
          Услуги
        </ButtonLink>
        <ButtonLink href="/contacts/" variant="secondary">
          Связаться
        </ButtonLink>
      </div>
    </div>
  );
}