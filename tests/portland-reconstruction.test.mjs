import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localMeters} from '../hq1/portland/references/local-meters.mjs';
import {neighboringBuildings,buildingFootprint} from '../hq1/streetscape.mjs';
import {stops} from '../hq1/portland/showrooms.mjs';
import {buildOpenhaus} from '../hq1/portland/openhaus.mjs';

const load = file => JSON.parse(readFileSync(new URL('../hq1/portland/'+file,import.meta.url)));
test('city IDs, physical scale and both sides of MLK survive import',()=>{
  const rows=load('references/mlk-control.json').addresses;
  const origin=rows.find(row=>row.addressId===889233);
  const sides=rows.map(row=>row.side);
  assert.deepEqual(sides,['west','east','west','west','east']);
  assert.equal(new Set(rows.map(row=>row.buildingId)).size,5);
  const nlc=localMeters(rows.find(row=>row.addressId===576323),origin);
  assert.ok(nlc.east < -49 && nlc.east > -52);
  assert.ok(nlc.north > 458 && nlc.north < 461);
  assert.equal(load('references/media.json').sites['openhaus-plaza'].buildingId,origin.buildingId);
});
test('plaza approach and through passage clear all new collision boxes',()=>{
  const building=neighboringBuildings.find(b=>b.appearance.style==='openhaus');
  const blockers=[buildingFootprint(building)];
  buildOpenhaus({box:()=>({rotation:{set(){}}}),scene:{add(){}},material:()=>({}),sign(){}},building,blockers);
  function clear(x,z) {
    return blockers.every(b=>x<=b.x-.32 || x>=b.x+b.w+.32 || z<=b.z-.32 || z>=b.z+b.d+.32);
  }
  assert.ok(clear(stops.openhaus.x,stops.openhaus.z));
  for(let x=10;x<32;x+=.2) assert.ok(clear(x,4.1));
  assert.ok(!clear(building.position.x,building.position.z));
  assert.ok(!clear(24.4,5.78));
});
