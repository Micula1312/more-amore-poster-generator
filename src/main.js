import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import './style.css';

const POSTER_W = 1080;
const POSTER_H = 1350;
const HALF_W = POSTER_W / 2;
const HALF_H = POSTER_H / 2;
const SAFE_MARGIN = 42;
const SCALE = 0.56;
const VIDEO_DURATION_MS = 6000;

const stage = document.querySelector('#stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(POSTER_W * SCALE, POSTER_H * SCALE);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', 'Poster canvas: drag text and sketch layers');
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, POSTER_W / POSTER_H, 1, 5000);
camera.position.set(0, 0, 1850);

scene.add(new THREE.AmbientLight(0xffffff, 1.55));
const key = new THREE.DirectionalLight(0xfff2df, 4.2);
key.position.set(-300, 420, 900);
scene.add(key);
const rim = new THREE.DirectionalLight(0xff48c4, 3.2);
rim.position.set(600, -180, 700);
scene.add(rim);

const bgCanvas = document.createElement('canvas');
bgCanvas.width = POSTER_W;
bgCanvas.height = POSTER_H;
const bgTexture = new THREE.CanvasTexture(bgCanvas);
bgTexture.colorSpace = THREE.SRGBColorSpace;
const bg = new THREE.Mesh(
  new THREE.PlaneGeometry(POSTER_W, POSTER_H),
  new THREE.MeshBasicMaterial({ map: bgTexture })
);
bg.position.z = -180;
bg.userData.nonInteractive = true;
scene.add(bg);

const palettes = {
  amore: ['#240812', '#6d173b', '#b77cff'],
  acid: ['#08170d', '#31ff70', '#fb38ff'],
  night: ['#03020a', '#1b1456', '#215dff'],
  sunset: ['#32101d', '#ff4a1a', '#ffb65c']
};
const bgState = { colors: [...palettes.amore], angle: 135 };

function updateBackground(){
  const ctx = bgCanvas.getContext('2d');
  const rad = THREE.MathUtils.degToRad(bgState.angle);
  const cx = bgCanvas.width / 2;
  const cy = bgCanvas.height / 2;
  const len = Math.hypot(bgCanvas.width, bgCanvas.height) / 2;
  const x1 = cx - Math.cos(rad) * len;
  const y1 = cy - Math.sin(rad) * len;
  const x2 = cx + Math.cos(rad) * len;
  const y2 = cy + Math.sin(rad) * len;
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  grad.addColorStop(0, bgState.colors[0]);
  grad.addColorStop(.52, bgState.colors[1]);
  grad.addColorStop(1, bgState.colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgTexture.needsUpdate = true;
}
updateBackground();

const fields = {
  logo: { label:'MORE AMORE TEXT', text:'MORE AMORE', size:52, depth:18, x:0, y:470, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-0.12, bevel:3, metalness:.15, roughness:.3, color:'#fff1dc', animation:'none', animSpeed:1, animAmount:18 },
  guest: { label:'GUEST', text:'GUEST NAME', size:85, depth:28, x:0, y:285, scaleX:1.05, scaleY:1, rotZ:0, rotX:-3, bend:.35, bevel:4, metalness:.25, roughness:.2, color:'#b77cff', animation:'none', animSpeed:1, animAmount:24 },
  support1: { label:'SUPPORT 1', text:'ARTIST NAME 1', size:41, depth:14, x:0, y:95, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.12, bevel:2.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:18 },
  support2: { label:'SUPPORT 2', text:'ARTIST NAME 2', size:41, depth:14, x:0, y:5, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.08, bevel:2.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:18 },
  venue: { label:'VENUE', text:'CLUB NAME', size:46, depth:16, x:0, y:-155, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:.15, bevel:3, metalness:.15, roughness:.28, color:'#ff4a1a', animation:'none', animSpeed:1, animAmount:18 },
  address: { label:'ADDRESS', text:'VIA INDIRIZZO, CITTÀ', size:22, depth:8, x:0, y:-255, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:.12, bevel:1.5, metalness:.1, roughness:.45, color:'#ff4a1a', animation:'none', animSpeed:1, animAmount:14 },
  date: { label:'DATE', text:'DAY 00 MONTH', size:51, depth:18, x:-130, y:-405, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.12, bevel:3, metalness:.25, roughness:.25, color:'#b77cff', animation:'none', animSpeed:1, animAmount:18 },
  time: { label:'TIME', text:'00:00 — 00:00', size:27, depth:10, x:-130, y:-520, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:1.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:14 }
};

let artistCounter = 0;
let infoCounter = 0;
let sketchCounter = 0;
let font;
const meshes = {};
let selected = 'guest';
const clock = new THREE.Clock();

function makeMaterial(cfg){
  return new THREE.MeshStandardMaterial({ color: cfg.color, metalness: cfg.metalness, roughness: cfg.roughness });
}

function buildGeometry(cfg){
  const g = new TextGeometry(cfg.text, {
    font,
    size: cfg.size,
    depth: cfg.depth,
    curveSegments: 10,
    bevelEnabled: cfg.bevel > 0,
    bevelThickness: cfg.bevel * .65,
    bevelSize: cfg.bevel,
    bevelSegments: 4
  });
  g.computeBoundingBox();
  const bb = g.boundingBox;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  g.translate(-bb.min.x - w/2, -bb.min.y - h/2, 0);
  const pos = g.attributes.position;
  const denom = Math.max(w*w, 1);
  for(let i=0;i<pos.count;i++){
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setY(i, y + cfg.bend * ((x*x)/denom) * 260);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

function getTextHalfExtents(id){
  const mesh = meshes[id];
  if(!mesh || !mesh.geometry.boundingBox) return { x:40, y:20 };
  const bb = mesh.geometry.boundingBox;
  return {
    x:Math.max(10,(bb.max.x-bb.min.x)*Math.abs(fields[id].scaleX)/2),
    y:Math.max(10,(bb.max.y-bb.min.y)*Math.abs(fields[id].scaleY)/2)
  };
}

function clampFieldToPoster(id){
  const cfg = fields[id];
  const e = getTextHalfExtents(id);
  const maxX = Math.max(0, HALF_W - SAFE_MARGIN - Math.min(e.x, HALF_W-SAFE_MARGIN));
  const maxY = Math.max(0, HALF_H - SAFE_MARGIN - Math.min(e.y, HALF_H-SAFE_MARGIN));
  cfg.x = THREE.MathUtils.clamp(cfg.x,-maxX,maxX);
  cfg.y = THREE.MathUtils.clamp(cfg.y,-maxY,maxY);
}

function rebuild(id){
  if(!font || !fields[id]) return;
  const cfg = fields[id];
  if(meshes[id]){
    scene.remove(meshes[id]);
    meshes[id].geometry.dispose();
    meshes[id].material.dispose();
  }
  const mesh = new THREE.Mesh(buildGeometry(cfg), makeMaterial(cfg));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.layerId = id;
  mesh.renderOrder = 10;
  meshes[id] = mesh;
  scene.add(mesh);
  clampFieldToPoster(id);
  applyBaseTransform(id);
}

function applyBaseTransform(id){
  const cfg = fields[id];
  const mesh = meshes[id];
  if(!mesh || !cfg) return;
  mesh.position.set(cfg.x,cfg.y,0);
  mesh.rotation.set(THREE.MathUtils.degToRad(cfg.rotX),0,THREE.MathUtils.degToRad(cfg.rotZ));
  mesh.scale.set(cfg.scaleX,cfg.scaleY,1);
}

function rebuildAll(){ Object.keys(fields).forEach(rebuild); }

const logoState = {
  group:null,
  texture:null,
  width:480,
  height:190,
  depth:28,
  scale:1,
  x:0,
  y:455,
  animation:'none',
  animSpeed:1,
  animAmount:20
};

function disposeGroup(group){
  if(!group) return;
  group.traverse(o=>{
    if(o.geometry) o.geometry.dispose();
    if(Array.isArray(o.material)) o.material.forEach(m=>m?.dispose?.());
    else if(o.material) o.material.dispose();
  });
  scene.remove(group);
}

function disposeLogo(){
  disposeGroup(logoState.group);
  logoState.group = null;
}

function buildLogo(){
  if(!logoState.texture) return;
  disposeLogo();
  const group = new THREE.Group();
  group.userData.fixedLogo = true;

  const sideMaterial = new THREE.MeshStandardMaterial({ color:'#5a244a', metalness:.45, roughness:.24 });
  const invisible = new THREE.MeshBasicMaterial({ transparent:true, opacity:0, depthWrite:false });
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(logoState.width,logoState.height,Math.max(2,logoState.depth)),
    [sideMaterial,sideMaterial,sideMaterial,sideMaterial,invisible,invisible]
  );
  shell.position.z = -logoState.depth/2;
  group.add(shell);

  const slices = Math.max(4, Math.round(logoState.depth/2));
  for(let i=slices;i>=1;i--){
    const m = new THREE.MeshBasicMaterial({
      map:logoState.texture,
      transparent:true,
      alphaTest:.03,
      color:'#6f315d',
      side:THREE.DoubleSide,
      depthWrite:true
    });
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(logoState.width,logoState.height),m);
    layer.position.z = -i*(logoState.depth/slices);
    group.add(layer);
  }

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(logoState.width,logoState.height),
    new THREE.MeshBasicMaterial({ map:logoState.texture, transparent:true, alphaTest:.03, color:'#ffffff', side:THREE.DoubleSide })
  );
  front.position.z = 1;
  group.add(front);

  logoState.group = group;
  scene.add(group);
  applyLogoBase();
}

function applyLogoBase(){
  if(!logoState.group) return;
  logoState.group.position.set(logoState.x,logoState.y,55);
  logoState.group.scale.setScalar(logoState.scale);
}

// Partner logos are permanently anchored inside the bottom-right safe area.
const PARTNER_GAP = 18;
const PARTNER_BOTTOM_MARGIN = 58;
const PARTNER_RIGHT_MARGIN = 58;
const partnerStates = [
  { group:null, texture:null, width:150, height:84, x:0, y:0 },
  { group:null, texture:null, width:150, height:84, x:0, y:0 }
];

function layoutPartnerLogos(){
  const active = partnerStates.filter(state=>state.texture);
  if(!active.length) return;

  const bottomY = -HALF_H + PARTNER_BOTTOM_MARGIN;
  let rightEdge = HALF_W - PARTNER_RIGHT_MARGIN;

  for(let i=partnerStates.length-1; i>=0; i--){
    const state = partnerStates[i];
    if(!state.texture) continue;
    const halfW = state.width / 2;
    const halfH = state.height / 2;
    state.x = rightEdge - halfW;
    state.y = bottomY + halfH;
    rightEdge = state.x - halfW - PARTNER_GAP;
    if(state.group) state.group.position.set(state.x,state.y,120);
  }
}

function buildPartnerLogo(index){
  const state = partnerStates[index];
  if(!state.texture) return;
  disposeGroup(state.group);
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(state.width,state.height),
    new THREE.MeshBasicMaterial({
      map:state.texture,
      transparent:true,
      alphaTest:.01,
      side:THREE.DoubleSide,
      depthTest:false,
      depthWrite:false,
      toneMapped:false
    })
  );
  mesh.renderOrder = 100;
  group.add(mesh);
  group.renderOrder = 100;
  state.group = group;
  scene.add(group);
  layoutPartnerLogos();
}

function loadImageAsTexture(file, maxW, maxH, onReady){
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = ()=>{
    const ratio = Math.min(maxW/image.naturalWidth,maxH/image.naturalHeight,1);
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    onReady({ texture, width:image.naturalWidth*ratio, height:image.naturalHeight*ratio });
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

const sketchStates = [];
const sketchList = document.querySelector('#sketchList');

function clampImageState(state){
  const hw = Math.min(state.width * state.scale / 2, HALF_W - SAFE_MARGIN);
  const hh = Math.min(state.height * state.scale / 2, HALF_H - SAFE_MARGIN);
  state.x = THREE.MathUtils.clamp(state.x, -HALF_W + SAFE_MARGIN + hw, HALF_W - SAFE_MARGIN - hw);
  state.y = THREE.MathUtils.clamp(state.y, -HALF_H + SAFE_MARGIN + hh, HALF_H - SAFE_MARGIN - hh);
}

function buildSketch(state){
  if(state.group) disposeGroup(state.group);
  const group = new THREE.Group();
  group.userData.sketchId = state.id;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(state.width,state.height),
    new THREE.MeshBasicMaterial({
      map:state.texture,
      transparent:true,
      alphaTest:.01,
      side:THREE.DoubleSide,
      depthTest:false
    })
  );
  mesh.userData.sketchId = state.id;
  mesh.renderOrder = 35;
  group.add(mesh);
  state.group = group;
  clampImageState(state);
  group.position.set(state.x,state.y,65);
  group.scale.setScalar(state.scale);
  scene.add(group);
}

function addSketchListItem(state){
  const row = document.createElement('div');
  row.className = 'sketch-item';
  row.dataset.sketchId = state.id;
  row.innerHTML = `<span>${state.name}</span><button type="button" title="Remove sketch">×</button>`;
  row.querySelector('button').onclick = ()=>{
    if(state.group) disposeGroup(state.group);
    if(state.texture) state.texture.dispose();
    const idx = sketchStates.findIndex(s=>s.id===state.id);
    if(idx >= 0) sketchStates.splice(idx,1);
    row.remove();
  };
  sketchList.appendChild(row);
}

function addSketchFile(file){
  loadImageAsTexture(file,360,360,({texture,width,height})=>{
    const index = sketchCounter++;
    const state = {
      id:`sketch-${Date.now()}-${index}`,
      name:file.name || `Sketch ${index+1}`,
      texture,
      width,
      height,
      scale:1,
      x:-280 + (index % 3) * 120,
      y:160 - (index % 4) * 95,
      group:null
    };
    sketchStates.push(state);
    buildSketch(state);
    addSketchListItem(state);
  });
}

document.querySelector('#sketchUpload').addEventListener('change',e=>{
  [...(e.target.files || [])].forEach(addSketchFile);
  e.target.value='';
});

function animateObject(obj,cfg,t,isLogo=false){
  if(!obj) return;
  const speed = cfg.animSpeed || 1;
  const amount = cfg.animAmount || 20;
  if(isLogo){
    obj.position.set(cfg.x,cfg.y,55);
    obj.rotation.set(0,0,0);
    obj.scale.setScalar(cfg.scale);
  } else {
    obj.position.set(cfg.x,cfg.y,0);
    obj.rotation.x = THREE.MathUtils.degToRad(cfg.rotX);
    obj.rotation.y = 0;
    obj.rotation.z = THREE.MathUtils.degToRad(cfg.rotZ);
    obj.scale.set(cfg.scaleX,cfg.scaleY,1);
  }
  if(cfg.animation==='rotateY') obj.rotation.y = t*speed*1.6;
  else if(cfg.animation==='bounce') obj.position.y = cfg.y + Math.abs(Math.sin(t*speed*2.5))*amount;
  else if(cfg.animation==='wave'){
    obj.rotation.z += Math.sin(t*speed*2.2)*THREE.MathUtils.degToRad(amount*.35);
    obj.position.y = cfg.y + Math.sin(t*speed*3.2)*amount*.45;
    if(!isLogo) obj.scale.y *= 1 + Math.sin(t*speed*4)*Math.min(amount/500,.14);
  }
}

function render(){
  const t = clock.getElapsedTime();
  Object.entries(meshes).forEach(([id,mesh])=>fields[id] && animateObject(mesh,fields[id],t));
  if(logoState.group) animateObject(logoState.group,logoState,t,true);
  renderer.render(scene,camera);
  requestAnimationFrame(render);
}

const fieldsEl = document.querySelector('#fields');
function addFieldButton(id){
  const cfg = fields[id];
  if(!cfg) return;
  const b = document.createElement('button');
  b.className='field-btn';
  b.dataset.id=id;
  b.innerHTML=`<span>${cfg.label}</span><span class="field-key">${id}</span>`;
  b.onclick=()=>selectLayer(id);
  fieldsEl.appendChild(b);
}
Object.keys(fields).forEach(addFieldButton);

function createDynamicField(type){
  const isArtist = type === 'artist';
  const n = isArtist ? ++artistCounter : ++infoCounter;
  const id = `${type}${Date.now()}${n}`;
  const rowOffset = ((artistCounter + infoCounter - 1) % 6) * 48;
  fields[id] = isArtist ? {
    label:`ARTISTA ${n}`, text:`ARTISTA ${n}`, size:41, depth:14,
    x:0, y:145-rowOffset, scaleX:1, scaleY:1, rotZ:0, rotX:0,
    bend:0, bevel:2.5, metalness:.08, roughness:.38, color:'#f5ead8',
    animation:'none', animSpeed:1, animAmount:18
  } : {
    label:`INFO ${n}`, text:`INFO ${n}`, size:24, depth:8,
    x:0, y:-285-rowOffset, scaleX:1, scaleY:1, rotZ:0, rotX:0,
    bend:0, bevel:1.5, metalness:.04, roughness:.5, color:'#f5ead8',
    animation:'none', animSpeed:1, animAmount:12
  };
  addFieldButton(id);
  if(font) rebuild(id);
  selectLayer(id);
}
document.querySelector('#addArtist').addEventListener('click',()=>createDynamicField('artist'));
document.querySelector('#addInfo').addEventListener('click',()=>createDynamicField('info'));

const controls = {
  text:document.querySelector('#textInput'), size:document.querySelector('#size'), depth:document.querySelector('#depth'),
  x:document.querySelector('#x'), y:document.querySelector('#y'), scaleX:document.querySelector('#scaleX'), scaleY:document.querySelector('#scaleY'),
  rotZ:document.querySelector('#rotZ'), rotX:document.querySelector('#rotX'), bend:document.querySelector('#bend'), bevel:document.querySelector('#bevel'),
  metalness:document.querySelector('#metalness'), roughness:document.querySelector('#roughness'), color:document.querySelector('#color'),
  animation:document.querySelector('#animationType'), animSpeed:document.querySelector('#animSpeed'), animAmount:document.querySelector('#animAmount')
};

function selectLayer(id){
  if(!fields[id]) return;
  selected=id;
  document.querySelector('#selectedName').textContent=fields[id].label;
  document.querySelectorAll('.field-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
  syncControls();
}

function syncControls(){
  const c=fields[selected];
  if(!c) return;
  controls.text.value=c.text;
  for(const k of ['size','depth','x','y','scaleX','scaleY','rotZ','rotX','bend','bevel','metalness','roughness','color']) controls[k].value=c[k];
  controls.animation.value=c.animation;
  controls.animSpeed.value=c.animSpeed;
  controls.animAmount.value=c.animAmount;
}

function syncXYOnly(){
  if(!fields[selected]) return;
  controls.x.value=fields[selected].x;
  controls.y.value=fields[selected].y;
}

let rebuildTimer;
function queueRebuild(){ clearTimeout(rebuildTimer); rebuildTimer=setTimeout(()=>rebuild(selected),20); }
controls.text.addEventListener('input',e=>{ fields[selected].text=e.target.value||' '; queueRebuild(); });
['size','depth','bend','bevel','color'].forEach(k=>controls[k].addEventListener('input',e=>{
  fields[selected][k]=k==='color'?e.target.value:Number(e.target.value); queueRebuild();
}));
['metalness','roughness'].forEach(k=>controls[k].addEventListener('input',e=>{
  fields[selected][k]=Number(e.target.value); if(meshes[selected]) meshes[selected].material[k]=fields[selected][k];
}));
['x','y','scaleX','scaleY','rotZ','rotX'].forEach(k=>controls[k].addEventListener('input',e=>{
  fields[selected][k]=Number(e.target.value); clampFieldToPoster(selected); applyBaseTransform(selected); syncXYOnly();
}));
controls.animation.addEventListener('change',e=>fields[selected].animation=e.target.value);
controls.animSpeed.addEventListener('input',e=>fields[selected].animSpeed=Number(e.target.value));
controls.animAmount.addEventListener('input',e=>fields[selected].animAmount=Number(e.target.value));

document.querySelectorAll('[data-fx]').forEach(btn=>btn.onclick=()=>{
  const c=fields[selected];
  if(btn.dataset.fx==='plastic'){ c.metalness=.2; c.roughness=.18; c.bevel=Math.max(c.bevel,3); }
  if(btn.dataset.fx==='chrome'){ c.metalness=1; c.roughness=.08; c.color='#d9e2ea'; c.bevel=Math.max(c.bevel,3); }
  if(btn.dataset.fx==='cream'){ c.metalness=.05; c.roughness=.42; c.color='#f5ead8'; }
  syncControls(); rebuild(selected);
});

function applyPreset(type){
  if(type==='classic'){
    Object.assign(bgState,{colors:[...palettes.amore],angle:135});
    fields.guest.color='#b77cff'; fields.guest.bend=.35; fields.guest.metalness=.25;
    fields.venue.color='#ff4a1a'; fields.date.color='#b77cff';
  }
  if(type==='chrome'){
    Object.assign(bgState,{colors:['#050505','#231520','#401435'],angle:145});
    Object.values(fields).forEach(c=>{ c.color='#dfe7ee'; c.metalness=.95; c.roughness=.08; c.bevel=Math.max(c.bevel,3); });
    fields.guest.color='#f3a6ff';
  }
  if(type==='warp'){
    Object.assign(bgState,{colors:['#170812','#6e104d','#ec28ac'],angle:110});
    fields.guest.bend=.85; fields.guest.scaleX=1.2; fields.guest.rotX=-12;
    fields.support1.bend=-.42; fields.support2.bend=-.28; fields.date.bend=.45;
  }
  updateBackground(); updateBgInputs(); rebuildAll(); syncControls();
}
document.querySelector('#presetClassic').onclick=()=>applyPreset('classic');
document.querySelector('#presetChrome').onclick=()=>applyPreset('chrome');
document.querySelector('#presetWarp').onclick=()=>applyPreset('warp');

function updateBgInputs(){
  document.querySelector('#bg1').value=bgState.colors[0];
  document.querySelector('#bg2').value=bgState.colors[1];
  document.querySelector('#bg3').value=bgState.colors[2];
  document.querySelector('#bgAngle').value=bgState.angle;
}
document.querySelectorAll('[data-palette]').forEach(btn=>btn.onclick=()=>{
  bgState.colors=[...palettes[btn.dataset.palette]]; updateBackground(); updateBgInputs();
});
['bg1','bg2','bg3'].forEach((id,i)=>document.querySelector('#'+id).addEventListener('input',e=>{
  bgState.colors[i]=e.target.value; updateBackground();
}));
document.querySelector('#bgAngle').addEventListener('input',e=>{ bgState.angle=Number(e.target.value); updateBackground(); });

const logoUpload=document.querySelector('#logoUpload');
const logoDepth=document.querySelector('#logoDepth');
const logoScale=document.querySelector('#logoScale');
const logoAnimation=document.querySelector('#logoAnimation');
logoUpload.addEventListener('change',e=>{
  const file=e.target.files?.[0]; if(!file) return;
  loadImageAsTexture(file,520,230,({texture,width,height})=>{
    if(logoState.texture) logoState.texture.dispose();
    logoState.texture=texture;
    logoState.width=width;
    logoState.height=height;
    buildLogo();
  });
});
logoDepth.addEventListener('input',e=>{ logoState.depth=Number(e.target.value); buildLogo(); });
logoScale.addEventListener('input',e=>{ logoState.scale=Number(e.target.value); applyLogoBase(); });
logoAnimation.addEventListener('change',e=>logoState.animation=e.target.value);

function setupPartnerUpload(selector,index){
  document.querySelector(selector).addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(!file) return;
    loadImageAsTexture(file,150,84,({texture,width,height})=>{
      const state=partnerStates[index];
      if(state.texture) state.texture.dispose();
      Object.assign(state,{texture,width,height});
      buildPartnerLogo(index);
      layoutPartnerLogos();
    });
  });
}
setupPartnerUpload('#partnerLogo1',0);
setupPartnerUpload('#partnerLogo2',1);

// --- Canvas dragging for text + sketch PNGs -------------------------------
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const dragPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
const planePoint=new THREE.Vector3();
const dragOffset=new THREE.Vector3();
let dragTarget=null;

function setPointerFromEvent(event){
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
}

function findInteractiveHit(event){
  setPointerFromEvent(event);
  const textHits=raycaster.intersectObjects(Object.values(meshes),false);
  if(textHits.length && textHits[0].object.userData.layerId){
    return { type:'text', id:textHits[0].object.userData.layerId };
  }
  const sketchMeshes=sketchStates.flatMap(s=>s.group ? s.group.children : []);
  const sketchHits=raycaster.intersectObjects(sketchMeshes,false);
  if(sketchHits.length){
    const id=sketchHits[0].object.userData.sketchId || sketchHits[0].object.parent?.userData.sketchId;
    const state=sketchStates.find(s=>s.id===id);
    if(state) return { type:'sketch', state };
  }
  return null;
}

function intersectDragPlane(event,z=0){
  setPointerFromEvent(event);
  dragPlane.constant=-z;
  return raycaster.ray.intersectPlane(dragPlane,planePoint)?planePoint.clone():null;
}

renderer.domElement.addEventListener('pointerdown',event=>{
  if(event.button!==0) return;
  const hit=findInteractiveHit(event);
  if(!hit) return;
  const z=hit.type==='sketch'?65:0;
  const p=intersectDragPlane(event,z);
  if(!p) return;
  dragTarget=hit;
  if(hit.type==='text'){
    dragOffset.set(fields[hit.id].x-p.x,fields[hit.id].y-p.y,0);
    selectLayer(hit.id);
  } else {
    dragOffset.set(hit.state.x-p.x,hit.state.y-p.y,0);
  }
  renderer.domElement.setPointerCapture(event.pointerId);
  renderer.domElement.classList.add('is-dragging');
  event.preventDefault();
});

renderer.domElement.addEventListener('pointermove',event=>{
  if(!dragTarget){
    renderer.domElement.classList.toggle('can-drag',Boolean(findInteractiveHit(event)));
    return;
  }
  const z=dragTarget.type==='sketch'?65:0;
  const p=intersectDragPlane(event,z);
  if(!p) return;
  if(dragTarget.type==='text'){
    const id=dragTarget.id;
    fields[id].x=p.x+dragOffset.x;
    fields[id].y=p.y+dragOffset.y;
    clampFieldToPoster(id);
    applyBaseTransform(id);
    if(selected===id) syncXYOnly();
  } else {
    const state=dragTarget.state;
    state.x=p.x+dragOffset.x;
    state.y=p.y+dragOffset.y;
    clampImageState(state);
    state.group.position.set(state.x,state.y,65);
  }
  event.preventDefault();
});

function stopDragging(event){
  if(!dragTarget) return;
  dragTarget=null;
  renderer.domElement.classList.remove('is-dragging');
  if(event?.pointerId!=null && renderer.domElement.hasPointerCapture(event.pointerId)){
    renderer.domElement.releasePointerCapture(event.pointerId);
  }
}
renderer.domElement.addEventListener('pointerup',stopDragging);
renderer.domElement.addEventListener('pointercancel',stopDragging);
renderer.domElement.addEventListener('pointerleave',()=>{ if(!dragTarget) renderer.domElement.classList.remove('can-drag'); });
renderer.domElement.style.touchAction='none';

function fitStage(){
  const availableW=stage.clientWidth-24;
  const availableH=stage.clientHeight-24;
  const s=Math.max(.12,Math.min(availableW/POSTER_W,availableH/POSTER_H,.75));
  renderer.setSize(POSTER_W*s,POSTER_H*s);
}
window.addEventListener('resize',fitStage);

function ensureEverythingVisible(){
  Object.keys(fields).forEach(id=>{ clampFieldToPoster(id); applyBaseTransform(id); });
  applyLogoBase();
  layoutPartnerLogos();
  sketchStates.forEach(state=>{
    clampImageState(state);
    if(state.group) state.group.position.set(state.x,state.y,65);
  });
}

document.querySelector('#exportPng').onclick=()=>{
  ensureEverythingVisible();
  const old=renderer.getSize(new THREE.Vector2());
  renderer.setSize(POSTER_W,POSTER_H,false);
  renderer.render(scene,camera);
  const a=document.createElement('a');
  a.download='more-amore-poster.png';
  a.href=renderer.domElement.toDataURL('image/png');
  a.click();
  renderer.setSize(old.x,old.y,false);
  fitStage();
};

function pickVideoMime(){
  const candidates=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  return candidates.find(type=>window.MediaRecorder?.isTypeSupported?.(type)) || '';
}

document.querySelector('#exportVideo').onclick=async()=>{
  const button=document.querySelector('#exportVideo');
  if(!renderer.domElement.captureStream || !window.MediaRecorder){
    alert('Video export is not supported in this browser. Try Chrome or Edge.');
    return;
  }
  button.disabled=true;
  const originalText=button.textContent;
  button.textContent='RECORDING 6s…';
  ensureEverythingVisible();
  const old=renderer.getSize(new THREE.Vector2());
  renderer.setSize(POSTER_W,POSTER_H,false);
  const stream=renderer.domElement.captureStream(30);
  const mime=pickVideoMime();
  const recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:10000000}:{videoBitsPerSecond:10000000});
  const chunks=[];
  recorder.ondataavailable=e=>{ if(e.data?.size) chunks.push(e.data); };
  recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:mime||'video/webm'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.download='more-amore-poster.webm';
    a.href=url;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    stream.getTracks().forEach(t=>t.stop());
    renderer.setSize(old.x,old.y,false);
    fitStage();
    button.disabled=false;
    button.textContent=originalText;
  };
  recorder.start(250);
  setTimeout(()=>recorder.stop(),VIDEO_DURATION_MS);
};

new FontLoader().load(
  'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json',
  f=>{
    font=f;
    rebuildAll();
    ensureEverythingVisible();
    selectLayer('guest');
    fitStage();
    render();
  }
);
