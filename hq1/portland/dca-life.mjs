// DCA public terminal ambience. Purely decorative fictional travelers and aircraft.
// No wall clock, timetable, real airline assignments, flight tracking or schedule polling.
// Future shared city service owns all real time and schedule data.
import {dcaWalkable} from './dca-terminal.mjs';
export const lanes=Object.freeze([-4.7,-3.7,3.7,4.7]);
export const passengerLimit=Object.freeze({mobile:6,desktop:10});
export function travelerPose(index,elapsed){
 const lane=lanes[index%lanes.length],speed=.75+(index%3)*.12;
 const distance=((Math.max(0,elapsed)*speed+index*9.7)%80+80)%80;
 const direction=distance<40?1:-1;
 const z=-20+(direction===1?distance:80-distance);
 return {x:lane,z,direction,stride:Math.sin(elapsed*speed*7+index)*.52};
}
export function createDcaLife(T,terminal,ground,box,sign,{low=false}={}){
 const people=new T.Group(),scenery=new T.Group();
 terminal.add(people);ground.add(scenery);
 const actors=[],caps=passengerLimit[low?'mobile':'desktop'];
 const headGeo=new T.SphereGeometry(.115,10,8),bodyGeo=new T.CylinderGeometry(.19,.145,.43,8);
 const limbGeo=new T.CylinderGeometry(.065,.055,.39,7);
 const skin=['#d7a381','#88583f','#e6c2a0','#ac7655'];
 const coats=['#2e4358','#57665b','#8e6a53','#4f526b','#b0a08a'];
 const mats=new Map();
 function material(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.83}));return mats.get(color);}
 function mesh(parent,geo,color,x,y,z){const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);parent.add(m);return m;}
 for(let i=0;i<caps;i++){
  const root=new T.Group();people.add(root);
  mesh(root,headGeo,skin[i%skin.length],0,1.56,0);
  mesh(root,bodyGeo,coats[i%coats.length],0,1.23,0);
  box(root,0,.97,0,.29,.15,.20,'#3f4146');
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const leg=new T.Group();leg.position.set(side*.085,.90,0);root.add(leg);
   mesh(leg,limbGeo,'#343d49',0,-.22,0);
   mesh(leg,limbGeo,'#343d49',0,-.61,0);
   box(leg,0,-.82,.055,.12,.105,.23,'#303235');legs.push(leg);
   const arm=new T.Group();arm.position.set(side*.22,1.39,0);root.add(arm);
   mesh(arm,limbGeo,coats[i%coats.length],0,-.20,0);
   mesh(arm,headGeo,skin[i%skin.length],0,-.43,0).scale.set(.5,.65,.5);arms.push(arm);
  }
  if(i%3===0){
   // Suitcase rolls behind the traveler without creating player-blocking physics.
   box(root,.36,.24,-.40,.28,.46,.22,'#344b5b');
   box(root,.36,.65,-.40,.045,.43,.045,'#8b999c');
   box(root,.36,.86,-.40,.17,.035,.05,'#8b999c');
  }
  root.scale.setScalar(.94+(i%4)*.035);
  actors.push({root,legs,arms});
 }
 // Decorative information displays deliberately omit times, gates and airline data.
 sign(terminal,'VIRTUAL DEPARTURES  /  PDX DEMO',0,3.4,-19,7);
 // Small architectural details stay inside existing counter and seat collision footprints.
 for(const side of [-1,1]){
  for(const z of [13,18]){
   box(terminal,side*8.7,1.20,z+.48,1.05,.09,.27,'#444d50');
   box(terminal,side*8.7,1.50,z+.51,.84,.47,.055,'#192b38');
   box(terminal,side*8.7,1.72,z+.48,.79,.035,.02,'#9ebcc3');
  }
  for(const z of [-17,-10,1]){
   for(const dx of [-1,1])box(terminal,side*9+dx,.66,z,.055,.24,.68,'#839097');
  }
 }
 // Generic fictional aircraft silhouettes, outside the walkable public scene.
 // Decorative positions are illustrative and do not represent actual stands or operations.
 const fuselageGeo=new T.SphereGeometry(1,16,10);
 const aircraft=[];
 for(const [x,z,angle] of [[-45,-10,Math.PI/2],[45,-32,-Math.PI/2]]){
  const plane=new T.Group();plane.position.set(x,0,z);plane.rotation.y=angle;scenery.add(plane);
  const body=mesh(plane,fuselageGeo,'#e9edf0',0,3.2,0);body.scale.set(1.55,1.65,10.6);
  const nose=mesh(plane,fuselageGeo,'#324b5b',0,3.55,8.7);nose.scale.set(1.05,.42,.72);
  for(const side of [-1,1]){
   const wing=box(plane,side*5.5,2.75,-.5,9.8,.22,2.5,'#c6d1d7');wing.rotation.y=side*.24;
   const engine=mesh(plane,fuselageGeo,'#aab8c0',side*3.8,2.15,.4);engine.scale.set(.65,.65,1.45);
   const tail=box(plane,side*1.9,3.5,-7.6,3.2,.16,1.2,'#c5cfd4');tail.rotation.y=side*.2;
   for(let j=0;j<9;j++)box(plane,side*1.39,3.65,-5.5+j*1.3,.05,.22,.37,'#405764');
  }
  const fin=box(plane,0,5.0,-7.8,.23,3.2,1.9,'#385d70');fin.rotation.x=-.24;
  for(const x of [-.8,.8])box(plane,x,1.1,-.9,.38,1.2,.38,'#3e4549');
  box(plane,0,1.05,5.5,.36,1.1,.36,'#3e4549');
  aircraft.push(plane);
 }
 let elapsed=0;
 function update(dt,active){
  people.visible=Boolean(active);scenery.visible=Boolean(active);
  if(!active)return;
  elapsed+=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0;
  actors.forEach(({root,legs,arms},i)=>{
   const p=travelerPose(i,elapsed);
   // Keep paths on verified clear floor, not across walls or furnishings.
   root.visible=dcaWalkable(p.x,p.z);
   root.position.set(p.x,Math.abs(p.stride)*.035,p.z);
   root.rotation.y=p.direction===1?0:Math.PI;
   legs[0].rotation.x=p.stride;legs[1].rotation.x=-p.stride;
   arms[0].rotation.x=-p.stride*.7;arms[1].rotation.x=i%3===0?-.23:p.stride*.7;
  });
 }
 update(0,true);
 return {update,people,scenery};
}
