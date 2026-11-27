import test from 'node:test';
import assert from 'node:assert/strict';
import {travelerPose,passengerLimit} from './dca-life.mjs';
import {dcaWalkable,nearDcaGate} from './dca-terminal.mjs';
test('decorative traveler routes remain clear of furnishings and demo gate',()=>{
 for(let i=0;i<passengerLimit.desktop;i++)for(let t=0;t<200;t+=.5){
  const p=travelerPose(i,t);
  assert.ok(dcaWalkable(p.x,p.z));
  assert.ok(!nearDcaGate(p.x,p.z));
  assert.ok(Math.abs(p.x)>=3.5);
  assert.ok(Number.isFinite(p.stride));
 }
});
test('mobile density is lower than desktop',()=>{
 assert.equal(passengerLimit.mobile,6);
 assert.equal(passengerLimit.desktop,10);
});
