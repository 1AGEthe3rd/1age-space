import {searchProperties,countryNames} from '../space/catalog.mjs';
import {ownershipCandidate} from './ownership.mjs';
export function mountPropertyPanel(host,section){
 const root=document.createElement('section');host.append(root);
 const el=(tag,t,parent=root)=>{const n=document.createElement(tag);n.textContent=t;parent.append(n);return n;};
 const link=(label,url,parent=root)=>{const a=el('a',label,parent);a.href=url;return a;};
 if(section==='build'){
 el('p','Create a fully virtual design independently of any real property. This local concept is not published, owned or attached to a real building.');
 const name=el('input','');name.placeholder='Space name';name.maxLength=80;name.setAttribute('aria-label','Space name');
 const select=el('select','');select.setAttribute('aria-label','Space type');for(const t of ['Commercial showroom','Studio','Office','Gallery','Custom space'])select.add(new Option(t,t));
 const notes=el('textarea','');notes.placeholder='Describe the design';notes.maxLength=1000;notes.setAttribute('aria-label','Design notes');
 const preview=el('button','Preview concept');preview.type='button';const result=el('p','');preview.onclick=()=>{result.textContent=(name.value.trim()||'Untitled space')+' · '+select.value+' · '+notes.value.trim()+' (unsaved concept)';};
 link('Existing property customization tools','../catalog.html');return;
 }
 const own=section==='ownership';el('p',own?'New virtual ownership is limited to verified empty, unassigned, explicitly available spaces. An index record is not an ownership offer. No claims or payments are enabled.':'Search the existing commercial-property index. Real buildings, virtual occupancy, and property availability are separate.');
 link('Open full property catalog and 3D viewer','../catalog.html');link('Explore building layer','../buildings.html');
 const query=el('input','');query.placeholder='City, name, address';query.setAttribute('aria-label','Property search');
 const country=el('select','');country.setAttribute('aria-label','Country');country.add(new Option('All countries','all'));const results=el('div','');
 fetch(new URL('../space/data/catalog.json',import.meta.url)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
 if(data.schemaVersion!==1||!Array.isArray(data.properties))throw Error();
 for(const code of [...new Set(data.properties.map(p=>p.address.countryCode))].sort())country.add(new Option(countryNames[code]||code,code));
 const render=()=>{results.replaceChildren();const found=searchProperties(data.properties,{q:query.value,country:country.value,businesses:data.businessProfiles||[]}).filter(p=>!own||ownershipCandidate(p));el('p',found.length+' matching records'+(found.length>20?' · first 20 shown':''),results);
 for(const p of found.slice(0,20)){const c=el('article','',results);el('strong',p.name,c);el('p',[p.address.line1,p.address.city,p.address.region].filter(Boolean).join(', '),c);el('p','Physical: '+p.physical.status+' · Virtual: '+p.virtual.status,c);const u=new URL('../catalog.html',import.meta.url);u.searchParams.set('property',p.id);link('Inspect property',u.href,c);}
 if(!found.length)el('p',own?'No eligible ownership candidates in this index. You may still create a separate virtual design.':'No matching records.',results);};query.oninput=country.onchange=render;render();
 }).catch(()=>el('p','Property index unavailable. Try the existing catalog.',results));
}
