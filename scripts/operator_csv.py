#!/usr/bin/env python3
"""Convert reviewed operator metadata into a staged catalog batch. Never imports offers."""
import argparse,csv,datetime as dt,json
from pathlib import Path
from urllib.parse import urlsplit
from property_index import require,CatalogError,SPACE_USES
COLUMNS={'id','name','line1','city','region','country','postal','space_uses','source_id','source_url','source_title','checked_at','rights_note'}
def convert(rows,batch_id):
 sources={};properties=[]
 for row in rows:
  require(set(row)==COLUMNS,'CSV columns must match the reviewed metadata template')
  require(all(isinstance(v,str) for v in row.values()),'Malformed CSV row')
  require(all(row[k].strip() for k in COLUMNS-{'postal'}),'Required metadata is blank')
  url=urlsplit(row['source_url']);require(url.scheme=='https' and bool(url.hostname) and not url.username and not url.password,'Source must be HTTPS without credentials')
  try:checked=dt.date.fromisoformat(row['checked_at'])
  except ValueError:raise CatalogError('Invalid evidence date')
  require(checked<=dt.date.today(),'Evidence date is in the future')
  uses=row['space_uses'].split(';');require(set(uses)<=SPACE_USES,'Unknown commercial space use')
  sid=row['source_id'];s=dict(id=sid,title=row['source_title'],url=row['source_url'],kind='operator',checkedAt=row['checked_at'],publishedAt=None,scope=['name','address','categories','spaceUses'],rights=row['rights_note'])
  require(sid not in sources or sources[sid]==s,'Source ID conflict within feed');sources[sid]=s
  properties.append(dict(id=row['id'],name=row['name'],address=dict(line1=row['line1'],city=row['city'],region=row['region'],countryCode=row['country'],postalCode=row['postal'] or None),coordinates=None,categories=['commercial'],spaceUses=uses,district=None,description='Commercial workspace identified in operator-published material. Unit availability, pricing and permitted activities require separate confirmation.',verification=dict(status='source_checked',sourceIds=[sid],checkedAt=row['checked_at'],fields=['name','address','categories','spaceUses'],fieldSources={field:[sid] for field in ['name','address','categories','spaceUses']}),physical=dict(status='unknown',listingId=None,sourceIds=[],verifiedAt=None,expiresAt=None),virtual=dict(status='not_offered',spaceIds=[]),buildingIds=[],businessIds=[],worldDestination=None,updatedAt=row['checked_at']))
 require(bool(properties),'CSV has no records');return dict(batchId=batch_id,checkedAt=max(p['updatedAt'] for p in properties),intakeMode='reviewed_metadata_csv',sources=list(sources.values()),properties=properties)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--csv',required=True);p.add_argument('--out',required=True);p.add_argument('--batch-id',required=True);a=p.parse_args()
 try:
  with Path(a.csv).open(newline='') as f:batch=convert(list(csv.DictReader(f)),a.batch_id)
  with Path(a.out).open('x') as f:json.dump(batch,f,indent=2,ensure_ascii=False);f.write('\n')
  print('Staged',len(batch['properties']),'records; validate/merge before importing')
 except (OSError,ValueError,KeyError,TypeError) as e:p.exit(1,str(e)+'\n')
