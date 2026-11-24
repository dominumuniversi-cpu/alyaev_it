import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Автоматизация бизнеса и AI-разработка — Дмитрий Аляев', template: '%s — Дмитрий Аляев' },
  description: 'Разрабатываю и внедряю решения для автоматизации бизнеса: Telegram-боты, AI-ассистенты, интеграции, сайты.',
  metadataBase: new URL(process.env.SITE_URL || 'https://alyaev.it'),
  robots: { index: true, follow: true },
};

/** Корневой layout: общая оболочка всех страниц. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
