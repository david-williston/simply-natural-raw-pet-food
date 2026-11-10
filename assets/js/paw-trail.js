// A short, decorative trail uses the original logo's paw, mirrored left/right.
// It plays once per browser session and never intercepts the visitor's controls.
(function () {
  const trail = document.querySelector('.paw-trail');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!trail || reducedMotion.matches) return;
  try {
    if (sessionStorage.getItem('sn-paw-trail-v1')) return;
    sessionStorage.setItem('sn-paw-trail-v1', 'seen');
  } catch (e) { /* Without storage, the trail still plays just once per page. */ }

  const timers = [];
  const clear = () => { timers.forEach(clearTimeout); trail.replaceChildren(); };
  const play = () => {
    if (document.hidden || reducedMotion.matches) return;
    const width = innerWidth;
    const steps = Math.min(12, Math.max(5, Math.ceil(width / 105)));
    for (let step = 0; step < steps; step++) {
      timers.push(setTimeout(() => {
        if (document.hidden || reducedMotion.matches) return;
        const print = document.createElement('span');
        print.className = 'paw-step';
        print.style.left = `${(step + 0.5) / steps * 100}%`;
        print.style.bottom = step % 2 ? '28px' : '4px';
        print.style.setProperty('--paw-turn', step % 2 ? '80deg' : '100deg');
        const image = document.createElement('img');
        image.src = trail.dataset.pawSrc;
        image.alt = '';
        image.width = 42;
        image.height = 35;
        image.style.transform = step % 2 ? 'scaleX(-1)' : 'none';
        print.append(image); trail.append(print);
        print.addEventListener('animationend', () => print.remove(), { once: true });
      }, step * 240));
    }
  };
  // The logo settles first; the footsteps then cross the bottom edge briefly.
  timers.push(setTimeout(play, 4200));
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) clear(); });
})();
