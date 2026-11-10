// Decorative trout that swims through the green call-to-action band (the canvas in layouts/_partials/cta.html).
// Borrowed from davidwilliston.com, where it swims in the pond at the bottom of the page.
//
// The fish is a small 3D model drawn on a canvas: a flexible spine with a trout-shaped
// cross-section at each point, seen from slightly above. The head steers towards randomly
// chosen waypoints and the body follows it through turns, while a swimming wave runs down to the
// tail. Fins, eye and gill line are attached to the body, so everything foreshortens and
// flexes together. Skipped entirely for visitors who prefer reduced motion.

(function () {
    const canvas = document.getElementById('bg-fish');
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const card = canvas;

    // ---------- Model ----------

    const SEG = 16;                     // spine segments, head (0) to tail base (SEG)
    let LANE_Y = 28;                    // screen y of the swimming lane (CSS px); set from the band's height in resize()
    const ELEV = 22 * Math.PI / 180;    // camera looks down on the fish by this much
    const CE = Math.cos(ELEV), SE = Math.sin(ELEV);
    const MAX_BEND = 0.2;               // radians between neighbouring spine segments

    // Body height along the spine (fraction of max height), a trout profile.
    const PROFILE = [[0, 0.3], [0.05, 0.64], [0.12, 0.85], [0.25, 0.98], [0.4, 1], [0.55, 0.9],
        [0.7, 0.66], [0.85, 0.42], [1, 0.3]];

    function profile(s) {
        for (let i = 1; i < PROFILE.length; i++) {
            const [s1, h1] = PROFILE[i];
            if (s <= s1) {
                const [s0, h0] = PROFILE[i - 1];
                const t = (s - s0) / (s1 - s0);
                return h0 + (h1 - h0) * (t * t * (3 - 2 * t));
            }
        }
        return PROFILE[PROFILE.length - 1][1];
    }

    let W = 0, L = 80, H = 17, cruise = 50, colour = '#4fb3a5';
    let spine = [];                     // 3D points [x, y, z]; y down, z away from viewer
    const head = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, speed: 0 };
    let wavePhase = 0, finPhase = 0, time = 0;

    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return mul(a, 1 / l); };
    const project = (p) => [p[0], LANE_Y + p[1] * CE - p[2] * SE];
    const UP = [0, -1, 0];

    function headDir() {
        const cp = Math.cos(head.pitch);
        return [cp * Math.cos(head.yaw), Math.sin(head.pitch), cp * Math.sin(head.yaw)];
    }

    // Lay the body out straight behind the head.
    function resetSpine() {
        const d = headDir(), seg = L / SEG;
        spine = [];
        for (let i = 0; i <= SEG; i++) spine.push(sub([head.x, head.y, head.z], mul(d, i * seg)));
    }

    // Head and the first two segments are rigid; the rest follow, bending at most MAX_BEND.
    function updateSpine() {
        const d = headDir(), seg = L / SEG;
        spine[0] = [head.x, head.y, head.z];
        spine[1] = sub(spine[0], mul(d, seg));
        spine[2] = sub(spine[1], mul(d, seg));
        for (let i = 3; i <= SEG; i++) {
            const prev = norm(sub(spine[i - 1], spine[i - 2]));
            let dir = norm(sub(spine[i], spine[i - 1]));
            const c = dot(dir, prev);
            if (c < Math.cos(MAX_BEND)) {
                let perp = sub(dir, mul(prev, c));
                if (Math.hypot(...perp) < 1e-6) perp = [-prev[2], 0, prev[0]];
                perp = norm(perp);
                dir = add(mul(prev, Math.cos(MAX_BEND)), mul(perp, Math.sin(MAX_BEND)));
            }
            spine[i] = add(spine[i - 1], mul(dir, seg));
        }
    }

    // ---------- Choreography ----------
    // Every pass is made up on the spot: the fish comes in from a random side at a random
    // height, visits a few random spots in the band (sometimes pausing to look around),
    // then darts off one side or the other. Waypoints are fractions of the band width;
    // `y` is height relative to the middle of the band; `turn` picks which way to come about.

    const rand = (min, max) => min + Math.random() * (max - min);
    const chance = (p) => Math.random() < p;
    let yRange = 0;                     // how far above/below the middle the fish may swim
    let SCRIPT = [];
    let step = 0, stepTime = 0, baseYaw = 0;

    function makeScript() {
        const script = [{ wait: rand(0.5, 2.5) }];
        const stops = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < stops; i++) {
            script.push({
                to: rand(0.08, 0.92),
                y: rand(-yRange, yRange),
                speed: rand(0.5, 1.3),
                turn: chance(0.5) ? (chance(0.5) ? 1 : -1) : 0,
            });
            if (chance(0.7)) {
                script.push({ hover: rand(1, 3.2), look: rand(0.1, 0.4), pitch: chance(0.3) ? rand(-0.35, 0.35) : 0 });
            }
        }
        script.push({ to: chance(0.5) ? 1.35 : -0.35, y: rand(-yRange, yRange), speed: rand(1.6, 3.2) });
        script.push({ wait: rand(2, 6), reset: true });
        return script;
    }

    function startLoop() {
        const fromLeft = chance(0.5);
        SCRIPT = makeScript();
        step = 0; stepTime = 0;
        head.x = fromLeft ? -L * 1.3 : W + L * 1.3;
        head.y = rand(-yRange, yRange); head.z = 0;
        head.yaw = fromLeft ? 0 : Math.PI; head.pitch = 0; head.speed = cruise;
        resetSpine();
    }

    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const approach = (v, target, rate, dt) => v + (target - v) * Math.min(1, rate * dt);

    function steer(dt) {
        const s = SCRIPT[step];
        stepTime += dt;
        let targetSpeed = 0, targetPitch = 0, done = false;

        if (s.wait !== undefined) {
            targetSpeed = head.speed;           // keep going off-screen
            done = stepTime >= s.wait;
        } else if (s.hover !== undefined) {
            if (stepTime <= dt) baseYaw = head.yaw;
            const look = s.look * Math.sin(stepTime * 1.6) + 0.4 * s.look * Math.sin(stepTime * 3.7);
            head.yaw += wrap(baseYaw + look - head.yaw) * Math.min(1, 3 * dt);
            targetSpeed = cruise * 0.08;
            targetPitch = s.pitch || 0;
            done = stepTime >= s.hover;
        } else {
            const tx = s.to * W, ty = s.y || 0;
            const dx = tx - head.x, dz = -head.z;
            const dist = Math.hypot(dx, dz);
            let diff = wrap(Math.atan2(dz, dx) - head.yaw);
            if (s.turn && Math.sign(diff) !== s.turn && Math.abs(diff) > 1.5) diff += s.turn * 2 * Math.PI;
            const rate = 1.7 * dt;
            head.yaw += Math.max(-rate, Math.min(rate, diff));
            // slow through a turn, ease into the waypoint
            const turning = 0.3 + 0.7 * Math.max(0, Math.cos(Math.min(Math.abs(diff), Math.PI)));
            targetSpeed = Math.min(cruise * s.speed * turning, 12 + dist * 1.4);
            head.y = approach(head.y, ty, 1, dt);
            done = dist < 5 || (s.to > 1 && head.x > W + L * 1.3) || (s.to < 0 && head.x < -L * 1.3);
        }

        head.speed = approach(head.speed, targetSpeed, 2.5, dt);
        head.pitch = approach(head.pitch, targetPitch, 2, dt);
        const d = headDir();
        head.x += d[0] * head.speed * dt;
        head.y += d[1] * head.speed * dt;
        head.z += d[2] * head.speed * dt;

        if (done) {
            if (s.reset) startLoop();           // new random pass
            else { step++; stepTime = 0; }
        }
    }

    // ---------- Drawing ----------

    function hull(pts) {
        pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
        const lower = [], upper = [];
        for (const p of pts) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
            lower.push(p);
        }
        for (let i = pts.length - 1; i >= 0; i--) {
            const p = pts[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
            upper.push(p);
        }
        return lower.slice(0, -1).concat(upper.slice(0, -1));
    }

    function polygon(pts) {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
    }

    // Closed shape through the midpoints of `pts`, so corners come out rounded.
    function smooth(pts) {
        const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const start = mid(pts[n - 1], pts[0]);
        ctx.moveTo(start[0], start[1]);
        for (let i = 0; i < n; i++) {
            const m = mid(pts[i], pts[(i + 1) % n]);
            ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
        }
        ctx.closePath();
    }

    function draw() {
        ctx.clearRect(0, 0, W, canvas.height);
        const seg = L / SEG;

        // Swimming wave: stronger towards the tail, faster and bigger with speed.
        const effort = Math.min(3, head.speed / cruise);
        const amp = L * Math.min(0.11, 0.03 + 0.05 * effort);
        const q = [], lat = [];
        for (let i = 0; i <= SEG; i++) {
            const s = i / SEG;
            const a = i === 0 ? spine[0] : spine[i - 1], b = spine[Math.max(i, 1)];
            const t = norm(sub(a, b));
            const n = norm([-t[2], 0, t[0]]);
            const env = 0.06 + 0.94 * Math.pow(s, 1.7);
            q.push(add(spine[i], mul(n, amp * env * Math.sin(wavePhase - 5.3 * s))));
            lat.push(n);
        }

        const at = (s) => {
            const f = Math.max(0, Math.min(SEG, s * SEG)), i = Math.min(SEG - 1, Math.floor(f)), t = f - i;
            return {
                c: add(mul(q[i], 1 - t), mul(q[i + 1], t)),
                n: norm(add(mul(lat[i], 1 - t), mul(lat[i + 1], t))),
                h: profile(Math.max(0, s)) * H,
            };
        };
        const onBody = (s, up, side) => {
            const b = at(s);
            return project(add(add(b.c, mul(UP, up)), mul(b.n, side)));
        };

        ctx.fillStyle = colour;
        ctx.beginPath();

        // Body: hull of neighbouring elliptical cross-sections, plus a rounded snout.
        const rings = [];
        const nose = add(q[0], mul(norm(sub(q[0], q[1])), L * 0.035));
        rings.push([project(nose)]);
        for (let i = 0; i <= SEG; i++) {
            const s = i / SEG, h = profile(s) * H, w = h * 0.55, ring = [];
            for (let k = 0; k < 12; k++) {
                const th = k * Math.PI / 6;
                ring.push(project(add(add(q[i], mul(UP, Math.cos(th) * h / 2)), mul(lat[i], Math.sin(th) * w / 2))));
            }
            rings.push(ring);
        }
        for (let i = 0; i < rings.length - 1; i++) polygon(hull(rings[i].concat(rings[i + 1])));

        // Fins on the centre line: [s, height beyond the body edge as a fraction of L].
        const fin = (pts, dir) => smooth(pts.map(([s, e]) => onBody(s, dir * (at(s).h / 2 + e * L), 0)));
        fin([[0.34, -0.01], [0.4, 0.12], [0.47, 0.1], [0.52, -0.01]], 1);      // dorsal
        fin([[0.76, -0.005], [0.8, 0.035], [0.83, 0.03], [0.825, -0.005]], 1);  // adipose
        fin([[0.66, -0.01], [0.71, 0.085], [0.76, 0.075], [0.77, -0.01]], -1);  // anal
        fin([[0.5, -0.01], [0.55, 0.07], [0.58, 0.06], [0.575, -0.01]], -1);    // pelvic

        // Pectoral fins, one each side, paddling.
        const flap = 0.5 + 0.5 * Math.sin(finPhase);
        for (const side of [-1, 1]) {
            const w = at(0.2).h * 0.55 / 2;
            smooth([
                onBody(0.2, -at(0.2).h * 0.25, side * w * 0.9),
                onBody(0.33, -at(0.33).h * 0.25 - L * 0.05, side * (w + L * 0.05 * flap)),
                onBody(0.35, -at(0.35).h * 0.3 - L * 0.06, side * (w + L * 0.035 * flap)),
                onBody(0.235, -at(0.235).h * 0.3, side * w * 0.9),
            ]);
        }

        // Tail: a broad, shallow fork that lags the body wave.
        const end = q[SEG], hEnd = profile(1) * H;
        const tailFlick = amp / L * 5 * Math.cos(wavePhase - 5.3);
        const T = norm(add(norm(sub(q[SEG], q[SEG - 1])), mul(lat[SEG], tailFlick)));
        const tp = (back, up) => project(add(add(end, mul(T, back * L)), mul(UP, up)));
        smooth([
            tp(-0.01, hEnd / 2), tp(0.1, L * 0.1), tp(0.2, L * 0.17), tp(0.19, L * 0.15),
            tp(0.12, 0), tp(0.19, -L * 0.15), tp(0.2, -L * 0.17), tp(0.1, -L * 0.1), tp(-0.01, -hEnd / 2),
        ]);
        ctx.fill('nonzero');

        // Eye and gill line, cut out on the side facing the viewer.
        const n0 = at(0.08).n;
        const side = n0[2] > 0 ? -1 : 1;
        const facing = Math.min(1, Math.max(0, (Math.abs(n0[2]) - 0.2) / 0.5));
        if (facing > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.globalAlpha = facing;
            const eyeB = at(0.075), eye = onBody(0.075, eyeB.h * 0.14, side * eyeB.h * 0.55 / 2 * 0.85);
            ctx.beginPath();
            ctx.arc(eye[0], eye[1], Math.max(1.1, L * 0.022), 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = facing * 0.5;
            ctx.lineWidth = 0.9;
            ctx.lineCap = 'round';
            ctx.beginPath();
            for (let k = 0; k <= 8; k++) {
                const u = k / 4 - 1, s = 0.17 + 0.035 * (1 - u * u), b = at(s);
                const v = u * b.h * 0.4, w = b.h * 0.55 / 2 * Math.sqrt(Math.max(0, 1 - (v / (b.h / 2)) ** 2));
                const p = onBody(s, v, side * w);
                k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
            }
            for (let k = 0; k <= 12; k++) {
                const s = 0.22 + k * 0.06, b = at(s), v = b.h * 0.06;
                const p = onBody(s, v, side * b.h * 0.55 / 2 * 0.99);
                k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    // ---------- Loop ----------

    function resize() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const first = W === 0;
        W = rect.width;
        LANE_Y = rect.height * 0.5;
        colour = getComputedStyle(canvas).getPropertyValue('--fish').trim() || colour;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        L = Math.max(62, Math.min(92, W * 0.13));
        H = L * 0.235;
        cruise = Math.max(36, Math.min(64, W * 0.085));
        yRange = Math.max(0, (rect.height * 0.5 - H * 1.6) / CE);
        if (first) startLoop();
    }

    let last = 0, running = false, raf = 0;
    function frame(now) {
        const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
        last = now;
        time += dt;
        const effort = Math.min(3, head.speed / cruise);
        wavePhase += dt * 2 * Math.PI * (0.8 + 1.5 * effort);
        finPhase += dt * 2 * Math.PI * (1.6 - 0.6 * Math.min(1, effort));
        steer(dt);
        updateSpine();
        draw();
        raf = requestAnimationFrame(frame);
    }

    function setRunning(on) {
        if (on === running) return;
        running = on;
        if (on) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    }

    resize();
    new ResizeObserver(resize).observe(card);
    new IntersectionObserver((entries) => setRunning(entries[0].isIntersecting)).observe(card);
})();
