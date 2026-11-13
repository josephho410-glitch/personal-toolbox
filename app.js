import { UNIT_GROUPS, convertUnit, dateDifference, discount, textStats, combineDecibels, parseDecibels, generatePassword } from './core.mjs';

const ICONS = {
  unit: '↔', date: '▦', discount: '%', text: '≡', noise: '◉', password: '✳'
};
const TOOLS = [
  { id:'unit', title:'單位換算', subtitle:'長度、重量、面積、溫度', tone:'purple', category:'計算' },
  { id:'date', title:'日期計算', subtitle:'相隔天數、倒數與日程', tone:'blue', category:'生活' },
  { id:'discount', title:'折扣計算', subtitle:'價格、折扣、實付金額', tone:'orange', category:'生活' },
  { id:'text', title:'文字統計', subtitle:'字數、行數、文字清理', tone:'green', category:'工作' },
  { id:'noise', title:'分貝合成', subtitle:'多聲源能量級合成', tone:'red', category:'工程' },
  { id:'password', title:'密碼產生', subtitle:'安全隨機字串與複製', tone:'teal', category:'工具' },
];
const main = document.getElementById('main');
const toast = document.getElementById('toast');
const KEY = 'personal-toolbox-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { stored = {}; }
const state = { nav:'all', tool:null, query:'', favorites: Array.isArray(stored.favorites) ? stored.favorites.filter(id => TOOLS.some(t => t.id === id)) : [], recent: Array.isArray(stored.recent) ? stored.recent.filter(id => TOOLS.some(t => t.id === id)) : [], theme: ['auto','light','dark'].includes(stored.theme) ? stored.theme : 'auto' };
let toastTimer;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ favorites: state.favorites, recent: state.recent, theme:state.theme })); }
  catch { notify('此瀏覽器無法儲存設定，請確認儲存空間'); }
}
function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2400); }
function applyTheme() {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = state.theme === 'auto' ? (dark ? 'dark' : 'light') : state.theme;
}
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if(state.theme === 'auto') applyTheme(); });
const fmt = value => new Intl.NumberFormat('zh-TW',{ maximumFractionDigits: 8 }).format(Object.is(value,-0)?0:value);
const fmtMoney = value => new Intl.NumberFormat('zh-TW',{ style:'currency',currency:'TWD',maximumFractionDigits:2 }).format(value);
const today = () => { const d = new Date(); const p = n => String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
function icon(tool) { return `<div class="tool-icon ${tool.tone}" aria-hidden="true">${ICONS[tool.id]}</div>`; }
function activateNav(nav) {
  state.nav=nav;state.tool=null;state.query='';render();
}
function openTool(id) {
  const tool=TOOLS.find(t=>t.id===id);
  if(!tool)return;
  state.tool=id;
  state.recent=[id,...state.recent.filter(v=>v!==id)].slice(0,6);
  save();render();
}
function toggleFavorite(id) {
  state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];
  save();render();
}
function resultCard(label, value, extra='') {
  return `<div class="result-card" role="status" aria-live="polite"><div class="label">${label}</div><div class="value" id="resultValue">${value}</div><div class="extra" id="resultExtra">${extra}</div></div>`;
}
function showResult(value,extra) {
  document.getElementById('resultValue').textContent=value;
  document.getElementById('resultExtra').textContent=extra||'';
  document.getElementById('error').textContent='';
}
function showError(error) { document.getElementById('error').textContent = error?.message || String(error); }
function renderHome() {
  const list = (state.nav==='saved'?TOOLS.filter(t=>state.favorites.includes(t.id)):TOOLS).filter(t => `${t.title} ${t.subtitle} ${t.category}`.toLowerCase().includes(state.query.toLowerCase().trim()));
  if(state.nav==='settings') {
    main.innerHTML=`<section class="hero"><div class="eyebrow">PREFERENCES</div><h1>個人<span>設定</span></h1><p>僅在這支裝置儲存偏好設定，不會上傳到 GitHub。</p></section><div class="panel"><h2>外觀主題</h2><div class="settings-choice">${[['auto','跟隨系統'],['light','淺色'],['dark','深色']].map(([id,name])=>`<button class="chip ${state.theme===id?'selected':''}" data-theme-choice="${id}">${name}</button>`).join('')}</div></div><div class="panel"><h2>資料與使用說明</h2><p class="muted">收藏、最近使用與主題設定存於瀏覽器本機。清除網站資料或更換手機，這些資訊可能消失。</p><button class="secondary-button" id="exportSettings">匯出設定備份（JSON）</button><button class="secondary-button" id="importSettings" style="margin-top:10px">匯入設定備份</button><input type="file" id="importFile" accept=".json,application/json" hidden /><p class="hint">此版本的各項計算直接在手機完成，不呼叫外部 API。</p></div><p class="footer-small">個人工具箱 v0.1 · 純前端、無廣告、無追蹤</p>`;
    main.querySelectorAll('[data-theme-choice]').forEach(b=>b.onclick=()=>{state.theme=b.dataset.themeChoice;save();applyTheme();render();});
    document.getElementById('exportSettings').onclick=()=>download('toolbox-settings.json',JSON.stringify({version:1,favorites:state.favorites,recent:state.recent,theme:state.theme},null,2),'application/json');
    document.getElementById('importSettings').onclick=()=>document.getElementById('importFile').click();
    document.getElementById('importFile').onchange=async e=>{
      const file=e.target.files?.[0]; if(!file)return;
      try { if(file.size>100000) throw Error('設定備份檔案過大');const data=JSON.parse(await file.text());if(data.version!==1)throw Error('備份版本不支援');state.favorites=Array.isArray(data.favorites)?data.favorites.filter(x=>TOOLS.some(t=>t.id===x)):[];state.recent=Array.isArray(data.recent)?data.recent.filter(x=>TOOLS.some(t=>t.id===x)).slice(0,6):[];state.theme=['auto','light','dark'].includes(data.theme)?data.theme:'auto';save();applyTheme();render();notify('設定已還原'); }catch(error){notify(error.message||'無法匯入設定');}
    };
    return;
  }
  const isSaved=state.nav==='saved';
  const featured=state.recent[0]&&TOOLS.find(t=>t.id===state.recent[0]);
  main.innerHTML=`<section class="hero"><div class="eyebrow">YOUR EVERYDAY SHORTCUTS</div><h1>${isSaved?'我的<span>收藏</span>':'常用的工具，<br><span>一點就開。</span>'}</h1><p>${isSaved?'把常用工具加入收藏，讓它們更容易找到。':'六個實用小工具，手機上直接計算與處理。<br>不需要帳號、不需要額外伺服器。'}</p>${!isSaved?'<div class="hero-note">● 可離線操作　·　無需上傳資料</div>':''}</section><div class="search-wrap"><input class="search" id="searchInput" type="search" value="" placeholder="搜尋工具，例如日期、分貝…" aria-label="搜尋工具" autocomplete="off"></div><div class="section-head"><h2>${isSaved?'已收藏工具':'全部工具'}</h2><span id="matchCount">${list.length} 項</span></div><div class="tool-grid" id="toolGrid"></div>${featured&&!isSaved?`<div class="footer-small">最近使用：${featured.title}</div>`:''}`;
  const input=document.getElementById('searchInput');input.value=state.query;
  const grid=document.getElementById('toolGrid');
  function draw() {
    const matches=(isSaved?TOOLS.filter(t=>state.favorites.includes(t.id)):TOOLS).filter(t=>`${t.title} ${t.subtitle} ${t.category}`.toLowerCase().includes(state.query.toLowerCase().trim()));
    document.getElementById('matchCount').textContent=`${matches.length} 項`;
    grid.innerHTML=matches.length?matches.map(t=>`<article class="tool-card" role="button" tabindex="0" data-tool="${t.id}" aria-label="開啟${t.title}">${icon(t)}<strong>${t.title}</strong><div class="detail">${t.subtitle}</div><button class="star ${state.favorites.includes(t.id)?'active':''}" data-fav="${t.id}" aria-label="${state.favorites.includes(t.id)?'取消收藏':'收藏'}${t.title}" aria-pressed="${state.favorites.includes(t.id)}">${state.favorites.includes(t.id)?'★':'☆'}</button></article>`).join(''):`<div class="empty" style="grid-column:1/-1">${isSaved?'還沒有收藏工具，從「所有工具」點擊 ☆ 加入。':'找不到符合的工具，試試其他關鍵字。'}</div>`;
    grid.querySelectorAll('[data-tool]').forEach(card=>{
      card.onclick=e=>{if(e.target.closest('[data-fav]'))return;openTool(card.dataset.tool);};
      card.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('[data-fav]')){e.preventDefault();openTool(card.dataset.tool);}};
    });
    grid.querySelectorAll('[data-fav]').forEach(button=>button.onclick=e=>{e.stopPropagation();toggleFavorite(button.dataset.fav);});
  }
  input.oninput=()=>{state.query=input.value;draw();};
  draw();
}
function renderTool() {
  const t=TOOLS.find(x=>x.id===state.tool);
  main.innerHTML=`<section class="tool-page"><button id="backButton" class="back-button">← 返回${state.nav==='saved'?'收藏':'所有工具'}</button><div class="tool-heading">${icon(t)}<div><h1>${t.title}</h1><p>${t.subtitle}</p></div></div><div id="toolBody"></div></section>`;
  document.getElementById('backButton').onclick=()=>{state.tool=null;render();};
  const host=document.getElementById('toolBody');
  const renderers={unit:unitTool,date:dateTool,discount:discountTool,text:textTool,noise:noiseTool,password:passwordTool};
  renderers[t.id](host);
}
function optionsFor(group) { return Object.entries(group.units).map(([k,[label]])=>`<option value="${k}">${label}</option>`).join(''); }
function unitTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="category">換算類別</label><select id="category">${Object.entries(UNIT_GROUPS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></div><div class="field"><label for="amount">輸入數值</label><input id="amount" type="number" inputmode="decimal" value="1" step="any" /></div><div class="two-col"><div class="field"><label for="from">原始單位</label><select id="from"></select></div><div class="field"><label for="to">目標單位</label><select id="to"></select></div></div><button class="primary-button full" id="calculate">立即換算</button><div id="error" class="error" role="alert"></div>${resultCard('換算結果','—','請輸入數值')}</section>`;
  const cat=host.querySelector('#category'),from=host.querySelector('#from'),to=host.querySelector('#to'),amount=host.querySelector('#amount');
  function resetUnits(){const group=UNIT_GROUPS[cat.value];from.innerHTML=optionsFor(group);to.innerHTML=optionsFor(group);to.selectedIndex=1;calculate();}
  function calculate(){try{if(amount.value.trim()==='')throw Error('請輸入數值');const value=convertUnit(cat.value,from.value,to.value,Number(amount.value));showResult(fmt(value),`${UNIT_GROUPS[cat.value].units[from.value][0]} → ${UNIT_GROUPS[cat.value].units[to.value][0]}`);}catch(e){showError(e);}}
  cat.onchange=resetUnits;from.onchange=calculate;to.onchange=calculate;amount.oninput=calculate;host.querySelector('#calculate').onclick=calculate;resetUnits();
}
function dateTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="start">起始日期</label><input id="start" type="date" value="${today()}"></div><div class="field"><label for="end">結束日期</label><input id="end" type="date" value="${today()}"></div><label class="check-row"><input id="inclusive" type="checkbox">包含起始日與結束日（含首尾）</label><button class="primary-button full" id="calculate">計算相隔天數</button><div id="error" class="error" role="alert"></div>${resultCard('日期間隔','0 天','請選擇日期')}</section>`;
  const calculate=()=>{try{const result=dateDifference(host.querySelector('#start').value,host.querySelector('#end').value,host.querySelector('#inclusive').checked);showResult(`${fmt(result.days)} 天`,result.signedDays>0?'結束日在起始日之後':result.signedDays<0?'結束日在起始日之前':'兩個日期相同');}catch(e){showError(e);}};
  host.querySelector('#calculate').onclick=calculate;host.querySelectorAll('input').forEach(e=>e.onchange=calculate);calculate();
}
function discountTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="price">原價（每件，NT$）</label><input id="price" type="number" min="0" step="any" inputmode="decimal" value="1000"></div><div class="two-col"><div class="field"><label for="off">折扣（減少 %）</label><input id="off" type="number" min="0" max="100" step="any" inputmode="decimal" value="20"></div><div class="field"><label for="quantity">數量</label><input id="quantity" type="number" min="1" step="1" inputmode="numeric" value="1"></div></div><button class="primary-button full" id="calculate">計算價格</button><div id="error" class="error" role="alert"></div>${resultCard('折扣後實付','—','')}<p class="hint" id="saving"></p></section>`;
  const calculate=()=>{try{const vals=['price','off','quantity'].map(id=>host.querySelector('#'+id).value);if(vals.some(v=>v.trim()===''))throw Error('請完整輸入價格、折扣及數量');const r=discount(...vals.map(Number));showResult(fmtMoney(r.final),`折扣前 ${fmtMoney(r.originalTotal)}`);host.querySelector('#saving').textContent=`這筆訂單總共省下 ${fmtMoney(r.saved)}。`; }catch(e){showError(e);}};
  host.querySelector('#calculate').onclick=calculate;host.querySelectorAll('input').forEach(i=>i.oninput=calculate);calculate();
}
function textTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="content">文字內容</label><textarea id="content" placeholder="在這裡貼上或輸入文字…"></textarea></div><div class="stat-grid" id="stats"></div><div class="two-col" style="margin-top:16px"><button class="secondary-button" id="trim">去除首尾空白</button><button class="secondary-button" id="blank">刪除空白行</button></div><button class="primary-button full" id="copy" style="margin-top:12px">複製文字</button></section>`;
  const input=host.querySelector('#content');
  const update=()=>{const data=textStats(input.value);host.querySelector('#stats').innerHTML=Object.entries({ '字元數':data.characters, '不含空白':data.withoutSpaces, '行數':data.lines, 'UTF-8 位元組':data.bytes }).map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${fmt(v)}</strong></div>`).join('');};
  input.oninput=update;host.querySelector('#trim').onclick=()=>{input.value=input.value.trim();update();};host.querySelector('#blank').onclick=()=>{input.value=input.value.split(/\r\n|\r|\n/).filter(x=>x.trim()!=='').join('\n');update();};host.querySelector('#copy').onclick=()=>copy(input.value);update();
}
function noiseTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="levels">各聲源聲壓級（dB）</label><textarea id="levels" spellcheck="false" placeholder="例如：65, 68, 70">65, 68, 70</textarea></div><button class="primary-button full" id="calculate">進行能量合成</button><div id="error" class="error" role="alert"></div>${resultCard('合成聲壓級','—','')}<p class="hint">計算方式：10 × log₁₀(Σ10^(Lᵢ/10))。適用於多個非相干聲源的聲壓級合成；不等於不同時間區段的 Leq 時間加權平均，也不直接處理背景音修正。</p></section>`;
  const calculate=()=>{try{const vals=parseDecibels(host.querySelector('#levels').value);showResult(`${fmt(Number(combineDecibels(vals).toFixed(2)))} dB`,`共 ${vals.length} 筆聲壓級`);}catch(e){showError(e);}};
  host.querySelector('#calculate').onclick=calculate;calculate();
}
function passwordTool(host) {
  host.innerHTML=`<section class="panel"><div class="field"><label for="pwLength">密碼長度</label><div class="range-row"><input type="range" id="pwLength" min="8" max="64" value="20"><strong id="pwLengthValue">20</strong></div></div><label class="check-row"><input id="lower" type="checkbox" checked>小寫英文字母</label><label class="check-row"><input id="upper" type="checkbox" checked>大寫英文字母</label><label class="check-row"><input id="digits" type="checkbox" checked>數字</label><label class="check-row"><input id="symbols" type="checkbox" checked>特殊符號</label><button class="primary-button full" id="calculate" style="margin-top:14px">產生安全密碼</button><div id="error" class="error" role="alert"></div>${resultCard('新密碼','—','僅在本機產生，不會傳送出去')}<button class="secondary-button full" id="copy" style="margin-top:10px">複製密碼</button><p class="hint">使用瀏覽器密碼學安全隨機數產生。建議將密碼儲存在密碼管理器中。</p></section>`;
  const range=host.querySelector('#pwLength');range.oninput=()=>host.querySelector('#pwLengthValue').textContent=range.value;
  const calculate=()=>{try{const opts=Object.fromEntries(['lower','upper','digits','symbols'].map(id=>[id,host.querySelector('#'+id).checked]));const value=generatePassword(Number(range.value),opts,n=>crypto.getRandomValues(new Uint8Array(n)));showResult(value,'僅在本機產生，不會傳送出去');}catch(e){showError(e);}};
  host.querySelector('#calculate').onclick=calculate;host.querySelector('#copy').onclick=()=>{const val=host.querySelector('#resultValue').textContent;if(val!=='—')copy(val);};calculate();
}
async function copy(s) {try{await navigator.clipboard.writeText(s);notify('已複製到剪貼簿');}catch{notify('無法複製，請長按文字手動複製');}}
function download(name, content, type) {const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function render() {
  document.querySelectorAll('[data-nav]').forEach(button=>{const active=button.dataset.nav===state.nav;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
  state.tool?renderTool():renderHome();
  window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('[data-nav]').forEach(btn=>btn.onclick=()=>activateNav(btn.dataset.nav));
const dialog=document.getElementById('helpDialog');
document.getElementById('helpButton').onclick=()=>dialog.showModal();
document.querySelectorAll('.close-dialog,#dialogDone').forEach(el=>el.onclick=()=>dialog.close());
if ('serviceWorker' in navigator) {window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
render();
