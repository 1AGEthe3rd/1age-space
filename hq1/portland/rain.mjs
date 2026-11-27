import {createWorldRain} from '../../world/gameplay/rain.mjs';
export function portlandSplash(cx,cz){
  if(Math.abs(cx)>=15||cz<=-110||cz>=25)return null;
  return {x:Math.random()*10.8-5.4,y:.105,z:Math.max(-109,Math.min(24,cz+Math.random()*18-9))};
}
export function createPortlandRain(T,scene,roadMaterials){return createWorldRain(T,scene,roadMaterials,portlandSplash);}
