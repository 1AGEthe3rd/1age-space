import test from 'node:test';
import assert from 'node:assert/strict';
import {kentonWalkable,kentonStreets,insideKentonStudio} from '../hq1/portland/kenton.mjs';
test('the station connects continuously to Denver Avenue and three cross streets',()=>{
  for(let x=-81;x<=-4;x+=.25)assert.ok(kentonWalkable(x,1.8));
  for(const {x} of kentonStreets)for(let z=-20;z<=20;z+=.25)assert.ok(kentonWalkable(x,z));
  assert.ok(!kentonWalkable(-36,-12));assert.ok(!kentonWalkable(-78,24));
});
test('studio has a walk-through door, a bounded interior and a continuous exit',()=>{
  for(let z=1.8;z<16.3;z+=.1)assert.ok(kentonWalkable(-36,z));
  assert.ok(insideKentonStudio(-36,14));assert.ok(!kentonWalkable(-34,9.3));
  assert.ok(!kentonWalkable(-36,18.3));assert.ok(!kentonWalkable(-44.2,14));
});
