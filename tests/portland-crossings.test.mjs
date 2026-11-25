import assert from 'node:assert/strict';
import test from 'node:test';
import {crossings,fitsRoad,signalPhases} from '../hq1/portland/crossings.mjs';
import {stepVan} from '../hq1/portland/motor.mjs';

for(const [name,{z,halfWidth}] of Object.entries(crossings)){
  test(name+' allows a van to turn from MLK into the east arm',()=>{
    const van={x:3,z:z+9,heading:0,speed:2.8,steer:0,reverse:false};
    for(let i=0;i<850;i++){
      const steer=van.heading> -Math.PI/2+.14 && van.z<z+6?1:0;
      stepVan(van,{gas:.2,brake:0,steer},1/60);
      if(van.x>18)break;
    }
    assert.ok(van.x>18,JSON.stringify(van));
    assert.ok(Math.abs(van.z-z)<halfWidth);
    assert.ok(!fitsRoad(32,z,Math.PI/2));
    assert.ok(!fitsRoad(14,z+halfWidth+.5,Math.PI/2));
  });
}
test('opposing green phases have all-red clearance',()=>{
  for(const [at,expect] of [[0,['green','red']],[16,['amber','red']],[19,['red','red']],[22,['red','green']],[31,['red','amber']],[35,['red','red']],[36,['green','red']]])
    assert.deepEqual(signalPhases(at),expect);
});
