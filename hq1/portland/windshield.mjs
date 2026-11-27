import {createWindshield,windshieldHeight,wiperPivots} from './windshield-model.mjs';
// One small transparent texture per vehicle; update only the active cockpit.
export function attachWindshield(T,cabin){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=225;
  const ctx=canvas.getContext('2d');
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;
  const glass=new T.Mesh(new T.PlaneGeometry(1.54,1.54*windshieldHeight),new T.MeshBasicMaterial({
    map:texture,transparent:true,depthWrite:false,side:T.DoubleSide
  }));
  glass.position.set(0,1.54,-1.74);glass.renderOrder=4;cabin.add(glass);
  const model=createWindshield();
  let elapsed=1;
  function draw(state,raining,lights){
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    for(const d of state.drops){
      const x=d.x*w,y=d.y*w,r=d.size*w;
      ctx.globalAlpha=Math.min(.8,d.life);
      ctx.fillStyle='rgba(28,45,53,.32)';ctx.beginPath();ctx.ellipse(x,y,r,r*1.5,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=lights?'rgba(255,237,190,.85)':'rgba(223,242,255,.8)';
      ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,r*.8,r*1.25,0,3.3,5.8);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.lineCap='round';
    for(const pivot of wiperPivots){
      const x=pivot*w,y=h-1,a=state.angle;
      const dx=Math.cos(a),dy=Math.sin(a);
      ctx.strokeStyle='#253033';ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+dx*state.bladeEnd*w,y+dy*state.bladeEnd*w);ctx.stroke();
      ctx.strokeStyle='#111b20';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(x+dx*state.bladeStart*w,y+dy*state.bladeStart*w);
      ctx.lineTo(x+dx*state.bladeEnd*w,y+dy*state.bladeEnd*w);ctx.stroke();
    }
    texture.needsUpdate=true;
  }
  return {frame(dt,active,raining,mode,speed,lights){
    if(!active)return;
    const state=model.tick(dt,raining,mode,speed);
    elapsed+=dt;
    if(elapsed>=.04){elapsed=0;draw(state,raining,lights);}
  }};
}
