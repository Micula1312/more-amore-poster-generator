const stage = document.querySelector('#stage');

if (stage) {
  stage.style.position = 'relative';

  const logo = document.createElement('img');
  logo.id = 'more-amore-default-logo';
  logo.src = `${import.meta.env.BASE_URL}logo-more-main.png`;
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
    opacity: '0'
  });

  stage.appendChild(logo);

  function syncLogoToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas || !logo.naturalWidth || !logo.naturalHeight) return;

    // Use layout dimensions instead of getBoundingClientRect(): body zoom must not
    // distort the overlay coordinates.
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    const safeY = ch * (86 / 1350);
    const bandH = ch * (150 / 1350);
    const maxW = cw * (430 / 1080);
    const ratio = logo.naturalWidth / logo.naturalHeight;

    let w = maxW;
    let h = w / ratio;
    if (h > bandH) {
      h = bandH;
      w = h * ratio;
    }

    logo.style.left = `${left + cw / 2}px`;
    logo.style.top = `${top + safeY + bandH / 2}px`;
    logo.style.width = `${w}px`;
    logo.style.height = `${h}px`;
    logo.style.maxWidth = 'none';
    logo.style.maxHeight = 'none';
    logo.style.opacity = '1';
  }

  const observer = new ResizeObserver(syncLogoToCanvas);
  observer.observe(stage);
  const canvas = stage.querySelector('canvas');
  if (canvas) observer.observe(canvas);
  window.addEventListener('resize', syncLogoToCanvas);
  logo.addEventListener('load', () => {
    requestAnimationFrame(syncLogoToCanvas);
    setTimeout(syncLogoToCanvas, 80);
  });

  if (logo.complete && logo.naturalWidth) requestAnimationFrame(syncLogoToCanvas);

  document.querySelector('#logoUpload')?.addEventListener('change', e => {
    logo.style.display = e.target.files?.[0] ? 'none' : 'block';
  });
}
