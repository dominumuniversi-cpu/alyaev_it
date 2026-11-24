/** Согласие на обработку персональных данных (152-ФЗ). */

import type { Metadata } from "next";

import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Согласие на обработку персональных данных",
  description: "Условия согласия на обработку персональных данных при отправке формы заявки на сайте.",
  alternates: { canonical: canonicalUrl("/personal-data-consent/") },
  robots: { index: false, follow: true },
};

/** Текст согласия: то, с чем соглашается человек, отправляя заявку. */
export default function ConsentPage() {
  return (
    <Section
      headingLevel={1}
      id="consent" title="Согласие на обработку персональных данных">
      <div className="max-w-3xl space-y-5 text-base leading-relaxed text-[color:var(--c-text-muted)]">
        <p>
          Отправляя форму заявки на этом сайте, я даю согласие на обработку моих персональных данных
          на следующих условиях.
        </p>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-text)]">Состав данных</h2>
          <p>Имя, контакт для связи (Telegram, телефон или e-mail), описание задачи,
          ссылка на сайт компании, если указана.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-text)]">Цель обработки</h2>
          <p>Ответ на обращение, обсуждение задачи и подготовка предложения. Данные не используются
          для рассылок без отдельного согласия и не передаются третьим лицам.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-text)]">Срок и отзыв</h2>
          <p>Согласие действует до его отзыва. Отозвать согласие и запросить удаление данных можно,
          написав в контакт, указанный в подвале сайта. Данные удаляются в течение 30 дней.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-text)]">Фиксация факта согласия</h2>
          <p>Вместе с заявкой сохраняется версия текста согласия и время его подтверждения.</p>
        </div>
        <p className="text-sm">
          Версия документа 1.0. Порядок обработки описан в политике конфиденциальности.
        </p>
      </div>
    </Section>
  );
}