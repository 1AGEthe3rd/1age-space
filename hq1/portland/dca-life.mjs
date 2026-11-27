// DCA public terminal ambience: scenery only. Human occupants must be real participants.
// No clock, timetable or identity provider is implemented here.
// Shared 1AGE identity and presence service will supply verified session occupancy.
export function createDcaLife(T,terminal,ground,box,sign){
 const people=new T.Group(),scenery=new T.Group();
 terminal.add(people);ground.add(scenery);
 // Human occupancy stays empty until an authenticated shared presence service is integrated.
 // Do not use account directory results, fabricated profiles or decorative NPCs as presence.
 const mats=new Map();
 function material(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.83}));return mats.get(color);}
 function mesh(parent,geo,color,x,y,z){const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);parent.add(m);return m;}
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
 }
 function update(_dt,active){
  people.visible=Boolean(active);
  scenery.visible=Boolean(active);
 }
 update(0,true);
 return {update,people,scenery};
}
