// World schedule contract. All departure instants are Unix milliseconds, normalized
// by a trusted provider adapter (GTFS service days, DST, >24h times handled upstream).
// No API secrets, network requests, real bookings or payment side effects.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dateKey=/^\d{4}-\d{2}-\d{2}$/;
const sourceModes=new Set(['scheduled','live','virtual']);
export function localClock(now,timeZone){
  if(!finite(now))throw new TypeError('Invalid clock');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return {date:parts.year+'-'+parts.month+'-'+parts.day,weekday:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),minute:Number(parts.hour)*60+Number(parts.minute),timeZone};
}
function priorDate(date){
  const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);
}
function current(snapshot,now,maxAge){
  return snapshot&&finite(snapshot.updatedAt)&&snapshot.updatedAt<=now&&now-snapshot.updatedAt<=maxAge
    &&finite(snapshot.validFrom)&&finite(snapshot.validUntil)&&snapshot.validFrom<=now&&now<snapshot.validUntil;
}
// A source must describe its full validity window; an empty current snapshot means
// no listed departures in that window, not "the entire system is closed."
export function departures({now,scheduled=null,realtime=null,virtual=null,mode='real',horizonMs=3600000,limit=6}){
  if(!finite(now)||!finite(horizonMs)||horizonMs<=0||!Number.isInteger(limit)||limit<1||limit>50||!['real','simulation'].includes(mode))throw new TypeError('Invalid departure query');
  const base=mode==='simulation'?virtual:scheduled;
  const baseOK=current(base,now,mode==='simulation'?86400000:7*86400000);
  const liveOK=mode==='real'&&current(realtime,now,120000);
  const validEnd=baseOK?Math.min(base.validUntil,now+horizonMs):liveOK?Math.min(realtime.validUntil,now+horizonMs):now;
  const rows=new Map();
  if(baseOK)for(const row of base.rows||[]){
    if(typeof row.id!=='string'||!finite(row.departureAt)||row.departureAt<base.validFrom||row.departureAt>=base.validUntil)continue;
    rows.set(row.id,{...row,source:mode==='simulation'?'virtual':'scheduled'});
  }
  if(liveOK)for(const update of realtime.rows||[]){
    if(typeof update.id!=='string')continue;
    if(update.cancelled===true){rows.delete(update.id);continue;}
    if(!finite(update.departureAt)||update.departureAt<realtime.validFrom||update.departureAt>=realtime.validUntil)continue;
    if(!rows.has(update.id)&&update.confirmed!==true)continue;
    rows.set(update.id,{...rows.get(update.id),...update,source:'live'});
  }
  const list=[...rows.values()].filter(row=>sourceModes.has(row.source)&&row.cancelled!==true&&row.departureAt>=now&&row.departureAt<validEnd)
    .sort((a,b)=>a.departureAt-b.departureAt||a.id.localeCompare(b.id)).slice(0,limit);
  return {status:!baseOK&&!liveOK?'unavailable':list.length?'available':'no-listed-departures',rows:list,coverageUntil:validEnd,mode,liveAvailable:!!liveOK};
}
function validIntervals(intervals){
  return Array.isArray(intervals)&&intervals.every(p=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&Number.isInteger(p[1])&&p[0]>=0&&p[0]<1440&&p[1]>p[0]&&p[1]<=p[0]+1440);
}
// Monday/Sunday etc are JS weekday numbers (0=Sunday). End times above 1440
// represent overnight intervals. Date exceptions supersede regular hours.
export function businessHours({now,timeZone,hours,maxAgeMs=30*86400000}){
  if(!hours||hours.verified!==true||!current(hours,now,maxAgeMs))return {status:'unknown',reason:'missing-or-stale'};
  const clock=localClock(now,timeZone);
  const previous=priorDate(clock.date);
  const exceptions=hours.exceptions||{};
  if(Object.keys(exceptions).some(key=>!dateKey.test(key)))return {status:'unknown',reason:'invalid-exceptions'};
  function day(date,weekday){
    return Object.hasOwn(exceptions,date)?exceptions[date]:hours.weekly?.[weekday];
  }
  const today=day(clock.date,clock.weekday),yesterday=day(previous,(clock.weekday+6)%7);
  if(!validIntervals(today)||!validIntervals(yesterday))return {status:'unknown',reason:'incomplete-hours'};
  // Explicit all-day closure overrides overnight carryover from the previous day.
  const override=Object.hasOwn(exceptions,clock.date);
  const open=today.some(([a,b])=>clock.minute>=a&&clock.minute<b)||
    (!override&&yesterday.some(([a,b])=>b>1440&&clock.minute<b-1440));
  return {status:open?'open':'closed',reason:'verified-hours',local:clock,source:hours.source||null};
}
export function displaySource(source){
  return ({scheduled:'Published schedule',live:'Live prediction',virtual:'Virtual schedule'})[source]||'Schedule unavailable';
}
