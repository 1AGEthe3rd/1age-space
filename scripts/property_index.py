#!/usr/bin/env python3
"""Validate the shared public catalog; build/query an isolated SQLite FTS index."""
import argparse, datetime as dt, json, re, sqlite3
from pathlib import Path
SPACE_USES={'office','retail','industrial','warehouse','restaurant','workshop','studio','coworking','mixed_use','live_work'}
COLLECTIONS=('properties','sources','buildings','units','ownerClaims','physicalListings','virtualSpaces','virtualOccupancies','leaseApplications','creatorAssets','workRequests','businessProfiles')
class CatalogError(ValueError):pass

PROTECTED_ZONES = {'dc-southeast','historic-anacostia','hq2','dc-federal-landmarks','oneage-treasury'}

def protected_property(record):
 address = record.get('address', {})
 line = re.sub(r'[^A-Z0-9]+', ' ', address.get('line1', '').upper()).strip()
 southeast = line.endswith((' SE', ' S E', ' SOUTHEAST'))
 district = address.get('region', '').lower()
 in_dc = district in {'dc', 'd.c.', 'district of columbia'}
 return (record.get('protection') or {}).get('zoneId') in PROTECTED_ZONES or (
  address.get('countryCode') == 'US' and in_dc and southeast
 )


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
  uses=p.get('spaceUses',[]);require(isinstance(uses,list) and set(uses)<=SPACE_USES,'Unknown commercial space use')
  v=p.get('verification',{});require(v.get('status') in ['source_checked','research_candidate'],'Invalid verification');refs(v.get('sourceIds'),'sources');require(bool(v['sourceIds']),'Evidence required');require(date(v.get('checkedAt'))<=today,'Verification in future');require(date(p.get('updatedAt'))<=today,'Update in future')
  if v['status']=='source_checked':require(all(sources[k]['kind']!='founder_report' for k in v['sourceIds']),'Founder report alone is not source checked')
  field_sources=v.get('fieldSources',{})
  require(isinstance(field_sources,dict),'fieldSources must be an object')
  for field,source_ids in field_sources.items():
   refs(source_ids,'sources');require(bool(source_ids) and all(x in v['sourceIds'] for x in source_ids),'Field evidence must be included in verification sources')
   require(all(field in sources[x]['scope'] for x in source_ids),f'Source does not support field: {field}')
  protection = p.get('protection')
  if protection is not None:
   require(isinstance(protection,dict) and protection.get('zoneId') in PROTECTED_ZONES,'Invalid protected zone')
   require(protection.get('publicExploration') is True and protection.get('claimEligible') is False,'Protected properties must allow public exploration and forbid owner claims')
  if protected_property(p):
   require(p.get('virtual', {}).get('status') == 'not_offered','Protected properties cannot offer independent virtual occupancy')
  destination = p.get('spaceDestination')
  if destination is not None:
   require(isinstance(destination,dict) and destination.get('path') == '/hq2/?destination='+p['id'],'Invalid HQ2 Space destination')
   for field in ('arrival','lookAt'):
    point=destination.get(field)
    require(isinstance(point,list) and len(point)==2 and all(type(x) in (int,float) and -10000<x<10000 for x in point),'Invalid HQ2 scene coordinates')
  if p.get('physical',{}).get('status')=='occupied':
   require(bool(p['physical'].get('sourceIds')) and date(p['physical'].get('verifiedAt'))<=today,'Occupancy evidence/date required')
  for kind,field in [('leasingNotice','text'),('vacancyEvidence','status')]:
   evidence=p.get(kind)
   if evidence is not None:
    require(isinstance(evidence,dict) and bool(evidence.get(field)),'Physical property notice requires evidence')
    refs(evidence.get('sourceIds'),'sources')
    require(bool(evidence['sourceIds']) and date(evidence.get('checkedAt'))<=today,'Physical property notice needs a source and a date')
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
 protected_ids={p['id'] for p in data['properties'] if protected_property(p)}
 for row in data['ownerClaims']:
  require(row.get('propertyId') not in protected_ids,'Protected property cannot receive an owner claim')
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
  names={row['id']:row.get('name','') for row in data['businessProfiles']}
  for p in data['properties']:
   db.execute('INSERT INTO properties VALUES (?,?,?,?,?,?)',(p['id'],p['name'],p['address']['countryCode'],p['address']['city'],json.dumps(p['categories']),json.dumps(p,ensure_ascii=False)))
   text=' '.join([p['name'],p['id'],*filter(None,p['address'].values()),p['description'],*p['categories'],*p.get('spaceUses',[]),*(names.get(key,'') for key in p['businessIds'])]);db.execute('INSERT INTO search VALUES (?,?)',(p['id'],text))
 return path
def query(path,text='',country=None,category=None,limit=20,offset=0,city=None,space_use=None):
 require(type(limit) is int and 1<=limit<=100 and type(offset) is int and offset>=0,'Invalid pagination')
 tokens=re.findall(r'[^\W_]+',text,flags=re.UNICODE);args=[];where=[]
 if tokens:where.append('p.id IN (SELECT id FROM search WHERE search MATCH ?)');args.append(' AND '.join('"'+t+'"*' for t in tokens))
 if country:where.append('p.country=?');args.append(country)
 if city:where.append('p.city=?');args.append(city)
 if space_use:where.append("EXISTS (SELECT 1 FROM json_each(json_extract(p.record,'$.spaceUses')) WHERE value=?)");args.append(space_use)
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
