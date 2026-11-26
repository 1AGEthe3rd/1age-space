import * as THREE from '../../space/shared/three.module.js';
import {crossings,signalPhases} from './crossings.mjs';

export function buildKillingsworth({box,sign,scene,material}) {
  const {z,halfWidth}=crossings.killingsworth;
  const pavement=material('paving','#c6bfb0',3,12);
  const asphalt=material('asphalt','#494b48',16,4);
  const heads=[];
  for (const side of [-1,1]) {
    box(side*21,.018,z,30,.035,2*halfWidth,asphalt);
    for(const direction of [-1,1]){
      box(side*24,.04,z+direction*6.2,24,.08,2.4,pavement);
      box(side*24,.086,z+direction*5.05,24,.10,.12,'#afa797');
    }
    for(let offset=13;offset<35;offset+=6)
      box(side*offset,.045,z,3.6,.015,.10,'#c7a255');
    for(let across=-4.5;across<=4.5;across+=1.15){
      box(across,.05,z+side*6.45,.56,.012,1.76,'#e8e3d3');
      box(side*7.5,.05,z+across,1.76,.012,.56,'#e8e3d3');
    }
    box(side*3,.05,z+side*8.4,5.25,.012,.23,'#e8e3d3');
    const x=side*8.6, postZ=z-side*6.25;
    box(x,2.45,postZ,.17,4.9,.17,'#58625d');
    const street=sign('NE KILLINGSWORTH ST',scene,x,3.65,postZ,3.05,{background:'#275840'});
    street.rotation.y=side===1?0:Math.PI;
    const mlk=sign('NE MLK JR BLVD',scene,x,3.24,postZ,2.55,{background:'#275840'});
    mlk.rotation.y=side*Math.PI/2;
    box(x-side*2.5,4.87,postZ,5.15,.13,.13,'#58625d');
    for(const axis of [0,1]){
      const hx=axis?x:x-side*5, hz=postZ;
      box(hx,4.28,hz,.52,1.26,.52,'#343932');
      const bulbs=['red','amber','green'].map((phase,i)=>{
        const paint=new THREE.MeshBasicMaterial();
        box(hx+(axis?-side*.28:0),4.65-i*.36,hz+(axis?0:side*.28),axis?.05:.25,.25,axis?.25:.05,paint);
        return {phase,paint};
      });
      heads.push({axis,bulbs});
    }
  }
  const colors={red:'#ff4437',amber:'#ffc047',green:'#5fe78b'};
  let previous='';
  function update(seconds){
    const phases=signalPhases(seconds),key=phases.join('/');
    if(previous===key)return;
    previous=key;
    for(const {axis,bulbs} of heads)for(const {phase,paint} of bulbs)
      paint.color.set(phases[axis]===phase?colors[phase]:'#333730');
  }
  update(0);
  return update;
}
