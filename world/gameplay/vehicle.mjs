import * as T from '../../space/shared/three.module.js';
import {stepVehicle} from './vehicle-physics.mjs';
import {attachWindshield} from './windshield.mjs';
export function createWorldVehicle(scene,x,z,heading,bodyColor,profile=null,fitsRoad) {
  if(typeof fitsRoad!=='function')throw new TypeError('City road predicate required');
  const group=new T.Group();
  scene.add(group);
  function part(x,y,z,w,h,d,color,parent=group) {
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.65}));
    mesh.position.set(x,y,z); parent.add(mesh);return mesh;
  }
  part(0,.74,0,1.82,.76,4.1,bodyColor);
  const shell=[];
  const style=profile?.style||'original';
  const roofColor=style==='highroof'?'#b9c3ab':style==='compact'?'#d7d2c3':'#d6cfb2';
  shell.push(part(0,1.46,.14,1.77,.81,3.78,'#e2d7af'));
  shell.push(part(0,1.54,-1.77,1.56,.55,.04,'#465e67'));
  shell.push(part(0,1.55,2.05,1.43,.51,.04,'#435963'));
  part(0,1.91,.14,1.85,.10,3.87,roofColor);
  if(style==='highroof'){
    part(0,2.08,.27,1.67,.28,3.12,roofColor);
    for(const side of [-1,1]){part(side*.76,2.26,.18,.07,.07,3.05,'#303b39');for(const z of [-.9,.9])part(side*.84,1.99,z,.035,.12,.48,'#52676d');}
  }else if(style==='compact'){
    part(0,1.99,.45,1.70,.12,2.65,'#d8d5c5');
    part(0,1.51,2.09,.54,.45,.07,'#c7c0b0');
  }else if(style==='touring'){
    part(0,1.96,-.22,1.36,.035,1.16,'#41585d');
  }
  // Original era-inspired trim details; the original physics envelope is unchanged.
  if(profile){
    part(0,.84,-2.09,1.04,.18,.06,'#303b3b');
    for(let y=.78;y<=.9;y+=.06)part(0,y,-2.13,.98,.016,.024,'#b0b7b5');
    for(const side of [-1,1]){
      part(side*.925,1.13,-.66,.027,.035,.21,'#333d3b');
      part(side*.925,1.13,.68,.027,.035,.21,'#333d3b');
      part(side*.926,.69,.20,.028,.075,3.24,style==='highroof'?'#c9b98a':'#383f42');
      for(const z of [-.52,1.70])part(side*.926,.85,z,.027,.52,.024,'#414a49');
    }
    part(0,.63,2.155,.34,.15,.025,'#d4dad6');
    if(style==='highroof'){part(0,.58,-2.17,1.6,.11,.13,'#293333');for(const x of [-.63,.63])part(x,.73,-2.18,.19,.18,.08,'#c8d1c8');}
    if(style==='compact')part(0,.64,-2.15,1.55,.085,.09,'#a7aaa0');
  }
  part(0,.48,-2.08,1.84,.16,.13,'#454d49');
  part(0,.48,2.08,1.84,.16,.13,'#454d49');
  const wheels=[], lamps=[];
  for(const side of [-1,1]){
    for(const z of [-1.28,1.30]){
      const pivot=new T.Group();pivot.position.set(side*.85,.36,z);group.add(pivot);
      const wheel=new T.Group();pivot.add(wheel);
      const tire=new T.Mesh(new T.CylinderGeometry(.34,.34,.22,16),new T.MeshStandardMaterial({color:'#252725'}));
      tire.rotation.z=Math.PI/2;wheel.add(tire);
      part(side*.12,0,0,.035,.32,.11,'#c5c6bb',wheel);part(side*.12,0,0,.035,.11,.32,'#c5c6bb',wheel);
      wheels.push({pivot,wheel,front:z<0});
    }
    for(const z of [-1.12,.03,1.28]){
      const tint=style==='compact'&&z===1.28?'#c2b8a8':style==='highroof'?'#344b54':'#435c62';
      shell.push(part(side*.90,1.52,z,.035,.53,.92,tint));
    }
    part(side,1.28,-1.53,.2,.15,.21,'#384543');
    function lamp(z,y,color,w){return part(side*.67,y,z,w,.15,.06,color).material}
    lamps.push({side,front:lamp(-2.07,.86,'#fff0bb',.35),stop:lamp(2.08,.91,'#951f25',.28),back:lamp(2.08,.71,'#a7abad',.17),turn:[lamp(-2.08,.65,'#9b6229',.18),lamp(2.08,1.09,'#9b6229',.18)]});
  }
  const cabin=new T.Group();group.add(cabin);cabin.visible=false;
  part(0,1.18,-1.56,1.73,.19,.43,'#343a39',cabin);
  part(.49,1.31,-1.49,.43,.13,.10,'#202727',cabin);
  const gauges=[];
  for(const x of [.39,.59]){
    const gauge=new T.Mesh(new T.CircleGeometry(.065,16),new T.MeshBasicMaterial({color:'#b1c2ad'}));
    gauge.position.set(x,1.37,-1.43);cabin.add(gauge);
    const dial=new T.Group();dial.position.set(x,1.37,-1.422);cabin.add(dial);
    part(0,.023,0,.008,.049,.008,'#e3a363',dial);gauges.push({gauge,dial});
  }
  for(const side of [-1,1]){
    part(side*.45,1.13,-.48,.62,.14,.53,'#525753',cabin);
    part(side*.45,1.46,-.19,.62,.67,.11,'#525753',cabin);
    for(const z of [-1.76,.11,1.87])part(side*.82,1.52,z,.10,.76,.12,'#303633',cabin);
    part(side*.86,1.20,0,.08,.19,3.5,'#353d39',cabin);
  }
  const wheel=new T.Group();wheel.position.set(.48,1.37,-1.31);wheel.rotation.x=-.26;cabin.add(wheel);
  const rim=new T.Mesh(new T.TorusGeometry(.19,.025,8,28),new T.MeshStandardMaterial({color:'#222826'}));wheel.add(rim);
  const spokes=new T.Group();wheel.add(spokes);
  part(0,0,0,.32,.038,.032,'#292d2b',spokes);part(0,-.08,0,.038,.15,.032,'#292d2b',spokes);
  part(0,0,.015,.09,.08,.045,'#424746',spokes);
  part(-.02,1.24,-.85,.06,.14,.06,'#262c29',cabin);
  part(0,1.82,-1.61,.25,.09,.06,'#282e2b',cabin);
  const windshield=attachWindshield(T,cabin);
  function setCockpit(on){cabin.visible=on;shell.forEach(m=>m.visible=!on);}
  const beam=new T.SpotLight(0xffedc7,0,24,.48,.55,1);
  beam.position.set(0,.9,-1.9);beam.target.position.set(0,.02,-13);group.add(beam,beam.target);
  const car={x,z,heading,speed:0,steer:0,reverse:false,lights:false,signal:0,wiperMode:0};
  if(profile)car.demoId=profile.id;
  function paint(mat,color,on){mat.emissive.set(on?color:0x000000);}
  function update(dt,input,now,parked) {
    stepVehicle(car,input,dt,parked,fitsRoad);
    group.position.set(car.x,0,car.z);group.rotation.y=car.heading;
    for(const w of wheels){w.pivot.rotation.y=w.front?car.steer:0;w.wheel.rotation.x-=car.speed*dt/.34;}
    for(const l of lamps){
      paint(l.front,0xffe8b7,car.lights);paint(l.stop,0xff2632,input.brake>.03);paint(l.back,0xffffff,car.reverse);
      for(const t of l.turn)paint(t,0xffa000,l.side===car.signal && now%1<.52);
    }
    beam.intensity=car.lights?36:0;
    spokes.rotation.z=car.steer*2.4;rim.rotation.z=car.steer*2.4;
    gauges[0].dial.rotation.z=1.9-Math.min(1,Math.abs(car.speed)/10.7)*3.8;
    gauges[1].dial.rotation.z=1.9-Math.min(1,.15+Math.abs(car.speed)/15+input.gas*.28)*3.8;
    for(const {gauge} of gauges)gauge.material.color.set(car.lights?'#c0e6a9':'#68796b');
    windshield.frame(dt,cabin.visible,!!input.wet,car.wiperMode,car.speed,car.lights);
  }
  group.position.set(car.x,0,car.z);group.rotation.y=heading;
  return {car,update,setCockpit,profile};
}
