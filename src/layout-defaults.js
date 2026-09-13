const DEFAULTS = {
  logo:     { size:44, depth:18, x:0, y:400, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:3, metalness:.15, roughness:.3, color:'#fff1dc', animation:'none', animSpeed:1, animAmount:18 },
  guest:    { size:58, depth:24, x:0, y:250, scaleX:.9, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:4, metalness:.25, roughness:.2, color:'#b77cff', animation:'none', animSpeed:1, animAmount:24 },
  support1: { size:34, depth:12, x:0, y:105, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:2.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:18 },
  support2: { size:34, depth:12, x:0, y:25, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:2.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:18 },
  venue:    { size:40, depth:14, x:0, y:-125, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:3, metalness:.15, roughness:.28, color:'#ff4a1a', animation:'none', animSpeed:1, animAmount:18 },
  address:  { size:20, depth:7, x:0, y:-215, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:1.5, metalness:.1, roughness:.45, color:'#ff4a1a', animation:'none', animSpeed:1, animAmount:14 },
  date:     { size:40, depth:14, x:0, y:-390, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:3, metalness:.25, roughness:.25, color:'#b77cff', animation:'none', animSpeed:1, animAmount:18 },
  time:     { size:24, depth:8, x:0, y:-485, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0, bevel:1.5, metalness:.05, roughness:.4, color:'#f5ead8', animation:'none', animSpeed:1, animAmount:14 }
};

const controls = {
  size:'#size', depth:'#depth', x:'#x', y:'#y', scaleX:'#scaleX', scaleY:'#scaleY',
  rotZ:'#rotZ', rotX:'#rotX', bend:'#bend', bevel:'#bevel', metalness:'#metalness',
  roughness:'#roughness', color:'#color', animation:'#animationType', animSpeed:'#animSpeed', animAmount:'#animAmount'
};

function setControl(selector, value, eventType='input') {
  const el = document.querySelector(selector);
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event(eventType, { bubbles:true }));
}

function applyDefaultsToLayer(id, defaults = DEFAULTS[id]) {
  const btn = document.querySelector(`.field-btn[data-id="${CSS.escape(id)}"]`);
  if (!btn || !defaults) return false;
  btn.click();
  Object.entries(defaults).forEach(([key, value]) => {
    const selector = controls[key];
    if (!selector) return;
    const eventType = key === 'animation' ? 'change' : 'input';
    setControl(selector, value, eventType);
  });
  return true;
}

function applySafeInitialLayout() {
  Object.keys(DEFAULTS).forEach(id => applyDefaultsToLayer(id));
  document.querySelector('.field-btn[data-id="guest"]')?.click();
}

function resetSelectedLayer() {
  const active = document.querySelector('.field-btn.active');
  if (!active) return;
  const id = active.dataset.id;
  if (DEFAULTS[id]) {
    applyDefaultsToLayer(id);
    return;
  }

  // Dynamic ARTISTA / INFO layers: neutral transform/effects, keep current text.
  const fallback = {
    x:0, y:0, scaleX:1, scaleY:1, rotZ:0, rotX:0, bend:0,
    bevel:2, metalness:.05, roughness:.4, animation:'none', animSpeed:1, animAmount:16
  };
  Object.entries(fallback).forEach(([key, value]) => {
    const selector = controls[key];
    if (!selector) return;
    setControl(selector, value, key === 'animation' ? 'change' : 'input');
  });
}

function ensureResetButton() {
  if (document.querySelector('#resetLayer')) return;
  const fxRow = document.querySelector('.fx-row');
  if (!fxRow) return;
  const button = document.createElement('button');
  button.id = 'resetLayer';
  button.type = 'button';
  button.textContent = 'RESET POSIZIONE + EFFETTI';
  button.style.width = '100%';
  button.style.marginTop = '10px';
  button.addEventListener('click', resetSelectedLayer);
  fxRow.insertAdjacentElement('afterend', button);
}

function boot() {
  ensureResetButton();
  applySafeInitialLayout();
  // Run again after font loading/rebuild so the first frame is also guaranteed safe.
  setTimeout(applySafeInitialLayout, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), { once:true });
} else {
  setTimeout(boot, 0);
}
