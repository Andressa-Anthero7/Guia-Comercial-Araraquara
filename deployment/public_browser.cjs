const { chromium, expect } = require('../frontend/node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const output = process.argv[2];
if (!output) throw new Error('Supply the evidence JSON path');
(async () => {
  const browser = await chromium.launch();
  const checks = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.route(/google-analytics|googletagmanager|connect\.facebook|facebook\.com\/tr/, route => route.abort());
      const page = await context.newPage();
      for (const url of [
        'https://guiacomararaquara.com.br/',
        'https://guiacomararaquara.com.br/anunciante/login',
        'https://guiacomararaquara.com.br/backoffice',
        'https://barbearia-alcantara.guiacomararaquara.com.br/',
        'https://m-espetinhos.guiacomararaquara.com.br/',
        'https://guiacomararaquara.com.br/?subdomain=empresa-ausente-verificacao',
      ]) {
        const errors = [];
        const listener = error => errors.push(error.name);
        page.on('pageerror', listener);
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        expect(response.status()).toBe(200);
        if (url.includes('empresa-ausente-verificacao')) {
          await expect(page.getByRole('heading', { name: 'Empresa não encontrada' })).toBeVisible();
          await expect(page.getByRole('link', { name: 'Encontrar empresas no guia' })).toHaveAttribute('href', 'https://guiacomararaquara.com.br');
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        expect(overflow).toBe(false);
        expect(errors).toEqual([]);
        checks.push({ url, width, status: 200, overflow, javascript_errors: errors });
        page.off('pageerror', listener);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), checks }, null, 2));
  }
  console.log(`${checks.length} public browser checks passed`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
