const express=require('express');
const dns=require('dns').promises;
const net=require('net');
const {chromium}=require('playwright');

const app=express();
const port=process.env.PORT||10000;
app.use(express.json({limit:'20kb'}));
app.use(express.static(__dirname));
let browserPromise=null;
const getBrowser=async()=>{if(!browserPromise)browserPromise=chromium.launch({headless:true,args:['--no-sandbox']}).catch(error=>{browserPromise=null;throw error});return browserPromise};

function privateIp(ip){
  if(net.isIPv4(ip)) return ip==='127.0.0.1'||ip==='0.0.0.0'||ip.startsWith('10.')||ip.startsWith('192.168.')||(ip.startsWith('172.')&&Number(ip.split('.')[1])>=16&&Number(ip.split('.')[1])<=31);
  if(net.isIPv6(ip)) return ip==='::1'||ip.startsWith('fc')||ip.startsWith('fd')||ip.startsWith('fe80:');
  return false;
}

async function safePublicUrl(raw){
  let u;
  try{u=new URL(raw)}catch{throw new Error('URL ไม่ถูกต้อง')}
  if(!['http:','https:'].includes(u.protocol)) throw new Error('รองรับเฉพาะ http:// หรือ https://');
  const addresses=await dns.lookup(u.hostname,{all:true});
  if(addresses.some(x=>privateIp(x.address))) throw new Error('ไม่อนุญาตให้ตรวจ URL ภายในระบบหรือ localhost');
  return u.toString();
}

const frameScript=()=>{
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0};
  const token=e=>[e.id,typeof e.className==='string'?e.className:'',e.getAttribute('role')||'',e.getAttribute('aria-label')||'',e.getAttribute('data-testid')||''].join(' ').toLowerCase();
  const meta=e=>{const parts=[];let n=e;for(let i=0;i<6&&n&&n!==document.body;i++,n=n.parentElement)parts.push(token(n));return{token:parts.join(' '),alt:e.getAttribute('alt')||'',id:e.id||'',className:typeof e.className==='string'?e.className:'',link:e.closest('a')?.href||''}};
  const source=e=>{const set=e.getAttribute('srcset')||e.getAttribute('data-srcset')||'';const setUrls=set.split(',').map(x=>x.trim().split(/\s+/)[0]).filter(Boolean);const values=[e.getAttribute('data-src'),e.getAttribute('data-lazy-src'),e.getAttribute('data-original'),e.getAttribute('data-url'),e.currentSrc,e.getAttribute('src'),e.poster,...setUrls].filter(Boolean);return values.find(x=>!x.startsWith('data:image/')&&x!=='about:blank')||values[0]||''};
  const isPopup=e=>{const t=token(e),s=getComputedStyle(e),r=e.getBoundingClientRect(),z=parseInt(s.zIndex)||0;return /(popup|modal|dialog|lightbox|newsletter|cookie|consent|overlay|subscribe|announcement)/i.test(t)||(s.position==='fixed'&&z>=100&&r.width>250&&r.height>100)};
  const parent=e=>{let n=e;for(let i=0;i<7&&n&&n!==document.body;i++,n=n.parentElement) if(isPopup(n)) return n;return null};
  const label=e=>token(e).replace(/\s+/g,' ').trim().slice(0,100)||'Popup candidate';
  const items=[],set=new Set();
  const add=(e,kind)=>{const r=e.getBoundingClientRect(),p=parent(e),nw=e.naturalWidth||e.videoWidth||0,nh=e.naturalHeight||e.videoHeight||0,src=source(e);if(!src)return;if(p)set.add(p);items.push({...meta(e),kind,src,renderedWidth:Math.round(r.width),renderedHeight:Math.round(r.height),naturalWidth:nw,naturalHeight:nh,visible:visible(e),popupCandidate:!!p,popupLabel:p?label(p):''})};
  document.querySelectorAll('img').forEach(e=>add(e,'image'));
  document.querySelectorAll('video').forEach(e=>add(e,'video'));
  document.querySelectorAll('[class],[id],[style],header,main,section,footer,nav,article').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width&&!r.height)return;const b=getComputedStyle(e).backgroundImage,m=b&&b!=='none'?b.match(/url\(["']?(.*?)["']?\)/):null,p=parent(e);if(m){if(p)set.add(p);items.push({...meta(e),kind:'background',src:new URL(m[1],location.href).href,renderedWidth:Math.round(r.width),renderedHeight:Math.round(r.height),naturalWidth:0,naturalHeight:0,visible:visible(e),popupCandidate:!!p,popupLabel:p?label(p):''})}});
  const popups=[...set].map((e,i)=>{const r=e.getBoundingClientRect();return{id:i+1,label:label(e),width:Math.round(r.width),height:Math.round(r.height),visible:visible(e)}});
  return {items,popups};
};

app.post('/api/scan',async(req,res)=>{
  let context;
  try{
    const url=await safePublicUrl(String(req.body?.url||'').slice(0,2000));
    const width=Math.max(320,Math.min(2400,Number(req.body?.viewport?.width)||1920));
    const height=Math.max(480,Math.min(1800,Number(req.body?.viewport?.height)||1080));
    const browser=await getBrowser();
    context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1800);
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)).catch(()=>{});
    await page.waitForTimeout(500);
    await page.evaluate(()=>window.scrollTo(0,0)).catch(()=>{});
    await page.waitForTimeout(200);
    const items=[],popups=[];
    for(const f of page.frames()){
      try{const d=await f.evaluate(frameScript);d.items.forEach(x=>items.push({...x,frameUrl:f.url()}));d.popups.forEach(x=>popups.push({...x,frameUrl:f.url()}))}catch(_){ }
    }
    const unique=popups.filter((p,i,a)=>i===a.findIndex(x=>x.frameUrl===p.frameUrl&&x.label===p.label&&x.width===p.width&&x.height===p.height));
    const screenshot=await page.screenshot({type:'jpeg',quality:52});
    res.json({title:await page.title(),url,viewport:{width,height},screenshot:`data:image/jpeg;base64,${screenshot.toString('base64')}`,items,popups:unique});
  }catch(e){res.status(400).json({error:e.message||'ไม่สามารถตรวจสอบเว็บไซต์นี้ได้'})}
  finally{if(context) await context.close()}
});

app.get('/health',(_,res)=>res.json({ok:true}));
app.listen(port,'0.0.0.0',()=>console.log(`Web Image Inspector listening on ${port}`));
