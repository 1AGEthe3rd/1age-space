import test from 'node:test';
import assert from 'node:assert/strict';
import {stepVehicle} from './vehicle-physics.mjs';
import {vehicleFootprint,roadContains} from './road-geometry.mjs';
import {driveCamera,driveToggle,drivingInput,controllerDriveCodes} from './driving-session.mjs';
import {createWindshield} from './windshield-model.mjs';
test('shared physics requires and respects the city road predicate',()=>{
  const car={x:0,z:0,heading:0,speed:3,steer:0,reverse:false};
  const input={gas:1,brake:0,steer:0};
  assert.throws(()=>stepVehicle({...car},input,.025,[]),TypeError);
  const stopped={...car};stepVehicle(stopped,input,.025,[],()=>false);
  assert.equal(stopped.speed,0);assert.equal(stopped.z,0);
  const moving={...car};stepVehicle(moving,input,.025,[],()=>true);assert.ok(moving.z<0);
});
test('mapped road footprint is bounded and rejects a sidewalk outside its width',()=>{
  const segments=[{a:[0,-20],b:[0,20],width:6}];
  const fits=(x,z,h)=>vehicleFootprint(x,z,h,(px,pz)=>roadContains(segments,px,pz));
  assert.ok(fits(0,0,0));assert.equal(fits(2.8,0,0),false);
});
test('one driving camera supports both steering-wheel sides',()=>{
  const camera={position:{set(x,y,z){Object.assign(this,{x,y,z})}},lookAt(){}};
  const controls={move:{x:0,y:0},look:{x:0,y:0}};
  for(const driverSide of [-1,1]){
    const car={x:0,z:0,heading:0,driverSide};
    driveCamera(camera,car,2,{yaw:0,pitch:0},controls,.025);
    assert.equal(camera.position.x,.48*driverSide);
  }
  const car={wiperMode:0,speed:0,reverse:false,lights:false,signal:0};
  driveToggle(car,'KeyT');driveToggle(car,'KeyH');assert.equal(car.wiperMode,1);assert.equal(car.lights,true);
  assert.deepEqual(controllerDriveCodes([8,10]),['KeyT','KeyV']);
  assert.equal(drivingInput(new Set(['KeyW']),controls,{gas:0,brake:0},null,true).gas,1);
});
test('shared windshield is bounded and clears in dry conditions',()=>{
  const model=createWindshield(()=>.5);
  for(let i=0;i<200;i++)model.tick(.05,true,0,0);
  assert.ok(model.drops.length>0&&model.drops.length<=100);
  for(let i=0;i<40;i++)model.tick(.05,false,0,0);
  assert.equal(model.drops.length,0);assert.equal(model.position,0);
});
