import {stationById} from './rail-stations.mjs';
export function arrivalBoardRows(snapshot,stationId,now=Date.now()){
  if(!snapshot||snapshot.station!==stationId||snapshot.kind!=='station-arrivals'||!Number.isFinite(snapshot.observedAt)||snapshot.observedAt>now+5000||!Number.isFinite(snapshot.expiresAt)||now>=snapshot.expiresAt||now-snapshot.observedAt>120000||!Array.isArray(snapshot.rows))return {status:'unavailable',rows:[]};
  const rows=snapshot.rows.filter(r=>Number.isFinite(r.arrivalAt)&&r.arrivalAt>=now-30000&&['live','scheduled'].includes(r.source)).slice(0,5).map(r=>({...r,countdown:r.state==='boarding'?'BRD':r.state==='arriving'?'ARR':Math.max(0,Math.ceil((r.arrivalAt-now)/60000))+' min',label:r.source==='live'?'Predicted':'Scheduled'}));
  return {status:rows.length?'available':'no-listed-arrivals',rows};
}
// A canvas texture for a physical 3D station sign. The city owns the mesh and placement.
export function createArrivalBoard(T,{stationId,endpoint=null,fetcher=fetch}){
  const station=stationById(stationId);if(!station)throw Error('Unknown station');
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  let snapshot=null,disposed=false,lastRequest=-Infinity,request=null;
  const material=new T.MeshBasicMaterial({map:texture});
  function paint(now){
    const board=arrivalBoardRows(snapshot,stationId,now);
    ctx.fillStyle='#101c22';ctx.fillRect(0,0,1024,512);
    ctx.fillStyle='#ecf2e9';ctx.font='bold 36px system-ui';ctx.fillText(station.name.slice(0,45),32,53,960);
    ctx.fillStyle='#89c9bb';ctx.font='24px system-ui';ctx.fillText('REAL-WORLD ARRIVALS · '+station.provider.toUpperCase(),32,92);
    ctx.font='25px system-ui';
    if(board.status!=='available'){ctx.fillStyle='#e7be81';ctx.fillText(board.status==='unavailable'?'Arrival feed unavailable':'No arrivals listed in current feed',32,168);}
    for(const [i,row] of board.rows.entries()){
      const y=150+i*62;ctx.fillStyle=i%2?'#192c31':'#22353a';ctx.fillRect(20,y-29,984,54);
      ctx.fillStyle='#e2ece7';ctx.fillText(row.line+' · '+String(row.destination||'').slice(0,32),32,y+5,720);
      ctx.fillStyle='#b2dfbd';ctx.fillText(row.countdown,810,y+5);
      ctx.font='17px system-ui';ctx.fillStyle='#b2c2bb';ctx.fillText(row.label,810,y+24);ctx.font='25px system-ui';
    }
    ctx.fillStyle='#a5b9b9';ctx.font='19px system-ui';ctx.fillText('Reference only · Virtual trains operate separately',32,488);
    texture.needsUpdate=true;
  }
  async function refresh(now=Date.now()){
    if(disposed||!endpoint||request||now-lastRequest<30000)return;
    lastRequest=now;request=new AbortController();
    const timer=setTimeout(()=>request?.abort(),9000);
    try{
      const url=new URL(endpoint,location.href);url.searchParams.set('station',stationId);
      const response=await fetcher(url,{signal:request.signal,credentials:'omit',cache:'no-store'});
      snapshot=response.ok?await response.json():null;
    }catch{snapshot=null;}finally{clearTimeout(timer);request=null;if(!disposed)paint(Date.now());}
  }
  paint(Date.now());
  return {material,texture,refresh,paint,dispose(){disposed=true;request?.abort();material.dispose();texture.dispose();}};
}
