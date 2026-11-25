import {attachCitySky} from '../space/shared/weather/city-sky.mjs';
import {createMetro} from './metro.mjs';
import {suites,createInterior} from './interiors.mjs';
import * as THREE from '../space/shared/three.module.js';
import {subscribeInput} from '../space/shared/gamepad.mjs';
import {emptyInput} from '../space/shared/gamepad-model.mjs';
import {makeTile,segmentDistance,updateWater} from './streets.mjs';
import {intersectionSigns,nearestIntersection} from './signs.mjs';

const $ = selector => document.querySelector(selector);
const tiles = new Map();
const requested = new Map();
const keys = new Set();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(innerWidth<600 ? 70 : 64,innerWidth/innerHeight,.075,660);
const status = $('#scene-status'), places = $('#places'), details = $('#place'), nearby = $('#nearby');
const low = matchMedia('(pointer:coarse)').matches || (navigator.deviceMemory && navigator.deviceMemory<=4);
let geography, designs, intersections, signposts, destinations, properties, sources, businesses, renderer, ray, yaw=0, pitch=0, input=emptyInput();
let pointer, current, tileCenter, travel=0, last=0, lastNearby=0, moving=false;

const markers=[];
const doorSuites=new Map();
const failures = new Map();

async function json(path) {
  const result=await fetch(new URL(path,import.meta.url));
  if(!result.ok) throw Error('Could not load '+path);
  return result.json();
}

function label(tag,text,parent) {
  const el=document.createElement(tag);
  el.textContent=text;
  parent?.append(el);
  return el;
}
function link(text,href,parent) {
  const el=label('a',text,parent);
  el.href=href;
  if (href.startsWith('https:')) {
    el.target='_blank';
    el.rel='noopener noreferrer';
  }
  return el;
}
function tileId(x,z) {
  return `${Math.floor(x/geography.tileSize)}_${Math.floor(z/geography.tileSize)}`;
}
function tileKeys(x,z) {
  const [column,row]=tileId(x,z).split('_').map(Number);
  return geography.tiles
    .map(key=>({key,distance:Math.hypot(...key.split('_').map((n,i)=>Number(n)-(i ? row : column)))}))
    .filter(entry=>entry.distance<=(low ? 1.43 : 2.24))
    .sort((a,b)=>a.distance-b.distance);
}
function loadTile(key) {
  if (requested.has(key)) return requested.get(key);
  if (tiles.has(key)||performance.now()<(failures.get(key)||0)) return;
  const task=json(`geography/${key}.json`).then(data=>{
    const tile=makeTile(data,designs,true);
    tiles.set(key,tile);
    scene.add(tile.group);
    if(tileCenter) setVisibility(...tileCenter);
  }).catch(error=>{
    console.warn(error);
    failures.set(key,performance.now()+5000);
  }).finally(()=>requested.delete(key));
  requested.set(key,task);
  return task;
}
function setVisibility(x,z) {
  const near=new Map(tileKeys(x,z).map(({key,distance})=>[key,distance]));
  for(const [key,tile] of tiles) {
    const distance=near.get(key);
    tile.group.visible=distance!==undefined;
    if(tile.trim) tile.trim.visible=distance<=(low ? 1 : 1.43);
    if(distance===undefined && tiles.size>16) {
      scene.remove(tile.group);
      tile.group.traverse(node=>{if(node.isMesh && !node.isInstancedMesh) node.geometry.dispose();});
      tiles.delete(key);
    }
  }
}
function refreshTiles(x,z) {
  const key=tileId(x,z);
  if (!tileCenter || tileId(...tileCenter)!==key) {
    tileCenter=[x,z];
    setVisibility(x,z);
  }
  // Prioritize the current street and start neighbor requests as slots open.
  for(const {key} of tileKeys(x,z)) {
    if(requested.size>=4) break;
    loadTile(key);
  }
}
function collisionTiles(x,z) {
  const key=tileId(x,z);
  if(!tiles.has(key)) return null;
  const axis=geography.tileSize;
  const [a,b]=key.split('_').map(Number);
  const these=[tiles.get(key)];
  const dx=x-a*axis, dz=z-b*axis;
  // A building is assigned once by its representative point but can cross a tile edge.
  const ix=dx<100 ? a-1 : dx>axis-100 ? a+1 : a;
  const iz=dz<100 ? b-1 : dz>axis-100 ? b+1 : b;
  for (const near of new Set([`${ix}_${b}`,`${a}_${iz}`,`${ix}_${iz}`])) {
    if(near!==key && tiles.has(near)) these.push(tiles.get(near));
  }
  return these;
}
function surface(x,z) {
  if(indoor) return indoor.clear(x,z)?0:null;
  const [minX,minZ,maxX,maxZ]=geography.bounds;
  if(x<minX+.5||x>maxX-.5||z<minZ+.5||z>maxZ-.5) return null;
  const nearbyTiles=collisionTiles(x,z);
  if(!nearbyTiles) return null;
  let blocked=false, river=false, deck=0, onFootpath=false;
  for(const tile of nearbyTiles) {
    if(tile.blockers.some(test=>test(x,z))) blocked=true;
    if(tile.water.some(test=>test(x,z))) river=true;
    for(const [a,b,width,height,kind] of tile.decks) {
      if (segmentDistance(x,z,a,b)>width) continue;
      if (kind==='footway'||kind==='cycleway'||kind==='path') onFootpath=true;
      deck=Math.max(deck,height);
    }
  }
  if(blocked||(river&&!onFootpath)) return null;
  return deck;
}
function intersectionRecord(corner) {
  return {
    id:'intersection-'+corner.osmNode,
    name:corner.blades.map(blade=>blade.name).join(' & '),
    shortName:corner.blades.map(blade=>blade.label).join(' / '),
    district:'Street intersection · Washington, D.C.',
    arrival:corner.arrival,
    lookAt:corner.post,
    sourceUrl:'https://www.openstreetmap.org/node/'+corner.osmNode,
    kind:'intersection',
  };
}
function record(id) {
  if(id?.startsWith('intersection-')) {
    const corner=intersections.find(value=>id==='intersection-'+value.osmNode);
    return corner ? intersectionRecord(corner) : undefined;
  }
  const property=properties.get(id);
  if(property) return {...property.spaceDestination,id,name:property.name,property};
  return destinations.get(id);
}
function statusFor(property) {
  return property.physical.status==='occupied' ? 'Operator-listed occupancy' : 'Physical occupancy unknown';
}
function populateList() {
  const needle=$('#place-search').value.trim().toLowerCase();
  const list=$('#place-list');
  list.replaceChildren();
  const rows=[...destinations.values()].filter(row=>row.arrival);
  rows.push(...[...properties.values()].map(property=>record(property.id)));
  if(needle) rows.push(...intersections.map(intersectionRecord));
  rows.push(...[...destinations.values()].filter(row=>!row.arrival));
  for(const row of rows) {
    const subtitle=row.property ? row.property.address.line1 : row.address ? row.kind+' · '+row.address : row.district;
    if(!`${row.name} ${row.shortName||''} ${subtitle} ${row.property?.description||''}`.toLowerCase().includes(needle)) continue;
    const button=label('button',row.name,list);
    label('small',subtitle+(row.arrival?'':' · '+(row.property || row.address ? 'Catalog only' : 'Planned')),button);
    button.addEventListener('click',()=>{
      places.close();
      if(row.arrival && !row.property && !row.address && row.kind!=='intersection'&&row.id!=='anacostia-metro') arrive(row);
      else showPlace(row);
    });
  }
  if(!list.childElementCount) label('p','No matching places.',list);
}
let indoor=null, streetPose;
const rooms=new Map();
let adultConfirmed=false;
function requestDispensaryEntry(suite) {
  if(adultConfirmed) return enterSuite(suite);
  $('#place-title').textContent='Are you 21 or older?';
  const body=$('#place-details');
  body.replaceChildren();
  label('p','Confirm your age to enter the HQ2 virtual dispensary.',body);
  const leave=label('button','Leave',body);
  leave.onclick=()=>details.close();
  const confirm=label('button','Yes, I am 21 or older',body);
  confirm.onclick=()=>{adultConfirmed=true;enterSuite(suite);};
  leave.focus();
}
function pickupPreview() {
  if(!adultConfirmed||!indoor) return;
  $('#place-title').textContent='Pickup preview';
  const body=$('#place-details');
  body.replaceChildren();
  label('p','Try a sample pickup request. This demo stays on your device.',body);
  const button=label('button','Prepare sample request',body);
  button.onclick=()=>{
    body.replaceChildren();
    label('p','Sample pickup request prepared. Retailer verification pending. Nothing has been submitted or reserved.',body);
    link('DC patient registration information','https://abca.dc.gov/page/medical-cannabis-reciprocity',body);
  };
  details.showModal();
}
let metro;
function enterMetro() {
  details.close();
  ++travel;
  status.hidden=true;
  metro??=createMetro();
  metro.reset();railDisplay='';
  indoor=metro;
  moving=true;current=null;nearby.hidden=true;
  $('#map-button').hidden=true;
  $('#current-street').hidden=false;
  camera.position.set(-3.5,1.68,3);yaw=-.72;pitch=0;
  renderer.domElement.focus();
  updateMetro();
}
function leaveMetro() {
  indoor=null;current=null;nearby.hidden=true;
  $('#rail-actions').hidden=true;
  $('#map-button').hidden=false;
  $('#exit-suite').hidden=true;
  $('h1').textContent='Historic Anacostia';
  arrive(record('anacostia-metro'));
}
let railDisplay='';
function updateMetro() {
  const display=[metro.name,metro.next,metro.aboard,metro.riding,Math.abs(camera.position.z)>3].join('|');
  if(display===railDisplay) return;
  railDisplay=display;
  $('h1').textContent=metro.riding?'Next · '+metro.next:metro.name;
  $('#current-street').textContent='Green Line · Virtual service';
  $('#exit-suite').hidden=!metro.atStreet;
  $('#rail-actions').hidden=false;
  for(const [id,dir] of [['rail-north',-1],['rail-south',1]]) {
    const button=$('#'+id), next=metro.adjacent(dir);
    button.hidden=!metro.aboard||metro.riding||!next;
    if(next) button.textContent='Ride to '+next;
  }
  nearby.hidden=metro.riding||(!metro.aboard&&Math.abs(camera.position.z)>3);
  nearby.textContent=metro.aboard?'Step onto platform':'Board train';
}
function boardMetro() {
  if(nearby.hidden||metro.riding) return;
  metro.toggle();
  camera.position.set(metro.aboard?0:-3.5,1.68,metro.aboard?2:1);
  yaw=metro.aboard?0:-.72;pitch=0;
  renderer.domElement.focus();updateMetro();
}
function enterSuite(suite) {
  if(suite.type==='dispensary'&&!adultConfirmed) return requestDispensaryEntry(suite);
  details.close();
  streetPose={position:camera.position.clone(),yaw,pitch,moving};
  if(!rooms.has(suite)) rooms.set(suite,createInterior(suite));
  indoor=rooms.get(suite);
  camera.position.set(0,1.68,indoor.spawn);
  yaw=0; pitch=0; moving=true; current=null; nearby.hidden=true;
  $('#current-street').hidden=false;
  $('#current-street').textContent=suite.address+' · Virtual concept';
  $('h1').textContent=suite.title;
  $('#map-button').hidden=true;
  $('#exit-suite').hidden=false;
  renderer.domElement.focus();
}
function exitSuite() {
  if(!indoor) return;
  if(indoor===metro) return leaveMetro();
  indoor=null; current=null; nearby.hidden=true;
  camera.position.copy(streetPose.position);
  ({yaw,pitch,moving}=streetPose);
  $('#map-button').hidden=false;
  $('#exit-suite').hidden=true;
  $('h1').textContent='Historic Anacostia';
  lastNearby=0;
  renderer.domElement.focus();
}
function activate(target) {
  if(!target) return;
  if(doorSuites.has(target)) return enterSuite(doorSuites.get(target));
  if(!indoor) return showPlace(record(target));
  if(target.userData.pickup) return pickupPreview();
  const app=target.userData.application;
  $('#place-title').textContent='1AGE '+app.name;
  const body=$('#place-details');
  body.replaceChildren();
  label('p',app.description,body);
  link('Open 1AGE '+app.name,app.url,body);
  details.showModal();
}
function storefrontDoor(sign,suite) {
  const id='entry-'+suite.parent;
  doorSuites.set(id,suite);
  const normal=new THREE.Vector2(sign.arrival[0]-sign.face[0],sign.arrival[1]-sign.face[1]).normalize();
  const door=new THREE.Group();
  door.rotation.y=Math.atan2(normal.x,normal.y);
  door.position.set(sign.face[0]+normal.x*.22,0,sign.face[1]+normal.y*.22);
  function piece(w,h,d,x,y,z,color) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));
    mesh.position.set(x,y,z);door.add(mesh);
    mesh.userData.id=id;
    return mesh;
  }
  piece(1.55,2.48,.12,0,1.24,0,'#383c38');
  const glass=piece(1.32,2.27,.08,0,1.19,.09,'#496c70');
  piece(.045,.56,.09,.47,1.14,.18,'#d8c6a3');
  scene.add(door);
  door.updateMatrixWorld(true);
  const world=glass.getWorldPosition(new THREE.Vector3());
  glass.userData.streetPosition=world;
  markers.push(glass);
}
function showPlace(row) {
  if(!row) return;
  $('#place-title').textContent=row.name;
  const body=$('#place-details');
  body.replaceChildren();
  const property=row.property;
  if(property) {
    label('p',property.address.line1+', Washington, D.C.',body);
    label('p',property.description,body);
    label('p',statusFor(property)+' · Virtual space reserved by 1AGE Space.',body);
    if(property.operatingNotice) label('p',property.operatingNotice.text,body);
    if(property.leasingNotice) label('p',property.leasingNotice.text,body);
    const tenants=property.businessIds.map(id=>businesses.get(id)?.name).filter(Boolean);
    if(tenants.length) label('p',tenants.join(' · '),body);
    const evidence=label('ul','',body);
    for(const id of property.verification.sourceIds) {
      const source=sources.get(id);
      if(source?.url) link(source.title,source.url,label('li','',evidence));
    }
    for(const suite of suites.filter(item=>item.parent===property.id)) {
      label('p',suite.address+' · '+(suite.area?suite.area.toLocaleString('en-US')+' sq ft advertised. Original virtual layout.':'Original concept based on the operator’s published services. Dimensions estimated.'),body);
      const enter=label('button','Enter '+suite.title,body);
      enter.className='detail-button';
      enter.onclick=()=>enterSuite(suite);
    }
    link('Shared catalog record','../catalog.html?property='+encodeURIComponent(property.id),body);
  } else {
    label('p',row.address ? row.kind+' · '+row.address : row.district + (row.arrival ? ' · Public exterior' : ' · Planned destination'),body);
    if(row.id==='anacostia-metro') label('button','Enter Green Line platform',body).onclick=enterMetro;
    const suite=suites.find(item=>item.parent===row.id);
    if(suite) {
      if(suite.type==='grocery') label('p','Original virtual interior. Layout, dimensions and stock are illustrative.',body);
      const entry=label('button',suite.type==='dispensary'?'Enter virtual dispensary':'Enter virtual corner store',body);
      entry.className='detail-button';
      entry.onclick=()=>enterSuite(suite);
    }
    if(row.statusNote) label('p',row.statusNote,body);
    if(row.protectionZoneId) label('p','Public exploration in designated areas. Reserved from acquisition in 1AGE Space.',body);
    if(row.kind==='education') {
      label('p','An original 1AGE educational institution. Independent of the U.S. Department of the Treasury.',body);
      const list=label('ul','',body);
      row.plannedRooms.forEach(name=>label('li',name,list));
    }
    const url=row.sourceUrl;
    if(url) link('Public reference',url,body);
  }
  if(row.arrival) {
    const button=label('button','Walk from here',body);
    button.className='detail-button';
    button.addEventListener('click',()=>{details.close();arrive(row);});
  }
  details.showModal();
}
async function arrive(row,{historyMode=true,focus=true}={}) {
  const request=++travel;
  moving=false;
  status.hidden=false;
  status.textContent='Loading '+row.name+'…';
  const [x,z]=row.arrival;
  const tile=tileId(x,z);
  failures.delete(tile);
  const loading=loadTile(tile);
  refreshTiles(x,z);
  await loading;
  if(request!==travel) return;
  if(!tiles.has(tile)) {
    status.textContent='Street data could not load. Open Places to try again.';
    return;
  }
  let position=row.arrival;
  if(surface(x,z)===null) {
    const candidates=[[3,0],[-3,0],[0,3],[0,-3],[6,0],[-6,0],[0,6],[0,-6],[12,0],[-12,0],[0,12],[0,-12]];
    position=candidates.map(([dx,dz])=>[x+dx,z+dz]).find(([a,b])=>surface(a,b)!==null);
    if(!position) {status.textContent='This arrival is temporarily unavailable.';return;}
  }
  camera.position.set(position[0],1.68+(surface(...position)||0),position[1]);
  const [tx,tz]=row.lookAt;
  yaw=Math.atan2(position[0]-tx,position[1]-tz);
  pitch=row.kind==='intersection' ? .28 : -.015;
  camera.rotation.set(pitch,yaw,0,'YXZ');
  const url=new URL(location.href);
  if(row.id==='hq2-gateway') url.searchParams.delete('destination');
  else url.searchParams.set('destination',row.id);
  if(historyMode && url.href!==location.href) history.pushState(null,'',url);
  status.hidden=true;
  moving=true;
  if(focus) renderer.domElement.focus({preventScroll:true});
  refreshTiles(...position);
}
function makeStorefrontSign(sign) {
  const canvas=document.createElement('canvas');
  canvas.width=512; canvas.height=80;
  const context=canvas.getContext('2d');
  context.fillStyle=sign.text==='GROUNDED'?'#374633':'#282d2c';
  context.fillRect(0,0,512,80);
  context.strokeStyle='#b5a98d';
  context.strokeRect(5,5,502,70);
  context.fillStyle='#f5e9ce';
  context.textAlign='center';
  context.textBaseline='middle';
  context.font='700 36px system-ui';
  context.fillText(sign.text,256,40,466);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const width=Math.min(8.6,Math.max(3.4,sign.text.length*.36));
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width*80/512),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  const n=new THREE.Vector2(sign.arrival[0]-sign.face[0],sign.arrival[1]-sign.face[1]).normalize();
  mesh.position.set(sign.face[0]+n.x*.33,3.24,sign.face[1]+n.y*.33);
  mesh.rotation.y=Math.atan2(n.x,n.y);
  mesh.userData.id=sign.propertyId||sign.destinationId;
  scene.add(mesh);
  if(mesh.userData.id) markers.push(mesh);
  // The creator hall shares the Gateway registry record and has a separate street address.
  const suite=suites.find(item=>item.parent===mesh.userData.id&&item.type!=='market');
  if(suite) storefrontDoor(sign,suite);
}
function streetscape() {
  const postGeometry=new THREE.CylinderGeometry(.055,.079,5.3,8);
  const postMaterial=new THREE.MeshLambertMaterial({color:'#676d62'});
  const lampGeometry=new THREE.BoxGeometry(.65,.19,.35);
  const lampMaterial=new THREE.MeshLambertMaterial({color:'#778078'});
  for (const [x,z] of [[12,-27],[-14,-48],[-12,19],[18,1],[33,6],[73,16],[124,29],[-24,50],[-49,91],[-30,112]]) {
    const post=new THREE.Mesh(postGeometry,postMaterial);
    post.position.set(x,2.64,z);
    const lamp=new THREE.Mesh(lampGeometry,lampMaterial);
    lamp.position.set(x+.22,5.22,z);
    scene.add(post,lamp);
  }

}
function skyDome() {
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{skyColor:{value:new THREE.Color()},cover:{value:0},sunGlow:{value:0},clock:{value:0}},
    vertexShader:`varying vec3 direction;
      void main(){ direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec3 direction;
      uniform vec3 skyColor;
      uniform float cover,sunGlow,clock;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);
        f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
      }
      void main(){
        vec3 ray=normalize(direction);
        float height=smoothstep(-.06,.63,ray.y);
        vec3 color=skyColor*mix(1.14,.82,height);
        vec2 p=ray.xz*3./max(.18,ray.y+.18)+vec2(clock*.008,0.);
        float cloud=smoothstep(.27,.70,.68*noise(p)+.32*noise(2.3*p));
        color=mix(color,skyColor*mix(.69,1.30,cloud),cover*smoothstep(-.04,.18,ray.y));
        float sun=pow(max(0.,dot(ray,normalize(vec3(-.52,.42,.50)))),29.);
        gl_FragColor=vec4(mix(color,vec3(.94,.84,.68),sun*sunGlow),1.);
        #include <colorspace_fragment>
      }`,
  });
  const dome=new THREE.Mesh(new THREE.SphereGeometry(610,24,12),material);
  dome.renderOrder=-100;
  scene.add(dome);
  return dome;
}
let skyMesh,weatherTick,daylight,lastWeatherLabel;
const weatherLabel=$('#weather');
function frame(now) {
  const dt=Math.min(.05,(now-(last||now))/1000);
  const railDt=(now-(last||now))/1000;
  last=now;
  if(moving&&!places.open&&!details.open) {
    const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+input.move.x;
    const z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))+input.move.y;
    yaw-=input.look.x*2*dt;
    pitch=THREE.MathUtils.clamp(pitch-input.look.y*1.5*dt,-1.15,1.15);
    const factor=5.8*dt/Math.max(1,Math.hypot(x,z));
    const px=camera.position.x+(Math.cos(yaw)*x+Math.sin(yaw)*z)*factor;
    const pz=camera.position.z+(-Math.sin(yaw)*x+Math.cos(yaw)*z)*factor;
    if(surface(px,camera.position.z)!==null) camera.position.x=px;
    if(surface(camera.position.x,pz)!==null) camera.position.z=pz;
    const floor=surface(camera.position.x,camera.position.z)||0;
    camera.position.y=THREE.MathUtils.lerp(camera.position.y,1.68+floor,Math.min(1,12*dt));
    camera.rotation.set(pitch,yaw,0,'YXZ');
    if(!indoor) refreshTiles(camera.position.x,camera.position.z);
    if(metro&&indoor===metro) {
      metro.tick(Math.min(.25,railDt));updateMetro();
    } else if(indoor) {
      current=indoor.stations.filter(screen=>screen.position.distanceTo(camera.position)<3.4)
        .sort((a,b)=>a.position.distanceTo(camera.position)-b.position.distanceTo(camera.position))[0];
      nearby.hidden=!current;
      if(current) nearby.textContent=current.userData.pickup?'Preview pickup':'Explore 1AGE '+current.userData.application.name;
    }
    if(!indoor&&now-lastNearby>150) {
      current=markers.map(marker=>{const p=marker.userData.streetPosition||marker.position;return {id:marker.userData.id,distance:Math.hypot(p.x-camera.position.x,p.z-camera.position.z)};})
        .filter(marker=>marker.distance<(doorSuites.has(marker.id)?3:21)).sort((a,b)=>Number(doorSuites.has(b.id))-Number(doorSuites.has(a.id))||a.distance-b.distance)[0]?.id;
      nearby.hidden=!current;
      if(current) nearby.textContent=doorSuites.has(current)?'Enter '+doorSuites.get(current).title:record(current)?.name||'Place details';
      const corner=nearestIntersection(intersections,camera.position.x,camera.position.z);
      const name=corner?.blades.map(blade=>blade.label).join(' / ')||'';
      const street=$('#current-street');
      if(street.textContent!==name) street.textContent=name;
      street.hidden=!name;
      for(const post of signposts.children) post.visible=post.position.distanceTo(camera.position)<140;
      lastNearby=now;
    }
  }
  for(const marker of markers) marker.visible=(marker.userData.streetPosition||marker.position).distanceTo(camera.position)<115;
  weatherTick(dt,camera,Boolean(indoor));
  if(!indoor){
    const uniforms=skyMesh.material.uniforms;
    uniforms.skyColor.value.copy(scene.background);
    uniforms.sunGlow.value=Math.max(0,(daylight.intensity-.12)/2.35)*.42;
    if(lastWeatherLabel!==weatherLabel.textContent){
      lastWeatherLabel=weatherLabel.textContent;
      uniforms.cover.value=/partly|few clouds/i.test(lastWeatherLabel) ? .48 :
        /cloud|overcast|rain|snow|storm|fog|mist|drizzle|haze/i.test(lastWeatherLabel) ? .9 : .06;
    }
    uniforms.clock.value=now/1000;
    scene.fog.density=(low?.006:.0047)*180/scene.fog.far;
  }
  skyMesh.position.copy(camera.position);
  updateWater(now/1000);
  renderer.render(indoor?.scene||scene,camera);
}
function bind(canvas) {
  const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']);
  addEventListener('keydown',event=>{
    if(places.open||details.open||event.target.closest?.('button,input,a')) return;
    if(movementKeys.has(event.code)) {event.preventDefault();keys.add(event.code);}
    if(event.code==='KeyE'&&!event.repeat) {
      if(metro&&indoor===metro) boardMetro();
      else if(current) activate(current);
    }
  });
  addEventListener('keyup',event=>keys.delete(event.code));
  addEventListener('blur',()=>{keys.clear();pointer=null;input=emptyInput();});
  subscribeInput(state=>{input=state;});
  for(const dialog of [places,details]) dialog.addEventListener('close',()=>{keys.clear();});
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0||pointer) return;
    canvas.focus({preventScroll:true});
    canvas.setPointerCapture(event.pointerId);
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,distance:0};
  });
  canvas.addEventListener('pointermove',event=>{
    if(pointer?.id!==event.pointerId) return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    yaw-=dx*.004;
    pitch=THREE.MathUtils.clamp(pitch-dy*.004,-1.15,1.15);
    pointer={...pointer,x:event.clientX,y:event.clientY,distance:pointer.distance+Math.hypot(dx,dy)};
  });
  for(const name of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(name,event=>{
    if(pointer?.id!==event.pointerId) return;
    if(name==='pointerup'&&pointer.distance<7) {
      const bounds=canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(2*(event.clientX-bounds.left)/bounds.width-1,1-2*(event.clientY-bounds.top)/bounds.height),camera);
      const hit=ray.intersectObjects(indoor?indoor.stations:markers).find(item=>item.object.visible&&item.distance<(indoor?4:24));
      if(hit) activate(indoor?hit.object:hit.object.userData.id);
    }
    pointer=null;
  });
  $('#map-button').addEventListener('click',()=>{keys.clear();populateList();places.showModal();});
  nearby.addEventListener('click',()=>metro&&indoor===metro?boardMetro():activate(current));
  for(const [id,dir] of [['rail-north',-1],['rail-south',1]]) $('#'+id).onclick=()=>{metro.depart(dir);updateMetro();renderer.domElement.focus();};
  $('#place-search').addEventListener('input',populateList);
  for(const dialog of [places,details]) dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.fov=innerWidth<600 ? 70 : 64;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight,false);
  });
}
async function start() {
  const [geo,style,region,catalog,streetData]=await Promise.all([
    json('geography/index.json'),json('designs.json'),json('../space/data/dmv.json'),json('../space/data/catalog.json'),
    json('geography/intersections.json'),
  ]);
  geography=geo;
  designs=style;
  intersections=streetData;
  destinations=new Map(region.destinations.map(row=>[row.id,{...row,sourceUrl:region.sources[row.source]}]));
  properties=new Map(catalog.properties.filter(row=>row.protection?.zoneId==='hq2').map(row=>[row.id,row]));
  sources=new Map(catalog.sources.map(row=>[row.id,row]));
  businesses=new Map(catalog.businessProfiles.map(row=>[row.id,row]));
  try {
    renderer=new THREE.WebGLRenderer({antialias:!low,powerPreference:low?'low-power':'default'});
  } catch {
    status.replaceChildren('3D rendering is unavailable. ',link('Browse the Space catalog','../catalog.html'));
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,low?1.28:1.6));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Street view. Walk with WASD or the left joystick.');
  $('#district').append(renderer.domElement);
  const sky='#b3c4ca';
  scene.background=new THREE.Color(sky);
  scene.fog=new THREE.FogExp2(sky,low?.006:.0047);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshLambertMaterial({color:'#77765d'}));
  ground.rotation.x=-Math.PI/2;
  ground.position.y=-.013;
  const ambient=new THREE.HemisphereLight('#f2f7ff','#9b9281',2.25);
  scene.add(ground,ambient);
  const light=new THREE.DirectionalLight('#ffe7bc',2.15);
  light.position.set(-90,80,110);
  scene.add(light);
  skyMesh=skyDome();
  daylight=light;
  weatherTick=attachCitySky({scene,sun:light,ambient,station:'KDCA',latitude:38.86,longitude:-76.99,
    timeZone:'America/New_York',status:weatherLabel});
  streetscape();
  const station=record('anacostia-metro');
  const [sx,sz]=station.arrival;
  makeStorefrontSign({text:'ANACOSTIA · GREEN LINE',destinationId:station.id,arrival:station.arrival,face:[sx-3,sz+2]});
  signposts=intersectionSigns(intersections);
  scene.add(signposts);
  Object.values(designs).forEach(design=>design.signs.forEach(makeStorefrontSign));

  ray=new THREE.Raycaster();
  bind(renderer.domElement);
  $('#exit-suite').onclick=exitSuite;
  const enter=()=>{
    exitSuite();
    const target=record(new URL(location.href).searchParams.get('destination'));
    arrive(target?.arrival ? target : record('hq2-gateway'),{historyMode:false,focus:false});
    if(target&&!target.arrival) showPlace(target);
  };
  addEventListener('popstate',enter);
  enter();
  renderer.setAnimationLoop(frame);
}
start().catch(error=>{
  console.error(error);
  status.replaceChildren('Historic Anacostia could not load. ',link('Browse the Space catalog','../catalog.html'));
});
