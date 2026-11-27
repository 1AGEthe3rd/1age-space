import test from 'node:test';
import assert from 'node:assert/strict';
import {demoFleet,doorPoint,nearestAccessibleVehicle,vehicleWalkable} from './demo-fleet.mjs';
import {fitsRoad} from './crossings.mjs';
import {stepVan} from './motor.mjs';

test('demo fleet has three unique virtual IDs and no commercial permissions',()=>{
  assert.equal(demoFleet.length,3);
  assert.equal(new Set(demoFleet.map(p=>p.id)).size,3);
  for(const p of demoFleet){
    assert.equal(p.rightHandDrive,true);
    assert.equal(p.salesEnabled,false);
    assert.equal(p.rentalsEnabled,false);
    assert.equal(p.availability,'virtual-demo');
  }
});
test('each demo can leave the lot and turn northbound with the other vehicles parked',()=>{
  for(const p of demoFleet){
    const car={...p,speed:0,steer:0,reverse:false};
    const parked=demoFleet.filter(q=>q.id!==p.id);
    for(let x=p.x;x<=-3.5;x+=.25)assert.ok(fitsRoad(x,p.z,p.heading));
    for(let i=0;i<800&&car.x<-3.5;i++)stepVan(car,{steer:0,gas:.45,brake:0},.025,parked);
    assert.ok(car.x>=-3.5,p.id+' exit');
    for(let i=0;i<900&&car.heading<-.08;i++)stepVan(car,{steer:-1,gas:.28,brake:0},.025,parked);
    assert.ok(car.heading>=-.08&&car.x>0&&fitsRoad(car.x,car.z,car.heading),p.id+' turn');
  }
});
test('walking up to a car selects it and blocks interactions through walls',()=>{
  const fleet=demoFleet.map(car=>({car}));
  for(const item of fleet){
    const {x,z}=doorPoint(item.car);
    assert.equal(nearestAccessibleVehicle(fleet,x,z),item);
    assert.equal(nearestAccessibleVehicle(fleet,x,z,()=>false),null);
    assert.equal(vehicleWalkable(fleet,item.car.x,item.car.z),false);
    assert.equal(vehicleWalkable(fleet,x,z),true);
  }
  assert.equal(nearestAccessibleVehicle(fleet,0,0),null);
  assert.equal(vehicleWalkable(fleet,-16,104),true);
});
