// Persistent editor session: form values in localStorage, uploaded files in IndexedDB.
const STATE_KEY = 'more-amore-editor-state-v1';
const DB_NAME = 'more-amore-poster-db';
const STORE = 'assets';
const FILE_IDS = ['logoUpload','partnerLogo1','partnerLogo2'];

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function putAsset(key,file){ const db=await openDb(); return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(file,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}
async function getAsset(key){ const db=await openDb(); return new Promise((res,rej)=>{const q=db.transaction(STORE).objectStore(STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
async function clearAssets(){ const db=await openDb(); return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}

function saveState(){
  const data={};
  document.querySelectorAll('input:not([type=file]), textarea, select').forEach(el=>{
    if(!el.id) return;
    data[el.id]=el.type==='checkbox'?el.checked:el.value;
  });
  localStorage.setItem(STATE_KEY,JSON.stringify(data));
}
function restoreState(){
  let data={}; try{data=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch{}
  Object.entries(data).forEach(([id,value])=>{
    const el=document.getElementById(id); if(!el) return;
    if(el.type==='checkbox') el.checked=!!value; else el.value=value;
    el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));
  });
}
async function restoreFiles(){
  for(const id of FILE_IDS){
    const file=await getAsset(id).catch(()=>null); if(!file) continue;
    const input=document.getElementById(id); if(!input) continue;
    try{
      const dt=new DataTransfer(); dt.items.add(file); input.files=dt.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
    }catch(e){ console.warn('Could not restore',id,e); }
  }
}
function addSaveButton(){
  const toolbar=document.querySelector('.toolbar'); if(!toolbar||document.querySelector('#saveCurrentState')) return;
  const b=document.createElement('button'); b.id='saveCurrentState'; b.textContent='SAVE';
  b.title='Salva ora tutti i data entry correnti';
  b.onclick=()=>{
    saveState();
    const old=b.textContent;
    b.textContent='SAVED ✓';
    b.classList.add('saved-flash');
    setTimeout(()=>{b.textContent=old;b.classList.remove('saved-flash')},1100);
  };
  toolbar.insertBefore(b,document.querySelector('#exportVideo'));
}

function addResetButton(){
  const toolbar=document.querySelector('.toolbar'); if(!toolbar||document.querySelector('#resetSavedState')) return;
  const b=document.createElement('button'); b.id='resetSavedState'; b.textContent='RESET DEFAULT';
  b.title='Cancella valori e loghi memorizzati e torna ai valori iniziali';
  b.onclick=async()=>{ localStorage.removeItem(STATE_KEY); await clearAssets().catch(()=>{}); location.reload(); };
  toolbar.insertBefore(b,document.querySelector('#exportVideo'));
}

window.addEventListener('DOMContentLoaded',()=>{
  addSaveButton();
  addResetButton();
  // main.js installs its listeners during module evaluation; restore one tick later.
  setTimeout(async()=>{ restoreState(); await restoreFiles(); },500);
  document.addEventListener('input',e=>{ if(!e.target.matches('input[type=file]')) saveState(); });
  document.addEventListener('change',e=>{ if(!e.target.matches('input[type=file]')) saveState(); });
  FILE_IDS.forEach(id=>document.getElementById(id)?.addEventListener('change',e=>{
    const file=e.target.files?.[0]; if(file) putAsset(id,file).catch(console.error);
  }));
  // Dragging updates internal Three.js state but not form events; pointerup triggers controls sync later,
  // so save a snapshot of visible controls too.
  document.querySelector('#stage')?.addEventListener('pointerup',()=>setTimeout(saveState,0));
});
