#!/usr/bin/env python3
"""Offline, source-attributed municipal intake. Does not infer vacancy or ownership."""
import hashlib,json,math,re
from pathlib import Path
from catalog_batch import address_key,merge,quality

CHECKED='2026-11-21'
VAN_URL='https://opendata.vancouver.ca/explore/dataset/cultural-spaces/'
NYC_URL='https://data.cityofnewyork.us/City-Government/Facilities-Database/ji82-xba5'

def point(latitude,longitude):
 try:
  lat,lon=float(latitude),float(longitude)
  return (lat,lon) if math.isfinite(lat) and math.isfinite(lon) and -90<=lat<=90 and -180<=lon<=180 else None
 except (ValueError,TypeError):return None

def convert(vancouver,nyc):
 year=max(int(row['year']) for row in vancouver)
 accepted={'Museum/Gallery','Studio/Rehearsal','Theatre/Performance','Cafe/Restaurant/Bar'}
 candidates=[];skipped=[]
 for row in vancouver:
  if int(row['year'])!=year or row['type'] not in accepted:continue
  address=row.get('address') or '';parts=address.split(', Vancouver, BC')
  if len(parts)!=2 or not parts[0].strip() or not row.get('cultural_space_name'):
   skipped.append({'source':'vancouver','reason':'missing structured address/name','address':address});continue
  geo=row.get('geo_point_2d') or {}
  candidates.append(dict(name=row['cultural_space_name'],line1=parts[0].strip(),postal=parts[1].strip(' ,') or None,city='Vancouver',region='British Columbia',country='CA',district=row.get('local_area'),point=point(geo.get('lat'),geo.get('lon')),source='src-vancouver-cultural-open-data',snapshot=str(year),record={'name':row['cultural_space_name'],'year':row['year'],'type':row['type']}))
 for row in nyc:
  if row.get('facsubgrp')!='MUSEUMS':continue
  address=(row.get('address') or '').strip()
  # Dataset can contain administrative addresses. Record the limitation rather
  # than treating them as independently inspected museum buildings.
  if not re.match(r'^\d',address) or not row.get('facname') or not row.get('uid'):
   skipped.append({'source':'nyc','reason':'missing numbered address/name/stable source ID','uid':row.get('uid')});continue
  candidates.append(dict(name=row['facname'],line1=address,postal=row.get('zipcode'),city='New York City',region='New York',country='US',district=row.get('boro'),point=point(row.get('latitude'),row.get('longitude')),source='src-nyc-facilities-26v1',snapshot='26v1',record={'uid':row['uid'],'name':row['facname'],'source':row.get('datasource'),'borough':row.get('boro')}))
 groups={}
 for item in candidates:
  key=address_key({'address':dict(countryCode=item['country'],region=item['region'],city=item['city'],line1=item['line1'])})
  groups.setdefault(key,[]).append(item)
 sources=[dict(id='src-vancouver-cultural-open-data',title=f'City of Vancouver Cultural Spaces — {year} snapshot',url=VAN_URL,kind='municipal_open_data',checkedAt=CHECKED,publishedAt=None,scope=['name','address','categories','coordinates'],rights='Contains information licensed under the Open Government Licence – Vancouver. https://opendata.vancouver.ca/pages/licence/ Modified: latest-year cultural-space records filtered and grouped by normalized address. No endorsement.',snapshotYear=year,licenseUrl='https://opendata.vancouver.ca/pages/licence/'),dict(id='src-nyc-facilities-26v1',title='NYC Department of City Planning Facilities Database — 26v1 museum records',url=NYC_URL,kind='municipal_open_data',checkedAt=CHECKED,publishedAt=None,scope=['name','address','categories','coordinates'],rights='City of New York / NYC Department of City Planning, Facilities Database 26v1. Museum subset modified by filtering and grouping addresses. No City endorsement; source may contain administrative rather than facility-site addresses. https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje',termsUrl='https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje')]
 properties=[]
 for key,items in sorted(groups.items()):
  first=items[0];sid=first['source'];names=sorted(set(x['name'] for x in items));pid='place-'+first['country'].lower()+'-municipal-'+hashlib.sha256('|'.join(key).encode()).hexdigest()[:18]
  points={x['point'] for x in items if x['point'] is not None};coords=None
  if len(points)==1:
   lat,lon=next(iter(points));coords=dict(latitude=lat,longitude=lon,sourceIds=[sid],accuracy='Source-provided point; not independently surveyed')
  description=(f'Cultural-space location in the City of Vancouver {year} inventory. Historical source snapshot; current operation and rental availability have not been verified.' if first['country']=='CA' else 'Museum address in NYC Planning Facilities Database 26v1. The source can contain administrative addresses; the actual visitor site and current operation require separate confirmation.')
  properties.append(dict(id=pid,name=' / '.join(names[:3])+(' / additional indexed spaces' if len(names)>3 else ''),address=dict(line1=first['line1'],city=first['city'],region=first['region'],countryCode=first['country'],postalCode=first['postal']),coordinates=coords,categories=['art'],district=first['district'],description=description,verification=dict(status='source_checked',sourceIds=[sid],checkedAt=CHECKED,fields=['name','address','categories'],fieldSources={k:[sid] for k in ['name','address','categories']}),physical=dict(status='unknown',listingId=None,sourceIds=[],verifiedAt=None,expiresAt=None),virtual=dict(status='not_offered',spaceIds=[]),buildingIds=[],businessIds=[],worldDestination=None,updatedAt=CHECKED,sourceSnapshot=first['snapshot'],sourceRecords=[x['record'] for x in items],operatingNotice=dict(text=description,sourceIds=[sid],checkedAt=CHECKED)))
 return dict(batchId='north-america-municipal-20261121',checkedAt=CHECKED,sources=sources,properties=properties),dict(vancouverLatestYear=year,inputRows=len(vancouver)+len(nyc),eligibleSourceRecords=len(candidates),groupedLocations=len(properties),skipped=skipped)

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',required=True);args=parser.parse_args()
 root=Path(__file__).resolve().parents[1];intake=root/'space/data/intake'
 batch,report=convert(json.loads((intake/'vancouver-cultural-records.json').read_text()),json.loads((intake/'nyc-museums-records.json').read_text()))
 original=json.loads((root/'space/data/catalog.json').read_text());existing={address_key(p) for p in original['properties']}
 duplicates=[p for p in batch['properties'] if address_key(p) in existing];batch['properties']=[p for p in batch['properties'] if address_key(p) not in existing]
 result,merged=merge(original,batch);report.update(merged);report['existingAddressMatchesSkipped']=[p['id'] for p in duplicates];report['quality']=quality(result)
 out=Path(args.out)
 for target in (out,root/'space/data/batches/north-america-20261121.json',intake/'north-america-intake-report.json'):
  if target.exists():raise FileExistsError('Refusing to overwrite reviewed artifact: '+str(target))
 with out.open('x') as f:json.dump(result,f,ensure_ascii=False,indent=2);f.write('\n')
 (root/'space/data/batches/north-america-20261121.json').write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
 (intake/'north-america-intake-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,indent=2))
