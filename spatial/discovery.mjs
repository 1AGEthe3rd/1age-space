import * as THREE from '../space/shared/three.module.js';
import {createWalker} from './walking.mjs';
import {createFloorMaterial,addArchitecture,addContactShade} from './architecture.mjs';
import {earthTexture} from './earth-texture.mjs';
const $=s=>document.querySelector(s),stage=$('#scene'),status=$('#status'),panel=$('#panel'),body=$('#panel-body');
try{
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x03070f);
 const camera=new THREE.PerspectiveCamera(64,1,.08,260);
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;stage.append(renderer.domElement);
 let quality=1.5;
 const std=(c,m=.2,r=.48)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
 const graphite=std(0x202b36,.42),alloy=std(0xb2c3cc,.38,.33),stone=createFloorMaterial(),cyan=new THREE.MeshBasicMaterial({color:0x8de5ff}),warm=new THREE.MeshBasicMaterial({color:0xffe5bb}),glass=new THREE.MeshPhysicalMaterial({color:0x8ac9e7,opacity:.07,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const mesh=(g,m,x,y,z,parent=scene)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(w,h,d,m,x,y,z,parent=scene)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cyl=(a,b,h,m,x,y,z,parent=scene)=>mesh(new THREE.CylinderGeometry(a,b,h,64),m,x,y,z,parent);
 const ring=(r,t,m,y,parent=scene)=>{const o=mesh(new THREE.TorusGeometry(r,t,8,96),m,0,y,0,parent);o.rotation.x=Math.PI/2;return o;};
 scene.add(new THREE.HemisphereLight(0xe3f1ff,0x405064,1.65));
 const sun=new THREE.DirectionalLight(0xe3efff,1.85);sun.position.set(-12,14,-8);scene.add(sun);
 cyl(11.4,11.5,.34,stone,0,-.17,0);cyl(11.4,11.4,.35,graphite,0,5.6,0);
 mesh(new THREE.CylinderGeometry(10.95,10.95,4.95,96,1,true),glass,0,2.72,0);
 ring(10.8,.05,cyan,.03);ring(7.4,.018,warm,.03);ring(4,.03,cyan,.03);addArchitecture(scene);
 // HQ1-inspired repeated geometry batching for floor wayfinding strips.
 const strips=new THREE.InstancedMesh(new THREE.BoxGeometry(.05,.012,1.1),cyan,24),dummy=new THREE.Object3D();
 for(let i=0;i<24;i++){const a=i*Math.PI/12;dummy.position.set(Math.sin(a)*8.7,.025,Math.cos(a)*8.7);dummy.rotation.y=a;dummy.updateMatrix();strips.setMatrixAt(i,dummy.matrix);}scene.add(strips);
 let seed=83;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const points=[];for(let i=0;i<2400;i++){const a=rand()*Math.PI*2,v=rand()*2-1,r=110+rand()*25;points.push(Math.cos(a)*Math.sqrt(1-v*v)*r,v*r,Math.sin(a)*Math.sqrt(1-v*v)*r);}
 const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xdceaff,size:.18})));
 const earthMat=std(0x437fae,0,.9),externalMat=earthMat.clone();
 new THREE.TextureLoader().load(earthTexture,t=>{t.colorSpace=THREE.SRGBColorSpace;for(const m of [earthMat,externalMat]){m.map=t;m.color.set(0xffffff);m.needsUpdate=true;}},undefined,()=>{});
 const outside=mesh(new THREE.SphereGeometry(13,48,32),externalMat,-21,9,-48);outside.rotation.z=.18;
 mesh(new THREE.SphereGeometry(3.1,32,20),std(0xa4a7b0,0,1),21,10,-59);
 // Central interactive globe on a substantial architectural plinth.
 const hub=new THREE.Group();scene.add(hub);cyl(2.6,2.8,.16,graphite,0,.08,0,hub);cyl(1.95,2.25,.6,alloy,0,.45,0,hub);cyl(2.15,2.15,.11,graphite,0,.8,0,hub);ring(2.12,.035,cyan,.88,hub);
 const globe=mesh(new THREE.SphereGeometry(1.72,64,40),earthMat,0,2.65,0,hub);
 const orbit=ring(2.02,.024,cyan,2.65,hub);orbit.rotation.set(Math.PI/2+.18,0,.15);
 addContactShade(scene,0,0,3.1);
 const targets=[],records=[],obstacles=[{x:0,z:0,r:2.8}];
 function label(parent,title,subtitle,y=2.35){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#0b1827';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#8cd9f9';ctx.lineWidth=4;ctx.strokeRect(6,6,1012,244);ctx.fillStyle='#edf7ff';ctx.textAlign='center';ctx.font='600 64px system-ui';ctx.fillText(title,512,108);ctx.fillStyle='#a7cfdf';ctx.font='32px system-ui';ctx.fillText(subtitle,512,184);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;return mesh(new THREE.PlaneGeometry(3.2,.8),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}),0,y,0,parent);
 }
 const destinations=[
 {id:'hq1',name:'PORTLAND HQ1',subtitle:'Soul District · Oregon',url:'../hq1/',x:-6.3,z:-3.6},
 {id:'hq2',name:'WASHINGTON D.C.',subtitle:'HQ2 · Historic Anacostia',url:'../hq2/',x:6.3,z:-3.6},
 {id:'catalog',name:'PROPERTY INDEX',subtitle:'Explore the existing catalog',url:'../catalog.html',x:0,z:-7.7}
 ];
 function register(g,data){records.push(data);g.traverse(o=>{if(o.isMesh){o.userData.destination=data;targets.push(o);}});}
 register(hub,{id:'globe',name:'Global discovery',x:0,z:0,links:destinations.map(d=>[d.name,d.url])});
 function pavilion(d){
 const g=new THREE.Group();g.position.set(d.x,0,d.z);g.rotation.y=Math.atan2(-d.x,-d.z);scene.add(g);
 addContactShade(scene,d.x,d.z,2);
 box(3.5,.18,1.7,graphite,0,.09,0,g);box(3.35,.08,1.55,alloy,0,.22,0,g);
 for(const x of [-1.5,1.5]){box(.23,2.9,.27,alloy,x,1.7,-.43,g);box(.047,2.5,.05,cyan,x,1.7,-.25,g);}
 box(3.23,.22,.28,alloy,0,3.2,-.43,g);box(2.95,.045,.06,cyan,0,3.03,-.23,g);
 // Scale architectural exhibition models, explicitly conceptual rather than replicas.
 const colors=[std(0x7d9aaa),std(0xa9b4bc),std(0x596c80)];
 for(let i=0;i<7;i++){const x=(i%4-.0)*.58-.88,z=Math.floor(i/4)*.46-.23,h=.27+rand()*.65;box(.43,h,.36,colors[i%3],x,.27+h/2,z,g);box(.34,.035,.25,warm,x,.28+h,z,g);}
 label(g,d.name,d.subtitle,2.32);obstacles.push({x:d.x,z:d.z,r:1.87});register(g,{...d,links:[[d.id==='catalog'?'Open catalog':'Enter district',d.url]]});
 }
 destinations.forEach(pavilion);
 function show(title,links,settings=false){$('#panel-title').textContent=title;body.replaceChildren();for(const [name,url] of links){const a=document.createElement('a');a.textContent=name;a.href=url;body.append(a);}if(settings){const select=document.createElement('select');select.setAttribute('aria-label','Graphics resolution');for(const [n,v] of [['Low','0.8'],['Balanced','1.5'],['High','2']])select.add(new Option(n,v));select.value=String(quality);select.onchange=()=>{quality=Number(select.value);resize();};body.append(select);}walker.clear();if(!panel.open)panel.showModal();}
 const distance=d=>Math.hypot(camera.position.x-d.x,camera.position.z-d.z);
 function interact(d){if(!d||distance(d)>4.6){status.textContent='Walk closer to a discovery station.';return;}status.textContent='';show(d.name,d.links);}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const walker=createWalker(camera,renderer.domElement,{radius:10.15,eyeHeight:1.75,spawn:[0,1.75,7.8],obstacles,paused:()=>panel.open,onTap:e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];if(hit)interact(hit.object.userData.destination);}});
 $('#interact').onclick=()=>interact([...records].sort((a,b)=>distance(a)-distance(b))[0]);
 $('#menu').onclick=()=>show('1AGE',[['1AGE World','https://1age.world/'],['1AGE.com','https://1age.com/'],['Portland HQ1','../hq1/'],['Washington D.C. HQ2','../hq2/'],['Property catalog','../catalog.html']],true);
 $('#reset').onclick=()=>{walker.clear();walker.reset();status.textContent='';};
 addEventListener('keydown',e=>{if(e.code==='KeyE'&&!panel.open&&!e.repeat&&!e.target?.closest?.('input,select,textarea'))$('#interact').click();});
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,quality));renderer.setSize(innerWidth,innerHeight);}resize();addEventListener('resize',resize);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);status.textContent='Graphics context lost. Reload or use the 1AGE menu.';});
 let last=performance.now();status.textContent='';renderer.setAnimationLoop(now=>{const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;walker.update(dt);globe.rotation.y+=dt*.16;outside.rotation.y+=dt*.025;renderer.render(scene,camera);});
}catch(error){console.error(error);status.textContent='3D could not start. Open the catalog using the center logo.';$('#menu').onclick=()=>location.href='../catalog.html';}
