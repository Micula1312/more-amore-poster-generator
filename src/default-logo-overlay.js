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
    zIndex: '45',
    transform: 'translateX(-50%)'
  });

  stage.appendChild(logo);

  function syncLogoToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const left = canvasRect.left - stageRect.left;
    const top = canvasRect.top - stageRect.top;

    logo.style.left = `${left + canvasRect.width / 2}px`;
    logo.style.top = `${top + canvasRect.height * 0.035}px`;
    logo.style.width = `${canvasRect.width * 0.43}px`;
    logo.style.height = `${canvasRect.height * 0.13}px`;
  }

  const observer = new ResizeObserver(syncLogoToCanvas);
  observer.observe(stage);
  window.addEventListener('resize', syncLogoToCanvas);
  logo.addEventListener('load', syncLogoToCanvas);
  requestAnimationFrame(syncLogoToCanvas);
  setTimeout(syncLogoToCanvas, 250);

  // Once a custom main logo is uploaded, hide the preset logo to avoid duplication.
  document.querySelector('#logoUpload')?.addEventListener('change', e => {
    if (e.target.files?.[0]) logo.style.display = 'none';
  });
}
