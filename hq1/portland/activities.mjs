import {createVan} from './van.mjs';
import {playCabinet} from './arcade.mjs';
import {createDrivePad} from './drive-pad.mjs';
import {demoFleet,nearestAccessibleVehicle,vehicleWalkable} from './demo-fleet.mjs';
import {nextWiperMode} from './windshield-model.mjs';
import {createDriveAudio} from './drive-audio.mjs';

export function createActivities(scene,camera,clear) {
  const fleet=[createVan(scene,4.3,84,0,'#48756c'),createVan(scene,-4.3,78,Math.PI,'#905d46'),
    ...demoFleet.map(p=>createVan(scene,p.x,p.z,p.heading,p.color,p))];
  let selected=fleet[0],car=selected.car;
  let driving=false,near='',lastExitYaw=null,view=0,lookYaw=0,lookPitch=0;
  const views=['chase','bonnet','cockpit'];
  const audio=createDriveAudio();
  const ui=createDrivePad(activate,toggle),pedals=ui.pedals;
  const clamp=(v,min=-1,max=1)=>Math.max(min,Math.min(max,v));
  function cameraMode(){
    view=(view+1)%views.length;lookYaw=lookPitch=0;
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
      selected=target;car=target.car;driving=true;car.speed=0;view=0;lookYaw=lookPitch=0;ui.reset();
    }
    else if(near==='game')playCabinet();
  }
  function toggle(code){
    if(!driving)return;
    if(code==='KeyV')cameraMode();
    if(code==='KeyT')car.wiperMode=nextWiperMode(car.wiperMode);
    if(code==='KeyM')audio.toggle();
    if(code==='KeyR'&&Math.abs(car.speed)<.15)car.reverse=!car.reverse;
    if(code==='KeyH')car.lights=!car.lights;
    if(code==='KeyQ'||code==='KeyC'){const side=code==='KeyQ'?-1:1;car.signal=car.signal===side?0:side;}
  }
  function reset(){ui.reset();audio.silence();if(driving)car.speed=0;}
  for(const event of ['blur','orientationchange','gamepaddisconnected','pagehide'])addEventListener(event,reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  addEventListener('pagehide',event=>{if(!event.persisted)audio.dispose();});
  function placeCamera(dt,controls){
    lookYaw=clamp(lookYaw-controls.look.x*dt*1.65,view===0?-Math.PI:-1.25,view===0?Math.PI:1.25);
    lookPitch=clamp(lookPitch-controls.look.y*dt*1.1,-.45,.45);
    const h=car.heading+lookYaw;
    if(view===0){
      camera.position.set(car.x+Math.sin(h)*6.3,3.5+lookPitch*3,car.z+Math.cos(h)*6.3);
      camera.lookAt(car.x,1.05,car.z);
    }else{
      const x=view===2?.48:0,z=view===2?-.88:-2.16,y=view===2?1.65:1.52;
      const c=Math.cos(car.heading),s=Math.sin(car.heading);
      camera.position.set(car.x+x*c+z*s,y,car.z-x*s+z*c);
      camera.lookAt(camera.position.x-Math.sin(h)*10,y+Math.tan(lookPitch)*10,camera.position.z-Math.cos(h)*10);
    }
  }
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
      if(driving){
        if(edges.includes(3))toggle('KeyR');
        if(edges.includes(2))toggle('KeyH');
        if(edges.includes(4))toggle('KeyQ');
        if(edges.includes(5))toggle('KeyC');
        if(edges.includes(10)||edges.includes(11))toggle('KeyV');
        if(edges.includes(8))toggle('KeyT');
      }
      const steer=clamp(controls.move.x+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')));
      const gas=Math.max(pedals.gas,Number(keys.has('KeyW')||keys.has('ArrowUp')),pad?.buttons[7]?.value||0);
      const brake=Math.max(pedals.brake,Number(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('Space')),pad?.buttons[6]?.value||0);
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
