#!/usr/bin/env python3
"""Reviewable append-only import. Existing records and IDs are never silently replaced."""
import argparse,copy,datetime as dt,json,unicodedata,re
from pathlib import Path
from property_index import validate,require,CatalogError

def address_key(p):
 def norm(v):
  value=unicodedata.normalize('NFKD',v).casefold();value=''.join(x for x in value if not unicodedata.combining(x));parts=re.findall(r'[^\W_]+',value)
  aliases={'street':'st','avenue':'ave','boulevard':'blvd','place':'pl','road':'rd','northwest':'nw','northeast':'ne','southeast':'se','southwest':'sw'}
  return ' '.join(aliases.get(x,x) for x in parts)
 a=p['address'];return tuple(norm(a[k]) for k in ('countryCode','region','city','line1'))
def merge(catalog,batch):
 validate(catalog);result=copy.deepcopy(catalog);source_map={s['id']:s for s in result['sources']};known={p['id']:p for p in result['properties']};addresses={address_key(p):p['id'] for p in result['properties']};new=[]
 for s in batch.get('sources',[]):
  if s['id'] in source_map:require(source_map[s['id']]==s,'Source ID conflict; review required')
  else:result['sources'].append(copy.deepcopy(s));source_map[s['id']]=s
 for p in batch.get('properties',[]):
  if p['id'] in known:
   require(known[p['id']]==p,'Existing property differs; append-only import cannot overwrite it');continue
  key=address_key(p);require(key not in addresses,f'Possible duplicate address of {addresses.get(key)}; review before assigning a second ID')
  new.append(p['id']);known[p['id']]=p;addresses[key]=p['id'];result['properties'].append(copy.deepcopy(p))
 result['updatedAt']=batch['checkedAt'];result['coverage']['notes']='Curated starter expansion; not a complete inventory of any city, country or the world.'
 validate(result);return result,dict(batchId=batch['batchId'],addedIds=new,added=len(new),total=len(result['properties']),worldConnectionsActivated=0)
def quality(data):
 validate(data);ps=data['properties'];countries={};cities=set();categories={}
 for p in ps:
  a=p['address'];countries[a['countryCode']]=countries.get(a['countryCode'],0)+1;cities.add((a['countryCode'],a['city']))
  for c in p['categories']:categories[c]=categories.get(c,0)+1
 return dict(properties=len(ps),countries=countries,cityCount=len(cities),categories=categories,sourceChecked=sum(p['verification']['status']=='source_checked' for p in ps),researchCandidates=sum(p['verification']['status']=='research_candidate' for p in ps),coordinateRecords=sum(p['coordinates'] is not None for p in ps),physicalListings=len(data['physicalListings']),physicalAvailable=sum(p['physical']['status']=='available' for p in ps),worldConnected=sum(p['worldDestination'] is not None for p in ps),sources=len(data['sources']),complete=False)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--catalog',default='space/data/catalog.json');parser.add_argument('--batch');parser.add_argument('--out');a=parser.parse_args()
 try:
  data=json.loads(Path(a.catalog).read_text())
  if a.batch:
   result,report=merge(data,json.loads(Path(a.batch).read_text()));require(a.out is not None,'Provide a new --out path for review');path=Path(a.out)
   with path.open('x') as f:json.dump(result,f,indent=2,ensure_ascii=False);f.write('\n')
   print(json.dumps(report,indent=2))
  else:print(json.dumps(quality(data),indent=2))
 except (CatalogError,OSError,ValueError,KeyError,TypeError) as e:parser.exit(1,str(e)+'\n')
