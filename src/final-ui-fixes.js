// Final UI fixes: keep partner logos DOM-only, add an 8-color digital palette.
const stage = document.querySelector('#stage');
const partnerInputs = [document.querySelector('#partnerLogo1'), document.querySelector('#partnerLogo2')];

// main.js also listens to partner inputs and creates Three.js planes. Stop those handlers:
// partner-overlay.js remains the single visual source for the two fixed bottom-right logos.
partnerInputs.forEach(input => {
  if (!input) return;
  input.addEventListener('change', e => e.stopImmediatePropagation(), true);
});

// Remove any legacy Three.js partner-logo meshes that may already exist after a change.
// The DOM overlay is intentionally the only partner-logo renderer in the editor.

const DIGITAL_COLORS = [
  '#ff2aa1', // hyper pink
  '#ff4a1a', // digital orange
  '#d8ff00', // acid lime
  '#31ff70', // signal green
  '#00e5ff', // cyan
  '#1677ff', // electric blue
  '#b77cff', // ultraviolet
  '#f5ead8'  // warm white
];

function buildTextPalette() {
  const colorInput = document.querySelector('#color');
  if (!colorInput || document.querySelector('#digitalTextPalette')) return;
  const wrap = document.createElement('div');
  wrap.id = 'digitalTextPalette';
  wrap.className = 'digital-text-palette';
  wrap.innerHTML = '<div class="section-title">DIGITAL TEXT COLORS</div>';
  const swatches = document.createElement('div');
  swatches.className = 'digital-text-swatches';
  DIGITAL_COLORS.forEach(hex => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'digital-text-swatch';
    button.style.background = hex;
    button.title = hex;
    button.setAttribute('aria-label', `Set text color ${hex}`);
    button.addEventListener('click', () => {
      colorInput.value = hex;
      colorInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    swatches.appendChild(button);
  });
  wrap.appendChild(swatches);
  colorInput.closest('.two')?.insertAdjacentElement('afterend', wrap);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildTextPalette, { once:true });
else buildTextPalette();
