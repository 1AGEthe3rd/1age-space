// World destination registry is independent of the provider's worldwide airport search.
export const initialAirports=Object.freeze([
  Object.freeze({code:'PDX',cityId:'us-or-portland',name:'Portland International Airport',timeZone:'America/Los_Angeles',worldDestination:'pdx'}),
  Object.freeze({code:'DCA',cityId:'us-dc-washington',name:'Ronald Reagan Washington National Airport',timeZone:'America/New_York',worldDestination:'dca'})
]);
const codePattern=/^[A-Z]{3}$/;
export function createAirportCatalog(records=initialAirports){
  const airports=new Map();
  for(const r of records){
    if(!codePattern.test(r.code)||airports.has(r.code)||!r.cityId||!r.name||!r.timeZone)throw new TypeError('Invalid or duplicate airport');
    new Intl.DateTimeFormat('en-US',{timeZone:r.timeZone}).format(0);
    airports.set(r.code,Object.freeze({...r}));
  }
  return {get:code=>airports.get(code)||null,list:()=>[...airports.values()]};
}
export const initialVirtualRoutes=Object.freeze([
  Object.freeze({id:'world-pdx-dca',origin:'PDX',destination:'DCA',kind:'virtual',fareEnabled:false}),
  Object.freeze({id:'world-dca-pdx',origin:'DCA',destination:'PDX',kind:'virtual',fareEnabled:false})
]);
export function virtualRoutesFrom(origin,catalog=createAirportCatalog(),routes=initialVirtualRoutes){
  return routes.filter(r=>r.kind==='virtual'&&r.origin===origin&&r.destination!==origin&&catalog.get(r.origin)?.worldDestination&&catalog.get(r.destination)?.worldDestination);
}
// Public search entry, not a partner deep link. No referral tracking or commission.
export const publicFlightSearch=Object.freeze({id:'skyscanner-public',name:'Skyscanner',url:'https://www.skyscanner.net/flights',affiliate:false});
export const travelPolicy=Object.freeze({liveSearchEnabled:false,directBookingEnabled:false,paymentsEnabled:false,affiliateEnabled:false,collectPassengerIdentity:false});
