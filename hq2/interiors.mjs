import * as T from '../space/shared/three.module.js';

export const applications=[
  ['Page','Explore orbital profiles and social links.'],
  ['Space','Discover virtual spaces and commercial properties.'],
  ['Games','Explore the 1AGE games platform.'],
  ['Exchange','Explore the virtual financial platform.'],
  ['Quest','Discover learning and exploration quests.'],
  ['Cash','Explore the 1AGE account credit platform.'],
].map(([name,description])=>({name,description,url:'https://1age.'+name.toLowerCase()+'/'}));

const gateway='place-us-washington-mlk-gateway-phase-2';
export const suites=[
  {parent:'anacostia-organics',title:'Dispensary reception study',address:'2022 Martin Luther King Jr. Avenue SE',type:'dispensary'},
  {parent:gateway,title:'HQ2 application showroom',address:'1911 Martin Luther King Jr. Avenue SE',area:1519,type:'apps'},
  {parent:gateway,title:'Creator market hall',address:'1111 Marion Barry Avenue SE',area:2205,type:'market'},
  {parent:'place-us-washington-grounded-1913',title:'Plant shop & café study',address:'1913 Martin Luther King Jr. Avenue SE',type:'plants'},
];

function sign(text,width) {
  const canvas=document.createElement('canvas');
  canvas.width=768; canvas.height=128;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#142d31'; ctx.fillRect(0,0,768,128);
  ctx.fillStyle='#c7f7df'; ctx.font='bold 60px system-ui'; ctx.textAlign='center';
  ctx.fillText(text,384,84,710);
  const map=new T.CanvasTexture(canvas);
  map.colorSpace=T.SRGBColorSpace;
  return new T.Mesh(new T.PlaneGeometry(width,width/6),new T.MeshBasicMaterial({map}));
}

export function createInterior(suite) {
  const scene=new T.Scene(), obstacles=[], stations=[];
  const width=suite.type==='market'?13:10;
  const depth=suite.area?suite.area*.09290304/width:11;
  const cube=new T.BoxGeometry(), materials=new Map();
  function box(x,y,z,w,h,d,color,solid=false) {
    if(!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({color,roughness:.7}));
    const mesh=new T.Mesh(cube,materials.get(color));
    mesh.scale.set(w,h,d); mesh.position.set(x,y,z);scene.add(mesh);
    if(solid) obstacles.push([x-w/2-.24,x+w/2+.24,z-d/2-.24,z+d/2+.24]);
  }
  function panel(text,x,y,z,w) {
    const mesh=sign(text,w);mesh.position.set(x,y,z);scene.add(mesh);return mesh;
  }
  const back=-depth/2, side=width/2, wall=suite.type==='plants'?'#afb99c':'#b8ada0';
  box(0,-.09,0,width,.18,depth,'#8c7561');
  for(let x=-side+.55;x<side;x+=.55) box(x,.005,0,.012,.012,depth,'#6b584b');
  box(0,2,back-.09,width,4,.18,wall);
  box(0,2,-back+.09,width,4,.18,wall);
  for(const x of [-side-.09,side+.09]) box(x,2,0,.18,4,depth,wall);
  box(0,4.06,0,width,.12,depth,'#d5d0be');
  for(let z=back+1;z<-back;z+=3) {
    box(0,3.85,z,width,.16,.2,'#554c43');
    box(0,3.74,z,width*.65,.035,.08,'#fff5d1');
  }
  panel(suite.title,0,2.85,back+.12,width*.69);
  if(suite.type==='dispensary') {
    box(0,.53,back+2.3,4,1.06,1.15,'#726955',true);
    box(0,1.10,back+2.3,4.18,.1,1.26,'#d9cbb2');
    const counter=panel('PICKUP PREVIEW',0,1.45,back+2.73,1.75);
    counter.userData.pickup=true;
    stations.push(counter);
    for(const x of [-3.1,3.1]) box(x,.26,.3,1.7,.52,.75,'#648078',true);
  } else if(suite.type==='plants') {
    function plant(x,z,h) {
      box(x,.36,z,.62,.72,.62,'#af7554',true);
      box(x,.72+h/2,z,.07,h,.07,'#79694f');
      for(let i=0;i<7;i++) {
        const leaf=new T.Mesh(new T.SphereGeometry(1,8,6),new T.MeshStandardMaterial({color:i%2?'#668446':'#496c44'}));
        const angle=i*2.4;leaf.scale.set(.28,.53,.19);leaf.rotation.z=Math.sin(angle)*.67;
        leaf.position.set(x+.24*Math.cos(angle),.8+h*.6+i*.08,z+.24*Math.sin(angle));scene.add(leaf);
      }
    }
    for(let i=0;i<4;i++) plant(-side+1,back+2+i*2,1+i%2*.46);
    box(side-1.3,.54,-1,1.5,1.08,3.5,'#856446',true);
    box(side-1.3,1.12,-1,1.66,.09,3.65,'#dcd0b6');
    panel('CAFÉ',side-1.35,1.55,-2.2,1.1);
    for(const x of [-1.7,.2]) box(x,.035,back+2,.68,.07,1.75,'#677b70');
  } else {
    for(let i=0;i<6;i++) {
      const x=(i%2?1:-1)*(side-1.45),z=back+2.1+Math.floor(i/2)*3.7;
      box(x,.49,z,1.95,.98,1.1,'#645247',true);
      box(x,1.03,z,2.1,.1,1.24,'#b49a76');
      if(suite.type==='apps') {
        box(x,1.52,z-.32,1.35,.82,.12,'#28373b');
        const face=panel(applications[i].name.toUpperCase(),x,1.53,z-.24,1.21);
        face.userData.application=applications[i];
        stations.push(face);
      } else {
        for(const dx of [-.86,.86]) box(x+dx,1.8,z,.08,1.6,.08,'#5d4940');
        box(x,2.65,z,2.15,.13,1.49,i%2?'#48736e':'#b77251');
        panel('STUDIO '+(i+1),x,2.5,z+.65,1.3);
      }
    }
  }
  scene.add(new T.HemisphereLight('#fff2dd','#a08b77',2.2));
  const lamp=new T.PointLight('#fff2d2',85,30,2);lamp.position.set(0,3.45,0);scene.add(lamp);
  return {scene,stations,spawn:depth/2-1,clear(x,z){
    return Math.abs(x)<side-.28&&Math.abs(z)<depth/2-.28&&!obstacles.some(([a,b,c,d])=>x>a&&x<b&&z>c&&z<d);
  }};
}
