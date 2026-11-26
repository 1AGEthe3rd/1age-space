import {javanLot} from './javan-lot.mjs';
import {albertaBlocks} from './alberta-blocks.mjs';
import * as T from '../../space/shared/three.module.js';

export const stops = {
  ...Object.fromEntries(albertaBlocks.map(({id,z})=>[id,{x:9.1,z:z+4.6,heading:-.85}])),
  openhaus:{x:10,z:7.2,heading:-1.1},
  church:{x:8.6,z:-80.4,heading:-.89},
  jessup:{x:-8.4,z:-106.7,heading:.82},
  killingsworth:{x:-9.7,z:-51,heading:-.46},
  javan:{x:7.1,z:84,heading:Math.PI/2},
  'javan-lot':{x:-16,z:104,heading:Math.PI/2},
  retro:{x:9.1,z:-228,heading:-Math.PI/2}
};
export function buildShowrooms({box,sign,scene,material},blockers) {
  const road=material('asphalt','#494b48',4,32), walk=material('paving','#c6bfb0',3,32);
  for(const [begin,end] of [[26,120],[-260,-180]]) {
    const z=(begin+end)/2, length=end-begin;
    box(0,-.36,z,78,.56,length,'#716d5a');
    box(0,.018,z,12,.035,length,road);
    for(const side of [-1,1]) {
      const runs=side<0&&begin===26?[[begin,javanLot.gateMinZ],[javanLot.gateMaxZ,end]]:[[begin,end]];
      for(const [a,b] of runs){box(side*8.9,.04,(a+b)/2,5.8,.08,b-a,walk);box(side*6,.08,(a+b)/2,.16,.13,b-a,'#b0a89b');}
      for(let at=begin+3;at<end-2;at+=6)box(side*.11,.041,at,.075,.009,4.6,'#cfa651');
    }
  }
  function wall(x,y,z,w,h,d,paint) {
    box(x,y,z,w,h,d,paint); blockers.push({x:x-w/2,z:z-d/2,w,d});
  }
  function shop(label,x,z,paint,trim) {
    const facing=x<0?1:-1, front=x+facing*5;
    box(x,.05,z,10,.1,18,'#787775');
    wall(x-facing*5,2.5,z,.26,5,18,paint);
    for(const end of [-9,9])wall(x,2.5,z+end,10,5,.24,paint);
    box(x,5.06,z,10.4,.3,18.4,trim);
    box(front,3.87,z,.32,2.3,18,paint);
    for(const side of [-1,1]) {
      const paneZ=z+side*5.15;
      wall(front,.45,paneZ,.23,.9,7.55,paint);
      box(front,1.8,paneZ,.09,1.8,7.55,new T.MeshStandardMaterial({color:'#a2c6d0',transparent:true,opacity:.32}));
      for(const post of [-3.8,0,3.8]) box(front,1.8,paneZ+post,.21,1.95,.12,trim);
    }
    box(front+facing*.62,2.93,z,1.35,.16,17.8,trim);
    const address=sign(x<0?'4545':'6720',scene,front+facing*.22,3.24,z,1.6,{background:'#283b38'});
    address.rotation.y=facing*Math.PI/2;
    const blade=sign(label,scene,front+facing*.21,4.12,z,8.4,{background:trim});
    blade.rotation.y=facing*Math.PI/2;
    for(const offset of [-5,5])box(x,4.78,z+offset,4,.06,.18,'#fff2cf',{glow:true});
  }
  shop('JAVAN IMPORTS',-17,84,'#bbbaac','#304f50');
  shop('RETRO GAME BAR',17,-228,'#604f63','#34213f');
  const {minX,maxX,minZ,maxZ,gateMinZ,gateMaxZ}=javanLot;
  box((minX+maxX)/2,.027,(minZ+maxZ)/2,maxX-minX,.05,maxZ-minZ,road);
  box((maxX-5.9)/2,.027,(gateMinZ+gateMaxZ)/2,-5.9-maxX,.05,gateMaxZ-gateMinZ,road);
  function fence(x1,z1,x2,z2){
    const length=Math.hypot(x2-x1,z2-z1),vertical=x1===x2;
    const x=(x1+x2)/2,z=(z1+z2)/2;
    blockers.push({x:x-(vertical?.07:length/2),z:z-(vertical?length/2:.07),w:vertical?.14:length,d:vertical?length:.14});
    const n=Math.ceil(length/1.9);
    for(let i=0;i<=n;i++)box(x1+(x2-x1)*i/n,.9,z1+(z2-z1)*i/n,.08,1.8,.08,'#596563');
    for(const y of [.17,1.66])box(x,y,z,vertical?.045:length,.045,vertical?length:.045,'#89918c');
    for(let i=0;i<Math.ceil(length/.28);i++){
      const t=(i+.5)/Math.ceil(length/.28);
      box(x1+(x2-x1)*t,.9,z1+(z2-z1)*t,.018,1.48,.018,'#7a8580');
    }
    for(const y of [.49,.92,1.34])box(x,y,z,vertical?.02:length,.018,vertical?length:.02,'#7a8580');
  }
  fence(minX,minZ,minX,maxZ);fence(minX,maxZ,maxX,maxZ);
  fence(minX,minZ,maxX,minZ);
  fence(maxX,minZ,maxX,gateMinZ);fence(maxX,gateMaxZ,maxX,maxZ);
  for(const zz of [gateMinZ,gateMaxZ])box(maxX,.97,zz,.13,1.94,.13,'#414d49');
  for(const zz of [96,99,110,113])box(-21.7,.059,zz,3.8,.012,.065,'#c9c9b8');
  // This is an original virtual test-drive lot, not a surveyed dealership floor plan.
  for(const z of [51,68,99,111,-193,-208,-249]){
    for(const side of [-1,1]){
      const x=side*7.15;
      box(x,2.55,z,.13,5.1,.13,'#505655');
      box(x-side*.63,5.06,z,1.32,.1,.12,'#505655');
      box(x-side*1.2,4.98,z,.44,.12,.24,'#e4d9a8');
    }
  }
  for(const offset of [-5,5]){
    wall(-19,.5,84+offset,2,1,2.8,'#444c48');
    box(-19,1.06,84+offset,2.15,.12,2.95,'#ae987b');
  }
  for(const z of [-233,-228,-223]){
    wall(20,.48,z,1.35,.96,1.2,'#30223e');
    box(20,1.28,z,1.22,.83,1.18,'#4b3956');
    box(19.36,1.43,z,.03,.52,.87,'#67d1b1',{glow:true});
    box(19.3,1.00,z,.4,.12,1.22,'#725280');
    box(19.18,1.12,z+.27,.08,.16,.08,'#d39158');
  }
  // Programmable signal heads at the existing Alberta junction.
  const postX=-9.7;
  box(postX,1.55,6.3,.12,3.1,.12,'#555f58');
  for (const [label,y] of [['↑ RETRO GAME BAR',2.96],['↓ JAVAN IMPORTS',2.57]]) {
    sign(label,scene,postX,y,6.42,2.9,{background:'#314b42'});
  }
  const heads=[];
  for(const side of [-1,1]){
    const x=side*6.5,z=13-side*6;
    box(x,2.1,z,.13,4.2,.13,'#59635c');
    box(x,4.12,z,5,.13,.13,'#59635c');
    const sx=x-side*2.35;
    box(sx,3.65,z,.54,1.25,.42,'#373b36');
    const bulbs=['#ff4437','#ffbd39','#59ec80'].map((color,i)=>{
      const mat=new T.MeshBasicMaterial({color});
      box(sx,4.03-i*.37,z+side*.24,.27,.25,.06,mat);
      return mat;
    });
    heads.push(bulbs);
  }
  return seconds=>{
    const phase=seconds%24, active=phase<12?2:phase<15?1:0;
    for(const bulbs of heads) bulbs.forEach((m,i)=>m.color.set(i===active?['#ff4437','#ffbd39','#59ec80'][i]:'#332f2b'));
  };
}
