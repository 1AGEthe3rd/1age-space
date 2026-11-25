import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {jarrettBlock} from '../hq1/portland/jarrett.mjs';
import {arrivalFor, neighborhood} from '../hq1/venues.mjs';
import {buildingFootprint, districtBounds} from '../hq1/streetscape.mjs';
import {geographicIndex} from '../space/geography.mjs';
const read = async path => JSON.parse(await readFile(new URL(path,import.meta.url)));
test('Portland bindings resolve to shared records and existing founder venues', async () => {
  const manifest = await read('../hq1/portland/city.json');
  const catalog = await read('../space/data/catalog.json');
  const city = geographicIndex(catalog).cities.find(c => c.city === manifest.city.city && c.region === manifest.city.region && c.country === manifest.city.country);
  for (const link of manifest.propertyConnections) assert.ok(city.properties.includes(link.propertyId));
  assert.equal(manifest.district.id,neighborhood.id);
  assert.equal(manifest.district.selfServiceClaims,false);
  assert.deepEqual(manifest.district.protectedVenueIds.sort(),neighborhood.venues.map(v=>v.id).sort());
});
test('Jarrett arrival, both sidewalks and the crossing are clear of all new facades', () => {
  const footprints = jarrettBlock.map(buildingFootprint);
  function clear(x,z) {
    assert.ok(z >= districtBounds.minZ && z <= districtBounds.maxZ);
    assert.ok(footprints.every(b => x < b.x-.34 || x > b.x+b.w+.34 || z < b.z-.34 || z > b.z+b.d+.34));
  }
  const start=arrivalFor('?stop=jarrett');
  assert.notDeepEqual(start,neighborhood.arrival);
  clear(start.x,start.z);
  for (let z=-111;z>=-177;z--) for (const x of [-8.9,0,8.9]) clear(x,z);
  for (let x=-33;x<=33;x++) clear(x,-165);
});
