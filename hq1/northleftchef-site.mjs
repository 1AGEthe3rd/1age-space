import * as THREE from '../space/shared/three.module.js';

export const nlcSite = {
  position:{x:-17.25,z:-100},
  width:20.7,
  depth:9.65,
  height:3.65,
  areaReferenceSqFt:2163,
  frontage:4.825,
};

export const nlcDoors = [
  { id:'cafe', offset:-5.175 },
  { id:'studio', offset:5.52 },
].map(door => ({
  ...door,
  x:nlcSite.position.x + door.offset,
  z:nlcSite.position.z + nlcSite.frontage + .4,
  range:2.2,
  arrival:{ x:nlcSite.position.x + door.offset, z:nlcSite.position.z + nlcSite.frontage + 3.4, heading:Math.PI },
}));

export function buildNorthLeftChefSite({ box, sign, scene, material }) {
  const { position:{x,z}, width:w, depth:d, height:h, frontage:f } = nlcSite;
  box(0,-.36,-94,78,.56,44,'#716d5a');
  const asphalt=material('asphalt','#504d47',8,12);
  const concrete=material('paving','#c7beb1',7,10);
  box(0,.017,-94,12,.035,44,asphalt); // Continue MLK without moving earlier streets.
  for (const side of [-1,1]) {
    box(side*8.9,.039,-94,5.8,.08,44,concrete);
    box(side*6,.08,-94,.18,.13,44,'#a6a197');
  }
  for (let at=-73;at>-111;at-=7) {
    for (const lane of [-.11,.11]) box(lane,.041,at,.075,.011,5.25,'#ccab57');
  }
  box(-19,.023,-113.1,36,.05,6.2,asphalt);
  box(-18.6,.033,-86.5,24.6,.06,17.3,asphalt);
  box(-17.6,.045,-94.4,22.3,.09,1.5,concrete);
  box(-13.8,.049,-86.5,4,.012,13.1,concrete);
  box(-10.6,.049,-86.5,4,.012,2.2,concrete); // Driveway/sidewalk connection to MLK.
  for (const near of [{ start:-28.4, z:-91.1, count:8 },{ start:-28.4,z:-81.5,count:6 }]) {
    for (let i=0;i<=near.count;i++) box(near.start+i*2.51,.07,near.z,.060,.012,3.6,'#ded9c2');
  }
  for (const x of [-25,-11.1]) {
    box(x,.846,-80,.13,1.69,.13,'#53504a');
    box(x,1.65,-80,.31,.21,.055,'#d5d2c5');
  }
  const mark = sign('NE JESSUP ST',scene,-8.8,3.2,-110.1,1.9,{background:'#336049'});
  mark.rotation.y=Math.PI/2;
  box(-8.8,1.55,-110.1,.10,3.1,.10,'#5c6259');
  box(-8.4,2.35,-80.3,.15,4.7,.15,'#4c514b');
  box(-8.4,4.53,-80.3,1.85,.62,.19,'#b4b0a6');
  sign('5601',scene,-8.4,4.53,-80.19,1.42,{background:'#332f2a'});

  const back=material('paving','#bdb6a4',6,2);
  const white='#dfdbce', red='#9b4639', frame='#2c2d29';
  box(x,h/2,z-d/2,w,h,.20,back);
  for (const side of [-1,1]) box(x+side*w*.5,h*.5,z,.19,h,d,back);
  box(x,.09,z,w,.18,d,'#8c8376');
  box(x,h-.11,z,w+.2,.23,d+.2,'#c9c5b8');
  for (const dx of [-w*.5,0,w*.5]) box(x+dx,1.54,z+f,.26,3.09,.29,dx===0 ? white : red);
  box(x,3.24,z+f,w,.75,.24,white);
  box(x,3.61,z+f,w+.22,.075,.29,frame);
  const glazing = new THREE.MeshStandardMaterial({
    color:'#99abb0', roughness:.31, transparent:true, opacity:.26, depthWrite:false, metalness:.08,
  });
  for (const door of nlcDoors) {
    const span=door.id==='cafe' ? [-w*.5+.14,-.14] : [.14,w*.5-.14];
    const edges=[span[0],door.offset-.71,door.offset+.71,span[1]];
    for (const index of [0,1,2]) {
      const left=edges[index], right=edges[index+1], width=right-left;
      const xx=x+(left+right)/2;
      box(xx,1.59,z+f,width,2.76,.04,glazing,{unbatched:true});
      const mullions=index===1?1:3;
      for (let side=0;side<=mullions;side++) box(x+left+width*side/mullions,1.59,z+f+.044,.055,2.81,.07,frame);
      for (const y of [.19,2.98]) box(xx,y,z+f+.04,width,.066,.073,frame);
      box(xx,.88,z+f+.045,width,.104,.08,red);
    }
    box(door.x+.45,1.08,z+f+.11,.05,.25,.05,'#beb199');
    box(door.x,2.64,z+f-1.1,3.85,.044,.10,'#f7e2bb',{glow:true});
  }
  sign('NORTHLEFTCHEF',scene,x-w*.25,3.25,z+f+.14,5.8,{color:'#ede3cf',background:'#30302b'});
  sign('MUSIC STUDIO',scene,x+w*.25,3.25,z+f+.14,5.7,{color:'#ede3cf',background:'#30302b'});
  return nlcDoors.map(door => box(door.x,1.52,z+f+.12,1.36,2.78,.10,
    new THREE.MeshBasicMaterial({visible:false}),{unbatched:true}));
}
