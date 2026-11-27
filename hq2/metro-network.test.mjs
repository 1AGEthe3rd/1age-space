import test from 'node:test';
import assert from 'node:assert/strict';
import {GREEN,YELLOW,TRANSFER,AIRPORT_STOP,otherLine,exitDestination,airportUrl,airportMetroUrl} from './metro-network.mjs';
test('existing Green Line south of Anacostia is preserved',()=>{
 assert.deepEqual(GREEN.slice(3),['Anacostia','Congress Heights','Southern Avenue','Naylor Road','Suitland','Branch Avenue']);
});
test('airport route uses L’Enfant Plaza in both directions',()=>{
 assert.deepEqual(GREEN.slice(0,4).reverse(),['Anacostia','Navy Yard–Ballpark','Waterfront',TRANSFER]);
 assert.deepEqual(YELLOW,[TRANSFER,'Pentagon','Pentagon City','Crystal City',AIRPORT_STOP]);
 assert.equal(otherLine('green',TRANSFER),'yellow');
 assert.equal(otherLine('yellow',TRANSFER),'green');
 assert.equal(otherLine('green','Waterfront'),null);
});
test('only supported street and terminal exits are enabled',()=>{
 assert.equal(exitDestination('yellow',AIRPORT_STOP),'airport');
 assert.equal(exitDestination('green','Anacostia'),'anacostia-metro');
 assert.equal(exitDestination('green','Navy Yard–Ballpark'),'navy-yard-half-street');
 assert.equal(exitDestination('green',TRANSFER),null);
 assert.equal(exitDestination('yellow','Pentagon'),null);
 assert.equal(airportUrl,'../hq1/?airport=dca');
 assert.equal(airportMetroUrl,'../hq2/?destination=dca-metro');
});
