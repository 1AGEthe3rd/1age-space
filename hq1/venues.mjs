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
      appearance: { width: 15, depth: 10, height: 6.5, color: '#a25c46', accent: '#323d37', style: 'gym' },
      entrance: { x: -12, z: -31, range: 2.6 },
      arrival: { x: -9.6, z: -31, heading: Math.PI / 2 },
      destination: { url: 'https://nonamebesuto.com/', mode: 'link' },
      status: 'Virtual concept',
    },
    {
      id: 'hq1-alberta-workroom',
      neighborhoodId: 'hq1-portland-sol-road',
      name: 'Alberta Workroom',
      operator: '1AGE Space demonstration',
      category: 'Commercial shell',
      position: { x: -17.3, z: -14.1 },
      orientation: Math.PI / 2,
      appearance: { width: 11.4, depth: 9, height: 5.8, color: '#c0a081', accent: '#33504b', style: 'workshop' },
      entrance: { x: -12.1, z: -14.1, range: 2.6 },
      arrival: { x: -9.7, z: -14.1, heading: Math.PI / 2 },
      destination: { url: 'https://1age.space/hq1/?inside=hq1-alberta-workroom', mode: 'link', interior: 'workroom' },
      status: 'Fictional demonstration space',
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

export function interiorFor(search) {
  const key = new URLSearchParams(search).get('inside');
  return neighborhood.venues.find(venue => venue.id === key && venue.destination.interior) ?? null;
}

export function returnToVenue(venue) {
  return '?return=' + encodeURIComponent(venue.id);
}
