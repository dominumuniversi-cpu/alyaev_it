/** Серверные запросы к FastAPI. Базовый адрес — внутренняя сеть Docker. */

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://alyaev-api:8000";
const BASE_PATH = process.env.BASE_PATH ?? "/alyaev";

export type ServiceCard = {
  slug: string;
  title: string;
  short_description: string;
  price_from: number | null;
  price_currency: string;
  price_on_request: boolean;
  duration_text: string;
  examples: string[];
  category_slug: string | null;
  category_title: string | null;
};

export type ServiceFull = ServiceCard & {
  body_md: string;
  show_problems: string[];
  included: string[];
  excluded: string[];
  client_data: string[];
  extra_costs: string[];
  warranty_text: string;
  faq: { q: string; a: string }[];
};

export type Category = { slug: string; title: string; short_description: string };

export type CategoryFull = Category & { services: ServiceCard[] };

export type Review = {
  author_name: string;
  author_position: string | null;
  text: string;
  project_title: string | null;
  published_at: string | null;
};

/** Публичный путь с учётом basePath. */
export function withBase(path: string): string {
  return BASE_PATH + path;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(BACKEND + path, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Опубликованные услуги или пустой список при сбое API. */
export async function fetchServices(): Promise<ServiceCard[]> {
  return (await getJson<ServiceCard[]>("/api/v1/public/services")) ?? [];
}

/** Категории услуг. */
export async function fetchCategories(): Promise<Category[]> {
  return (await getJson<Category[]>("/api/v1/public/categories")) ?? [];
}

/** Категория с её услугами или null. */
export async function fetchCategory(slug: string): Promise<CategoryFull | null> {
  return getJson<CategoryFull>("/api/v1/public/categories/" + encodeURIComponent(slug));
}

/** Полная карточка услуги или null. */
export async function fetchService(slug: string): Promise<ServiceFull | null> {
  return getJson<ServiceFull>("/api/v1/public/services/" + encodeURIComponent(slug));
}

/** Отзывы с согласием автора. Пустой список, если таких нет. */
export async function fetchReviews(): Promise<Review[]> {
  return (await getJson<Review[]>("/api/v1/public/reviews")) ?? [];
}

/** Публичные настройки сайта. */
export async function fetchSettings(): Promise<Record<string, Record<string, string>>> {
  return (await getJson<Record<string, Record<string, string>>>("/api/v1/public/settings")) ?? {};
}

/** Форматирование цены: «от 6 000 ₽» или «по запросу». */
export function formatPrice(card: ServiceCard): string {
  if (card.price_on_request || card.price_from === null) return "по запросу";
  const value = new Intl.NumberFormat("ru-RU").format(card.price_from);
  const sign = card.price_currency === "RUB" ? "₽" : card.price_currency;
  return "от " + value + " " + sign;
}