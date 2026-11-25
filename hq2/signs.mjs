import * as THREE from '../space/shared/three.module.js';

const postGeometry=new THREE.CylinderGeometry(.042,.058,1,8);
const postMaterial=new THREE.MeshLambertMaterial({color:'#85908e'});
const faceGeometry=new THREE.PlaneGeometry(1,1);
const graphics=new Map();

function materialFor(label) {
  if (graphics.has(label)) return graphics.get(label);
  const canvas=document.createElement('canvas');
  canvas.width=768;
  canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#205c3c';
  ctx.fillRect(0,0,768,160);
  ctx.strokeStyle='#f0f3e6';
  ctx.lineWidth=6;
  ctx.strokeRect(8,8,752,144);
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font='700 69px Arial, sans-serif';
  ctx.fillStyle='#fffff5';
  ctx.fillText(label,384,83,715);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;
  const material=new THREE.MeshBasicMaterial({map,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
  graphics.set(label,material);
  return material;
}

export function intersectionSigns(records) {
  const result=new THREE.Group();
  for (const {post:[x,z],blades} of records) {
    const corner=new THREE.Group();
    corner.position.set(x,0,z);
    const pole=new THREE.Mesh(postGeometry,postMaterial);
    const height=2.75+blades.length*.31;
    pole.scale.y=height;
    pole.position.y=height/2;
    corner.add(pole);
    blades.forEach(({label,angle},i)=>{
      const width=Math.max(.79,Math.min(1.86,label.length*.067+.27));
      const board=new THREE.Group();
      board.position.y=2.86+i*.305;
      board.rotation.y=-angle;
      for (const facing of [-1,1]) {
        const face=new THREE.Mesh(faceGeometry,materialFor(label));
        face.position.z=.017*facing;
        face.scale.set(width,.264,1);
        if (facing===-1) face.rotation.y=Math.PI;
        board.add(face);
      }
      corner.add(board);
    });
    result.add(corner);
  }
  return result;
}

export function nearestIntersection(records,x,z,range=37) {
  let nearest=null;
  let best=range*range;
  for (const record of records) {
    const [a,b]=record.intersection;
    const distance=(a-x)**2+(b-z)**2;
    if (distance>=best) continue;
    nearest=record;
    best=distance;
  }
  return nearest;
}
