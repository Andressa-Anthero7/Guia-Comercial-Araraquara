import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

test("cadastro com foto e contatos distintos, aprovação, galeria e página pública com API real", async ({ page, playwright }) => {
  await page.goto("/");
  await page.locator("#register-business-btn-desktop").click();
  await page.locator("#form-business-name").fill("Empresa de integração");
  await page.locator("#form-business-desc").fill("Cadastro criado pelo navegador para verificar fotos e contatos.");
  await page.locator("#form-business-phone").fill("(16) 3333-1234");
  await page.locator("#form-business-whatsapp").fill("(16) 99999-1234");
  await page.locator("#form-business-address").fill("Rua Integração, 123");
  await page.getByRole("button", { name: "Enviar Foto do Estabelecimento" }).click();
  await page.locator('input[type="file"]').setInputFiles(path.resolve("public/anuncios/espetinhos.jpeg"));
  await expect(page.getByAltText("Prévia da capa")).toBeVisible();
  const submitted = page.waitForResponse((response) => response.url().endsWith("/api/businesses/") && response.request().method() === "POST");
  await page.locator("#form-submit-btn").click();
  const response = await submitted;
  expect(response.status()).toBe(201);
  const created = await response.json();
  expect(created.phone).toBe("(16) 3333-1234");
  expect(created.phone_whatsapp).toBe("5516999991234");
  expect(created.status).toBe("pending");
  await expect(page.getByText(/enviada.*analise/i)).toBeVisible();
  expect((await page.request.get(created.image_url)).status()).toBe(404);

  const admin = await playwright.request.newContext({ baseURL: "http://127.0.0.1:8001" });
  try {
    await admin.get("/api/auth/csrf/");
    const login = await admin.post("/api/auth/login/", { data: { username: "portal-e2e-admin", password: "local-e2e-password" } });
    expect(login.ok()).toBeTruthy();
    const token = (await admin.storageState()).cookies.find((cookie) => cookie.name === "csrftoken")!.value;
    const saved = await (await admin.get(`/api/backoffice/businesses/${created.slug}/`)).json();
    expect(saved.image_url).toMatch(/^data:image\/webp;base64,/);
    const gallery = readFileSync(path.resolve("public/anuncios/top-carros.jpeg"));
    const published = await admin.patch(`/api/backoffice/businesses/${created.slug}/`, {
      headers: { "X-CSRFToken": token },
      data: { status: "active", plan_type: "paid", public_subdomain: "empresa-integracao", images: [saved.image_url, `data:image/jpeg;base64,${gallery.toString("base64")}`] },
    });
    expect(published.status()).toBe(200);
    const catalog = await (await page.request.get(`/api/businesses/${created.slug}/`)).json();
    expect(catalog.images).toHaveLength(2);
    expect(catalog.images[0].image).toBe(catalog.image_url);
    expect(JSON.stringify(catalog)).not.toContain("base64");
    const picture = await page.request.get(catalog.images[1].image);
    expect(picture.status()).toBe(200);
    expect(await picture.body()).toEqual(gallery);
    await page.goto("/?subdomain=empresa-integracao");
    await expect(page.getByRole("heading", { name: "Empresa de integração", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Falar no WhatsApp", exact: true })).toHaveAttribute("href", /^https:\/\/wa\.me\/5516999991234\?/);
    await expect(page.getByText("(16) 3333-1234", { exact: true })).toBeVisible();
    const photo = page.getByAltText("Empresa de integração - foto 1", { exact: true });
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    const reviewForm = page.getByRole("form", { name: "Deixe sua avaliação" });
    await reviewForm.getByLabel("Seu Nome", { exact: true }).fill("Cliente de integração");
    await reviewForm.getByRole("button", { name: "4 estrelas", exact: true }).click();
    await reviewForm.getByLabel("Seu Comentário").fill("Avaliação enviada pela página da empresa.");
    const reviewResponse = page.waitForResponse((response) => response.url().endsWith("/api/reviews/") && response.request().method() === "POST");
    await reviewForm.getByRole("button", { name: "Enviar Avaliação" }).click();
    expect((await reviewResponse).status()).toBe(201);
    await expect(reviewForm.getByRole("status")).toContainText("publicada após a moderação");
    const pendingReviews = await (await admin.get("/api/backoffice/reviews/")).json();
    const submittedReview = pendingReviews.find((review: { business: number }) => review.business === created.id);
    expect(submittedReview).toMatchObject({ author_name: "Cliente de integração", rating: 4, is_approved: false });
    const publicReviews = await (await page.request.get("/api/reviews/")).json();
    expect(publicReviews.some((review: { id: number }) => review.id === submittedReview.id)).toBe(false);
    await page.goto(`/?empresa=${created.slug}`);
    await expect(page.getByRole("region", { name: "Galeria da empresa" }).getByRole("img")).toHaveCount(1);
    await expect(page.locator('#business-detail-modal a[href^="https://wa.me/"]')).toHaveAttribute("href", /^https:\/\/wa\.me\/5516999991234\?/);
  } finally {
    await admin.dispose();
  }
});

test("contato anterior à separação dos campos continua disponível", async ({ page }) => {
  await page.goto("/?empresa=contato-legado-de-teste");
  await expect(page.locator("#business-detail-modal")).toBeVisible();
  await expect(page.locator('#business-detail-modal a[href^="https://wa.me/"]')).toHaveAttribute("href", /^https:\/\/wa\.me\/5516988887777\?/);
  await expect(page.locator("#business-detail-modal").getByText("16988887777", { exact: true })).toBeVisible();
});

test("anunciante mantém sessão real e consegue entrar novamente após perder os cookies", async ({ page }) => {
  await page.goto("/anunciante/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/anunciante\/login$/);
  const signIn = async (path = "/area-do-anunciante") => {
    await page.getByLabel("Usuario", { exact: true }).fill("portal-e2e-advertiser");
    await page.getByLabel("Senha", { exact: true }).fill("local-e2e-password");
    const loginResponse = page.waitForResponse((response) => response.url().endsWith("/api/auth/advertiser/login/") && response.request().method() === "POST");
    const portalResponse = page.waitForResponse((response) => response.url().endsWith("/api/advertiser/portal/"));
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    expect((await loginResponse).status()).toBe(200);
    expect((await portalResponse).status()).toBe(200);
    await expect(page.getByText("Anunciante de integração", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(path + "$"));
  };
  await signIn();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Anunciante de integração", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/area-do-anunciante$/);
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Contato legado de teste", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar dados", exact: true }).click();
  await page.getByLabel("Complemento", { exact: true }).fill("Sala de teste");
  await page.getByLabel("Descrição *", { exact: true }).fill("Descrição preenchida no cadastro de integração.");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Dados do estabelecimento atualizados.");
  const updatedBusiness = await (await page.request.get("/api/advertiser/portal/")).json();
  expect(updatedBusiness.businesses[0].complement).toBe("Sala de teste");
  await page.getByRole("link", { name: "Cadastro", exact: true }).click();
  await page.getByLabel("Responsável", { exact: true }).fill("Contato de teste");
  await page.getByRole("button", { name: "Salvar dados", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Cadastro atualizado.");
  const updatedProfile = await (await page.request.get("/api/advertiser/portal/")).json();
  expect(updatedProfile.advertiser.contact_name).toBe("Contato de teste");
  await page.getByRole("link", { name: "Estabelecimentos", exact: true }).click();
  expect((await page.request.get("/api/backoffice/businesses/")).status()).toBe(403);
  await page.context().clearCookies();
  await page.getByRole("button", { name: "Atualizar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Sua sessão expirou");
  await expect(page).toHaveURL(/\/anunciante\/login\?next=/);
  await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toHaveCount(0);
  await signIn("/area-do-anunciante/estabelecimentos");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/anunciante\/login$/);
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  expect((await (await page.request.get("/api/auth/session/")).json()).is_authenticated).toBe(false);
});
