import {createAirportCatalog,initialVirtualRoutes,virtualRoutesFrom} from './travel-catalog.mjs';
import {departures} from './schedules.mjs';

// Prototype virtual operations only. UTC cadence is consistent across all city time zones.
// Explicit policy injection allows future cities to choose their own service frequencies.
export const initialFlightPolicy=Object.freeze({intervalMs:900000,boardingLeadMs:300000,boardingCloseMs:30000,durationMs:80000,offsetMs:0});
export function flightPolicy(options={}){
  const p={...initialFlightPolicy,...options};
  if(!['intervalMs','boardingLeadMs','boardingCloseMs','durationMs','offsetMs'].every(k=>Number.isSafeInteger(p[k]))||
    p.intervalMs<60000||p.intervalMs>86400000||p.boardingCloseMs<0||p.boardingLeadMs<=p.boardingCloseMs||p.boardingLeadMs>=p.intervalMs||p.durationMs<=0||p.durationMs>86400000||p.offsetMs<0||p.offsetMs>=p.intervalMs)throw new RangeError('Invalid virtual flight policy');
  return Object.freeze(p);
}
export function virtualFlight(route,departureAt,options={}){
  const policy=flightPolicy(options);
  if(route?.kind!=='virtual'||typeof route.id!=='string'||!route.id||route.origin===route.destination||
    !/^[A-Z]{3}$/.test(route.origin)||! /^[A-Z]{3}$/.test(route.destination)||
    !Number.isSafeInteger(departureAt)||departureAt<0||(departureAt-policy.offsetMs)%policy.intervalMs!==0)throw new TypeError('Invalid virtual flight');
  return Object.freeze({id:route.id+':'+departureAt,routeId:route.id,origin:route.origin,destination:route.destination,
    kind:'virtual-flight',source:'virtual',departureAt,boardingOpensAt:departureAt-policy.boardingLeadMs,
    boardingClosesAt:departureAt-policy.boardingCloseMs,arrivalAt:departureAt+policy.durationMs,durationMs:policy.durationMs,
    realReservation:false,fareEnabled:false});
}
export function flightState(flight,now){
  if(flight?.kind!=='virtual-flight'||flight.source!=='virtual'||!Number.isFinite(now))throw new TypeError('Invalid virtual flight state');
  if(now<flight.boardingOpensAt)return 'scheduled';
  if(now<flight.boardingClosesAt)return 'boarding';
  if(now<flight.departureAt)return 'boarding-closed';
  if(now<flight.arrivalAt)return 'departed';
  return 'arrived';
}
export function virtualFlightBoard({origin,now=Date.now(),catalog=createAirportCatalog(),routes=initialVirtualRoutes,policies={},horizonMs=3600000,limit=6}={}){
  if(!catalog.get(origin)||!Number.isSafeInteger(now)||now<0||!Number.isSafeInteger(horizonMs)||horizonMs<=0||horizonMs>86400000||!Number.isInteger(limit)||limit<1||limit>50)throw new TypeError('Invalid virtual board query');
  const active=virtualRoutesFrom(origin,catalog,routes);
  if(new Set(active.map(r=>r.id)).size!==active.length)throw new TypeError('Duplicate virtual routes');
  const end=now+horizonMs,rows=[];
  for(const route of active){
    const policy=flightPolicy(Object.hasOwn(policies,route.id)?policies[route.id]:{});
    const first=Math.ceil((now-policy.offsetMs)/policy.intervalMs)*policy.intervalMs+policy.offsetMs;
    for(let t=first,n=0;t<end&&n<limit;t+=policy.intervalMs,n++)rows.push(virtualFlight(route,t,policy));
  }
  const result=departures({now,virtual:{updatedAt:now,validFrom:now,validUntil:end,rows},mode:'simulation',horizonMs,limit});
  return {...result,origin,kind:'virtual-flight-board',label:'1AGE World virtual flights',rows:result.rows.map(f=>({...f,state:flightState(f,now)}))};
}
export function formatFlightTime(at,airportCode,catalog=createAirportCatalog()){
  const airport=catalog.get(airportCode);
  if(!airport||!Number.isFinite(at))throw new TypeError('Invalid airport or time');
  return new Intl.DateTimeFormat('en-US',{timeZone:airport.timeZone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(at);
}
