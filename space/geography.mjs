// Derive discovery groups from the preserved catalog; never invent coordinates.
export function geographicIndex(catalog) {
 if(catalog.schemaVersion!==1||!Array.isArray(catalog.properties))throw Error('Unsupported property catalog');
 const groups=new Map(),ids=new Set();
 for(const p of catalog.properties){
  if(!p?.id||ids.has(p.id))throw Error('Missing or duplicate property ID');ids.add(p.id);
  const a=p.address;if(!a?.countryCode||!a.city)throw Error('Missing property geography');
  const id=JSON.stringify([a.countryCode,a.region||'',a.city].map(x=>x.trim().normalize('NFC').toLowerCase()));
  if(!groups.has(id))groups.set(id,{id,country:a.countryCode,region:a.region||'',city:a.city,properties:[],sourceIds:new Set()});
  const group=groups.get(id);group.properties.push(p.id);for(const source of p.verification?.sourceIds||[])group.sourceIds.add(source);
 }
 const cities=[...groups.values()].map(g=>({...g,properties:g.properties.sort(),sourceIds:[...g.sourceIds].sort()})).sort((a,b)=>a.id.localeCompare(b.id));
 return {properties:ids.size,countries:[...new Set(cities.map(c=>c.country))].sort(),cities,regions:new Set(cities.map(c=>JSON.stringify([c.country,c.region]))).size,coordinates:catalog.properties.filter(p=>Number.isFinite(p.coordinates?.latitude)&&Number.isFinite(p.coordinates?.longitude)).length,sources:catalog.sources?.length||0};
}
export function catalogDestination(city,propertyId){
 if(!city.properties.includes(propertyId))throw Error('Property does not belong to this geographic group');
 return 'catalog.html?'+new URLSearchParams({country:city.country,city:city.city,property:propertyId});
}
