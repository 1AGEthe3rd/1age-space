import {createAirportCatalog,publicFlightSearch} from './travel-catalog.mjs';
const airportCode=/^[A-Z]{3}$/;
function calendarDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const stamp=Date.parse(value+'T12:00:00Z');
  return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value;
}
export function localDate(now,timeZone){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
  return p.year+'-'+p.month+'-'+p.day;
}
export function createTravelRequest(input,{now=Date.now(),catalog=createAirportCatalog()}={}){
  if(!input||typeof input!=='object'||!Number.isFinite(now))throw new TypeError('Invalid travel request');
  const origin=input.origin,destination=input.destination,airport=catalog.get(origin);
  if(!airport||!airportCode.test(origin)||!airportCode.test(destination)||origin===destination)throw new TypeError('Choose distinct airports');
  // Unknown destination codes may be entered as search terms only; real providers must verify them.
  const outbound=input.outbound,returnDate=input.returnDate||null,adults=input.adults;
  if(!calendarDate(outbound)||outbound<localDate(now,airport.timeZone)||returnDate&&(!calendarDate(returnDate)||returnDate<outbound))throw new TypeError('Choose valid travel dates');
  if(!Number.isInteger(adults)||adults<1||adults>9)throw new TypeError('Choose 1–9 adults');
  if(!['economy','premium_economy','business','first'].includes(input.cabin))throw new TypeError('Choose a cabin');
  return Object.freeze({kind:'real-flight-search',origin,destination,outbound,returnDate,adults,cabin:input.cabin});
}
export function createPublicHandoff(request,options){
  const safe=createTravelRequest(request,options);
  // Fixed, reviewed public URL. Never forward arbitrary user URLs or identity/payment data.
  return Object.freeze({kind:'external-search',request:safe,provider:publicFlightSearch.name,url:publicFlightSearch.url,
    requiresConfirmation:true,prefilled:false,reserved:false,affiliate:false,
    notice:'Continue on Skyscanner and enter these trip details. No flight has been reserved. Prices and availability are supplied by the external provider.'});
}
