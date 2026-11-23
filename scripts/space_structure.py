"""Building/unit/listing contract prototype. No authorization, booking, or payment service."""
import datetime as dt,re
from catalog_batch import address_key
from property_index import CatalogError,require

DURATIONS={'hour','day','week','month','long_term'}
DISCIPLINES={'visual_art','photography','film','music','fashion','design','fabrication','performance','mixed'}
STATUSES={'unknown','occupied','available','temporarily_available','off_market','expired'}

def date(value):
 try:return dt.date.fromisoformat(value)
 except (TypeError,ValueError):raise CatalogError('Invalid structure evidence date')

def validate_structure(data):
 """Validate explicit records only; never manufacture buildings from place addresses."""
 def collection(name):
  rows=data.get(name);require(isinstance(rows,list),'Missing structure collection: '+name);result={}
  for row in rows:
   require(isinstance(row,dict) and isinstance(row.get('id'),str) and row['id'] not in result,'Missing or duplicate structure ID')
   result[row['id']]=row
  return result
 def choices(value,allowed):
  return isinstance(value,list) and all(isinstance(x,str) and x in allowed for x in value)
 buildings=collection('buildings');units=collection('units');sources=collection('sources');listings=collection('physicalListings')
 def evidence(row):
  ids=row.get('sourceIds');require(isinstance(ids,list) and bool(ids) and all(s in sources for s in ids),'Structure record needs known source evidence')
 seen=set()
 for building in buildings.values():
  a=building.get('address',{});require(all(isinstance(a.get(k),str) and a[k].strip() for k in ['countryCode','region','city','line1']),'Building needs an explicit primary address')
  key=address_key({'address':a});require(key not in seen,'Duplicate permanent building address');seen.add(key);evidence(building)
 for unit in units.values():
  require(unit.get('buildingId') in buildings,'Unit needs its parent building')
  require(isinstance(unit.get('name'),str) and bool(unit['name'].strip()),'Unit needs a name')
  require(choices(unit.get('disciplines',[]),DISCIPLINES),'Unknown creative discipline')
  require(choices(unit.get('rentalDurations',[]),DURATIONS),'Unknown rental duration')
  require(unit.get('availability','unknown') in STATUSES,'Invalid unit availability')
  evidence(unit)
 for listing in listings.values():
  require(listing.get('buildingId') in buildings,'Listing needs a building')
  uid=listing.get('unitId');require(uid is None or uid in units and units[uid]['buildingId']==listing['buildingId'],'Listing/unit building mismatch')
  require(listing.get('kind') in {'rental','sale','booking'},'Invalid listing kind')
  require(listing.get('status') in STATUSES,'Invalid listing status')
  require(choices(listing.get('durations',[]),DURATIONS),'Unknown listing duration');evidence(listing)
  rate=listing.get('rate')
  if rate is not None:
   require(isinstance(rate,dict) and type(rate.get('amountMinor')) is int and rate['amountMinor']>=0,'Rate requires integer minor units')
   require(bool(re.fullmatch('[A-Z]{3}',rate.get('currency',''))) and rate.get('per') in DURATIONS,'Rate needs currency and billing period')
  if listing['status'] in {'available','temporarily_available'}:
   require(listing.get('authorized') is True,'Availability requires listing authorization')
   require(date(listing.get('verifiedAt'))<date(listing.get('expiresAt')),'Listing evidence must expire after verification')
   require(all('availability' in sources[s]['scope'] for s in listing['sourceIds']),'Name/address evidence cannot verify availability')
 return data

def eligible_listings(data,*,duration=None,discipline=None,now=None):
 """Return currently evidenced listing records, not a promise a room can be booked."""
 validate_structure(data);now=now or dt.date.today()
 require(duration is None or duration in DURATIONS,'Unknown duration filter');require(discipline is None or discipline in DISCIPLINES,'Unknown discipline filter')
 units={x['id']:x for x in data['units']};result=[]
 for listing in data['physicalListings']:
  if listing['status'] not in {'available','temporarily_available'}:continue
  if not date(listing['verifiedAt'])<=now<date(listing['expiresAt']):continue
  if duration and duration not in listing.get('durations',[]):continue
  unit=units.get(listing.get('unitId'))
  if discipline and (not unit or discipline not in unit.get('disciplines',[])):continue
  result.append(listing)
 return result

def claim_scope_matches(claim,*,building_id,unit_id=None):
 """Scope check only. Caller must separately authenticate/verify the claimant.

 A matching scope does NOT establish ownership or grant access by itself.
 """
 if claim.get('scope')=='building':return claim.get('buildingId')==building_id
 return claim.get('scope')=='unit' and unit_id is not None and claim.get('buildingId')==building_id and claim.get('unitId')==unit_id
