import {geographicIndex,catalogDestination} from './geography.mjs';
import {countryNames,safeExternal} from './catalog.mjs';
const $=s=>document.querySelector(s);
let index,catalog,current=[],selected,viewer,propertyMap=new Map(),visibleCount=20,selectedProperty=null;
function selectCity(id){
 selected=current.find(c=>c.id===id);if(!selected)return;selectedProperty=null;$('#property-info').hidden=true;viewer?.inspectProperty(false);
 for(const button of $('#cities').children)button.setAttribute('aria-pressed',String(button.dataset.city===id));
 $('#city-detail').hidden=false;$('#city-title').textContent=selected.city;
 $('#city-description').textContent=`${selected.region} · ${countryNames[selected.country]||selected.country} · ${selected.properties.length} indexed ${selected.properties.length===1?'place':'places'}`;
 $('#property-filter').value='';visibleCount=20;renderProperties();
 $('#browse').open=false;
 const url=new URL(location.href);url.searchParams.set('country',$('#country').value);url.searchParams.set('place',selected.properties[0]);history.replaceState(null,'',url);
 viewer?.highlight(id);
}
function applyCountry(preferred,showDetail=true){
 current=index.cities.filter(c=>$('#country').value==='all'||c.country===$('#country').value);
 $('#cities').replaceChildren();
 for(const city of current){const b=document.createElement('button');b.type='button';b.dataset.city=city.id;b.textContent=`${city.city} (${city.properties.length})`;b.addEventListener('click',()=>selectCity(city.id));$('#cities').append(b);}
 viewer?.setCities(current);if(current.length&&showDetail)selectCity(current.find(c=>c.id===preferred)?.id||current[0].id);else {selected=null;selectedProperty=null;viewer?.inspectProperty(false);$('#city-detail').hidden=true;const url=new URL(location.href);url.searchParams.set('country',$('#country').value);url.searchParams.delete('place');history.replaceState(null,'',url);}
}
async function init(){
 $('#retry').hidden=true;$('#country').disabled=true;
 try{const response=await fetch('space/data/catalog.json');if(!response.ok)throw Error('Catalog unavailable');catalog=await response.json();index=geographicIndex(catalog);propertyMap=new Map(catalog.properties.map(p=>[p.id,p]));
  $('#coverage').textContent=`${index.properties} indexed places · ${index.cities.length} cities · ${index.countries.length} countries · Starter coverage`;
  $('#country').replaceChildren(new Option('All indexed countries','all'));
  for(const code of index.countries)$('#country').append(new Option(countryNames[code]||code,code));$('#country').disabled=false;const params=new URLSearchParams(location.search);if(index.countries.includes(params.get('country')))$('#country').value=params.get('country');const preferred=index.cities.find(c=>c.properties.includes(params.get('place')));applyCountry(preferred?.id,!!preferred);if(preferred)selectProperty(params.get('place'));
  if(!viewer)try{const {createGeographyViewer}=await import('./geography-viewer.js');viewer=createGeographyViewer($('#geography-view'),selectCity);viewer.setCities(current);if(selected)viewer.highlight(selected.id);if(selectedProperty)viewer.inspectProperty(true);$('#render-status').textContent='3D ready. Drag horizontally to rotate; tap a city sphere to select. The buttons offer the same access.';}catch{$('#render-status').textContent='3D is unavailable. All indexed cities and property details remain accessible in the city list.';}
 }catch{$('#coverage').textContent='The property index could not be loaded. Existing records have not been changed.';$('#retry').hidden=false;}
}
$('#country').addEventListener('change',()=>applyCountry(undefined,false));$('#retry').addEventListener('click',init);
for(const button of document.querySelectorAll('[data-turn]'))button.addEventListener('click',()=>viewer?.turn(Number(button.dataset.turn)*.2));$('#reset-view').addEventListener('click',()=>viewer?.reset());
init();

function renderProperties(){
 if(!selected)return;
 const query=$('#property-filter').value.trim().toLocaleLowerCase();
 const matches=selected.properties.map(id=>propertyMap.get(id)).filter(p=>[p.name,p.address.line1].join(' ').toLocaleLowerCase().includes(query));
 $('#properties').replaceChildren();
 for(const property of matches.slice(0,visibleCount)){const link=document.createElement('a'),small=document.createElement('small');link.href='explore.html?'+new URLSearchParams({country:$('#country').value,place:property.id});link.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();selectProperty(property.id);});link.textContent=property.name;small.textContent=property.address.line1+(property.sourceSnapshot?' · Source '+property.sourceSnapshot+' · current status unverified':'');link.append(small);$('#properties').append(link);}
 if(!matches.length){const empty=document.createElement('p');empty.textContent='No matching indexed places in this city.';$('#properties').append(empty);}
 $('#more-properties').hidden=matches.length<=visibleCount;$('#more-properties').textContent=`Show more (${Math.max(0,matches.length-visibleCount)} remaining)`;
 const sourceIds=new Set(selected.sourceIds);for(const source of catalog.sources.filter(s=>sourceIds.has(s.id))){const url=safeExternal(source.url);if(!url)continue;const a=document.createElement('a');a.className='source-link';a.href=url;a.textContent='Source: '+source.title;$('#properties').append(a);if(source.licenseUrl){const credit=document.createElement('p');credit.className='muted';credit.textContent='Contains information licensed under the Open Government Licence – Vancouver.';const license=document.createElement('a');license.href=source.licenseUrl;license.textContent='Source licence';credit.append(license);$('#properties').append(credit);}}
}
$('#property-filter').addEventListener('input',()=>{visibleCount=20;renderProperties();});
$('#more-properties').addEventListener('click',()=>{visibleCount+=20;renderProperties();});
$('#close-detail').addEventListener('click',()=>{$('#city-detail').hidden=true;$('#browse').open=true;$('#browse summary').focus();});
$('#logo-toggle').addEventListener('click',()=>{const open=$('#logo-menu').hidden;$('#logo-menu').hidden=!open;$('#logo-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#city-detail').hidden=true;$('#logo-menu').hidden=true;$('#logo-toggle').setAttribute('aria-expanded','false');}});

function selectProperty(id){
 if(!selected?.properties.includes(id))return;const property=propertyMap.get(id);selectedProperty=property;
 $('#property-info').hidden=false;$('#property-title').textContent=property.name;$('#property-address').textContent=property.address.line1;
 $('#property-description').textContent=property.description;$('#property-snapshot').textContent=property.sourceSnapshot?'Source snapshot '+property.sourceSnapshot+' · Current operation and availability unverified':'Source checked '+property.verification.checkedAt+' · Availability unknown';
 $('#property-record').href=catalogDestination(selected,id);viewer?.inspectProperty(true);
 const url=new URL(location.href);url.searchParams.set('place',id);history.replaceState(null,'',url);
}
