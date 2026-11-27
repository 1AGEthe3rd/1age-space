import test from 'node:test';
import assert from 'node:assert/strict';
import {localClock,departures,businessHours,displaySource} from './schedules.mjs';
const now=Date.parse('2026-11-26T18:00:00Z');
const snapshot=(rows,age=0)=>({updatedAt:now-age,validFrom:now-3600000,validUntil:now+7200000,rows});
test('city clocks follow their own local time and DST',()=>{
  assert.equal(localClock(now,'America/Los_Angeles').minute,600);
  assert.equal(localClock(now,'America/New_York').minute,780);
  assert.equal(localClock(Date.parse('2026-07-01T18:00:00Z'),'America/Los_Angeles').minute,660);
});
test('live prediction updates published trip and cancels another',()=>{
  const scheduled=snapshot([{id:'a',departureAt:now+300000},{id:'b',departureAt:now+600000}]);
  const realtime=snapshot([{id:'a',departureAt:now+420000},{id:'b',cancelled:true}]);
  const result=departures({now,scheduled,realtime});
  assert.deepEqual(result.rows.map(x=>[x.id,x.departureAt,x.source]),[['a',now+420000,'live']]);
  assert.equal(displaySource(result.rows[0].source),'Live prediction');
});
test('stale live data falls back to published schedule and unavailable is explicit',()=>{
  const scheduled=snapshot([{id:'a',departureAt:now+300000}]);
  const realtime=snapshot([{id:'a',cancelled:true}],121000);
  assert.equal(departures({now,scheduled,realtime}).rows[0].source,'scheduled');
  assert.equal(departures({now,realtime}).status,'unavailable');
  assert.equal(departures({now,scheduled:snapshot([])}).status,'no-listed-departures');
});
test('simulation never masquerades as a real departure',()=>{
  const virtual=snapshot([{id:'demo',departureAt:now+1000}]);
  assert.equal(departures({now,virtual}).status,'unavailable');
  assert.equal(departures({now,virtual,mode:'simulation'}).rows[0].source,'virtual');
});
test('verified hours handle local overnight opening, holiday closure and unknown',()=>{
  const t=Date.parse('2026-11-26T09:30:00Z');
  const weekly=Object.fromEntries(Array.from({length:7},(_,i)=>[i,[]]));
  weekly[3]=[[1320,1560]];
  const hours={verified:true,updatedAt:t-1000,validFrom:t-86400000,validUntil:t+86400000,weekly};
  assert.equal(businessHours({now:t,timeZone:'America/Los_Angeles',hours}).status,'open');
  assert.equal(businessHours({now:t,timeZone:'America/New_York',hours}).status,'closed');
  assert.equal(businessHours({now:t,timeZone:'America/Los_Angeles',hours:{...hours,exceptions:{'2026-11-26':[]}}}).status,'closed');
  assert.equal(businessHours({now:t,timeZone:'America/Los_Angeles',hours:{...hours,verified:false}}).status,'unknown');
});
test('expired and incomplete business records never assert closure',()=>{
  const hours={verified:true,updatedAt:now-1000,validFrom:now-86400000,validUntil:now+86400000,weekly:{4:[]}};
  assert.equal(businessHours({now,timeZone:'America/Los_Angeles',hours}).status,'unknown');
  assert.equal(businessHours({now,timeZone:'America/Los_Angeles',hours:{...hours,validUntil:now}}).status,'unknown');
});
