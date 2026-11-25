import test from 'node:test';
import assert from 'node:assert/strict';
import {stepVan} from '../hq1/portland/motor.mjs';
const vehicle=()=>({x:0,z:0,speed:0,heading:0,steer:0,reverse:false});
function run(c,seconds,gas,brake,steer=0){for(let i=0;i<seconds*60;i++)stepVan(c,{gas,brake,steer},1/60);}
test('van eases up to town speed, brakes to a standstill and reverses slowly',()=>{
  const c=vehicle();run(c,1,1,0);assert.ok(c.speed>1 && c.speed<2.2);
  run(c,10,1,0);assert.ok(c.speed>7 && c.speed<=10.7);
  run(c,3,0,1);assert.equal(c.speed,0);const before=c.z;
  c.reverse=true;run(c,4,1,0);assert.ok(c.z>before && c.speed>=-2.8);
});
test('steering turns the van right and prevents the body leaving the carriageway',()=>{
  const c=vehicle();c.z=45; // Uninterrupted MLK curb south of Alberta.
  run(c,1,1,0);run(c,1,1,0,1);assert.ok(c.x>0 && c.heading<0);
  run(c,24,1,0,1);assert.ok(Math.abs(c.x)<5.95 && c.speed===0);
});
test('driver stops before contacting another parked van',()=>{
  const c=vehicle(),parked={x:0,z:-12,heading:0};
  for(let i=0;i<600;i++)stepVan(c,{gas:1,brake:0,steer:0},1/60,parked);
  assert.ok(c.z < -7.6 && c.z >= -7.9 && c.speed===0);
});
