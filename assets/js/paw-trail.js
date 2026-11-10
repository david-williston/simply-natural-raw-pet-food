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
  let previousRoute = -1;
  const createRoute = () => {
    const margin = innerWidth < 600 ? 30 : 44;
    const headerBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
    const top = Math.max(margin, headerBottom + margin);
    const bottom = innerHeight - margin;
    if (bottom - top < 140) return null;
    const corners = [
      { x: margin, y: top }, { x: innerWidth - margin, y: top },
      { x: innerWidth - margin, y: bottom }, { x: margin, y: bottom }
    ];
    let choice;
    do { choice = Math.floor(Math.random() * 8); } while (choice === previousRoute);
    previousRoute = choice;
    const direction = choice < 4 ? 1 : -1;
    const first = choice % 4;
    const [a, b, c] = [0, 1, 2].map(i => corners[(first + i * direction + 8) % 4]);
    const distance = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
    const unit = (p, q) => ({ x: (q.x - p.x) / distance(p, q), y: (q.y - p.y) / distance(p, q) });
    const incoming = unit(a, b), outgoing = unit(b, c);
    const radius = Math.min(60, distance(a, b) / 4, distance(b, c) / 4);
    const before = { x: b.x - incoming.x * radius, y: b.y - incoming.y * radius };
    const after = { x: b.x + outgoing.x * radius, y: b.y + outgoing.y * radius };
    const samples = [a];
    const line = (p, q) => {
      const count = Math.ceil(distance(p, q) / 20);
      for (let i = 1; i <= count; i++) samples.push({ x: p.x + (q.x - p.x) * i / count, y: p.y + (q.y - p.y) * i / count });
    };
    line(a, before);
    for (let i = 1; i <= 12; i++) {
      const t = i / 12, u = 1 - t;
      samples.push({ x: u * u * before.x + 2 * u * t * b.x + t * t * after.x, y: u * u * before.y + 2 * u * t * b.y + t * t * after.y });
    }
    line(after, c);
    let length = 0;
    const segments = samples.slice(1).map((point, i) => {
      const start = samples[i], size = distance(start, point);
      length += size;
      return { start, end: point, size, finish: length };
    });
    return {
      length,
      pointAt: progress => {
        const at = length * progress;
        const segment = segments.find(s => s.finish >= at) || segments[segments.length - 1];
        const t = (at - segment.finish + segment.size) / segment.size;
        return { x: segment.start.x + (segment.end.x - segment.start.x) * t, y: segment.start.y + (segment.end.y - segment.start.y) * t, heading: Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) };
      }
    };
  };
  const play = () => {
    if (document.hidden || reducedMotion.matches) return;
    const route = createRoute();
    if (!route) { later(play, 20000); return; }
    const steps = Math.min(20, Math.max(6, Math.round(route.length / 85)));
    const cadence = 145 + Math.random() * 65;
    const stride = innerWidth < 600 ? 6 : 9;
    for (let step = 0; step < steps; step++) {
      later(() => {
        if (document.hidden || reducedMotion.matches) return;
        const point = route.pointAt((step + 0.5) / steps);
        const side = step % 2 ? stride : -stride;
        const print = document.createElement('span');
        print.className = 'paw-step';
        print.style.left = `${point.x - Math.sin(point.heading) * side}px`;
        print.style.top = `${point.y + Math.cos(point.heading) * side}px`;
        print.style.setProperty('--paw-turn', `${point.heading * 180 / Math.PI + 90 + (step % 2 ? -8 : 8)}deg`);
        const image = document.createElement('img');
        image.src = trail.dataset.pawSrc;
        image.alt = '';
        image.width = 56;
        image.height = 47;
        image.style.transform = step % 2 ? 'scaleX(-1)' : 'none';
        print.append(image); trail.append(print);
        updateTone(print);
        print.addEventListener('animationend', () => print.remove(), { once: true });
        later(() => print.remove(), 2500);
      }, step * cadence);
    }
    later(play, 20000);
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
