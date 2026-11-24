import assert from 'node:assert/strict';
import test from 'node:test';
import { arrivalFor, entranceAt, interiorFor, neighborhood, returnToVenue, venueUrl } from '../hq1/venues.mjs';

const [nnb, workroom] = neighborhood.venues;

test('NNB keeps its published ID, approach, destination and return position', () => {
  assert.equal(nnb.id, 'hq1-nnb-gym');
  assert.equal(entranceAt(-10, -31), nnb);
  assert.equal(venueUrl(nnb), 'https://nonamebesuto.com/?from=hq1&venue=hq1-nnb-gym');
  assert.deepEqual(arrivalFor('?return=hq1-nnb-gym'), { x:-9.6, z:-31, heading:Math.PI/2 });
});

test('the fictional workroom has an independent approach, interior and return position', () => {
  assert.equal(entranceAt(-10, -14.1), workroom);
  const link = new URL(venueUrl(workroom));
  assert.equal(link.origin, 'https://1age.space');
  assert.equal(link.pathname, '/hq1/');
  assert.equal(link.searchParams.get('venue'), workroom.id);
  assert.equal(interiorFor(link.search), workroom);
  assert.deepEqual(arrivalFor(returnToVenue(workroom)), workroom.arrival);
  assert.equal(entranceAt(neighborhood.arrival.x, neighborhood.arrival.z), null);
});

test('unsupported scene IDs and unsafe external URLs are rejected', () => {
  assert.equal(interiorFor('?inside=hq1-nnb-gym'), null);
  assert.equal(interiorFor('?inside=unknown'), null);
  assert.deepEqual(arrivalFor('?return=unknown'), neighborhood.arrival);
  for (const url of ['http://example.com','https://user@example.com/','javascript:alert(1)']) {
    assert.throws(() => venueUrl({ id:'bad', destination:{ url } }), /HTTPS/);
  }
});
