import test from 'node:test';
import assert from 'node:assert/strict';
import {pdxSpawn,pdxGate,pdxPlanters,pdxWalkable,nearPdxGate} from './pdx-terminal.mjs';
test('PDX terminal spawn connects to gate by a clear central walkway',()=>{
  assert.ok(pdxWalkable(pdxSpawn.x,pdxSpawn.z));
  for(let z=pdxSpawn.z;z>=pdxGate.z;z-=.1)assert.ok(pdxWalkable(0,z));
  assert.ok(nearPdxGate(pdxGate.x,pdxGate.z));
  assert.equal(nearPdxGate(pdxSpawn.x,pdxSpawn.z),false);
});
test('PDX public hall bounds prevent walking through planters and counter zones',()=>{
  for(const p of pdxPlanters)assert.equal(pdxWalkable(p.x,p.z),false);
  for(const x of [-14,14])assert.equal(pdxWalkable(x,0),false);
  for(const z of [-26,26])assert.equal(pdxWalkable(0,z),false);
  assert.equal(pdxWalkable(10.7,13),false);
  assert.equal(pdxWalkable(-10.4,-14),false);
  assert.equal(nearPdxGate(5,-22),false);
});
