import * as T from '../../space/shared/three.module.js';
import {readObservation,solarHeight} from '../../space/shared/weather/observations.mjs';
import {createPortlandRain} from './rain.mjs';

// HQ1-local adapter: preserve the shared weather contract without modifying HQ2.
export function attachPortlandSky({scene,sun,ambient,station,latitude,longitude,timeZone,status,roadMaterials,preview}){
  const rain=createPortlandRain(T,scene,roadMaterials);
  const key='space-weather-v1-'+station;
  let raw=null,lastPaint=-Infinity,kind='clear',request=null,disposed=false;
  try{raw=JSON.parse(localStorage.getItem(key));}catch{}
  const vertices=new Float32Array(210*3);
  for(let i=0;i<vertices.length;i+=3){
    vertices[i]=Math.random()*24-12;vertices[i+1]=Math.random()*13;vertices[i+2]=Math.random()*24-12;
  }
  const geometry=new T.BufferGeometry(),attribute=new T.BufferAttribute(vertices,3);
  geometry.setAttribute('position',attribute);
  const paint=new T.PointsMaterial({color:'#e4eff7',size:.055,transparent:true,opacity:.75,depthWrite:false});
  const drops=new T.Points(geometry,paint);drops.frustumCulled=false;scene.add(drops);
  function sky(){
    const now=Date.now(),obs=readObservation(raw,now);
    const height=solarHeight(now,latitude,longitude);
    const day=Math.max(0,Math.min(1,(height+.10)/.38));
    kind=preview||obs?.kind||'clear';
    const clear=kind==='clear';
    scene.background=new T.Color('#182535').lerp(new T.Color(clear?'#99c7e1':kind==='rain'?'#82929c':'#b4bdc4'),day);
    scene.fog.color.copy(scene.background);
    scene.fog.far=!preview&&obs?.fog?60:kind==='rain'?105:180;
    rain.setWet(kind==='rain');
    sun.intensity=.12+day*(clear?2.35:.85);ambient.intensity=.66+day*(clear?1.4:1.12);
    paint.size=kind==='snow'?.10:.047;
    const t=obs&&new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone}).format(obs.time);
    if(status)status.textContent=preview?'Weather test · '+preview:obs?obs.description+' · '+station+' '+t:'Local sky · weather unavailable';
  }
  async function refresh(){
    if(request||disposed)return;
    request=new AbortController();const timeout=setTimeout(()=>request?.abort(),9000);
    try{
      const response=await fetch('https://api.weather.gov/stations/'+encodeURIComponent(station)+'/observations/latest',{signal:request.signal,headers:{Accept:'application/geo+json'}});
      if(response.ok){const p=(await response.json()).properties;if(readObservation(p)&&!disposed){
        raw={timestamp:p.timestamp,textDescription:p.textDescription};
        try{localStorage.setItem(key,JSON.stringify(raw));}catch{}
      }}
    }catch{}finally{clearTimeout(timeout);request=null;if(!disposed)sky();}
  }
  sky();if(!preview)refresh();const timer=preview?null:setInterval(refresh,15*60000);
  addEventListener('pagehide',e=>{
    if(e.persisted)return;
    disposed=true;clearInterval(timer);request?.abort();geometry.dispose();paint.dispose();rain.dispose();
  });
  return (dt,camera,sheltered=false)=>{
    if(Date.now()-lastPaint>60000){sky();lastPaint=Date.now();}
    rain.frame(dt,camera,!sheltered&&kind==='rain');
    drops.visible=!sheltered&&kind==='snow';
    if(!drops.visible)return;
    drops.position.set(camera.position.x,0,camera.position.z);
    for(let i=1;i<vertices.length;i+=3)vertices[i]=(vertices[i]+13-dt*(kind==='snow'?1.1:9))%13;
    attribute.needsUpdate=true;
  };
}
