// Original passenger jet cabin detailing. No airline branding or exact aircraft model.
export function detailPassengerCabin(T,cabin,plane,box){
  const windowMaterial=new T.MeshStandardMaterial({color:'#c3dfea',roughness:.16,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide});
  const windowGeometry=new T.PlaneGeometry(.74,.79);
  const trim=new T.MeshStandardMaterial({color:'#e5e7e1',roughness:.7});
  const ring=new T.RingGeometry(.35,.44,32);
  for(const side of [-1,1]){
    for(let z=-8.45;z<9;z+=2.1){
      const glass=new T.Mesh(windowGeometry,windowMaterial);glass.rotation.y=side*Math.PI/2;glass.position.set(side*1.80,1.26,z);cabin.add(glass);
      const frame=new T.Mesh(ring,trim);frame.material.side=T.DoubleSide;frame.rotation.y=side*Math.PI/2;frame.position.set(side*1.765,1.26,z);frame.scale.set(.97,1.18,1);cabin.add(frame);
    }
    for(let z=-8.8;z<9;z+=2.1){
      box(cabin,side*1.31,2.02,z,.12,.04,1.6,'#f2f0de');
      for(const x of [side*.53,side*1.05,side*1.65])box(cabin,x,.81,z,.055,.055,.45,'#a5a9a6');
    }
    // Cylindrical nacelle ends aligned along the longitudinal flight axis.
    const nacelle=new T.Mesh(new T.CylinderGeometry(.55,.48,1.85,24),new T.MeshStandardMaterial({color:'#b7c5cc',metalness:.22,roughness:.42}));
    nacelle.rotation.x=Math.PI/2;nacelle.position.set(side*4.3,-.61,-.9);plane.add(nacelle);
    const inlet=new T.Mesh(new T.CircleGeometry(.43,24),new T.MeshStandardMaterial({color:'#39484f',roughness:.8,side:T.DoubleSide}));
    inlet.position.set(side*4.3,-.61,-1.83);plane.add(inlet);
    const hub=new T.Mesh(new T.SphereGeometry(.13,12,8),new T.MeshStandardMaterial({color:'#79858a'}));hub.position.set(side*4.3,-.61,-1.85);plane.add(hub);
  }
  // Continuous ceiling light, aisle runner and seat-row markers in the same cabin.
  box(cabin,0,.012,0,.78,.02,19.7,'#3d4d59');
  box(cabin,0,2.24,0,.10,.05,20,'#faf2d7');
  for(let z=-9;z<10;z+=2.1){
    for(const side of [-1,1])box(cabin,side*.82,2.24,z,.16,.035,.42,'#f1ead9');
  }
}
