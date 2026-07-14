# Apple Side — Complete Build Guide

> How to build a scroll-driven, 3D-model, video-scrubbing iPhone product page from scratch.  
> No React. No build tools. No npm. Just HTML, CSS, and JavaScript.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [File Structure](#2-file-structure)
3. [Design Token System](#3-design-token-system)
4. [Typography Scale](#4-typography-scale)
5. [Scroll Reveal System](#5-scroll-reveal-system)
6. [Scroll-Scrubbed Video](#6-scroll-scrubbed-video)
7. [Three.js Particle Background](#7-threejs-particle-background)
8. [Parallax System](#8-parallax-system)
9. [3D Model Viewer](#9-3d-model-viewer)
10. [Bento Grid + Card Tilt](#10-bento-grid--card-tilt)
11. [Hero Video System](#11-hero-video-system)
12. [Preloader](#12-preloader)
13. [How All Systems Connect](#13-how-all-systems-connect)
14. [Section Order & Why It Matters](#14-section-order--why-it-matters)
15. [Suggestions to Reach $10k Quality](#15-suggestions-to-reach-10k-quality)

---

## 1. Project Overview

This is a **single-page product website** for the iPhone 16 Pro — built the way the web was designed to work:

- One HTML file holds all content
- One CSS file handles all styles
- One JS file drives all scroll logic and animations
- One ES module JS file handles the 3D viewer separately
- All assets live in a `videos/` folder

**No build step. No terminal commands. Open `index.html` in a browser (via a local server) and it runs.**

The only external dependency is Three.js, loaded from a CDN `<script>` tag.

---

## 2. File Structure

```
apple-side/
│
├── index.html              ← All page content, section order, nav
├── style.css               ← Every visual style, animation, responsive rule
├── main.js                 ← Scroll engine, particles, reveals, parallax, video scrub
├── model-viewer.js         ← 3D iPhone viewer (ES module, isolated)
│
└── videos/
    ├── hero.mp4                          ← Desktop hero video
    ├── smallHero.mp4                     ← Mobile hero video
    ├── explore.mp4                       ← Highlights section loop
    ├── frame.mp4                         ← Display scroll-scrubbed video
    ├── highlight-first.mp4               ← Camera bento card
    ├── hightlight-sec.mp4                ← Chip bento card
    ├── hightlight-third.mp4              ← Display bento card
    ├── hightlight-fourth.mp4             ← Battery bento card
    ├── scene.glb                         ← 3D iPhone model (Draco compressed)
    ├── Apple-iPhone-16-Pro-finish-lineup-…png   ← Craftsmanship section image
    └── Apple-iPhone-16-Pro-hero-geo-…jpg        ← Order card image
```

### Why no build tools?

Build tools (Webpack, Vite, etc.) are great for large apps but add complexity for a marketing page. This project proves you can achieve a premium, interactive experience with zero configuration — which also means:

- Zero npm vulnerabilities
- Zero dependency updates
- Instant hot reload (just save the file)
- Works on any static hosting (GitHub Pages, Netlify drop)

---

## 3. Design Token System

At the very top of `style.css`, every color, radius, spacing, and easing curve is defined **once** as a CSS custom property (variable):

```css
:root {
  /* Backgrounds */
  --bg:            #000000;
  --bg-2:          #1d1d1f;
  --bg-3:          #2d2d2f;

  /* Surfaces */
  --surface:       rgba(255,255,255,0.06);
  --surface-hover: rgba(255,255,255,0.10);

  /* Borders */
  --border:        rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.18);

  /* Text */
  --text:   #f5f5f7;
  --text-2: #a1a1a6;
  --text-3: #6e6e73;

  /* Brand colors */
  --accent:     #0071e3;
  --gold:       #b5915a;
  --gold-light: #d4a96a;

  /* Border radii */
  --r-sm:  8px;
  --r-md:  14px;
  --r-lg:  20px;
  --r-xl:  28px;
  --r-2xl: 40px;

  /* Easing curves */
  --ease-out:    cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Why this matters for beginners:**  
If your designer says "change the accent color from blue to purple", you change **one line** and every button, link, glow, and highlight updates simultaneously. Without tokens you'd hunt through hundreds of lines.

Use them in any rule like this:
```css
.btn {
  background: var(--accent);
  border-radius: var(--r-xl);
  color: var(--text);
}
```

---

## 4. Typography Scale

Five utility classes control every heading size on the page:

```css
.display-xl { font-size: clamp(3.5rem, 8vw,   7rem);   font-weight: 800; }
.display-lg { font-size: clamp(2.8rem, 5.5vw, 5.5rem); font-weight: 700; }
.display-md { font-size: clamp(2rem,   4vw,   3.8rem); font-weight: 700; }
.display-sm { font-size: clamp(1.4rem, 2.5vw, 2.2rem); font-weight: 600; }

.eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
}
```

### Understanding `clamp()`

```
clamp(minimum, preferred, maximum)
```

- `minimum` — never smaller than this (protects mobile)
- `preferred` — scales with viewport width using `vw` units
- `maximum` — never larger than this (protects huge screens)

Example: `clamp(2.8rem, 5.5vw, 5.5rem)`  
- On a 320px phone: 2.8rem (the minimum kicks in)
- On a 1280px desktop: 5.5vw = ~70px ≈ 4.4rem
- On a 4K screen: capped at 5.5rem

One line replaces multiple `@media` queries for font sizes.

---

## 5. Scroll Reveal System

Every element that should animate in when scrolled to gets the class `reveal-block`.

### CSS (the animation)

```css
.reveal-block {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s var(--ease-out),
              transform 0.7s var(--ease-out);
}

.reveal-block.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

Nothing happens until JavaScript adds `.in-view`. When it does, the CSS transition fires automatically.

### JavaScript (the trigger)

```js
function initRevealBlocks() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in-view');  // triggers CSS transition
      io.unobserve(e.target);             // stop watching — only fires once
    });
  }, { threshold: 0.08 }); // trigger when 8% of element is visible

  document.querySelectorAll('.reveal-block').forEach(el => io.observe(el));
}
```

`IntersectionObserver` is the modern way to detect when elements enter the viewport. It's GPU-efficient and doesn't require a scroll event listener.

### Variant: slide in from right

For the craftsmanship image, a modifier overrides the direction:

```css
.reveal-block.from-right {
  transform: translateX(80px);  /* override: slide from right instead of below */
  opacity: 0;
  transition: opacity 1s 0.15s var(--ease-out),
              transform 1s 0.15s var(--ease-out);
}
.reveal-block.from-right.in-view {
  transform: translateX(0);
  opacity: 1;
}
```

The `0.15s` before the easing is a **transition delay** — it starts 150ms after `.in-view` is added, giving the opacity a head start.

---

## 6. Scroll-Scrubbed Video

The display section video doesn't autoplay — it's tied frame-by-frame to how far you've scrolled.

### The HTML

```html
<section class="scrub-section" id="s-frame" style="height:200vh">
  <div class="scrub-sticky scrub-sticky--frame">
    <video id="vid-frame" muted playsinline preload="auto">
      <source src="videos/frame.mp4" type="video/mp4" />
    </video>
    <!-- text phases sit above the video -->
  </div>
</section>
```

- Section is `200vh` tall — gives 100vh of scroll room after the video sticks
- Inner `scrub-sticky` div is `position: sticky; top: 0; height: 100vh` — stays in place while parent scrolls past it

### The CSS

```css
.scrub-section { position: relative; }

.scrub-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
```

### The JavaScript (VideoScrubber class)

```js
class VideoScrubber {
  constructor(sectionEl) {
    this.section = sectionEl;
    this.video   = sectionEl.querySelector('video');
    // ... setup
  }

  update() {
    const rect     = this.section.getBoundingClientRect();
    const scrolled = -rect.top;                            // px scrolled past section top
    const trackLen = this.section.offsetHeight - window.innerHeight; // max scrollable distance

    const progress = clamp(scrolled / trackLen, 0, 1);    // 0 → 1

    if (this.video.duration) {
      const targetTime = progress * this.video.duration;

      // fastSeek is GPU-accelerated on supported browsers
      if (typeof this.video.fastSeek === 'function') {
        this.video.fastSeek(targetTime);
      } else {
        this.video.currentTime = targetTime;
      }
    }
  }
}
```

`update()` is called on every scroll event. `progress` goes from 0 (section just entered view) to 1 (section about to leave). Multiply by `video.duration` to get the target timestamp.

### Decoder warm-up trick

Browsers don't decode video until it plays. First seeks are always slow on cold decoders. Fix:

```js
video.addEventListener('loadeddata', () => {
  video.play()
    .then(() => {
      requestAnimationFrame(() => {
        video.pause();
        video.currentTime = 0;
      });
    })
    .catch(() => {}); // autoplay blocked is fine — seeking still works
}, { once: true });
```

Play for one frame, then immediately pause. This warms the decoder so subsequent seeks are instant.

### Phase text system

Text overlays fade in and out at specific scroll progress points, defined directly in HTML:

```html
<h2 class="phase display-lg" 
    data-in="0.14"    <!-- start fading in at 14% scroll progress -->
    data-out="0.82">  <!-- start fading out at 82% -->
  The biggest display ever.
</h2>
```

JS reads these attributes and calculates opacity + translateY for each frame:

```js
_updatePhase(el, progress) {
  const inPt  = parseFloat(el.dataset.in);
  const outPt = parseFloat(el.dataset.out);

  let opacity = 0, ty = 22;

  if (progress >= inPt && progress <= outPt) {
    opacity = 1; ty = 0;           // fully visible
  } else if (progress < inPt) {
    // fading in
    const t = (progress - (inPt - 0.04)) / 0.04;
    opacity = easeInOut(t); ty = (1 - opacity) * 22;
  } else {
    // fading out
    const t = (progress - outPt) / 0.04;
    opacity = 1 - easeInOut(t); ty = -(easeInOut(t) * 16);
  }

  el.style.opacity   = opacity;
  el.style.transform = `translateY(${ty}px)`;
}
```

No CSS transitions here — JS sets values directly on every frame so text movement is perfectly 1:1 with scroll direction (works forwards AND backwards).

---

## 7. Three.js Particle Background

The starfield behind the whole page is a Three.js scene rendered to a fixed `<canvas>` element.

### Setup

```js
// Canvas sits behind everything via CSS:
// position: fixed; inset: 0; z-index: 0; pointer-events: none;

this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
this.scene    = new THREE.Scene();
this.camera   = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 200);
this.camera.position.z = 30;
```

### Three particle layers

**Stars** — 1,400 white particles scattered on a large sphere:
```js
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const mat = new THREE.PointsMaterial({ size: 0.18, map: glowTexture,
                                        transparent: true, blending: THREE.AdditiveBlending });
this.stars = new THREE.Points(geo, mat);
```

**Accent particles** — 300 colored particles (silver/blue/gold) closer to camera

**Dust ring** — 220 warm gold particles in a flat orbital ring

### Animation loop

```js
_loop() {
  requestAnimationFrame(() => this._loop());
  const t  = performance.now() * 0.001; // time in seconds
  const sp = this.scrollProgress;

  // Each layer rotates at a different speed — creates depth
  this.stars.rotation.y   = t * 0.025 + sp * 0.8;
  this.stars.rotation.x   = t * 0.008;
  this.accents.rotation.y = t * 0.045 + sp * 1.2;
  this.dust.rotation.y    = t * 0.015 + sp * 0.5;

  // Subtle opacity pulse
  this.starsMat.opacity = 0.40 + Math.sin(t * 0.4) * 0.05;

  this.renderer.render(this.scene, this.camera);
}
```

`requestAnimationFrame` runs ~60 times per second. Each call rotates the layers slightly and re-renders.

### The glow texture

Instead of square pixel dots, each particle uses a radial gradient painted to a canvas:

```js
const c = document.createElement('canvas');
c.width = c.height = 64;
const ctx = c.getContext('2d');
const g = ctx.createRadialGradient(32,32,0, 32,32,32);
g.addColorStop(0,   'rgba(255,255,255,1)');
g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
g.addColorStop(1,   'rgba(255,255,255,0)');
ctx.fillStyle = g;
ctx.fillRect(0,0,64,64);
this.tex = new THREE.CanvasTexture(c); // use as particle sprite
```

---

## 8. Parallax System

Elements move at different speeds on scroll, creating a sense of depth.

### The math

```js
const viewportCenter = innerHeight * 0.5;
const elementCenter  = rect.top + rect.height * 0.5;
const distFromCenter = elementCenter - viewportCenter;
const y              = distFromCenter * speed;

el.style.transform = `translateY(${y.toFixed(2)}px)`;
```

When the element is **above** the viewport center, `distFromCenter` is negative → element moves up.  
When **below** center, positive → moves down.  
Result: elements appear to float through the page at their own depth layer.

### Speed values used

| Element | Speed | Effect |
|---|---|---|
| Quality phones image | 0.14 | Moves fast — feels very close |
| Quality text block | 0.05 | Moves slow — feels farther back |
| Order copy | 0.06 | Subtle depth |
| Explore text | 0.05 | Subtle depth |

---

## 9. 3D Model Viewer

The most complex part of the project. Lives in `model-viewer.js` as a separate **ES module**.

### Why a separate file?

`main.js` uses the UMD (global) version of Three.js — `window.THREE`. The 3D viewer needs GLTFLoader and OrbitControls which are only available as ES modules. Rather than refactor everything, a separate module file uses its own import of Three.js via an importmap:

```html
<!-- In <head> — must come before any module scripts -->
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/"
  }
}
</script>
```

```html
<!-- At bottom of <body> -->
<script type="module" src="model-viewer.js"></script>
```

### The model-viewer.js flow

```
1. Get canvas element
2. Create WebGLRenderer → renders to that canvas
3. Create Scene, Camera, Lights
4. Create OrbitControls (drag to rotate)
5. Load scene.glb via GLTFLoader + DRACOLoader
6. When loaded:
   a. Measure bounding box
   b. Center the model at origin
   c. Scale it to fit the camera view
   d. Add to scene
   e. Hide loading spinner
7. Start render loop (requestAnimationFrame)
8. Wire up color buttons → traverse mesh materials
9. Wire up size buttons → lerp scale
```

### Loading a GLTF model

```js
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// scene.glb uses Draco compression — must provide decoder
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/gltf/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load('videos/scene.glb', (gltf) => {
  const model = gltf.scene;

  // Center the model
  const box    = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());
  model.position.sub(center); // move so bounding box center = (0,0,0)

  // Scale to fit ~2.5 world units
  const normScale = 2.5 / Math.max(size.x, size.y, size.z);
  pivot.scale.setScalar(normScale);

  pivot.add(model);
  scene.add(pivot);
});
```

### Changing material colors

The model has many named materials. Some (glass, lens, border) should never change color. The rest represent the titanium frame:

```js
const EXCLUDED = new Set([
  'zFdeDaGNRwzccye',  // lens glass
  'ujsvqBWRMnqdwPx',  // screen border
  'hUlRcbieVuIiOXG',  // camera glass
  'jlzuBkUzuJqgiAK',  // microphone mesh
  'xNrofRCqOXXHVZt',  // antenna lines
]);

function applyColor(hexColor) {
  const newColor = new THREE.Color(hexColor);

  pivot.traverse(child => {
    if (!child.isMesh || !child.material) return;
    if (!EXCLUDED.has(child.material.name)) {
      child.material.color.copy(newColor);
      child.material.needsUpdate = true;
    }
  });
}
```

### Smooth size transition

Instead of instantly snapping to a new scale, `lerp` interpolates every frame:

```js
const lerp = (a, b, t) => a + (b - a) * t;

// In render loop:
curScale = lerp(curScale, targetScale, 0.07);
pivot.scale.setScalar(curScale);
```

`0.07` means "move 7% of the remaining distance each frame" — creates an ease-out feel naturally, no easing library needed.

---

## 10. Bento Grid + Card Tilt

### The CSS grid

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.bento-lg { grid-column: span 2; } /* takes 2 of 3 columns */
.bento-sm { grid-column: span 1; } /* takes 1 of 3 columns */
```

Alternating large-small, small-large creates the asymmetric Apple bento layout.

### 3D card tilt on hover

```js
card.addEventListener('mousemove', e => {
  const r = card.getBoundingClientRect();

  // Normalize mouse position: -0.5 to 0.5 within the card
  const x = (e.clientX - r.left)  / r.width  - 0.5;
  const y = (e.clientY - r.top)   / r.height - 0.5;

  // Rotate opposite to mouse position (makes it feel like a physical tilt)
  const tiltX = (-y * 8).toFixed(2); // vertical mouse = X rotation
  const tiltY = ( x * 8).toFixed(2); // horizontal mouse = Y rotation

  card.style.transform =
    `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
});

card.addEventListener('mouseleave', () => {
  card.style.transform = ''; // snap back
});
```

`perspective(900px)` is key — without it the rotation looks flat. Values above ~1200px look too subtle; below ~600px look extreme.

---

## 11. Hero Video System

The hero video plays once at 0.8× speed, then on further scroll, scrubs backwards slightly as a parallax effect:

```js
// Start at 80% speed after 500ms delay
vid.playbackRate = 0.8;
setTimeout(() => vid.play(), 500);

// When video ends, hold last frame and enable scroll-scrub
vid.addEventListener('ended', () => {
  vid.pause();
  vid.currentTime = vid.duration - 0.001; // hold on last frame
  vid._heroEnded = true;
});

// Scroll callback — runs on every scroll after video ends
function heroScrollUpdate() {
  if (!vid._heroEnded) return;

  const scrolledPast = Math.max(0, -hero.getBoundingClientRect().top);
  const maxPx = innerHeight * 0.3;
  const offset = clamp(scrolledPast / maxPx, 0, 1); // 0 → 1

  // Scrub backward from last frame by up to 1 second
  vid.currentTime = vid.duration - offset;
}
```

Two separate `<video>` elements handle desktop vs mobile — only the currently visible one is used via `getComputedStyle(v).display !== 'none'`.

---

## 12. Preloader

```html
<div id="preloader">
  <svg class="preloader-ring" viewBox="0 0 50 50">
    <!-- static background ring -->
    <circle cx="25" cy="25" r="20" stroke="rgba(255,255,255,0.12)" />
    <!-- animated progress arc -->
    <circle class="ring-progress" cx="25" cy="25" r="20"
            stroke-dasharray="125.66"     <!-- full circumference: 2πr -->
            stroke-dashoffset="125.66" /> <!-- starts fully hidden -->
  </svg>
  <span class="preloader-wordmark">iPhone</span>
</div>
```

The ring animates via CSS:

```css
.ring-progress {
  animation: ring-spin 1.2s linear infinite;
  transform-origin: center;
}

@keyframes ring-spin {
  to { stroke-dashoffset: 0; }
}
```

Dismiss logic:

```js
const hide = () => {
  el.classList.add('done');        // CSS: opacity 0, scale 0.95
  setTimeout(() => el.style.display = 'none', 1000); // remove after fade
};

// Dismiss when first video metadata is ready
vid.addEventListener('loadedmetadata', () => setTimeout(hide, 400), { once: true });

// Hard cap — never hang longer than 2.5 seconds
setTimeout(hide, 2500);
```

---

## 13. How All Systems Connect

```
Browser loads index.html
    │
    ├── Parses style.css → all visual styles ready
    ├── Parses main.js   → defines classes and functions (nothing runs yet)
    └── Parses model-viewer.js (module) → same

DOMContentLoaded fires (HTML is parsed, before images/videos load)
    │
    ├── new ThreeBackground()
    │       └── starts rAF loop → particles render every frame
    │
    ├── initHeroVideo()
    │       └── starts hero video at 0.8×, returns scroll callback
    │
    ├── scrubbers = [new VideoScrubber(section), ...]
    │       └── attaches to each .scrub-section, warms decoders
    │
    ├── new HighlightController()
    │       └── IntersectionObserver on .bento-card → play/pause videos
    │
    ├── initRevealBlocks()
    │       └── IntersectionObserver on .reveal-block → adds .in-view
    │
    ├── initScrollEngine(scrubbers, three, heroScrollUpdate)
    │       └── window 'scroll' → rAF → updates everything
    │
    ├── initParallax()
    │       └── window 'scroll' → rAF → translateY on parallax elements
    │
    ├── initCardTilt()       → mousemove on bento/order cards
    ├── initPreloader()      → video metadata → dismiss spinner
    └── initAnchors()        → smooth scroll on nav links

model-viewer.js (runs as module after DOMContentLoaded)
    │
    ├── Creates Three.js renderer, scene, camera, lights
    ├── Creates OrbitControls
    ├── Loads scene.glb via GLTFLoader + DRACOLoader
    ├── On load: centers + scales model, hides spinner
    ├── Starts rAF render loop
    └── Wires color/size buttons
```

### Why each system is isolated

Notice that `ThreeBackground` is wrapped in `try/catch`:

```js
let three = null;
try { three = new ThreeBackground(); }
catch (e) { console.warn('[ThreeBackground]', e.message); }
```

If Three.js CDN fails to load (network error, ad blocker, tracking prevention), `ThreeBackground()` throws, the catch handles it silently, and **the rest of the page works perfectly**. Every major enhancement is isolated this way — progressive enhancement.

---

## 14. Section Order & Why It Matters

The order of sections is a **conversion funnel**, not just a design choice:

```
1. Hero              — Emotional hook. "Built for Apple Intelligence."
2. Pro. Beyond pro.  — Four reasons to care. Sets up the story.
3. Take a closer look— Interactive 3D model. User touches the product.
4. Display video     — Cinematic scroll moment. Wow factor.
5. Craftsmanship     — Materials, precision. Justifies the price.
6. Tech specs        — Rational proof. Brain says yes.
7. Order             — Call to action. Heart + brain both ready.
```

**The wrong order (what we had before):**
- Model was at the bottom (most users never scroll that far)
- Order section came before Colors (asked to buy before showing the product)

**The rule:** Show everything remarkable *before* asking for money. The order CTA must always be the last content section before the footer.

---

## 15. Suggestions to Reach $10k Quality

These are the gaps between what's built and what Apple actually ships:

### 1. Apple Intelligence Section *(highest priority)*

The hero literally says "Built for Apple Intelligence" — but there's no section explaining it. Add a full-bleed dark section with three feature cards:

```
Writing Tools     | Image Playground  | Personal Siri
Rewrite emails    | Generate images   | Knows your context
in any tone.      | from text prompts.| across all apps.
```

This is the phone's headline feature and it's completely absent from the page.

### 2. Camera Close-Up Section

The 48MP triple-lens camera is the #1 reason people choose the Pro over the base model. It deserves its own visual moment — a large close-up photo of the camera module with copy on the right. Currently it's buried as one of four equal bento cards.

### 3. Scroll Progress Bar

A 1–2px line at the very top of the viewport that fills from left to right as you scroll. Communicates "this page has depth, explore it." Takes ~15 lines of JS:

```js
const bar = document.createElement('div');
bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:var(--accent);z-index:9999;transition:width 0.1s';
document.body.appendChild(bar);

window.addEventListener('scroll', () => {
  const pct = scrollY / (document.body.scrollHeight - innerHeight) * 100;
  bar.style.width = pct + '%';
}, { passive: true });
```

### 4. Order Cards Use the Same Image Twice

Both iPhone 16 Pro and Pro Max cards show the same Desert Titanium hero photo. At a minimum they should show different angles. Ideally the Pro card shows the front, the Pro Max shows the back.

### 5. Sticky Buy Button

After scrolling past the hero CTA, a pill button should appear fixed at the bottom-right:

```
[ iPhone 16 Pro — From $999  →  Buy ]
```

Apple does this on their actual product pages. It keeps the purchase action visible throughout the storytelling without being aggressive. Appears after scrolling 100vh, disappears when the Order section is in view.

### 6. Hero Text Stagger Animation

Currently the hero text just sits there after the preloader fades. A word-by-word stagger entrance would make the first impression unforgettable:

```css
.hero-word {
  opacity: 0;
  transform: translateY(20px);
  animation: word-in 0.5s var(--ease-out) forwards;
}

/* Each word gets increasing delay via JS or nth-child */
.hero-word:nth-child(1) { animation-delay: 0.1s; }
.hero-word:nth-child(2) { animation-delay: 0.2s; }
.hero-word:nth-child(3) { animation-delay: 0.3s; }
```

### 7. Connected Color Interactions

The color swatches in the Order section are purely decorative — clicking them does nothing. Connecting them to the 3D model viewer (scroll to model section + apply the color) would create a memorable cross-section interaction.

### 8. WebP/AVIF Images

Both JPG images in the project are served as `.jpg.large_2x.jpg` — ~2MB each. Converting to WebP would halve that with no visible quality loss. Use `<picture>` elements:

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="...">
</picture>
```

### 9. `prefers-reduced-motion` respect

The site already has this in CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

But the JS scroll-scrubbing and parallax don't check it. Add this guard at the top of `initParallax()` and the `VideoScrubber`:

```js
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

---

## Quick Reference

| Want to... | Look in... |
|---|---|
| Change a color / font | `style.css` `:root` tokens |
| Add a new section | `index.html` — copy an existing section block |
| Make something fade in on scroll | Add class `reveal-block` to the element |
| Add parallax to an element | Add it to the `items` array in `initParallax()` in `main.js` |
| Change 3D model behavior | `model-viewer.js` |
| Change video scrub timing | `data-in` / `data-out` attributes on `.phase` elements |
| Add a new color swatch | Add `.model-color-btn` with `data-color` and `data-title` in `index.html` |

---

*Built with vanilla HTML, CSS, and JavaScript. Three.js r0.164.1. No build tools required.*
