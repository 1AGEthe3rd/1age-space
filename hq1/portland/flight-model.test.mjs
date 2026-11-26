import test from 'node:test';
import assert from 'node:assert/strict';
import {airports,createJourney,flightDuration} from './flight-model.mjs';

for(const origin of Object.keys(airports)){
  test(origin+' demo flight requires boarding and reaches opposite airport',()=>{
    const trip=createJourney(origin);
    assert.notEqual(trip.destination,origin);
    assert.equal(trip.depart(),false);
    trip.tick(100);
    assert.equal(trip.status,'terminal');
    assert.equal(trip.board(),true);
    assert.equal(trip.board(),false);
    assert.equal(trip.depart(),true);
    trip.tick(12);
    assert.equal(trip.sample().name,'Takeoff');
    trip.tick(20);
    assert.equal(trip.sample().name,'Cruise');
    assert.ok(trip.sample().altitude>220);
    trip.tick(100);
    assert.equal(trip.status,'arrived');
    assert.equal(trip.elapsed,flightDuration);
    assert.equal(trip.progress,1);
    assert.equal(trip.sample().altitude,0);
    assert.equal(trip.depart(),false);
  });
}
test('unknown airports are rejected',()=>assert.throws(()=>createJourney('other'),RangeError));
