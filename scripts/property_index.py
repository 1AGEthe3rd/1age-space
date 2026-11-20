#!/usr/bin/env python3
"""Validate the shared public catalog; build/query an isolated SQLite FTS index."""
import argparse, datetime as dt, json, re, sqlite3
from pathlib import Path
COLLECTIONS=('properties','sources','buildings','units','ownerClaims','physicalListings','virtualSpaces','virtualOccupancies','leaseApplications','creatorAssets','workRequests','businessProfiles')
class CatalogError(ValueError):pass
def require(ok,message):
 if not ok:raise CatalogError(message)
def date(value):
 try:return dt.date.fromisoformat(value)
 except (ValueError,TypeError):raise CatalogError('Invalid ISO date')
def validate(data,today=None):
 today=today or dt.date.today();require(data.get('schemaVersion')==1,'Unsupported schema version')
 require(data.get('coverage',{}).get('complete') is False,'Starter catalog must not claim complete coverage')
 groups={}
 for name in COLLECTIONS:
  rows=data.get(name);require(isinstance(rows,list),f'Missing collection: {name}');ids=set()
  for row in rows:
   require(isinstance(row,dict),'Records must be objects');key=row.get('id','');require(isinstance(key,str) and re.fullmatch(r'[a-z0-9][a-z0-9-]{2,100}',key),f'Invalid ID: {key}');require(key not in ids,f'Duplicate {name} ID: {key}');ids.add(key)
  groups[name]=ids
 sources={s['id']:s for s in data['sources']};listings={x['id']:x for x in data['physicalListings']}
 def refs(values,group):require(isinstance(values,list) and all(x in groups[group] for x in values),f'Broken {group} reference')
 for s in sources.values():
  require(bool(s.get('rights')) and bool(s.get('scope')),'Source needs rights/scope');require(date(s.get('checkedAt'))<=today,'Source checked in future')
  require(s.get('url') is None or (isinstance(s['url'],str) and s['url'].startswith('https://')),'Source URL must be HTTPS or null')
 for p in data['properties']:
  require(isinstance(p.get('name'),str) and bool(p['name'].strip()),'Property name required');a=p.get('address',{})
  require(all(isinstance(a.get(k),str) and a[k].strip() for k in ['line1','city','region','countryCode']),'Structured address required');require(re.fullmatch('[A-Z]{2}',a['countryCode']) is not None,'ISO country code required')
  require(bool(p.get('categories')) and set(p['categories'])<={'commercial','art','live_work'},'Unknown category')
  v=p.get('verification',{});require(v.get('status') in ['source_checked','research_candidate'],'Invalid verification');refs(v.get('sourceIds'),'sources');require(bool(v['sourceIds']),'Evidence required');require(date(v.get('checkedAt'))<=today,'Verification in future');require(date(p.get('updatedAt'))<=today,'Update in future')
  if v['status']=='source_checked':require(all(sources[k]['kind']!='founder_report' for k in v['sourceIds']),'Founder report alone is not source checked')
  field_sources=v.get('fieldSources',{})
  require(isinstance(field_sources,dict),'fieldSources must be an object')
  for field,source_ids in field_sources.items():
   refs(source_ids,'sources');require(bool(source_ids) and all(x in v['sourceIds'] for x in source_ids),'Field evidence must be included in verification sources')
   require(all(field in sources[x]['scope'] for x in source_ids),f'Source does not support field: {field}')
  notice=p.get('operatingNotice')
  if notice is not None:
   require(isinstance(notice,dict) and bool(notice.get('text')),'Operating notice text required');refs(notice.get('sourceIds'),'sources');require(bool(notice['sourceIds']) and date(notice.get('checkedAt'))<=today,'Operating notice evidence/date required')
  coords=p.get('coordinates')
  if coords is not None:
   require(isinstance(coords,dict) and type(coords.get('latitude')) in (int,float) and type(coords.get('longitude')) in (int,float) and -90<=coords['latitude']<=90 and -180<=coords['longitude']<=180,'Coordinates out of range');refs(coords.get('sourceIds'),'sources');require(bool(coords['sourceIds']),'Coordinate source required')
  physical=p.get('physical',{});require(physical.get('status') in ['unknown','occupied','unavailable','available'],'Invalid physical status');refs(physical.get('sourceIds'),'sources')
  if physical['status']=='available':
   require(physical.get('listingId') in listings,'Available property needs a listing');require(bool(physical['sourceIds']),'Availability evidence required');require(date(physical.get('verifiedAt'))<=today<date(physical.get('expiresAt')),'Availability evidence stale/future');require(listings[physical['listingId']].get('propertyId')==p['id'],'Listing points to another property');require(listings[physical['listingId']].get('authorized') is True,'Listing must be authorized')
  require(p.get('virtual',{}).get('status') in ['not_offered','demo','authorized'],'Invalid virtual status');refs(p['virtual'].get('spaceIds'),'virtualSpaces');refs(p.get('buildingIds'),'buildings');refs(p.get('businessIds'),'businessProfiles')
  require(p.get('worldDestination') is None or isinstance(p['worldDestination'],dict),'World destination must be explicit or null')
 for name,field,target in [('virtualSpaces','propertyId','properties'),('buildings','propertyId','properties'),('units','buildingId','buildings'),('ownerClaims','propertyId','properties'),('physicalListings','propertyId','properties'),('virtualOccupancies','virtualSpaceId','virtualSpaces'),('leaseApplications','propertyId','properties'),('workRequests','propertyId','properties')]:
  for row in data[name]:require(row.get(field) is None or row.get(field) in groups[target],f'Broken {name}.{field}')
 for p in data['properties']:
  for sid in p['virtual']['spaceIds']:
   space=next(x for x in data['virtualSpaces'] if x['id']==sid);require(space.get('propertyId')==p['id'],'Space/property relationship mismatch')
 return data
def build(data,path):
 validate(data);path=Path(path);require(not path.exists(),'Refusing to overwrite an existing index; build a new snapshot')
 path.parent.mkdir(parents=True,exist_ok=True)
 with sqlite3.connect(path) as db:
  db.execute('CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)')
  db.execute('INSERT INTO metadata VALUES (?,?)',('catalog',json.dumps(data,ensure_ascii=False)))
  db.execute('CREATE TABLE sources(id TEXT PRIMARY KEY,record TEXT NOT NULL)')
  db.executemany('INSERT INTO sources VALUES (?,?)',[(s['id'],json.dumps(s,ensure_ascii=False)) for s in data['sources']])
  db.execute('CREATE TABLE properties(id TEXT PRIMARY KEY,name TEXT,country TEXT,city TEXT,categories TEXT,record TEXT)')
  db.execute("CREATE VIRTUAL TABLE search USING fts5(id UNINDEXED,content,tokenize='unicode61 remove_diacritics 2')")
  for p in data['properties']:
   db.execute('INSERT INTO properties VALUES (?,?,?,?,?,?)',(p['id'],p['name'],p['address']['countryCode'],p['address']['city'],json.dumps(p['categories']),json.dumps(p,ensure_ascii=False)))
   text=' '.join([p['name'],p['id'],*filter(None,p['address'].values()),p['description'],*p['categories']]);db.execute('INSERT INTO search VALUES (?,?)',(p['id'],text))
 return path
def query(path,text='',country=None,category=None,limit=20,offset=0,city=None):
 require(type(limit) is int and 1<=limit<=100 and type(offset) is int and offset>=0,'Invalid pagination')
 tokens=re.findall(r'[^\W_]+',text,flags=re.UNICODE);args=[];where=[]
 if tokens:where.append('p.id IN (SELECT id FROM search WHERE search MATCH ?)');args.append(' AND '.join('"'+t+'"*' for t in tokens))
 if country:where.append('p.country=?');args.append(country)
 if city:where.append('p.city=?');args.append(city)
 if category:where.append('EXISTS (SELECT 1 FROM json_each(p.categories) WHERE value=?)');args.append(category)
 clause=' WHERE '+' AND '.join(where) if where else ''
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True) as db:
  total=db.execute('SELECT count(*) FROM properties p'+clause,args).fetchone()[0]
  rows=db.execute('SELECT p.record FROM properties p'+clause+' ORDER BY p.name,p.id LIMIT ? OFFSET ?',[*args,limit,offset]).fetchall()
 return dict(total=total,limit=limit,offset=offset,properties=[json.loads(x[0]) for x in rows])
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--input',default='space/data/catalog.json');parser.add_argument('--build-db');parser.add_argument('--query-db');parser.add_argument('--query',default='');parser.add_argument('--country');parser.add_argument('--category');parser.add_argument('--limit',type=int,default=20);parser.add_argument('--offset',type=int,default=0);a=parser.parse_args()
 try:
  if a.query_db:print(json.dumps(query(a.query_db,a.query,a.country,a.category,a.limit,a.offset),indent=2,ensure_ascii=False))
  else:
   data=validate(json.loads(Path(a.input).read_text()));print('Validated',len(data['properties']),'properties')
   if a.build_db:print('Built',build(data,a.build_db))
 except (CatalogError,OSError,json.JSONDecodeError) as e:parser.exit(1,str(e)+'\n')
