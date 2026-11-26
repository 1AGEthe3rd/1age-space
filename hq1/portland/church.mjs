import {crossings} from './crossings.mjs';

// Original neighborhood shells; these carry no physical address or tenancy claim.
export const churchFrontages=[
  {position:{x:24,z:-76.3},orientation:Math.PI,appearance:{width:11.8,depth:6.2,height:5.4,color:'#b9987e',accent:'#484f46',style:'workshop'}},
  {position:{x:24,z:-98.2},orientation:0,appearance:{width:13.4,depth:7.2,height:7.6,color:'#ae7966',accent:'#455254',style:'brick'}}
];

export function buildChurch({box,sign,scene,material}) {
  const {z,halfWidth}=crossings.church;
  box(21,.020,z,30,.04,2*halfWidth,material('asphalt','#504d47',12,4));
  for(const side of [-1,1]){
    const edge=z+side*halfWidth;
    box(24,.04,edge+side*1.12,24,.08,2.24,material('paving','#c7beb1',8,2));
    box(24,.079,edge+side*.10,24,.14,.18,'#aaa393');
    box(10.9,.089,edge+side*.48,1.15,.018,.72,'#be9968');
  }
  for(let offset=-2.9;offset<=3;offset+=1.16)
    box(8.4,.053,z+offset,1.5,.012,.52,'#e0dacb');
  box(10.8,.052,z-1.9,.18,.01,3.3,'#ded9c9');
  box(10.2,1.75,z-5.15,.12,3.5,.12,'#5d675f');
  sign('NE CHURCH ST',scene,10.2,3.49,z-5.15,2.65,{background:'#285740'});
  const reverse=sign('NE CHURCH ST',scene,10.2,3.49,z-5.18,2.65,{background:'#285740'});
  reverse.rotation.y=Math.PI;
  const mlk=sign('NE MLK JR BLVD',scene,10.2,3.12,z-5.15,2.5,{background:'#285740'});
  mlk.rotation.y=Math.PI/2;
}
