// Persistent editor session: form values in localStorage, uploaded files in IndexedDB.
const STATE_KEY = 'more-amore-editor-state-v1';
const PROJECT_KEY = 'more-amore-project-state-v2';
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
  try{const project=window.moreAmoreGetProjectState?.();if(project)localStorage.setItem(PROJECT_KEY,JSON.stringify(project));}catch(e){console.warn('Project autosave failed',e)}
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
  const toolbar=document.querySelector('.project-tools'); if(!toolbar||document.querySelector('#saveCurrentState')) return;
  const b=document.createElement('button'); b.id='saveCurrentState'; b.textContent='SAVE';
  b.title='Salva ora tutti i data entry correnti';
  b.onclick=()=>{
    saveState();
    const old=b.textContent;
    b.textContent='SAVED ✓';
    b.classList.add('saved-flash');
    setTimeout(()=>{b.textContent=old;b.classList.remove('saved-flash')},1100);
  };
  toolbar.appendChild(b);
}

function addProjectButtons(){
  const toolbar=document.querySelector('.project-tools'); if(!toolbar||document.querySelector('#exportProjectJson')) return;
  const save=document.createElement('button');save.id='exportProjectJson';save.textContent='SAVE JSON';save.title='Scarica un file progetto riapribile';
  save.onclick=()=>{const project=window.moreAmoreGetProjectState?.();if(!project)return;const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='more-amore-project-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const load=document.createElement('button');load.id='importProjectJson';load.textContent='LOAD JSON';load.title='Riapri un progetto More Amore';
  const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;
  load.onclick=()=>input.click();input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());window.moreAmoreLoadProjectState?.(data);localStorage.setItem(PROJECT_KEY,JSON.stringify(data));saveState();load.textContent='LOADED ✓';setTimeout(()=>load.textContent='LOAD JSON',1100)}catch(e){console.error(e);alert('JSON progetto non valido')}input.value=''};
  toolbar.appendChild(save);toolbar.appendChild(load);toolbar.appendChild(input)
}
function restoreProject(){
  try{const data=JSON.parse(localStorage.getItem(PROJECT_KEY)||'null');if(data)window.moreAmoreLoadProjectState?.(data)}catch(e){console.warn('Project restore failed',e)}
}

function addResetButton(){
  const toolbar=document.querySelector('.project-tools'); if(!toolbar||document.querySelector('#resetSavedState')) return;
  const b=document.createElement('button'); b.id='resetSavedState'; b.textContent='RESET DEFAULT';
  b.title='Cancella valori e loghi memorizzati e torna ai valori iniziali';
  b.onclick=async()=>{ if(!confirm('Reset completo del poster? Questa azione cancella lo stato autosalvato.'))return; localStorage.removeItem(STATE_KEY); localStorage.removeItem(PROJECT_KEY); await clearAssets().catch(()=>{}); location.reload(); };
  toolbar.appendChild(b);
}

let historyStack=[],historyIndex=-1,historyReady=false,historyTimer=null,historyApplying=false;
function snapshotProject(){try{return window.moreAmoreGetProjectState?.()||null}catch{return null}}
function snapshotKey(v){try{const copy=JSON.parse(JSON.stringify(v));delete copy.savedAt;return JSON.stringify(copy)}catch{return ''}}
function updateHistoryButtons(){
  const u=document.querySelector('#undoProject'),r=document.querySelector('#redoProject');
  if(u)u.disabled=historyIndex<=0;if(r)r.disabled=historyIndex<0||historyIndex>=historyStack.length-1
}
function pushHistory(){
  if(!historyReady||historyApplying)return;
  const snap=snapshotProject();if(!snap)return;
  const key=snapshotKey(snap),current=historyStack[historyIndex];
  if(current&&snapshotKey(current)===key)return;
  historyStack=historyStack.slice(0,historyIndex+1);historyStack.push(snap);
  if(historyStack.length>60)historyStack.shift();historyIndex=historyStack.length-1;updateHistoryButtons()
}
function queueHistory(){clearTimeout(historyTimer);historyTimer=setTimeout(pushHistory,180)}
function applyHistory(index){
  if(index<0||index>=historyStack.length)return;
  historyApplying=true;historyIndex=index;window.moreAmoreLoadProjectState?.(JSON.parse(JSON.stringify(historyStack[index])));
  setTimeout(()=>{historyApplying=false;saveState();updateHistoryButtons()},0)
}
function addHistoryButtons(){
  const toolbar=document.querySelector('.project-tools');if(!toolbar||document.querySelector('#undoProject'))return;
  const undo=document.createElement('button');undo.id='undoProject';undo.textContent='↶ UNDO';undo.title='Annulla ultima modifica · Ctrl/Cmd+Z';undo.onclick=()=>applyHistory(historyIndex-1);
  const redo=document.createElement('button');redo.id='redoProject';redo.textContent='↷ REDO';redo.title='Ripristina modifica · Ctrl/Cmd+Shift+Z';redo.onclick=()=>applyHistory(historyIndex+1);
  toolbar.prepend(redo);toolbar.prepend(undo);updateHistoryButtons()
}
function setAutosavePulse(){
  const el=document.querySelector('#autosaveStatus');if(!el)return;el.textContent='● SAVING…';
  clearTimeout(setAutosavePulse.t);setAutosavePulse.t=setTimeout(()=>el.textContent='● AUTOSAVED',450)
}
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z')return;
  e.preventDefault();if(e.shiftKey)applyHistory(historyIndex+1);else applyHistory(historyIndex-1)
});

window.addEventListener('DOMContentLoaded',()=>{
  addSaveButton();
  addProjectButtons();
  addHistoryButtons();
  addResetButton();
  // main.js installs its listeners during module evaluation; restore one tick later.
  setTimeout(async()=>{ restoreState(); await restoreFiles(); restoreProject(); setTimeout(()=>{historyReady=true;const first=snapshotProject();if(first){historyStack=[first];historyIndex=0;updateHistoryButtons()}},120); },900);
  document.addEventListener('input',e=>{ if(!e.target.matches('input[type=file]')){saveState();setAutosavePulse();queueHistory()} });
  document.addEventListener('change',e=>{ if(!e.target.matches('input[type=file]')){saveState();setAutosavePulse();queueHistory()} });
  document.addEventListener('click',e=>{ if(e.target.closest('[data-mode-name],[data-fx],.palette,#sketchWide,#sketchTall'))setTimeout(()=>{saveState();setAutosavePulse();pushHistory()},0); });
  FILE_IDS.forEach(id=>document.getElementById(id)?.addEventListener('change',e=>{
    const file=e.target.files?.[0]; if(file) putAsset(id,file).catch(console.error);
  }));
  // Dragging updates internal Three.js state but not form events; pointerup triggers controls sync later,
  // so save a snapshot of visible controls too.
  document.querySelector('#stage')?.addEventListener('pointerup',()=>setTimeout(()=>{saveState();setAutosavePulse();pushHistory()},0));
});
