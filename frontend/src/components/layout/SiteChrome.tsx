/** Общая рамка публичных страниц: шапка + подвал с данными из БД. */

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { fetchServices, fetchSettings } from "@/lib/api";

/** Оборачивает содержимое страницы шапкой и подвалом. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [services, settings] = await Promise.all([fetchServices(), fetchSettings()]);
  const contacts = settings.contacts ?? {};
  const footerServices = services.map((item) => ({ slug: item.slug, title: item.title }));

  return (
    <>
      <Header />
      <main id="content">{children}</main>
      <Footer services={footerServices} contacts={contacts} />
    </>
  );
}