// Virtual entrance for the independent Space app; not an imported World scene.
if(new URLSearchParams(location.search).has('property'))location.replace('explore.html?'+new URLSearchParams({place:new URLSearchParams(location.search).get('property')}));
async function start(){
 const THREE=await import('./shared/three.module.js'),host=document.querySelector('#platform');
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setClearColor(0x000000);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,200),platform=new THREE.Group();scene.add(platform);
 const dark=new THREE.MeshStandardMaterial({color:0x102b20,metalness:.5,roughness:.4}),green=new THREE.MeshBasicMaterial({color:0x1bfd9c}),glass=new THREE.MeshStandardMaterial({color:0x255f42,metalness:.7,roughness:.2});
 function box(w,h,d,x,y,z,mat){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);platform.add(o);return o;}
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(7,7.3,.45,64),dark);floor.position.y=-.25;platform.add(floor);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.035,8,100),green);ring.rotation.x=Math.PI/2;ring.position.y=.02;platform.add(ring);
 const grid=new THREE.GridHelper(12,24,0x245239,0x102b20);grid.position.y=.02;platform.add(grid);
 box(2.8,.35,2.8,0,.2,0,glass);box(3,.045,3,0,.4,0,green);
 for(const x of [-4,4]){box(.18,3,.18,x,1.5,-3,dark);box(.04,2.9,.04,x,1.5,-2.9,green);}box(8.3,.15,.22,0,3.05,-3,dark);
 // Original hovering abstract property blocks; not replicas of indexed addresses.
 box(1.3,1.7,1.2,-1.6,1.25,-.2,dark);box(1.6,1,1.2,.2,.9,-.6,glass);box(1,2.2,1,1.5,1.5,.2,dark);
 for(const x of [-1.6,1.5])box(.05,1.5,.04,x,1.5,.5,green);
 const stars=new THREE.BufferGeometry(),coords=[];let seed=211;function random(){seed=(seed*16807)%2147483647;return seed/2147483647;}for(let i=0;i<350;i++)coords.push((random()-.5)*130,random()*65-10,(random()-.5)*130);stars.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xb9e5ce,size:.08})));
 scene.add(new THREE.HemisphereLight(0xd2ffdd,0x12231a,3));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(4,12,5);scene.add(light);
 let angle=.5,distance=20,dirty=true,down=null,last=0;function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();dirty=true;}addEventListener('resize',resize);resize();
 function action(k){if(k==='left')angle-=.18;if(k==='right')angle+=.18;if(k==='in')distance=Math.max(12,distance-1);if(k==='out')distance=Math.min(30,distance+1);if(k==='reset'){angle=.5;distance=20;}dirty=true;}
 document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.camera)));host.addEventListener('keydown',e=>{const a={ArrowLeft:'left',ArrowRight:'right','+':'in','-':'out',Home:'reset'}[e.key];if(a){e.preventDefault();action(a);}});
 host.addEventListener('pointerdown',e=>{if(e.button>0)return;down={x:e.clientX,y:e.clientY,last:e.clientX,active:false};});host.addEventListener('pointermove',e=>{if(!down)return;if(!down.active){if(Math.abs(e.clientY-down.y)>Math.abs(e.clientX-down.x)+8){down=null;return;}if(Math.abs(e.clientX-down.x)<8)return;down.active=true;host.setPointerCapture(e.pointerId);}angle+=(e.clientX-down.last)*.006;down.last=e.clientX;dirty=true;});for(const type of ['pointerup','pointercancel'])host.addEventListener(type,()=>down=null);
 function render(t){requestAnimationFrame(render);if(document.hidden||!dirty||t-last<33)return;last=t;dirty=false;camera.position.set(Math.sin(angle)*distance,9,Math.cos(angle)*distance);camera.lookAt(-1.8,0,0);renderer.render(scene,camera);}requestAnimationFrame(render);document.querySelector('#fallback').hidden=true;
}
start().catch(()=>{document.querySelector('#hint').textContent='3D is unavailable on this device. Property discovery remains available.';});
