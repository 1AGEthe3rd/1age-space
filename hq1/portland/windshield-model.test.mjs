import test from 'node:test';
import assert from 'node:assert/strict';
import {createWindshield,nextWiperMode} from './windshield-model.mjs';
import {stepVan} from './motor.mjs';
function random(){
  let seed=174;
  return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}
test('wiper control cycles off, slow, fast, then off',()=>{
  assert.equal(nextWiperMode(0),1);assert.equal(nextWiperMode(1),2);assert.equal(nextWiperMode(2),0);
});
test('rain beads are bounded and moving wipers clear their sweep',()=>{
  const off=createWindshield(random()),slow=createWindshield(random()),fast=createWindshield(random());
  for(let i=0;i<200;i++){
    off.tick(.05,true,0,3);slow.tick(.05,true,1,3);fast.tick(.05,true,2,3);
  }
  assert.ok(off.drops.length<=100&&off.drops.length>0);
  assert.ok(slow.drops.length<off.drops.length);
  assert.ok(fast.drops.length<slow.drops.length);
  for(let i=0;i<30;i++)fast.tick(.05,false,0,0);
  assert.equal(fast.position,0);assert.equal(fast.drops.length,0);
});
test('wet-road braking increases stopping distance and dry input is unchanged',()=>{
  const start={x:3,z:0,heading:0,speed:7,steer:0,reverse:false};
  const dry={...start},explicitDry={...start},wet={...start};
  for(let i=0;i<200;i++){
    stepVan(dry,{steer:0,gas:0,brake:1},.025,[]);
    stepVan(explicitDry,{steer:0,gas:0,brake:1,wet:false},.025,[]);
    stepVan(wet,{steer:0,gas:0,brake:1,wet:true},.025,[]);
  }
  assert.deepEqual(dry,explicitDry);
  assert.equal(dry.speed,0);assert.equal(wet.speed,0);
  assert.ok(Math.abs(wet.z)>Math.abs(dry.z));
});
