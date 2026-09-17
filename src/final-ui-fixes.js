// Final UI fixes: add an 8-color digital palette.
// Partner logo uploads are intentionally NOT intercepted here.
// partner-overlay.js is the single renderer for the two fixed bottom-right logos.

const DIGITAL_COLORS = [
  '#ff2aa1',
  '#ff4a1a',
  '#d8ff00',
  '#31ff70',
  '#00e5ff',
  '#1677ff',
  '#b77cff',
  '#f5ead8'
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
