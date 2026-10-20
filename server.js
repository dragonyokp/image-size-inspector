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

// Runs inside the target page. Collect only loaded/painted assets and use the
// same visibility, clipping, hover, and background rules as the Extension.
const frameScript = () => {
  const visible = (element, rect) => {
    if (!element || !rect || rect.width < 12 || rect.height < 12) return false;
    for (let current = element; current && current !== document.documentElement; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) <= 0) return false;
    }
    return true;
  };

  const visualRect = (element) => {
    if (!element?.getBoundingClientRect) return null;
    const raw = element.getBoundingClientRect();
    let left = raw.left;
    let top = raw.top;
    let right = raw.right;
    let bottom = raw.bottom;
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const clipsX = !['visible', 'unset', 'initial'].includes(style.overflowX);
      const clipsY = !['visible', 'unset', 'initial'].includes(style.overflowY);
      if (!clipsX && !clipsY) continue;
      const clip = parent.getBoundingClientRect();
      if (clipsX) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
      if (clipsY) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
    }
    return { left, top, right, bottom, width: right - left, height: bottom - top };
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

  const absolute = (value) => {
    try { return new URL(value, location.href).href; } catch { return ''; }
  };

  const imageSource = (element) => [element.currentSrc, element.getAttribute('src')]
    .filter(Boolean).find((value) => !String(value).startsWith('data:image/')) || '';

  const videoSource = (element) => element.currentSrc || element.getAttribute('src') ||
    element.querySelector?.('source[src]')?.src || element.poster || '';

  const backgroundSource = (element) => {
    const value = getComputedStyle(element).backgroundImage || '';
    return value.match(/url\((['"]?)(.*?)\1\)/i)?.[2] || '';
  };

  const looksLikeHero = (element) => {
    const parts = [];
    for (let current = element; current && parts.length < 8; current = current.parentElement) {
      const className = typeof current.className === 'string' ? current.className : '';
      parts.push(`${current.id || ''} ${className}`.toLowerCase());
    }
    return /hero|banner|masthead|carousel|slider|swiper|spotlight|home[-_ ]?visual/.test(parts.join(' '));
  };

  const backgroundAllowed = (element, rawRect) => {
    const sourceValue = backgroundSource(element);
    if (!sourceValue || !rawRect) return false;
    const fullWidth = rawRect.width >= window.innerWidth * 0.92;
    const heroLike = looksLikeHero(element);
    if ((fullWidth && !heroLike) || rawRect.height > window.innerHeight * 1.15) return false;
    if (fullWidth && rawRect.height < 160) return false;
    return true;
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
    if (elements.has(element)) return;
    const rawRect = element.getBoundingClientRect();
    const rect = visualRect(element);
    if (!visible(element, rect)) return;
    if (kind === 'image' && (!element.complete || !element.naturalWidth || !element.naturalHeight)) return;
    if (kind === 'background' && !backgroundAllowed(element, rawRect)) return;
    const sourceValue = kind === 'image' ? imageSource(element) : kind === 'video' ? videoSource(element) : backgroundSource(element);
    const src = absolute(sourceValue);
    if (!src) return;
    const popup = popupParent(element);
    elements.add(element);
    items.push({
      ...meta(element),
      kind,
      src,
      // A video source is not an image. Keep only its poster as the preview
      // image; the report will render the actual source in a <video> element.
      previewSrc: kind === 'video' ? absolute(element.poster || '') : src,
      fileType: kind === 'video' ? 'VIDEO' : extension(src) || 'IMAGE',
      section: section(element),
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      naturalWidth: kind === 'video' ? (element.videoWidth || 0) : kind === 'background' ? 0 : (element.naturalWidth || 0),
      naturalHeight: kind === 'video' ? (element.videoHeight || 0) : kind === 'background' ? 0 : (element.naturalHeight || 0),
      top: Math.round(rawRect.top + window.scrollY),
      left: Math.round(rawRect.left + window.scrollX),
      visible: true,
      popupCandidate: Boolean(popup)
    });
  };

  document.querySelectorAll('img').forEach((element) => add(element, 'image'));
  document.querySelectorAll('video').forEach((element) => add(element, 'video'));
  document.querySelectorAll('*').forEach((element) => {
    if (backgroundSource(element)) add(element, 'background');
  });
  items.sort((a, b) => a.top - b.top || a.left - b.left);
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
    page.setDefaultTimeout(8000);

    // Do not wait for font, media, or websocket downloads. The video element and
    // its poster are still detected from the rendered DOM, without downloading a
    // potentially huge hero video during a report scan.
    await page.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (['font', 'media', 'websocket'].includes(type)) return route.abort();
      return route.continue();
    });

    // Render's public request window is short. Start at navigation commit, then allow
    // the first screen to settle briefly instead of waiting for every site request.
    await page.goto(url, { waitUntil: 'commit', timeout: 9000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded', { timeout: 4500 }).catch(() => {});
    await page.waitForTimeout(450);

    // Several supported sites render their cards after DOMContentLoaded (Vue,
    // Swiper and lazy sections are common examples). Wait for a cheap DOM/size
    // signature only; do not calculate computed styles for every element here.
    // The expensive visual scan happens once, after the lazy-load sweep.
    let previousSignature = '';
    let stablePasses = 0;
    for (let pass = 0; pass < 7 && stablePasses < 2; pass += 1) {
      const signature = await page.evaluate(() => {
        return [
          document.readyState,
          document.documentElement.scrollHeight,
          document.images.length,
          document.querySelectorAll('video').length
        ].join('::');
      }).catch(() => '');
      stablePasses = signature && signature === previousSignature ? stablePasses + 1 : 0;
      previousSignature = signature;
      if (stablePasses < 2) await page.waitForTimeout(180);
    }

    // A single DOM snapshot misses lazy-loaded cards, carousel slides and CSS
    // backgrounds. Walk through the page in viewport-sized steps, trigger the
    // same hover states at each step, and merge the results from every pass.
    const scanPositions = await page.evaluate(() => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const step = Math.max(520, Math.round(window.innerHeight * 1.05));
      const positions = [];
      for (let y = 0; y <= max && positions.length < 8; y += step) positions.push(y);
      if (!positions.includes(max)) positions.push(max);
      return positions;
    }).catch(() => [0]);

    for (const scrollY of scanPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY).catch(() => {});
      await page.waitForTimeout(120);

      const points = await page.evaluate(hoverCandidates).catch(() => []);
      for (const point of points.slice(0, 4)) {
        await page.mouse.move(point.x, point.y).catch(() => {});
        await page.waitForTimeout(20);
      }
      await page.waitForTimeout(60);
    }

    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

    // The DOM now contains the assets revealed by the sweep. Run the expensive
    // visibility/clipping/background pass once instead of once per scroll step.
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
