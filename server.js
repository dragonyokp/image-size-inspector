const express = require('express');
const path = require('path');
const dns = require('dns').promises;
const net = require('net');
const { chromium } = require('playwright');

const app = express();
const port = process.env.PORT || 10000;
app.use(express.json({ limit: '20kb' }));
app.use(express.static(__dirname));

function privateIp(ip) {
  if (net.isIPv4(ip)) return ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('10.') || ip.startsWith('192.168.') || (ip.startsWith('172.') && Number(ip.split('.')[1]) >= 16 && Number(ip.split('.')[1]) <= 31);
  if (net.isIPv6(ip)) return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:');
  return false;
}

async function safePublicUrl(raw) {
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error('URL ไม่ถูกต้อง'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http:// หรือ https://');
  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (addresses.some(x => privateIp(x.address))) throw new Error('ไม่อนุญาตให้ตรวจ URL ภายในระบบหรือ localhost');
  return parsed.toString();
}

app.post('/api/scan', async (req, res) => {
  let browser;
  try {
    const url = await safePublicUrl(String(req.body?.url || '').slice(0, 2000));
    const width = Math.max(320, Math.min(2400, Number(req.body?.viewport?.width) || 1440));
    const height = Math.max(480, Math.min(1800, Number(req.body?.viewport?.height) || 900));
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const data = await page.evaluate(() => {
      const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0; };
      const items = [];
      document.querySelectorAll('img').forEach((el, index) => { const r = el.getBoundingClientRect(); items.push({ kind: 'image', index, src: el.currentSrc || el.src || '', alt: el.alt || '', renderedWidth: Math.round(r.width), renderedHeight: Math.round(r.height), naturalWidth: el.naturalWidth || 0, naturalHeight: el.naturalHeight || 0, visible: visible(el) }); });
      document.querySelectorAll('video').forEach((el, index) => { const r = el.getBoundingClientRect(); items.push({ kind: 'video', index, src: el.poster || el.currentSrc || '', alt: '', renderedWidth: Math.round(r.width), renderedHeight: Math.round(r.height), naturalWidth: el.videoWidth || 0, naturalHeight: el.videoHeight || 0, visible: visible(el) }); });
      document.querySelectorAll('*').forEach((el, index) => { const bg = getComputedStyle(el).backgroundImage; const match = bg && bg !== 'none' ? bg.match(/url\(["']?(.*?)["']?\)/) : null; if (match && visible(el)) { const r = el.getBoundingClientRect(); items.push({ kind: 'background', index, src: match[1], alt: '', renderedWidth: Math.round(r.width), renderedHeight: Math.round(r.height), naturalWidth: 0, naturalHeight: 0, visible: true }); } });
      return { title: document.title, url: location.href, viewport: { width: innerWidth, height: innerHeight }, items };
    });
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message || 'ไม่สามารถตรวจสอบเว็บไซต์นี้ได้' });
  } finally { if (browser) await browser.close(); }
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(port, '0.0.0.0', () => console.log(`Web Image Inspector listening on ${port}`));
