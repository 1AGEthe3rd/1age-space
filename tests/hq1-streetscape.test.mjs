import assert from 'node:assert/strict';
import test from 'node:test';
import { buildingFootprint, districtBounds, neighboringBuildings } from '../hq1/streetscape.mjs';
import { neighborhood } from '../hq1/venues.mjs';

const contains = (box, x, z, padding=0) => x > box.x-padding && x < box.x+box.w+padding
  && z > box.z-padding && z < box.z+box.d+padding;

test('facades facing Alberta have the correct street-aligned collision footprint', () => {
  const [corner] = neighboringBuildings.slice(-3);
  const footprint = buildingFootprint(corner);
  assert.ok(Math.abs(footprint.w-corner.appearance.width)<.0001);
  assert.ok(Math.abs(footprint.d-corner.appearance.depth)<.0001);
  assert.ok(contains(footprint,corner.position.x,corner.position.z));
});

test('the Alberta cross street and venue arrival positions remain clear', () => {
  const footprints = [...neighboringBuildings,...neighborhood.venues].map(buildingFootprint);
  for (let x=districtBounds.minX; x<=districtBounds.maxX; x+=.5) {
    assert.ok(footprints.every(box=>!contains(box,x,13,.34)), `blocked Alberta street at ${x}`);
  }
  for (const { arrival } of neighborhood.venues) {
    assert.ok(footprints.every(box=>!contains(box,arrival.x,arrival.z,.34)));
  }
});
