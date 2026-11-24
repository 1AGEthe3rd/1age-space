import test from 'node:test';
import assert from 'node:assert/strict';
import { approachAt, arrivalFor, neighborhood, venueUrl } from '../hq1/venues.mjs';
import { buildingFootprint, districtBounds, neighboringBuildings } from '../hq1/streetscape.mjs';
const venue = neighborhood.venues.find(item=>item.id==='hq1-northleftchef');
const obstacles = [...neighborhood.venues,...neighboringBuildings].map(buildingFootprint);
const isOpen = (x,z) => x>districtBounds.minX && x<districtBounds.maxX &&
  z>districtBounds.minZ && z<districtBounds.maxZ &&
  !obstacles.some(box=>x>box.x-.34 && x<box.x+box.w+.34 && z>box.z-.34 && z<box.z+box.d+.34);

test('each storefront doorway has its own route and a walkable return path to MLK',()=>{
  for (const door of venue.entrances) {
    assert.equal(approachAt(door.x, door.z+1).door,door);
    const href = new URL(venueUrl(venue, door.id));
    assert.equal(href.origin,'https://northleftchef.com');
    assert.equal(href.searchParams.get('door'),door.id);
    const origin=arrivalFor('?return=hq1-northleftchef&door='+door.id);
    assert.deepEqual(origin,door.arrival);
    for (let z=origin.z;z< -86.5;z+=.25) assert.ok(isOpen(origin.x,z));
    for (let x=origin.x;x< -8.9;x+=.25) assert.ok(isOpen(x,-86.5));
  }
  assert.deepEqual(arrivalFor('?return=hq1-northleftchef&door=bogus'),venue.arrival);
});
