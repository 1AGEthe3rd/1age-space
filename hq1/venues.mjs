export const neighborhood = {
  id: 'hq1-portland-sol-road',
  arrival: { x: -9.7, z: 10, heading: 0 },
  venues: [
    {
      id: 'hq1-nnb-gym',
      neighborhoodId: 'hq1-portland-sol-road',
      name: 'No Name Besuto',
      operator: 'No Name Besuto',
      category: 'Training gym',
      position: { x: -17.2, z: -31 },
      orientation: Math.PI / 2,
      appearance: { width: 15, depth: 10, height: 6.5, color: '#242b34', accent: '#d9aa61' },
      entrance: { x: -12, z: -31, range: 2.6 },
      arrival: { x: -9.6, z: -31, heading: Math.PI / 2 },
      destination: { url: 'https://nonamebesuto.com/', mode: 'link' },
      status: 'Virtual concept',
    },
  ],
};

export function entranceAt(x, z, venues = neighborhood.venues) {
  return venues.filter(venue => venue.destination?.mode === 'link')
    .map(venue => ({ venue, distance: Math.hypot(venue.entrance.x - x, venue.entrance.z - z) }))
    .filter(({ venue, distance }) => distance <= venue.entrance.range)
    .sort((a, b) => a.distance - b.distance)[0]?.venue ?? null;
}

export function venueUrl(venue) {
  const url = new URL(venue.destination.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Venue destinations require a public HTTPS URL');
  url.searchParams.set('from', 'hq1');
  url.searchParams.set('venue', venue.id);
  return url.href;
}

export function arrivalFor(search) {
  const key = new URLSearchParams(search).get('return');
  return neighborhood.venues.find(venue => venue.id === key)?.arrival ?? neighborhood.arrival;
}
