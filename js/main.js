// scroll reveal
function initReveal(selector){
  const els = document.querySelectorAll(selector);
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.1});
  els.forEach(el=>io.observe(el));
}

// build a 3x3 (or Nx) flip-card gallery from a steps array into #grid9,
// wire up the shared flip modal (#flipOverlay etc, expected in page HTML)
function initFlipGallery(steps){
  const grid = document.getElementById('grid9');
  if(!grid) return;
  steps.forEach((s, i) => {
    if(s.static){
      const tile = document.createElement('div');
      tile.className = 'tile-static' + (s.zoomable ? ' zoomable' : '');
      tile.innerHTML = `<span class="tag-n">${s.n}</span><img src="${s.img}" alt="${s.alt}" loading="lazy">`;
      grid.appendChild(tile);
      return;
    }
    const tile = document.createElement('button');
    if(s.dual){
      tile.className = 'dual-shot';
      tile.setAttribute('aria-label', 'View details for ' + s.title);
      tile.innerHTML = `<span class="tag-n">${s.n}</span><img class="shot-a" src="${s.dual[0].img}" alt="${s.dual[0].alt}" loading="lazy"><img class="shot-b" src="${s.dual[1].img}" alt="${s.dual[1].alt}" loading="lazy">`;
    } else {
      tile.className = 'tile' + (s.zoomable ? ' zoomable' : '');
      tile.setAttribute('aria-label', 'View details for ' + s.title);
      tile.innerHTML = `<span class="tag-n">${s.n}</span><img src="${s.img}" alt="${s.alt}" loading="lazy"><span class="hint">${s.noFlip ? 'CLICK TO EXPAND' : 'CLICK FOR DETAIL'}</span>`;
    }
    tile.addEventListener('click', () => openFlip(steps, i));
    grid.appendChild(tile);
  });

  const overlay = document.getElementById('flipOverlay');
  const card = document.getElementById('flipCard');
  const closeBtn = document.getElementById('flipClose');

  window.openFlip = function(steps, i){
    const s = steps[i];
    const img = document.getElementById('flipImg');
    if(s.dual){
      img.src = s.dual[0].img;
      img.alt = s.dual[0].alt;
    } else {
      img.src = s.img;
      img.alt = s.alt;
    }
    img.classList.toggle('rotate-ccw', !!s.rotate);
    document.getElementById('flipCard').classList.toggle('wide', !!s.rotate);
    const tagFront = document.getElementById('flipTagFront');
    if(tagFront) tagFront.textContent = s.n;
    document.getElementById('flipTagBack').textContent = 'STEP ' + s.n;
    document.getElementById('flipTitle').textContent = s.title;
    document.getElementById('flipDesc').textContent = s.desc;
    overlay.classList.remove('flipped');
    overlay.dataset.noFlip = s.noFlip ? '1' : '';
    const instr = document.querySelector('.flip-instruction');
    if(instr){
      instr.style.display = s.noFlip ? 'none' : '';
      instr.style.visibility = 'visible';
      instr.classList.toggle('top-right', !!s.instrTop);
    }
    overlay.classList.add('open');
    closeBtn.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  function closeFlip(){
    overlay.classList.remove('open');
    closeBtn.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(()=>overlay.classList.remove('flipped'), 250);
  }
  let isFlipAnimating = false;
  let touchStartX = 0, touchStartY = 0, touchMoved = false;

  function setFrontBadgesVisible(visible){
    const instr = document.querySelector('.flip-instruction');
    if(instr) instr.style.visibility = visible ? 'visible' : 'hidden';
  }

  card.addEventListener('touchstart', (e)=>{
    const t = e.touches[0];
    touchStartX = t.clientX; touchStartY = t.clientY; touchMoved = false;
  }, {passive:true});

  card.addEventListener('touchmove', (e)=>{
    const t = e.touches[0];
    if(Math.abs(t.clientX - touchStartX) > 10 || Math.abs(t.clientY - touchStartY) > 10){
      touchMoved = true;
    }
  }, {passive:true});

  card.addEventListener('click', ()=>{
    if(overlay.dataset.noFlip === '1') return;
    if(touchMoved) return; // was a scroll/drag on the back-face text, not a tap to flip
    if(isFlipAnimating) return; // ignore taps mid-flip to prevent desync
    isFlipAnimating = true;
    const willBeFlipped = !overlay.classList.contains('flipped');
    overlay.classList.toggle('flipped');
    // the front-face number badge only belongs on the front; swap its visibility
    // at the halfway point of the rotation instead of trusting backface-visibility,
    // since some mobile browsers still show it mirrored through the back face
    setTimeout(()=>{ setFrontBadgesVisible(!willBeFlipped); }, 350);
    setTimeout(()=>{ isFlipAnimating = false; }, 700);
  });
  closeBtn.addEventListener('click', closeFlip);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeFlip(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeFlip(); });
}

// main hero shot click -> reveal the gallery grid below it
function initGalleryReveal(){
  const shot = document.getElementById('mainShot');
  const grid = document.getElementById('grid9');
  const hint = document.getElementById('revealHint');
  const gridHint = document.getElementById('gridHint');
  const codeLink = document.getElementById('codeLink');
  if(!shot || !grid) return;
  shot.addEventListener('click', ()=>{
    grid.classList.toggle('open');
    const isOpen = grid.classList.contains('open');
    if(hint) hint.style.display = isOpen ? 'none' : '';
    if(gridHint) gridHint.style.display = isOpen ? '' : 'none';
    if(codeLink) codeLink.style.display = isOpen ? '' : 'none';
  });
}

// magnifier-style zoom: image scales up on hover, zoom point follows the cursor
function initZoomFollow(){
  document.querySelectorAll('.zoomable').forEach(el => {
    const img = el.querySelector('img');
    if(!img) return;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      img.style.transformOrigin = x + '% ' + y + '%';
    });
    el.addEventListener('mouseleave', () => {
      img.style.transformOrigin = 'center';
    });
  });
}

// mobile dropdown nav: inject hamburger button, toggle .nav-links open state
function initMobileNav(){
  const nav = document.querySelector('nav');
  const links = nav ? nav.querySelector('.nav-links') : null;
  if(!nav || !links) return;

  const btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Toggle menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  const closeMenu = () => {
    links.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if(!nav.contains(e.target)) closeMenu();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal('.reveal-auto');
  initGalleryReveal();
  initZoomFollow();
  initMobileNav();

  // magnifier zoom inside the enlarged flip-card front image too
  const flipFront = document.querySelector('.flip-front');
  const flipImgEl = document.getElementById('flipImg');
  if(flipFront && flipImgEl){
    flipFront.addEventListener('mousemove', (e) => {
      const rect = flipFront.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      flipImgEl.style.transformOrigin = x + '% ' + y + '%';
    });
    flipFront.addEventListener('mouseleave', () => {
      flipImgEl.style.transformOrigin = 'center';
    });
  }
});
