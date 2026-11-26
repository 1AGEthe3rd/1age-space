import * as THREE from '../../space/shared/three.module.js';

// Plaza-facing elevation reconstructed from founder footage. Scene distances are compressed.
export function buildOpenhaus({box, sign, scene, material}, {position, appearance}, blockers) {
  const {width, height, depth} = appearance;
  const {x, z} = position;
  const face = z + depth / 2;
  const charcoal = '#373a3a';
  const concrete = material('paving', '#b5b4ab', 5, 2);
  const add = (dx, y, dz, w, h, d, paint) => box(x+dx, y, face+dz, w, h, d, paint);
  const obstacle = (dx, dz, w, d) => blockers.push({x:x+dx-w/2, z:face+dz-d/2, w, d});
  add(0,height/2,-depth/2-.4,width,height,depth-.8,concrete);
  add(0,4.26,-.24,width,1.08,.55,concrete);
  add(0,height,-depth/2,width+.15,.13,depth+.16,charcoal);
  add(-6.4,2.02,-.77,6.5,3.86,.12,charcoal);
  add(-6.4,3.69,-.04,6.65,.37,.55,charcoal);
  add(-6.4,.15,-.38,6.5,.12,.85,'#928578');
  add(-7.45,1.46,-.67,2.05,2.78,.12,'#586d6a');
  add(-width/2+.22,1.95,-.24,.44,3.9,.6,charcoal);
  const glass = '#83a49e';
  add(3.15,1.9,-.04,12.35,3.6,.26,charcoal);
  for (let bay=0; bay<6; bay++) {
    const dx = -1.95 + bay*2.04;
    add(dx,1.62,.115,1.94,2.35,.06,glass);
    add(dx,2.37,.151,1.94,.84,.036,'#668181');
    add(dx,3.23,.115,1.94,.67,.06,'#617571');
  }
  add(3.15,2.82,.51,12.65,.13,1.04,charcoal);
  for (const dx of [-2.8,1.3,5.4,9.2]) {
    add(dx,3.13,.55,.045,.89,.045,charcoal).rotation.x=-.99;
  }
  add(9.51,2,-.02,.46,4,.44,charcoal);
  sign('openHAUS',scene,x+2.7,4.19,face+.056,6.2,{color:'#b64f77',background:null});
  sign('COWORKING',scene,x+3.15,1.72,face+.153,4.1,{color:'#f1ece3',background:null});

  const pavers = material('brick','#ac7662',11,3);
  add(0,.07,2.16,width,.12,4.3,pavers);
  // Low curved memorial wall. Keep the main approach along the building clear.
  for (let i=-3;i<=3;i++) {
    const a=i*.20, dx=-6.4+Math.sin(a)*3.4, dz=3.02+(1-Math.cos(a))*3.4;
    add(dx,.64,dz,.72,1,.25,concrete).rotation.y=-a;
    add(dx,1.16,dz,.73,.09,.31,'#719e96').rotation.y=-a;
    add(dx,.7,dz+.13,.72,.51,.045,'#62655f').rotation.y=-a;
    obstacle(dx,dz,.74,.44);
  }
  for (const side of [-1,1]) {
    const dx=-6.4+side*2.12;
    add(dx,.73,3.75,.54,1.32,.58,concrete);
    add(dx,1.41,3.75,.63,.12,.66,'#578f86');
    obstacle(dx,3.75,.63,.66);
  }
  sign('HARRY JACKSON PLAZA',scene,x-6.4,.73,face+3.30,2.55,{color:'#e0dace',background:null});
  for (const dx of [-7.2,-6.4,-5.6]) add(dx,.15,3.85,.20,.09,.16,'#dbd9bd');
  // Planting bed and the small shade tree visible immediately behind the memorial.
  add(-6.4,.15,2.12,4.55,.16,1.3,'#685f49');
  obstacle(-6.4,2.12,4.55,1.3);
  add(-7.75,2,2.08,.24,3.7,.26,'#776652');
  const crown = new THREE.IcosahedronGeometry(1,1);
  const foliage = new THREE.MeshStandardMaterial({color:'#667d48',roughness:.93});
  const leaves = new THREE.InstancedMesh(crown,foliage,5);
  const transform = new THREE.Object3D();
  for (let i=0;i<5;i++) {
    const angle=i*2.4;
    transform.position.set(x-7.75+Math.cos(angle)*.72,3.85+i*.19,face+2.08+Math.sin(angle)*.56);
    transform.scale.set(1.28,.95,1.16);
    transform.rotation.y=angle;
    transform.updateMatrix();
    leaves.setMatrixAt(i,transform.matrix);
  }
  scene.add(leaves);
  for (const dx of [-6.4,-5.05]) {
    for(let i=0;i<12;i++) {
      const angle=i*2.4;
      const leaf=add(dx+Math.sin(angle)*.17,.54,2.14+Math.cos(angle)*.17,.09,.64,.045,'#68794e');
      leaf.rotation.order='YXZ';
      leaf.rotation.set(.56+(i%3)*.19,angle,0);
    }
  }
  for (const dx of [1.9,6.6]) {
    add(dx,.85,2.53,2.25,.11,.77,'#977657');
    for (const side of [-1,1]) {
      add(dx,.52,2.53+side*.60,2.25,.10,.25,'#977657');
      add(dx+side*.72,.45,2.53,.15,.77,1.24,'#665743');
    }
    obstacle(dx,2.53,2.25,1.45);
  }
}
