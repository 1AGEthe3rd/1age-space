import test from 'node:test';
import assert from 'node:assert/strict';
import {stationById} from '../gameplay/rail-stations.mjs';
import {normalizeTriMet,normalizeWMATA,readStation} from './providers.mjs';
import {createScheduleHandler} from './server.mjs';
import {arrivalBoardRows} from '../gameplay/arrival-board.mjs';
const now=Date.parse('2026-11-27T18:00:00Z'),pdx=stationById('pdx-killingsworth'),dc=stationById('dc-anacostia');
const sample={resultSet:{queryTime:now,arrival:[
  {id:1,route:190,locid:11512,status:'estimated',estimated:now+120000,shortSign:'Expo Center'},
  {id:2,route:190,locid:11503,status:'scheduled',scheduled:now+300000,shortSign:'City Center'},
  {id:3,route:72,locid:11512,status:'estimated',estimated:now+60000},
  {id:4,route:190,locid:11503,status:'canceled',scheduled:now+60000},
  {id:5,route:190,locid:11503,status:'estimated',estimated:now+60000,dropOffOnly:true}
]}};
test('TriMet filters unrelated lines and cancelled or non-boarding arrivals',()=>{
  const board=normalizeTriMet(sample,pdx,now);
  assert.deepEqual(board.rows.map(r=>[r.source,r.destination]),[['live','Expo Center'],['scheduled','City Center']]);
  assert.throws(()=>normalizeTriMet({...sample,resultSet:{...sample.resultSet,queryTime:now-121000}},pdx,now));
});
test('WMATA predictions retain minute resolution and boarding states',()=>{
  const base={Line:'GR',LocationCode:'F06',DestinationCode:'F11',DestinationName:'Branch Ave'};
  const data={Trains:[{...base,Min:'BRD'},{...base,Min:'ARR'},{...base,Min:'4'},{...base,Min:'---'},{...base,Line:'RD',Min:'1'}]};
  const board=normalizeWMATA(data,dc,now);
  assert.deepEqual(board.rows.map(r=>r.state),['boarding','arriving','minutes']);
  assert.equal(board.rows[2].arrivalAt,now+240000);
});
test('board labels scheduled versus predicted and refuses expired snapshots',()=>{
  const snapshot=normalizeTriMet(sample,pdx,now);
  assert.deepEqual(arrivalBoardRows(snapshot,pdx.id,now).rows.map(r=>[r.countdown,r.label]),[['2 min','Predicted'],['5 min','Scheduled']]);
  assert.equal(arrivalBoardRows(snapshot,pdx.id,now+120000).status,'unavailable');
  assert.equal(arrivalBoardRows(snapshot,dc.id,now).status,'unavailable');
});
test('provider keys remain server-side and unverified stations fail closed',async()=>{
  let requests=0;
  const fetcher=async url=>{requests++;assert.equal(url.hostname,'developer.trimet.org');assert.equal(url.searchParams.get('appID'),'fixture-only');return {ok:true,json:async()=>sample};};
  const data=await readStation(pdx,{env:{TRIMET_APP_ID:'fixture-only'},fetcher,clock:()=>now});
  assert.equal(JSON.stringify(data).includes('fixture-only'),false);
  await assert.rejects(()=>readStation(dc,{env:{WMATA_API_KEY:'fixture-only'},fetcher,clock:()=>now}));
  await assert.rejects(()=>readStation(pdx,{env:{},fetcher,clock:()=>now}));
  assert.equal(requests,1);
});
test('service caches requests and fails closed on invalid station or origin',async()=>{
  let requests=0;
  const handler=createScheduleHandler({env:{WORLD_ALLOWED_ORIGINS:'https://1age.world'},clock:()=>now,reader:async()=>{requests++;return normalizeTriMet(sample,pdx,now);}});
  async function request(station,origin){
    let status,body;
    const res={setHeader(){},writeHead(v){status=v;},end(v){body=JSON.parse(v);}};
    await handler({method:'GET',url:'/v1/rail/arrivals?station='+station,headers:{origin}},res);
    return {status,body};
  }
  const [a,b]=await Promise.all([request(pdx.id,'https://1age.world'),request(pdx.id,'https://1age.world')]);
  assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(requests,1);
  assert.equal((await request('unknown','https://1age.world')).status,404);
  assert.equal((await request(pdx.id,'https://example.invalid')).status,403);
  assert.equal((await request(pdx.id,'https://1age.world')).status,200);assert.equal(requests,1);
});
