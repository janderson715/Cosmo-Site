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
      // Shooting stars are a pure function of scroll position, so they reverse when you scroll back up.
      sky.forEach(function (s, k) {
        var sp = parseFloat(s.style.getPropertyValue('--s')) || 3, off = parseFloat(s.style.getPropertyValue('--o')) || 0;
        var ANG = [28, 152, 50, 125, 20, 140, 62, 112, 38];
        var ang = ANG[k % ANG.length] * Math.PI / 180;
        var q = ((p * sp + off) % 1 + 1) % 1;
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
  });

  // The pinned Overview: the screen stays, its pictures slide past as the four statements swap (like the laptop below), and the spiral galaxy turns with the scroll (back again when you scroll up).
  Array.prototype.forEach.call(document.querySelectorAll('.spin'), function (spin) {
    var track = spin.querySelector('.spin-track'), gal = spin.querySelector('.galaxy img');
    var shots = Array.prototype.slice.call(spin.querySelectorAll('.spin-glass img'));
    var steps = Array.prototype.slice.call(spin.querySelectorAll('.ostep')), S = shots.length || 1;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var queued = false;
    var render = function () {
      queued = false;
      var vh = window.innerHeight, r = track.getBoundingClientRect(), wide = window.innerWidth > 860, p;
      if (wide) { var total = track.offsetHeight - vh; p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 0; }
      else { p = Math.min(Math.max((vh - r.top) / (r.height + vh), 0), 1); }
      if (gal && !still) gal.style.setProperty('--gx', (p * 300 - 30).toFixed(1) + 'deg');
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

  // The Constellation: a swirling star nebula. A spiral of stars turns around the file, and the five members drift on their own orbits.
  Array.prototype.forEach.call(document.querySelectorAll('.nebula'), function (box) {
    var cv = box.querySelector('canvas'), ctx = cv.getContext('2d'), names = Array.prototype.slice.call(box.querySelectorAll('.neb-name'));
    if (!ctx) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, dpr = 1, running = false, raf = 0;
    var seed = 7; var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var tints = [[58, 91, 255], [140, 90, 230], [79, 190, 245], [235, 150, 70], [200, 110, 190], [70, 190, 180], [225, 120, 80]];
    var armTints = [[0, 2, 5], [1, 4, 4], [3, 6, 3]];
    var sprites = tints.map(function (c) { var s = document.createElement('canvas'); s.width = s.height = 128; var g = s.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(' + c.join(',') + ',1)'); gr.addColorStop(.45, 'rgba(' + c.join(',') + ',.35)'); gr.addColorStop(1, 'rgba(' + c.join(',') + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return s; });
    var blobs = [], stars = [], i;
    for (i = 0; i < 78; i++) { var ar = Math.floor(rnd() * 3), pal = armTints[ar]; blobs.push({ r: .06 + rnd() * .92, arm: ar, sz: .12 + rnd() * .2, tint: pal[Math.floor(rnd() * 3)], a: .035 + rnd() * .06, j: (rnd() - .5) * .5 }); }
    for (i = 0; i < 1100; i++) { var rr = Math.pow(rnd(), .72); stars.push({ r: rr, arm: Math.floor(rnd() * 3), j: (rnd() - .5) * (.18 + rr * .35), s: rnd() < .08 ? 2.2 : rnd() < .3 ? 1.5 : 1, tw: .6 + rnd() * 2.4, ph: rnd() * 6.28, c: null }); stars[i].c = stars[i].arm === 0 ? (rnd() < .5 ? 'rgba(170,205,255,' : 'rgba(255,255,255,') : stars[i].arm === 1 ? (rnd() < .6 ? 'rgba(255,170,225,' : 'rgba(215,180,255,') : (rnd() < .6 ? 'rgba(255,215,140,' : 'rgba(255,170,110,'); }
    var members = [ { f: .93, sp: .055, ph: 4.6, ar: .84 }, { f: .86, sp: -.07, ph: 5.9, ar: .8 }, { f: .92, sp: .06, ph: 2.9, ar: .8 }, { f: .8, sp: -.085, ph: 0.9, ar: .82 }, { f: .88, sp: .075, ph: 1.9, ar: .8 } ];
    var omega = function (r) { return .13 / (.22 + r); };
    var size = function () { var r = box.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    var frame = function (now) {
      raf = 0; var t = still ? 0 : now / 1000, cx = W / 2, cy = H / 2, Rx = W * .44, Ry = H * .44, k;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (k = 0; k < blobs.length; k++) { var b = blobs[k], ang = b.arm * 2.0944 + b.r * 3.2 + b.j + t * omega(b.r), bx = cx + Math.cos(ang) * b.r * Rx, by = cy + Math.sin(ang) * b.r * Ry, bs = b.sz * Math.min(W, H); ctx.globalAlpha = b.a; ctx.drawImage(sprites[b.tint], bx - bs, by - bs, bs * 2, bs * 2); }
      ctx.globalAlpha = .16; ctx.drawImage(sprites[6], cx - W * .2, cy - H * .2, W * .4, H * .4); ctx.globalAlpha = .3; ctx.drawImage(sprites[3], cx - W * .12, cy - H * .12, W * .24, H * .24); ctx.globalAlpha = .22; ctx.drawImage(sprites[2], cx - W * .28, cy - H * .28, W * .56, H * .56);
      for (k = 0; k < stars.length; k++) { var s = stars[k], a2 = s.arm * 2.0944 + s.r * 3.2 + s.j + t * omega(s.r), sx = cx + Math.cos(a2) * s.r * Rx, sy = cy + Math.sin(a2) * s.r * Ry; ctx.globalAlpha = 1; ctx.fillStyle = s.c + (.45 + .5 * Math.sin(t * s.tw + s.ph) * .5 + .25).toFixed(2) + ')'; ctx.fillRect(sx, sy, s.s, s.s); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      for (k = 0; k < members.length; k++) {
        var m = members[k], ang2 = m.ph + t * m.sp, mx = cx + Math.cos(ang2) * m.f * Rx * .86, my = cy + Math.sin(ang2) * m.f * Ry * .8 * m.ar;
        ctx.strokeStyle = 'rgba(79,209,255,.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
        var pf = ((t * .32 + k * .2) % 1), p0 = pf, p1 = Math.min(pf + .05, 1);
        ctx.strokeStyle = 'rgba(79,209,255,' + (.9 * Math.sin(pf * 3.14)).toFixed(2) + ')'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx + (mx - cx) * p0, cy + (my - cy) * p0); ctx.lineTo(cx + (mx - cx) * p1, cy + (my - cy) * p1); ctx.stroke();
        var chair = k === 0, gr = ctx.createRadialGradient(mx, my, 0, mx, my, chair ? 38 : 30); gr.addColorStop(0, chair ? 'rgba(255,179,92,.75)' : 'rgba(79,209,255,.6)'); gr.addColorStop(1, 'rgba(79,209,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(mx, my, chair ? 38 : 30, 0, 6.2832); ctx.fill();
        ctx.fillStyle = chair ? '#ffcf99' : '#fff'; ctx.beginPath(); ctx.arc(mx, my, chair ? 7 : 6, 0, 6.2832); ctx.fill();
        if (names[k]) { var lw = names[k].offsetWidth, lh = names[k].offsetHeight, ly = my < cy ? my - lh - 14 : my + 12; names[k].style.transform = 'translate(' + (mx - lw / 2).toFixed(1) + 'px,' + ly.toFixed(1) + 'px)'; }
      }
      if (running && !still) raf = window.requestAnimationFrame(frame);
    };
    var start = function () { if (!running) { running = true; if (!raf) raf = window.requestAnimationFrame(frame); } };
    var stop = function () { running = false; };
    size(); frame(0);
    window.addEventListener('resize', function () { size(); if (!running) frame(0); });
    if (still) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { rootMargin: '120px' }).observe(box); else start();
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
