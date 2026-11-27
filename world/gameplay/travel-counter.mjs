import {createAirportCatalog,virtualRoutesFrom,travelPolicy} from './travel-catalog.mjs';
import {createPublicHandoff,localDate} from './travel-request.mjs';
// Optional accessible interaction for a physical 3D airport counter. City owns mesh,
// trigger, focus and destination routing; this module does not change any city scene.
export function createTravelCounter({origin,catalog=createAirportCatalog(),onVirtualRoute=()=>{},host=document.body,clock=Date.now}={}){
  const airport=catalog.get(origin);
  if(!airport)throw Error('Unknown departure airport');
  const dialog=document.createElement('dialog');dialog.className='world-travel-counter';
  dialog.setAttribute('aria-label','World travel services');
  const heading=document.createElement('h2');heading.textContent=airport.code+' · Travel services';dialog.append(heading);
  function element(tag,label,parent=dialog){const el=document.createElement(tag);el.textContent=label;parent.append(el);return el;}
  function button(label,action,parent=dialog){const b=element('button',label,parent);b.type='button';b.addEventListener('click',action);return b;}
  element('p','Virtual trips and real-world airline searches are separate.');
  const virtual=element('section','');
  element('h3','Virtual travel',virtual);
  const routes=virtualRoutesFrom(origin,catalog);
  if(!routes.length)element('p','No published virtual routes from this airport.',virtual);
  for(const route of routes)button('Virtual trip to '+route.destination,()=>{dialog.close();onVirtualRoute(route);},virtual);
  const real=element('section','');element('h3','Real flight search',real);
  const form=element('form','',real);
  function field(name,type,value){
    const label=element('label',name,form),input=document.createElement('input');
    input.type=type;input.value=value;label.append(input);return input;
  }
  const destination=field('Destination airport code','text','');destination.maxLength=3;destination.required=true;destination.pattern='[A-Za-z]{3}';destination.autocapitalize='characters';
  const outbound=field('Depart','date',localDate(clock(),airport.timeZone));outbound.required=true;
  const back=field('Return (optional)','date','');
  const adults=field('Adults','number','1');adults.min='1';adults.max='9';adults.required=true;
  const cabinLabel=element('label','Cabin',form),cabin=document.createElement('select');cabinLabel.append(cabin);
  for(const [id,name] of [['economy','Economy'],['premium_economy','Premium economy'],['business','Business'],['first','First']]){const option=element('option',name,cabin);option.value=id;}
  const submit=element('button','Prepare real flight search',form);submit.type='submit';
  const result=element('div','',real);result.setAttribute('aria-live','polite');
  form.addEventListener('input',()=>result.replaceChildren());
  form.addEventListener('submit',event=>{
    event.preventDefault();result.replaceChildren();
    try{
      const handoff=createPublicHandoff({origin,destination:destination.value.trim().toUpperCase(),outbound:outbound.value,returnDate:back.value,adults:Number(adults.value),cabin:cabin.value},{catalog,now:clock()});
      const q=handoff.request;
      element('p',q.origin+' → '+q.destination+' · '+q.outbound+(q.returnDate?' / '+q.returnDate:'')+' · '+q.adults+' adult(s) · '+cabin.selectedOptions[0].textContent,result);
      element('p',handoff.notice,result);
      const link=element('a','Continue to external flight search',result);
      link.href=handoff.url;link.target='_blank';link.rel='noopener noreferrer';
    }catch(error){element('p',error.message,result);}
  });
  element('p',travelPolicy.directBookingEnabled?'':'No tickets are sold by 1AGE in this build.');
  button('Close',()=>dialog.close());host.append(dialog);
  let previous=null;
  dialog.addEventListener('close',()=>{result.replaceChildren();previous?.focus?.({preventScroll:true});previous=null;});
  return {open(){if(dialog.open)return;previous=document.activeElement;outbound.min=localDate(clock(),airport.timeZone);if(outbound.value<outbound.min)outbound.value=outbound.min;dialog.showModal();},close(){dialog.close();},dispose(){dialog.close();dialog.remove();}};
}
