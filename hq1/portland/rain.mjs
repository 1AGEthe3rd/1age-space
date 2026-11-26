// Original 3D adaptation of NNB's staggered rain streaks and road splashes.
// All effects are bounded, noninteractive and independent of the gameplay scene geometry.
export function createPortlandRain(T,scene,roadMaterials=new Set()){
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const mobile=globalThis.matchMedia?.('(pointer: coarse)').matches;
  const count=reduced?0:mobile?280:480;
  const positions=new Float32Array(count*6), colors=new Float32Array(count*6);
  const particles=Array.from({length:count},()=>({
    x:Math.random()*26-13,y:Math.random()*14,z:Math.random()*26-13,
    speed:7+Math.random()*5,length:.14+Math.random()*.36
  }));
  for(let i=0;i<count;i++){
    const c=.65+Math.random()*.3;
    colors.set([.10*c,.14*c,.18*c,.72*c,.82*c,.90*c],i*6);
  }
  const geometry=new T.BufferGeometry();
  const attribute=new T.BufferAttribute(positions,3);
  attribute.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute('position',attribute);
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  const paint=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.62,depthWrite:false});
  const streaks=new T.LineSegments(geometry,paint);
  streaks.frustumCulled=false;streaks.visible=false;scene.add(streaks);
  const ringGeometry=new T.RingGeometry(.75,1,12);
  const splashCount=reduced?0:mobile?12:24;
  const splashes=Array.from({length:splashCount},()=>{
    const material=new T.MeshBasicMaterial({color:'#c4d7df',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
    const mesh=new T.Mesh(ringGeometry,material);
    mesh.rotation.x=-Math.PI/2;mesh.visible=false;scene.add(mesh);
    return {mesh,age:1};
  });
  const surfaces=new Map([...roadMaterials].map(m=>[m,{color:m.color.clone(),roughness:m.roughness}]));
  let wet=false,spawnDelay=0;
  function setWet(value){
    if(wet===value)return;
    wet=value;
    for(const [material,dry] of surfaces){
      material.color.copy(dry.color);
      if(wet)material.color.multiplyScalar(.73);
      material.roughness=wet?.38:dry.roughness;
    }
  }
  function frame(dt,camera,active){
    dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
    streaks.visible=active&&count>0;
    if(!active){
      for(const s of splashes){s.mesh.visible=false;s.age=1;}
      return;
    }
    const {x:cx,z:cz}=camera.position;
    streaks.position.set(cx,0,cz);
    for(let i=0;i<count;i++){
      const p=particles[i];
      p.x-=dt*1.4;p.y-=dt*p.speed;
      if(p.y<0||p.x< -13){
        p.y=14;p.x=Math.random()*26-13;p.z=Math.random()*26-13;
      }
      positions.set([p.x+.13*p.length,p.y+p.length,p.z,p.x,p.y,p.z],i*6);
    }
    attribute.needsUpdate=true;
    // Splash rings are restricted to the known central MLK roadway.
    // No raycast or claim of surveyed puddle placement; no splashes on buildings.
    spawnDelay-=dt;
    if(spawnDelay<=0&&splashes.length&&Math.abs(cx)<15&&cz>-110&&cz<25){
      const s=splashes.find(p=>p.age>=.42);
      if(s){
        s.age=0;s.mesh.position.set(Math.random()*10.8-5.4,.105,Math.max(-109,Math.min(24,cz+Math.random()*18-9)));
        s.mesh.visible=true;s.mesh.scale.setScalar(.035);
      }
      spawnDelay=mobile?.085:.045;
    }
    for(const s of splashes){
      if(s.age>=.42){s.mesh.visible=false;continue;}
      s.age+=dt;
      s.mesh.scale.setScalar(.035+s.age*.55);
      s.mesh.material.opacity=Math.max(0,.38*(1-s.age/.42));
    }
  }
  function dispose(){
    setWet(false);scene.remove(streaks);geometry.dispose();paint.dispose();
    for(const s of splashes){scene.remove(s.mesh);s.mesh.material.dispose();}
    ringGeometry.dispose();
  }
  return {frame,setWet,dispose};
}
