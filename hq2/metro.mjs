// Stop order from WMATA's public rail system map. Scene distances and times are compressed.
import * as T from '../space/shared/three.module.js';

export const stops=['Navy Yard–Ballpark','Anacostia','Congress Heights','Southern Avenue','Naylor Road','Suitland','Branch Avenue'];
const spacing=100;
const boxGeometry=new T.BoxGeometry();

export function createMetro() {
  const scene=new T.Scene(), materials=new Map(), doors=[];
  scene.background=new T.Color('#25292b');
  scene.fog=new T.FogExp2('#25292b',.025);
  function box(parent,x,y,z,w,h,d,color) {
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color}));
    const mesh=new T.Mesh(boxGeometry,materials.get(color));
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);
    return mesh;
  }
  function sign(parent,text,x,y,z) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#292821';ctx.fillRect(0,0,768,96);
    ctx.fillStyle='#309445';ctx.fillRect(0,0,18,96);ctx.fillStyle='#fff';
    ctx.font='bold 50px system-ui';ctx.fillText(text,35,67,700);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(6,.75),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    face.position.set(x,y,z);parent.add(face);
  }
  const tunnel=new T.Group();scene.add(tunnel);
  for(let i=0;i<stops.length;i++){
    const z=i*spacing;
    box(tunnel,-4,-.23,z,5,.44,30,'#ac8a73');
    box(tunnel,-1.7,.005,z,.34,.02,30,'#eac867');
    box(tunnel,-6.6,1.9,z,.3,4,31,'#a6a39a');
    sign(tunnel,stops[i],-4,2.35,z-8);
    for(const k of [-12,-6,0,6,12]){
      box(tunnel,-5.8,2,z+k,.35,4,.48,'#777671');
      box(tunnel,-3.6,4,z+k,5.8,.24,.65,'#cbc4b1');
      box(tunnel,-3.6,3.86,z+k,3,.04,.16,'#fff4c5');
    }
  }
  const span=(stops.length-1)*spacing;
  for(const x of [-.75,.75]) box(tunnel,x,-.65,span/2,.1,.13,span+60,'#9da7aa');
  for(let z=-24;z<span+28;z+=5){
    box(tunnel,2.7,1.4,z,.1,.15,.8,'#ffda87');
    box(tunnel,0,-.81,z,2.7,.18,.4,'#615954');
  }
  const car=new T.Group();scene.add(car);
  box(car,0,-.16,0,2.9,.3,13,'#847976');
  box(car,0,2.57,0,2.9,.15,13,'#d4d3c7');
  for(const z of [-6.45,6.45]) box(car,0,1.23,z,2.9,2.5,.12,'#a7b1b1');
  for(const x of [-1.42,1.42]){
    for(const z of [-3.7,3.7]){
      box(car,x,.42,z,.10,.85,5.45,'#bac1c2');
      box(car,x,2.27,z,.10,.46,5.45,'#a8b0b2');
      for(const dz of [-2,0,2]) box(car,x,1.45,z+dz,.12,1.2,.14,'#7a8284');
      box(car,x*.71,.44,z,.65,.28,3.6,'#526f87');
      box(car,x*.89,.78,z,.18,.64,3.6,'#657c8c');
    }
    for(const dir of [-1,1]){
      const leaf=box(car,x,1.21,dir*.49,.12,2.4,.97,'#aab3b3');
      doors.push({leaf,dir,platform:x<0});
    }
  }
  sign(car,'Green Line',0,1.84,-6.34);
  scene.add(new T.HemisphereLight('#fff3d8','#87858a',2.1));
  const light=new T.DirectionalLight('#fff4df',2);light.position.set(-4,8,5);scene.add(light);
  let stop=1,target=1,progress=1,aboard=false;
  function position(offset,open){
    tunnel.position.z=-offset*spacing;
    for(const {leaf,dir,platform} of doors) leaf.position.z=dir*(.49+(platform?open:0));
  }
  position(stop,1);
  return {scene,stations:[],get name(){return stops[stop]},get aboard(){return aboard},
    get riding(){return progress<1},get atStreet(){return stop===1&&!aboard},
    get next(){return stops[target]},
    reset(name='Anacostia'){stop=stops.indexOf(name);
      if(stop<0) stop=1;
      target=stop;progress=1;aboard=false;position(stop,1)},
    adjacent(dir){return stops[stop+dir]},
    toggle(){if(progress===1) aboard=!aboard},
    depart(dir){if(!aboard||progress<1||!stops[stop+dir]) return;target=stop+dir;progress=0},
    tick(dt){
      if(progress===1) return;
      progress=Math.min(1,progress+dt/6);
      const t=Math.max(0,Math.min(1,(progress-.1)/.8));
      position(stop+(target-stop)*t*t*(3-2*t),Math.max(0,1-progress*10,(progress-.9)*10));
      if(progress===1) stop=target;
    },
    clear(x,z){return aboard?Math.abs(x)<.66&&Math.abs(z)<6 : x>-6&&x<-1.7&&Math.abs(z)<14.7}
  };
}
