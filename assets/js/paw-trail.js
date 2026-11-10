// The logo reveals once; this separate decorative trail returns occasionally.
// Pausing a hidden tab never consumes the next visible pass.
(function () {
  const trail = document.querySelector('.paw-trail');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!trail) return;
  const timers = new Set();
  const updateTone = print => {
    const bounds = print.getBoundingClientRect();
    const below = document.elementFromPoint(
      Math.min(innerWidth - 1, Math.max(0, bounds.left + bounds.width / 2)),
      Math.min(innerHeight - 1, Math.max(0, bounds.top + bounds.height / 2))
    );
    print.classList.toggle('on-dark', Boolean(below?.closest('.hero, .cta-band, .site-footer')));
  };
  const later = (callback, delay) => {
    const timer = setTimeout(() => { timers.delete(timer); callback(); }, delay);
    timers.add(timer);
  };
  const stop = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    trail.replaceChildren();
  };
  const play = () => {
    if (document.hidden || reducedMotion.matches) return;
    const steps = Math.min(12, Math.max(5, Math.ceil(innerWidth / 105)));
    for (let step = 0; step < steps; step++) {
      later(() => {
        if (document.hidden || reducedMotion.matches) return;
        const print = document.createElement('span');
        print.className = 'paw-step';
        print.style.left = `${(step + 0.5) / steps * 100}%`;
        print.style.bottom = step % 2 ? '32px' : '6px';
        print.style.setProperty('--paw-turn', step % 2 ? '80deg' : '100deg');
        const image = document.createElement('img');
        image.src = trail.dataset.pawSrc;
        image.alt = '';
        image.width = 56;
        image.height = 47;
        image.style.transform = step % 2 ? 'scaleX(-1)' : 'none';
        print.append(image); trail.append(print);
        updateTone(print);
        print.addEventListener('animationend', () => print.remove(), { once: true });
        later(() => print.remove(), 3100);
      }, step * 280);
    }
    later(play, 30000);
  };
  const start = delay => {
    stop();
    if (!document.hidden && !reducedMotion.matches) later(play, delay);
  };
  const logo = document.querySelector('[data-logo-animation]');
  start(logo?.type === 'image/svg+xml' ? 4200 : 1000);
  document.addEventListener('visibilitychange', () => start(1000));
  reducedMotion.addEventListener('change', () => start(1000));
  let scrollPending = false;
  window.addEventListener('scroll', () => {
    if (scrollPending || !trail.children.length) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      trail.querySelectorAll('.paw-step').forEach(updateTone);
      scrollPending = false;
    });
  }, { passive: true });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', event => { if (event.persisted) start(1000); });
})();
