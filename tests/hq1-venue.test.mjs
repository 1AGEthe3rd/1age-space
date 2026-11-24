import assert from 'node:assert/strict';
import test from 'node:test';
import { neighborhood, entranceAt, arrivalFor, venueUrl } from '../hq1/venues.mjs';

const gym = neighborhood.venues.find(venue => venue.id === 'hq1-nnb-gym');

test('HQ1 keeps its original conceptual gym and stable venue ID', () => {
  assert.ok(gym, 'Missing original NNB gym venue');
  assert.equal(gym.status, 'Virtual concept');
  assert.equal(gym.destination.url, 'https://nonamebesuto.com/');
  assert.deepEqual(gym.arrival, { x: -9.6, z: -31, heading: Math.PI / 2 });
});

test('walking to the NNB entrance enables only a nearby destination', () => {
  assert.equal(entranceAt(gym.entrance.x, gym.entrance.z)?.id, gym.id);
  assert.equal(entranceAt(gym.entrance.x + gym.entrance.range + 0.1, gym.entrance.z), null);
  assert.equal(entranceAt(0, 0), null);
});

test('HQ1 outbound route preserves the return contract', () => {
  const url = new URL(venueUrl(gym));
  assert.equal(url.origin, 'https://nonamebesuto.com');
  assert.equal(url.searchParams.get('from'), 'hq1');
  assert.equal(url.searchParams.get('venue'), gym.id);
  assert.equal(url.searchParams.size, 2);
});

test('returning from the gym uses an approved fixed position, not URL coordinates', () => {
  assert.deepEqual(arrivalFor('?return=hq1-nnb-gym'), gym.arrival);
  assert.deepEqual(arrivalFor('?return=hq1-nnb-gym&x=999&z=999'), gym.arrival);
  assert.deepEqual(arrivalFor('?return=unknown'), neighborhood.arrival);
  assert.deepEqual(arrivalFor('?return=__proto__'), neighborhood.arrival);
  assert.deepEqual(arrivalFor(''), neighborhood.arrival);
});

test('venue destinations must use credential-free HTTPS links', () => {
  assert.throws(() => venueUrl({ ...gym, destination: { url: 'http://example.org/' } }), /HTTPS/);
  assert.throws(() => venueUrl({ ...gym, destination: { url: 'https://user:secret@example.org/' } }), /HTTPS/);
});

test('future venues retain distinct stable entrances and arrivals', () => {
  const second = {
    ...gym,
    id: 'hq1-concept-venue-002',
    entrance: { x: 10, z: -5, range: 2 },
    arrival: { x: 9, z: -5, heading: 0 },
    destination: { url: 'https://example.org/virtual/', mode: 'link' },
  };
  assert.equal(entranceAt(10, -5, [gym, second])?.id, second.id);
  assert.equal(new URL(venueUrl(second)).searchParams.get('venue'), second.id);
});
