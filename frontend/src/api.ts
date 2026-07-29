import { Business, Coupon, Event, Review, UsefulNumber } from "./types";

const BACKEND_ORIGIN = "https://webapp415078.ip-45-79-2-160.cloudezapp.io";
const API_ORIGIN =
  window.location.origin === BACKEND_ORIGIN ? "" : BACKEND_ORIGIN;

interface ApiBusiness {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string | null;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  phone_whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  logo_image: string;
  image_url: string;
  images?: Array<{ image: string }>;
  gallery_images?: Array<{ image: string }>;
  opening_hours: string;
  is_featured: boolean;
  status: Business["status"];
  tags?: string[];
  tag_names?: string[];
  rating: number;
  reviews_count: number;
}

interface ApiReview {
  id: number;
  business: number;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface BackofficeSession {
  is_authenticated: boolean;
  is_backoffice: boolean;
  username: string;
  name: string;
  email: string;
}

export interface Advertiser {
  id: number;
  user: number | null;
  businesses: number[];
  business_names: string[];
  name: string;
  document: string;
  contact_name: string;
  email: string;
  phone: string;
  billing_email: string;
  status: "active" | "inactive" | "prospect";
  notes: string;
}

export interface AdvertisingPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  billing_cycle: "monthly" | "quarterly" | "semiannual" | "annual";
  max_ads: number;
  featured: boolean;
  is_active: boolean;
}

export interface AdvertisingSubscription {
  id: number;
  advertiser: number;
  advertiser_name: string;
  business: number;
  business_name: string;
  plan: number;
  plan_name: string;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  agreed_price: string;
  status: "active" | "pending" | "suspended" | "cancelled" | "expired";
  auto_renew: boolean;
  notes: string;
}

export interface Invoice {
  id: number;
  subscription: number;
  advertiser_name: string;
  business_name: string;
  description: string;
  reference_month: string;
  due_date: string;
  amount: string;
  discount: string;
  late_fee: string;
  total: string;
  status: "open" | "paid" | "overdue" | "cancelled";
  paid_at: string | null;
  payment_method: string;
  external_reference: string;
  notes: string;
}

export interface FinanceSummary {
  active_advertisers: number;
  active_subscriptions: number;
  open_amount: number;
  overdue_amount: number;
  overdue_count: number;
  due_soon_count: number;
  received_this_month: number;
}

function csrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("csrftoken="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = csrfToken();
    if (token) headers.set("X-CSRFToken", token);
  }

  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${url}`, {
      ...options,
      headers,
      credentials: API_ORIGIN ? "omit" : "include"
    });
  } catch {
    throw new Error(
      "Nao foi possivel conectar ao servidor. Verifique sua internet e tente novamente."
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const error = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : {};

    if (response.status === 401 || response.status === 403) {
      throw new Error("Sua sessao expirou ou voce nao tem permissao. Entre novamente.");
    }
    if (response.status === 413) {
      throw new Error("As imagens ultrapassaram o tamanho permitido pelo servidor.");
    }

    const detail =
      typeof error.detail === "string"
        ? error.detail
        : Object.entries(error)
            .map(([field, messages]) => {
              const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
              return `${field}: ${text}`;
            })
            .join("\n");

    throw new Error(
      detail ||
        `Nao foi possivel concluir a operacao (erro ${response.status}).`
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function ensureCsrf() {
  await request<{ csrf: string }>("/api/auth/csrf/");
}

export function mapBusiness(item: ApiBusiness): Business {
  const gallery = item.gallery_images ?? item.images ?? [];
  const images = gallery.map((image) => image.image);
  const cover = item.image_url || images[0] || "";
  return {
    id: String(item.id),
    slug: item.slug,
    name: item.name,
    description: item.description,
    category: item.category ?? "",
    address: [item.street && `${item.street}, ${item.number}`, item.complement]
      .filter(Boolean)
      .join(" - "),
    street: item.street,
    number: item.number,
    complement: item.complement,
    neighborhood: item.neighborhood,
    city: item.city,
    state: item.state,
    postalCode: item.postal_code,
    phone: item.phone_whatsapp,
    whatsapp: item.phone_whatsapp.replace(/\D/g, ""),
    email: item.email,
    website: item.website,
    instagram: item.instagram,
    rating: Number(item.rating ?? 0),
    reviewsCount: item.reviews_count ?? 0,
    image: cover,
    logoImage: item.logo_image,
    images,
    isFeatured: item.is_featured,
    status: item.status,
    hours: item.opening_hours,
    tags: item.tag_names ?? item.tags ?? []
  };
}

function businessPayload(business: Business) {
  return {
    name: business.name,
    description: business.description,
    category: business.category || null,
    street: business.street || business.address.split(",")[0]?.trim() || "Nao informado",
    number: business.number || business.address.split(",")[1]?.trim() || "S/N",
    complement: business.complement ?? "",
    neighborhood: business.neighborhood,
    city: business.city ?? "Araraquara",
    state: business.state ?? "SP",
    postal_code: business.postalCode ?? "",
    phone_whatsapp: business.phone || business.whatsapp,
    email: business.email ?? "",
    website: business.website ?? "",
    instagram: business.instagram ?? "",
    logo_image: business.logoImage ?? "",
    image_url: business.image,
    images: business.images ?? (business.image ? [business.image] : []),
    opening_hours: business.hours,
    is_featured: business.isFeatured,
    status: business.status ?? "pending",
    tags: business.tags
  };
}

export async function loadPortalData() {
  const [businesses, reviews, coupons, events, usefulNumbers] = await Promise.all([
    request<ApiBusiness[]>("/api/businesses/"),
    request<ApiReview[]>("/api/reviews/"),
    request<Array<Record<string, unknown>>>("/api/coupons/"),
    request<Array<Record<string, unknown>>>("/api/events/"),
    request<Array<Record<string, unknown>>>("/api/useful-numbers/")
  ]);
  return {
    businesses: businesses.map(mapBusiness),
    reviews: reviews.map((item) => ({
      id: String(item.id),
      businessId: String(item.business),
      author: item.author_name,
      rating: item.rating,
      comment: item.comment,
      date: item.created_at
    })),
    coupons: coupons.map((item) => ({
      id: String(item.id),
      businessId: String(item.business),
      businessName: String(item.business_name ?? ""),
      discountCode: String(item.discount_code ?? ""),
      description: String(item.description ?? ""),
      expiryDate: String(item.expires_at ?? "")
    })) as Coupon[],
    events: events.map((item) => ({
      id: String(item.id),
      title: String(item.title ?? ""),
      date: String(item.schedule_text ?? item.starts_at ?? ""),
      location: String(item.location ?? ""),
      description: String(item.description ?? ""),
      image: String(item.image_url ?? "")
    })) as Event[],
    usefulNumbers: usefulNumbers.map((item) => ({
      name: String(item.name ?? ""),
      phone: String(item.phone ?? ""),
      description: String(item.description ?? ""),
      category: String(item.category ?? "")
    })) as UsefulNumber[]
  };
}

export async function loadBackofficeBusinesses() {
  const items = await request<ApiBusiness[]>("/api/backoffice/businesses/");
  return items.map(mapBusiness);
}

export async function createPublicBusiness(business: Business) {
  const payload = businessPayload(business);
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images") return;
    if (key === "tags" && Array.isArray(value)) {
      value.forEach((tag) => form.append("tags", tag));
      return;
    }
    if (value !== null && value !== undefined) form.set(key, String(value));
  });
  const item = await request<ApiBusiness>("/api/businesses/", {
    method: "POST",
    body: form
  });
  return mapBusiness(item);
}

export async function createReview(review: Omit<Review, "id" | "date">) {
  const form = new URLSearchParams({
    business: String(Number(review.businessId)),
    author_name: review.author,
    rating: String(review.rating),
    comment: review.comment
  });
  return request<ApiReview>("/api/reviews/", {
    method: "POST",
    body: form
  });
}

export async function saveBackofficeBusiness(business: Business) {
  await ensureCsrf();
  const isExisting = Boolean(business.slug);
  const item = await request<ApiBusiness>(
    isExisting
      ? `/api/backoffice/businesses/${business.slug}/`
      : "/api/backoffice/businesses/",
    {
      method: isExisting ? "PUT" : "POST",
      body: JSON.stringify(businessPayload(business))
    }
  );
  return mapBusiness(item);
}

export async function deleteBackofficeBusiness(business: Business) {
  if (!business.slug) throw new Error("Estabelecimento sem identificador.");
  await ensureCsrf();
  await request<void>(`/api/backoffice/businesses/${business.slug}/`, {
    method: "DELETE"
  });
}

export async function getSession() {
  return request<BackofficeSession>("/api/auth/session/");
}

export async function loginBackoffice(username: string, password: string) {
  await ensureCsrf();
  return request<BackofficeSession>(
    "/api/auth/login/",
    {
      method: "POST",
      body: JSON.stringify({ username, password })
    }
  );
}

export async function logoutBackoffice() {
  await ensureCsrf();
  return request<{ is_authenticated: boolean; is_backoffice: boolean }>(
    "/api/auth/logout/",
    { method: "POST" }
  );
}

export async function loadFinanceData() {
  const [summary, advertisers, plans, subscriptions, invoices] = await Promise.all([
    request<FinanceSummary>("/api/backoffice/finance-summary/"),
    request<Advertiser[]>("/api/backoffice/advertisers/"),
    request<AdvertisingPlan[]>("/api/backoffice/plans/"),
    request<AdvertisingSubscription[]>("/api/backoffice/subscriptions/"),
    request<Invoice[]>("/api/backoffice/invoices/")
  ]);
  return { summary, advertisers, plans, subscriptions, invoices };
}

async function saveResource<T extends { id?: number }>(path: string, value: T) {
  await ensureCsrf();
  return request<T>(value.id ? `${path}${value.id}/` : path, {
    method: value.id ? "PUT" : "POST",
    body: JSON.stringify(value)
  });
}

export const saveAdvertiser = (value: Advertiser) =>
  saveResource("/api/backoffice/advertisers/", value);
export const saveAdvertisingPlan = (value: AdvertisingPlan) =>
  saveResource("/api/backoffice/plans/", value);
export const saveAdvertisingSubscription = (value: AdvertisingSubscription) =>
  saveResource("/api/backoffice/subscriptions/", value);
export const saveInvoice = (value: Invoice) =>
  saveResource("/api/backoffice/invoices/", value);
