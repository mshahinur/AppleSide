import * as THREE from 'three';
import { GLTFLoader }   from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader }  from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Materials on the model that belong to glass, lens, and border — skip colour changes on these
const EXCLUDED = new Set([
  'zFdeDaGNRwzccye',
  'ujsvqBWRMnqdwPx',
  'hUlRcbieVuIiOXG',
  'jlzuBkUzuJqgiAK',
  'xNrofRCqOXXHVZt',
]);

const lerp = (a, b, t) => a + (b - a) * t;
const SIZE_RATIO = { small: 1, large: 17 / 15 };

function init() {
  const canvas   = document.getElementById('model-canvas');
  const loaderEl = document.getElementById('model-loader');
  const hintEl   = document.getElementById('model-hint');
  const titleEl  = document.getElementById('model-title');
  if (!canvas) return;

  const wrap = canvas.parentElement;
  const W = () => wrap.clientWidth;
  const H = () => wrap.clientHeight;

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.outputColorSpace    = THREE.SRGBColorSpace;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  // ── Scene ─────────────────────────────────────────────────────────────────
  const scene  = new THREE.Scene();

  // ── Camera ────────────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(32, W() / H(), 0.1, 100);
  camera.position.set(0, 0, 5.5);

  // ── Studio lighting — mirrors Lights.jsx ──────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const dir = (hex, intensity, x, y, z) => {
    const l = new THREE.DirectionalLight(hex, intensity);
    l.position.set(x, y, z);
    scene.add(l);
  };
  dir(0xffffff, 4.0,   0,  10,  6);   // key  — top-front
  dir(0x9ab0cc, 2.0,  -8,   2,  3);   // fill — left (cool)
  dir(0xffffff, 1.5,   8,   0,  2);   // rim  — right
  dir(0xffffff, 1.0,   0, -15,  8);   // bounce bottom
  dir(0x495057, 1.5,  -1,   0, -10);  // back reflector (dark, simulates env rect)

  // ── OrbitControls ─────────────────────────────────────────────────────────
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom      = false;
  controls.enablePan       = false;
  controls.rotateSpeed     = 0.4;
  controls.autoRotate      = true;
  controls.autoRotateSpeed = 1.8;
  controls.minPolarAngle   = Math.PI * 0.20;
  controls.maxPolarAngle   = Math.PI * 0.80;
  controls.enableDamping   = true;
  controls.dampingFactor   = 0.06;
  controls.update();

  // ── Model state ───────────────────────────────────────────────────────────
  const pivot = new THREE.Group();
  scene.add(pivot);
  let normScale = 1, curScale = 1, tgtScale = 1, loaded = false;

  // ── Load GLTF (Draco-compressed) ──────────────────────────────────────────
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/gltf/');

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  gltfLoader.load(
    'videos/scene.glb',
    (gltf) => {
      const model = gltf.scene;

      // Measure, centre, and normalise to ~2.5 world units tall
      const box = new THREE.Box3().setFromObject(model);
      const ctr = box.getCenter(new THREE.Vector3());
      const sz  = box.getSize(new THREE.Vector3());

      model.position.sub(ctr);                // centre geometry at pivot origin
      normScale = 2.5 / Math.max(sz.x, sz.y, sz.z);
      pivot.scale.setScalar(normScale);
      curScale = tgtScale = normScale;

      pivot.add(model);
      loaded = true;

      if (loaderEl) loaderEl.classList.add('hidden');
    },
    (ev) => {
      if (ev.total > 0 && loaderEl) {
        const p = loaderEl.querySelector('.model-loader-text');
        if (p) p.textContent = `Loading… ${Math.round(ev.loaded / ev.total * 100)}%`;
      }
    },
    (err) => console.error('[model-viewer]', err)
  );

  // ── Render loop ───────────────────────────────────────────────────────────
  (function tick() {
    requestAnimationFrame(tick);
    if (loaded) {
      curScale = lerp(curScale, tgtScale, 0.07);
      pivot.scale.setScalar(curScale);
    }
    controls.update();
    renderer.render(scene, camera);
  })();

  // ── Resize ────────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = W(), h = H();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // ── Pointer: stop auto-rotate + dismiss hint on first drag ────────────────
  let hintGone = false;
  renderer.domElement.addEventListener('pointerdown', () => {
    controls.autoRotate = false;
    if (!hintGone && hintEl) { hintEl.classList.add('hidden'); hintGone = true; }
  });

  // ── Colour buttons ────────────────────────────────────────────────────────
  document.querySelectorAll('.model-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (titleEl) titleEl.textContent = `iPhone 16 Pro in ${btn.dataset.title}`;

      const newColor = new THREE.Color(btn.dataset.color);
      pivot.traverse(child => {
        if (!child.isMesh || !child.material) return;
        if (!EXCLUDED.has(child.material.name)) {
          child.material.color.copy(newColor);
          child.material.needsUpdate = true;
        }
      });
    });
  });

  // ── Size buttons ──────────────────────────────────────────────────────────
  document.querySelectorAll('.model-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tgtScale = normScale * SIZE_RATIO[btn.dataset.size];
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
