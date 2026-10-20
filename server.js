const express = require('express');
const dns = require('dns').promises;
const net = require('net');
const { chromium } = require('playwright');

const app = express();
const port = process.env.PORT || 10000;
const corsOrigins = String(process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAll = corsOrigins.includes('*');
  const allowed = allowAll || !requestOrigin || corsOrigins.includes(requestOrigin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowAll ? '*' : (requestOrigin || corsOrigins[0] || '*'));
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname));

let browserPromise = null;
const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true, args: ['--no-sandbox'] })
      .catch((error) => { browserPromise = null; throw error; });
  }
  return browserPromise;
};

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    return ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('10.') ||
      ip.startsWith('192.168.') || (ip.startsWith('172.') && Number(ip.split('.')[1]) >= 16 && Number(ip.split('.')[1]) <= 31);
  }
  if (net.isIPv6(ip)) return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:');
  return false;
}

async function safePublicUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('URL ไม่ถูกต้อง'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('รองรับเฉพาะ http:// หรือ https://');
  const addresses = await dns.lookup(url.hostname, { all: true });
  if (addresses.some(({ address }) => privateIp(address))) throw new Error('ไม่อนุญาตให้ตรวจ URL ภายในระบบหรือ localhost');
  return url.toString();
}

// Runs inside the target page. Only real <img> and <video> elements are collected.
// CSS background-image is deliberately excluded from the report.
const frameScript = () => {
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width >= 12 && rect.height >= 12 && style.display !== 'none' &&
      style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  };

  const token = (element) => [
    element.id,
    typeof element.className === 'string' ? element.className : '',
    element.getAttribute('role') || '',
    element.getAttribute('aria-label') || '',
    element.getAttribute('data-testid') || ''
  ].join(' ').toLowerCase();

  const meta = (element) => ({
    token: token(element),
    alt: element.getAttribute('alt') || '',
    id: element.id || '',
    className: typeof element.className === 'string' ? element.className : '',
    link: element.closest('a')?.href || ''
  });

  const source = (element) => {
    // currentSrc is the responsive asset actually selected by the browser.
    const candidates = [
      element.currentSrc,
      element.getAttribute('src'),
      element.querySelector?.('source[src]')?.src,
      element.getAttribute('data-src'),
      element.getAttribute('data-lazy-src'),
      element.getAttribute('data-original'),
      element.getAttribute('data-url')
    ].filter(Boolean);
    return candidates.find((value) => !String(value).startsWith('data:image/')) || '';
  };

  const popupParent = (element) => {
    let current = element;
    for (let i = 0; current && i < 7 && current !== document.body; i += 1, current = current.parentElement) {
      const rect = current.getBoundingClientRect();
      const style = getComputedStyle(current);
      const text = token(current);
      const zIndex = Number.parseInt(style.zIndex, 10) || 0;
      if (/popup|modal|dialog|lightbox|newsletter|cookie|consent|overlay|subscribe|announcement/i.test(text) ||
        (style.position === 'fixed' && zIndex >= 100 && rect.width > 250 && rect.height > 100)) return current;
    }
    return null;
  };

  const section = (element) => {
    const chain = [];
    let current = element;
    for (let i = 0; current && i < 6; i += 1, current = current.parentElement) chain.push(token(current));
    const text = chain.join(' ');
    if (/popup|modal|dialog|overlay|cookie|consent|lightbox/.test(text)) return 'Overlay / Dialog';
    if (/header|navbar|navigation|menu|logo/.test(text)) return 'Header / Navigation';
    if (/hero|banner|masthead|carousel|slider|spotlight|home[-_ ]?visual/.test(text)) return 'Banner';
    if (/news|article|press|event|content|blog|media/.test(text)) return 'News / Content';
    if (/gallery|portfolio|product|card|thumbnail|project/.test(text)) return 'Gallery / Portfolio';
    return 'Other images';
  };

  const extension = (value) => {
    try {
      const path = new URL(value, location.href).pathname.toLowerCase();
      return path.match(/\.([a-z0-9]{2,5})$/)?.[1]?.toUpperCase() || '';
    } catch { return ''; }
  };

  const items = [];
  const elements = new Set();
  const add = (element, kind) => {
    if (elements.has(element) || !visible(element)) return;
    const rect = element.getBoundingClientRect();
    const src = source(element);
    if (!src) return;
    const popup = popupParent(element);
    const absolute = new URL(src, location.href).href;
    elements.add(element);
    items.push({
      ...meta(element),
      kind,
      src: absolute,
      previewSrc: kind === 'video' ? (element.poster ? new URL(element.poster, location.href).href : absolute) : absolute,
      fileType: kind === 'video' ? 'VIDEO' : extension(absolute) || 'IMAGE',
      section: section(element),
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      naturalWidth: kind === 'video' ? (element.videoWidth || 0) : (element.naturalWidth || 0),
      naturalHeight: kind === 'video' ? (element.videoHeight || 0) : (element.naturalHeight || 0),
      visible: true,
      popupCandidate: Boolean(popup)
    });
  };

  document.querySelectorAll('img').forEach((element) => add(element, 'image'));
  document.querySelectorAll('video').forEach((element) => add(element, 'video'));
  items.sort((a, b) => a.renderedWidth * a.renderedHeight - b.renderedWidth * b.renderedHeight);
  items.forEach((item, index) => { item.index = index + 1; });
  return { items };
};

const hoverCandidates = () => [...document.querySelectorAll('a,button,[role="button"],[tabindex],.swiper-slide,.slick-slide')]
  .map((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height, visible: rect.width > 20 && rect.height > 20 && style.display !== 'none' && style.visibility !== 'hidden' };
  })
  .filter((item) => item.visible)
  .sort((a, b) => b.width * b.height - a.width * a.height)
  .slice(0, 18);

app.post('/api/scan', async (req, res) => {
  let context;
  try {
    const url = await safePublicUrl(String(req.body?.url || '').slice(0, 2000));
    const width = Math.max(320, Math.min(2400, Number(req.body?.viewport?.width) || 1920));
    const height = Math.max(480, Math.min(1800, Number(req.body?.viewport?.height) || 1080));
    const browser = await getBrowser();
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(850);

    // Scroll once to trigger lazy images, then return to the top for the report screenshot.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await page.waitForTimeout(120);

    // A short hover sweep catches carousel/hover-revealed image elements without making a full crawl.
    const points = await page.evaluate(hoverCandidates).catch(() => []);
    for (const point of points) {
      await page.mouse.move(point.x, point.y).catch(() => {});
      await page.waitForTimeout(55);
    }
    await page.waitForTimeout(160);

    const items = [];
    for (const frame of page.frames()) {
      try {
        const result = await frame.evaluate(frameScript);
        result.items.forEach((item) => items.push({ ...item, frameUrl: frame.url() }));
      } catch (_) { /* cross-origin or closed frame */ }
    }

    const unique = items.filter((item, index, all) => index === all.findIndex((candidate) =>
      candidate.src === item.src && candidate.frameUrl === item.frameUrl &&
      candidate.renderedWidth === item.renderedWidth && candidate.renderedHeight === item.renderedHeight));
    res.json({
      title: await page.title(),
      url,
      viewport: { width, height },
      items: unique
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'ไม่สามารถตรวจสอบเว็บไซต์นี้ได้' });
  } finally {
    if (context) await context.close();
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));
app.listen(port, '0.0.0.0', () => console.log(`Web Image Inspector listening on ${port}`));
