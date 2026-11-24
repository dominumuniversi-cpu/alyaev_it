import type { Metadata } from 'next';
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

/** Корневой layout: общая оболочка всех страниц. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={SITE_LANG}>
      <body>
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}