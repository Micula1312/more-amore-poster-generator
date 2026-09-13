import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { gsap } from 'gsap';
import './style.css';

const POSTER_W = 1080;
const POSTER_H = 1350;
const SCALE = 0.56;

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(POSTER_W * SCALE, POSTER_H * SCALE);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.querySelector('#stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a0f14');

const camera = new THREE.PerspectiveCamera(28, POSTER_W / POSTER_H, 1, 5000);
camera.position.set(0, 0, 1850);

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const key = new THREE.DirectionalLight(0xfff2df, 4.2);
key.position.set(-300, 420, 900);
scene.add(key);
const rim = new THREE.DirectionalLight(0x8f5cff, 3.0);
rim.position.set(600, -200, 700);
scene.add(rim);

const bg = new THREE.Mesh(
  new THREE.PlaneGeometry(POSTER_W, POSTER_H),
  new THREE.MeshBasicMaterial({ color: '#2b0e13' })
);
bg.position.z = -180;
scene.add(bg);

const fields = {
  logo: { label:'MORE AMORE', text:'MORE AMORE', size:118, depth:28, x:0, y:500, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-0.12, bevel:5, metalness:.15, roughness:.3, color:'#fff1dc' },
  guest: { label:'GUEST', text:'GUEST NAME', size:170, depth:44, x:0, y:250, scaleX:1.05, scaleY:1, rotZ:0, rotX:-3, bend:.35, bevel:7, metalness:.25, roughness:.2, color:'#b77cff' },
  support1: { label:'SUPPORT 1', text:'ARTIST NAME 1', size:82, depth:22, x:0, y:30, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.12, bevel:4, metalness:.05, roughness:.4, color:'#f5ead8' },
  support2: { label:'SUPPORT 2', text:'ARTIST NAME 2', size:82, depth:22, x:0, y:-60, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.08, bevel:4, metalness:.05, roughness:.4, color:'#f5ead8' },
  venue: { label:'VENUE', text:'CLUB NAME', size:92, depth:28, x:0, y:-215, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:.15, bevel:5, metalness:.15, roughness:.28, color:'#ff4a1a' },
  address: { label:'ADDRESS', text:'VIA INDIRIZZO, CITTÀ', size:44, depth:12, x:0, y:-305, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:.12, bevel:2, metalness:.1, roughness:.45, color:'#ff4a1a' },
  date: { label:'DATE', text:'DAY 00 MONTH', size:102, depth:30, x:0, y:-430, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:-.12, bevel:5, metalness:.25, roughness:.25, color:'#b77cff' },
  time: { label:'TIME', text:'00:00 — 00:00', size:54, depth:16, x:0, y:-535, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:2.5, metalness:.05, roughness:.4, color:'#f5ead8' }
};

let font;
const meshes = {};
let selected = 'guest';

function makeMaterial(cfg){
  return new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: cfg.metalness,
    roughness: cfg.roughness
  });
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
    const curve = cfg.bend * ((x*x)/denom) * 260;
    pos.setY(i, y + curve);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

function rebuild(id){
  if(!font) return;
  const cfg = fields[id];
  if(meshes[id]){
    scene.remove(meshes[id]);
    meshes[id].geometry.dispose();
    meshes[id].material.dispose();
  }
  const mesh = new THREE.Mesh(buildGeometry(cfg), makeMaterial(cfg));
  mesh.position.set(cfg.x, cfg.y, 0);
  mesh.rotation.x = THREE.MathUtils.degToRad(cfg.rotX);
  mesh.rotation.z = THREE.MathUtils.degToRad(cfg.rotZ);
  mesh.scale.set(cfg.scaleX, cfg.scaleY, 1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  meshes[id] = mesh;
  scene.add(mesh);
}

function rebuildAll(){
  Object.keys(fields).forEach(rebuild);
}

function render(){
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

new FontLoader().load(
  'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json',
  f => {
    font = f;
    rebuildAll();
    render();
    selectLayer('guest');
  }
);

const fieldsEl = document.querySelector('#fields');
Object.entries(fields).forEach(([id,cfg])=>{
  const b = document.createElement('button');
  b.className = 'field-btn';
  b.dataset.id = id;
  b.innerHTML = `<span>${cfg.label}</span><span class="field-key">${id}</span>`;
  b.onclick = ()=>selectLayer(id);
  fieldsEl.appendChild(b);
});

const controls = {
  text: document.querySelector('#textInput'),
  size: document.querySelector('#size'),
  depth: document.querySelector('#depth'),
  x: document.querySelector('#x'),
  y: document.querySelector('#y'),
  scaleX: document.querySelector('#scaleX'),
  scaleY: document.querySelector('#scaleY'),
  rotZ: document.querySelector('#rotZ'),
  rotX: document.querySelector('#rotX'),
  bend: document.querySelector('#bend'),
  bevel: document.querySelector('#bevel'),
  metalness: document.querySelector('#metalness'),
  roughness: document.querySelector('#roughness'),
  color: document.querySelector('#color')
};

function selectLayer(id){
  selected = id;
  document.querySelector('#selectedName').textContent = fields[id].label;
  document.querySelectorAll('.field-btn').forEach(b=>b.classList.toggle('active', b.dataset.id===id));
  syncControls();
}

function syncControls(){
  const c = fields[selected];
  controls.text.value = c.text;
  for (const k of ['size','depth','x','y','scaleX','scaleY','rotZ','rotX','bend','bevel','metalness','roughness','color']){
    controls[k].value = c[k];
  }
}

let rebuildTimer;
function queueRebuild(){
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(()=>rebuild(selected), 20);
}

controls.text.addEventListener('input', e => { fields[selected].text = e.target.value || ' '; queueRebuild(); });
['size','depth','bend','bevel','color'].forEach(k=>{
  controls[k].addEventListener('input', e=>{
    fields[selected][k] = k === 'color' ? e.target.value : Number(e.target.value);
    queueRebuild();
  });
});
['metalness','roughness'].forEach(k=>{
  controls[k].addEventListener('input', e=>{
    fields[selected][k] = Number(e.target.value);
    if(meshes[selected]) meshes[selected].material[k] = fields[selected][k];
  });
});
['x','y'].forEach(k=>{
  controls[k].addEventListener('input', e=>{
    fields[selected][k] = Number(e.target.value);
    if(meshes[selected]) gsap.to(meshes[selected].position,{ [k]:fields[selected][k], duration:.12, overwrite:true });
  });
});
['scaleX','scaleY'].forEach(k=>{
  controls[k].addEventListener('input', e=>{
    fields[selected][k] = Number(e.target.value);
    if(meshes[selected]){
      const axis = k === 'scaleX' ? 'x' : 'y';
      gsap.to(meshes[selected].scale,{ [axis]:fields[selected][k], duration:.12, overwrite:true });
    }
  });
});
['rotZ','rotX'].forEach(k=>{
  controls[k].addEventListener('input', e=>{
    fields[selected][k] = Number(e.target.value);
    if(meshes[selected]){
      const axis = k === 'rotZ' ? 'z' : 'x';
      gsap.to(meshes[selected].rotation,{ [axis]:THREE.MathUtils.degToRad(fields[selected][k]), duration:.12, overwrite:true });
    }
  });
});

document.querySelectorAll('[data-fx]').forEach(btn=>{
  btn.onclick = ()=>{
    const c = fields[selected];
    const fx = btn.dataset.fx;
    if(fx==='plastic'){
      c.metalness=.2;c.roughness=.18;c.bevel=Math.max(c.bevel,5);
    }
    if(fx==='chrome'){
      c.metalness=1;c.roughness=.08;c.color='#d9e2ea';c.bevel=Math.max(c.bevel,6);
    }
    if(fx==='cream'){
      c.metalness=.05;c.roughness=.42;c.color='#f5ead8';
    }
    syncControls(); rebuild(selected);
  };
});

function applyPreset(type){
  if(type==='classic'){
    scene.background.set('#2a0f14');
    fields.guest.color='#b77cff'; fields.guest.bend=.35; fields.guest.metalness=.25;
    fields.venue.color='#ff4a1a'; fields.date.color='#b77cff';
  }
  if(type==='chrome'){
    scene.background.set('#090909');
    Object.values(fields).forEach(c=>{ c.color='#dfe7ee'; c.metalness=.95; c.roughness=.08; c.bevel=Math.max(c.bevel,5); });
    fields.guest.color='#f3a6ff';
  }
  if(type==='warp'){
    scene.background.set('#1d0c15');
    fields.guest.bend=.85; fields.guest.scaleX=1.2; fields.guest.rotX=-12;
    fields.support1.bend=-.42; fields.support2.bend=-.28;
    fields.date.bend=.45;
  }
  rebuildAll(); syncControls();
}

document.querySelector('#presetClassic').onclick=()=>applyPreset('classic');
document.querySelector('#presetChrome').onclick=()=>applyPreset('chrome');
document.querySelector('#presetWarp').onclick=()=>applyPreset('warp');

document.querySelector('#exportPng').onclick=()=>{
  const old = renderer.getSize(new THREE.Vector2());
  renderer.setSize(POSTER_W, POSTER_H, false);
  renderer.render(scene,camera);
  const a = document.createElement('a');
  a.download = 'more-amore-poster.png';
  a.href = renderer.domElement.toDataURL('image/png');
  a.click();
  renderer.setSize(old.x, old.y, false);
};

window.addEventListener('resize',()=>{
  const availableW = document.querySelector('#stage').clientWidth - 24;
  const availableH = document.querySelector('#stage').clientHeight - 24;
  const s = Math.min(availableW/POSTER_W, availableH/POSTER_H, .75);
  renderer.setSize(POSTER_W*s, POSTER_H*s);
});
