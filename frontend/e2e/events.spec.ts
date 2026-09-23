import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ json: route.request().url().endsWith("/api/events/")
    ? [{ id: 7, title: "Feira de teste", schedule_text: "Sábado às 10h", location: "Praça de teste", description: "Programação local", image_url: "" }] : [] }));
});

test("evento salva interesse pessoal no navegador sem contagem fictícia", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("pessoas interessadas")).toHaveCount(0);
  await page.getByRole("button", { name: "Salvar evento", exact: true }).click();
  await expect(page.getByRole("button", { name: "Evento salvo", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByText("Salvo neste navegador", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Evento salvo", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Salvar evento", exact: true })).toHaveAttribute("aria-pressed", "false");
});

test("evento informa falha ao salvar e permite tentar novamente", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error("Blocked"); }; });
  await page.goto("/");
  await page.getByRole("button", { name: "Salvar evento", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível salvar");
  await expect(page.getByRole("button", { name: "Salvar evento", exact: true })).toHaveAttribute("aria-pressed", "false");
});
