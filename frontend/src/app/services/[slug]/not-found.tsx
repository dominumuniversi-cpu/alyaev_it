/** 404 для несуществующей услуги. */

import { ButtonLink } from "@/components/ui/Button";

/** Честное сообщение вместо пустой страницы. */
export default function ServiceNotFound() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-24 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">Услуга не найдена</h1>
      <p className="mt-4 text-[color:var(--c-text-muted)]">
        Возможно, услуга переименована или снята с публикации.
      </p>
      <div className="mt-8">
        <ButtonLink href="/services/">Весь каталог услуг</ButtonLink>
      </div>
    </div>
  );
}