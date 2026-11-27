import {nextWiperMode} from './windshield-model.mjs';
const clamp=(v,min=-1,max=1)=>Math.max(min,Math.min(max,v));
export function drivingInput(keys,controls,pedals,pad,wet=false){
  return {steer:clamp(controls.move.x+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))),
    gas:Math.max(pedals.gas,Number(keys.has('KeyW')||keys.has('ArrowUp')),pad?.buttons[7]?.value||0),
    brake:Math.max(pedals.brake,Number(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('Space')),pad?.buttons[6]?.value||0),wet};
}
export function driveToggle(car,code){
  if(code==='KeyT')car.wiperMode=nextWiperMode(car.wiperMode);
  if(code==='KeyR'&&Math.abs(car.speed)<.15)car.reverse=!car.reverse;
  if(code==='KeyH')car.lights=!car.lights;
  if(code==='KeyQ'||code==='KeyC'){const side=code==='KeyQ'?-1:1;car.signal=car.signal===side?0:side;}
}
export function driveCamera(camera,car,view,look,controls,dt){
  look.yaw=clamp(look.yaw-controls.look.x*dt*1.65,view===0?-Math.PI:-1.25,view===0?Math.PI:1.25);
  look.pitch=clamp(look.pitch-controls.look.y*dt*1.1,-.45,.45);
  const h=car.heading+look.yaw;
  if(view===0){
    camera.position.set(car.x+Math.sin(h)*6.3,3.5+look.pitch*3,car.z+Math.cos(h)*6.3);
    camera.lookAt(car.x,1.05,car.z);
  }else{
    const x=view===2?.48*(car.driverSide??1):0,z=view===2?-.88:-2.16,y=view===2?1.65:1.52;
    const c=Math.cos(car.heading),s=Math.sin(car.heading);
    camera.position.set(car.x+x*c+z*s,y,car.z-x*s+z*c);
    camera.lookAt(camera.position.x-Math.sin(h)*10,y+Math.tan(look.pitch)*10,camera.position.z-Math.cos(h)*10);
  }
}
export function controllerDriveCodes(edges){
  return [[3,'KeyR'],[2,'KeyH'],[4,'KeyQ'],[5,'KeyC'],[8,'KeyT']].filter(([i])=>edges.includes(i)).map(([,code])=>code).concat(edges.includes(10)||edges.includes(11)?['KeyV']:[]);
}
