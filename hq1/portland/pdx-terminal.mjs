// Original compressed, walkable interpretation of the public PDX main-terminal architecture.
// Not an as-built floor plan or real gate assignment; all dimensions are illustrative.
// Reference: https://www.zgf.com/work/5683-port-of-portland-pdx-airport-main-terminal-expansion
export const pdxTerminalBounds=Object.freeze({minX:-13,maxX:13,minZ:-25,maxZ:25});
export const pdxSpawn=Object.freeze({x:0,y:1.65,z:21});
export const pdxGate=Object.freeze({x:0,z:-22,halfWidth:2.7,depth:3.5});
export const pdxPlanters=Object.freeze([
  {x:-5.7,z:9},{x:5.7,z:9},{x:-5.7,z:-3},{x:5.7,z:-3}
]);
export function pdxWalkable(x,z){
  const b=pdxTerminalBounds;
  return x>b.minX+.3&&x<b.maxX-.3&&z>b.minZ+.3&&z<b.maxZ-.3
    &&!pdxPlanters.some(p=>Math.abs(x-p.x)<1.55&&Math.abs(z-p.z)<1.55)
    &&!(Math.abs(x)>9.1&&z>10&&z<17)
    &&!(Math.abs(x)>8.7&&z< -9&&z> -18);
}
export function nearPdxGate(x,z){
  return pdxWalkable(x,z)&&Math.abs(x-pdxGate.x)<pdxGate.halfWidth
    &&Math.abs(z-pdxGate.z)<pdxGate.depth;
}
export function buildPdxTerminal(T,terminal,box,sign,destination){
  const wood='#b99362',woodDark='#8c6948',woodLight='#d0b58d';
  const concrete='#e0ded2',metal='#50605e';
  box(terminal,0,-.14,0,27,.28,51,concrete);
  // Large undulating canopy. Each strip is continuous in the walking direction.
  for(let i=0;i<24;i++){
    const x=-12.65+i*1.1;
    const y=7.2+1.15*Math.cos(x*.23);
    for(const z of [-17,0,17]){
      // Interrupt the deck at three bands of stylized skylights.
      box(terminal,x,y,z,1.09,.25,13.6,woodLight);
    }
    box(terminal,x,y-.24,0,.14,.29,51,wood);
  }
  for(let z=-24;z<=24;z+=4){
    for(let i=0;i<12;i++){
      const x=-12.1+i*2.2,y=7.2+1.15*Math.cos(x*.23);
      const beam=box(terminal,x,y-.40,z,2.23,.22,.19,woodDark);
      beam.rotation.z=Math.atan(-.2645*Math.sin(x*.23));
    }
  }
  const glass=new T.MeshStandardMaterial({color:'#a8c9d0',transparent:true,opacity:.14,roughness:.3,depthWrite:false,side:T.DoubleSide});
  const panel=new T.BoxGeometry(1,1,1);
  function glazing(x,y,z,w,h,d){
    const mesh=new T.Mesh(panel,glass);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);terminal.add(mesh);
  }
  for(const side of [-1,1]){
    glazing(side*13.35,3.65,0,.1,7.3,50);
    for(let z=-24;z<=24;z+=4){
      box(terminal,side*13.35,3.65,z,.14,7.3,.16,metal);
      box(terminal,side*10.5,3.5,z,.35,7,.35,woodDark);
    }
    for(const y of [1.5,4.1,6.9])box(terminal,side*13.35,y,0,.13,.12,50,metal);
    box(terminal,side*11.6,3.15,-1,3.4,.24,17,wood);
    box(terminal,side*9.9,3.83,-1,.10,1.1,17,metal);
    for(let z=-8;z<=7;z+=2.5)box(terminal,side*9.8,3.75,z,.12,1.2,.12,metal);
    // Original counters and seating; not a copy of individual airport retailers.
    for(let z=11;z<=16;z+=2.5){
      box(terminal,side*10.7,.53,z,2.4,1.06,1.8,'#d7d1bf');
      box(terminal,side*10.7,1.1,z,2.5,.12,1.9,woodDark);
      box(terminal,side*10.9,1.43,z,.5,.52,.08,'#273b40');
    }
    for(let z=-17;z<=-10;z+=2.3){
      box(terminal,side*10.4,.48,z,2.6,.18,.62,'#47676c');
      box(terminal,side*10.4,.89,z+.28,2.6,.68,.12,'#47676c');
    }
  }
  for(const z of [-25.3,25.3]){
    glazing(0,3.65,z,26.7,7.3,.1);
    for(let x=-12;x<=12;x+=3)box(terminal,x,3.65,z,.14,7.3,.16,metal);
  }
  // A stylized Northwest interior grove, with collision bounds matching the planters.
  const trunkGeo=new T.CylinderGeometry(.12,.20,3.7,8);
  const trunkMat=new T.MeshStandardMaterial({color:'#795b44',roughness:1});
  const leafGeo=new T.IcosahedronGeometry(1,1);
  const leafMats=['#3f6548','#577a50','#72955c'].map(color=>new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  for(const [index,p] of pdxPlanters.entries()){
    box(terminal,p.x,.22,p.z,2.8,.44,2.8,woodDark);
    box(terminal,p.x,.47,p.z,2.6,.08,2.6,'#566348');
    const trunk=new T.Mesh(trunkGeo,trunkMat);trunk.position.set(p.x,2.24,p.z);terminal.add(trunk);
    for(let i=0;i<7;i++){
      const mesh=new T.Mesh(leafGeo,leafMats[(i+index)%3]);
      mesh.position.set(p.x+Math.cos(i*2.4)*.74,4.08+(i%3)*.44,p.z+Math.sin(i*2.4)*.74);
      mesh.scale.set(.98,.9,.98);terminal.add(mesh);
    }
  }
  // Original teal patterned carpet homage, not the actual airport carpet artwork.
  box(terminal,0,.016,-6,5.8,.026,31,'#326f72');
  for(let z=-20;z<=9;z+=1.8){
    for(const x of [-1.7,0,1.7]){
      const tile=box(terminal,x,.032,z,.52,.008,.15,'#82aca0');tile.rotation.y=(z<0?1:-1)*.55;
      const dot=box(terminal,x+.38,.033,z+.24,.13,.009,.13,'#d1aa84');dot.rotation.y=.78;
    }
  }
  sign(terminal,'PORTLAND INTERNATIONAL AIRPORT',0,5.3,18,11.5);
  sign(terminal,'PDX · Ticket Hall',0,4.4,12,8);
  sign(terminal,'Departures · Virtual Concourse',0,4.4,-7,9);
  sign(terminal,'World Flight · '+destination,0,3.65,-22,8);
  box(terminal,0,1.5,-24.9,5.2,3,.18,'#425b60');
  for(const x of [-2.7,2.7])box(terminal,x,1.7,-24.6,.28,3.4,.28,wood);
  // Single scene: low-cost decorative forms only, no imported textures.
}
