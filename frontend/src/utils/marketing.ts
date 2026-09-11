import type { Business } from "../types";

type Pixel = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; push?: Pixel; loaded?: boolean; version?: string };
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: Pixel; _fbq?: Pixel; }
}
const initialized = new Set<string>();

function script(id: string, src: string) {
  if (document.getElementById(id)) return;
  const element = document.createElement("script");
  element.id = id;
  element.async = true;
  element.src = src;
  document.head.appendChild(element);
}

// A dedicated company page uses only that company's destinations. No campaign
// script is started by directory cards or backoffice previews.
export function initializeMarketing(business: Business) {
  if (business.planType !== "paid") return;
  const ga = /^G-[A-Z0-9]{3,20}$/.test(business.googleAnalyticsId ?? "") ? business.googleAnalyticsId! : "";
  const ads = /^AW-[0-9]{5,20}$/.test(business.googleAdsId ?? "") ? business.googleAdsId! : "";
  const pixel = /^[0-9]{5,30}$/.test(business.metaPixelId ?? "") ? business.metaPixelId! : "";
  if (ga || ads) {
    window.dataLayer ||= [];
    window.gtag ||= function () { window.dataLayer!.push(arguments); };
    if (!initialized.has("google")) { window.gtag("js", new Date()); initialized.add("google"); }
    script("gca-google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga || ads)}`);
    for (const id of [ga, ads].filter(Boolean)) {
      if (!initialized.has(id)) { window.gtag("config", id, { send_page_view: false }); initialized.add(id); }
    }
    const key = `view:${business.id}:${ga}:${ads}`;
    if (!initialized.has(key)) {
      window.gtag("event", "page_view", { send_to: [ga, ads].filter(Boolean), page_title: business.name });
      initialized.add(key);
    }
  }
  if (pixel) {
    if (!window.fbq) {
      const queue = function (...args: unknown[]) { queue.callMethod ? queue.callMethod(...args) : queue.queue.push(args); } as Pixel;
      queue.queue = [];
      queue.push = queue;
      queue.loaded = true;
      queue.version = "2.0";
      window.fbq = queue;
      window._fbq = queue;
    }
    script("gca-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
    if (!initialized.has(pixel)) {
      window.fbq("init", pixel);
      window.fbq("trackSingle", pixel, "PageView");
      initialized.add(pixel);
    }
  }
}

export function trackMarketingContact(business: Business, method: string) {
  if (business.planType !== "paid") return;
  const destinations = [business.googleAnalyticsId, business.googleAdsId].filter((id): id is string => !!id && initialized.has(id));
  if (destinations.length) window.gtag?.("event", "contact_click", { send_to: destinations, contact_method: method, business_name: business.name });
  const pixel = business.metaPixelId;
  if (pixel && initialized.has(pixel)) window.fbq?.("trackSingle", pixel, "Contact", { content_name: business.name, contact_method: method });
}
