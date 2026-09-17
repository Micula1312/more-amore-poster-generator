const stage = document.querySelector('#stage');

if (stage) {
  stage.style.position = 'relative';

  const logo = document.createElement('img');
  logo.id = 'more-amore-default-logo';
  logo.src = '/more-amore-logo.png';
  logo.alt = 'More Amore';

  Object.assign(logo.style, {
    position: 'absolute',
    pointerEvents: 'none',
    objectFit: 'contain',
    objectPosition: 'center center',
    display: 'block',
    zIndex: '200',
    transform: 'translate(-50%, -50%)',
    transformOrigin: 'center center',
    opacity: '1'
  });

  stage.appendChild(logo);

  function syncLogoToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const left = canvasRect.left - stageRect.left;
    const top = canvasRect.top - stageRect.top;
    const safeX = canvasRect.width * 0.075;
    const safeY = canvasRect.height * 0.065;
    const logoBandHeight = canvasRect.height * 0.13;

    // Fixed header band inside the same safe margin used by the poster content.
    logo.style.left = `${left + canvasRect.width / 2}px`;
    logo.style.top = `${top + safeY + logoBandHeight / 2}px`;
    logo.style.width = `${Math.min(canvasRect.width * 0.46, canvasRect.width - safeX * 2)}px`;
    logo.style.height = 'auto';
    logo.style.maxHeight = `${logoBandHeight}px`;
  }

  const observer = new ResizeObserver(syncLogoToCanvas);
  observer.observe(stage);
  window.addEventListener('resize', syncLogoToCanvas);
  logo.addEventListener('load', syncLogoToCanvas);
  requestAnimationFrame(syncLogoToCanvas);
  setTimeout(syncLogoToCanvas, 250);
  setTimeout(syncLogoToCanvas, 700);

  // A custom main logo replaces the preset logo. Its Three.js slot uses the same header area.
  document.querySelector('#logoUpload')?.addEventListener('change', e => {
    logo.style.display = e.target.files?.[0] ? 'none' : 'block';
  });
}
