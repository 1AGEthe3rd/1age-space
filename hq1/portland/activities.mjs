import {createVan} from './van.mjs';
import {playCabinet} from './arcade.mjs';
export function createActivities(scene,camera,clear) {
  const fleet=[createVan(scene,4.3,84,0,'#48756c'),createVan(scene,-4.3,78,Math.PI,'#905d46')];
  let selected=fleet[0], car=selected.car;
  const panel=document.createElement('section');
  panel.className='drive-panel';document.body.append(panel);
  const button=(label,action)=>{
    const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{action();b.blur();};return b;
  };
  const action=button('Enter van',activate), tools=document.createElement('div'),speed=document.createElement('output');
  const gear=button('D / R',()=>toggle('KeyR')),headlights=button('Lights',()=>toggle('KeyH'));
  tools.append(speed,gear,headlights,button('◀ Signal',()=>toggle('KeyQ')),button('Signal ▶',()=>toggle('KeyC')));
  const pedals={gas:0,brake:0};
  for(const [name,label] of [['brake','Brake'],['gas','Gas']]){
    const b=button(label,()=>{});b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pedals[name]=1;};
    b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>pedals[name]=0;tools.append(b);
  }
  panel.append(action,tools);panel.hidden=true;tools.hidden=true;
  let driving=false,near='',lastExitYaw=null;
  function activate(){
    if(document.querySelector('dialog[open]'))return;
    if(driving){
      if(Math.abs(car.speed)>.15)return;
      for(const side of [1,-1]){
        const x=car.x+side*1.65*Math.cos(car.heading),z=car.z-side*1.65*Math.sin(car.heading);
        if(clear(x,z)){driving=false;car.speed=0;car.reverse=false;car.signal=0;camera.position.set(x,1.75,z);lastExitYaw=car.heading;break;}
      }
    }else if(near==='van'){driving=true;car.speed=0;}
    else if(near==='game')playCabinet();
  }
  function toggle(code){
    if(!driving)return;
    if(code==='KeyR' && Math.abs(car.speed)<.15)car.reverse=!car.reverse;
    if(code==='KeyH')car.lights=!car.lights;
    if(code==='KeyQ'||code==='KeyC'){const side=code==='KeyQ'?-1:1;car.signal=car.signal===side?0:side;}
  }
  addEventListener('blur',()=>{pedals.gas=pedals.brake=0;if(driving)car.speed=0;});
  return {
    interact(){if(driving||near){activate();return true;}return false;},
    toggle,
    takeExitYaw(){const value=lastExitYaw;lastExitYaw=null;return value;},
    frame(dt,keys,controls,pad,edges,seconds){
      if(document.querySelector('dialog[open]'))return true;
      if(!driving){
        const distance=v=>Math.hypot(camera.position.x-v.car.x,camera.position.z-v.car.z);
        selected=distance(fleet[0])<=distance(fleet[1])?fleet[0]:fleet[1];
        car=selected.car;
      }
      near=Math.hypot(camera.position.x-car.x,camera.position.z-car.z)<3.5?'van':
        (Math.abs(camera.position.x-18.65)<1.75 && [-233,-228,-223].some(z=>Math.abs(camera.position.z-z)<1.65)?'game':'');
      if(driving){
        if(edges.includes(3))toggle('KeyR');
        if(edges.includes(2))toggle('KeyH');
        if(edges.includes(4))toggle('KeyQ');
        if(edges.includes(5))toggle('KeyC');
      }
      const clamp=v=>Math.max(-1,Math.min(1,v));
      const steer=clamp(controls.move.x+Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')));
      const gas=Math.max(pedals.gas,Number(keys.has('KeyW')||keys.has('ArrowUp')),pad?.buttons[7]?.value||0);
      const brake=Math.max(pedals.brake,Number(keys.has('KeyS')||keys.has('ArrowDown')||keys.has('Space')),pad?.buttons[6]?.value||0);
      for(const van of fleet){
        const input=driving&&van===selected?{steer,gas,brake}:{steer:0,gas:0,brake:0};
        van.update(dt,input,seconds,fleet.find(other=>other!==van).car);
      }
      panel.hidden=!(driving||near);tools.hidden=!driving;
      action.textContent=driving?'Exit van':near==='game'?'Play Orbit Rally':'Enter van';
      action.disabled=driving&&Math.abs(car.speed)>.15;
      if(!driving)return false;
      gear.disabled=Math.abs(car.speed)>.15;
      speed.textContent=Math.round(Math.abs(car.speed)*2.237)+' mph · '+(car.reverse?'R':'D')+(car.lights?' · Lamps':'')+(car.signal===-1?' · ◀':car.signal===1?' · ▶':'');
      camera.position.set(car.x+Math.sin(car.heading)*6.3,3.5,car.z+Math.cos(car.heading)*6.3);
      camera.lookAt(car.x-Math.sin(car.heading)*3,1,car.z-Math.cos(car.heading)*3);
      return true;
    }
  };
}
