(() => {
  if (window.__optiwiseAssetInspectorLoaded) return;
  window.__optiwiseAssetInspectorLoaded = true;

  const state = {
    enabled: false,
    items: [],
    host: null,
    shadow: null,
    activeItem: null,
    pointerX: 0,
    pointerY: 0,
    observer: null,
    refreshTimer: null,
    lastRefresh: 0,
    lastTarget: null,
    backgroundCache: new WeakMap(),
    listenersInstalled: false
  };

  const ratio = (width, height) => {
    if (!width || !height) return '—';
    return `${(Math.max(width, height) / Math.min(width, height)).toFixed(2)}:1`;
  };

  const extension = (source) => {
    try {
      const pathname = new URL(source, location.href).pathname.toLowerCase();
      const match = pathname.match(/\.([a-z0-9]{2,5})$/);
      return match ? match[1].toUpperCase() : '';
    } catch {
      return '';
    }
  };

  const typeFor = (item) => item.kind === 'video' ? 'VIDEO' : extension(item.source) || 'IMAGE';

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

    // Respect clipping parents. A carousel/card can have a larger DOM box
    // while only part of the asset is actually painted and visible.
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const clipsX = !['visible', 'unset', 'initial'].includes(style.overflowX);
      const clipsY = !['visible', 'unset', 'initial'].includes(style.overflowY);
      if (!clipsX && !clipsY) continue;
      const clip = parent.getBoundingClientRect();
      if (clipsX) {
        left = Math.max(left, clip.left);
        right = Math.min(right, clip.right);
      }
      if (clipsY) {
        top = Math.max(top, clip.top);
        bottom = Math.min(bottom, clip.bottom);
      }
    }

    left = Math.max(0, left);
    top = Math.max(0, top);
    right = Math.min(window.innerWidth, right);
    bottom = Math.min(window.innerHeight, bottom);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };

  const labelFor = (element) => {
    const value = element.getAttribute('alt') || element.getAttribute('aria-label') ||
      element.getAttribute('title') || element.className || element.id || '';
    return String(value).replace(/\s+/g, ' ').trim().slice(0, 100);
  };

  const sectionFor = (element) => {
    const chain = [];
    let current = element;
    for (let i = 0; current && i < 6; i += 1, current = current.parentElement) {
      chain.push(`${current.id || ''} ${typeof current.className === 'string' ? current.className : ''}`.toLowerCase());
    }
    const text = chain.join(' ');
    if (/popup|modal|dialog|overlay|cookie|consent|lightbox/.test(text)) return 'Overlay / Dialog';
    if (/header|navbar|navigation|menu|logo/.test(text)) return 'Header / Navigation';
    if (/hero|banner|masthead|carousel|slider|spotlight|home[-_ ]?visual/.test(text)) return 'Banner';
    if (/news|article|press|event|content|blog|media/.test(text)) return 'News / Content';
    if (/gallery|portfolio|product|card|thumbnail|project/.test(text)) return 'Gallery / Portfolio';
    return 'Other images';
  };

  const imageSource = (element) => {
    // Only use a source that the browser is actually rendering. Lazy-load hints
    // such as data-src are not visible assets yet and can point to floating,
    // unloaded images elsewhere in the DOM.
    const candidates = [
      element.currentSrc,
      element.getAttribute('src')
    ].filter(Boolean);
    return candidates.find((value) => !String(value).startsWith('data:image/')) || '';
  };

  const videoSource = (element) => {
    const source = element.currentSrc || element.getAttribute('src') || element.querySelector('source[src]')?.src || '';
    return source || element.poster || '';
  };

  const absolute = (source) => {
    try { return new URL(source, location.href).href; } catch { return ''; }
  };

  const backgroundSource = (element) => {
    if (!element || element === document.body || element === document.documentElement) return '';
    const value = getComputedStyle(element).backgroundImage || '';
    const match = value.match(/url\((['"]?)(.*?)\1\)/i);
    return match?.[2] || '';
  };

  const looksLikeHero = (element) => {
    const parts = [];
    for (let current = element; current && parts.length < 8; current = current.parentElement) {
      const className = typeof current.className === 'string' ? current.className : '';
      parts.push(`${current.id || ''} ${className}`.toLowerCase());
    }
    return /hero|banner|masthead|carousel|slider|swiper|spotlight|home[-_ ]?visual/.test(parts.join(' '));
  };

  const readItem = (item) => {
    if (!item?.element?.isConnected) return false;
    const rect = visualRect(item.element);
    if (!visible(item.element, rect)) return false;
    item.renderedWidth = Math.round(rect.width);
    item.renderedHeight = Math.round(rect.height);
    item.originalWidth = item.kind === 'video'
      ? (item.element.videoWidth || item.originalWidth || 0)
      : (item.element.naturalWidth || item.originalWidth || 0);
    item.originalHeight = item.kind === 'video'
      ? (item.element.videoHeight || item.originalHeight || 0)
      : (item.element.naturalHeight || item.originalHeight || 0);
    item.section = sectionFor(item.element);
    return true;
  };

  const addItem = (items, element, kind) => {
    if (kind === 'image' && (!element.complete || !element.naturalWidth || !element.naturalHeight)) return;
    const source = absolute(kind === 'video' ? videoSource(element) : imageSource(element));
    const rect = element.getBoundingClientRect();
    if (!source || !visible(element, rect)) return;

    const item = {
      key: `${kind}|${source}`,
      element,
      source,
      previewSource: kind === 'video' ? absolute(element.poster || source) : source,
      kind,
      originalWidth: kind === 'video' ? (element.videoWidth || 0) : (element.naturalWidth || 0),
      originalHeight: kind === 'video' ? (element.videoHeight || 0) : (element.naturalHeight || 0),
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      section: sectionFor(element),
      label: labelFor(element),
      type: kind === 'video' ? 'VIDEO' : typeFor({ kind, source }),
      top: Math.round(rect.top + window.scrollY),
      left: Math.round(rect.left + window.scrollX)
    };

    if (items.some((existing) => existing.element === element)) return;
    items.push(item);
  };

  const scanPage = () => {
    const items = [];
    document.querySelectorAll('img').forEach((element) => addItem(items, element, 'image'));
    document.querySelectorAll('video').forEach((element) => addItem(items, element, 'video'));
    items.sort((a, b) => a.top - b.top || a.left - b.left);
    items.forEach((item, index) => { item.index = index + 1; });
    return items;
  };

  const backgroundItemFor = (element) => {
    const source = absolute(backgroundSource(element));
    const rawRect = element?.getBoundingClientRect?.();
    const rect = visualRect(element);
    if (!source || !rawRect || !rect || !visible(element, rect)) return null;

    // Backgrounds are allowed only for local visual tiles. Full-width or
    // page-sized section backgrounds are layout decoration and are ignored.
    const fullWidth = rawRect.width >= window.innerWidth * 0.92;
    const heroLike = looksLikeHero(element);
    // Full-width media is valid only when it belongs to a hero/banner/carousel.
    // This keeps the header and generic page sections out of the inspector.
    if ((fullWidth && !heroLike) || rawRect.height > window.innerHeight * 1.15) return null;
    if (fullWidth && rawRect.height < 160) return null;

    const cached = state.backgroundCache.get(element);
    if (cached?.source === source) {
      return readItem(cached) ? cached : null;
    }

    const item = {
      key: `background|${source}`,
      element,
      source,
      previewSource: source,
      kind: 'background',
      originalWidth: 0,
      originalHeight: 0,
      renderedWidth: Math.round(rect.width),
      renderedHeight: Math.round(rect.height),
      section: sectionFor(element),
      label: labelFor(element),
      type: typeFor({ kind: 'background', source }),
      top: Math.round(rect.top + window.scrollY),
      left: Math.round(rect.left + window.scrollX)
    };
    state.backgroundCache.set(element, item);
    return item;
  };

  const backgroundAtPoint = (x, y) => {
    if (!document.elementsFromPoint) return null;
    const candidates = [];
    for (const element of document.elementsFromPoint(x, y)) {
      if (state.host?.contains(element)) continue;
      const item = backgroundItemFor(element);
      if (item) candidates.push(item);
    }
    if (!candidates.length) return null;

    // The smallest local background is normally the actual tile. This avoids
    // selecting a parent section when a page contains nested visual blocks.
    return candidates.sort((a, b) =>
      (a.renderedWidth * a.renderedHeight) - (b.renderedWidth * b.renderedHeight))[0];
  };

  const containsPoint = (item, x, y) => {
    if (!item?.element?.isConnected) return false;
    const rect = item.element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };

  const hitTestAssetAtPoint = (x, y) => {
    if (!document.elementsFromPoint) return null;
    for (const element of document.elementsFromPoint(x, y)) {
      if (state.host?.contains(element)) continue;
      const exact = state.items.find((item) => item.element === element);
      if (exact && readItem(exact)) return exact;
    }
    return null;
  };

  const nestedBackground = (first, second) => {
    if (!first?.element || !second?.element) return false;
    return first.element === second.element ||
      first.element.contains(second.element) || second.element.contains(first.element);
  };

  const inspectableAt = (target, x, y) => {
    // Real media wins. A local visual tile may fall back to its own background,
    // but full-width/page-sized section backgrounds never enter this path.
    const realAsset = hitTestAssetAtPoint(x, y);
    if (realAsset) return realAsset;

    const background = backgroundAtPoint(x, y);
    if (state.activeItem?.kind === 'background' && containsPoint(state.activeItem, x, y)) {
      if (!background || nestedBackground(state.activeItem, background)) return state.activeItem;
    }
    return background;
  };

  const styles = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .root { font-family: Arial, "Noto Sans Thai", sans-serif; }
    .active-box { position: fixed; z-index: 2147483646; display: block; border: 2px solid rgba(255,255,255,.95); border-radius: 2px; background: rgba(49,89,217,.52); box-shadow: 0 0 0 1px rgba(49,89,217,.35), 0 4px 18px rgba(49,89,217,.25); pointer-events: none; }
    .measure { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: calc(100% - 18px); padding: 8px 14px; border: 1px solid rgba(255,255,255,.85); border-radius: 6px; color: #fff; background: rgba(49,89,217,.92); box-shadow: 0 4px 14px rgba(15,42,118,.28); font: 800 18px/1.25 Arial, "Noto Sans Thai", sans-serif; letter-spacing: .01em; white-space: nowrap; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,.18); }
    .measure small { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; opacity: .94; }
    .measure.loading { font-size: 12px; }
    .hidden { display: none !important; }
    @media (max-width: 760px) { .measure { padding: 6px 9px; font-size: 14px; } }
  `;

  const mountUI = () => {
    if (state.host) state.host.remove();
    const host = document.createElement('div');
    host.id = '__optiwise_asset_inspector__';
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${styles}</style><div class="root"><div class="active-box hidden"><span class="measure"></span></div></div>`;
    document.documentElement.appendChild(host);
    state.host = host;
    state.shadow = shadow;
  };

  const closeInspector = () => {
    state.enabled = false;
    state.activeItem = null;
    state.lastTarget = null;
    state.items = [];
    state.backgroundCache = new WeakMap();
    if (state.observer) state.observer.disconnect();
    if (state.refreshTimer) clearTimeout(state.refreshTimer);
    removeListeners();
    state.observer = null;
    state.refreshTimer = null;
    if (state.host) state.host.remove();
    state.host = null;
    state.shadow = null;
  };

  const positionBox = (item) => {
    if (!state.shadow || !item?.element?.isConnected) return;
    const box = state.shadow.querySelector('.active-box');
    const rect = visualRect(item.element);
    if (!rect) {
      box.classList.add('hidden');
      return;
    }
    const { left, top, right, bottom } = rect;
    const width = right - left;
    const height = bottom - top;
    const outside = right <= 0 || bottom <= 0 || left >= window.innerWidth || top >= window.innerHeight;
    if (outside || width < 12 || height < 12) {
      box.classList.add('hidden');
      return;
    }
    box.style.left = `${Math.round(left)}px`;
    box.style.top = `${Math.round(top)}px`;
    box.style.width = `${Math.round(width)}px`;
    box.style.height = `${Math.round(height)}px`;
    box.classList.remove('hidden');
  };

  const updateActive = (item, x = state.pointerX, y = state.pointerY) => {
    if (!state.enabled || !state.shadow) return;
    state.activeItem = item || null;
    const box = state.shadow.querySelector('.active-box');
    const measure = state.shadow.querySelector('.measure');
    if (!item) {
      box.classList.add('hidden');
      return;
    }
    state.pointerX = x;
    state.pointerY = y;
    if (!readItem(item)) {
      state.activeItem = null;
      box.classList.add('hidden');
      return;
    }
    measure.innerHTML = `${item.renderedWidth} × ${item.renderedHeight} px<br><small>Ratio ${ratio(item.renderedWidth, item.renderedHeight)}</small>`;
    measure.classList.remove('loading');
    positionBox(item);
  };

  const refreshItems = () => {
    if (!state.enabled) return;
    state.items = scanPage();
    const current = inspectableAt(state.lastTarget, state.pointerX, state.pointerY);
    if (current && readItem(current)) updateActive(current, state.pointerX, state.pointerY);
    else updateActive(null);
  };

  const scheduleRefresh = () => {
    if (!state.enabled || state.refreshTimer) return;
    state.refreshTimer = setTimeout(() => {
      state.refreshTimer = null;
      refreshItems();
    }, 160);
  };

  const installObserver = () => {
    if (!document.body) return;
    if (state.observer) state.observer.disconnect();
    state.observer = new MutationObserver((records) => {
      if (records.some((record) => !state.host?.contains(record.target))) scheduleRefresh();
    });
    state.observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'src', 'srcset', 'poster', 'data-src', 'data-lazy-src', 'data-original']
    });
  };

  const runScan = () => {
    state.enabled = true;
    state.items = scanPage();
    mountUI();
    installListeners();
    installObserver();
    return state.items.length;
  };

  const onPointerOver = (event) => {
    if (!state.enabled || state.host?.contains(event.target)) return;
    state.lastTarget = event.target;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    updateActive(inspectableAt(event.target, event.clientX, event.clientY), event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (!state.enabled || state.host?.contains(event.target)) return;
    state.lastTarget = event.target;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    const item = inspectableAt(event.target, event.clientX, event.clientY);
    if (item !== state.activeItem) updateActive(item, event.clientX, event.clientY);
    if (Date.now() - state.lastRefresh > 260) {
      state.lastRefresh = Date.now();
      scheduleRefresh();
    }
  };

  const onPointerOut = (event) => {
    if (!state.enabled || state.host?.contains(event.target)) return;
    const related = event.relatedTarget;
    if (related && state.activeItem?.element?.contains?.(related)) return;
    if (related && hitTestAssetAtPoint(event.clientX, event.clientY)) return;
    state.lastTarget = null;
    updateActive(null);
  };

  const updatePositions = () => {
    if (state.activeItem) {
      if (readItem(state.activeItem)) positionBox(state.activeItem);
      else updateActive(null);
    }
  };

  const onWindowScroll = () => updatePositions();
  const onWindowResize = () => updatePositions();
  const onWindowBlur = () => updateActive(null);
  const onKeyDown = (event) => {
    if (event.key === 'Escape' && state.host) closeInspector();
  };

  const installListeners = () => {
    if (state.listenersInstalled) return;
    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerout', onPointerOut, true);
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('keydown', onKeyDown);
    state.listenersInstalled = true;
  };

  function removeListeners() {
    if (!state.listenersInstalled) return;
    document.removeEventListener('pointerover', onPointerOver, true);
    document.removeEventListener('pointermove', onPointerMove, true);
    document.removeEventListener('pointerout', onPointerOut, true);
    window.removeEventListener('scroll', onWindowScroll);
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('blur', onWindowBlur);
    document.removeEventListener('keydown', onKeyDown);
    state.listenersInstalled = false;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      if (message?.type === 'GET_STATUS') {
        sendResponse({ ok: true, enabled: state.enabled, count: state.items.length });
        return true;
      }
      if (message?.type === 'TOGGLE_INSPECTOR') {
        if (state.enabled) {
          closeInspector();
          sendResponse({ ok: true, enabled: false, count: 0 });
        } else {
          sendResponse({ ok: true, enabled: true, count: runScan() });
        }
        return true;
      }
      if (message?.type === 'SCAN_PAGE') {
        sendResponse({ ok: true, enabled: true, count: runScan() });
        return true;
      }
    } catch (error) {
      sendResponse({ ok: false, error: error.message || 'เกิดข้อผิดพลาดระหว่างตรวจ' });
    }
    return true;
  });
})();
