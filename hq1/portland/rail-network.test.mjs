import test from 'node:test';
import assert from 'node:assert/strict';
import {stops,airportYellowStops,redStops,stationId,platformConnection} from './rail-network.mjs';
test('Yellow airport extension retains all original stations in order',()=>{
  assert.deepEqual(airportYellowStops.slice(0,3),['Interstate/Rose Quarter','Albina/Mississippi','Overlook Park']);
  assert.deepEqual(airportYellowStops.slice(2),stops);
  assert.equal(airportYellowStops.length,10);
  assert.equal(redStops.length,12);
  for(const route of [airportYellowStops,redStops])assert.equal(new Set(route.map(stationId)).size,route.length);
});
test('World transfer links remain on the existing HQ1 path in both directions',()=>{
  assert.deepEqual(platformConnection('yellow','Interstate/Rose Quarter'),['?rail=red&station=rose-quarter-tc','Transfer to Red Line']);
  assert.deepEqual(platformConnection('red','Rose Quarter TC'),['?rail=yellow&station=interstate-rose-quarter','Transfer to Yellow Line']);
  assert.deepEqual(platformConnection('red','Portland International Airport'),['?airport=pdx','Enter PDX']);
});
test('connections require being off the train at an eligible platform',()=>{
  assert.equal(platformConnection('red','Portland International Airport',true,false),null);
  assert.equal(platformConnection('red','Rose Quarter TC',false,true),null);
  assert.equal(platformConnection('yellow','Albina/Mississippi'),null);
  assert.equal(platformConnection('yellow','Expo Center'),null);
  assert.equal(platformConnection('invalid','Interstate/Rose Quarter'),null);
});
