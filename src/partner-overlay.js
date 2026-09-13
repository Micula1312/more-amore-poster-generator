import './layout-defaults.js';

const stage = document.querySelector('#stage');
const input1 = document.querySelector('#partnerLogo1');
const input2 = document.querySelector('#partnerLogo2');

if (stage && input1 && input2) {
  stage.style.position = 'relative';

  const overlay = document.createElement('div');
  overlay.id = 'partner-logo-overlay';
  Object.assign(overlay.style, {
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: '14px',
    zIndex: '50'
  });
  stage.appendChild(overlay);

  const slots = [0, 1].map(() => {
    const img = document.createElement('img');
    img.alt = '';
    Object.assign(img.style, {
      display: 'none',
      width: 'auto',
      height: 'auto',
      maxWidth: '15%',
      maxHeight: '8%',
      objectFit: 'contain',
      flex: '0 0 auto'
    });
    overlay.appendChild(img);
    return img;
  });

  const loadedImages = [null, null];
  const urls = [null, null];

  function syncOverlayToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const left = canvasRect.left - stageRect.left;
    const top = canvasRect.top - stageRect.top;
    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${canvasRect.width}px`;
    overlay.style.height = `${canvasRect.height}px`;
    overlay.style.paddingRight = `${Math.max(18, canvasRect.width * 0.065)}px`;
    overlay.style.paddingBottom = `${Math.max(18, canvasRect.height * 0.055)}px`;
    overlay.style.gap = `${Math.max(10, canvasRect.width * 0.02)}px`;

    slots.forEach(img => {
      img.style.maxWidth = `${Math.max(54, canvasRect.width * 0.15)}px`;
      img.style.maxHeight = `${Math.max(36, canvasRect.height * 0.08)}px`;
    });
  }

  function setLogo(index, file) {
    if (!file) return;
    if (urls[index]) URL.revokeObjectURL(urls[index]);
    const url = URL.createObjectURL(file);
    urls[index] = url;

    const image = new Image();
    image.onload = () => {
      loadedImages[index] = image;
      slots[index].src = url;
      slots[index].style.display = 'block';
      syncOverlayToCanvas();
    };
    image.src = url;
  }

  input1.addEventListener('change', e => setLogo(0, e.target.files?.[0]));
  input2.addEventListener('change', e => setLogo(1, e.target.files?.[0]));

  const observer = new ResizeObserver(syncOverlayToCanvas);
  observer.observe(stage);
  window.addEventListener('resize', syncOverlayToCanvas);
  requestAnimationFrame(syncOverlayToCanvas);
  setTimeout(syncOverlayToCanvas, 250);

  setTimeout(() => {
    const exportButton = document.querySelector('#exportPng');
    if (!exportButton) return;

    exportButton.onclick = () => {
      const source = stage.querySelector('canvas');
      if (!source) return;

      const out = document.createElement('canvas');
      out.width = 1080;
      out.height = 1350;
      const ctx = out.getContext('2d');
      ctx.drawImage(source, 0, 0, out.width, out.height);

      const maxW = 150;
      const maxH = 84;
      const rightMargin = 72;
      const bottomMargin = 72;
      const gap = 24;
      let right = out.width - rightMargin;

      for (let i = loadedImages.length - 1; i >= 0; i--) {
        const img = loadedImages[i];
        if (!img) continue;
        const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
        const w = img.naturalWidth * ratio;
        const h = img.naturalHeight * ratio;
        const x = right - w;
        const y = out.height - bottomMargin - h;
        ctx.drawImage(img, x, y, w, h);
        right = x - gap;
      }

      const a = document.createElement('a');
      a.download = 'more-amore-poster.png';
      a.href = out.toDataURL('image/png');
      a.click();
    };
  }, 400);
}
