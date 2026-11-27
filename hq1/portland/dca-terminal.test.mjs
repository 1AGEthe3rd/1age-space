import test from 'node:test';
import assert from 'node:assert/strict';
import {dcaSpawn,dcaGate,dcaBounds,dcaObstacles,dcaWalkable,nearDcaGate} from './dca-terminal.mjs';
test('DCA arrival plaza has continuous public path to simulated departure',()=>{
 assert.ok(dcaWalkable(dcaSpawn.x,dcaSpawn.z));
 for(let z=dcaSpawn.z;z>=dcaGate.z;z-=.1)assert.ok(dcaWalkable(0,z));
 assert.ok(nearDcaGate(dcaGate.x,dcaGate.z));
 assert.equal(nearDcaGate(dcaSpawn.x,dcaSpawn.z),false);
});
test('DCA public entrance is open only inside the doorway',()=>{
 assert.ok(dcaWalkable(0,27));
 assert.equal(dcaWalkable(6,27),false);
 assert.equal(dcaWalkable(-6,27),false);
});
test('DCA collision blocks fixtures and outer boundaries',()=>{
 for(const o of dcaObstacles)assert.equal(dcaWalkable(o.x,o.z),false);
 for(const [x,z] of [[dcaBounds.minX,0],[dcaBounds.maxX,0],[0,dcaBounds.minZ],[0,dcaBounds.maxZ],[NaN,0]])assert.equal(dcaWalkable(x,z),false);
 assert.equal(nearDcaGate(8,-23),false);
});
