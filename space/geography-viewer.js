import * as THREE from './shared/three.module.js';
export function createGeographyViewer(host,onSelect){
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100),group=new THREE.Group();scene.add(group);camera.position.set(0,8,12);camera.lookAt(0,1,0);
 scene.add(new THREE.HemisphereLight(0xe2ffdc,0x12251a,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,8,5);scene.add(light);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.025,8,80),new THREE.MeshBasicMaterial({color:0x1bfd9c}));ring.rotation.x=Math.PI/2;group.add(ring);
 // Original virtual architecture, not a reconstruction of indexed buildings.
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(10,10.5,.35,64),new THREE.MeshStandardMaterial({color:0x061c14,metalness:.55,roughness:.4}));floor.position.y=-.5;scene.add(floor);
 const grid=new THREE.GridHelper(20,32,0x246749,0x0b3023);grid.position.y=-.3;scene.add(grid);
 for(let i=0;i<12;i++){const a=i*Math.PI/6,pillar=new THREE.Mesh(new THREE.BoxGeometry(.16,5,.16),new THREE.MeshStandardMaterial({color:0x173e2d,emissive:0x062818}));pillar.position.set(Math.sin(a)*9,2,Math.cos(a)*9);scene.add(pillar);}
 const globe=new THREE.Mesh(new THREE.IcosahedronGeometry(1.6,2),new THREE.MeshBasicMaterial({color:0x1bfd9c,wireframe:true,transparent:true,opacity:.28}));globe.position.y=1.3;scene.add(globe);
 const template=new THREE.Group();template.visible=false;scene.add(template);
 for(const [w,h,d,x,z] of [[1.6,2,1.8,-.8,0],[1.3,1.2,1.6,.8,0],[3,.12,2.1,0,0]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x164831,emissive:0x062818,metalness:.3,roughness:.4}));mesh.position.set(x,h/2,z);template.add(mesh);}
 function inspectProperty(show){template.visible=show;globe.visible=!show;draw();}
 const coords=[];let seed=811;for(let i=0;i<450;i++){seed=seed*16807%2147483647;const x=(seed/2147483647-.5)*100;seed=seed*16807%2147483647;const y=seed/2147483647*40+3;seed=seed*16807%2147483647;coords.push(x,y,(seed/2147483647-.5)*100);}const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xb9dec9,size:.07})));
 let nodes=[],angle=0,frame=0,down=null,disposed=false;const pointers=new Set(),ray=new THREE.Raycaster();
 function render(){frame=0;if(disposed||document.hidden)return;group.rotation.y=angle;renderer.render(scene,camera);}
 function draw(){if(!frame&&!disposed)frame=requestAnimationFrame(render);}
 function resize(){const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();}
 const observer=new ResizeObserver(resize);observer.observe(host);
 function clear(){for(const node of nodes){group.remove(node.mesh,node.label);node.mesh.geometry.dispose();node.mesh.material.dispose();node.label.material.map.dispose();node.label.material.dispose();}nodes=[];}
 function setCities(cities){
  clear();cities.forEach((city,i)=>{const a=i*2*Math.PI/Math.max(1,cities.length),mesh=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshStandardMaterial({color:0xe2ffdc,metalness:.3,roughness:.35}));mesh.position.set(Math.sin(a)*5,.35,Math.cos(a)*5);mesh.userData.id=city.id;group.add(mesh);
   const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100;const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,512,100);ctx.fillStyle='#e2ffdc';ctx.font='44px system-ui';ctx.textAlign='center';ctx.fillText(city.city,256,40,500);ctx.font='34px system-ui';ctx.fillText(`${city.properties.length} indexed places`,256,78,500);
   const texture=new THREE.CanvasTexture(canvas),label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:false,depthTest:false}));label.visible=false;label.scale.set(4.8,.94,1);label.position.copy(mesh.position);label.position.y+=.7;group.add(label);nodes.push({mesh,label});
  });draw();
 }
 function highlight(id){for(const node of nodes){const active=node.mesh.userData.id===id;node.mesh.material.color.set(active?0x1bfd9c:0xe2ffdc);node.mesh.scale.setScalar(active?1.3:1);node.label.visible=active;}draw();}
 function turn(delta){angle+=delta;draw();}function reset(){angle=0;draw();}
 function start(e){if(e.button>0)return;pointers.add(e.pointerId);if(pointers.size>1){down=null;return;}down={id:e.pointerId,x:e.clientX,y:e.clientY,last:e.clientX,drag:false};}
 function move(e){if(!down||e.pointerId!==down.id)return;if(!down.drag){if(Math.abs(e.clientY-down.y)>Math.abs(e.clientX-down.x)+8){down=null;return;}if(Math.abs(e.clientX-down.x)<8)return;down.drag=true;host.setPointerCapture(e.pointerId);}turn((e.clientX-down.last)*.006);down.last=e.clientX;}
 function end(e){pointers.delete(e.pointerId);const tap=down&&e.pointerId===down.id&&!down.drag&&e.type==='pointerup';if(tap){const r=host.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(nodes.map(n=>n.mesh))[0];if(hit)onSelect(hit.object.userData.id);}down=null;}
 function key(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(e.key==='ArrowLeft'?-.2:.2);}if(e.key==='Home'){e.preventDefault();reset();}}
 host.addEventListener('pointerdown',start);host.addEventListener('pointermove',move);host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.addEventListener('keydown',key);
 function visible(){if(!document.hidden)resize();}document.addEventListener('visibilitychange',visible);addEventListener('pageshow',resize);
 function dispose(e){if(e.persisted)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();clear();ring.geometry.dispose();ring.material.dispose();scene.traverse(node=>{if(node.geometry)node.geometry.dispose();if(node.material){for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});renderer.dispose();document.removeEventListener('visibilitychange',visible);removeEventListener('pageshow',resize);}
 addEventListener('pagehide',dispose,{once:false});resize();return {setCities,highlight,turn,reset,inspectProperty};
}
