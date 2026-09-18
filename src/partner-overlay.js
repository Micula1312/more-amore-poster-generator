const stage = document.querySelector('#stage');
const input1 = document.querySelector('#partnerLogo1');
const input2 = document.querySelector('#partnerLogo2');
const whiteToggle = document.querySelector('#partnerWhiteOverlay');

if (stage && input1 && input2) {
  stage.style.position = 'relative';

  const overlay = document.createElement('div');
  overlay.id = 'partner-logo-overlay';
  Object.assign(overlay.style, {
    position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'flex-end',
    justifyContent: 'flex-end', zIndex: '50', boxSizing: 'border-box'
  });
  stage.appendChild(overlay);

  const slots = [0, 1].map(() => {
    const img = document.createElement('img');
    img.alt = '';
    Object.assign(img.style, {display:'none', width:'auto', height:'auto', objectFit:'contain', flex:'0 0 auto'});
    overlay.appendChild(img);
    return img;
  });

  const whiteImages = [null, null];
  const originalImages = [null, null];
  const urls = [null, null];

  function makeWhiteAlphaLogo(sourceImage, done) {
    const c = document.createElement('canvas');
    c.width = sourceImage.naturalWidth;
    c.height = sourceImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(sourceImage, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'source-over';
    const data = c.toDataURL('image/png');
    const white = new Image();
    white.onload = () => done(white, data);
    white.src = data;
  }

  // IMPORTANT: body uses CSS zoom: .75. getBoundingClientRect() returns zoomed
  // coordinates, while absolute positioning inside #stage uses layout coordinates.
  // offset* values stay in the same coordinate system as the overlay, so logos
  // remain locked to the poster bottom-right instead of drifting toward center.
  function syncOverlayToCanvas() {
    const canvas = stage.querySelector('canvas');
    if (!canvas) return;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    const insetX = w * (86 / 1080);
    const insetY = h * (86 / 1350);

    overlay.style.left = `${left}px`;
    overlay.style.top = `${top}px`;
    overlay.style.width = `${w}px`;
    overlay.style.height = `${h}px`;
    overlay.style.padding = `0 ${insetX}px ${insetY}px 0`;
    overlay.style.gap = `${Math.max(8, w * (24 / 1080))}px`;

    slots.forEach(img => {
      img.style.maxWidth = `${w * (150 / 1080)}px`;
      img.style.maxHeight = `${h * (84 / 1350)}px`;
    });
  }

  function renderSlot(index) {
    const img = whiteToggle?.checked !== false ? whiteImages[index] : originalImages[index];
    if (!img) return;
    slots[index].src = img.src;
    slots[index].style.display = 'block';
    syncOverlayToCanvas();
  }

  function setLogo(index, file) {
    if (!file) return;
    if (urls[index]) URL.revokeObjectURL(urls[index]);
    urls[index] = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      originalImages[index] = image;
      makeWhiteAlphaLogo(image, (white) => {
        whiteImages[index] = white;
        renderSlot(index);
      });
    };
    image.src = urls[index];
  }

  function setDefaultLogo(index, src) {
    const image = new Image();
    image.onload = () => {
      originalImages[index] = image;
      makeWhiteAlphaLogo(image, (white) => {
        whiteImages[index] = white;
        renderSlot(index);
      });
    };
    image.src = src;
  }

  // Default More Amore short mark occupies partner slot 1 until the user replaces it.
  setDefaultLogo(0, `${import.meta.env.BASE_URL}logo-more-short.png`);

  input1.addEventListener('change', e => setLogo(0, e.target.files?.[0]));
  input2.addEventListener('change', e => setLogo(1, e.target.files?.[0]));
  whiteToggle?.addEventListener('change', () => { renderSlot(0); renderSlot(1); });

  const observer = new ResizeObserver(syncOverlayToCanvas);
  observer.observe(stage);
  requestAnimationFrame(() => {
    const canvas = stage.querySelector('canvas');
    if (canvas) observer.observe(canvas);
    syncOverlayToCanvas();
  });
  window.addEventListener('resize', syncOverlayToCanvas);
  setTimeout(syncOverlayToCanvas, 250);

  setTimeout(() => {
    const exportButton = document.querySelector('#exportPng');
    if (!exportButton) return;
    exportButton.onclick = () => {
      const source = stage.querySelector('canvas');
      if (!source) return;
      const out = document.createElement('canvas');
      out.width = 1080; out.height = 1350;
      const ctx = out.getContext('2d');
      ctx.drawImage(source, 0, 0, out.width, out.height);
      const maxW=150,maxH=84,rightMargin=86,bottomMargin=86,gap=24;
      let right=out.width-rightMargin;
      for(let i=whiteImages.length-1;i>=0;i--){
        const img=(whiteToggle?.checked !== false ? whiteImages[i] : originalImages[i]); if(!img) continue;
        const ratio=Math.min(maxW/img.naturalWidth,maxH/img.naturalHeight,1);
        const w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;
        const x=right-w,y=out.height-bottomMargin-h;
        ctx.drawImage(img,x,y,w,h); right=x-gap;
      }
      const a=document.createElement('a');
      a.download='more-amore-poster.png';
      a.href=out.toDataURL('image/png'); a.click();
    };
  },400);
}
