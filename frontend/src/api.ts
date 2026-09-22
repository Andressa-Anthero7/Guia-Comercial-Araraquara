import { Business, Coupon, Event, Review, UsefulNumber } from "./types";
import { whatsappNumber } from "./utils/contact";

const BACKEND_ORIGIN = "https://webapp415078.ip-45-79-2-160.cloudezapp.io";
const GUIDE_ORIGIN = "https://guiacomararaquara.com.br";
const isLocalDevelopmentHost =
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname) || window.location.hostname.endsWith(".localhost");
const API_ORIGIN =
  isLocalDevelopmentHost || [GUIDE_ORIGIN, BACKEND_ORIGIN].includes(window.location.origin) ? "" : BACKEND_ORIGIN;

export function authenticationRedirectUrl(pathname: string) {
  if (isLocalDevelopmentHost || window.location.origin === GUIDE_ORIGIN || !/^\/(anunciante|area-do-anunciante|backoffice)(?:\/|$)/.test(pathname)) return "";
  return `${GUIDE_ORIGIN}${pathname}${window.location.search}${window.location.hash}`;
}

export class AuthenticationError extends Error {
  constructor() {
    super("Sua sessao expirou ou voce nao tem permissao. Entre novamente.");
    this.name = "AuthenticationError";
  }
}

interface ApiBusiness {
  benefits?: Business["benefits"];
  id: number;
  slug: string;
  name: string;
  description: string;
  services_products?: string;
  plan_type?: "free" | "paid";
  public_subdomain?: string;
  meta_pixel_id?: string;
  google_analytics_id?: string;
  google_ads_id?: string;
  category: string | null;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  phone_whatsapp: string;
  phone?: string;
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
  is_superuser?: boolean;
  is_authenticated: boolean;
  is_backoffice: boolean;
  is_advertiser?: boolean;
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
  plan_type: "free" | "paid";
  max_images: number;
  featured: boolean;
  includes_coupons: boolean;
  includes_marketing: boolean;
  includes_custom_page: boolean;
  is_active: boolean;
}

export interface AdvertisingSubscription {
  id: number;
  advertiser: number;
  advertiser_name: string;
  business: number;
  business_name: string;
  advertisement: number | null;
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

export interface AdvertisementMedia {
  id?: number;
  media_type: "image" | "video";
  file_data: string;
  alt_text: string;
  caption: string;
  order: number;
}

export interface Advertisement {
  id: number;
  business: number;
  business_name: string;
  title: string;
  short_description: string;
  description: string;
  call_to_action: string;
  destination_url: string;
  logo_image: string;
  cover_image: string;
  video_url: string;
  tags: string[];
  tag_names: string[];
  media: AdvertisementMedia[];
  starts_at: string | null;
  ends_at: string | null;
  status: "draft" | "review" | "published" | "paused" | "ended";
  is_featured: boolean;
  is_primary: boolean;
}

export interface AdvertiserCoupon {
  id: number;
  business: string;
  business_name: string;
  title: string;
  discount_code: string;
  description: string;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  is_valid: boolean;
}

export interface AdvertiserPortalData {
  metrics?: { start: string; end: string; totals: Array<{ business_id: number; business__name: string; event: string; count: number }> };
  advertiser: Advertiser;
  businesses: Business[];
  advertisements: Advertisement[];
  coupons: AdvertiserCoupon[];
  subscriptions: AdvertisingSubscription[];
  invoices: Invoice[];
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

export interface BackofficeNotification {
  id: number;
  kind: "registration" | "advertisement" | "review" | "finance" | "system";
  title: string;
  message: string;
  url: string;
  is_read: boolean;
  created_at: string;
}

function csrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith("csrftoken="));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : "";
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
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
      throw new AuthenticationError();
    }
    if (response.status === 413) {
      throw new Error("As imagens ultrapassaram o tamanho permitido pelo servidor.");
    }

    const formatError = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.map(formatError).filter(Boolean).join(", ");
      if (value && typeof value === "object") {
        return Object.entries(value)
          .map(([field, messages]) => `${field}: ${formatError(messages)}`)
          .join("; ");
      }
      return String(value ?? "");
    };
    const detail = formatError(error);

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
    benefits: item.benefits,
    id: String(item.id),
    slug: item.slug,
    name: item.name,
    description: item.description,
    servicesProducts: item.services_products ?? "",
    planType: item.plan_type ?? "free",
    publicSubdomain: item.public_subdomain ?? "",
    metaPixelId: item.meta_pixel_id ?? "",
    googleAnalyticsId: item.google_analytics_id ?? "",
    googleAdsId: item.google_ads_id ?? "",
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
    phone: item.phone || item.phone_whatsapp,
    whatsapp: whatsappNumber(item.phone_whatsapp),
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
    services_products: business.servicesProducts ?? "",
    plan_type: business.planType ?? "free",
    public_subdomain: business.publicSubdomain ?? "",
    meta_pixel_id: business.metaPixelId ?? "",
    google_analytics_id: business.googleAnalyticsId ?? "",
    google_ads_id: business.googleAdsId ?? "",
    category: business.category || null,
    street: business.street || business.address.split(",")[0]?.trim() || "Nao informado",
    number: business.number || business.address.split(",")[1]?.trim() || "S/N",
    complement: business.complement ?? "",
    neighborhood: business.neighborhood,
    city: business.city ?? "Araraquara",
    state: business.state ?? "SP",
    postal_code: business.postalCode ?? "",
    phone: business.phone,
    phone_whatsapp: whatsappNumber(business.whatsapp || business.phone),
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

export type PortalSection = "businesses" | "reviews" | "coupons" | "events" | "usefulNumbers" | "categories";

export async function loadPortalData() {
  const unavailable: PortalSection[] = [];
  async function load<T, U>(section: PortalSection, path: string, map: (item: T) => U): Promise<U[]> {
    try {
      const items = await request<T[]>(path, { signal: AbortSignal.timeout(15000) });
      if (!Array.isArray(items)) throw new Error("Resposta inválida.");
      return items.map(map);
    } catch {
      unavailable.push(section);
      return [];
    }
  }
  const [businesses, reviews, coupons, events, usefulNumbers] = await Promise.all([
    load("businesses", "/api/businesses/", mapBusiness),
    load("reviews", "/api/reviews/", (item: ApiReview): Review => ({
      id: String(item.id),
      businessId: String(item.business),
      author: item.author_name,
      rating: item.rating,
      comment: item.comment,
      date: item.created_at
    })),
    load("coupons", "/api/coupons/", (item: Record<string, unknown>): Coupon => ({
      id: String(item.id),
      businessId: String(item.business),
      businessName: String(item.business_name ?? ""),
      discountCode: String(item.discount_code ?? ""),
      description: String(item.description ?? ""),
      expiryDate: String(item.expires_at ?? "")
    })),
    load("events", "/api/events/", (item: Record<string, unknown>): Event => ({
      id: String(item.id),
      title: String(item.title ?? ""),
      date: String(item.schedule_text ?? item.starts_at ?? ""),
      location: String(item.location ?? ""),
      description: String(item.description ?? ""),
      image: String(item.image_url ?? "")
    })),
    load("usefulNumbers", "/api/useful-numbers/", (item: Record<string, unknown>): UsefulNumber => ({
      name: String(item.name ?? ""),
      phone: String(item.phone ?? ""),
      description: String(item.description ?? ""),
      category: String(item.category ?? "")
    }))
  ]);
  return { businesses, reviews, coupons, events, usefulNumbers, unavailable };
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

export async function changeBackofficeBusinessStatus(
  business: Business,
  status: NonNullable<Business["status"]>
) {
  if (!business.slug) throw new Error("Estabelecimento sem identificador.");
  await ensureCsrf();
  const item = await request<ApiBusiness>(
    `/api/backoffice/businesses/${business.slug}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ status })
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

export async function loginAdvertiser(username: string, password: string) {
  await ensureCsrf();
  return request<BackofficeSession>("/api/auth/advertiser/login/", {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function loadAdvertiserPortal(): Promise<AdvertiserPortalData> {
  const data = await request<Omit<AdvertiserPortalData, "businesses"> & { businesses: ApiBusiness[] }>(
    "/api/advertiser/portal/"
  );
  return { ...data, businesses: data.businesses.map(mapBusiness) };
}

export async function updateAdvertiserProfile(value: Pick<Advertiser, "name" | "document" | "contact_name" | "email" | "phone" | "billing_email">) {
  await ensureCsrf();
  return request<Advertiser>("/api/advertiser/profile/", {
    method: "PATCH",
    body: JSON.stringify(value)
  });
}

export async function updateAdvertiserBusiness(business: Business) {
  if (!business.slug) throw new Error("Estabelecimento sem identificador.");
  await ensureCsrf();
  const item = await request<ApiBusiness>(`/api/advertiser/businesses/${business.slug}/`, {
    method: "PATCH",
    body: JSON.stringify(businessPayload(business))
  });
  return mapBusiness(item);
}

export async function saveAdvertiserCoupon(value: Omit<AdvertiserCoupon, "id" | "business_name" | "is_valid"> & { id?: number }) {
  await ensureCsrf();
  return request<AdvertiserCoupon>(
    value.id ? `/api/advertiser/coupons/${value.id}/` : "/api/advertiser/coupons/",
    {
      method: value.id ? "PATCH" : "POST",
      body: JSON.stringify(value)
    }
  );
}

export async function submitAdvertiserAdvertisement(
  id: number,
  value: Pick<Advertisement, "title" | "short_description" | "description" | "call_to_action" | "destination_url" | "video_url">
) {
  await ensureCsrf();
  return request<Advertisement>(`/api/advertiser/advertisements/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(value)
  });
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
export const saveAdvertisement = (value: Advertisement) =>
  saveResource("/api/backoffice/advertisements/", value);

export async function loadAdvertisements() {
  return request<Advertisement[]>("/api/backoffice/advertisements/");
}

export async function loadBackofficeNotifications() {
  return request<BackofficeNotification[]>("/api/backoffice/notifications/");
}

export async function markNotificationRead(id: number) {
  await ensureCsrf();
  return request<{ status: string }>(`/api/backoffice/notifications/${id}/read/`, {
    method: "POST",
    body: "{}"
  });
}

export async function markAllNotificationsRead() {
  await ensureCsrf();
  return request<{ status: string }>("/api/backoffice/notifications/read-all/", {
    method: "POST",
    body: "{}"
  });
}

export async function getPushConfig() {
  return request<{ public_key: string }>("/api/backoffice/push/config/");
}

export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  const key = (name: "p256dh" | "auth") => subscription.keys?.[name] ?? "";
  await ensureCsrf();
  return request("/api/backoffice/push/subscription/", {
    method: "POST",
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: key("p256dh"),
      auth: key("auth"),
      user_agent: navigator.userAgent
    })
  });
}
