import test from 'node:test';
import assert from 'node:assert/strict';
import {createLiveHandler,createBudgetedReader} from './live-server.mjs';
import {stationById} from '../gameplay/rail-stations.mjs';
const station=stationById('pdx-killingsworth');
const now=Date.parse('2026-11-27T18:00:00Z');
async function request(handler,url,origin='https://1age.world',method='GET'){
  let status,body;const headers={};
  await handler({url,method,headers:{origin}},{setHeader(k,v){headers[k]=v;},writeHead(s,h){status=s;Object.assign(headers,h)},end(v){body=JSON.parse(v)}});
  return {status,body,headers};
}
test('shared clock returns server UTC with no-cache and correct CORS',async()=>{
  const h=createLiveHandler({env:{WORLD_ALLOWED_ORIGINS:'https://1age.world'},clock:()=>now});
  const res=await request(h,'/v1/time');
  assert.equal(res.status,200);assert.equal(res.body.serverTimeMs,now);assert.equal(res.body.source,'server-utc');
  assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(res.headers['Access-Control-Allow-Origin'],'https://1age.world');
  assert.equal((await request(h,'/v1/time','https://example.invalid')).status,403);
  assert.equal((await request(h,'/v1/time','https://1age.world','POST')).status,405);
});
test('missing keys, explicit activation or quota prevents upstream requests',async()=>{
  let calls=0;
  for(const env of [{},{TRIMET_APP_ID:'fixture',TRIMET_LIVE_ENABLED:'true'},{TRIMET_APP_ID:'fixture',TRIMET_DAILY_REQUEST_LIMIT:'2'}]){
    const read=createBudgetedReader({env,clock:()=>now,reader:async()=>{calls++}});
    await assert.rejects(()=>read(station));
  }
  assert.equal(calls,0);
});
test('provider quota is consumed only for permitted requests and resets on UTC day',async()=>{
  let time=now,calls=0;
  const read=createBudgetedReader({env:{TRIMET_APP_ID:'fixture',TRIMET_LIVE_ENABLED:'true',TRIMET_DAILY_REQUEST_LIMIT:'2'},clock:()=>time,reader:async()=>++calls});
  assert.equal(await read(station),1);assert.equal(await read(station),2);await assert.rejects(()=>read(station));
  time+=86400000;assert.equal(await read(station),3);
  await assert.rejects(()=>read(stationById('dc-anacostia')));
});
test('global request budget limits public requests but keeps health responsive',async()=>{
  let time=now;const h=createLiveHandler({env:{WORLD_ALLOWED_ORIGINS:'https://1age.world'},clock:()=>time,maxRequestsPerMinute:2});
  assert.equal((await request(h,'/v1/time')).status,200);
  assert.equal((await request(h,'/v1/time')).status,200);
  assert.equal((await request(h,'/v1/time')).status,429);
  assert.equal((await request(h,'/health')).status,200);
  time+=60000;assert.equal((await request(h,'/v1/time')).status,200);
});
test('rail without credentials fails closed rather than inventing live arrivals',async()=>{
  let calls=0;
  const h=createLiveHandler({env:{WORLD_ALLOWED_ORIGINS:'https://1age.world'},clock:()=>now,reader:async()=>{calls++}});
  const res=await request(h,'/v1/rail/arrivals?station=pdx-killingsworth');
  assert.equal(res.status,503);assert.equal(res.body.status,'unavailable');assert.equal(calls,0);
});
