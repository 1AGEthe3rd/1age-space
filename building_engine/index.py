import contextlib,hashlib,json,math,sqlite3,time
from pathlib import Path

class ClosingConnection(sqlite3.Connection):
 def __exit__(self,*args):
  try:return super().__exit__(*args)
  finally:self.close()

def connect(path):
 c=sqlite3.connect(path,timeout=30,factory=ClosingConnection);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c

def initialize(path):
 Path(path).parent.mkdir(parents=True,exist_ok=True)
 with connect(path) as c:
  application=c.execute('PRAGMA application_id').fetchone()[0];tables={r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
  if application not in (0,0x31414745) or c.execute('PRAGMA user_version').fetchone()[0]>1:raise ValueError('Unrecognized or newer database; refusing to modify it')
  if application==0 and tables and not {'jobs','buildings','spatial','observations'}<=tables:raise ValueError('This is not a building-engine database; refusing to modify it')
  c.executescript('''PRAGMA journal_mode=WAL;
   PRAGMA application_id=826361669;
   PRAGMA user_version=1;
   CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,record TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS jobs(id INTEGER PRIMARY KEY,source_id TEXT NOT NULL REFERENCES sources(id),fingerprint TEXT NOT NULL,checkpoint INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending',added INTEGER NOT NULL DEFAULT 0,duplicates INTEGER NOT NULL DEFAULT 0,rejected INTEGER NOT NULL DEFAULT 0,started INTEGER NOT NULL,updated INTEGER NOT NULL,error TEXT,UNIQUE(source_id,fingerprint));
   CREATE TABLE IF NOT EXISTS buildings(pk INTEGER PRIMARY KEY,hash BLOB UNIQUE NOT NULL,geometry TEXT NOT NULL,minlon REAL NOT NULL,maxlon REAL NOT NULL,minlat REAL NOT NULL,maxlat REAL NOT NULL,country TEXT NOT NULL,region TEXT NOT NULL,address TEXT,name TEXT,classification TEXT NOT NULL DEFAULT 'unknown',first_seen INTEGER NOT NULL);
   CREATE INDEX IF NOT EXISTS buildings_region ON buildings(country,region);
   CREATE INDEX IF NOT EXISTS buildings_region_name ON buildings(region,pk);
   CREATE VIRTUAL TABLE IF NOT EXISTS spatial USING rtree(pk,minlon,maxlon,minlat,maxlat);
   CREATE TABLE IF NOT EXISTS observations(job_id INTEGER NOT NULL REFERENCES jobs(id),ordinal INTEGER NOT NULL,building_pk INTEGER NOT NULL REFERENCES buildings(pk),capture_range TEXT,PRIMARY KEY(job_id,ordinal));
   CREATE TABLE IF NOT EXISTS rejected(job_id INTEGER NOT NULL REFERENCES jobs(id),ordinal INTEGER NOT NULL,reason TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(job_id,ordinal));
   CREATE TABLE IF NOT EXISTS possible_duplicates(a INTEGER,b INTEGER,reason TEXT,PRIMARY KEY(a,b));
   CREATE TABLE IF NOT EXISTS links(building_pk INTEGER REFERENCES buildings(pk),target_kind TEXT,target_id TEXT,evidence TEXT,PRIMARY KEY(building_pk,target_kind,target_id));
  ''')

def normalize_geometry(geometry):
 if not isinstance(geometry,dict) or geometry.get('type') not in ('Polygon','MultiPolygon'):raise ValueError('Expected polygon geometry')
 polygons=geometry.get('coordinates')
 if geometry['type']=='Polygon':polygons=[polygons]
 if not isinstance(polygons,list) or not polygons:raise ValueError('Missing polygon coordinates')
 normalized=[];all_points=[]
 for polygon in polygons:
  if not isinstance(polygon,list) or not polygon:raise ValueError('Missing polygon rings')
  rings=[]
  for ring in polygon:
   if not isinstance(ring,list) or not 4<=len(ring)<=100000:raise ValueError('Invalid ring size')
   points=[]
   for p in ring:
    if not isinstance(p,list) or len(p)<2 or any(type(v) not in (int,float) or not math.isfinite(v) for v in p[:2]):raise ValueError('Invalid coordinate')
    x,y=map(float,p[:2])
    if not -180<=x<=180 or not -90<=y<=90:raise ValueError('Coordinate out of range')
    point=(x,y)
    if not points or point!=points[-1]:points.append(point)
   if points[0]!=points[-1]:raise ValueError('Unclosed polygon ring')
   points.pop()
   if len(set(points))<3:raise ValueError('Degenerate polygon ring')
   x0,y0=points[0]
   area=math.fsum((p[0]-x0)*(q[1]-y0)-(q[0]-x0)*(p[1]-y0) for p,q in zip(points,points[1:]+points[:1]))
   if area==0:raise ValueError('Zero-area polygon ring')
   # Canonical start and direction make byte-identical footprints deduplicate
   # despite rotated vertices or reversed winding. No rounding or invented point.
   smallest=min(points);variants=[]
   for seq in (points,list(reversed(points))):
    for i,p in enumerate(seq):
     if p==smallest:variants.append(seq[i:]+seq[:i])
   canonical=min(variants);canonical.append(canonical[0]);rings.append(canonical);all_points.extend(points)
  normalized.append([rings[0]]+sorted(rings[1:]))
 normalized.sort();result={'type':'MultiPolygon','coordinates':normalized}
 text=json.dumps(result,separators=(',',':'),allow_nan=False);digest=hashlib.sha256(text.encode()).digest()
 xs=[p[0] for p in all_points];ys=[p[1] for p in all_points]
 return digest,text,(min(xs),max(xs),min(ys),max(ys))

def valid_bbox(value):
 if len(value)!=4 or any(not math.isfinite(x) for x in value):raise ValueError('Invalid bounding box')
 w,s,e,n=value
 if not(-180<=w<e<=180 and -90<=s<n<=90):raise ValueError('Invalid bounding box')
 return w,s,e,n

def search(path,*,bbox=None,region=None,building_id=None,limit=100,offset=0,after=None):
 if type(limit)is not int or not 1<=limit<=500 or type(offset)is not int or not 0<=offset<=100000:raise ValueError('Invalid pagination')
 if after is not None and (type(after)is not int or after<0 or offset):raise ValueError('Invalid keyset cursor')
 where=[];args=[];from_sql=' FROM buildings b'
 if bbox is not None:
  w,s,e,n=valid_bbox(bbox);from_sql=' FROM spatial s CROSS JOIN buildings b ON b.pk=s.pk';where+=['s.minlon<=? AND s.maxlon>=? AND s.minlat<=? AND s.maxlat>=?'];args += [e,w,n,s]
 if region:where+=['b.region=?'];args.append(region)
 if building_id:
  if len(building_id)!=64:raise ValueError('Invalid building ID')
  try:digest=bytes.fromhex(building_id)
  except ValueError:raise ValueError('Invalid building ID')
  where+=['b.hash=?'];args.append(digest)
 clause=' WHERE '+' AND '.join(where) if where else ''
 # Read-only connections keep the discovery service separate from import writes.
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row;c.execute('BEGIN')
  total=c.execute('SELECT COUNT(*)'+from_sql+clause,args).fetchone()[0]
  page_clause=clause+(' AND ' if clause else ' WHERE ')+'b.pk>?' if after is not None else clause
  page_args=args+[after] if after is not None else args
  rows=c.execute('SELECT b.*'+from_sql+page_clause+' ORDER BY b.pk LIMIT ? OFFSET ?',page_args+[limit,offset]).fetchall()
 features=[]
 for row in rows:
  features.append({'type':'Feature','id':row['hash'].hex(),'geometry':json.loads(row['geometry']),'properties':{'country':row['country'],'sourceRegion':row['region'],'address':row['address'],'name':row['name'],'classification':row['classification'],'occupancy':'unknown','availability':'unknown','representation':'source footprint with illustrative height; not surveyed or verified current'}})
 return {'type':'FeatureCollection','features':features,'total':total,'limit':limit,'offset':offset,'nextOffset':offset+limit if after is None and offset+limit<total else None,'nextCursor':rows[-1]['pk'] if len(rows)==limit else None,'completeCoverage':False}

def metrics(path):
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row;c.execute('BEGIN')
  total=c.execute('SELECT COUNT(*) FROM buildings').fetchone()[0]
  regions=[dict(r) for r in c.execute('SELECT country,region,COUNT(*) buildings FROM buildings GROUP BY country,region')]
  countries=[dict(r) for r in c.execute('SELECT country,COUNT(*) buildings FROM buildings GROUP BY country')]
  jobs=[dict(r) for r in c.execute('SELECT * FROM jobs ORDER BY id')]
  sources=[json.loads(r[0]) for r in c.execute('SELECT record FROM sources ORDER BY id')]
  addressed=c.execute('SELECT COUNT(*) FROM buildings WHERE address IS NOT NULL').fetchone()[0]
 return {'asOf':int(time.time()),'kind':'building-footprint-index','uniqueFootprints':total,'regions':regions,'countries':countries,'jobs':jobs,'sources':sources,'sourceProvidedAddresses':addressed,'independentlyVerifiedAddresses':0,'commercialUseKnown':0,'creativeUseKnown':0,'verifiedAvailableListings':0,'footprintsEligibleFor3D':total,'duplicatesPrevented':sum(j['duplicates'] for j in jobs),'rejectedRecords':sum(j['rejected'] for j in jobs),'latestImportAdded':jobs[-1]['added'] if jobs else 0,'failedJobs':sum(j['status']=='failed' for j in jobs),'unassignedCityRecords':total,'completeGlobalCoverage':False,'notes':'Computer-generated footprint records, not independently surveyed buildings. City/county assignments, ownership, occupancy and property use are unknown unless separately evidenced.'}
