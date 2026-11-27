import test from 'node:test';
import assert from 'node:assert/strict';
import {initialAirports,initialVirtualRoutes,createAirportCatalog,virtualRoutesFrom,travelPolicy} from './travel-catalog.mjs';
import {createTravelRequest,createPublicHandoff,localDate} from './travel-request.mjs';
const now=Date.parse('2026-11-27T06:00:00Z');
const input={origin:'PDX',destination:'DCA',outbound:'2026-11-27',returnDate:'2026-12-01',adults:1,cabin:'economy'};
test('airport local date is used, not the device timezone',()=>{
  assert.equal(localDate(now,'America/Los_Angeles'),'2026-11-26');
  assert.equal(localDate(now,'America/New_York'),'2026-11-27');
  assert.equal(createTravelRequest({...input,outbound:'2026-11-26'},{now}).outbound,'2026-11-26');
  assert.throws(()=>createTravelRequest({...input,origin:'DCA',destination:'PDX',outbound:'2026-11-26'},{now}));
});
test('real search is not restricted to developed virtual destinations',()=>{
  assert.equal(createTravelRequest({...input,destination:'LHR'},{now}).kind,'real-flight-search');
  assert.equal(virtualRoutesFrom('PDX').some(x=>x.destination==='LHR'),false);
});
test('future cities can extend the registry and route catalog independently',()=>{
  const catalog=createAirportCatalog([...initialAirports,{code:'LHR',cityId:'test-city',name:'Test airport',timeZone:'Europe/London',worldDestination:'test'}]);
  const routes=[...initialVirtualRoutes,{id:'test-route',origin:'LHR',destination:'PDX',kind:'virtual',fareEnabled:false}];
  assert.equal(virtualRoutesFrom('LHR',catalog,routes)[0].destination,'PDX');
  assert.throws(()=>createAirportCatalog([...initialAirports,initialAirports[0]]));
});
test('invalid dates, passenger counts, airport inputs and cabin are rejected',()=>{
  for(const bad of [{outbound:'2026-02-30'},{outbound:'2026-11-25'},{returnDate:'2026-11-26'},{destination:'PDX'},{destination:'https://bad.invalid'},{destination:['DCA']},{origin:'ZZZ'},{adults:0},{adults:10},{adults:1.5},{cabin:'unknown'}]){
    assert.throws(()=>createTravelRequest({...input,...bad},{now}));
  }
});
test('public handoff is fixed, explicitly unbooked and contains no extra personal data',()=>{
  const handoff=createPublicHandoff({...input,returnDate:'',passport:'never-forward',url:'https://bad.invalid'},{now});
  assert.equal(handoff.url,'https://www.skyscanner.net/flights');
  assert.equal(handoff.request.returnDate,null);
  assert.equal(handoff.reserved,false);
  assert.equal(handoff.prefilled,false);
  assert.equal(handoff.requiresConfirmation,true);
  assert.equal(handoff.affiliate,false);
  assert.equal(JSON.stringify(handoff).includes('never-forward'),false);
  assert.equal(JSON.stringify(handoff).includes('bad.invalid'),false);
  assert.equal(travelPolicy.directBookingEnabled,false);
  assert.equal(travelPolicy.paymentsEnabled,false);
});
