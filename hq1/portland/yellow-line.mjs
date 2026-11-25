// Four adjacent TriMet Yellow Line stations. Original compressed surface alignment.
import * as T from '../../space/shared/three.module.js';

export const stops=['Overlook Park','N Prescott St','N Killingsworth St','Rosa Parks'];
const spacing=100;
const boxGeometry=new T.BoxGeometry();

export function createYellowLine() {
  const scene=new T.Scene(), materials=new Map(), doors=[];
  scene.background=new T.Color('#25292b');
  scene.fog=new T.Fog('#b4bdc4',42,180);
  function box(parent,x,y,z,w,h,d,color) {
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color}));
    const mesh=new T.Mesh(boxGeometry,materials.get(color));
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);
    return mesh;
  }
  function sign(parent,text,x,y,z) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#292821';ctx.fillRect(0,0,768,96);
    ctx.fillStyle='#efbf39';ctx.fillRect(0,0,18,96);ctx.fillStyle='#fff';
    ctx.font='bold 50px system-ui';ctx.fillText(text,35,67,700);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(6,.75),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    face.position.set(x,y,z);parent.add(face);
  }
  const corridor=new T.Group();scene.add(corridor);
  for(let i=0;i<stops.length;i++){
    const z=i*spacing;
    box(corridor,-4,-.23,z,5,.44,30,'#ac8a73');
    box(corridor,-1.7,.005,z,.34,.02,30,'#eac867');
    box(corridor,-4.3,3.55,z,4.4,.18,13,'#4d5c61');
    sign(corridor,stops[i],-4,2.35,z-8);
    for(const k of [-5,5]){
      box(corridor,-5.8,2,z+k,.35,4,.48,'#777671');
      box(corridor,-4.9,.52,z+k,1.1,.2,2.4,'#a28868');
      box(corridor,-5.8,5.5,z+k,.10,3,.10,'#69716b');
    }
  }
  box(corridor,0,-1.12,150,250,.4,460,'#858973');
  box(corridor,0,-.94,150,4.7,.16,365,'#81786e');
  box(corridor,0,6.75,150,.045,.05,365,'#474d50');
  for(let z=-15,i=0;z<340;z+=19,i++){
    box(corridor,12,-.85,z,7,.15,19,'#5b6061');
    for(const side of [-1,1]){
      const x=side*(21+i%3*2),h=4+i%4;
      box(corridor,x,h/2-.92,z,9,h,12,i%2?'#b39883':'#bfad96');
      for(const off of [-3,0,3])box(corridor,x-side*4.54,2.1,z+off,.08,1.35,1.7,'#526873');
    }
  }
  for(const x of [-.75,.75]) box(corridor,x,-.65,150,.1,.13,360,'#9da7aa');
  for(let z=-24;z<328;z+=5){
    box(corridor,2.7,1.4,z,.1,.15,.8,'#ffda87');
    box(corridor,0,-.81,z,2.7,.18,.4,'#615954');
  }
  const car=new T.Group();scene.add(car);
  box(car,0,-.16,0,2.9,.3,13,'#847976');
  box(car,0,2.57,0,2.9,.15,13,'#d4d3c7');
  for(const z of [-6.45,6.45]) {
    box(car,0,1.23,z,2.9,2.5,.12,'#c0c9cb');
    const face=z+Math.sign(z)*.09;
    box(car,0,1.64,face,2.55,.86,.06,'#334753');
    box(car,0,.88,face,2.75,.18,.08,'#f1b638');
    for(const side of [-1,1])box(car,side*1.03,.60,face,.36,.16,.10,'#ffe6aa');
  }
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
      const glass=box(leaf,0,0,0,1,1,1,'#45616e');
      glass.position.set(Math.sign(x)*.53,.10,0);glass.scale.set(.1,.42,.77);
      doors.push({leaf,dir,platform:x<0});
    }
  }
  sign(car,'MAX · Yellow Line',0,1.84,-6.34);
  for(const side of [-1,1]) for(const z of [-3.7,3.7]) box(car,side*1.48,.79,z,.07,.18,5.45,'#e8b43b');
  const ambient=new T.HemisphereLight('#fff3d8','#87858a',2.1);scene.add(ambient);
  const light=new T.DirectionalLight('#fff4df',2);light.position.set(-4,8,5);scene.add(light);
  let stop=2,target=2,progress=1,aboard=false;
  function position(offset,open){
    corridor.position.z=-offset*spacing;
    for(const {leaf,dir,platform} of doors) leaf.position.z=dir*(.49+(platform?open:0));
  }
  position(stop,1);
  return {scene,sun:light,ambient,get name(){return stops[stop]},get aboard(){return aboard},
    get riding(){return progress<1},get atStreet(){return stop===2&&!aboard},
    get next(){return stops[target]},
    reset(){stop=2;target=2;progress=1;aboard=false;position(stop,1)},
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
