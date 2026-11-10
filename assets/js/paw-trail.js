// The original paw runs up to its place in the wordmark, then stays there.
(function () {
  const trail = document.querySelector('.paw-trail');
  const logo = document.querySelector('.brand picture img');
  const logoSource = document.querySelector('[data-logo-text]');
  const landing = document.querySelector('.logo-paw');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!trail || !logo || !landing) return;
  const timers = new Set();
  let landed = false;
  let started = false;
  let paused = document.hidden;

  // These are the exact paw crop bounds within the 246 × 160 original logo.
  const measureLogo = () => {
    const box = logo.getBoundingClientRect();
    return { x: box.left + box.width * 120 / 246, y: box.top + box.height * 52 / 160,
      width: box.width * 130 / 246, height: box.height * 108 / 160 };
  };
  const updateTone = print => {
    const bounds = print.getBoundingClientRect();
    const below = document.elementFromPoint(
      Math.min(innerWidth - 1, Math.max(0, bounds.left + bounds.width / 2)),
      Math.min(innerHeight - 1, Math.max(0, bounds.top + bounds.height / 2))
    );
    print.classList.toggle('on-dark', Boolean(below?.closest('.hero, .cta-band, .site-footer')));
  };
  const arm = task => {
    task.deadline = performance.now() + task.remaining;
    task.timer = setTimeout(() => { timers.delete(task); task.callback(); }, task.remaining);
  };
  const later = (callback, delay) => {
    const task = { callback, remaining: delay, timer: null, deadline: 0 };
    timers.add(task);
    if (!paused) arm(task);
  };
  const pause = () => {
    if (paused) return;
    paused = true;
    timers.forEach(task => {
      task.remaining = Math.max(0, task.deadline - performance.now());
      clearTimeout(task.timer);
    });
    trail.classList.add('paused');
  };
  const resume = () => {
    if (!paused || reducedMotion.matches) return;
    paused = false;
    timers.forEach(arm);
    trail.classList.remove('paused');
  };
  const stop = () => {
    timers.forEach(task => clearTimeout(task.timer)); timers.clear(); trail.replaceChildren();
  };
  const land = () => {
    if (landed) return;
    landed = true;
    landing.hidden = false;
    landing.classList.add('landed');
  };
  const staticLogo = () => {
    stop(); landed = true; started = true;
    landing.hidden = true;
    if (logoSource) { logoSource.type = 'image/jpeg'; logoSource.srcset = logoSource.dataset.staticLogo; }
  };
  const createRoute = () => {
    const initial = measureLogo();
    if (!initial.width || !initial.height) return null;
    const leftSide = initial.x < innerWidth / 2;
    const wave = 6 + Math.random() * 12;
    const position = (progress, goal) => {
      const edge = leftSide ? goal.width / 2 + 12 : innerWidth - goal.width / 2 - 12;
      const blendTime = Math.min(1, Math.max(0, (progress - .55) / .35));
      const blend = blendTime * blendTime * (3 - 2 * blendTime);
      const bottom = innerHeight + goal.height * .3;
      return {
        x: edge + (goal.x - edge) * blend + Math.sin(progress * Math.PI * 2) * wave * (1 - blend),
        y: bottom + (goal.y - bottom) * progress
      };
    };
    return {
      length: Math.abs(innerHeight - initial.y) + Math.abs(initial.x - (leftSide ? 0 : innerWidth)),
      height: initial.height,
      pointAt: progress => {
        // Re-measure so the landing still aligns if the visitor scrolls/resizes.
        const goal = measureLogo();
        const point = position(progress, goal);
        const before = position(Math.max(0, progress - .01), goal);
        const after = position(Math.min(1, progress + .01), goal);
        return { ...point, width: goal.width, height: goal.height,
          heading: Math.atan2(after.y - before.y, after.x - before.x) };
      }
    };
  };
  const play = () => {
    if (started || reducedMotion.matches) return;
    const route = createRoute();
    if (!route) { staticLogo(); return; }
    started = true;
    const steps = Math.min(20, Math.max(5, Math.round(route.length / (route.height * 1.8))));
    // Quick pairs, a little hesitation, then another scamper.
    const beats = [120, 310, 105, 450, 135, 260];
    const fadeDuration = 20000;
    let landingAt = 0;
    for (let step = 0; step < steps; step++) {
      later(() => {
        if (document.hidden || reducedMotion.matches) return;
        const point = route.pointAt((step + .35) / (steps + 1));
        const side = (step % 2 ? 1 : -1) * point.width * .2;
        const print = document.createElement('span');
        print.className = 'paw-step';
        print.style.left = `${point.x - Math.sin(point.heading) * side}px`;
        print.style.top = `${point.y + Math.cos(point.heading) * side}px`;
        print.style.setProperty('--paw-width', `${point.width}px`);
        print.style.setProperty('--paw-height', `${point.height}px`);
        print.style.setProperty('--paw-fade-duration', `${fadeDuration}ms`);
        print.style.setProperty('--paw-turn', `${point.heading * 180 / Math.PI + 90 + (step % 2 ? 8 : -8)}deg`);
        const image = document.createElement('img');
        image.src = trail.dataset.pawSrc; image.alt = '';
        image.width = 130; image.height = 108;
        image.style.transform = step % 2 ? 'none' : 'scaleX(-1)';
        print.append(image); trail.append(print); updateTone(print);
      }, landingAt);
      landingAt += beats[step % beats.length] * (.9 + Math.random() * .2);
    }
    // The final print is in the header itself, at the original paw's exact size.
    later(land, landingAt + 100);
  };
  const start = delay => {
    if (reducedMotion.matches) { staticLogo(); return; }
    later(play, delay);
  };
  start(350);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else resume(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) staticLogo(); });
  let scrollPending = false;
  window.addEventListener('scroll', () => {
    if (scrollPending || !trail.children.length) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      trail.querySelectorAll('.paw-step').forEach(updateTone);
      scrollPending = false;
    });
  }, { passive: true });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', event => { if (event.persisted) resume(); });
})();
