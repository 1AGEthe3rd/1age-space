import * as THREE from '../space/shared/three.module.js';

function surfaceTexture(paint) {
  const canvas = Object.assign(document.createElement('canvas'), { width: 256, height: 256 });
  const ctx = canvas.getContext('2d');
  paint(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function streetscapeMaterials() {
  let seed = 71;
  function grain() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function texture(base, masonry) {
    return surfaceTexture(ctx => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      if (masonry) {
        for (let row = 0; row < 16; row++) {
          for (let col = -1; col < 4; col++) {
            const value = 137 + Math.floor(grain() * 64);
            ctx.fillStyle = `rgb(${value},${value},${value})`;
            ctx.fillRect(col * 64 + (row % 2) * 32 + 1, row * 16 + 1, 62, 14);
          }
        }
      }
      for (let i = 0; i < 5600; i++) {
        ctx.fillStyle = grain() > .54 ? '#ffffff13' : '#00000016';
        ctx.fillRect(grain() * 256, grain() * 256, 1 + grain() * 4, 1 + grain() * 2);
      }
    });
  }
  const brick = texture('#b7afa8', true);
  const paving = texture('#dedbd8', false);
  const asphalt = texture('#bebebe', false);
  const variants = new Map();
  return function material(kind, color, repeatsX, repeatsY) {
    const key = JSON.stringify([kind, color, repeatsX, repeatsY]);
    if (!variants.has(key)) {
      const map = ({ brick, paving, asphalt })[kind].clone();
      map.repeat.set(repeatsX, repeatsY);
      map.needsUpdate = true;
      variants.set(key, new THREE.MeshStandardMaterial({ color, map, roughness: .93 }));
    }
    return variants.get(key);
  };
}

export const districtBounds = { minX:-33, maxX:33, minZ:-257, maxZ:117 };

export function buildingFootprint({ position, orientation, appearance }) {
  const width = Math.abs(Math.cos(orientation)) * appearance.width + Math.abs(Math.sin(orientation)) * appearance.depth;
  const depth = Math.abs(Math.sin(orientation)) * appearance.width + Math.abs(Math.cos(orientation)) * appearance.depth;
  return { x:position.x-width/2, z:position.z-depth/2, w:width, d:depth };
}

export const neighboringBuildings = [
  { x:-17.3, z:1.3, width:13, depth:9, height:6.2, color:'#9e7557', accent:'#343d35', style:'workshop' },
  { x:18, z:.6, width:11.7, depth:9, height:8.2, color:'#b1866f', accent:'#414744', style:'brick' },
  { x:18, z:-14, width:13.6, depth:9, height:5.6, color:'#c27a63', accent:'#483f3a', style:'brick' },
  { x:-17.3, z:-48, width:14, depth:9, height:9.1, color:'#ad8f71', accent:'#45534d', style:'brick' },
  { x:18, z:-34, width:14, depth:9, height:7.4, color:'#d8c5a1', accent:'#435452', style:'stucco' },
  { x:18, z:-51, width:12.6, depth:9, height:5.8, color:'#978873', accent:'#464943', style:'workshop' },
].map(({ x,z,...appearance }) => ({
  position:{ x,z }, orientation:x < 0 ? Math.PI/2 : -Math.PI/2, appearance,
})).concat([
  { position:{ x:26.4,z:26.4 }, orientation:Math.PI, appearance:{ width:15.6,depth:8.2,height:6.2,color:'#b7846c',accent:'#3e4a45',style:'brick' } },
  { position:{ x:28.2,z:1.3 }, orientation:0, appearance:{ width:12.6,depth:8.5,height:7.8,color:'#ccc2a0',accent:'#4e554d',style:'stucco' } },
  { position:{ x:-28.2,z:1.3 }, orientation:0, appearance:{ width:10.4,depth:8.4,height:5.8,color:'#a08161',accent:'#474d44',style:'workshop' } },
]);

export function buildFacade({ box, sign, scene, material }, building) {
  const { position, orientation, appearance, name } = building;
  const { width:w, depth:d, height:h, color, accent, style } = appearance;
  const group = new THREE.Group();
  group.position.set(position.x, 0, position.z);
  group.rotation.y = orientation;
  scene.add(group);
  const front = d / 2;
  const center = style === 'gym' ? 2.95 : 2.14;
  const flank = (w - center) / 2;
  const side = (w + center) / 4;
  const rearWall = material(style === 'stucco' ? 'paving' : 'brick', color, 7, 2);
  const masonry = material(style === 'stucco' ? 'paving' : 'brick', color, 5, 1);
  const add = (x,y,z,sx,sy,sz,paint,opts={}) => box(x,y,z,sx,sy,sz,paint,{parent:group,...opts});
  add(0,.08,0,w,.16,d,'#817d74');
  add(0,h-.16,0,w+.18,.29,d+.14,'#6d675d');
  add(0,h/2,-front,w,h,.22,rearWall);
  for (const x of [-w/2,w/2]) add(x,h/2,0,.24,h,d,rearWall);
  const upper = h - 3.65;
  add(0,3.65+upper/2,front-.09,w,upper,.26,masonry);
  add(0,3.63,front+.09,w+.05,.14,.32,'#aca498');
  add(0,h-.40,front+.10,w+.12,.12,.25,'#8f8173');

  const glass = new THREE.MeshStandardMaterial({
    color:'#a7bcbd', roughness:.27, metalness:.15, transparent:true, opacity:.27, depthWrite:false,
  });
  for (const direction of [-1, 1]) {
    const x = side * direction;
    add(x,.34,front-.07,flank,.68,.27,'#8f8a7e');
    add(x,.71,front+.055,flank,.11,.28,'#b5ad9f');
    add(x,1.97,front-.12,flank-.38,2.43,.045,glass,{ unbatched:true });
    for (const shift of [-.46,0,.46]) add(x+flank*shift,1.97,front, .08,2.5,.13,accent);
    for (const y of [1.06,2.56,3.19]) add(x,y,front,flank-.26,.065,.13,accent);
    add(direction * (w/2-.17),1.97,front, .34,3.3,.30,masonry);
    add(direction * (center/2+.12),1.97,front-.04,.24,3.3,.34,masonry);
    add(x,.16,front-2,flank-.13,.09,3.6,'#918272');
    add(x,1.52,front-3.6,flank,.07,.12,'#b5a88b');
    add(x,3.24,front-2.7,flank*.72,.06,.11,'#f7deb3',{ glow:true });
  }
  add(0,3.42,front-1.1,w-.32,.12,d-2.1,'#beb4a0');
  add(0,2.96,front-.73,center,.17,.18,accent);
  add(0,1.47,front-.73,center-.36,2.73,.05,glass,{unbatched:true});
  for (const x of [-center*.44,0,center*.44]) add(x,1.48,front-.66,.06,2.84,.08,accent);
  for (const y of [.20,.44,2.85]) add(0,y,front-.66,center-.31,.06,.09,accent);
  for (const x of [-.16,.16]) add(x,1.15,front-.59,.04,.23,.08,'#c7ad86');
  add(0,.11,front-.41,center-.11,.10,.99,'#a5a197');
  add(0,.16,front-1,center-.57,.025,.71,'#4a4c47');
  if (h > 7) {
    for (const x of [-w*.33,0,w*.33]) {
      add(x,5.48,front+.055,w*.19,1.58,.095,'#4d5c5c');
      add(x,4.65,front+.15,w*.22,.10,.22,'#c4b6a0');
      add(x,5.48,front+.13,.06,1.54,.025,accent);
      add(x,5.84,front+.13,w*.18,.065,.025,accent);
    }
  }
  if (name) sign(name, group, 0, 4.24, front+.09, w*.69, {
    color:style === 'gym' ? '#f0d1a0' : '#ede7d9',
    background:style === 'gym' ? '#252722' : '#334745',
    weight:style === 'gym' ? '900' : '700',
  });
  if (style === 'gym') {
    sign('BOXING  /  TRAINING', group, -side, 1.82, front+.087, flank*.78, { color:'#f0dfc2', background:null });
    sign('NO NAME BESUTO', group, side, 1.82, front+.087, flank*.78, { color:'#f0dfc2', background:null });
    for (const x of [-center/2-.23,center/2+.23]) {
      add(x,2.76,front+.21,.14,.24,.21,'#393732');
      add(x,2.68,front+.33,.10,.10,.04,'#ffe1a7',{glow:true});
    }
  }
  if (style === 'workshop') {
    add(0,3.31,front+.34,w-.19,.16,.81,accent);
    add(0,3.19,front+.71,w-.20,.12,.08,accent);
  }
  return box(0,1.45,front-.68,center-.22,2.8,.15,
    new THREE.MeshBasicMaterial({visible:false}), { parent:group, unbatched:true });
}

export function buildStreet({ box, sign, scene, material }) {
  const asphalt = material('asphalt','#494b48', 4, 32);
  const concrete = material('paving','#c6bfb0', 3, 32);
  box(0,-.36,-24,94,.56,100,'#716d5a');
  box(0,.018,-24,12,.035,100,asphalt);
  for (const side of [-1,1]) {
    for (const [z,length] of [[-33.25,81.5],[23.5,10]]) {
      box(side*8.9,.04,z,5.8,.08,length,concrete);
      box(side*6,.08,z,.19,.13,length,'#b0a89b');
    }
    for (let z=-72; z<7; z+=2.3) box(side*8.9,.082,z,5.68,.006,.018,'#9f998a');
    for (const z of [6.5,19.5]) box(side*6.8,.084,z,1.36,.025,.82,'#bb8e60');
  }
  box(0,.012,13,72,.043,10.88,material('asphalt','#494b48',20,4));
  for (const side of [-1,1]) {
    const x = side * 22;
    for (const z of [6.4,19.6]) {
      box(x,.040,z,31.7,.08,2.0,concrete);
      const curbEdge = z + (z < 13 ? .92 : -.92);
      box(x,.066,curbEdge,31.6,.12,.15,'#b0a89b');
      for (let offset=9; offset<36; offset+=2.35) {
        box(side*offset,.082,z,.016,.006,1.87,'#9f998a');
      }
    }
    for (let offset=10.3; offset<35; offset+=5.7) {
      box(side*offset,.043,13,3.7,.012,.085,'#b59460');
    }
    for (const offset of [11.8,25.7]) {
      box(side*offset,.074,20.16,1.8,.019,.72,'#937d62');
    }
    const xEnd = side * 31.8;
    const trafficGrey = '#4f5753';
    box(xEnd,1.75,19.6,.105,3.5,.105,trafficGrey);
    box(xEnd-side*.37,3.42,19.6,.82,.072,.072,trafficGrey);
    box(xEnd-side*.78,3.37,19.6,.28,.16,.22,trafficGrey);
    box(xEnd-side*.78,3.285,19.6,.22,.012,.15,'#fff2c9',{glow:true});
  }
  for (let z=-67; z<2; z+=6) {
    for (const x of [-.11,.11]) box(x,.040,z,.074,.008,4.6,'#cfa651');
  }
  for (const z of [6.4,19.6]) {
    for (let x=-5; x<=5; x+=1.25) box(x,.058,z,.62,.012,2.50,'#e4dece');
  }
  for (const x of [-6.55,6.55]) {
    for (let z=8.8; z<=17.3; z+=1.2) box(x,.058,z,1.28,.012,.54,'#d8d2c3');
  }
  const foliage = new THREE.IcosahedronGeometry(1,1);
  const crowns = [[0,3.63,0,1.17],[-.48,3.30,.12,.9],[.44,3.32,-.24,.86],[.02,4.18,.03,.78]];
  const trees = [
    new THREE.InstancedMesh(foliage, new THREE.MeshStandardMaterial({color:'#667649',roughness:1}),20),
    new THREE.InstancedMesh(foliage, new THREE.MeshStandardMaterial({color:'#566845',roughness:1}),20),
  ];
  const inst = new THREE.Object3D();
  let treeIndex = 0;
  for (const side of [-1,1]) {
    for (const z of [-54,-37,-18,1,21]) {
      const x=side*7.05;
      box(x,2.75,z,.115,5.5,.115,'#505655');
      box(x-side*.55,5.43,z,1.2,.075,.075,'#505655');
      box(x-side*1.13,5.40,z,.45,.16,.22,'#404744');
      box(x-side*1.13,5.31,z,.32,.02,.15,'#fff2c9',{glow:true});
    }
    for (const z of [-59,-41,-17.8,-5,22]) {
      const x=side*7.6;
      box(x,.092,z,1.45,.024,1.65,'#6d5b4c');
      box(x,1.54,z,.17,3,.19,'#665044');
      for (const [i,[dx,y,dz,size]] of crowns.entries()) {
        inst.position.set(x+dx,y,z+dz);
        inst.scale.set(size,.82*size,size);
        inst.updateMatrix();
        trees[y > 3.5 ? 0 : 1].setMatrixAt(treeIndex * 2 + i % 2, inst.matrix);
      }
      treeIndex++;
    }
  }
  scene.add(...trees);
  box(-21.5,.042,23.1,17,.09,5.8,material('paving','#ae8971',7,4));
  for (const x of [-26.8,-18.5]) {
    box(x,.105,23.9,2.35,.12,1.42,'#b7a898');
    box(x,.23,23.9,2.16,.18,1.24,'#6e6047');
    for (const support of [-.59,.59]) box(x+support,.31,22.55,.08,.57,.51,'#4a4c44');
    for (const slat of [-.15,0,.15]) box(x,.62,22.55+slat,1.71,.08,.115,'#76614e');
  }
  for (const x of [-8.55,8.55]) {
    box(x,1.85,7,.10,3.70,.10,'#747e78');
    const alberta=sign('NE ALBERTA ST',scene,x,3.57,7,1.74,{background:'#326249'});
    alberta.rotation.y=Math.PI/2;
    sign('NE MARTIN LUTHER KING JR BLVD',scene,x,3.85,7,2.66,{background:'#326249'});
  }
}

export function buildWorkroom({ box, sign, scene, material }) {
  const floor = material('paving','#ae9c81',4,6);
  box(0,-.14,0,10.4,.26,14.4,floor);
  box(0,3.65,0,10.4,.21,14.4,'#c3b6a6');
  box(0,1.78,-7.1,10.4,3.56,.19,'#c8b8a3');
  for (const x of [-5.1,5.1]) {
    box(x,1.78,0,.19,3.56,14.3,'#c8b8a3');
    box(x*.97,.14,0,.08,.23,14.2,'#656259');
    box(x*.97,1.12,-3.9,.055,.12,6.1,'#a28e75');
  }
  const glass = new THREE.MeshStandardMaterial({
    color:'#b2c3c9', transparent:true, opacity:.33, depthWrite:false, roughness:.37,
  });
  for (const x of [-3.24,3.24]) {
    box(x,.38,7.05,3.58,.76,.21,'#65716a');
    box(x,3.24,7.05,3.58,.65,.24,'#65716a');
    box(x,1.89,7.05,3.32,2.24,.045,glass,{unbatched:true});
    for (const dx of [-1.7,0,1.7]) box(x+dx,1.9,6.94,.075,2.32,.075,'#414a43');
    box(x,1.67,6.94,3.35,.082,.077,'#414a43');
  }
  box(0,1.64,7.05,2.83,3.28,.24,'#4b6058');
  box(0,1.76,6.91,1.53,2.81,.15,glass,{unbatched:true});
  box(.63,1.03,6.81,.06,.20,.075,'#dbccad');
  const exit = sign('EXIT TO NE MLK',scene,0,3.16,6.79,1.85,{background:'#345448'});
  exit.rotation.y=Math.PI;
  box(0,-.09,10.5,17,.2,6,'#aca69a');
  box(0,-.09,17.3,32,.2,8,'#6f6f62');
  for (const x of [-5,5]) box(x,2.75,21,9,5.5,.7,'#9e907b');
  for (const z of [-4.5,0,4.5]) {
    box(0,3.39,z,2.8,.12,.26,'#777768');
    box(0,3.315,z,2.61,.026,.17,'#fff0cc',{glow:true});
  }
  return box(0,1.53,6.89,1.65,3.0,.12,
    new THREE.MeshBasicMaterial({visible:false}),{unbatched:true});
}
