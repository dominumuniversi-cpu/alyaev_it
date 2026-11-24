import type { Metadata } from 'next';
import './globals.css';

import { SiteChrome } from '@/components/layout/SiteChrome';
import { siteBase } from '@/lib/seo';

export const metadata: Metadata = {
  title: { default: 'Автоматизация бизнеса и AI-разработка — Дмитрий Аляев', template: '%s — Дмитрий Аляев' },
  description: 'Разрабатываю и внедряю решения для автоматизации бизнеса: Telegram-боты, AI-ассистенты, интеграции, сайты.',
  metadataBase: new URL(siteBase()),
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Дмитрий Аляев",
    title: "Дмитрий Аляев — автоматизация бизнеса и AI-разработка",
    description:
      "Разрабатываю и внедряю решения для автоматизации бизнеса: Telegram-боты, AI-ассистенты, интеграции, сайты.",
  },
};

/** Корневой layout: общая оболочка всех страниц. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}