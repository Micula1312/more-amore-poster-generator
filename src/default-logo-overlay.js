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
    transform: 'translateX(-50%)',
    transformOrigin: 'top center',
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

    // Keep the complete PNG safely inside the top of the poster.
    logo.style.left = `${left + canvasRect.width / 2}px`;
    logo.style.top = `${top + canvasRect.height * 0.025}px`;
    logo.style.width = `${canvasRect.width * 0.46}px`;
    logo.style.height = 'auto';
    logo.style.maxHeight = `${canvasRect.height * 0.15}px`;
  }

  const observer = new ResizeObserver(syncLogoToCanvas);
  observer.observe(stage);
  window.addEventListener('resize', syncLogoToCanvas);
  logo.addEventListener('load', () => {
    logo.style.visibility = 'visible';
    syncLogoToCanvas();
  });
  requestAnimationFrame(syncLogoToCanvas);
  setTimeout(syncLogoToCanvas, 250);
  setTimeout(syncLogoToCanvas, 700);

  // A custom main logo replaces the preset logo.
  document.querySelector('#logoUpload')?.addEventListener('change', e => {
    logo.style.display = e.target.files?.[0] ? 'none' : 'block';
  });
}
