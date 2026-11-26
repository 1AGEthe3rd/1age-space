// Local scene coordinates use the Kenton platform as their origin.
export const kentonStation='Kenton/N Denver Ave';
export const kentonStreets=[
  {x:-22,name:'N McClellan St'},
  {x:-50,name:'N Kilpatrick St'},
  {x:-78,name:'N Schofield St'}
];
export const insideKentonStudio=(x,z)=>x>-43.5&&x<-28.5&&z>=10&&z<16.3;
export function kentonWalkable(x,z){
  if(insideKentonStudio(x,z))return true;
  if(x>=-43.5&&x<=-28.5&&z>=8.95&&z<10)return Math.abs(x+36)<1.05;
  if(x>=-82&&x<=-4&&Math.abs(z)<8.95)return true;
  return kentonStreets.some(s=>Math.abs(s.x-x)<2.9&&Math.abs(z)<21);
}
export function buildKenton({box,sign,group,origin}){
  const add=(x,y,z,w,h,d,color)=>box(group,x,y,origin+z,w,h,d,color);
  function label(text,x,y,z,width,angle=0){
    const face=sign(group,text,x,y,origin+z);face.scale.setScalar(width/6);face.rotation.y=angle;
  }
  add(-44,-.23,0,80,.40,19,'#bab19e');
  add(-44,-.035,0,80,.05,11,'#565a56');
  for(const {x,name} of kentonStreets){
    add(x,-.24,0,8,.43,46,'#aba79d');
    add(x,-.008,0,6.8,.03,43,'#565a56');
    for(const side of [-1,1]){
      for(let lane=-4.6;lane<5;lane+=1.2)add(x+side*4.15,.018,lane,1.4,.02,.54,'#e7dfcf');
    }
    add(x+3.9,1.6,-6.45,.13,3.2,.13,'#61675d');
    label(name,x+4,3.19,-6.45,3,Math.PI/2);
    label('N Denver Ave',x+4,2.82,-6.45,2.8);
  }
  for(const x of [-13,-36,-64]){
    for(const side of [-1,1]){
      if(x===-36&&side===1)continue;
      const w=x===-13?8:16,h=x===-64?6.9:4.5;
      const trim=side>0?'#4f655b':'#505961';
      add(x,h/2-.04,side*14,w,h,9.6,x===-13?'#bb956e':side>0?'#b58b6f':'#a37662');
      for(const dx of [-w*.30,0,w*.30]){
        add(x+dx,1.58,side*9.15,w*.23,2.3,.12,'#576f70');
        if(h>6)add(x+dx,5.05,side*9.13,w*.18,1.25,.14,'#4f666b');
      }
      add(x,3.05,side*8.83,w+.12,.16,.88,trim);
      add(x,h-.14,side*9.12,w+.1,.16,.26,'#ccbda6');
    }
    add(x,2.63,-7.6,.14,5.26,.14,'#535f56');
    add(x,5.2,-7.24,.48,.18,.92,'#ebe1bf');
  }
  // Open-front original studio with a central doorway and display shelves behind glass.
  add(-36,.01,13.55,16,.10,9.2,'#b8a88d');
  add(-36,2.2,18.12,16,4.4,.24,'#a17f65');
  for(const side of [-1,1]){
    add(-36+side*7.9,2.2,13.6,.2,4.4,9.2,'#b29a80');
    add(-36+side*4.52,.41,9.18,6.97,.82,.24,'#96745f');
    for(const dx of [1.2,4.6,7.8])add(-36+dx*side,1.94,9.18,.1,2.3,.14,'#405352');
    add(-36+side*4.5,2.34,9.18,6.9,.08,.12,'#405352');
    for(const height of [.8,1.6,2.4]){
      add(-36+side*4.4,height,17.66,4.3,.11,.68,'#826b51');
      for(const dx of [-1.2,0,1.2])add(-36+side*4.4+dx,height+.25,17.68,.48,.4,.38,'#a0a98d');
    }
  }
  add(-36,.95,17.05,3.8,.14,1.12,'#956c49');
  for(const dx of [-1.6,1.6])add(-36+dx,.49,17.05,.15,.92,.86,'#4d514c');
  add(-36,1.2,17.18,.18,.4,.16,'#444c4e');
  add(-36,1.62,17.25,1.55,.87,.13,'#39494e');
  add(-36,1.62,17.17,1.39,.70,.04,'#72949a');
  for(const dx of [-.43,.43])add(-36+dx,1.60,17.135,.38,.27,.025,'#dee0ca');
  add(-36,3.65,9.2,16,1.3,.22,'#58655c');
  add(-36,4.35,13.6,16.2,.2,9.4,'#6f7065');
  label('1AGE · DESIGN STUDIO',-36,3.64,9.05,5.2,Math.PI);
  label('MAX · Kenton',-11,2.4,-7.1,3.3,-Math.PI/2);
}
