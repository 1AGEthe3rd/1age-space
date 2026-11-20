export const categoryNames={commercial:'Commercial',art:'Art space',live_work:'Live/work'};
export const countryNames={US:'United States',GB:'United Kingdom'};
export function normalize(value){return String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export function isAvailable(p,now=new Date()){const x=p.physical;return x.status==='available'&&!!x.listingId&&x.sourceIds.length>0&&!!x.verifiedAt&&!!x.expiresAt&&new Date(x.verifiedAt)<=now&&new Date(x.expiresAt)>now;}
export function searchProperties(properties,{q='',category='all',country='all',city='all',availability='all',savedOnly=false,saved=[]}={}){
 const words=normalize(q).split(' ').filter(Boolean),savedSet=new Set(saved);
 return properties.filter(p=>{
  const hay=normalize([p.name,p.id,p.address.line1,p.address.city,p.address.region,countryNames[p.address.countryCode],p.description,...p.categories.map(c=>categoryNames[c]),p.id.includes('5601')?'NorthLeftChef':''].join(' '));
  return words.every(w=>hay.includes(w))&&(category==='all'||p.categories.includes(category))&&(country==='all'||p.address.countryCode===country)&&(city==='all'||p.address.city===city)&&(!savedOnly||savedSet.has(p.id))&&(availability==='all'||(availability==='physical'&&isAvailable(p))||(availability==='virtual'&&p.virtual.status==='demo'));
 });
}
export function safeExternal(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
