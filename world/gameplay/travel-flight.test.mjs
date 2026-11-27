import test from 'node:test';
import assert from 'node:assert/strict';
import {initialVirtualRoutes,initialAirports,createAirportCatalog} from './travel-catalog.mjs';
import {initialFlightPolicy,flightPolicy,virtualFlight,flightState,virtualFlightBoard,formatFlightTime} from './travel-flight-schedule.mjs';
import {flightBoardRows} from './travel-flight-board.mjs';
const t=Date.parse('2026-11-27T18:00:00Z');
test('both airports share stable 15 minute UTC cadence and 80 second duration',()=>{
  for(const origin of ['PDX','DCA']){
    const a=virtualFlightBoard({origin,now:t-1000});
    const b=virtualFlightBoard({origin,now:t});
    assert.equal(a.rows[0].id,b.rows[0].id);
    assert.equal(a.rows[0].departureAt,t);
    assert.equal(a.rows[1].departureAt-a.rows[0].departureAt,900000);
    assert.equal(a.rows[0].arrivalAt-t,80000);
    assert.equal(a.rows[0].source,'virtual');
    assert.equal(a.rows[0].realReservation,false);
  }
});
test('boarding opens and closes precisely, then flight departs and arrives',()=>{
  const f=virtualFlight(initialVirtualRoutes[0],t);
  for(const [time,state] of [[t-300001,'scheduled'],[t-300000,'boarding'],[t-30001,'boarding'],[t-30000,'boarding-closed'],[t,'departed'],[t+79999,'departed'],[t+80000,'arrived']])assert.equal(flightState(f,time),state);
});
test('airport time labels use local time on opposite coasts',()=>{
  assert.match(formatFlightTime(t,'PDX'),/10:00 AM PST/);
  assert.match(formatFlightTime(t,'DCA'),/1:00 PM EST/);
  assert.equal(flightBoardRows({origin:'PDX',now:t-60000}).rows[0].stateLabel,'Boarding');
});
test('future city routes and independent cadence are supported',()=>{
  const catalog=createAirportCatalog([...initialAirports,{code:'LHR',cityId:'test-city',name:'Test airport',timeZone:'Europe/London',worldDestination:'test'}]);
  const route={id:'test-route',origin:'LHR',destination:'PDX',kind:'virtual'};
  const b=virtualFlightBoard({origin:'LHR',now:t,catalog,routes:[route],policies:{'test-route':{intervalMs:600000,boardingLeadMs:120000}}});
  assert.equal(b.rows[1].departureAt-b.rows[0].departureAt,600000);
  assert.equal(b.rows[0].destination,'PDX');
});
test('invalid policies and real flight data fail closed',()=>{
  assert.throws(()=>flightPolicy({boardingLeadMs:1000,boardingCloseMs:2000}));
  assert.throws(()=>virtualFlight({...initialVirtualRoutes[0],kind:'real'},t));
  assert.throws(()=>virtualFlight(initialVirtualRoutes[0],t+1));
  assert.throws(()=>virtualFlightBoard({origin:'ZZZ',now:t}));
  assert.equal(virtualFlightBoard({origin:'PDX',now:t,routes:[]}).status,'no-listed-departures');
});
