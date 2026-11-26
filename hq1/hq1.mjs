import { buildOpenhaus } from './portland/openhaus.mjs';
import {portlandSky} from './portland/weather.mjs';
import {buildAlbertaBlocks} from './portland/alberta-blocks.mjs';
import {buildChurch,churchFrontages} from './portland/church.mjs';
import {buildKillingsworth} from './portland/killingsworth.mjs';
import {buildShowrooms,stops} from './portland/showrooms.mjs';
import {createActivities} from './portland/activities.mjs';
import { buildJarrettBlock, jarrettBlock } from './portland/jarrett.mjs';
import * as THREE from '../space/shared/three.module.js';
import { subscribeInput } from '../space/shared/gamepad.mjs';
import { PadReader } from '../space/shared/gamepad-model.mjs';
import { approachAt, arrivalFor, interiorFor, neighborhood, returnToVenue, venueUrl } from './venues.mjs';
import { buildFacade, buildStreet, buildWorkroom, buildingFootprint, districtBounds, neighboringBuildings, streetscapeMaterials } from './streetscape.mjs';

import { buildNorthLeftChefSite } from './northleftchef-site.mjs';

const host = document.querySelector('#district');
const hint = document.querySelector('#guidance');
const entry = document.querySelector('#venue-entry');
const defaultHint = hint.textContent;
const search = new URLSearchParams(location.search);
const preview = search.get('preview') === '1';
const interior = interiorFor(search);
const roomBounds = { minX:-4.76, maxX:4.76, minZ:-6.77, maxZ:6.68 };
if (preview) document.body.classList.add('project-preview');

function renderDistrict() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b6c4ca');
  scene.fog = new THREE.Fog('#b6c4ca', 51, 117);
  const camera = new THREE.PerspectiveCamera(64, 1, .1, 130);
  const start = interior ? { x:0, z:4.9, heading:0 } : (Object.hasOwn(stops,search.get('stop')) && !search.has('return') ? stops[search.get('stop')] : arrivalFor(search));
  camera.position.set(start.x, 1.75, start.z);
  let yaw = start.heading, pitch = 0;
  const view = search.get('view');
  const previewCameras = {
    sumner: {position:[-4,2.35,-17],target:[18,2.3,-24]},
    church: {position:[-4,2.25,-79],target:[18,2.2,-89]},
    killingsworth: {position:[-2,2.6,-49],target:[4,2.5,-70]},
    jarrett: { position:[-6.3,2.45,-162], target:[6,2.5,-132] },
    neighborhood: { position:[-8.5,3.2,-23], target:[-15,2.73,-32] },
    street: { position:[-4.6,2.14,6.35], target:[-1.4,2.05,-30] },
    nnb: { position:[-.8,2.65,-30.3], target:[-12.1,2.48,-31] },
    northleftchef: { position:[-6.8,2.8,-84.5], target:[-16.5,2.0,-95.2] },
    alberta: { position:[10.7,2.20,15.3], target:[25.5,2.12,13.0] },
    workroom: { position:[-.8,2.61,-9.8], target:[-12.9,2.45,-14.1] },
  };
  const blockers = [];
  const doorTargets = new Map();
  const materials = new Map();
  const boxBatches = new Map();
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const material = streetscapeMaterials();
  let interiorDoor, signals, activities;

  function box(x, y, z, w, h, d, color, { glow = false, parent = scene, unbatched = false } = {}) {
    const key = color + ':' + glow;
    if (typeof color === 'string' && !materials.has(key)) {
      materials.set(key, glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshStandardMaterial({ color, roughness:.87 }));
    }
    const paint = typeof color === 'string' ? materials.get(key) : color;
    const mesh = new THREE.Mesh(unit, paint);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    if (!unbatched) {
      if (!boxBatches.has(paint)) boxBatches.set(paint, []);
      boxBatches.get(paint).push(mesh);
    }
    return mesh;
  }

  function flushBoxes() {
    scene.updateMatrixWorld(true);
    for (const [paint, meshes] of boxBatches) {
      const batch = new THREE.InstancedMesh(unit, paint, meshes.length);
      for (const [i, mesh] of meshes.entries()) {
        batch.setMatrixAt(i, mesh.matrixWorld);
        mesh.removeFromParent();
      }
      scene.add(batch);
    }
  }

  function sign(label, parent, x, y, z, width, { color='#f4f0e5', background='#24362d', weight='700' } = {}) {
    const canvas = Object.assign(document.createElement('canvas'), { width:1024, height:128 });
    const ctx = canvas.getContext('2d');
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(8, 8, canvas.width-16, canvas.height-16);
    }
    ctx.fillStyle = color;
    ctx.font = weight + ' 67px system-ui';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(label, canvas.width/2, 63, canvas.width-80);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width/8), new THREE.MeshBasicMaterial({ map:texture, transparent:!background }));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  const builder = { box, sign, scene, material };
  if (interior) {
    interiorDoor = buildWorkroom(builder);
    document.querySelector('h1').textContent = interior.name;
    document.querySelector('header a').href = returnToVenue(interior);
    document.querySelector('header a').textContent = 'Return to HQ1';
  } else {
    buildStreet(builder);
    buildChurch(builder);
    buildAlbertaBlocks(builder);
    buildJarrettBlock(builder);
    const albertaSignal=buildShowrooms(builder,blockers);
    const killingsworthSignal=buildKillingsworth(builder);
    signals=seconds=>{albertaSignal(seconds);killingsworthSignal(seconds);};
    if (!preview) activities=createActivities(scene,camera,clear);
    for (const building of [...neighboringBuildings, ...jarrettBlock, ...churchFrontages, ...neighborhood.venues]) {
      if (building.appearance.style === 'nlc') {
        doorTargets.set(building.id, buildNorthLeftChefSite(builder));
      } else if (building.appearance.style === 'openhaus') {
        buildOpenhaus(builder, building, blockers);
      } else {
        const door = buildFacade(builder, building);
        if (building.id) doorTargets.set(building.id, [door]);
      }
      blockers.push(buildingFootprint(building));
    }
    const loader = new THREE.TextureLoader();
    const logo = loader.load('../assets/1age-logo.svg', () => {
      if (preview) renderer.render(scene, camera);
    });
    logo.colorSpace = THREE.SRGBColorSpace;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(.76,.76),
      new THREE.MeshBasicMaterial({map:logo,transparent:true}));
    plaque.position.set(-14.65,1.45,19.24);
    plaque.rotation.y = Math.PI/2;
    box(-14.83,1.45,19.24,.32,1.17,1.14,'#27332c');
    scene.add(plaque);
  }
  flushBoxes();
  const ambient=new THREE.HemisphereLight('#e4efff','#82715c',interior ? 2.6 : 2.05);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff0d9',2.35);
  sun.position.set(18,14,11);
  scene.add(sun);
  const weather=!interior && !preview ? portlandSky(scene,sun,ambient) : null;

  const keys = new Set();
  const canvas = renderer.domElement;
  let touch = null;
  let controls = { move:{x:0,y:0},look:{x:0,y:0} };
  let current, currentDoor, last = 0;
  const gamepad = new PadReader();
  function readGamepads() {
    try {
      return navigator.getGamepads?.() ?? [];
    } catch {
      return [];
    }
  }
  function destination(venue) {
    if (interior) return returnToVenue(interior);
    const url = new URL(venueUrl(venue,currentDoor?.id));
    return venue.destination.interior ? url.search : url.href;
  }
  subscribeInput(input => { controls = input; });
  function useEntrance() { if (activities?.interact()) return; if (current) location.assign(destination(current)); }
  addEventListener('keydown', event => {
    if (event.target.closest?.('#oneage-controller')) return;
    if (document.querySelector('dialog[open]')) return;
    keys.add(event.code);
    if (!event.repeat) activities?.toggle(event.code);
    if (event.code === 'KeyE' && !event.repeat) useEntrance();
  });
  addEventListener('keyup', event => keys.delete(event.code));
  addEventListener('gamepaddisconnected', () => gamepad.reset());
  addEventListener('blur', () => { keys.clear(); gamepad.reset(); touch = null; controls = { move:{x:0,y:0},look:{x:0,y:0} }; });
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
    const targets = current && (interior ? [interiorDoor] : doorTargets.get(current.id));
    if (!click || !targets) return;
    const rect = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1, 1-2*(event.clientY-rect.top)/rect.height),camera);
    if (ray.intersectObjects(targets).length) useEntrance();
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
    function renderPreview() {
      const framing = Object.hasOwn(previewCameras, view) ? previewCameras[view] : previewCameras.neighborhood;
      camera.position.fromArray(interior ? [0,2.14,5.48] : framing.position);
      camera.lookAt(...(interior ? [0,1.67,-3] : framing.target));
      camera.fov = camera.aspect < 1 ? 78 : 64;
      camera.updateProjectionMatrix();
      renderer.render(scene,camera);
    }
    renderPreview();
    addEventListener('resize', renderPreview);
    return;
  }
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05, (now - (last || now)) / 1000);
    last = now;
    const pads=readGamepads();
    const pad=gamepad.sample(pads,document.hasFocus() && !document.hidden);
    const {x:wx,z:wz}=camera.position;
    weather?.(dt,camera,(Math.abs(wx+17)<5 && Math.abs(wz-84)<9)||(Math.abs(wx-17)<5 && Math.abs(wz+228)<9));
    signals?.(now/1000);
    if (pad.edges.includes(0) && !document.activeElement?.matches('a,button') && !document.querySelector('dialog[open]')) useEntrance();
    const exitYaw=activities?.takeExitYaw();
    if (exitYaw!=null) {yaw=exitYaw;pitch=0;}
    if (activities?.frame(dt,keys,controls,Array.from(pads).find(Boolean),pad.edges,now/1000)) {
      current=null;entry.hidden=true;renderer.render(scene,camera);return;
    }
    const x = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + controls.move.x;
    const z = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + controls.move.y;
    const d = 5.8 * dt / Math.max(1, Math.hypot(x,z));
    const bounds = interior ? roomBounds : districtBounds;
    const nextX = THREE.MathUtils.clamp(camera.position.x+(Math.cos(yaw)*x + Math.sin(yaw)*z)*d,bounds.minX,bounds.maxX);
    const nextZ = THREE.MathUtils.clamp(camera.position.z+(-Math.sin(yaw)*x + Math.cos(yaw)*z)*d,bounds.minZ,bounds.maxZ);
    if (clear(nextX,camera.position.z)) camera.position.x = nextX;
    if (clear(camera.position.x,nextZ)) camera.position.z = nextZ;
    yaw -= controls.look.x * dt * 1.65;
    pitch = THREE.MathUtils.clamp(pitch - controls.look.y * dt * 1.3, -.75,.75);
    camera.rotation.set(pitch,yaw,0,'YXZ');
    const nearby = interior
      ? (Math.hypot(camera.position.x,camera.position.z-6.45) < 2.2 ? { venue:interior } : null)
      : approachAt(camera.position.x,camera.position.z);
    const near = nearby?.venue;
    const door = nearby?.door;
    if (near !== current || door !== currentDoor) {
      current = near;
      currentDoor = door;
      entry.hidden = !near;
      if (near) {
        entry.href = destination(near);
        entry.textContent = interior ? 'Return to HQ1' : 'Enter ' + near.name;
      }
      hint.textContent = near
        ? near.status + ' · E, A, or select the door'
        : interior?.status ?? defaultHint;
    }
    renderer.render(scene,camera);
  });
}

try {
  if(search.get('rail')==='yellow'){const {enterRail}=await import('./portland/rail-view.mjs');enterRail();}
  else renderDistrict();
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('WebGL')) throw error;
  document.body.classList.add('unavailable');
  hint.style.display = ''; hint.textContent = '3D graphics are unavailable on this device.';
  entry.href = interior ? returnToVenue(interior) : neighborhood.venues[0].destination.url;
  entry.textContent = interior ? 'Return to HQ1' : 'Open NNB directly';
  entry.hidden = false;
}
