"use client";

/** Страница 500: ошибка сервера без стектрейса и паники. ТЗ 11.5.
 *  Обязательно клиентский компонент: Next требует его для перехвата рендер-ошибок. */

import { ButtonLink } from "@/components/ui/Button";

/** Перехватывает ошибку сегмента и предлагает пути назад. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col items-start px-4 py-24 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--c-gold)]">Ошибка 500</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
        Что-то сломалось на нашей стороне
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[color:var(--c-text-muted)]">
        Задача не в вас: страница не смогла загрузиться из-за сбоя. Попробуйте обновить — обычно помогает.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[color:var(--c-gold)] bg-[color:var(--c-gold)] px-5 py-2.5 text-sm font-medium text-[color:var(--c-bg)] transition-opacity hover:opacity-90"
        >
          Попробовать снова
        </button>
        <ButtonLink href="/" variant="secondary">На главную</ButtonLink>
        <ButtonLink href="/contacts/" variant="secondary">Связаться</ButtonLink>
      </div>
    </div>
  );
}
