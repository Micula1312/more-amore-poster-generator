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
    zIndex: '50',
    boxSizing: 'border-box'
  });
  stage.appendChild(overlay);

  const slots = [0, 1].map(() => {
    const img = document.createElement('img');
    img.alt = '';
    Object.assign(img.style, {
      display: 'none',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      flex: '0 0 auto'
    });
    overlay.appendChild(img);
    return img;
  });

  const whiteImages = [null, null];
  const urls = [null, null];

  function makeWhiteAlphaLogo(sourceImage, done) {
    const c = document.createElement('canvas');
    c.width = sourceImage.naturalWidth;
    c.height = sourceImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(sourceImage, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'source-over';
    const white = new Image();
    const data = c.toDataURL('image/png');
    white.onload = () => done(white, data);
    white.src = data;
  }

  // The overlay is locked to the ACTUAL poster canvas bounds.
  // Insets are proportional to the 1080x1350 poster safe margin.
  function syncOverlayToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const insetX = canvasRect.width * (86 / 1080);
    const insetY = canvasRect.height * (86 / 1350);

    overlay.style.left = `${canvasRect.left - stageRect.left}px`;
    overlay.style.top = `${canvasRect.top - stageRect.top}px`;
    overlay.style.width = `${canvasRect.width}px`;
    overlay.style.height = `${canvasRect.height}px`;
    overlay.style.padding = `0 ${insetX}px ${insetY}px 0`;
    overlay.style.gap = `${Math.max(8, canvasRect.width * (24 / 1080))}px`;

    slots.forEach(img => {
      img.style.maxWidth = `${canvasRect.width * (150 / 1080)}px`;
      img.style.maxHeight = `${canvasRect.height * (84 / 1350)}px`;
    });
  }

  function setLogo(index, file) {
    if (!file) return;
    if (urls[index]) URL.revokeObjectURL(urls[index]);
    const url = URL.createObjectURL(file);
    urls[index] = url;
    const image = new Image();
    image.onload = () => {
      makeWhiteAlphaLogo(image, (white, whiteUrl) => {
        whiteImages[index] = white;
        slots[index].src = whiteUrl;
        slots[index].style.display = 'block';
        syncOverlayToCanvas();
      });
    };
    image.src = url;
  }

  input1.addEventListener('change', e => setLogo(0, e.target.files?.[0]));
  input2.addEventListener('change', e => setLogo(1, e.target.files?.[0]));

  const observer = new ResizeObserver(syncOverlayToCanvas);
  observer.observe(stage);
  const canvas = stage.querySelector('canvas');
  if (canvas) observer.observe(canvas);
  window.addEventListener('resize', syncOverlayToCanvas);
  requestAnimationFrame(syncOverlayToCanvas);
  setTimeout(syncOverlayToCanvas, 250);

  // PNG export uses the exact same bottom-right coordinates.
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
      const maxW = 150, maxH = 84, rightMargin = 86, bottomMargin = 86, gap = 24;
      let right = out.width - rightMargin;
      for (let i = whiteImages.length - 1; i >= 0; i--) {
        const img = whiteImages[i];
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
