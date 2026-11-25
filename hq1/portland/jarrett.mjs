// Scene coordinates extend the original compressed Sol Road layout.
export const jarrettBlock = [
  { x:-18, z:-129, width:17, depth:11, height:6.4, color:'#a37356', accent:'#47574d', style:'workshop' },
  { x:18, z:-131, width:21, depth:12, height:8.4, color:'#ae8974', accent:'#3e4b4d', style:'brick' },
  { x:-17, z:-150, width:14, depth:10, height:5.4, color:'#c5b490', accent:'#40514e', style:'stucco' },
  { x:18, z:-151, width:13, depth:12, height:5.5, color:'#97836d', accent:'#4b5351', style:'workshop' },
].map(({x,z,...appearance}) => ({
  position:{x,z}, orientation:x<0 ? Math.PI/2 : -Math.PI/2, appearance,
}));

export function buildJarrettBlock({box, sign, scene, material}) {
  const road = material('asphalt','#494b48',4,32);
  const sidewalk = material('paving','#c6bfb0',3,32);
  box(0,-.36,-148,78,.56,64,'#716d5a');
  box(0,.018,-148,12,.035,64,road);
  box(0,.020,-165,72,.04,8,road);
  for (const side of [-1,1]) {
    for (const [z,length] of [[-138.5,45],[-174.5,11]]) {
      box(side*8.9,.04,z,5.8,.08,length,sidewalk);
      box(side*6,.08,z,.19,.13,length,'#b0a89b');
    }
    for (const z of [-159.8,-170.2]) {
      box(side*22,.04,z,20,.08,2.4,sidewalk);
    }
    for (let z=-119; z>-159; z-=6) {
      box(side*.11,.041,z,.074,.009,4.6,'#cfa651');
    }
    for (const z of [-123,-147]) {
      const x=side*7.3;
      box(x,2.7,z,.13,5.4,.13,'#505655');
      box(x-side*.56,5.38,z,1.24,.10,.10,'#505655');
      box(x-side*1.12,5.31,z,.49,.13,.24,'#f6e5bd');
    }
    for (let x=-5; x<=5; x+=1.25) {
      box(x,.054,-165+side*5,.62,.012,1.8,'#ded9ce');
    }
    const x=side*7.4, z=-165+side*5.4;
    box(x,1.8,z,.10,3.6,.10,'#656d68');
    const blade=sign('NE JARRETT ST',scene,x,3.45,z,2.3,{background:'#326249'});
    blade.rotation.y=side===1 ? 0 : Math.PI;
    const mlk=sign('NE MLK JR BLVD',scene,x,3.16,z,2.5,{background:'#326249'});
    mlk.rotation.y=side*Math.PI/2;
  }
}
