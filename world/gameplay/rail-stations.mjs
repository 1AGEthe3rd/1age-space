// Explicit station-level allowlist. TriMet platform IDs from official station pages.
// WMATA codes are initial published API crosswalk candidates; verify against the
// authenticated station catalog before enabling DC queries in a deployed service.
export const railStations=Object.freeze(Object.fromEntries([
  {id:'pdx-killingsworth',city:'us-or-portland',name:'N Killingsworth St',provider:'trimet',stops:['11503','11512'],lines:['190'],timeZone:'America/Los_Angeles',verified:true},
  {id:'pdx-interstate-rose-quarter',city:'us-or-portland',name:'Interstate/Rose Quarter',provider:'trimet',stops:['11507','11508'],lines:['190'],timeZone:'America/Los_Angeles',verified:true},
  {id:'pdx-rose-quarter',city:'us-or-portland',name:'Rose Quarter TC',provider:'trimet',stops:['8340','8377'],lines:['90'],timeZone:'America/Los_Angeles',verified:true},
  {id:'pdx-airport',city:'us-or-portland',name:'Portland International Airport',provider:'trimet',stops:['10579'],lines:['90'],timeZone:'America/Los_Angeles',verified:true},
  {id:'dc-anacostia',city:'us-dc-washington',name:'Anacostia',provider:'wmata',stops:['F06'],lines:['GR'],timeZone:'America/New_York',verified:false},
  {id:'dc-navy-yard',city:'us-dc-washington',name:'Navy Yard–Ballpark',provider:'wmata',stops:['F05'],lines:['GR'],timeZone:'America/New_York',verified:false},
  {id:'dc-airport',city:'us-dc-washington',name:'Ronald Reagan Washington National Airport',provider:'wmata',stops:['C10'],lines:['YL','BL'],timeZone:'America/New_York',verified:false}
].map(s=>[s.id,Object.freeze({...s,stops:Object.freeze(s.stops),lines:Object.freeze(s.lines)})])));
export function stationById(id){return Object.hasOwn(railStations,id)?railStations[id]:null;}
