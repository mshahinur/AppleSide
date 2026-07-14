/* ═══════════════════════════════════════════════════
   APPLE SIDE — main.js
   Three.js background · Video scrubber · Phase reveals
═══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const easeInOut = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;

/* ─────────────────────────────────────────────────
   THREE.JS PARTICLE BACKGROUND
   Wrapped entirely in try/catch — if CDN fails or
   WebGL is blocked, the rest of the page still works.
───────────────────────────────────────────────── */
class ThreeBackground {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas || typeof THREE === 'undefined') throw new Error('Three not ready');

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 200);
    this.camera.position.z = 30;

    this.scrollProgress = 0;
    this._buildTexture();
    this._buildStars();
    this._buildAccents();
    this._buildDust();
    this._loop();
  }

  _buildTexture() {
    const s = 64, c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.3,  'rgba(255,255,255,0.6)');
    g.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0,0,s,s);
    this.tex = new THREE.CanvasTexture(c);
  }

  _buildStars() {
    const n = innerWidth < 768 ? 600 : 1400;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(1 - 2 * Math.random());
      const r     = 18 + Math.random() * 22;
      p[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      p[i*3+2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.starsMat = new THREE.PointsMaterial({
      size: 0.18, map: this.tex, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(geo, this.starsMat);
    this.scene.add(this.stars);
  }

  _buildAccents() {
    const n = innerWidth < 768 ? 120 : 300;
    const p = new Float32Array(n*3), c = new Float32Array(n*3);
    for (let i = 0; i < n; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(1 - 2 * Math.random());
      const r     = 8 + Math.random() * 13;
      p[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      p[i*3+2] = r * Math.cos(phi);
      const roll = Math.random();
      if      (roll < 0.45) { c[i*3]=0.88; c[i*3+1]=0.88; c[i*3+2]=0.95; } // silver
      else if (roll < 0.72) { c[i*3]=0.22; c[i*3+1]=0.52; c[i*3+2]=1.00; } // blue
      else                  { c[i*3]=1.00; c[i*3+1]=0.72; c[i*3+2]=0.22; } // gold
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(c, 3));
    this.accentsMat = new THREE.PointsMaterial({
      size: 0.36, map: this.tex, vertexColors: true, transparent: true,
      opacity: 0.40, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.accents = new THREE.Points(geo, this.accentsMat);
    this.scene.add(this.accents);
  }

  _buildDust() {
    const n = innerWidth < 768 ? 80 : 220;
    const p = new Float32Array(n*3);
    for (let i = 0; i < n; i++) {
      const a = (i/n) * Math.PI*2 + Math.random()*0.4;
      const r = 22 + (Math.random()-0.5)*5;
      p[i*3]   = Math.cos(a)*r;
      p[i*3+1] = (Math.random()-0.5)*2;
      p[i*3+2] = Math.sin(a)*r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    this.dustMat = new THREE.PointsMaterial({
      size: 0.5, map: this.tex, transparent: true, opacity: 0.18,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0xb5915a,
    });
    this.dust = new THREE.Points(geo, this.dustMat);
    this.scene.add(this.dust);
  }

  onScroll(sp) { this.scrollProgress = sp; }

  _loop() {
    requestAnimationFrame(() => this._loop());
    const t  = performance.now() * 0.001;
    const sp = this.scrollProgress;
    this.stars.rotation.y   = t * 0.025 + sp * 0.8;
    this.stars.rotation.x   = t * 0.008;
    this.accents.rotation.y = t * 0.045 + sp * 1.2;
    this.accents.rotation.z = Math.sin(t * 0.015) * 0.05;
    this.dust.rotation.y    = t * 0.015 + sp * 0.5;
    this.starsMat.opacity   = 0.40 + Math.sin(t * 0.4) * 0.05;
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}

/* ─────────────────────────────────────────────────
   VIDEO SCRUBBER
   Direct currentTime = target on every scroll tick.
   Simplest, most cross-browser reliable approach.
───────────────────────────────────────────────── */
class VideoScrubber {
  constructor(sectionEl) {
    this.section  = sectionEl;
    this.video    = this._findVideo(sectionEl);
    this.phases   = Array.from(sectionEl.querySelectorAll('.phase'));
    this.progress = 0;

    if (!this.video) return;

    /* GPU compositing layer — frame updates bypass main thread */
    this.video.style.transform    = 'translateZ(0)';
    this.video.style.willChange   = 'contents';
    this.video.disableRemotePlayback = true;

    this.video.load();
    this.video.pause();

    /* Decoder warm-up: briefly play then pause so the browser
       pre-warms its decode pipeline. Without this, the first
       few seeks are always slow because the decoder is cold.   */
    this.video.addEventListener('loadeddata', () => {
      this.video.play()
        .then(() => {
          requestAnimationFrame(() => {
            this.video.pause();
            this.video.currentTime = 0;
          });
        })
        .catch(() => { /* autoplay blocked — scrubbing still works */ });
    }, { once: true });
  }

  /* Works for all section types:
     - hero:  two videos (desktop/mobile) — picks visible one
     - frame: .frame-vid (not .scrub-video)
     - others: .scrub-video */
  _findVideo(sectionEl) {
    const all = sectionEl.querySelectorAll('video');
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];
    // Multiple videos: return first visible
    for (const v of all) {
      if (getComputedStyle(v).display !== 'none') return v;
    }
    return all[0];
  }

  update() {
    if (!this.video) return;
    const rect     = this.section.getBoundingClientRect();
    const scrolled = -rect.top;
    const trackLen = this.section.offsetHeight - window.innerHeight;
    if (trackLen <= 0) return;

    this.progress = clamp(scrolled / trackLen, 0, 1);

    const dur = this.video.duration;
    if (isFinite(dur) && dur > 0 && this.video.readyState >= 1) {
      const t    = this.progress * dur;
      const diff = Math.abs(t - this.video.currentTime);
      /* Skip imperceptibly small changes (< 1 frame at 30fps).
         Avoids queuing seeks the decoder can't keep up with.   */
      if (diff > 1 / 30) {
        /* fastSeek = lower-precision but GPU-friendly seek path */
        if (typeof this.video.fastSeek === 'function') {
          this.video.fastSeek(t);
        } else {
          this.video.currentTime = t;
        }
      }
    }

    this.phases.forEach(el => this._updatePhase(el, this.progress));
  }

  _updatePhase(el, p) {
    const inPt  = parseFloat(el.dataset.in)  || 0;
    const outPt = parseFloat(el.dataset.out) || 1;
    const fade  = 0.04;
    const inStart = Math.max(0, inPt - fade);
    const inRange = Math.max(inPt - inStart, 0.001);

    let opacity = 0, ty = 22;

    if (p <= inStart) {
      opacity = 0; ty = 22;
    } else if (p < inPt) {
      const e = easeInOut((p - inStart) / inRange);
      opacity = e; ty = (1 - e) * 22;
    } else if (p <= outPt) {
      opacity = 1; ty = 0;
    } else if (p < outPt + fade) {
      const e = easeInOut((p - outPt) / fade);
      opacity = 1 - e; ty = -(e * 16);
    } else {
      opacity = 0; ty = -16;
    }

    el.style.opacity   = opacity;
    el.style.transform = `translateY(${ty}px)`;
  }
}

/* ─────────────────────────────────────────────────
   BENTO CARDS — intersection play + reveal
───────────────────────────────────────────────── */
class HighlightController {
  constructor() {
    // Play/pause bento videos on intersection
    const playIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const v = e.target.querySelector('.bento-video');
        if (!v) return;
        if (e.isIntersecting) { v.play().catch(()=>{}); v.classList.add('playing'); }
        else                  { v.pause(); v.classList.remove('playing'); }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('.bento-card').forEach(c => playIO.observe(c));

    // Staggered reveal
    const revIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const idx = [...e.target.parentElement.children].indexOf(e.target);
        setTimeout(() => e.target.classList.add('in-view'), idx * 90);
        revIO.unobserve(e.target);
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.bento-reveal').forEach(el => revIO.observe(el));
  }
}

/* ─────────────────────────────────────────────────
   GENERIC REVEAL BLOCKS (specs, headers, order)
───────────────────────────────────────────────── */
function initRevealBlocks() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in-view');
      io.unobserve(e.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal-block').forEach(el => io.observe(el));

  // Colors lineup image — scale+fade reveal
  const lineup = document.querySelector('.colors-lineup');
  if (lineup) {
    const lineupIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in-view');
        lineupIO.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    lineupIO.observe(lineup);
  }
}

/* ─────────────────────────────────────────────────
   CURSOR PARALLAX  (desktop only)
───────────────────────────────────────────────── */
function initCursorParallax(three) {
  if (!three || !three.camera) return;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  window.addEventListener('mousemove', e => {
    tx = (e.clientX / innerWidth  - 0.5) * 0.6;
    ty = (e.clientY / innerHeight - 0.5) * 0.4;
  });
  const tick = () => {
    cx = lerp(cx, tx, 0.04);
    cy = lerp(cy, ty, 0.04);
    three.camera.position.x = cx * 2;
    three.camera.position.y = -cy * 2;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ─────────────────────────────────────────────────
   SCROLL ENGINE
───────────────────────────────────────────────── */
function initScrollEngine(scrubbers, three, heroScrollUpdate) {
  let ticking = false;

  const update = () => {
    const totalH = document.documentElement.scrollHeight - innerHeight;
    const sp     = totalH > 0 ? clamp(scrollY / totalH, 0, 1) : 0;

    if (three) three.onScroll(sp);
    scrubbers.forEach(s => s.update());
    if (heroScrollUpdate) heroScrollUpdate(); // hero parallax scrub

    // Nav state
    document.getElementById('nav').classList.toggle('nav-light', scrollY > 60);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  // Run immediately so phases are correct on load
  update();
}

/* ─────────────────────────────────────────────────
   PRELOADER — dismisses on first video metadata
───────────────────────────────────────────────── */
function initPreloader() {
  const el = document.getElementById('preloader');
  if (!el) return;

  const hide = () => {
    el.classList.add('done');
    setTimeout(() => { el.style.display = 'none'; }, 1000);
  };

  // Hero video no longer has id="vid-hero" — find any autoplay video
  const vid = document.querySelector('video[autoplay]')
           || document.querySelector('video');

  if (!vid) {
    setTimeout(hide, 600);
    return;
  }

  if (vid.readyState >= 1) {
    setTimeout(hide, 400);
  } else {
    vid.addEventListener('loadedmetadata', () => setTimeout(hide, 400), { once: true });
    setTimeout(hide, 2500); // hard cap — never hang forever
  }
}

/* ─────────────────────────────────────────────────
   HERO VIDEO — delayed start + 0.8x playback rate
───────────────────────────────────────────────── */
function initHeroVideo() {
  // Pick the currently visible hero video (desktop or mobile)
  const all = document.querySelectorAll('.js-hero-vid');
  let vid = null;
  for (const v of all) {
    if (getComputedStyle(v).display !== 'none') { vid = v; break; }
  }
  if (!vid) return;

  vid.playbackRate = 0.8;

  // When video ends: hold last frame, then enable parallax scrub
  vid.addEventListener('ended', () => {
    vid.pause();
    vid.currentTime = vid.duration - 0.001;
    vid._heroEnded = true;
  }, { once: true });

  // Start after 500 ms
  setTimeout(() => { vid.play().catch(() => {}); }, 500);

  /* Return a scroll-update function.
     After the video ends, scrolling past the hero scrubs it
     backward by up to 1 second — a subtle parallax echo. */
  const hero = document.getElementById('s-hero');
  return () => {
    if (!vid._heroEnded || !vid.duration || !hero) return;
    // pixels the hero has scrolled above the viewport top
    const scrolledAbove = Math.max(0, -hero.getBoundingClientRect().top);
    // 0 px → last frame; innerHeight*0.3 px → 1 s back; capped there
    const maxPx  = innerHeight * 0.3;
    const offset = clamp(scrolledAbove / maxPx, 0, 1); // 0 → 1
    const target = vid.duration - offset; // last frame → 1 s earlier
    if (Math.abs(vid.currentTime - target) > 1 / 30) {
      vid.currentTime = target;
    }
  };
}

/* ─────────────────────────────────────────────────
   PARALLAX SYSTEM
   — colors lineup image: strong (0.22)
   — section headers / quality: subtle (0.06)
   — disabled on mobile (< 768 px) for performance
───────────────────────────────────────────────── */
function initParallax() {
  if (innerWidth < 768) return;

  const lineup      = document.querySelector('.colors-lineup');
  const qualPhones  = document.querySelector('.quality-img-float');
  const qualLeft    = document.querySelector('.quality-left');
  const orderCopy   = document.querySelector('.order-copy');
  const exploreT    = document.querySelector('.explore-text');

  // Items: [ element, parallax speed ]
  const items = [
    qualPhones && [qualPhones, 0.14],   // image drifts up faster than scroll
    qualLeft   && [qualLeft,   0.05],   // text drifts very subtly
    orderCopy  && [orderCopy,  0.06],
    exploreT   && [exploreT,   0.05],
  ].filter(Boolean);

  if (items.length === 0) return;

  let ticking = false;

  const update = () => {
    const vh = innerHeight;
    items.forEach(([el, speed]) => {
      const rect = el.getBoundingClientRect();
      const mid  = rect.top + rect.height * 0.5;
      const y    = (mid - vh * 0.5) * speed;
      el.style.transform = `translateY(${y.toFixed(2)}px)`;
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  // Run once on load
  requestAnimationFrame(update);
}

/* ─────────────────────────────────────────────────
   BENTO CARD TILT — premium 3-D hover
   Follows cursor inside each card
───────────────────────────────────────────────── */
function initCardTilt() {
  if (innerWidth < 1024) return; // desktop only

  document.querySelectorAll('.bento-card, .order-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r    = card.getBoundingClientRect();
      const x    = (e.clientX - r.left) / r.width  - 0.5; // -0.5 → 0.5
      const y    = (e.clientY - r.top)  / r.height - 0.5;
      const tiltX = (-y * 8).toFixed(2);  // up to ±4°
      const tiltY = ( x * 8).toFixed(2);
      card.style.transform =
        `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
───────────────────────────────────────────────── */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.getElementById(a.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 48, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────
   BOOTSTRAP
   Called at DOMContentLoaded — no wait on video load.
   Three.js failures are isolated; scroll still works.
───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Three.js — optional enhancement
  let three = null;
  try { three = new ThreeBackground(); }
  catch (e) { console.warn('[ThreeBackground]', e.message); }

  // Hero video FIRST — returns the scroll-update function needed below
  const heroScrollUpdate = initHeroVideo();

  // Core: video scrubbers
  const scrubbers = Array.from(document.querySelectorAll('.scrub-section'))
    .map(s => new VideoScrubber(s));

  // Bento grid
  new HighlightController();

  // Reveal animations
  initRevealBlocks();

  // Scroll engine
  initScrollEngine(scrubbers, three, heroScrollUpdate);

  // Cursor parallax (desktop)
  if (innerWidth >= 1024) initCursorParallax(three);

  // Parallax (desktop only)
  initParallax();

  // 3-D card tilt (desktop only)
  initCardTilt();

  // Preloader dismiss — always runs last so nothing above can block it
  initPreloader();

  // Anchor links
  initAnchors();

  // Resize
  window.addEventListener('resize', () => {
    if (three) three.onResize();
  });
});
