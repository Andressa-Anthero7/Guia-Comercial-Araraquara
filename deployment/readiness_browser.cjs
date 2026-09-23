// Authenticate only the existing, isolated audit accounts. No customer edits.
const { chromium, expect } = require('../frontend/node_modules/@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const origin = 'https://guiacomararaquara.com.br';
const accountFile = process.argv[2];
const output = process.argv[3];
if (!accountFile || !output) throw new Error('Usage: node readiness_browser.cjs private-accounts.json output.json');
const accounts = JSON.parse(fs.readFileSync(accountFile, 'utf8').replace(/^\uFEFF/, ''));
if (!accounts.admin.startsWith('audit-') || !accounts.advertiser.startsWith('audit-')) throw new Error('Expected isolated audit users');
(async () => {
  const browser = await chromium.launch();
  const checks = [];
  try {
    for (const role of ['advertiser', 'admin']) {
      for (const width of [1440, 390]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        await context.route(/google-analytics|googletagmanager|connect\.facebook|facebook\.com\/tr/, route => route.abort());
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.name));
        try {
          const login = role === 'advertiser' ? '/anunciante/login' : '/backoffice';
          await page.goto(origin + login);
          await page.getByLabel('Usuario', { exact: true }).fill(accounts[role]);
          await page.getByLabel('Senha', { exact: true }).fill(accounts.password);
          const response = page.waitForResponse(r => r.url().endsWith(role === 'advertiser' ? '/api/auth/advertiser/login/' : '/api/auth/login/') && r.request().method() === 'POST');
          await page.getByRole('button', { name: 'Entrar', exact: true }).click();
          expect((await response).status()).toBe(200);
          await expect(page.getByRole('button', { name: role === 'admin' ? 'Sair da conta' : 'Sair', exact: true })).toBeVisible();
          await page.reload();
          await expect(page.getByRole('button', { name: role === 'admin' ? 'Sair da conta' : 'Sair', exact: true })).toBeVisible();
          if (role === 'advertiser') {
            for (const section of ['', '/cadastro', '/estabelecimentos', '/anuncios', '/cupons', '/financeiro']) {
              await page.goto(origin + '/area-do-anunciante' + section);
              await expect(page.getByRole('button', { name: role === 'admin' ? 'Sair da conta' : 'Sair', exact: true })).toBeVisible();
              expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
            }
            expect((await page.request.get(origin + '/api/backoffice/businesses/')).status()).toBe(403);
          } else {
            expect((await page.request.get(origin + '/api/backoffice/businesses/')).status()).toBe(200);
          }
          await page.getByRole('button', { name: role === 'admin' ? 'Sair da conta' : 'Sair', exact: true }).click();
          if (role === 'admin') await page.goto(origin + '/backoffice');
          await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
          expect((await (await page.request.get(origin + '/api/auth/session/')).json()).is_authenticated).toBe(false);
          expect(errors).toEqual([]);
          checks.push({ role, width, status: 'passed', session_reload: true, logout: true });
        } finally { await context.close(); }
      }
    }
  } finally {
    await browser.close();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), checks }, null, 2));
  }
  console.log(JSON.stringify(checks));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
