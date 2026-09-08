import { expect, Page, test } from "@playwright/test";

const businesses = [
  {
    id: 101,
    slug: "cafe-central",
    name: "Cafe Central",
    description: "Cafe especial e paes artesanais.",
    services_products: "Cafe, almoco e encomendas",
    plan_type: "paid",
    public_subdomain: "cafe-central",
    category: "gastronomia",
    street: "Rua Central",
    number: "100",
    complement: "",
    neighborhood: "Centro",
    city: "Araraquara",
    state: "SP",
    postal_code: "14800-000",
    phone_whatsapp: "16999999999",
    email: "contato@cafecentral.test",
    website: "",
    instagram: "cafecentral",
    logo_image: "",
    image_url: "/anuncios/espetinhos.jpeg",
    images: ["/anuncios/espetinhos.jpeg"],
    opening_hours: "Seg a Sab, 8h as 18h",
    is_featured: true,
    status: "active",
    tags: ["Cafe", "Centro"],
    rating: 4.8,
    reviews_count: 12
  },
  {
    id: 102,
    slug: "oficina-norte",
    name: "Oficina Norte",
    description: "Revisao e manutencao automotiva.",
    services_products: "Revisao, freios e oleo",
    plan_type: "free",
    public_subdomain: "",
    category: "automotivo",
    street: "Avenida Norte",
    number: "45",
    complement: "",
    neighborhood: "Vila Xavier",
    city: "Araraquara",
    state: "SP",
    postal_code: "14810-000",
    phone_whatsapp: "16998888888",
    email: "",
    website: "",
    instagram: "",
    logo_image: "",
    image_url: "/anuncios/top-carros.jpeg",
    images: ["/anuncios/top-carros.jpeg"],
    opening_hours: "Seg a Sex, 8h as 17h",
    is_featured: false,
    status: "pending",
    tags: ["Oficina", "Revisao"],
    rating: 4.6,
    reviews_count: 8
  }
];

const advertiserPortal = {
  advertiser: {
    id: 1, user: 10, businesses: [101], business_names: ["Cafe Central"],
    name: "Cafe Central Ltda", document: "", contact_name: "Responsavel", email: "contato@cafecentral.test",
    phone: "16999999999", billing_email: "financeiro@cafecentral.test", status: "active", notes: ""
  },
  businesses: [businesses[0]],
  advertisements: [{
    id: 1, business: 101, business_name: "Cafe Central", title: "Cafe especial", short_description: "Paes artesanais",
    description: "Cafe especial e paes artesanais.", call_to_action: "Fale conosco", destination_url: "", logo_image: "",
    cover_image: "", video_url: "", tags: [], tag_names: [], media: [], starts_at: null, ends_at: null,
    status: "published", is_featured: true, is_primary: true
  }],
  coupons: [],
  subscriptions: [{
    id: 1, advertiser: 1, advertiser_name: "Cafe Central Ltda", business: 101, business_name: "Cafe Central",
    advertisement: 1, plan: 1, plan_name: "Profissional", start_date: "2026-01-01", end_date: null,
    next_due_date: "2026-09-20", agreed_price: "199.90", status: "active", auto_renew: true, notes: ""
  }],
  invoices: []
};

async function mockApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body)
    });

    if (path.endsWith("/auth/csrf/")) return json({ csrf: "test" });
    if (path.endsWith("/auth/session/")) {
      return json({ is_authenticated: false, is_backoffice: false, is_advertiser: false, username: "", name: "", email: "" });
    }
    if (path.endsWith("/auth/advertiser/login/")) {
      return json({ is_authenticated: true, is_backoffice: false, is_advertiser: true, username: "anunciante", name: "Responsavel", email: "contato@cafecentral.test" });
    }
    if (path.endsWith("/auth/login/")) {
      return json({ is_authenticated: true, is_backoffice: true, username: "admin", name: "Admin", email: "admin@test.local" });
    }
    if (path.endsWith("/auth/logout/")) return json({ is_authenticated: false, is_backoffice: false });
    if (path.endsWith("/advertiser/portal/")) return json(advertiserPortal);
    if (path.endsWith("/advertiser/profile/")) return json(advertiserPortal.advertiser);
    if (path.endsWith("/backoffice/businesses/")) {
      if (request.method() === "PATCH") return json({ ...businesses[1], status: "active" });
      return json(businesses);
    }
    if (path.endsWith("/businesses/")) {
      if (request.method() === "POST") return json({ ...businesses[1], id: 103, slug: "novo-estabelecimento", status: "pending" });
      return json(businesses.filter((business) => business.status === "active"));
    }
    if (path.endsWith("/reviews/") || path.endsWith("/coupons/") || path.endsWith("/events/") || path.endsWith("/useful-numbers/")) return json([]);
    if (path.includes("/backoffice/finance-summary/")) return json({ active_advertisers: 0, active_subscriptions: 0, open_amount: 0, overdue_amount: 0, overdue_count: 0, due_soon_count: 0, received_this_month: 0 });
    if (path.includes("/backoffice/")) return json([]);
    return json({});
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("permite pesquisar e abrir os detalhes de um anunciante publico", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Cafe Central", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Pesquisar anunciantes, produtos ou servicos").fill("oficina");
  await expect(page.getByText("Cafe Central", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Nenhum comércio encontrado")).toBeVisible();

  await page.getByPlaceholder("Pesquisar anunciantes, produtos ou servicos").fill("cafe");
  await page.locator("#business-details-btn-101").click();
  await expect(page.locator("#business-detail-modal").getByText("Cafe especial e paes artesanais.")).toBeVisible();
  await expect(page.locator("#modal-maps-embed")).toHaveAttribute("src", /google\.com\/maps/);
});

test("abre a pagina personalizada quando o host corresponde ao subdominio do anunciante", async ({ page }) => {
  await page.goto("http://cafe-central.localhost:3000/");

  await expect(page.getByRole("heading", { name: "Cafe Central" })).toBeVisible();
  await expect(page.getByText("Cafe especial e paes artesanais.")).toBeVisible();
});

test("envia um novo cadastro para aprovacao", async ({ page }) => {
  await page.goto("/");

  await page.locator("#register-business-btn-desktop").click();
  await page.locator("#form-business-name").fill("Padaria de Teste");
  await page.locator("#form-business-desc").fill("Paes, bolos e cafe feitos todos os dias.");
  await page.locator("#form-business-phone").fill("(16) 3333-1234");
  await page.locator("#form-business-whatsapp").fill("16999999999");
  await page.locator("#form-business-address").fill("Rua de Teste, 123");
  await page.locator("#form-submit-btn").click();

  await expect(page.getByText(/enviada.*analise/i)).toBeVisible();
});

test("autentica no backoffice e filtra estabelecimentos por status", async ({ page }) => {
  await page.goto("/backoffice");

  await page.getByLabel("Usuario").fill("admin");
  await page.locator('input[type="password"]').fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Estabelecimentos" })).toBeVisible();
  await page.locator("#backoffice-status-filter").selectOption("pending");
  const businessTable = page.getByRole("table");
  await expect(businessTable.getByText("Oficina Norte", { exact: true })).toBeVisible();
  await expect(businessTable.getByText("Cafe Central", { exact: true })).not.toBeVisible();
});

test("autentica o anunciante e exibe sua area restrita", async ({ page }) => {
  await page.goto("/anunciante/");

  await page.getByLabel("Usuario").fill("anunciante");
  await page.locator('input[type="password"]').fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Area do Anunciante" })).toBeVisible();
  await expect(page.getByText("Cafe Central Ltda", { exact: true })).toBeVisible();
  await expect(page.getByText(/Profissional/)).toBeVisible();
});
