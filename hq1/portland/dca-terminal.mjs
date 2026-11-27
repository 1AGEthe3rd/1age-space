// Original compressed public-passenger terminal inspired by Reagan National.
// Illustrative virtual architecture, not an as-built map, real gate or operating procedure.
// https://www.flyreagan.com/about-airport/history-reagan-national-airport
// https://www.flyreagan.com/building-dream-new-concourse-reagan-national
export const dcaSpawn=Object.freeze({x:0,y:1.65,z:33});
export const dcaGate=Object.freeze({x:0,z:-23,halfWidth:2.6,depth:2.8});
export const dcaBounds=Object.freeze({minX:-13.7,maxX:13.7,minZ:-26.7,maxZ:36});
const columns=Object.freeze([-22.5,-13.5,-4.5,4.5,13.5,22.5]);
export const dcaObstacles=Object.freeze([
 ...[-1,1].flatMap(side=>columns.map(z=>({x:side*11.8,z,w:.65,d:.65}))),
 ...[-1,1].flatMap(side=>[13,18].map(z=>({x:side*8.7,z,w:3.6,d:1.5}))),
 ...[-1,1].flatMap(side=>[-17,-10,1].map(z=>({x:side*9,z,w:3.2,d:1.35}))),
 ...[-1,1].map(side=>({x:side*6.9,z:30,w:.48,d:.48})),
]);
export function dcaWalkable(x,z){
 const b=dcaBounds;
 return Number.isFinite(x)&&Number.isFinite(z)&&x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ
  && !(Math.abs(z-27)<.55&&Math.abs(x)>2.65)
  && !dcaObstacles.some(o=>Math.abs(x-o.x)<o.w/2+.31&&Math.abs(z-o.z)<o.d/2+.31);
}
export function nearDcaGate(x,z){
 return dcaWalkable(x,z)&&Math.abs(x-dcaGate.x)<dcaGate.halfWidth&&Math.abs(z-dcaGate.z)<dcaGate.depth;
}
export function buildDcaTerminal(T,terminal,createBox,sign,destination){
 const batches=new Map(),beams=[];
 const gold='#c9a139',darkGold='#92702b',cream='#e8e2d1',metal='#64757b',stone='#363e43';
 function box(...args){
  const m=createBox(...args);if(!batches.has(m.material))batches.set(m.material,[]);
  batches.get(m.material).push(m);return m;
 }
 const glass=new T.MeshStandardMaterial({color:'#aacbd7',transparent:true,opacity:.24,roughness:.22,metalness:.12,depthWrite:false,side:T.DoubleSide});
 const roofMat=new T.MeshStandardMaterial({color:cream,roughness:.55,side:T.DoubleSide});
 const beamMat=new T.MeshStandardMaterial({color:gold,roughness:.43,metalness:.32});
 const panel=new T.BoxGeometry(1,1,1),rod=new T.CylinderGeometry(1,1,1,8);
 function glazing(x,y,z,w,h,d){
  const m=new T.Mesh(panel,glass);m.position.set(x,y,z);m.scale.set(w,h,d);terminal.add(m);
 }
 function beam(a,b,r=.09){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);
  const m=new T.Mesh(rod,beamMat);m.position.copy(start).addScaledVector(v,.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());
  m.scale.set(r,v.length(),r);m.updateMatrix();beams.push(m.matrix.clone());
 }
 // A polished dark public concourse with contrasting stone strips and original medallions.
 const floor=new T.Mesh(new T.BoxGeometry(28,.25,54),new T.MeshStandardMaterial({color:stone,roughness:.21,metalness:.12}));
 floor.position.y=-.125;terminal.add(floor);
 box(terminal,0,-.11,31.8,28,.22,9.6,'#c5c3b8');
 for(const x of [-6,6])box(terminal,x,.008,0,.10,.016,53.8,'#c9b98f');
 for(let z=-24;z<=24;z+=3)box(terminal,0,.009,z,27.8,.014,.035,'#8d9290');
 const medGeo=new T.CircleGeometry(2.2,40);
 const medMat=new T.MeshStandardMaterial({color:'#cfb47b',roughness:.4});
 for(const z of [-15,0,15]){
  const med=new T.Mesh(medGeo,medMat);med.rotation.x=-Math.PI/2;med.position.set(0,.022,z);terminal.add(med);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;const m=box(terminal,Math.cos(a)*1.03,.031,z+Math.sin(a)*1.03,1.5,.014,.14,'#53656a');m.rotation.y=-a;
  }
 }
 // Six stylized domed roof bays. The center patch is glazed for a skylight.
 for(let bay=0;bay<6;bay++){
  const z0=-27+bay*9,zc=z0+4.5;
  const height=(u,v)=>7.3+3.45*(1-u*u)*(1-v*v);
  const arrays=[[],[]];
  const pt=(u,v)=>[u*14,height(u,v),zc+v*4.5];
  for(let i=0;i<12;i++)for(let j=0;j<8;j++){
   const u=-1+i/6,v=-1+j/4,U=u+1/6,V=v+1/4;
   const sky=i>=5&&i<=6&&j>=3&&j<=4;
   arrays[sky?1:0].push(...pt(u,v),...pt(U,V),...pt(U,v),...pt(u,v),...pt(u,V),...pt(U,V));
  }
  for(const [i,a] of arrays.entries()){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.computeVertexNormals();
   terminal.add(new T.Mesh(g,i?glass:roofMat));
  }
  // Curved ochre arch segments and branching braces recall the public hall silhouette.
  for(let i=0;i<12;i++){
   const u=-1+i/6,U=u+1/6;
   beam([u*14,height(u,0)-.13,zc],[U*14,height(U,0)-.13,zc],.12);
  }
  for(const side of [-1,1]){
   beam([side*11.8,5.5,zc],[side*7,9.35,zc],.12);
   beam([side*11.8,5.5,zc],[side*12.7,7.25,zc+3.4],.09);
  }
 }
 for(const side of [-1,1]){
  glazing(side*14,3.65,0,.10,7.3,54);
  for(let z=-27;z<=27;z+=3)box(terminal,side*14,3.65,z,.16,7.3,.14,metal);
  for(const y of [.25,2.2,4.4,6.8,7.3])box(terminal,side*14,y,0,.17,.12,54,metal);
  for(const z of columns){
   box(terminal,side*11.8,3.55,z,.65,7.1,.65,gold);
   box(terminal,side*11.8,.12,z,.80,.24,.80,darkGold);
  }
  for(const z of [13,18]){
   box(terminal,side*8.7,.52,z,3.6,1.04,1.5,cream);
   box(terminal,side*8.7,1.08,z,3.65,.11,1.55,metal);
   box(terminal,side*8.7,1.42,z,.85,.48,.10,'#293c46');
  }
  for(const z of [-17,-10,1]){
   box(terminal,side*9,.48,z,3.2,.18,.7,'#354e5c');
   box(terminal,side*9,.89,z+.42,3.2,.70,.12,'#354e5c');
   for(const dx of [-1.2,0,1.2])box(terminal,side*9+dx,.24,z,.10,.45,.57,metal);
  }
  glazing(side*8.6,3.65,27,10.8,7.3,.11);
  for(const x of [3.2,6.8,10.4,13.9])box(terminal,side*x,3.65,27,.16,7.3,.18,metal);
  box(terminal,side*6.9,2.75,30,.48,5.5,.48,gold);
 }
 // The entry is visibly open, and its collision boundary uses the same opening.
 glazing(0,5.8,27,6.4,2.9,.11);
 box(terminal,0,4.35,27,6.5,.22,.28,gold);
 glazing(0,5.5,31,14,.12,8);
 for(const z of [27,30,34.8])box(terminal,0,5.43,z,14.3,.24,.22,gold);
 for(const x of [-6.9,0,6.9])box(terminal,x,5.43,31,.22,.24,8.4,gold);
 // Back wall is scenic, not a real-world boarding location.
 glazing(0,3.65,-27,28,7.3,.12);
 for(let x=-12;x<=12;x+=3)box(terminal,x,3.65,-27,.15,7.3,.15,metal);
 box(terminal,0,1.45,-26.85,5.4,2.9,.12,'#425a64');
 sign(terminal,'RONALD REAGAN WASHINGTON NATIONAL',0,4.75,27.18,12);
 sign(terminal,'DCA · Virtual National Hall',0,5.1,21,10);
 sign(terminal,'Ticketing · Information',0,4.4,9,8);
 sign(terminal,'World Flight · '+destination,0,4,-23,8);
 // Raise terminal surfaces slightly above the existing shared ground to prevent z-fighting.
 terminal.position.y=.045;
 const archBatch=new T.InstancedMesh(rod,beamMat,beams.length);
 beams.forEach((matrix,i)=>archBatch.setMatrixAt(i,matrix));
 archBatch.instanceMatrix.needsUpdate=true;terminal.add(archBatch);
 // Static opaque boxes are batched; no texture downloads or real-world floor plans.
 for(const [material,meshes] of batches){
  const batch=new T.InstancedMesh(meshes[0].geometry,material,meshes.length);
  for(let i=0;i<meshes.length;i++){meshes[i].updateMatrix();batch.setMatrixAt(i,meshes[i].matrix);terminal.remove(meshes[i]);}
  batch.instanceMatrix.needsUpdate=true;terminal.add(batch);
 }
}
