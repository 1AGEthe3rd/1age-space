import {virtualFlightBoard,formatFlightTime} from './travel-flight-schedule.mjs';
import {createAirportCatalog} from './travel-catalog.mjs';
const labels={scheduled:'Scheduled',boarding:'Boarding','boarding-closed':'Gate closed',departed:'Departed',arrived:'Arrived'};
// This component is deliberately separate from actual airline departures.
export function flightBoardRows(options){
  const catalog=options.catalog||createAirportCatalog();
  const board=virtualFlightBoard({...options,catalog});
  return {...board,rows:board.rows.map(f=>({...f,departureLabel:formatFlightTime(f.departureAt,f.origin,catalog),arrivalLabel:formatFlightTime(f.arrivalAt,f.destination,catalog),stateLabel:labels[f.state]}))};
}
export function createVirtualFlightBoard(T,{origin,catalog=createAirportCatalog(),routes,policies,clock=Date.now}){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d'),texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture});
  let last=-Infinity,disposed=false;
  function paint(now=clock()){
    if(disposed||now>=last&&now-last<1000)return;
    last=now;
    const board=flightBoardRows({origin,catalog,routes,policies,now,limit:5});
    ctx.fillStyle='#101c22';ctx.fillRect(0,0,1024,512);
    ctx.fillStyle='#edf2e8';ctx.font='bold 36px system-ui';ctx.fillText(origin+' · WORLD DEPARTURES',30,50,960);
    ctx.fillStyle='#9bcfc1';ctx.font='23px system-ui';ctx.fillText('VIRTUAL FLIGHTS ONLY · NOT AIRLINE TICKETS',30,90);
    if(!board.rows.length){ctx.fillStyle='#e7be81';ctx.font='26px system-ui';ctx.fillText('No virtual departures in this window',30,160);}
    for(const [i,row] of board.rows.entries()){
      const y=150+i*62;ctx.fillStyle=i%2?'#192c31':'#22353a';ctx.fillRect(20,y-28,984,54);
      ctx.fillStyle='#e2ece7';ctx.font='25px system-ui';ctx.fillText(row.departureLabel,32,y+5,330);
      ctx.fillText(row.destination+' · '+catalog.get(row.destination).name,380,y+5,360);
      ctx.fillStyle='#b2dfbd';ctx.fillText(row.stateLabel,760,y+5,225);
    }
    ctx.fillStyle='#a5b9b9';ctx.font='19px system-ui';ctx.fillText('Local departure time · Compressed virtual travel · Demo schedule',30,488,960);
    texture.needsUpdate=true;
  }
  paint();
  return {material,texture,paint,dispose(){if(disposed)return;disposed=true;material.dispose();texture.dispose();}};
}
