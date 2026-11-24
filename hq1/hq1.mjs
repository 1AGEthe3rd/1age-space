import * as THREE from '../space/shared/three.module.js';
import { subscribeInput } from '../space/shared/gamepad.mjs';
import { arrivalFor, entranceAt, neighborhood, venueUrl } from './venues.mjs';

const host = document.querySelector('#district');
const hint = document.querySelector('#guidance');
const entry = document.querySelector('#venue-entry');
const defaultHint = hint.textContent;
const preview = new URLSearchParams(location.search).get('preview') === '1';
if (preview) document.body.classList.add('project-preview');

function renderDistrict() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#273c4a');
  scene.fog = new THREE.Fog('#273c4a', 43, 115);
  const camera = new THREE.PerspectiveCamera(68, 1, .1, 130);
  const start = arrivalFor(location.search);
  camera.position.set(start.x, 1.75, start.z);
  let yaw = start.heading, pitch = 0;
  if (preview) {
    camera.position.set(-8.5, 3.2, -23);
    yaw = .84;
    pitch = -.085;
  }
  const blockers = [];
  const doorTargets = new Map();
  const materials = new Map();
  const unit = new THREE.BoxGeometry(1, 1, 1);

  function box(x, y, z, w, h, d, color, solid = false, glow = false, parent = scene) {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color, roughness: .91 }));
    const mesh = new THREE.Mesh(unit, materials.get(key));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    if (solid) blockers.push({ x: x - w / 2, z: z - d / 2, w, d });
    return mesh;
  }

  function sign(label, parent, x, y, z, width, color = '#e2ffdc') {
    const canvas = Object.assign(document.createElement('canvas'), { width: 768, height: 128 });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101b23';
    ctx.fillRect(0, 0, 768, 128);
    ctx.fillStyle = color;
    ctx.font = '700 54px system-ui';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(label, 384, 64, 700);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 6), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  // Adapted from the widths, sidewalks and Alberta cross street in Sol Road.
  box(0, -.36, -24, 94, .56, 100, '#243039');
  box(0, .018, -24, 12, .035, 100, '#303840');
  for (const side of [-1, 1]) {
    box(side * 8.9, .04, -24, 5.8, .08, 100, '#8d9088');
    box(side * 6.0, .08, -24, .18, .13, 100, '#b5b7a9');
  }
  box(0, .084, 13, 58, .035, 11, '#303840');
  for (let z = -67; z < 10; z += 6) box(0, .05, z, .15, .016, 3, '#c4a65b');
  for (const z of [7, 19]) for (let x = -5; x <= 5; x += 1.25) box(x, .115, z, .68, .017, 2.65, '#dbddd2');
  for (const side of [-1, 1]) for (const z of [-45, -23, -7, 10]) {
    box(side * 6.85, 2.8, z, .15, 5.6, .15, '#23353b');
    box(side * 7.15, 5.55, z, .84, .12, .36, '#fae3a1', false, true);
  }
  box(-20, .078, 19, 15, .08, 10, '#9d6a59');
  sign('NE Alberta St / NE MLK Jr Blvd', scene, -8.9, 4.25, 12.5, 5.7);
  sign('Harry Jackson Plaza · concept', scene, -13.4, 2.3, 19.4, 4.6).rotation.y = Math.PI / 2;

  function facade({ position, orientation, appearance, name }, withEntrance) {
    const { width, depth, height, color, accent } = appearance;
    const { x, z } = position;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = orientation;
    scene.add(group);
    box(0, height / 2, 0, width, height, depth, color, false, false, group);
    const face = depth / 2 + .04;
    box(0, height-.53, face, width+.1, .24, .16, accent, false, true, group);
    box(0, 3.0, face, width-.48, .13, .12, accent, false, false, group);
    for (const dx of [-width * .36, -width * .18, width * .18, width * .36]) {
      box(dx, 1.8, face, width*.15, 2.4, .15, '#142c37', false, false, group);
      box(dx, 1.62, face+.09, width*.11, .09, .09, '#86b2ba', false, true, group);
    }
    const doorColor = withEntrance ? accent : '#697b83';
    const door = box(0, 1.53, face, 2.1, 3.02, .26, '#0b171f', false, false, group);
    if (withEntrance) doorTargets.set(withEntrance.id, door);
    box(0, 2.83, face+.17, 2.6, .16, .30, doorColor, false, withEntrance, group);
    sign(name, group, 0, height-.99, face+.1, width*.84, accent);
    if (withEntrance) {
      const marker = new THREE.Mesh(new THREE.RingGeometry(.69, .79, 28), new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide }));
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(0, .13, face+1.1);
      group.add(marker);
    }
    const worldWidth = Math.abs(Math.sin(orientation)) > .5 ? depth : width;
    const worldDepth = Math.abs(Math.sin(orientation)) > .5 ? width : depth;
    blockers.push({x:x-worldWidth/2,z:z-worldDepth/2,w:worldWidth,d:worldDepth});
  }
  for (const [x, z, name, color, accent] of [
    [-17.3, 1.3, 'OpenHAUS · concept', '#39434d', '#84badf'],
    [18, .6, 'NE MLK storefront', '#39404a', '#d6af83'],
    [18, -14, 'Cason’s · concept', '#603a32', '#efc496'],
    [-17.3, -48, 'Sol Road storefront', '#3b484a', '#84bea7'],
    [18, -34, 'Soul District storefront', '#49424e', '#b9a6b5'],
    [18, -51, 'NE MLK storefront', '#57514a', '#ded4a5'],
  ]) facade({position:{x,z},orientation:x<0?Math.PI/2:-Math.PI/2,appearance:{width:13,depth:9,height:5.6,color,accent},name}, false);
  for (const venue of neighborhood.venues) facade(venue, venue);

  scene.add(new THREE.HemisphereLight('#c0d9ec','#453629',2.65));
  const sun = new THREE.DirectionalLight('#ffe0ad',1.85);
  sun.position.set(-6, 8, 10);
  scene.add(sun);

  const keys = new Set();
  const canvas = renderer.domElement;
  let touch = null;
  let controls = { move:{x:0,y:0},look:{x:0,y:0} };
  let current, last = 0;
  subscribeInput(input => { controls = input; });
  function useEntrance() { if (current) location.href = venueUrl(current); }
  addEventListener('keydown', event => {
    if (event.target.closest?.('#oneage-controller')) return;
    keys.add(event.code);
    if (event.code === 'KeyE' && !event.repeat) useEntrance();
  });
  addEventListener('keyup', event => keys.delete(event.code));
  addEventListener('blur', () => { keys.clear(); touch = null; controls = { move:{x:0,y:0},look:{x:0,y:0} }; });
  const ray = new THREE.Raycaster();
  canvas.addEventListener('pointerdown', event => {
    if (preview || touch || event.button !== 0) return;
    touch = { id:event.pointerId, x:event.clientX, y:event.clientY, distance:0 };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (touch?.id !== event.pointerId) return;
    touch.distance += Math.hypot(event.clientX - touch.x, event.clientY - touch.y);
    yaw -= (event.clientX - touch.x) * .004;
    pitch -= (event.clientY - touch.y) * .004;
    touch.x = event.clientX;
    touch.y = event.clientY;
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type, event => {
    if (touch?.id !== event.pointerId) return;
    const click = type === 'pointerup' && touch.distance < 6;
    touch = null;
    const target = current && doorTargets.get(current.id);
    if (!click || !target) return;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1, 1-2*(event.clientY-rect.top)/rect.height),camera);
    if (ray.intersectObject(target).length) useEntrance();
  });
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
  }
  addEventListener('resize', resize);
  resize();
  function clear(x,z) {
    const padding = .34;
    return !blockers.some(b => x > b.x-padding && x < b.x+b.w+padding && z > b.z-padding && z < b.z+b.d+padding);
  }
  if (preview) {
    camera.rotation.set(pitch,yaw,0,'YXZ');
    renderer.render(scene,camera);
    addEventListener('resize', () => renderer.render(scene,camera));
    return;
  }
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05, (now - (last || now)) / 1000);
    last = now;
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + controls.move.x;
    const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + controls.move.y;
    const d = 5.8 * dt / Math.max(1, Math.hypot(x,z));
    const nextX = THREE.MathUtils.clamp(camera.position.x+(Math.cos(yaw)*x + Math.sin(yaw)*z)*d,-25,25);
    const nextZ = THREE.MathUtils.clamp(camera.position.z+(-Math.sin(yaw)*x + Math.cos(yaw)*z)*d,-68,23);
    if (clear(nextX,camera.position.z)) camera.position.x = nextX;
    if (clear(camera.position.x,nextZ)) camera.position.z = nextZ;
    yaw -= controls.look.x * dt * 1.65;
    pitch = THREE.MathUtils.clamp(pitch - controls.look.y * dt * 1.3, -.75,.75);
    camera.rotation.set(pitch,yaw,0,'YXZ');
    const near = entranceAt(camera.position.x,camera.position.z);
    if (near !== current) {
      current = near;
      entry.hidden = !near;
      if (near) {
        entry.href = venueUrl(near);
        entry.textContent = 'Enter ' + near.name;
      }
      hint.textContent = near ? near.status + ' · E or select the entrance' : defaultHint;
    }
    renderer.render(scene,camera);
  });
}

try {
  renderDistrict();
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('WebGL')) throw error;
  document.body.classList.add('unavailable');
  hint.textContent = '3D graphics are unavailable on this device.';
  entry.href = neighborhood.venues[0].destination.url;
  entry.textContent = 'Open NNB directly';
  entry.hidden = false;
}
