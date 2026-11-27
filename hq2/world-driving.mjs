import {createWorldVehicle} from '../world/gameplay/vehicle.mjs';
import {createDrivePad} from '../world/gameplay/drive-pad.mjs';
import {createDriveAudio} from '../world/gameplay/drive-audio.mjs';
import {drivingInput,driveToggle,driveCamera,controllerDriveCodes} from '../world/gameplay/driving-session.mjs';
import {vehicleFootprint,occupiedVehicle,roadContains} from '../world/gameplay/road-geometry.mjs';

// Actual mapped secondary-road segment near the HQ2 gateway. Demo placement only.
// No claim that a real car, parking space, or rental business exists here.
export const gatewayDemo={id:'hq2-world-demo-001',style:'original',reference:'World demo van',rightHandDrive:false,
  x:8.4,z:-18.0,heading:-Math.atan2(7.19,17.95),color:'#536b7a'};
export function fitsCityRoad(x,z,h,segments,clear){
  return vehicleFootprint(x,z,h,(px,pz)=>clear(px,pz)&&roadContains(segments,px,pz));
}
export function createDCDriver({scene,camera,clear,fitsRoad,onExit}){
  const p=gatewayDemo;
  const vehicle=createWorldVehicle(scene,p.x,p.z,p.heading,p.color,p,fitsRoad),car=vehicle.car;
  const audio=createDriveAudio(),look={yaw:0,pitch:0};
  let driving=false,near=false,view=0;
  const views=['chase','bonnet','cockpit'];
  function nearDoor(){
    if(Math.hypot(camera.position.x-car.x,camera.position.z-car.z)>=3.5)return false;
    const c=Math.cos(car.heading),s=Math.sin(car.heading);
    for(const side of [-1,1]){
      const dx=car.x+side*1.35*c-.85*s,dz=car.z-side*1.35*s-.85*c;
      let valid=true;
      for(let i=1;i<=8;i++)if(!clear(camera.position.x+(dx-camera.position.x)*i/8,camera.position.z+(dz-camera.position.z)*i/8)){valid=false;break;}
      if(valid)return true;
    }
    return false;
  }
  function toggle(code){
    if(!driving)return;
    if(code==='KeyV'){view=(view+1)%3;look.yaw=look.pitch=0;vehicle.setCockpit(view===2);}
    if(code==='KeyM')audio.toggle();
    driveToggle(car,code);
  }
  function activate(){
    if(document.querySelector('dialog[open]'))return false;
    if(!driving){
      if(!nearDoor())return false;
      driving=true;view=0;look.yaw=look.pitch=0;car.speed=0;ui.reset();return true;
    }
    if(Math.abs(car.speed)>.15)return true;
    for(const side of [-1,1]){
      const x=car.x+side*1.65*Math.cos(car.heading),z=car.z-side*1.65*Math.sin(car.heading);
      if(clear(x,z)&&!occupiedVehicle(car,x,z)){
        driving=false;vehicle.setCockpit(false);car.speed=0;car.reverse=false;car.signal=0;audio.silence();ui.reset();
        camera.position.set(x,1.68,z);onExit(car.heading);return true;
      }
    }
    return true;
  }
  const ui=createDrivePad(activate,toggle);
  function pause(){ui.reset();car.speed=0;audio.silence();}
  function suspend(){pause();driving=false;near=false;vehicle.setCockpit(false);ui.render(false,'',car,views[view],audio.enabled);}
  for(const name of ['blur','orientationchange','gamepaddisconnected','pagehide'])addEventListener(name,pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  addEventListener('pagehide',e=>{if(!e.persisted)audio.dispose();});
  return {
    activate,toggle,suspend,pause,get driving(){return driving},get cockpit(){return driving&&view===2},
    clearWalk(x,z){return !occupiedVehicle(car,x,z);},
    frame(dt,keys,controls,pad,edges,seconds,wet,enabled){
      if(!enabled){suspend();return false;}
      near=!driving&&nearDoor();
      if(driving)for(const code of controllerDriveCodes(edges))toggle(code);
      const input=driving?drivingInput(keys,controls,ui.pedals,pad,wet):{gas:0,brake:0,steer:0,wet};
      vehicle.update(dt,input,seconds,[]);
      audio.frame(driving&&!document.hidden&&document.hasFocus(),car.speed,input.gas,wet,view===2);
      ui.render(driving,near?'van':'',car,views[view],audio.enabled,p.reference);
      if(driving)driveCamera(camera,car,view,look,controls,dt);
      return driving;
    }
  };
}
