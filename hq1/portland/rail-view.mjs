import * as T from '../../space/shared/three.module.js';
import {subscribeInput} from '../../space/shared/gamepad.mjs';
import {createYellowLine} from './yellow-line.mjs';
import {portlandSky} from './weather.mjs';

export function enterRail(){
  const rail=createYellowLine(),camera=new T.PerspectiveCamera(66,1,.1,220);
  const r=new T.WebGLRenderer({antialias:true});r.setPixelRatio(Math.min(1.5,devicePixelRatio));
  document.querySelector('#district').append(r.domElement);
  document.querySelector('h1').textContent='MAX Yellow Line';
  const back=document.querySelector('header a');back.href='?stop=killingsworth';back.textContent='Return to HQ1';
  document.querySelector('#rail-link').hidden=true;
  const controls=document.createElement('section');controls.className='drive-panel rail-panel';
  const station=document.createElement('output');controls.append(station);
  function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;controls.append(b);return b;}
  const action=button('Board train',toggle);
  const north=button('Northbound',()=>depart(1)),south=button('Southbound',()=>depart(-1));
  document.body.append(controls);
  function toggle(){
    if(rail.riding||(!rail.aboard&&!nearDoor()))return;
    rail.toggle();camera.position.set(rail.aboard?0:-3,1.56,rail.aboard?2:1.8);
    yaw=rail.aboard?.42:-1.02;
  }
  function depart(dir){rail.depart(dir);}
  function nearDoor(){return Math.abs(camera.position.z)<3.2 && camera.position.x>-4.8;}
  camera.position.set(-4.2,1.58,2.5);let yaw=-1.04,pitch=0,last=0;
  const keys=new Set();let input={move:{x:0,y:0},look:{x:0,y:0}};
  subscribeInput(v=>input=v);
  addEventListener('keydown',e=>{
    keys.add(e.code);if(e.repeat)return;
    if(e.code==='KeyE')toggle();if(e.code==='KeyN')depart(1);if(e.code==='KeyS'&&e.shiftKey)depart(-1);
  });
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
  const canvas=r.domElement;let pointer=null;
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointer=e.pointerId;};
  canvas.onpointermove=e=>{if(pointer===e.pointerId){yaw-=e.movementX*.005;pitch-=e.movementY*.005;}};
  canvas.onlostpointercapture=()=>pointer=null;
  function resize(){r.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize();addEventListener('resize',resize);
  const weather=portlandSky(rail.scene,rail.sun,rail.ambient);
  r.setAnimationLoop(now=>{
    const dt=Math.min(.1,(now-(last||now))/1000);last=now;rail.tick(dt);
    yaw-=input.look.x*dt*1.6;pitch=T.MathUtils.clamp(pitch-input.look.y*dt*1.25,-.75,.75);
    const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+input.move.x;
    const z=Number(keys.has('KeyS'))-Number(keys.has('KeyW'))+input.move.y;
    const step=dt*3/Math.max(1,Math.hypot(x,z));
    const nx=camera.position.x+step*(x*Math.cos(yaw)+z*Math.sin(yaw));
    const nz=camera.position.z+step*(z*Math.cos(yaw)-x*Math.sin(yaw));
    if(rail.clear(nx,camera.position.z))camera.position.x=nx;
    if(rail.clear(camera.position.x,nz))camera.position.z=nz;
    camera.rotation.set(pitch,yaw,0,'YXZ');weather(dt,camera,rail.aboard);
    station.textContent=rail.riding?'Next · '+rail.next:rail.name;
    action.textContent=rail.aboard?'Leave train':'Board train';
    action.disabled=rail.riding||(!rail.aboard&&!nearDoor());
    for(const [b,d] of [[north,1],[south,-1]]){
      b.hidden=!rail.aboard;b.disabled=rail.riding||!rail.adjacent(d);
      b.textContent=(d===1?'North':'South')+(rail.adjacent(d)?' · '+rail.adjacent(d):'');
    }
    r.render(rail.scene,camera);
  });
}
