import test from 'node:test';
import assert from 'node:assert/strict';
import {javanLot} from './javan-lot.mjs';
import {fitsRoad} from './crossings.mjs';
import {stepVan} from './motor.mjs';

test('Javan test-drive lot connects to MLK only through its gate',()=>{
  assert.ok(fitsRoad(javanLot.spawnX,javanLot.spawnZ,javanLot.spawnHeading));
  for(let x=-18.5;x<=-3.5;x+=.5)assert.ok(fitsRoad(x,104,-Math.PI/2),'driveway at '+x);
  assert.ok(!fitsRoad(-11.7,96,-Math.PI/2));
  assert.ok(!fitsRoad(-24,104,0));
  assert.ok(!fitsRoad(9,0,0));
  assert.ok(fitsRoad(3,0,0));
});

test('vehicle can accelerate out of lot, turn onto MLK, and brake to a stop',()=>{
  const car={x:javanLot.spawnX,z:javanLot.spawnZ,heading:javanLot.spawnHeading,speed:0,steer:0,reverse:false};
  for(let i=0;i<600&&car.x<-7.5;i++)stepVan(car,{steer:0,gas:.45,brake:0},.025,[]);
  assert.ok(car.x>=-7.5);
  for(let i=0;i<800&&car.heading<-.08;i++)stepVan(car,{steer:-1,gas:.28,brake:0},.025,[]);
  assert.ok(car.heading>=-.08&&fitsRoad(car.x,car.z,car.heading));
  for(let i=0;i<100;i++)stepVan(car,{steer:0,gas:0,brake:1},.025,[]);
  assert.ok(Math.abs(car.speed)<.001);
});

test('reverse gear moves backwards and respects parked fleet collision',()=>{
  const car={x:-18.5,z:104,heading:-Math.PI/2,speed:0,steer:0,reverse:true};
  const parked={x:-21.8,z:104,heading:0};
  const start=car.x;
  for(let i=0;i<200;i++)stepVan(car,{steer:0,gas:1,brake:0},.025,[parked]);
  assert.ok(car.x<start);
  assert.ok(car.x>-20.6);
});
