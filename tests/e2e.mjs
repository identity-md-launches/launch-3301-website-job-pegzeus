import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const [distArg = "dist", shotArg = "test/scratch/shots", mode = "tba"] = process.argv.slice(2);
const distDir = path.resolve(distArg);
const shotDir = path.resolve(shotArg);
fs.mkdirSync(shotDir, { recursive: true });
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!u.startsWith('/preview/')) { res.writeHead(404); return res.end(); }
  let f = path.join(distDir, u.slice('/preview/'.length) || 'index.html');
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/preview/`;

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };
const browser = await chromium.launch();
const errors = [], failed = [], external = [];

async function open(width, height = 844) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${width}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${width}: ${e.message}`));
  page.on('requestfailed', (r) => failed.push(`${width}: ${r.url()}`));
  await page.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(base)) return route.continue();
    external.push(u); return route.abort();
  });
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${width}: ${r.status()} ${r.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page };
}

if (mode === 'tba') {
  // Static scan of the export for any contract address or wallet code.
  const files = [];
  const walk = (d) => fs.readdirSync(d).forEach((n) => { const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p) : files.push(p); });
  walk(distDir);
  const textFiles = files.filter((f) => /\.(html|css|js)$/.test(f));
  const blob = textFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  check('no 0x address in export', !/0x[0-9a-fA-F]{40}/.test(blob));
  check('no wallet/signing code in export', !/personal_sign|eth_requestAccounts|window\.ethereum|walletconnect|wagmi|rainbowkit/i.test(blob));
  check('no absolute /assets URLs (relative only)', !/(src|href)="\/(?!\/)/.test(fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')));

  for (const width of [320, 390, 1440]) {
    const { ctx, page } = await open(width);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    check(`no horizontal overflow at ${width}`, m.sw <= m.cw, JSON.stringify(m));
    await page.screenshot({ path: `${shotDir}/first-${width}.png` });
    await page.screenshot({ path: `${shotDir}/full-${width}.png`, fullPage: true });
    if (width === 390) {
      const fold = await page.evaluate(() => {
        const b = [...document.querySelectorAll('.hero a.btn-primary')][0].getBoundingClientRect();
        const ca = document.querySelector('.hero .ca-row').getBoundingClientRect();
        const h1 = document.querySelector('h1').getBoundingClientRect();
        return { buyBottom: b.bottom, caBottom: ca.bottom, h1Top: h1.top, vh: innerHeight };
      });
      check('390: Buy on IMD and CA row inside first screen', fold.buyBottom <= fold.vh && fold.caBottom <= fold.vh, JSON.stringify(fold));
    }
    if (width === 1440) {
      const meta = await page.evaluate(() => ({
        title: document.title,
        favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
        desc: document.querySelector('meta[name="description"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
      }));
      check('share metadata present', meta.title && meta.favicon && meta.desc && meta.ogTitle && meta.ogImage, JSON.stringify(meta));
      const fav = await page.request.get(new URL(meta.favicon, base).href); check('favicon resolves', fav.ok());
      const og = await page.request.get(new URL(meta.ogImage, base).href); check('og:image resolves', og.ok());

      const d = await page.evaluate(() => {
        const t = (s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim();
        const hrefs = (s) => [...document.querySelectorAll(s)].map((a) => a.getAttribute('href'));
        const buy = [...document.querySelectorAll('a')].filter((a) => /Buy on IMD/.test(a.textContent)).map((a) => a.getAttribute('href'));
        return {
          heroCA: t('.hero .ca-label'),
          copyDisabled: document.querySelector('#copy-ca').disabled,
          heroX: hrefs('.hero a').filter((h) => h === 'https://x.com/pegzeus').length,
          footerX: hrefs('footer a').filter((h) => h === 'https://x.com/pegzeus').length,
          footerBuy: hrefs('footer a').includes('https://imd.fun'),
          buy,
          disclaimer: [...document.querySelectorAll('footer p')].some((p) => p.textContent.trim() === 'Made by agents. Not audited. Trade at your own risk.'),
          placeholders: ['{{SUPPLY}}', '{{LIQUIDITY}}', '{{AGENTS}}', '{{REQUESTER}}'].every((p) => document.querySelector('#tokenomics').textContent.includes(p)),
          notLive: /not live data/i.test(t('#tokenomics')),
          forms: document.querySelectorAll('form, input, textarea, select').length,
          thesisImgs: document.querySelectorAll('#thesis img, #thesis canvas').length,
          thesisTitle: t('#thesis-title'),
          pinned: hrefs('#thesis a').includes('https://x.com/pegzeus/status/2106508700391264563'),
          bricks: [...document.querySelectorAll('.era-now .brick')].map((b) => b.textContent.trim()),
          caTexts: [...document.querySelectorAll('[data-ca]')].map((e) => e.textContent),
          forbiddenLinks: hrefs('a').filter((h) => /etherscan|basescan|github|dexscreener/i.test(h)),
          h1count: document.querySelectorAll('h1').length,
          imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
        };
      });
      check('hero shows "CA: TBA"', d.heroCA === 'CA: TBA', d.heroCA);
      check('Copy CA disabled', d.copyDisabled);
      check('hero links x.com/pegzeus', d.heroX >= 1, String(d.heroX));
      check('footer links x.com/pegzeus', d.footerX >= 1);
      check('footer links imd.fun', d.footerBuy);
      check('every Buy on IMD -> https://imd.fun', d.buy.length >= 3 && d.buy.every((h) => h === 'https://imd.fun'), JSON.stringify(d.buy));
      check('exact footer disclaimer', d.disclaimer);
      check('tokenomics placeholders + not live label', d.placeholders && d.notLive);
      check('no form controls', d.forms === 0, String(d.forms));
      check('thesis has no bitmap', d.thesisImgs === 0);
      check('thesis title', d.thesisTitle === 'transfer() ⊂ execute() ⊂ produce()', d.thesisTitle);
      check('thesis links pinned post', d.pinned);
      check('imd stack bricks', JSON.stringify(d.bricks) === JSON.stringify(['audio', 'ipfs', 'hook', 'bond', 'auction', 'pool', 'token', 'vault', 'oracle', '$ → $']), JSON.stringify(d.bricks));
      check('all CA slots read TBA', d.caTexts.every((t) => t === 'TBA'), JSON.stringify(d.caTexts));
      check('no explorer/repo links', d.forbiddenLinks.length === 0, JSON.stringify(d.forbiddenLinks));
      check('one h1, all imgs have alt', d.h1count === 1 && d.imgsNoAlt === 0);

      // Keyboard: skip link first, moves focus to main.
      await page.keyboard.press('Tab');
      const first = await page.evaluate(() => document.activeElement.textContent.trim());
      check('skip link is first focusable', first === 'Skip to content', first);
      await page.keyboard.press('Enter');
      const afterSkip = await page.evaluate(() => document.activeElement.id);
      check('skip link focuses main', afterSkip === 'main', afterSkip);
      // Copy CA disabled is skipped by Tab; click does nothing.
      await page.click('#copy-ca', { force: true });
      const status = await page.textContent('#copy-ca-status');
      check('disabled Copy CA does not announce', status === '', status);
      // Nav anchor.
      await page.click('.site-nav a[href="#thesis"]');
      await page.waitForTimeout(900);
      const nav = await page.evaluate(() => ({ hash: location.hash, top: Math.round(document.querySelector('#thesis').getBoundingClientRect().top) }));
      check('nav link scrolls to thesis', nav.hash === '#thesis' && Math.abs(nav.top) <= 2, JSON.stringify(nav));
      // Focus ring visible on primary button
      await page.evaluate(() => { window.scrollTo(0, 0); document.body.focus(); });
      await page.goto(base, { waitUntil: 'networkidle' });
      const order = [];
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => (document.activeElement.textContent || '').replace(/\s+/g, ' ').trim())); }
      check('Tab order reaches Buy on IMD after nav, skips disabled Copy CA', order.includes('Buy on IMD') && !order.includes('Copy CA'), order.join(' | '));
      await page.goto(base, { waitUntil: 'networkidle' });
      for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.activeElement.textContent.trim() === 'Buy on IMD')) break; }
      const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`; });
      check('keyboard focus ring on Buy on IMD is 3px solid', /^solid 3px/.test(ring), ring);
      await page.screenshot({ path: `${shotDir}/focus-buy-1440.png`, clip: { x: 100, y: 380, width: 700, height: 240 } });
    }
    await ctx.close();
  }
} else {
  // CA-set variant (scratch build with a synthetic address).
  const { ctx, page } = await open(390);
  const d = await page.evaluate(() => ({ ca: document.querySelector('.hero .ca-label').textContent.replace(/\s+/g, ' ').trim(), disabled: document.querySelector('#copy-ca').disabled }));
  check('CA variant shows address', /^CA: 0x[0-9a-fA-F]{40}$/.test(d.ca), d.ca);
  check('CA variant enables Copy CA', !d.disabled);
  await page.click('#copy-ca');
  await page.waitForTimeout(100);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  const status = await page.textContent('#copy-ca-status');
  check('Copy CA writes clipboard', /^0x[0-9a-fA-F]{40}$/.test(clip) && d.ca.endsWith(clip), clip);
  check('Copy CA announces status', status === 'Copied the contract address.', status);
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check('CA variant no overflow at 390', m.sw <= m.cw, JSON.stringify(m));
  await page.screenshot({ path: `${shotDir}/ca-variant-390.png` });
  await ctx.close();
}

check('no console/page errors', errors.length === 0, errors.join(' | '));
check('no failed local requests', failed.filter((f) => f.includes('127.0.0.1')).length === 0, failed.join(' | '));
await browser.close(); server.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail && !r.ok ? '  -> ' + r.detail : ''}`);
console.log(`external requests blocked: ${[...new Set(external)].length}`);
const fails = results.filter((r) => !r.ok).length;
console.log(`${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
