import {subscribeInput} from './shared/gamepad.mjs';
import * as THREE from './shared/three.module.js';
export function createSpaceViewer(host){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100),group=new THREE.Group();scene.add(group);
 scene.add(new THREE.HemisphereLight(0xc8ffde,0x142319,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,8,5);scene.add(light);
 const green=new THREE.MeshStandardMaterial({color:0x1bfd9c,emissive:0x1bfd9c,emissiveIntensity:.25,roughness:.45}),dark=new THREE.MeshStandardMaterial({color:0x13251c,roughness:.65}),white=new THREE.MeshStandardMaterial({color:0xc0d4c7,roughness:.65});
 function box(w,h,d,x,y,z,mat=dark){const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);obj.position.set(x,y,z);group.add(obj);return obj;}
 box(9,.25,6,0,-.2,0);box(8,.12,5,0,0,0,white);box(8,2.5,.18,0,1.25,-2.5);box(.18,2.5,5,-4,1.25,0);box(.18,2.5,5,4,1.25,0);
 const roof=box(8.4,.2,5.4,0,2.6,0),fronts=[];fronts.push(box(2.6,2.4,.12,-2.65,1.25,2.5));fronts.push(box(2.6,2.4,.12,2.65,1.25,2.5));
 box(8,.09,.1,0,.07,2.6,green);box(8,.09,.1,0,2.42,2.6,green);box(3,.15,.1,0,2.08,2.63,green);
 for(const x of [-2.5,2.5]){box(1.3,.08,1.2,x,.8,0,white);box(.12,.8,.12,x,.4,0);}
 box(1.8,1,.5,2.7,.55,-1.5,green);box(1.3,.08,1.2,-2.5,.8,-1.5,white);
 let angle=.55,zoom=12,interior=false,active=true,last=0,disposed=false,dirty=true;group.rotation.y=angle;
 const unpad=subscribeInput((input,dt)=>{angle+=(input.move.x+input.look.x)*dt*1.8;zoom=Math.max(7,Math.min(20,zoom+(input.move.y+input.look.y)*dt*8));group.rotation.y=angle;dirty=true;});
 function resize(){const r=host.getBoundingClientRect();if(r.width&&r.height){renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();dirty=true;}}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function render(time){if(disposed)return;requestAnimationFrame(render);if(!dirty||!active||document.hidden||time-last<33)return;last=time;dirty=false;camera.position.set(0,interior?6:5,zoom);camera.lookAt(0,1,0);renderer.render(scene,camera);}requestAnimationFrame(render);
 function action(name){if(name==='left')angle-=.18;if(name==='right')angle+=.18;if(name==='in')zoom=Math.max(7,zoom-1);if(name==='out')zoom=Math.min(20,zoom+1);if(name==='reset'){angle=.55;zoom=12;}group.rotation.y=angle;dirty=true;}
 let drag=null;
 function down(e){if(e.isPrimary===false||e.button>0)return;drag={x:e.clientX,y:e.clientY,last:e.clientX,started:false};}
 function move(e){if(!drag)return;if(!drag.started){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){drag=null;return;}if(Math.abs(dx)<8)return;drag.started=true;host.setPointerCapture(e.pointerId);}angle+=(e.clientX-drag.last)*.009;drag.last=e.clientX;group.rotation.y=angle;dirty=true;}
 function end(){drag=null;}function key(e){const actions={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out',Home:'reset'};if(actions[e.key]){e.preventDefault();action(actions[e.key]);}}
 host.addEventListener('pointerdown',down);host.addEventListener('pointermove',move);host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('keydown',key);
 const io=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;});io.observe(host);
 return {action,setInterior(value){interior=value;roof.visible=!value;fronts.forEach(x=>x.visible=!value);dirty=true;},setAccent(value){if(/^#[\da-f]{6}$/i.test(value)){green.color.set(value);green.emissive.set(value);dirty=true;}},dispose(){unpad();disposed=true;observer.disconnect();io.disconnect();host.removeEventListener('pointerdown',down);host.removeEventListener('pointermove',move);host.removeEventListener('pointerup',end);host.removeEventListener('pointercancel',end);host.removeEventListener('keydown',key);group.traverse(x=>x.geometry?.dispose());[green,dark,white].forEach(x=>x.dispose());renderer.dispose();renderer.domElement.remove();}};
}
