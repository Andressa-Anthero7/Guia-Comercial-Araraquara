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
    images: [{ image: "/anuncios/espetinhos.jpeg" }],
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
    images: [{ image: "/anuncios/top-carros.jpeg" }],
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
    if (path.endsWith("/categories/")) return json([{ slug: "gastronomia", name: "Gastronomia", icon: "Utensils", color: "orange", description: "" }]);
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
  const url = new URL(process.env.GCA_E2E_ORIGIN || "http://127.0.0.1:3000");
  url.hostname = "cafe-central.localhost";
  await page.goto(url.href);

  await expect(page.getByRole("heading", { name: "Cafe Central" })).toBeVisible();
  await expect(page.getByText("Cafe especial e paes artesanais.")).toBeVisible();
});

test("abre a previa publica da pagina personalizada pelo parametro subdomain", async ({ page }) => {
  await page.goto("/?subdomain=cafe-central");

  await expect(page.getByRole("heading", { name: "Cafe Central" })).toBeVisible();
});

async function mockDetailedProfile(page: Page) {
  await page.route("**/api/businesses/", (route) => route.fulfill({ json: [{
    ...businesses[0], phone: "(16) 3333-1234", complement: "Loja 2", city: "São Carlos", postal_code: "13560-000",
    website: "cafecentral.test", instagram: "https://www.instagram.com/cafecentral/",
    logo_image: "/anuncios/espetinhos.jpeg",
    images: [{ image: "/anuncios/espetinhos.jpeg" }, { image: "/anuncios/top-carros.jpeg" }, { image: "/anuncios/top-carros.jpeg" }],
    reviews_count: 1, rating: 5,
  }] }));
  await page.route("**/api/reviews/", (route) => route.request().method() === "GET" ? route.fulfill({ json: [
    { id: 1, business: 101, author_name: "Ana", rating: 5, comment: "Ótimo atendimento e café fresquinho.", created_at: "2026-09-10T12:00:00Z" },
    { id: 2, business: 102, author_name: "Outro cliente", rating: 1, comment: "Avaliação de outra empresa", created_at: "2026-09-10T12:00:00Z" },
  ] }) : route.fallback());
  await page.route("**/api/coupons/", (route) => route.fulfill({ json: [
    { id: 7, business: 101, discount_code: "CAFE10", description: "10% de desconto no café da manhã", expires_at: "2026-12-31" },
    { id: 8, business: 102, discount_code: "OUTRAEMPRESA", description: "Oferta de outra empresa", expires_at: "2026-12-31" },
  ] }));
}

test("landing e modal apresentam os mesmos detalhes, contatos, galeria, cupons e avaliações", async ({ page }, testInfo) => {
  await mockDetailedProfile(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [url, prefix] of [["/?subdomain=cafe-central", "landing"], ["/?empresa=cafe-central", "modal"]]) {
    await page.goto(url);
    const profile = prefix === "modal" ? page.getByRole("dialog") : page.getByRole("article", { name: "Página de Cafe Central", exact: true });
    await expect(profile.getByRole("heading", { name: "Cafe Central", exact: true })).toBeVisible();
    await expect(profile.getByText("Gastronomia", { exact: true })).toBeVisible();
    await expect(profile.getByText("Cafe, almoco e encomendas")).toBeVisible();
    await expect(profile.getByRole("link", { name: "(16) 3333-1234", exact: true })).toHaveAttribute("href", "tel:1633331234");
    await expect(profile.getByRole("link", { name: "contato@cafecentral.test", exact: true })).toHaveAttribute("href", "mailto:contato@cafecentral.test");
    await expect(profile.getByRole("link", { name: "cafecentral.test", exact: true })).toHaveAttribute("href", "https://cafecentral.test/");
    await expect(profile.getByRole("link", { name: "@cafecentral", exact: true })).toHaveAttribute("href", "https://www.instagram.com/cafecentral/");
    await expect(profile.locator("address")).toContainText("Loja 2");
    await expect(profile.locator("address")).toContainText("São Carlos - SP");
    await expect(profile.locator("address")).toContainText("CEP 13560-000");
    const mapQuery = new URL((await profile.locator(`#${prefix}-maps-embed`).getAttribute("src"))!).searchParams.get("q");
    expect(mapQuery).toContain("São Carlos - SP");
    expect(mapQuery).not.toContain("Araraquara");
    await expect(profile.getByRole("region", { name: "Galeria da empresa" }).getByRole("img")).toHaveCount(1);
    await expect(profile.getByText("Ótimo atendimento e café fresquinho.")).toBeVisible();
    await expect(profile.getByText("Avaliação de outra empresa")).toHaveCount(0);
    await expect(profile.getByText("OUTRAEMPRESA")).toHaveCount(0);
    await expect(profile.getByText("Válido até 31/12/2026")).toBeVisible();
    if (prefix === "landing") {
      await expect(profile.getByAltText("Logomarca Cafe Central")).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath("landing-desktop.png"), fullPage: true });
    } else {
      await profile.locator("#modal-close-btn").click();
      await expect(profile).toHaveCount(0);
    }
  }
});

test("cupons só confirmam a cópia após sucesso e permitem tentar novamente", async ({ page }) => {
  await mockDetailedProfile(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async () => { throw new Error("Clipboard indisponível"); },
    } });
  });
  await page.goto("/?subdomain=cafe-central");
  const coupon = page.getByRole("region", { name: "Cupons disponíveis" });
  const copy = coupon.getByRole("button", { name: "Copiar cupom CAFE10" });
  await copy.click();
  await expect(coupon.getByRole("alert")).toContainText("Não foi possível copiar automaticamente");
  await expect(copy).toHaveText("Copiar cupom");
  await expect(coupon.getByText("CAFE10", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    navigator.clipboard.writeText = async (code: string) => { sessionStorage.setItem("copied-coupon", code); };
  });
  await copy.click();
  await expect(copy).toHaveText("Copiado!");
  expect(await page.evaluate(() => sessionStorage.getItem("copied-coupon"))).toBe("CAFE10");
  await expect(coupon.getByRole("alert")).toHaveCount(0);
});

test("avaliação na landing mantém os dados após falha e confirma envio para moderação", async ({ page }) => {
  let failed = true;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/reviews/", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    if (failed) return route.fulfill({ status: 503, json: { detail: "Tente novamente em instantes." } });
    await pending;
    return route.fulfill({ status: 201, json: { id: 99, is_approved: false } });
  });
  await page.goto("/?subdomain=cafe-central");
  const form = page.getByRole("form", { name: "Deixe sua avaliação" });
  await form.getByLabel("Seu Nome", { exact: true }).fill("  Maria  ");
  await form.getByRole("button", { name: "4 estrelas", exact: true }).click();
  await form.getByLabel("Seu Comentário").fill("  Gostei muito do atendimento.  ");
  await form.getByRole("button", { name: "Enviar Avaliação" }).click();
  await expect(form.getByRole("alert")).toBeVisible();
  await expect(form.getByLabel("Seu Nome", { exact: true })).toHaveValue("  Maria  ");
  failed = false;
  const submitted = page.waitForRequest((request) => request.url().endsWith("/api/reviews/") && request.method() === "POST");
  await form.getByRole("button", { name: "Enviar Avaliação" }).click();
  const data = new URLSearchParams((await submitted).postData()!);
  expect(Object.fromEntries(data)).toEqual({ business: "101", author_name: "Maria", rating: "4", comment: "Gostei muito do atendimento." });
  await expect(form.getByRole("button", { name: "Enviando..." })).toBeDisabled();
  release();
  await expect(form.getByRole("status")).toContainText("Ela será publicada após a moderação");
  await expect(form.getByLabel("Seu Nome", { exact: true })).toHaveValue("");
  await expect(page.getByText("Nenhuma avaliação ainda.", { exact: false })).toBeVisible();
});

test("landing informa indisponibilidade das avaliações sem perder os detalhes da empresa", async ({ page }) => {
  await page.route("**/api/reviews/", (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto("/?subdomain=cafe-central");
  await expect(page.getByRole("heading", { name: "Cafe Central", exact: true })).toBeVisible();
  const reviews = page.getByRole("region", { name: "Avaliações da empresa" });
  await expect(reviews.getByRole("alert")).toContainText("As avaliações estão indisponíveis");
  await expect(page.getByText("Nenhuma avaliação ainda.", { exact: false })).toHaveCount(0);
});

test("landing se adapta ao celular e omite contatos e seções não cadastrados", async ({ page }, testInfo) => {
  await mockDetailedProfile(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?subdomain=cafe-central");
  await expect(page.getByAltText("Logomarca Cafe Central")).toBeVisible();
  await expect(page.getByRole("link", { name: "Falar no WhatsApp", exact: true })).toBeInViewport();
  await expect(page.getByRole("link", { name: "Como chegar", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("landing-mobile.png"), fullPage: true });

  await page.route("**/api/businesses/", (route) => route.fulfill({ json: [{
    ...businesses[0], phone_whatsapp: "", email: "", website: "", instagram: "", services_products: "", tags: [],
    opening_hours: "", image_url: "", images: [], street: "", number: "", neighborhood: "", city: "", state: "", postal_code: "",
  }] }));
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/?subdomain=cafe-central");
  await expect(page.getByRole("heading", { name: "Cafe Central", exact: true })).toBeVisible();
  await expect(page.getByText("Consulte a empresa para saber os horários.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Serviços e produtos" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Galeria da empresa" })).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], a[href^="https://wa.me/"]')).toHaveCount(0);
  await expect(page.locator("#landing-maps-embed")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("envia um novo cadastro para aprovacao", async ({ page }) => {
  await page.goto("/");

  await page.locator("#register-business-btn-desktop").click();
  await page.locator("#form-business-name").fill("Padaria de Teste");
  await page.locator("#form-business-desc").fill("Paes, bolos e cafe feitos todos os dias.");
  await page.locator("#form-business-phone").fill("(16) 3333-1234");
  await page.locator("#form-business-whatsapp").fill("16999999999");
  await page.locator("#form-business-address").fill("Rua de Teste, 123");
  const submitted = page.waitForRequest((request) => request.url().endsWith("/api/businesses/") && request.method() === "POST");
  await page.locator("#form-submit-btn").click();
  const form = new URLSearchParams((await submitted).postData()!);
  expect(form.get("phone")).toBe("(16) 3333-1234");
  expect(form.get("phone_whatsapp")).toBe("5516999999999");
  expect(form.get("image_url")).toMatch(/^https:\/\//);

  await expect(page.getByText(/enviada.*analise/i)).toBeVisible();
});

test("falha da API não mostra demonstração nem cadastro antigo e permite tentar novamente", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("guiacom_businesses", JSON.stringify([{ id: "old", name: "Cadastro antigo indevido" }]));
  });
  let unavailable = true;
  await page.route("**/api/**", (route) => unavailable
    ? route.fulfill({ status: 503, contentType: "application/json", body: '{}' })
    : route.fallback());
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Não foi possível carregar");
  await expect(page.getByText("Caffè di Sol", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Cadastro antigo indevido")).toHaveCount(0);
  await expect(page.getByText("Nenhum comércio encontrado")).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByText("Cafe Central", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("erro em eventos preserva empresas e a página personalizada", async ({ page }) => {
  await page.route("**/api/events/", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{}' }));
  await page.goto("/");
  await expect(page.getByText("Cafe Central", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("eventos");
  await page.goto("/?subdomain=cafe-central");
  await expect(page.getByRole("heading", { name: "Cafe Central", exact: true })).toBeVisible();
});

test("indisponibilidade das empresas não é apresentada como subdomínio inexistente", async ({ page }) => {
  await page.route("**/api/businesses/", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{}' }));
  await page.goto("/?subdomain=cafe-central");
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  await expect(page.getByText("Esta pagina de empresa nao existe", { exact: false })).toHaveCount(0);
});

test("durante o carregamento não mostra resultados vazios nem dados de demonstração", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/businesses/", async (route) => { await pending; await route.fallback(); });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Carregando informações");
  await expect(page.getByText("Nenhum comércio encontrado")).toHaveCount(0);
  await expect(page.getByText("Caffè di Sol", { exact: true })).toHaveCount(0);
  release();
  await expect(page.getByText("Cafe Central", { exact: true })).toBeVisible();
});

test("autentica no backoffice e filtra estabelecimentos por status", async ({ page }) => {
  await page.goto("/backoffice");

  await page.getByLabel("Usuario").fill("admin");
  await page.locator('input[type="password"]').fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.getByRole("button", { name: "Estabelecimentos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Estabelecimentos" })).toBeVisible();
  await page.locator("#backoffice-status-filter").selectOption("pending");
  const businessTable = page.getByRole("table");
  await expect(businessTable.getByText("Oficina Norte", { exact: true })).toBeVisible();
  await expect(businessTable.getByText("Cafe Central", { exact: true })).not.toBeVisible();
});

test("autentica o anunciante e exibe sua area restrita", async ({ page }) => {
  await page.goto("/anunciante/login");

  await page.getByLabel("Usuario").fill("anunciante");
  await page.locator('input[type="password"]').fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Área do Anunciante" })).toBeVisible();
  await expect(page).toHaveURL(/\/area-do-anunciante$/);
  await expect(page.getByText("Cafe Central Ltda", { exact: true })).toBeVisible();
  await expect(page.getByText(/Profissional/)).toBeVisible();
});

test("areas restritas permanecem no dominio do guia com API no mesmo dominio", async ({ page }) => {
  const authRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(auth|advertiser)\//.test(request.url())) authRequests.push(request.url());
  });
  await page.route("https://guiacomararaquara.com.br/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/api/")) return route.fallback();
    const response = await route.fetch({ url: `${process.env.GCA_E2E_ORIGIN || "http://127.0.0.1:3000"}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  const authOrigin = "https://guiacomararaquara.com.br";
  for (const path of ["/anunciante/?origem=guia", "/backoffice/gestao/advertisers"]) {
    await page.goto(`https://guiacomararaquara.com.br${path}`);
    await expect(page).toHaveURL(`${authOrigin}${path.startsWith("/anunciante") ? "/anunciante/login?origem=guia" : path}`);
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  }
  await page.goto(`${authOrigin}/anunciante/`);
  await page.getByLabel("Usuario", { exact: true }).fill("anunciante");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Área do Anunciante", exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${authOrigin}/area-do-anunciante`);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(`${authOrigin}/anunciante/login`);
  await page.getByRole("button", { name: "Voltar ao guia", exact: true }).click();
  await expect(page).toHaveURL(`${authOrigin}/`);
  await expect(page.getByText("Cafe Central", { exact: true })).toBeVisible();
  expect(authRequests.length).toBeGreaterThan(0);
  expect(authRequests.every(url => url.startsWith(`${authOrigin}/api/`))).toBe(true);
});

test("endereco antigo e subdominios encaminham o login para o dominio do guia", async ({ page }) => {
  const guideOrigin = "https://guiacomararaquara.com.br";
  const oldOrigins = ["https://webapp415078.ip-45-79-2-160.cloudezapp.io", "https://m-espetinhos.guiacomararaquara.com.br", "https://www.guiacomararaquara.com.br"];
  for (const origin of [guideOrigin, ...oldOrigins]) {
    await page.route(`${origin}/**`, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith("/api/")) return route.fallback();
      const response = await route.fetch({ url: `${process.env.GCA_E2E_ORIGIN || "http://127.0.0.1:3000"}${url.pathname}${url.search}` });
      await route.fulfill({ response });
    });
  }
  for (const origin of oldOrigins) {
    await page.goto(`${origin}/anunciante/?origem=antigo#cadastro`);
    await expect(page).toHaveURL(`${guideOrigin}/anunciante/login?origem=antigo#cadastro`);
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  }
});

test("sessão perdida no painel volta ao login e permite entrar novamente", async ({ page }) => {
  let expired = false;
  await page.route("**/api/advertiser/portal/", (route) => expired
    ? route.fulfill({ status: 401, json: { detail: "Autenticacao necessaria." } })
    : route.fallback());
  await page.goto("/anunciante/");
  await page.getByLabel("Usuario", { exact: true }).fill("anunciante");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Cafe Central Ltda", { exact: true })).toBeVisible();
  expired = true;
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Sua sessão expirou");
  await expect(page).toHaveURL(/\/anunciante\/login$/);
  await expect(page.getByText("Cafe Central Ltda", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toHaveCount(0);
  expired = false;
  await page.getByLabel("Usuario", { exact: true }).fill("anunciante");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Cafe Central Ltda", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page).toHaveURL(/\/area-do-anunciante$/);
});

test("sem sessao os acessos direto e antigo levam ao login do anunciante", async ({ page }) => {
  for (const path of ["/area-do-anunciante", "/area-do-anunciante/", "/anunciante", "/anunciante/"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/anunciante\/login$/);
    await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Financeiro", exact: true })).toHaveCount(0);
  }
});

test("sessao existente encaminha login e endereco antigo para a area do anunciante", async ({ page }) => {
  await page.route("**/api/auth/session/", route => route.fulfill({ json: { is_authenticated: true, is_backoffice: false, is_advertiser: true, username: "anunciante", name: "Responsavel", email: "" } }));
  for (const path of ["/anunciante/login", "/anunciante/", "/area-do-anunciante/"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/area-do-anunciante$/);
    await expect(page.getByRole("heading", { name: "Área do Anunciante", exact: true })).toBeVisible();
  }
});

async function enterAdvertiser(page: Page) {
  await page.goto("/anunciante/login");
  await page.getByLabel("Usuario", { exact: true }).fill("anunciante");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Área do Anunciante", exact: true })).toBeVisible();
}

test("painel profissional apresenta seis seções responsivas e link público da empresa", async ({ page }, testInfo) => {
  await enterAdvertiser(page);
  await expect(page.getByRole("link", { name: /Ver página pública/ })).toHaveAttribute("href", "https://cafe-central.guiacomararaquara.com.br/");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const tab of ["Visão geral", "Estabelecimentos", "Anúncios", "Cupons", "Financeiro", "Cadastro"]) {
      const button = page.getByRole("navigation", { name: "Navegação do anunciante" }).getByRole("link", { name: tab, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-current", "page");
      await expect(page.locator("#advertiser-content h2").first()).toHaveText(tab);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} em ${width}px`).toBe(true);
      if (tab === "Visão geral" || tab === "Financeiro") await page.screenshot({ path: testInfo.outputPath(`workspace-${width}-${tab === "Financeiro" ? "finance" : "overview"}.png`), fullPage: true });
    }
  }
});

test("cadastro preserva rascunho em erro e protege saída, troca de aba e atualização", async ({ page }) => {
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Cadastro", exact: true }).click();
  const input = page.getByLabel("Responsável", { exact: true });
  await input.fill("Novo responsável");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(input).toHaveValue("Novo responsável");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(input).toHaveValue("Novo responsável");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/area-do-anunciante\/cadastro$/);
  let resolve!: () => void;
  const pending = new Promise<void>(release => { resolve = release; });
  let writes = 0;
  await page.route("**/api/advertiser/profile/", async route => {
    writes++;
    expect(route.request().postDataJSON().contact_name).toBe("Novo responsável");
    await pending;
    await route.fulfill({ status: 503, json: { detail: "Serviço temporariamente indisponível." } });
  });
  await page.getByRole("button", { name: "Salvar dados", exact: true }).click();
  await expect(input).toBeDisabled();
  await expect(page.getByRole("button", { name: "Salvando…", exact: true })).toBeDisabled();
  resolve();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(input).toHaveValue("Novo responsável");
  expect(writes).toBe(1);
  await page.route("**/api/advertiser/profile/", route => route.fulfill({ json: { ...advertiserPortal.advertiser, contact_name: "Novo responsável" } }));
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, advertiser: { ...advertiserPortal.advertiser, contact_name: "Novo responsável" } } }));
  await page.getByRole("button", { name: "Salvar dados", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Cadastro atualizado.");
  await expect(input).toHaveValue("Novo responsável");
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page.getByRole("region", { name: "Histórico financeiro" })).toBeVisible();
});

test("edição de estabelecimento envia os dados corretos e encerra o formulário após salvar", async ({ page }) => {
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  await page.getByRole("button", { name: "Editar dados", exact: true }).click();
  await page.getByLabel("Horário de atendimento", { exact: true }).fill("Segunda a sexta, das 9h às 18h");
  await page.route("**/api/advertiser/businesses/cafe-central/", async route => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toMatchObject({ name: "Cafe Central", opening_hours: "Segunda a sexta, das 9h às 18h", phone_whatsapp: "5516999999999" });
    await route.fulfill({ json: { ...businesses[0], opening_hours: "Segunda a sexta, das 9h às 18h" } });
  });
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Dados do estabelecimento atualizados.");
  await expect(page.getByLabel("Horário de atendimento", { exact: true })).toHaveCount(0);
});

test("anúncio explica revisão e cupom transmite oferta e validade sem perder conteúdo", async ({ page }) => {
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Anúncios", exact: true }).click();
  await page.getByRole("button", { name: "Editar anúncio", exact: true }).click();
  await expect(page.getByText(/Ao enviar, o anúncio ficará em revisão/)).toBeVisible();
  await page.getByLabel("Título *", { exact: true }).fill("Seu café da manhã");
  await page.route("**/api/advertiser/advertisements/1/", route => {
    expect(route.request().postDataJSON().title).toBe("Seu café da manhã");
    return route.fulfill({ json: { ...advertiserPortal.advertisements[0], title: "Seu café da manhã", status: "review" } });
  });
  await page.getByRole("button", { name: "Enviar para revisão", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Alterações enviadas para revisão.");
  await page.getByRole("link", { name: "Cupons", exact: true }).click();
  await page.getByRole("button", { name: "Novo cupom", exact: true }).click();
  await page.getByLabel("Título *", { exact: true }).fill("Desconto no café");
  await page.getByLabel("Código *", { exact: true }).fill("CAFE10");
  await page.getByLabel("Descrição *", { exact: true }).fill("10% no café. Válido uma vez por cliente.");
  await page.getByLabel("Validade", { exact: true }).fill("2026-12-31");
  await page.route("**/api/advertiser/coupons/", route => {
    expect(route.request().postDataJSON()).toMatchObject({ business: "cafe-central", title: "Desconto no café", discount_code: "CAFE10", starts_at: null, expires_at: "2026-12-31", is_active: true });
    return route.fulfill({ json: { id: 7 } });
  });
  await page.getByRole("button", { name: "Salvar cupom", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Cupom salvo.");
  await expect(page.getByLabel("Título *", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Novo cupom", exact: true }).click();
  await expect(page.getByLabel("Título *", { exact: true })).toHaveValue("");
});

test("conta sem estabelecimentos tem orientação e impede criação de cupom sem vínculo", async ({ page }) => {
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, businesses: [], advertisements: [], subscriptions: [] } }));
  await enterAdvertiser(page);
  await expect(page.getByRole("heading", { name: "Seu estabelecimento começa aqui" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ver página pública/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Cupons", exact: true }).click();
  await expect(page.getByRole("button", { name: "Novo cupom", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page.getByText("Nenhuma cobrança cadastrada.", { exact: true })).toBeVisible();
  await expect(page.getByText(/Os pagamentos on-line ainda não estão disponíveis/)).toBeVisible();
});

test("financeiro separa valores abertos e vencidos e traduz os meios de pagamento", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-10T21:00:00-03:00"));
  const invoice = { id: 1, subscription: 1, advertiser_name: "Cafe Central Ltda", business_name: "Cafe Central", description: "Mensalidade de setembro", reference_month: "2026-09-01", due_date: "2026-09-05", amount: "100.00", total: "100.00", discount: "0", late_fee: "0", status: "open", paid_at: null, payment_method: "", external_reference: "", notes: "" };
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, invoices: [invoice, { ...invoice, id: 2, description: "Pagamento registrado", status: "paid", total: "90.00", payment_method: "card" }, { ...invoice, id: 3, description: "Próxima mensalidade", due_date: "2026-10-05", total: "75.00" }, { ...invoice, id: 4, description: "Cobrança cancelada", status: "cancelled", total: "200.00" }] } }));
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await expect(page.locator(".workspace-finance-summary")).toContainText("175,00");
  await expect(page.locator(".workspace-finance-summary")).toContainText("100,00");
  const table = page.getByRole("region", { name: "Histórico financeiro" });
  await expect(table.getByRole("row").filter({ hasText: "Mensalidade de setembro" })).toContainText("Vencido");
  await expect(table.getByRole("row").filter({ hasText: "Pagamento registrado" })).toContainText("Cartão");
  await expect(table.getByRole("row").filter({ hasText: "Próxima mensalidade" })).toContainText("Em aberto");
  await page.setViewportSize({ width: 320, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("cupons distinguem oferta agendada, expirada e inativa", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-10T21:00:00-03:00"));
  const coupon = { business: "cafe-central", business_name: "Cafe Central", discount_code: "CAFE10", description: "Uma oferta", is_active: true, is_valid: false, starts_at: "2026-09-01", expires_at: "2026-12-31" };
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, coupons: [{ ...coupon, id: 1, title: "Oferta futura", starts_at: "2026-10-01" }, { ...coupon, id: 2, title: "Oferta encerrada", expires_at: "2026-09-09" }, { ...coupon, id: 3, title: "Oferta pausada", is_active: false }] } }));
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Cupons", exact: true }).click();
  const table = page.getByRole("region", { name: "Lista de cupons" });
  await expect(table.getByRole("article").filter({ hasText: "Oferta futura" })).toContainText("Agendado");
  await expect(table.getByRole("article").filter({ hasText: "Oferta encerrada" })).toContainText("Expirado");
  await expect(table.getByRole("article").filter({ hasText: "Oferta pausada" })).toContainText("Inativo");
});

const advertiserRoutes = [
  ["Visão geral", "/area-do-anunciante"],
  ["Estabelecimentos", "/area-do-anunciante/estabelecimentos"],
  ["Anúncios", "/area-do-anunciante/anuncios"],
  ["Cupons", "/area-do-anunciante/cupons"],
  ["Financeiro", "/area-do-anunciante/financeiro"],
  ["Cadastro", "/area-do-anunciante/cadastro"],
] as const;

test("cada seção tem URL própria, título, link direto e recarregamento estável", async ({ page }) => {
  await page.route("**/api/auth/session/", route => route.fulfill({ json: { is_authenticated: true, is_advertiser: true, is_backoffice: false, username: "anunciante" } }));
  for (const [label, path] of advertiserRoutes) {
    await page.goto(path + "/");
    await expect(page).toHaveURL(new RegExp(path + "$"));
    await expect(page.locator("#advertiser-content h2")).toHaveText(label);
    await expect(page).toHaveTitle(`${label} | Área do Anunciante`);
    await expect(page.getByRole("navigation").getByRole("link", { name: label, exact: true })).toHaveAttribute("href", path);
    await page.reload();
    await expect(page.locator("#advertiser-content h2")).toHaveText(label);
    await expect(page.getByRole("navigation").getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
  }
});

test("link direto sem sessão retorna à seção pedida depois de autenticar", async ({ page }) => {
  await page.goto("/area-do-anunciante/financeiro");
  await expect(page).toHaveURL(/\/anunciante\/login\?next=%2Farea-do-anunciante%2Ffinanceiro$/);
  await page.getByLabel("Usuario", { exact: true }).fill("anunciante");
  await page.getByLabel("Senha", { exact: true }).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/area-do-anunciante\/financeiro$/);
  await expect(page.getByRole("region", { name: "Histórico financeiro" })).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/anunciante\/login$/);
});

test("destino externo de login é descartado e página desconhecida tem retorno claro", async ({ page }) => {
  await page.route("**/api/auth/session/", route => route.fulfill({ json: { is_authenticated: true, is_advertiser: true, is_backoffice: false, username: "anunciante" } }));
  for (const next of ["https://untrusted.invalid/", "//untrusted.invalid/", "/area-do-anunciante/../backoffice", "/backoffice"]) {
    await page.goto(`/anunciante/login?next=${encodeURIComponent(next)}`);
    await expect(page).toHaveURL(/\/area-do-anunciante$/);
  }
  await page.goto("/area-do-anunciante/nao-existe");
  await expect(page.getByRole("button", { name: "Voltar para visão geral" })).toBeVisible();
  await page.getByRole("button", { name: "Voltar para visão geral" }).click();
  await expect(page).toHaveURL(/\/area-do-anunciante$/);
});

test("voltar e avançar respeitam rascunhos e mantêm o histórico após cancelamento", async ({ page }) => {
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  await page.getByRole("link", { name: "Cadastro", exact: true }).click();
  await page.getByLabel("Responsável", { exact: true }).fill("Rascunho protegido");
  page.once("dialog", dialog => dialog.dismiss());
  await page.goBack();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByLabel("Responsável", { exact: true })).toHaveValue("Rascunho protegido");
  page.once("dialog", dialog => dialog.accept());
  await page.goBack();
  await expect(page).toHaveURL(/\/estabelecimentos$/);
  await expect(page.getByRole("button", { name: "Editar dados", exact: true })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/cadastro$/);
  await expect(page.getByLabel("Responsável", { exact: true })).toHaveValue("Responsavel");
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/area-do-anunciante$/);
});

test("busca e filtros de estabelecimentos e anúncios não alteram os registros", async ({ page }) => {
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, businesses, advertisements: [...advertiserPortal.advertisements, { ...advertiserPortal.advertisements[0], id: 2, title: "Revisão preventiva", status: "review", business_name: "Oficina Norte" }] } }));
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  await page.getByLabel("Buscar estabelecimento", { exact: true }).fill("oficina");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("Oficina Norte");
  await page.getByLabel("Status do estabelecimento", { exact: true }).selectOption("active");
  await expect(page.getByRole("button", { name: "Limpar filtros", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByRole("link", { name: "Anúncios", exact: true }).click();
  await page.getByLabel("Status do anúncio", { exact: true }).selectOption("review");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByRole("article")).toContainText("Revisão preventiva");
  await page.getByRole("button", { name: "Editar anúncio", exact: true }).click();
  await page.getByLabel("Título *", { exact: true }).fill("Revisão completa");
  await expect(page.locator(".advertiser-ad-preview h4")).toHaveText("Revisão completa");
});

test("cupom existente permite editar período e desativar com PATCH", async ({ page }) => {
  const coupon = { id: 7, business: "cafe-central", business_name: "Cafe Central", title: "Café em dobro", discount_code: "DOBRO", description: "Dois cafés pelo preço de um", starts_at: null, expires_at: null, is_active: true, is_valid: true };
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, coupons: [coupon] } }));
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Cupons", exact: true }).click();
  await page.getByRole("button", { name: "Editar cupom", exact: true }).click();
  await page.getByLabel("Início", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Validade", { exact: true }).fill("2026-10-31");
  await page.getByRole("checkbox", { name: /Cupom ativo/ }).uncheck();
  await page.route("**/api/advertiser/coupons/7/", route => {
    expect(route.request().method()).toBe("PATCH");
    expect(route.request().postDataJSON()).toMatchObject({ id: 7, starts_at: "2026-10-01", expires_at: "2026-10-31", is_active: false });
    return route.fulfill({ json: { ...coupon, is_active: false } });
  });
  await page.getByRole("button", { name: "Salvar cupom", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Cupom salvo.");
  await expect(page.getByRole("button", { name: "Editar cupom", exact: true })).toBeVisible();
});

test("detalhes financeiros mostram composição do valor e devolvem o foco ao fechar", async ({ page }) => {
  const invoice = { id: 1, subscription: 1, advertiser_name: "Cafe Central Ltda", business_name: "Cafe Central", description: "Mensalidade de setembro", reference_month: "2026-09-01", due_date: "2026-09-20", amount: "100.00", total: "95.00", discount: "10.00", late_fee: "5.00", status: "paid", paid_at: "2026-09-10", payment_method: "pix", external_reference: "REC-001", notes: "" };
  await page.route("**/api/advertiser/portal/", route => route.fulfill({ json: { ...advertiserPortal, invoices: [invoice] } }));
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await page.getByLabel("Mês de vencimento", { exact: true }).fill("2026-10");
  await expect(page.getByRole("heading", { name: "Nenhum resultado para estes filtros" })).toBeVisible();
  await page.getByLabel("Mês de vencimento", { exact: true }).fill("2026-09");
  const details = page.getByRole("button", { name: "Ver detalhes: Mensalidade de setembro", exact: true });
  await details.click();
  const dialog = page.getByRole("dialog", { name: "Mensalidade de setembro", exact: true });
  await expect(dialog).toContainText("100,00");
  await expect(dialog).toContainText("10,00");
  await expect(dialog).toContainText("95,00");
  await expect(dialog).toContainText("REC-001");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(details).toBeFocused();
});

test("editores preservam os dados enquanto o salvamento está em andamento", async ({ page }) => {
  await enterAdvertiser(page);
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  await page.getByRole("button", { name: "Editar dados", exact: true }).click();
  await page.getByLabel("Complemento", { exact: true }).fill("Sala 2");
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/advertiser/businesses/cafe-central/", async route => {
    await pending;
    await route.fulfill({ status: 503, json: { detail: "Falha temporária." } });
  });
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Voltar à lista", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Complemento", { exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Complemento", { exact: true })).toHaveValue("Sala 2");
});

test("formulários detalhados cabem no celular e mantêm ações de salvar acessíveis", async ({ page }, testInfo) => {
  await enterAdvertiser(page);
  for (const [tab, edit] of [["Cadastro", ""], ["Estabelecimentos", "Editar dados"], ["Anúncios", "Editar anúncio"], ["Cupons", "Novo cupom"]]) {
    await page.getByRole("link", { name: tab, exact: true }).click();
    if (edit) await page.getByRole("button", { name: edit, exact: true }).click();
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} em ${width}px`).toBe(true);
      await page.locator(".advertiser-savebar").scrollIntoViewIfNeeded();
      await expect(page.getByRole("button", { name: "Cancelar", exact: true })).toBeInViewport();
      await page.screenshot({ path: testInfo.outputPath(`editor-${tab}-${width}.png`), fullPage: true });
    }
  }
});
