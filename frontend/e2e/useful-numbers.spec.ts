import { expect, test } from "@playwright/test";

test("telefone só confirma cópia bem-sucedida e mantém alternativa após recusa", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ json: route.request().url().includes("/useful-numbers/")
    ? [{ id: 1, name: "Contato de teste", phone: "1633330000", description: "Atendimento", category: "service" }]
    : [] }));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: {
      writeText: async () => { throw new Error("Permissão negada"); },
    } });
  });
  await page.goto("/");
  await page.getByTitle("Copiar número", { exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Copie o número manualmente: 1633330000");
  await expect(page.getByTitle("Número copiado", { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href="tel:1633330000"]')).toBeVisible();
  await page.evaluate(() => { navigator.clipboard.writeText = async () => {}; });
  await page.getByTitle("Copiar número", { exact: true }).click();
  await expect(page.getByTitle("Número copiado", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
