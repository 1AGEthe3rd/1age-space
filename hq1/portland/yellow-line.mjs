import {buildKenton,kentonStation,kentonWalkable} from './kenton.mjs';
// Eight adjacent TriMet Yellow Line stations. Original compressed surface alignment.
import * as T from '../../space/shared/three.module.js';

export const stops=['Overlook Park','N Prescott St','N Killingsworth St','Rosa Parks','N Lombard TC','Kenton/N Denver Ave','Delta Park/Vanport','Expo Center'];
const yellowStops=stops;
const spacing=100;
export const redStops=['Rose Quarter TC','Convention Center','NE 7th Ave','Lloyd Center/NE 11th Ave','Hollywood/NE 42nd Ave','NE 60th Ave','NE 82nd Ave','Gateway/NE 99th Ave TC','Parkrose/Sumner TC','Cascades','Mt Hood Ave','Portland International Airport'];
export const airportYellowStops=['Interstate/Rose Quarter',...stops];
const boxGeometry=new T.BoxGeometry();

export function createYellowLine(stationId,line='yellow') {
  const stops=line==='red'?redStops:line==='airport-yellow'?airportYellowStops:yellowStops;
  const routeLength=(stops.length-1)*spacing;
  const color=line==='red'?'#c83b42':'#efbf39';
  const label=line==='red'?'Red':'Yellow';
  const terminal=line==='red'?'Portland International Airport':'Expo Center';
  const scene=new T.Scene(), materials=new Map(), doors=[];
  scene.background=new T.Color('#25292b');
  scene.fog=new T.Fog('#b4bdc4',42,180);
  const corridor=new T.Group();scene.add(corridor);
  const batches=new Map();
  function box(parent,x,y,z,w,h,d,color) {
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color}));
    if(parent===corridor){
      const matrix=new T.Matrix4().makeScale(w,h,d).setPosition(x,y,z);
      if(!batches.has(color))batches.set(color,[]);
      batches.get(color).push(matrix);
      return;
    }
    const mesh=new T.Mesh(boxGeometry,materials.get(color));
    mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);
    return mesh;
  }
  function sign(parent,text,x,y,z) {
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=96;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#292821';ctx.fillRect(0,0,768,96);
    ctx.fillStyle=color;ctx.fillRect(0,0,18,96);ctx.fillStyle='#fff';
    ctx.font='bold 50px system-ui';ctx.fillText(text,35,67,700);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const face=new T.Mesh(new T.PlaneGeometry(6,.75),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    face.position.set(x,y,z);parent.add(face);return face;
  }
  for(let i=0;i<stops.length;i++){
    const z=i*spacing;
    box(corridor,-4,-.23,z,5,.44,30,'#ac8a73');
    box(corridor,-1.7,.005,z,.34,.02,30,'#eac867');
    box(corridor,-4.3,3.55,z,4.4,.18,13,'#4d5c61');
    sign(corridor,stops[i],-4,2.35,z-8);
    if(stops[i]==='N Lombard TC'){
      // Transfer shelter and paved bays beside the station.
      box(corridor,-12,-.72,z,10,.20,33,'#666b68');
      box(corridor,-9,2.55,z,3.5,.2,14,'#547072');
      for(const off of [-6,0,6]){
        box(corridor,-10.4,.98,z+off,.14,3,.14,'#52605d');
        box(corridor,-12,-.60,z+off,.12,.02,4.3,'#ddc675');
      }
      sign(corridor,'Transit Center',-9.6,2.1,z-6);
    }
    if(stops[i]===kentonStation)buildKenton({box,sign,group:corridor,origin:z});
    if(stops[i]==='Delta Park/Vanport'){
      for(let row=0;row<7;row++){
        const x=-10-row%3*2,at=z-20+row*6;
        box(corridor,x,.6,at,.38,3,.38,'#71634e');
        box(corridor,x,2.9,at,3.6,3.8,3.8,'#607954');
        box(corridor,x,5.1,at,2.3,1.7,2.4,'#728765');
      }
    }
    for(const k of [-5,5]){
      box(corridor,-5.8,2,z+k,.35,4,.48,'#777671');
      box(corridor,-4.9,.52,z+k,1.1,.2,2.4,'#a28868');
      box(corridor,-5.8,5.5,z+k,.10,3,.10,'#69716b');
    }
  }
  box(corridor,0,-1.12,routeLength/2,250,.4,routeLength+160,'#858973');
  box(corridor,0,-.94,routeLength/2,4.7,.16,routeLength+65,'#81786e');
  box(corridor,0,6.75,routeLength/2,.045,.05,routeLength+65,'#474d50');
  const kentonZ=stops.indexOf(kentonStation)*spacing;
  for(let z=-15,i=0;z<routeLength+40;z+=19,i++){
    box(corridor,12,-.85,z,7,.15,19,'#5b6061');
    for(const side of [-1,1]){
      if((z>routeLength-62 || Math.abs(z-kentonZ)<28) && side<0) continue; // Terminal forecourt.
      const x=side*(21+i%3*2),h=4+i%4;
      box(corridor,x,h/2-.92,z,9,h,12,i%2?'#b39883':'#bfad96');
      for(const off of [-3,0,3])box(corridor,x-side*4.54,2.1,z+off,.08,1.35,1.7,'#526873');
    }
  }
  for(const x of [-.75,.75]) box(corridor,x,-.65,routeLength/2,.1,.13,routeLength+60,'#9da7aa');
  for(let z=-24;z<routeLength+28;z+=5){
    box(corridor,2.7,1.4,z,.1,.15,.8,'#ffda87');
    box(corridor,0,-.81,z,2.7,.18,.4,'#615954');
  }
  // Original virtual terminal forecourt and hall frontage.
  box(corridor,-14,-.23,routeLength,19,.44,22,'#aca799');
  box(corridor,-29,3.05,routeLength,10,7.8,33,'#bbbbb0');
  for(let dz=-12;dz<=12;dz+=4){
    box(corridor,-23.95,1.8,routeLength+dz,.12,3.4,3.6,'#536e79');
    box(corridor,-23.80,1,routeLength+dz,.12,.08,3.6,'#9aa7a5');
  }
  box(corridor,-22,4.35,routeLength,6,.28,30,'#53636c');
  for(const dz of [-12,12])box(corridor,-19.3,2.1,routeLength+dz,.22,4.2,.22,'#718087');
  sign(corridor,terminal+' · MAX',-13,2.7,routeLength-8);
  for(const x of [-.75,.75]) box(corridor,x,-.18,routeLength+19,.4,1.2,.5,'#c29750');
  box(corridor,0,.34,routeLength+19,2.3,.27,.34,'#c29750');
  for(const [color,matrices] of batches){
    const batch=new T.InstancedMesh(boxGeometry,materials.get(color),matrices.length);
    matrices.forEach((matrix,i)=>batch.setMatrixAt(i,matrix));corridor.add(batch);
  }
  const car=new T.Group();scene.add(car);
  box(car,0,-.16,0,2.9,.3,13,'#847976');
  box(car,0,2.57,0,2.9,.15,13,'#d4d3c7');
  for(const z of [-6.45,6.45]) {
    box(car,0,1.23,z,2.9,2.5,.12,'#c0c9cb');
    const face=z+Math.sign(z)*.09;
    box(car,0,1.64,face,2.55,.86,.06,'#334753');
    box(car,0,.88,face,2.75,.18,.08,color);
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
  sign(car,'MAX · '+label+' Line',0,1.84,-6.34);
  for(const side of [-1,1]) for(const z of [-3.7,3.7]) box(car,side*1.48,.79,z,.07,.18,5.45,color);
  const ambient=new T.HemisphereLight('#fff3d8','#87858a',2.1);scene.add(ambient);
  const light=new T.DirectionalLight('#fff4df',2);light.position.set(-4,8,5);scene.add(light);
  const found=stops.findIndex(name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-')===stationId);
  const entry=found<0?(line==='red'?0:stops.indexOf('N Killingsworth St')):found;
  let stop=entry,target=entry,progress=1,aboard=false;
  function position(offset,open){
    corridor.position.z=-offset*spacing;
    for(const {leaf,dir,platform} of doors) leaf.position.z=dir*(.49+(platform?open:0));
  }
  position(stop,1);
  return {scene,sun:light,ambient,get name(){return stops[stop]},get aboard(){return aboard},
    get riding(){return progress<1},get atStreet(){return stops[stop]==='N Killingsworth St'&&!aboard},
    get next(){return stops[target]},
    reset(){stop=entry;target=entry;progress=1;aboard=false;position(stop,1)},
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
    clear(x,z){return aboard?Math.abs(x)<.66&&Math.abs(z)<6 : (x>-6&&x<-1.7&&Math.abs(z)<14.7)||(stops[stop]===kentonStation&&kentonWalkable(x,z))||(stop===stops.length-1&&x>=-23&&x<=-4&&Math.abs(z)<10.7)}
  };
}
