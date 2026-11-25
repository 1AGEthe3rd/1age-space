import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {makeTile,segmentDistance} from '../hq2/streets.mjs';
import {searchProperties} from '../space/catalog.mjs';

const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url)));
const geo=load('../hq2/geography/index.json');
const designs=load('../hq2/designs.json');
const region=load('../space/data/dmv.json');
const catalog=load('../space/data/catalog.json');
const tiles=geo.tiles.map(id=>makeTile(load('../hq2/geography/'+id+'.json'),designs,false));
const properties=catalog.properties.filter(p=>p.protection?.zoneId==='hq2');

test('every active arrival is on land or a pedestrian deck and outside the building shells',()=>{
  const arrived=[...region.destinations.filter(d=>d.arrival),
    ...properties.filter(p=>p.spaceDestination).map(p=>({id:p.id,...p.spaceDestination}))];
  for(const {id,arrival:[x,z]} of arrived) {
    assert(geo.tiles.includes(`${Math.floor(x/geo.tileSize)}_${Math.floor(z/geo.tileSize)}`),id);
    assert(!tiles.some(t=>t.blockers.some(isInside=>isInside(x,z))),id+' in building');
    if(tiles.some(t=>t.water.some(isWet=>isWet(x,z)))) {
      assert(tiles.some(t=>t.decks.some(([a,b,width,,type])=>
        ['footway','cycleway','path'].includes(type)&&segmentDistance(x,z,a,b)<width)),id+' in water');
    }
  }
});
test('protected places and linked businesses remain searchable; regional plans have no premature arrivals',()=>{
  assert(properties.every(p=>p.protection.publicExploration && !p.protection.claimEligible));
  assert.equal(searchProperties(catalog.properties,{q:'Kitchen Savages',businesses:catalog.businessProfiles})[0].id,'place-us-washington-mlk-gateway-phase-1');
  assert.equal(region.destinations.find(x=>x.id==='oneage-treasury').arrival,undefined);
  assert(region.destinations.filter(x=>x.cityId!=='us-dc-washington').every(x=>!x.arrival));
});
