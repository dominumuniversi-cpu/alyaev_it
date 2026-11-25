/** Политика обработки персональных данных. */

import type { Metadata } from "next";

import { Section } from "@/components/ui/Section";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description: "Какие данные собираются через формы сайта, зачем, где хранятся и как удаляются.",
  alternates: { canonical: canonicalUrl("/privacy/") },
};

/** Политика: цели, состав данных, хранение, права субъекта. */
export default function PrivacyPage() {
  return (
    <Section
      headingLevel={1}
      id="privacy" title="Политика обработки персональных данных">
      <div className="max-w-3xl space-y-6 text-base leading-relaxed text-[color:var(--c-muted)]">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">1. Общие положения</h2>
          <p>
            Политика описывает, как обрабатываются персональные данные, которые посетитель оставляет
            через формы на этом сайте. Оператор — владелец сайта, контакты указаны в подвале.
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">2. Какие данные обрабатываются</h2>
          <p>Имя, контакт для связи, описание задачи, ссылка на сайт компании (если указана),
          технические данные: обезличенный IP-адрес (в виде хеша), тип браузера, UTM-метки источника перехода.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">3. Цель обработки</h2>
          <p>Ответ на обращение и обсуждение задачи. Данные не продаются и не передаются
          третьим лицам, кроме случаев, прямо предусмотренных законом.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">4. Хранение и защита</h2>
          <p>Данные хранятся на сервере в защищённой базе данных. Доступ ограничен, передача
          по соединению HTTPS, пароли и секреты хранятся в зашифрованном виде.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">5. Права</h2>
          <p>Можно запросить сведения об обработке своих данных, их исправление или удаление,
          а также отозвать согласие. Запрос исполняется в течение 30 дней.</p>
        </div>
        <div>
          <h2 className="mb-2 text-lg font-semibold text-[color:var(--c-ink)]">6. Аналитика</h2>
          <p>Для оценки посещаемости могут использоваться счётчики аналитики. Они собирают
          обезличенные статистические данные о визитах.</p>
        </div>
        <p className="text-sm">
          Версия 1.0. Порядок дачи согласия описан в отдельном документе.
        </p>
      </div>
    </Section>
  );
}
