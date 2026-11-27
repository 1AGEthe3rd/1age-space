// Server only. Credentials supplied through environment variables; never sent to clients.
const number=v=>typeof v==='number'&&Number.isFinite(v);
const text=v=>typeof v==='string'?v.slice(0,120):'';
const lineNames={'90':'MAX Red','190':'MAX Yellow',GR:'Green',YL:'Yellow',BL:'Blue'};
function envelope(station,observedAt,rows){return {station:station.id,provider:station.provider,observedAt,expiresAt:observedAt+120000,kind:'station-arrivals',status:rows.length?'available':'no-listed-arrivals',rows};}
export function normalizeTriMet(payload,station,now){
  const result=payload?.resultSet;
  if(!result||result.errorMessage||!number(result.queryTime)||result.queryTime>now+5000||now-result.queryTime>120000||!Array.isArray(result.arrival))throw Error('Invalid or stale TriMet response');
  const observedAt=Math.min(now,result.queryTime),rows=[];
  for(const a of result.arrival){
    const line=String(a.route),stop=String(a.locid);
    if(!station.stops.includes(stop)||!station.lines.includes(line)||a.dropOffOnly===true||a.status==='canceled'||a.status==='delayed')continue;
    if(!['estimated','scheduled'].includes(a.status))continue;
    const live=a.status==='estimated'&&number(a.estimated);
    const arrivalAt=live?a.estimated:a.scheduled;
    if(!number(arrivalAt)||arrivalAt<now-30000||arrivalAt>now+3600000)continue;
    rows.push({id:text(String(a.id??a.tripID??arrivalAt))+':'+stop,line:lineNames[line],destination:text(a.shortSign||a.fullSign),arrivalAt,source:live?'live':'scheduled'});
  }
  return envelope(station,observedAt,rows.sort((a,b)=>a.arrivalAt-b.arrivalAt).slice(0,12));
}
export function normalizeWMATA(payload,station,receivedAt){
  if(!Array.isArray(payload?.Trains)||!number(receivedAt))throw Error('Invalid WMATA response');
  const rows=[];
  for(const [i,a] of payload.Trains.entries()){
    if(!station.stops.includes(a.LocationCode)||!station.lines.includes(a.Line)||!a.DestinationName||!a.DestinationCode||a.DestinationCode===a.LocationCode)continue;
    const raw=String(a.Min??'');
    const state=raw==='BRD'?'boarding':raw==='ARR'?'arriving':/^\d{1,2}$/.test(raw)?'minutes':null;
    if(!state||state==='minutes'&&Number(raw)>60)continue;
    rows.push({id:station.id+':'+i,line:lineNames[a.Line],destination:text(a.DestinationName),arrivalAt:receivedAt+(state==='minutes'?Number(raw)*60000:0),source:'live',state});
  }
  // WMATA predictions have minute resolution and no stable trip ID in this response.
  // They are display-only, never treated as an authenticated boarding entitlement.
  return envelope(station,receivedAt,rows.sort((a,b)=>a.arrivalAt-b.arrivalAt).slice(0,12));
}
async function getJSON(url,headers,fetcher){
  const response=await fetcher(url,{headers,signal:AbortSignal.timeout(8000),redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error('Upstream unavailable');
  return response.json();
}
export async function readStation(station,{env=process.env,fetcher=fetch,clock=Date.now}={}){
  if(station.provider==='trimet'){
    if(!env.TRIMET_APP_ID)throw Error('Provider not configured');
    const url=new URL('https://developer.trimet.org/ws/v2/arrivals');
    url.search=new URLSearchParams({appID:env.TRIMET_APP_ID,locIDs:station.stops.join(','),json:'true',minutes:'60',arrivals:'4'});
    const data=await getJSON(url,{Accept:'application/json'},fetcher);
    return normalizeTriMet(data,station,clock());
  }
  if(station.provider==='wmata'){
    if(!env.WMATA_API_KEY||!station.verified)throw Error('Provider or station not verified');
    const url=new URL('https://api.wmata.com/StationPrediction.svc/json/GetPrediction/'+station.stops.join(','));
    const data=await getJSON(url,{Accept:'application/json',api_key:env.WMATA_API_KEY},fetcher);
    return normalizeWMATA(data,station,clock());
  }
  throw Error('Unknown provider');
}
