// C.O.S.M.O website: motion, the workflow tabs and the contact form.
// Everything on the page is readable without this file; it only adds polish.
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  document.querySelectorAll('details.menu a').forEach(function (a) {
    a.addEventListener('click', function () { var d = a.closest('details'); if (d) d.open = false; });
  });

  // Header gets a shadow and shrinks once the page scrolls.
  var head = document.querySelector('.site-head');
  var onScroll = function () { if (head) head.classList.toggle('scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal on scroll, plus counters and the evidence card.
  var count = function (el) {
    var to = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (calm) { el.textContent = to; return; }
    var t0 = null;
    var step = function (t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  var targets = document.querySelectorAll('[data-reveal], .evidence, .sky, [data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) count(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  // Hero: a slow starfield, and a little mouse parallax on the laptop.
  var canvas = document.querySelector('canvas.stars');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d'), stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = true;
    var size = function () {
      W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(W * H / 5200); stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.2 + 0.2, a: Math.random(), s: Math.random() * 0.12 + 0.02, tw: Math.random() * 6.28, c: Math.random() < 0.12 ? '79,209,255' : (Math.random() < 0.05 ? '247,147,30' : '255,255,255') });
    };
    var draw = function (t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!calm) { s.y -= s.s; if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; } }
        var a = calm ? s.a * 0.8 : (0.35 + 0.65 * Math.abs(Math.sin(t / 1800 + s.tw))) * s.a;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')'; ctx.fill();
      }
      if (!calm && running) requestAnimationFrame(draw);
    };
    size(); requestAnimationFrame(draw);
    window.addEventListener('resize', function () { size(); if (calm) draw(0); });
    if ('IntersectionObserver' in window && !calm) {
      new IntersectionObserver(function (e) { var was = running; running = e[0].isIntersecting; if (running && !was) requestAnimationFrame(draw); }).observe(canvas);
    }
  }
  // Workflow: steps light up as the section scrolls past; clicking a step shows its screen.
  var tl = document.querySelector('.timeline');
  if (tl) {
    var btns = Array.prototype.slice.call(tl.querySelectorAll('button'));
    var imgs = document.querySelectorAll('.stage .screen img');
    var copies = document.querySelectorAll('.stage-text .panel-copy');
    var bar = tl.querySelector('.progress');
    var chosen = -1;
    var select = function (i, focus) {
      chosen = i;
      btns.forEach(function (b, k) { b.setAttribute('aria-selected', k === i ? 'true' : 'false'); b.tabIndex = k === i ? 0 : -1; });
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
      copies.forEach(function (c, k) { c.classList.toggle('on', k === i); });
      if (focus) btns[i].focus();
      light(Math.max(i, litUpTo));
    };
    var litUpTo = 0;
    var light = function (upto) {
      tl.querySelectorAll('li').forEach(function (li, k) { li.classList.toggle('lit', k <= upto); });
      if (bar) bar.style.setProperty('--p', (upto / 7).toFixed(3));
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (k) { e.preventDefault(); select((chosen + k + btns.length) % btns.length, true); }
      });
    });
    select(0);
    if (calm) { litUpTo = 7; light(7); }
    else {
      var sec = tl.closest('section');
      var prog = function () {
        var r = sec.getBoundingClientRect(), vh = window.innerHeight;
        var k = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height * 0.55)));
        var up = Math.round(k * 7);
        if (up !== litUpTo) { litUpTo = up; light(Math.max(up, chosen)); }
      };
      window.addEventListener('scroll', prog, { passive: true }); prog();
    }
  }

  // Stagger index for lists that animate in one item at a time.
  document.querySelectorAll('.stagger, .why, .vs tbody').forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (el, i) { el.style.setProperty('--i', i); });
  });

  // The C.O.S.M.O Bot illustration. A clock (t, in ms) only runs while the
  // demo is on screen and playing; render(t) sets everything from it, so any
  // step can be jumped to. With reduced motion it starts at the end.
  var demo = document.querySelector('[data-demo]');
  if (demo) (function () {
    var END = 24000, GROUP = 5900;
    var timed = Array.prototype.slice.call(demo.querySelectorAll('[data-at]'));
    var scenes = Array.prototype.slice.call(demo.querySelectorAll('.scene'));
    var presses = demo.querySelectorAll('[data-press]');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.demo-tabs button'));
    var msgs = demo.querySelector('.msgs');
    var countEl = demo.querySelector('[data-countdown]');
    var nameEl = demo.querySelector('[data-scene-name]');
    var stateEl = demo.querySelector('[data-state]');
    var side = demo.querySelector('[data-side-tasks]');
    var bar = document.querySelector('.demo-bar');
    var toggle = document.querySelector('[data-toggle]');
    var replay = document.querySelector('[data-replay]');
    var feed = demo.querySelector('.feed');
    if (feed) feed.innerHTML += feed.innerHTML;
    var t = calm ? END : 0, playing = !calm, visible = false, raf = null, last = 0, shownCount = -1, curScene = -1;
    var render = function () {
      var n = 0;
      timed.forEach(function (el) {
        var on = t >= +el.getAttribute('data-at') && (!el.hasAttribute('data-until') || t < +el.getAttribute('data-until'));
        if (on !== el.classList.contains('shown')) el.classList.toggle('shown', on);
        if (on) n++;
        if (el.hasAttribute('data-done')) el.classList.toggle('done', t >= +el.getAttribute('data-done'));
      });
      Array.prototype.forEach.call(presses, function (el) { el.classList.toggle('pressed', t >= +el.getAttribute('data-press')); });
      var cur = 0;
      scenes.forEach(function (sc, i) { if (t >= +sc.getAttribute('data-scene')) cur = i; });
      if (cur !== curScene) {
        curScene = cur;
        scenes.forEach(function (sc, i) { sc.classList.toggle('on', i === cur); });
        tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); b.classList.toggle('past', i < cur); });
        if (nameEl) nameEl.innerHTML = scenes[cur].getAttribute('data-name');
        if (side) side.classList.toggle('hit', cur === scenes.length - 1);
      }
      if (countEl) {
        var k = Math.min(1, Math.max(0, (t - GROUP - 300) / 1600));
        countEl.textContent = Math.round(214 - 205 * (1 - Math.pow(1 - k, 3)));
      }
      if (stateEl) stateEl.textContent = t >= 22600 ? 'Done' : t >= 18900 ? 'Waiting for you' : 'Working';
      if (bar) bar.firstElementChild.style.setProperty('--p', (t / END).toFixed(3));
      if (n !== shownCount) { shownCount = n; msgs.scrollTo({ top: msgs.scrollHeight, behavior: calm ? 'auto' : 'smooth' }); }
    };
    var setBtn = function () {
      if (!toggle) return;
      var done = t >= END;
      toggle.querySelector('use').setAttribute('href', playing ? '#i-pause' : '#i-play');
      toggle.querySelector('span').textContent = playing ? 'Pause' : done ? 'Play again' : 'Play';
    };
    var frame = function (now) {
      raf = null;
      if (!playing || !visible) return;
      t = Math.min(END, t + Math.min(100, now - last)); last = now;
      render();
      if (t >= END) { playing = false; setBtn(); return; }
      raf = requestAnimationFrame(frame);
    };
    var kick = function () { if (playing && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    tabs.forEach(function (b) {
      b.addEventListener('click', function () { t = +b.getAttribute('data-t') + 1; playing = false; render(); setBtn(); });
    });
    if (toggle) toggle.addEventListener('click', function () {
      if (playing) playing = false; else { if (t >= END) t = 0; playing = true; kick(); }
      render(); setBtn();
    });
    if (replay) replay.addEventListener('click', function () { t = 0; playing = !calm; if (calm) t = END; render(); setBtn(); kick(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }, { threshold: 0.35 }).observe(demo);
    } else { visible = true; }
    render(); setBtn(); kick();
  })();

  // The scroll story: the step nearest the middle of the screen is lit, and
  // the laptop beside it shows that step's screenshot.
  var story = document.querySelector('.story');
  if (story && 'IntersectionObserver' in window) (function () {
    var steps = Array.prototype.slice.call(story.querySelectorAll('.sstep'));
    var shots = story.querySelectorAll('.story-screen img');
    var who = story.querySelector('[data-cap-who]'), text = story.querySelector('[data-cap-text]');
    var prog = story.querySelector('.story-prog span');
    var activate = function (i) {
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      var n = +steps[i].getAttribute('data-shot');
      Array.prototype.forEach.call(shots, function (im, k) { im.classList.toggle('on', k === n); });
      var you = steps[i].classList.contains('you');
      var chap = steps[i].previousElementSibling;
      while (chap && !chap.classList.contains('chap')) chap = chap.previousElementSibling;
      if (who) { who.className = 'who ' + (you ? 'you' : 'bot'); who.textContent = steps[i].querySelector('.who').textContent; }
      if (text) text.textContent = 'Step ' + steps[i].querySelector('.n').textContent + ' · ' + (chap ? chap.textContent : '');
      if (prog) prog.style.setProperty('--p', ((i + 1) / steps.length).toFixed(3));
    };
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) activate(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    steps.forEach(function (s) { io2.observe(s); });
    activate(0);
  })();

  // Morph scrollytelling: the MacBook stays pinned and the screens + text slide
  // up and away with the scroll wheel (scroll-linked, not a timed fade).
  Array.prototype.forEach.call(document.querySelectorAll('.morph'), function (morph) {
    var steps = Array.prototype.slice.call(morph.querySelectorAll('.mstep'));
    var glass = morph.querySelector('.morph-glass');
    var shots = glass ? glass.querySelectorAll('img') : [];
    var track = morph.querySelector('.morph-track');
    var sky = Array.prototype.slice.call(morph.querySelectorAll('.morph-sky i'));
    var N = steps.length || 1;
    var render = function () {
      if (!track) return;
      if (window.innerWidth <= 860) { for (var m = 0; m < shots.length; m++) { shots[m].style.transform = ''; shots[m].style.opacity = ''; } return; }
      var total = track.offsetHeight - window.innerHeight;
      var p = total > 0 ? Math.min(Math.max(-track.getBoundingClientRect().top / total, 0), 1) : 0;
      // Hold each step for most of its slot, then transition quickly to the next.
      var seg = p * N;
      var idx = Math.min(Math.floor(seg), N - 1);
      var t = (seg - idx - 0.55) / 0.45;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      t = t * t * (3 - 2 * t);
      var f = Math.min(idx + t, N - 1);
      for (var k = 0; k < shots.length; k++) {
        var d = k - f;
        shots[k].style.transform = 'translateY(' + (d * 100) + '%)';
        shots[k].style.opacity = Math.abs(d) < 1.0001 ? '1' : '0';
      }
      // Shooting stars are a pure function of scroll position, so they reverse when you scroll back up. Each flies its own way across the sky.
      sky.forEach(function (s, k) {
        var sp = parseFloat(s.style.getPropertyValue('--s')) || 3, off = parseFloat(s.style.getPropertyValue('--o')) || 0;
        var ANG = [28, 205, 152, 322, 95, 248, 15, 138, 292];
        var ang = ANG[k % ANG.length] * Math.PI / 180;
        var idle = (window.performance ? window.performance.now() / 150000 : 0) * sp * .5, q = ((p * sp + off + idle) % 1 + 1) % 1; // keeps drifting slowly on its own, and the scroll speeds it up
        var a = q < .12 ? q / .12 : q > .8 ? (1 - q) / .2 : 1;
        var dist = q * 80;
        s.style.opacity = (a * .9).toFixed(3);
        // the head (right end) points along the direction of travel
        s.style.transform = 'translate(' + (Math.cos(ang) * dist).toFixed(1) + 'vw,' + (Math.sin(ang) * dist).toFixed(1) + 'vh) rotate(' + (ang * 180 / Math.PI).toFixed(0) + 'deg)';
      });
      steps.forEach(function (s, j) {
        var dd = j - f;
        s.style.transform = 'translateY(calc(-50% + ' + (dd * 64).toFixed(1) + 'px))';
        s.style.opacity = Math.max(0, 1 - Math.abs(dd) * 1.3).toFixed(3);
      });
    };
    window.addEventListener('scroll', render, { passive: true });
    window.addEventListener('resize', render);
    render();
    if (sky.length && 'IntersectionObserver' in window && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { var on = false, loop = function () { if (!on) return; render(); window.requestAnimationFrame(loop); }; new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) loop(); }).observe(morph); }
  });

  // The pinned Overview: the screen stays, its pictures slide past as the four statements swap (like the laptop below), and the spiral galaxy turns with the scroll (back again when you scroll up).
  Array.prototype.forEach.call(document.querySelectorAll('section.spin'), function (spin) {
    var track = spin.querySelector('.spin-track'), gal = spin.querySelector('.galaxy img');
    var shots = Array.prototype.slice.call(spin.querySelectorAll('.spin-glass img'));
    var steps = Array.prototype.slice.call(spin.querySelectorAll('.ostep')), S = shots.length || 1;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var queued = false;
    var onSpin = function () {};
    var render = function () {
      queued = false;
      var vh = window.innerHeight, r = track.getBoundingClientRect(), wide = window.innerWidth > 860, p;
      if (wide) { var total = track.offsetHeight - vh; p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0; }
      else { p = Math.min(Math.max((vh - r.top) / (r.height + vh), 0), 1); }
if (gal && !still) { gal.style.setProperty('--gx', (p * 300 - 30).toFixed(1) + 'deg'); gal.style.setProperty('--gs', (1 + p * 1.1).toFixed(3)); gal.style.setProperty('--gt', (p * 82).toFixed(1) + 'deg'); }
      if (!wide) { shots.forEach(function (s) { s.style.transform = ''; s.style.opacity = ''; }); return; }
      var seg = p * S, idx = Math.min(Math.floor(seg), S - 1);
      var t = (seg - idx - 0.55) / 0.45; t = t < 0 ? 0 : t > 1 ? 1 : t; t = t * t * (3 - 2 * t);
      var f = Math.min(idx + t, S - 1);
      shots.forEach(function (s, k) { var d = k - f; s.style.transform = 'translateY(' + (d * 100).toFixed(2) + '%)'; s.style.opacity = Math.abs(d) < 1.0001 ? '1' : '0'; });
      steps.forEach(function (s, k) { var dd = k - f; s.style.transform = 'translateY(calc(-50% + ' + (dd * 64).toFixed(1) + 'px))'; s.style.opacity = Math.max(0, 1 - Math.abs(dd) * 1.3).toFixed(3); });
    };
    var onScroll = function () { if (!queued) { queued = true; window.requestAnimationFrame(render); } };
    window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); render();
  });


  // Watch the bot work: a field of drifting stars and a turning Earth, both driven by the scroll (they reverse when you scroll up).
  Array.prototype.forEach.call(document.querySelectorAll('#bot.morph'), function (sec) {
    var cv = sec.querySelector('.bot-cv'), track = sec.querySelector('.morph-track'); if (!cv || !track) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var W = 0, H = 0, dpr = 1, queued = false, still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sd = 21, rn = function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }, gs = function () { return Math.sqrt(-2 * Math.log(rn() + 1e-9)) * Math.cos(6.2832 * rn()); };
    var sky = []; for (var i = 0; i < 2400; i++) { var z = .15 + Math.pow(rn(), 1.6) * .85; sky.push([rn(), rn() * .8, z, rn() < .08 ? 2 : 1, rn() * 6.28, ['255,255,255', '255,255,255', '190,215,255', '255,214,150', '160,225,255'][Math.floor(rn() * 5)]]); }
    // the Earth is a real sphere: cities and lights are points on it (unit vectors around the top of the globe) that turn about a tilted axis
    var cities = [], lights = [], links = [], n, k;
    var onTop = function (maxDeg) { var th = Math.acos(1 - rn() * (1 - Math.cos(maxDeg * Math.PI / 180))), ph = rn() * 6.2832; return [Math.sin(th) * Math.cos(ph), -Math.cos(th), Math.sin(th) * Math.sin(ph)]; };
    var jig = function (v, s) { var x = v[0] + gs() * s, y = v[1] + gs() * s, z = v[2] + gs() * s, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; };
    for (n = 0; n < 760; n++) cities.push([onTop(46), rn() < .12]);
    cities.forEach(function (c) { var m = 3 + Math.floor(rn() * 7); for (k = 0; k < m; k++) lights.push([jig(c[0], .004), rn() < .25 || c[1] ? 1 : 0]); });
    for (n = 0; n < 900; n++) lights.push([onTop(46), rn() < .2 ? 1 : 0]);
    cities.forEach(function (a, ai) { var near = cities.map(function (b, bi) { var d = Math.pow(a[0][0] - b[0][0], 2) + Math.pow(a[0][1] - b[0][1], 2) + Math.pow(a[0][2] - b[0][2], 2); return [d, bi]; }).filter(function (x) { return x[1] !== ai; }).sort(function (u, v) { return u[0] - v[0]; }).slice(0, 3); near.forEach(function (x) { if (x[1] > ai && x[0] < .006) links.push([ai, x[1], rn() < .2, rn()]); }); });
    // the tilted axis the globe turns about (leaning so the lights travel on a diagonal, and rise over the horizon)
    var AX = (function () { var x = .5, y = .22, z = .84, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();
    var fit = function () { var r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    var render = function () {
      queued = false; if (!W) fit(); if (!W || !H) return;
      var vh = window.innerHeight, tr = track.getBoundingClientRect(), total = track.offsetHeight - vh, p = total > 0 ? Math.min(Math.max(-tr.top / total, 0), 1) : 0; if (still) p = .3;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // the sky: many stars that drift with the scroll, near ones faster, with a little twinkle
      var tw = window.performance ? window.performance.now() / 1000 : 0;
      for (var s = 0; s < sky.length; s++) { var S = sky[s], sx = (((S[0] * W - p * S[2] * 320 - tw * S[2] * 7) % W) + W) % W, sy = (((S[1] * H + p * S[2] * 110 + tw * S[2] * 2.5) % (H * .8)) + H * .8) % (H * .8); ctx.fillStyle = 'rgba(' + S[5] + ',' + ((.35 + S[2] * .6) * (.75 + .25 * Math.sin(tw * 1.2 + S[4]))).toFixed(2) + ')'; var q = S[3] * (S[2] > .7 ? 1.4 : 1); ctx.fillRect(sx, sy, q, q); }
      // the Earth: a huge dark sphere whose top edge curves across the bottom; its lights and links turn slowly about a tilted axis
      var Rp = W * 2.6, cx = W / 2, capH = H * .24, cy = H - capH + Rp, psi = p * .2 + tw * .003;
      var body = ctx.createRadialGradient(cx, cy, Rp * .93, cx, cy, Rp); body.addColorStop(0, '#02061a'); body.addColorStop(.9, '#040d2b'); body.addColorStop(1, '#0b2a6a'); ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, 6.2832); ctx.fill();
      var rim = ctx.createRadialGradient(cx, cy, Rp * .996, cx, cy, Rp * 1.012); rim.addColorStop(0, 'rgba(170,235,255,0)'); rim.addColorStop(.18, 'rgba(190,240,255,.95)'); rim.addColorStop(.5, 'rgba(60,160,255,.4)'); rim.addColorStop(1, 'rgba(47,107,255,0)'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(cx, cy, Rp * 1.012, 0, 6.2832); ctx.fill();
      var cs = Math.cos(psi), sn = Math.sin(psi), kx = AX[0], ky = AX[1], kz = AX[2];
      var rot = function (v, lift) { var d = kx * v[0] + ky * v[1] + kz * v[2], cxv = [ky * v[2] - kz * v[1], kz * v[0] - kx * v[2], kx * v[1] - ky * v[0]], x = v[0] * cs + cxv[0] * sn + kx * d * (1 - cs), y = v[1] * cs + cxv[1] * sn + ky * d * (1 - cs), z = v[2] * cs + cxv[2] * sn + kz * d * (1 - cs), r = Rp * (1 + (lift || 0)); return [cx + x * r, cy + y * r, z]; };
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, Rp, 0, 6.2832); ctx.clip();
      // the network: hubs on the globe joined by glowing arcs, with data packets running along them
      var cp = cities.map(function (c) { return rot(c[0], 0); });
      var onScr = function (q) { return q[2] > 0 && q[0] > -80 && q[0] < W + 80 && q[1] > H * .6 - 20 && q[1] < H + 60; };
      ctx.lineWidth = 1; ctx.setLineDash([]);
      var vis = [];
      links.forEach(function (L) { var a = cp[L[0]], b = cp[L[1]]; if (!onScr(a) && !onScr(b)) return; if (a[2] < 0 || b[2] < 0) return; var A = cities[L[0]][0], B = cities[L[1]][0], mv = [A[0] + B[0], A[1] + B[1], A[2] + B[2]], ml = Math.sqrt(mv[0] * mv[0] + mv[1] * mv[1] + mv[2] * mv[2]) || 1, dd = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2)), mid = rot([mv[0] / ml, mv[1] / ml, mv[2] / ml], Math.min(.03, dd / Rp * .6)); ctx.strokeStyle = L[2] ? 'rgba(255,179,92,.55)' : 'rgba(111,220,255,.4)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); vis.push([a, mid, b, L[2], L[3]]); });
      ctx.setLineDash([]);
      // data packets
      vis.forEach(function (V, vi) { if (vi % 2) return; var t = ((tw * .22 + V[4]) % 1), u = 1 - t, px = u * V[0][0] + t * V[2][0], py = u * V[0][1] + t * V[2][1]; ctx.fillStyle = V[3] ? 'rgba(255,220,160,.95)' : 'rgba(210,245,255,.95)'; ctx.shadowColor = V[3] ? '#ffb35c' : '#4fd1ff'; ctx.shadowBlur = 8; ctx.fillRect(px - 1.5, py - 1.5, 3, 3); ctx.shadowBlur = 0; });
      // small lights between the hubs
      for (var li = 0; li < lights.length; li++) { var Lg = lights[li], q2 = rot(Lg[0], 0); if (q2[2] < 0 || q2[0] < -4 || q2[0] > W + 4 || q2[1] < H * .6 || q2[1] > H + 4) continue; ctx.fillStyle = Lg[1] ? 'rgba(255,200,120,.8)' : 'rgba(150,230,255,.75)'; ctx.fillRect(q2[0] - .75, q2[1] - .75, 1.5, 1.5); }
      // hubs: a bright node with a soft halo (orange for the busiest)
      for (var ci = 0; ci < cities.length; ci++) { var q = cp[ci]; if (!onScr(q)) continue; var hot = cities[ci][1]; ctx.fillStyle = hot ? 'rgba(255,170,70,.22)' : 'rgba(79,209,255,.2)'; ctx.beginPath(); ctx.arc(q[0], q[1], hot ? 8 : 6, 0, 6.2832); ctx.fill(); ctx.fillStyle = hot ? '#ffd9a0' : '#d8f6ff'; var sz = hot ? 4 : 3; ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz); }
      ctx.restore();
    };
    var queue = function () { if (!queued) { queued = true; window.requestAnimationFrame(render); } };
    fit(); sec.classList.add('cv-bot'); fit(); render();
    window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', function () { fit(); queue(); });
    if (!still && 'IntersectionObserver' in window) { var on = false, loop = function () { if (!on) return; queue(); window.requestAnimationFrame(loop); }; new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) loop(); }).observe(sec); }
  });

  // Screens: flying closer and above the rings of a C.O.S.M.O-blue planet. The rings are tidy tracks of orange code, set like lines of text.
  // The whole scene is a function of scroll position (it reverses on scroll up) and comes into focus as you approach.
  Array.prototype.forEach.call(document.querySelectorAll('section.flysec'), function (sec) {
    var cv = sec.querySelector('canvas.fly-space'), track = sec.querySelector('.morph-track'); if (!cv || !track) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var W = 0, H = 0, dpr = 1, queued = false;
    var SP = 64, spr = {};
    var sprite = function (ch, col) { var k = ch + col; if (spr[k]) return spr[k]; var s = document.createElement('canvas'); s.width = SP; s.height = SP; var g = s.getContext('2d'); g.font = '700 ' + (SP * .86) + 'px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 6; g.fillText(ch, SP / 2, SP / 2 + 1); spr[k] = s; return s; };
    var CODE_SRC = "// scan a sample and report what it does\nconst MAX_BYTES = 4096;\nasync function scanSample(path, rules) {\n  const bytes = await readFile(path, { length: MAX_BYTES });\n  const hash = sha256(bytes);            // fingerprint first, never run\n  const hits = [];\n  for (const rule of rules) {\n    const found = rule.pattern.test(bytes.toString(\"latin1\"));\n    if (found) hits.push({ id: rule.id, score: rule.weight * 10 });\n  }\n  // sort the strongest evidence to the top\n  hits.sort((a, b) => b.score - a.score);\n  return { path, hash, hits, verdict: hits.length > 2 ? \"suspicious\" : \"clean\" };\n}\n\nfunction lookupDomain(name, feeds) {\n  const key = name.toLowerCase().trim();\n  if (!feeds.has(key)) return null;      // unknown means no match\n  const entry = feeds.get(key);\n  return { name: key, seen: entry.count, first: entry.since };\n}\n\nconst queue = new Map();\nexport function enqueue(job) {\n  if (queue.size >= 500) throw new Error(\"queue full\");\n  queue.set(job.id, { ...job, state: \"waiting\", added: Date.now() });\n  return queue.size;\n}\n\nasync function approve(change, user) {\n  // a person approves every change\n  if (user.role !== \"analyst\") return false;\n  await audit.write({ who: user.name, what: change.id, ok: true });\n  return true;\n}\n";
    var KW = /^(const|let|var|function|async|await|return|if|else|for|of|new|throw|export|import|from|true|false|null|try|catch)$/;
    var CODE = '', CCOL = [];
    (function () {
      var C = { kw: '#ffa63d', fn: '#ffd08a', id: '#f7931e', pu: '#e8801a', st: '#4fd1ff', nu: '#a78bfa', cm: '#36d399' };
      var s = CODE_SRC.replace(/\n/g, '    '), i = 0, w;
      var put = function (str, col) { for (var q = 0; q < str.length; q++) { CODE += str.charAt(q); CCOL.push(col); } };
      while (i < s.length) {
        var ch = s.charAt(i), rest = s.slice(i);
        if (rest.slice(0, 2) === '//') { var e = rest.indexOf('    '); e = e < 0 ? rest.length : e; put(rest.slice(0, e), C.cm); i += e; continue; }
        if (ch === '"' || ch === "'") { var j2 = s.indexOf(ch, i + 1); j2 = j2 < 0 ? s.length - 1 : j2; put(s.slice(i, j2 + 1), C.st); i = j2 + 1; continue; }
        if (/[0-9]/.test(ch)) { var m = rest.match(/^[0-9.]+/)[0]; put(m, C.nu); i += m.length; continue; }
        if (/[A-Za-z_$]/.test(ch)) { w = rest.match(/^[A-Za-z_$][A-Za-z0-9_$]*/)[0]; put(w, KW.test(w) ? C.kw : rest.charAt(w.length) === '(' ? C.fn : C.id); i += w.length; continue; }
        put(ch, ch === ' ' ? C.id : C.pu); i++;
      }
    })();
    var R = 5, RK = []; for (var q = 0; q < 26; q++) RK.push(1.2 + .42 * q / 25); // one wide band, no gaps // one narrow ring just outside the planet
    var nodes = [], links = [], sd = 7, rn = function () { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
    for (var nn = 0; nn < 190; nn++) nodes.push([(rn() * 2 - 1) * 1.15, .42 + Math.pow(rn(), .7) * .58, rn() < .12 ? 1 : 0, rn() * 6.28, rn() < .1 ? 3 : 1.4]);
    nodes.forEach(function (A, i) { var cand = []; nodes.forEach(function (B, k) { if (k === i) return; var dx = Math.cos(A[0]) * A[1] - Math.cos(B[0]) * B[1], dy = Math.sin(A[0]) * A[1] - Math.sin(B[0]) * B[1], d = Math.sqrt(dx * dx + dy * dy); if (d < .16) cand.push([d, k]); }); cand.sort(function (u, v) { return u[0] - v[0]; }); cand.slice(0, 2).forEach(function (c) { if (c[1] > i) links.push([i, c[1], A[2] || nodes[c[1]][2], (rn() - .5) * .05, (rn() - .5) * .05]); }); });
    var sky = [], sk = 11, rs = function () { sk = (sk * 16807) % 2147483647; return (sk - 1) / 2147483646; };
    for (var si = 0; si < 2600; si++) { var zz = .15 + Math.pow(rs(), 1.6) * .85; sky.push([rs(), rs(), zz, rs() < .08 ? 2 : 1, rs() * 6.28, ['255,255,255', '255,255,255', '190,215,255', '255,214,150', '160,225,255'][Math.floor(rs() * 5)]]); }
    var glyphs = []; // angle, radius, char, colour, track
    RK.forEach(function (k, ti) { var r = R * k, n = Math.floor(6.2832 * r / .1), off = (ti * 131) % CODE.length; for (var i = 0; i < n; i++) { var ix = (i + off) % CODE.length, ch = CODE.charAt(ix); if (ch === ' ') continue; glyphs.push([i / n * 6.2832, r, ch, CCOL[ix], ti]); } });
    var logo = new Image(); logo.src = 'assets/img/cosmo-hex.svg'; var logoOk = false; logo.onload = function () { logoOk = true; queue(); };
    var fit = function () { var r0 = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); W = r0.width; H = r0.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); };
    var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }, dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
    var norm = function (v) { var l = Math.sqrt(dot(v, v)) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    var cross = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var lerp = function (a, b, t) { return a + (b - a) * t; };
    var render = function () {
      queued = false; if (!W) return;
      var vh = window.innerHeight, tr = track.getBoundingClientRect(), total = track.offsetHeight - vh, p = total > 0 ? Math.min(Math.max(-tr.top / total, 0), 1) : 0;
      var e = p * p * (3 - 2 * p) * .3 + p * .7;
      var F = H * 2.2, D = lerp(17, 8.2, e), el = lerp(17, 4, e) * Math.PI / 180, roll = lerp(-9, 0, e) * Math.PI / 180;
      var rpx = F * R / Math.sqrt(D * D - R * R), xc = W * lerp(.3, .6, e) - rpx, yc = H * lerp(.6, .44, e), cr = Math.cos(roll), sr = Math.sin(roll);
      var C = [0, D * Math.sin(el), -D * Math.cos(el)], f = [0, -Math.sin(el), Math.cos(el)], u = [0, Math.cos(el), Math.sin(el)];
      var blur = 0; // sharp from the first frame cv.style.filter = blur > .25 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      // the sky behind the planet: many stars that drift slowly with the scroll, the near ones faster, and twinkle a little
      var tw = window.performance ? window.performance.now() / 1000 : 0;
      for (var s2 = 0; s2 < sky.length; s2++) { var S = sky[s2], sx = (((S[0] * W - p * S[2] * 220) % W) + W) % W, sy = (((S[1] * H + p * S[2] * 90) % H) + H) % H; ctx.fillStyle = 'rgba(' + S[5] + ',' + ((.4 + S[2] * .6) * (.75 + .25 * Math.sin(tw * 1.3 + S[4]))).toFixed(2) + ')'; ctx.fillRect(sx, sy, S[3] * (S[2] > .7 ? 1.4 : 1), S[3] * (S[2] > .7 ? 1.4 : 1)); }

      var proj = function (x, y, z) { var dx = x - C[0], dy = y - C[1], dz = z - C[2], zz = dy * f[1] + dz * f[2]; if (zz < .5) return null; var X = dx / zz * F, Y = (dy * u[1] + dz * u[2]) / zz * F; return [xc + X * cr + Y * sr, yc - (Y * cr - X * sr), zz]; };
      // the ring: tidy tracks of orange code, set along the curve like lines of text
      var drawPlanet = function () {
      // the planet: a C.O.S.M.O-blue sphere whose right limb is the only part in view
      var x0 = xc, y0 = yc;
      ctx.fillStyle = '#000208'; ctx.beginPath(); ctx.arc(x0, y0, rpx, 0, 6.2832); ctx.fill();
      var inn = ctx.createRadialGradient(x0, y0, rpx * .9, x0, y0, rpx); inn.addColorStop(0, 'rgba(20,110,230,0)'); inn.addColorStop(1, 'rgba(30,130,255,.45)'); ctx.fillStyle = inn; ctx.beginPath(); ctx.arc(x0, y0, rpx, 0, 6.2832); ctx.fill();
      var rim = ctx.createRadialGradient(x0, y0, rpx * .995, x0, y0, rpx * 1.14); rim.addColorStop(0, 'rgba(170,235,255,0)'); rim.addColorStop(.03, 'rgba(170,235,255,.95)'); rim.addColorStop(.1, 'rgba(70,170,255,.6)'); rim.addColorStop(.3, 'rgba(30,100,255,.22)'); rim.addColorStop(1, 'rgba(30,100,255,0)'); ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x0, y0, rpx * 1.14, 0, 6.2832); ctx.fill();

      };
      var items = [], spin = p * 1.1;
      var rp = function (a, r) { return proj(Math.cos(a) * r, 0, Math.sin(a) * r); };
      for (var k = 0; k < glyphs.length; k++) {
        var g = glyphs[k], a = g[0] + spin * (g[4] % 2 ? -1 : 1), pr = rp(a, g[1]); if (!pr) continue;
        var s = F / pr[2] * .062; if (s < 2 || pr[0] < -60 || pr[0] > W + 60 || pr[1] < -60 || pr[1] > H + 60) continue;
        var p2 = rp(a + .01, g[1]); var rot = p2 ? Math.atan2(p2[1] - pr[1], p2[0] - pr[0]) : 0;
        var behind = pr[2] > D; // the far side of the ring, seen over the planet, is dimmer
        items.push([pr[2], pr[0], pr[1], Math.min(s, 90), g[2] + g[3], behind ? .75 : 1, rot]);
      }
      items.sort(function (A, B) { return B[0] - A[0]; });
      var paint = function (it) {
        var spt = sprite(it[4].charAt(0), it[4].slice(1)); ctx.globalAlpha = it[5];
        var c2 = Math.cos(it[6]) * dpr, s2 = Math.sin(it[6]) * dpr; ctx.setTransform(c2, s2, -s2, c2, it[1] * dpr, it[2] * dpr); ctx.drawImage(spt, -it[3] / 2, -it[3] / 2, it[3], it[3]);
      };
      var n = 0; for (; n < items.length && items[n][0] > D; n++) paint(items[n]); // the far side of the ring goes behind the planet
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; drawPlanet();
      for (; n < items.length; n++) paint(items[n]);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    };
    function queue() { if (!queued) { queued = true; window.requestAnimationFrame(render); } }
    fit(); queue();
    window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', function () { fit(); queue(); });
  });


  // The work order writes itself out, a few characters at a time, the way a model streams its answer. Plain text is in the page, so it reads without script.
  Array.prototype.forEach.call(document.querySelectorAll('.wo-gen'), function (box) {
    var card = box.closest('.order-card'), cur = box.querySelector('.wo-cur'), parts = Array.prototype.slice.call(box.querySelectorAll('.gen'));
    if (!parts.length || !('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var texts = parts.map(function (el) { return el.textContent; });
    parts.forEach(function (el) { el.textContent = ''; });
    box.style.minHeight = box.offsetHeight + 'px'; if (card) card.classList.add('writing');
    var started = false, pi = 0, ci = 0;
    var step = function () {
      if (pi >= parts.length) { if (card) card.classList.remove('writing'); return; }
      var el = parts[pi], t = texts[pi]; if (cur && cur.parentNode !== el.parentNode) { el.parentNode.appendChild(cur); }
      var n = 1 + ((Math.random() * 3) | 0); ci = Math.min(ci + n, t.length); el.textContent = t.slice(0, ci); el.appendChild(cur);
      if (ci >= t.length) { pi++; ci = 0; setTimeout(step, 260 + Math.random() * 160); } else setTimeout(step, 16 + Math.random() * 34);
    };
    new IntersectionObserver(function (es, ob) { if (es[0].isIntersecting && !started) { started = true; ob.disconnect(); setTimeout(step, 400); } }, { threshold: .55 }).observe(box);
  });

  // The Constellation: a field of random stars across the whole section (behind the text), some drifting in loose groups, and the five AI agent stars among them.
  Array.prototype.forEach.call(document.querySelectorAll('.nebula'), function (box) {
    var cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), mem = Array.prototype.slice.call(box.querySelectorAll('.neb-member'));
    var sec = box.closest('section'), bg = sec && sec.querySelector('canvas.neb-bg'), bctx = bg && bg.getContext('2d');
    if (!ctx) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, BW = 0, BH = 0, dpr = 1, running = false, raf = 0;
    var seed = 11; var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var palette = ['255,255,255', '255,255,255', '255,255,255', '255,255,255', '190,215,255', '190,215,255', '255,214,150', '255,214,150', '255,170,200', '150,235,225', '200,175,255', '255,175,120'];
    var stars = [], clusters = [], i, c, n;
    var gauss = function () { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.2832 * rnd()); };
    var mk = function (k, bx, by) { return { k: k, bx: bx, by: by, ax: .01 + rnd() * .05, ay: .01 + rnd() * .05, fx: .08 + rnd() * .35, fy: .08 + rnd() * .35, p1: rnd() * 6.28, p2: rnd() * 6.28, s: rnd() < .05 ? 2.6 : rnd() < .25 ? 1.8 : 1.2, tw: .5 + rnd() * 2.8, ph: rnd() * 6.28, b: .22 + rnd() * .7, c: palette[Math.floor(rnd() * palette.length)] }; };
    for (c = 0; c < 9; c++) {
      clusters.push({ bx: (rnd() * 2 - 1) * .85, by: (rnd() * 2 - 1) * .85, ax: .05 + rnd() * .12, ay: .05 + rnd() * .12, fx: .03 + rnd() * .09, fy: .03 + rnd() * .09, p1: rnd() * 6.28, p2: rnd() * 6.28, sg: .1 + rnd() * .1 });
      n = 40 + Math.floor(rnd() * 45);
      for (i = 0; i < n; i++) stars.push(mk(c, gauss() * clusters[c].sg, gauss() * clusters[c].sg));
    }
    for (i = 0; i < 1500; i++) stars.push(mk(-1, (rnd() * 2 - 1) * .98, (rnd() * 2 - 1) * .98));
    var tint = ['255,179,92', '120,200,255', '190,150,255', '110,225,200', '255,150,190'];
    var orbit = [ { f: .93, sp: .055, ph: 4.6, ar: .84 }, { f: .86, sp: -.07, ph: 5.9, ar: .8 }, { f: .92, sp: .06, ph: 2.9, ar: .8 }, { f: .8, sp: -.085, ph: 0.9, ar: .82 }, { f: .88, sp: .075, ph: 1.9, ar: .8 } ];
    var fit = function (canvas, cx2) { var r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); cx2.setTransform(dpr, 0, 0, dpr, 0, 0); return r; };
    var size = function () { var r = fit(cv, ctx); W = r.width; H = r.height; if (bg) { var q = fit(bg, bctx); BW = q.width; BH = q.height; } };
    var frame = function (now) {
      raf = 0; var t = still ? 0 : now / 1000, k;
      if (bg) {
        var bx0 = BW / 2, by0 = BH / 2;
        bctx.clearRect(0, 0, BW, BH);
        var cc = clusters.map(function (q) { return { x: q.ax * Math.sin(t * q.fx + q.p1) + q.bx, y: q.ay * Math.sin(t * q.fy + q.p2) + q.by }; });
        for (k = 0; k < stars.length; k++) {
          var s = stars[k], ox = s.k >= 0 ? cc[s.k].x : 0, oy = s.k >= 0 ? cc[s.k].y : 0;
          var sx = bx0 + (ox + s.bx + s.ax * Math.sin(t * s.fx + s.p1)) * bx0, sy = by0 + (oy + s.by + s.ay * Math.sin(t * s.fy + s.p2)) * by0 * (BH / BW < 1 ? 1 : 1), al = s.b * (.55 + .45 * (.5 + .5 * Math.sin(t * s.tw + s.ph)));
          if (sx < -4 || sx > BW + 4 || sy < -4 || sy > BH + 4) continue;
          bctx.fillStyle = 'rgba(' + s.c + ',' + al.toFixed(2) + ')'; bctx.fillRect(sx, sy, s.s, s.s);
        }
      }
      var cx = W / 2, cy = H / 2, Rx = W * .44, Ry = H * .44;
      ctx.clearRect(0, 0, W, H);
      for (k = 0; k < orbit.length; k++) {
        var m = orbit[k], ang = m.ph + t * m.sp, fr = m.f * (1 + .07 * Math.sin(t * .27 + k * 1.7)), mx = cx + Math.cos(ang) * fr * Rx * .9, my = cy + Math.sin(ang) * fr * Ry * .85 * m.ar, col = tint[k];
        ctx.strokeStyle = 'rgba(' + col + ',.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
        var pf = ((t * .32 + k * .2) % 1), p1 = Math.min(pf + .05, 1);
        ctx.strokeStyle = 'rgba(' + col + ',' + (.9 * Math.sin(pf * 3.14)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + (mx - cx) * pf, cy + (my - cy) * pf); ctx.lineTo(cx + (mx - cx) * p1, cy + (my - cy) * p1); ctx.stroke();
        var gr = ctx.createRadialGradient(mx, my, 0, mx, my, 80); gr.addColorStop(0, 'rgba(' + col + ',.16)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(mx, my, 80, 0, 6.2832); ctx.fill();
        
        if (mem[k]) { var half = mem[k].offsetWidth / 2; mem[k].style.transform = 'translate(' + (mx - half).toFixed(1) + 'px,' + (my - half).toFixed(1) + 'px)'; mem[k].classList.toggle('up', my < cy); }
      }
      if (running && !still) raf = window.requestAnimationFrame(frame);
    };
    var start = function () { if (!running) { running = true; if (!raf) raf = window.requestAnimationFrame(frame); } };
    var stop = function () { running = false; };
    size(); frame(0);
    window.addEventListener('resize', function () { size(); if (!running) frame(0); });
    if ('ResizeObserver' in window && sec) new ResizeObserver(function () { size(); if (!running) frame(0); }).observe(sec);
    if (still) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { rootMargin: '120px' }).observe(sec || box); else start();
  });

  // Views carousel: flip through interface screenshots.
  Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), function (car) {
    var track = car.querySelector('.caro-track');
    if (!track) return;
    var slides = track.children;
    var dots = car.querySelector('.caro-dots');
    var n = slides.length, i = 0, timer;
    function go(idx) {
      i = (idx + n) % n;
      Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('on', k === i); });
      if (dots) Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === i); });
    }
    function reset() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6500); }
    if (dots) {
      for (var k = 0; k < n; k++) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('aria-label', 'Go to view ' + (k + 1));
        (function (idx) { b.addEventListener('click', function () { go(idx); reset(); }); })(k);
        dots.appendChild(b);
      }
    }
    var prev = car.querySelector('.prev'), next = car.querySelector('.next');
    if (prev) prev.addEventListener('click', function () { go(i - 1); reset(); });
    if (next) next.addEventListener('click', function () { go(i + 1); reset(); });
    car.addEventListener('mouseenter', function () { clearInterval(timer); });
    car.addEventListener('mouseleave', reset);
    go(0); reset();
  });

  // Contact form. The address it sends to is data-email on the <form> in contact.html.
  var form = document.querySelector('form[data-email]');
  if (!form || !window.fetch) return;
  var email = form.getAttribute('data-email').trim();
  form.setAttribute('action', 'https://site-forms.janderson-6f5.workers.dev');
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var label = button ? button.textContent : '';
  var show = function (msg, isError) { status.hidden = false; status.className = 'form-status' + (isError ? ' err' : ''); status.textContent = msg; status.focus(); };
  form.addEventListener('submit', function (e) {
    if (!form.checkValidity()) return;
    e.preventDefault();
    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    if (data._honey) return;
    delete data._next;
    if (button) { button.disabled = true; button.textContent = 'Sending...'; }
    fetch('https://site-forms.janderson-6f5.workers.dev', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && String(res.j.success) === 'true') { form.reset(); form.hidden = true; show('Thank you. Your message has been sent. We will be in touch to set up your demo.', false); }
        else throw new Error('not sent');
      })
      .catch(function () { show('Sorry, your message did not go through. Please email ' + email + ' or call (571) 206-1401.', true); })
      .finally(function () { if (button) { button.disabled = false; button.textContent = label; } });
  });
})();
