import * as T from '../../space/shared/three.module.js';
import {subscribeInput} from '../../space/shared/gamepad.mjs';
import {PadReader} from '../../space/shared/gamepad-model.mjs';
import {airports,createJourney} from './flight-model.mjs';
import {buildPdxTerminal,pdxSpawn,pdxWalkable,nearPdxGate} from './pdx-terminal.mjs';
import {buildDcaTerminal,dcaSpawn,dcaWalkable,nearDcaGate} from './dca-terminal.mjs';
import {detailPassengerCabin} from './passenger-cabin.mjs';
import {createDcaLife} from './dca-life.mjs';

export function enterAirport(origin){
  const trip=createJourney(origin),scene=new T.Scene(),camera=new T.PerspectiveCamera(68,1,.08,1600);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));
  document.querySelector('#district').append(renderer.domElement);
  scene.background=new T.Color('#a4c7e4');scene.fog=new T.Fog('#a4c7e4',160,1300);
  scene.add(new T.HemisphereLight('#e7f1ff','#948d78',2));
  const sun=new T.DirectionalLight('#fff3dd',2.4);sun.position.set(80,100,50);scene.add(sun);
  const unit=new T.BoxGeometry(1,1,1),paints=new Map();
  function box(parent,x,y,z,w,h,d,color){
    if(!paints.has(color))paints.set(color,new T.MeshStandardMaterial({color,roughness:.8}));
    const m=new T.Mesh(unit,paints.get(color));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;
  }
  function sign(parent,label,x,y,z,w=6){
    const c=document.createElement('canvas');c.width=1024;c.height=128;
    const ctx=c.getContext('2d');ctx.fillStyle='#123b3d';ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#eaf6e8';ctx.font='bold 62px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,512,64,980);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
    const m=new T.Mesh(new T.PlaneGeometry(w,w/8),new T.MeshBasicMaterial({map:tex,side:T.DoubleSide}));
    m.position.set(x,y,z);parent.add(m);
  }
  const terminal=new T.Group();scene.add(terminal);
  if(origin==='pdx')buildPdxTerminal(T,terminal,box,sign,airports[trip.destination].code);
  else buildDcaTerminal(T,terminal,box,sign,airports[trip.destination].code);
  const world=new T.Group();scene.add(world);
  const ground=new T.Group();world.add(ground);
  box(ground,0,-.6,0,1000,1,1600,'#82937b');
  box(ground,0,-.04,0,48,.08,1200,'#454d50');
  for(let z=-560;z<600;z+=26)box(ground,0,.012,z,.38,.025,13,'#e6e8e1');
  for(const x of [-22,22])box(ground,x,.014,0,.35,.026,1200,'#dedfd9');
  for(let i=0;i<18;i++){
    const x=(i%2===0?1:-1)*(80+i%5*28),z=-500+i*61;
    box(ground,x,5,z,28,10,30,'#b0b7b3');
    box(ground,x,10.2,z,31,.4,32,'#687a80');
  }
  const dcaLife=origin==='dca'?createDcaLife(T,terminal,ground,box,sign):null;
  const terrain=new T.Group();world.add(terrain);
  for(let i=0;i<42;i++){
    const x=(i%7-3)*155,z=Math.floor(i/7)*160-480;
    const h=8+(i*37%110);
    const hill=new T.Mesh(new T.ConeGeometry(110,h,5),new T.MeshStandardMaterial({color:i%2?'#758d7b':'#8a9a82',flatShading:true}));
    hill.position.set(x,h*.5-1,z);terrain.add(hill);
  }
  terrain.visible=false;
  const clouds=new T.Group();scene.add(clouds);
  const cloudGeometry=new T.SphereGeometry(1,9,6),cloudMat=new T.MeshBasicMaterial({color:'#eef4f8'});
  for(let i=0;i<28;i++){
    const group=new T.Group();group.position.set((i%7-3)*125,30+(i*23%95),Math.floor(i/7)*180-360);clouds.add(group);
    for(let j=0;j<3;j++){const m=new T.Mesh(cloudGeometry,cloudMat);m.scale.set(32-j*4,8+j*2,17);m.position.x=j*18;group.add(m);}
  }
  clouds.visible=false;
  const plane=new T.Group();scene.add(plane);plane.visible=false;
  const cabin=new T.Group();plane.add(cabin);
  box(cabin,0,-.08,0,3.7,.16,21,'#626c76');
  box(cabin,0,2.35,0,3.7,.17,21,'#e5e7df');
  box(cabin,0,1.12,-10.4,3.7,2.24,.18,'#dce0dc');
  box(cabin,0,1.12,10.4,3.7,2.24,.18,'#dce0dc');
  for(const side of [-1,1]){
    box(cabin,side*1.82,.4,0,.12,.8,21,'#d0d5d5');
    box(cabin,side*1.82,1.96,0,.12,.6,21,'#d0d5d5');
    box(cabin,side*1.46,2.06,0,.6,.31,20,'#e9e8e0');
    for(let z=-9.5;z<10;z+=2.1){
      box(cabin,side*1.82,1.25,z,.12,.93,1.02,'#d0d5d5');
      for(const x of [side*.78,side*1.39]){
        box(cabin,x,.55,z,.5,.16,.6,'#2d536b');
        box(cabin,x,.96,z+.27,.5,.78,.12,'#2d536b');
        box(cabin,x,.69,z-.03,.53,.065,.45,'#81949a');
      }
    }
    const wing=box(plane,side*5.4,-.29,0,8.2,.16,3.2,'#c5d0d7');wing.rotation.y=side*.22;
    const tip=box(plane,side*9.25,.18,1,.15,1.05,1.35,'#507c8c');
    tip.rotation.z=side*.15;
  }
  detailPassengerCabin(T,cabin,plane,box);
  const panel=document.createElement('section');panel.className='drive-panel rail-panel';
  const status=document.createElement('output');status.setAttribute('aria-live','polite');panel.append(status);
  const action=document.createElement('button');action.type='button';panel.append(action);
  const view=document.createElement('button');view.type='button';view.textContent='◉';view.setAttribute('aria-label','Switch passenger view');view.hidden=true;panel.append(view);
  const groundLink=document.createElement('a');panel.append(groundLink);
  document.body.append(panel);
  const title=document.querySelector('h1'),back=document.querySelector('header a');
  title.textContent=airports[origin].code+' · Virtual airport';
  back.href=airports[origin].hq;back.textContent='Return to city';
  document.querySelector('#rail-link').hidden=true;
  const weather=document.querySelector('#weather');if(weather)weather.textContent='Simulation · no real ticket or fare';
  let yaw=0,pitch=0,last=0,windowView=false;
  if(origin==='pdx')camera.position.set(pdxSpawn.x,pdxSpawn.y,pdxSpawn.z);
  else camera.position.set(dcaSpawn.x,dcaSpawn.y,dcaSpawn.z);
  const keys=new Set(),reader=new PadReader();let input={move:{x:0,y:0},look:{x:0,y:0}};
  subscribeInput(v=>input=v);
  function nearGate(){return origin==='pdx'?nearPdxGate(camera.position.x,camera.position.z):nearDcaGate(camera.position.x,camera.position.z);}
  function board(){
    if(trip.status==='terminal'&&nearGate()&&trip.board()){
      terminal.visible=false;plane.visible=true;camera.position.set(0,1.45,2);yaw=0;pitch=0;windowView=false;
    }else if(trip.status==='boarded'){trip.depart();}
    else if(trip.status==='arrived'){
      location.assign('?airport='+trip.destination);
    }
  }
  function switchView(){
    if(trip.status==='terminal'||trip.status==='arrived')return;
    windowView=!windowView;
    camera.position.set(windowView?1.38:0,1.45,windowView?2.05:2);
    yaw=windowView?-Math.PI/2:0;pitch=windowView?-.13:0;
  }
  action.onclick=board;view.onclick=switchView;
  addEventListener('keydown',e=>{if(e.target?.closest?.('button,a'))return;keys.add(e.code);if(!e.repeat&&e.code==='KeyE')board();if(!e.repeat&&e.code==='KeyV')switchView();});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();reader.reset();});
  const canvas=renderer.domElement;let pointer=null;
  canvas.onpointerdown=e=>{if(e.button!==0||pointer!==null)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
  canvas.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;yaw-=(e.clientX-pointer.x)*.004;pitch-=(e.clientY-pointer.y)*.004;pointer.x=e.clientX;pointer.y=e.clientY;};
  canvas.onlostpointercapture=()=>pointer=null;
  function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize();addEventListener('resize',resize);
  renderer.setAnimationLoop(now=>{
    const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
    let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}
    const pad=reader.sample(pads,!document.hidden&&document.hasFocus());
    if(pad.edges.includes(0)&&!document.activeElement?.matches('button,a'))board();
    if(pad.edges.includes(10)||pad.edges.includes(11))switchView();
    trip.tick(dt);const phase=trip.sample();
    const walking=trip.status==='terminal'||trip.status==='boarded';
    if(walking&&!windowView){
      const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+input.move.x;
      const z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+input.move.y;
      const step=dt*3.2/Math.max(1,Math.hypot(x,z));
      const c=Math.cos(yaw),s=Math.sin(yaw),inTerminal=trip.status==='terminal';
      const nx=camera.position.x+(x*c+z*s)*step,nz=camera.position.z+(z*c-x*s)*step;
      if(inTerminal&&origin==='pdx'){
        if(pdxWalkable(nx,camera.position.z))camera.position.x=nx;
        if(pdxWalkable(camera.position.x,nz))camera.position.z=nz;
      }else if(inTerminal){
        if(dcaWalkable(nx,camera.position.z))camera.position.x=nx;
        if(dcaWalkable(camera.position.x,nz))camera.position.z=nz;
      }else{
        camera.position.x=T.MathUtils.clamp(nx,-.38,.38);
        camera.position.z=T.MathUtils.clamp(nz,-9,9);
      }
    }
    yaw-=input.look.x*dt*1.65;pitch=T.MathUtils.clamp(pitch-input.look.y*dt*1.3,-.8,.8);
    camera.rotation.set(pitch,yaw,0,'YXZ');
    const flying=trip.status==='flying',aboard=trip.status!=='terminal';
    dcaLife?.update(dt,!aboard);
    world.position.y=-phase.altitude;
    // Keep ground motion continuous through the visible takeoff and landing phases.
    ground.position.z=flying?(trip.elapsed<22?trip.elapsed*18:trip.elapsed<57?396:(80-trip.elapsed)*17.2):0;
    terrain.visible=phase.altitude>120;terrain.position.z=(trip.elapsed*45)%320-160;
    ground.visible=phase.altitude<180;
    clouds.visible=phase.altitude>150;clouds.position.z=(trip.elapsed*19)%240-120;
    const nextStatus=trip.status==='terminal'?'Demo departure · '+airports[trip.destination].code:trip.status==='boarded'?'Ready · simulated flight':phase.name+' · '+airports[trip.destination].code+' · '+Math.round(trip.progress*100)+'%';
    if(status.textContent!==nextStatus)status.textContent=nextStatus;
    action.textContent=trip.status==='terminal'?'Board free demo':trip.status==='boarded'?'Depart':trip.status==='arrived'?'Leave aircraft':'In flight';
    action.disabled=flying||(trip.status==='terminal'&&!nearGate());
    view.hidden=!aboard||trip.status==='arrived';
    groundLink.hidden=aboard;groundLink.href=origin==='pdx'?'?rail=red&station=portland-international-airport':'../hq2/?destination=dca-metro';groundLink.textContent=origin==='pdx'?'MAX Red Line':'Yellow Line · Metro';
    back.hidden=aboard;
    renderer.render(scene,camera);
  });
}
