import {createVan} from './van.mjs';
import {playCabinet} from './arcade.mjs';
import {createDrivePad} from './drive-pad.mjs';
import {demoFleet,nearestAccessibleVehicle,vehicleWalkable} from './demo-fleet.mjs';
import {drivingInput,driveToggle,driveCamera,controllerDriveCodes} from '../../world/gameplay/driving-session.mjs';
import {createDriveAudio} from './drive-audio.mjs';

export function createActivities(scene,camera,clear) {
  const fleet=[createVan(scene,4.3,84,0,'#48756c'),createVan(scene,-4.3,78,Math.PI,'#905d46'),
    ...demoFleet.map(p=>createVan(scene,p.x,p.z,p.heading,p.color,p))];
  let selected=fleet[0],car=selected.car;
  let driving=false,near='',lastExitYaw=null,view=0;
  const look={yaw:0,pitch:0};
  const views=['chase','bonnet','cockpit'];
  const audio=createDriveAudio();
  const ui=createDrivePad(activate,toggle),pedals=ui.pedals;
  function cameraMode(){
    view=(view+1)%views.length;look.yaw=look.pitch=0;
    selected.setCockpit(view===2);
  }
  function activate(){
    if(document.querySelector('dialog[open]'))return;
    if(driving){
      if(Math.abs(car.speed)>.15)return;
      for(const side of [1,-1]){
        const x=car.x+side*1.65*Math.cos(car.heading),z=car.z-side*1.65*Math.sin(car.heading);
        if(clear(x,z)&&vehicleWalkable(fleet,x,z)){driving=false;car.speed=0;car.reverse=false;car.signal=0;selected.setCockpit(false);audio.silence();camera.position.set(x,1.75,z);lastExitYaw=car.heading;ui.reset();break;}
      }
    }else if(near==='van'){
      const target=nearestAccessibleVehicle(fleet,camera.position.x,camera.position.z,clear);
      if(!target)return;
      selected=target;car=target.car;driving=true;car.speed=0;view=0;look.yaw=look.pitch=0;ui.reset();
    }
    else if(near==='game')playCabinet();
  }
  function toggle(code){
    if(!driving)return;
    if(code==='KeyV')cameraMode();
    if(code==='KeyM')audio.toggle();
    driveToggle(car,code);
  }
  function reset(){ui.reset();audio.silence();if(driving)car.speed=0;}
  for(const event of ['blur','orientationchange','gamepaddisconnected','pagehide'])addEventListener(event,reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  addEventListener('pagehide',event=>{if(!event.persisted)audio.dispose();});
  function placeCamera(dt,controls){driveCamera(camera,car,view,look,controls,dt);}
  return {
    interact(){if(driving||near){activate();return true;}return false;},
    toggle,
    isCockpit(){return driving&&view===2;},
    clearWalk(x,z){return vehicleWalkable(fleet,x,z);},
    takeExitYaw(){const value=lastExitYaw;lastExitYaw=null;return value;},
    frame(dt,keys,controls,pad,edges,seconds,wet=false){
      if(document.querySelector('dialog[open]')){audio.silence();return true;}
      const candidate=driving?null:nearestAccessibleVehicle(fleet,camera.position.x,camera.position.z,clear);
      if(candidate){selected=candidate;car=selected.car;}
      near=candidate?'van':
        (Math.abs(camera.position.x-18.65)<1.75&&[-233,-228,-223].some(z=>Math.abs(camera.position.z-z)<1.65)?'game':'');
      if(driving)for(const code of controllerDriveCodes(edges))toggle(code);
      const {steer,gas,brake}=drivingInput(keys,controls,pedals,pad,wet);
      for(const van of fleet){
        const input=driving&&van===selected?{steer,gas,brake,wet}:{steer:0,gas:0,brake:0,wet};
        van.update(dt,input,seconds,fleet.filter(other=>other!==van).map(other=>other.car));
      }
      audio.frame(driving&&!document.hidden&&document.hasFocus(),car.speed,gas,wet,view===2);
      ui.render(driving,near,car,views[view],audio.enabled,selected.profile?.reference);
      if(!driving)return false;
      placeCamera(dt,controls);
      return true;
    }
  };
}
