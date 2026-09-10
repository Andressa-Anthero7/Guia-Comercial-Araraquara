import { expect, Page, test } from "@playwright/test";

async function managementApi(page: Page, superuser = true) {
  const records: Record<string, any[]> = {
    businesses: [
      {
        id: 2,
        slug: "m-espetinhos",
        name: "M Espetinhos",
        category: "alimentacao",
        category_name: "Alimentação",
        description: "Espetinhos e porções",
        services_products: "Cardápio original",
        street: "Rua Um",
        number: "2",
        neighborhood: "Centro",
        city: "Araraquara",
        state: "SP",
        phone_whatsapp: "16999999999",
        email: "",
        status: "active",
        plan_type: "free",
        public_subdomain: "",
        is_featured: false,
        image_url: "",
        gallery_images: [],
        tag_names: ["Espetinhos"],
        opening_hours: "18h às 23h",
      },
      {
        id: 3,
        slug: "barbearia",
        name: "Barbearia Alcântara",
        category: "beleza",
        category_name: "Beleza",
        description: "Cabelo e barba",
        services_products: "Corte e barba",
        street: "Rua Dois",
        number: "3",
        neighborhood: "Centro",
        city: "Araraquara",
        state: "SP",
        phone_whatsapp: "16998888888",
        email: "",
        status: "active",
        plan_type: "paid",
        public_subdomain: "barbearia-alcantara",
        meta_pixel_id: "123456",
        google_analytics_id: "G-ORIGINAL",
        google_ads_id: "AW-ORIGINAL",
        is_featured: true,
        image_url: "/anuncios/top-carros.jpeg",
        gallery_images: [
          { id: 8, image: "/anuncios/top-carros.jpeg", order: 0 },
        ],
        tag_names: ["Barba"],
      },
    ],
    categories: [
      {
        id: 1,
        slug: "alimentacao",
        name: "Alimentação",
        is_active: true,
        icon: "Utensils",
        color: "bg-amber-50 text-amber-600",
        order: 0,
      },
      {
        id: 2,
        slug: "beleza",
        name: "Beleza",
        is_active: true,
        icon: "Scissors",
        order: 1,
      },
    ],
    tags: [{ id: 1, name: "Espetinhos", slug: "espetinhos" }],
    advertisers: [
      {
        id: 1,
        name: "Responsável",
        businesses: [2, 3],
        status: "active",
        user: 2,
      },
    ],
    plans: [
      {
        id: 1,
        name: "Profissional",
        price: "99.90",
        is_active: true,
        plan_type: "paid",
        billing_cycle: "monthly",
      },
    ],
    subscriptions: [
      {
        id: 1,
        business: 2,
        business_name: "M Espetinhos",
        advertiser: 1,
        advertiser_name: "Responsável",
        plan: 1,
        plan_name: "Profissional",
        agreed_price: "99.90",
        status: "active",
        next_due_date: "2026-09-20",
      },
    ],
    invoices: [
      {
        id: 1,
        subscription: 1,
        description: "Mensalidade setembro",
        business_name: "M Espetinhos",
        amount: "99.90",
        discount: "0",
        late_fee: "0",
        total: "99.90",
        reference_month: "2026-09-01",
        due_date: "2026-09-20",
        paid_at: null,
        payment_method: "",
        status: "open",
      },
    ],
    reviews: [
      {
        id: 1,
        business: 3,
        business_name: "Barbearia Alcântara",
        author_name: "Visitante",
        author_email: "",
        comment: "Ótimo atendimento",
        rating: 5,
        is_approved: false,
      },
    ],
    users: [
      {
        id: 1,
        username: "gestora",
        first_name: "Andressa",
        is_staff: true,
        is_superuser: true,
        is_active: true,
      },
      {
        id: 2,
        username: "anunciante",
        first_name: "Cliente",
        email: "cliente@example.test",
        is_staff: false,
        is_superuser: false,
        is_active: true,
      },
    ],
    advertisements: [],
    coupons: [],
    events: [],
    "useful-numbers": [],
    notifications: [],
  };
  const writes: { resource: string; payload: any; method: string }[] = [];
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    const reply = (body: any, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/api/auth/session/")
      return reply({
        is_authenticated: true,
        is_backoffice: true,
        is_superuser: superuser,
        username: "gestora",
        name: "Andressa",
        email: "",
      });
    if (path === "/api/auth/csrf/") return reply({ csrf: "set" });
    const admin = path.startsWith("/api/backoffice/");
    const parts = path.split("/").filter(Boolean);
    const resource = parts[admin ? 2 : 1];
    const lookup = parts[admin ? 3 : 2];
    const rows = records[resource];
    if (!rows) return reply({});
    if (method === "GET") {
      const filtered = admin
        ? rows
        : rows.filter(
            (row) =>
              row.is_active !== false &&
              row.is_published !== false &&
              row.is_approved !== false &&
              (!row.status || row.status === "active"),
          );
      return reply(
        lookup
          ? filtered.find((row) => String(row.slug || row.id) === lookup)
          : filtered,
      );
    }
    const payload = method === "DELETE" ? {} : route.request().postDataJSON();
    writes.push({ resource, payload, method });
    const index = rows.findIndex(
      (row) => String(resource === "businesses" ? row.slug : row.id) === lookup,
    );
    if (method === "DELETE") {
      rows.splice(index, 1);
      return route.fulfill({ status: 204 });
    }
    const saved = {
      ...(index >= 0
        ? rows[index]
        : { id: Math.max(0, ...rows.map((row) => row.id)) + 1 }),
      ...payload,
    };
    if (payload.images)
      saved.gallery_images = payload.images.map(
        (image: string, index: number) => ({
          id: index + 10,
          image,
          order: index,
        }),
      );
    if (payload.tags) saved.tag_names = payload.tags;
    if (index >= 0) rows[index] = saved;
    else rows.push(saved);
    return reply(saved, method === "POST" ? 201 : 200);
  });
  return { records, writes };
}

test("libera empresa sem e-mail como paga e abre sua página personalizada", async ({
  page,
}) => {
  const { records, writes } = await managementApi(page);
  await page.goto("/backoffice/gestao/businesses/m-espetinhos");
  await page.getByLabel("Modalidade").selectOption("paid");
  await page.getByLabel("Subdomínio", { exact: true }).fill("m-espetinhos");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(writes[0].payload).toEqual({
    plan_type: "paid",
    public_subdomain: "m-espetinhos",
  });
  expect(records.businesses[0].services_products).toBe("Cardápio original");
  await page.goto("/?subdomain=m-espetinhos");
  await expect(
    page.getByRole("heading", { name: "M Espetinhos", exact: true }),
  ).toBeVisible();
});

test("editar nome preserva plano, domínio, marketing, serviços e imagens", async ({
  page,
}) => {
  const { records, writes } = await managementApi(page);
  await page.goto("/backoffice/gestao/businesses/barbearia");
  await page
    .getByLabel("Nome", { exact: true })
    .fill("Barbearia Alcântara Centro");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(writes[0].payload).toEqual({ name: "Barbearia Alcântara Centro" });
  expect(records.businesses[1]).toMatchObject({
    public_subdomain: "barbearia-alcantara",
    plan_type: "paid",
    meta_pixel_id: "123456",
    services_products: "Corte e barba",
    gallery_images: [{ id: 8, image: "/anuncios/top-carros.jpeg", order: 0 }],
  });
});

test("valida subdomínio e mantém formulário depois de erro da API", async ({
  page,
}) => {
  const { writes } = await managementApi(page);
  await page.goto("/backoffice/gestao/businesses/m-espetinhos");
  await page.getByLabel("Modalidade").selectOption("paid");
  await page.getByLabel("Subdomínio", { exact: true }).fill("nome_invalido");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("alert")).toContainText("Subdomínio inválido");
  expect(writes).toHaveLength(0);
  await page.route(
    "**/api/backoffice/businesses/m-espetinhos/",
    async (route) =>
      route.request().method() === "PATCH"
        ? route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              public_subdomain: ["Este endereço já está em uso."],
            }),
          })
        : route.fallback(),
  );
  await page.getByLabel("Subdomínio", { exact: true }).fill("outro-nome");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("alert")).toContainText("já está em uso");
  await expect(page.getByLabel("Subdomínio", { exact: true })).toHaveValue(
    "outro-nome",
  );
});

test("redução para gratuito explica impacto e limpa apenas benefícios pagos", async ({
  page,
}) => {
  const { writes } = await managementApi(page);
  await page.goto("/backoffice/gestao/businesses/barbearia");
  await page.getByLabel("Modalidade").selectOption("free");
  await expect(page.getByText(/Ao salvar como gratuito/)).toBeVisible();
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(writes[0].payload).toEqual({
    plan_type: "free",
    public_subdomain: "",
    meta_pixel_id: "",
    google_analytics_id: "",
    google_ads_id: "",
    is_featured: false,
  });
});

test("todos os módulos carregam, categoria pode ser criada e editada", async ({
  page,
}) => {
  const { records } = await managementApi(page);
  await page.goto("/backoffice");
  for (const name of [
    "Estabelecimentos",
    "Anunciantes",
    "Categorias",
    "Tags",
    "Anúncios e mídias",
    "Cupons",
    "Eventos",
    "Telefones úteis",
    "Avaliações",
    "Planos e benefícios",
    "Assinaturas",
    "Cobranças",
    "Acessos",
  ]) {
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Carregando cadastros…")).not.toBeVisible();
  }
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Categorias", exact: true })
    .click();
  await page.getByRole("button", { name: "Nova categoria" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Cursos");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await page.getByRole("button", { name: "Cursos", exact: true }).click();
  await page.getByLabel("Ativo", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(
    records.categories.find((item) => item.name === "Cursos").is_active,
  ).toBe(false);
});

test("registra pagamento e aprova avaliação pelos respectivos módulos", async ({
  page,
}) => {
  const { records } = await managementApi(page);
  await page.goto("/backoffice/gestao/invoices/1");
  await page.getByLabel("Situação").selectOption("paid");
  await page.getByLabel("Data do pagamento").fill("2026-09-09");
  await page.getByLabel("Forma de pagamento").selectOption("pix");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(records.invoices[0]).toMatchObject({
    status: "paid",
    payment_method: "pix",
    paid_at: "2026-09-09",
  });
  await page.goto("/backoffice/gestao/reviews/1");
  await page.getByLabel("Aprovada para publicação").check();
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(page.getByRole("status")).toHaveText(/Cadastro salvo/);
  expect(records.reviews[0].is_approved).toBe(true);
});

test("equipe consulta acessos sem poder mudar permissões", async ({ page }) => {
  await managementApi(page, false);
  await page.goto("/backoffice/gestao/users/2");
  await expect(page.getByLabel("Permitir acesso ao backoffice")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Salvar cadastro" }),
  ).not.toBeVisible();
});

test("filtro de vencidas inclui cobranças abertas com vencimento passado", async ({
  page,
}) => {
  const { records } = await managementApi(page);
  records.invoices[0].due_date = "2020-01-01";
  await page.goto("/backoffice/gestao/invoices");
  await page.getByLabel("Situação", { exact: true }).selectOption("overdue");
  await expect(
    page.getByRole("table").getByText("Mensalidade setembro", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("table").getByText("Vencida", { exact: true }),
  ).toBeVisible();
});

test("esconder todas as categorias e empresas não recupera dados de demonstração", async ({
  page,
}) => {
  const { records } = await managementApi(page);
  records.categories.forEach((item) => (item.is_active = false));
  records.businesses.forEach((item) => (item.status = "inactive"));
  await page.goto("/");
  await expect(page.getByText("Nenhum comércio encontrado")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Alimentação", exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText("M Espetinhos", { exact: true }),
  ).not.toBeVisible();
});

test("protege alterações não salvas ao mudar de módulo", async ({ page }) => {
  await managementApi(page);
  await page.goto("/backoffice/gestao/businesses/m-espetinhos");
  await page.getByLabel("Nome", { exact: true }).fill("Nome ainda não salvo");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Categorias", exact: true })
    .click();
  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue(
    "Nome ainda não salvo",
  );
});

test("interface funciona em celular e não ultrapassa a largura da tela", async ({
  page,
}) => {
  await managementApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/backoffice");
  await expect(
    page.getByText("Empresas publicadas", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../output/backoffice-v2/mobile-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Estabelecimentos", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /M Espetinhos/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("visão geral e formulário completos em desktop", async ({ page }) => {
  await managementApi(page);
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/backoffice");
  await expect(
    page.getByText("Empresas publicadas", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../output/backoffice-v2/desktop-dashboard.png",
    fullPage: true,
  });
  await page.goto("/backoffice/gestao/businesses/barbearia");
  await expect(page.getByLabel("Subdomínio", { exact: true })).toHaveValue(
    "barbearia-alcantara",
  );
  await page.screenshot({
    path: "../output/backoffice-v2/business-editor.png",
    fullPage: true,
  });
});
