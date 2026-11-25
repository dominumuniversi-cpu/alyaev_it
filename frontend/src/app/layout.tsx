import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

import { SiteChrome } from '@/components/layout/SiteChrome';
import { Analytics } from '@/components/site/Analytics';
import { SITE_LANG, SITE_OG_LOCALE } from '@/lib/locale';
import { siteBase } from '@/lib/seo';

export const metadata: Metadata = {
  title: { default: 'Автоматизация бизнеса и AI-разработка — Дмитрий Аляев', template: '%s — Дмитрий Аляев' },
  description: 'Автоматизация рутины для бизнеса: заявки из Telegram и сайта в одном месте, отчёты без ручного сбора. Telegram-боты, AI-консультанты, интеграции, сайты.',
  metadataBase: new URL(siteBase()),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: SITE_OG_LOCALE,
    siteName: "Дмитрий Аляев",
    title: "Дмитрий Аляев — автоматизация бизнеса и AI-разработка",
    description:
      "Автоматизация рутины для бизнеса: заявки из Telegram и сайта в одном месте, отчёты без ручного сбора. Telegram-боты, AI-консультанты, интеграции, сайты.",
  },
};

/** Корневой layout: общая оболочка всех страниц.
 *  Тема приходит заголовком x-theme из middleware (по cookie) — класс ставится на <html>
 *  на сервере, поэтому страница сразу отдаётся в выбранной теме, без вспышки. */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (await headers()).get('x-theme') === 'dark' ? 'dark' : 'light';
  return (
    <html lang={SITE_LANG} className={theme}>
      <body>
        {/* Ссылка «к содержанию»: первая позиция в табуляции, видна только при фокусе.
            Требование пакета темы: клавиатурная навигация и видимый фокус. */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-sm)] focus:bg-[color:var(--c-ink)] focus:px-4 focus:py-2 focus:text-sm focus:text-[color:var(--c-paper)]"
        >
          Перейти к содержанию
        </a>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}