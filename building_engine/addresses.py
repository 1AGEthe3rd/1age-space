"""Resumable address enrichment sidecar; leaves the footprint database unchanged."""
import argparse,json,math,re,sqlite3,time,urllib.parse,urllib.request,fcntl
from pathlib import Path
from .index import ClosingConnection
from .storage import ensure_space

FIELDS='OBJECTID,ADDRESS_ID,ADD_FULL,UNIT_VALUE,CITY,COUNTY,STATE_ABBR,ZIP_CODE'
def initialize(path):
 with sqlite3.connect(path) as c:
  app=c.execute('pragma application_id').fetchone()[0];tables={r[0] for r in c.execute("select name from sqlite_master where type='table'")}
  if app not in (0,0x31414741) or (app==0 and tables):raise ValueError('Refusing unrelated enrichment database')
  c.executescript('''PRAGMA journal_mode=WAL;PRAGMA application_id=826361665;
   CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,record TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS jobs(source TEXT PRIMARY KEY REFERENCES sources(id),cursor INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL,reported_total INTEGER,started INTEGER,updated INTEGER,error TEXT);
   CREATE TABLE IF NOT EXISTS addresses(pk INTEGER PRIMARY KEY,source TEXT NOT NULL REFERENCES sources(id),object_id INTEGER NOT NULL,source_id TEXT,address TEXT NOT NULL,unit TEXT,city TEXT,county TEXT,region TEXT,postal TEXT,lon REAL NOT NULL,lat REAL NOT NULL,building_id TEXT,match_status TEXT NOT NULL,retrieved INTEGER NOT NULL,UNIQUE(source,object_id));
   CREATE INDEX IF NOT EXISTS address_building ON addresses(building_id);
   CREATE INDEX IF NOT EXISTS address_city ON addresses(city);
   CREATE TABLE IF NOT EXISTS rejected(source TEXT,object_id INTEGER,reason TEXT,PRIMARY KEY(source,object_id));
   CREATE VIRTUAL TABLE IF NOT EXISTS address_fts USING fts5(address,city,unit,content='addresses',content_rowid='pk');
   CREATE TRIGGER IF NOT EXISTS address_insert AFTER INSERT ON addresses BEGIN INSERT INTO address_fts(rowid,address,city,unit) VALUES(new.pk,new.address,new.city,new.unit);END;
  ''')

def ring_contains(ring,x,y):
 inside=False
 for a,b in zip(ring,ring[1:]):
  ax,ay=a[:2];bx,by=b[:2]
  if min(ax,bx)<=x<=max(ax,bx) and min(ay,by)<=y<=max(ay,by) and abs((x-ax)*(by-ay)-(y-ay)*(bx-ax))<1e-14:return None
  if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
 return inside

def contains(geometry,x,y):
 polygons=geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
 for polygon in polygons:
  outer=ring_contains(polygon[0],x,y)
  if outer is None:return None
  if outer:
   for hole in polygon[1:]:
    value=ring_contains(hole,x,y)
    if value is None:return None
    if value:break
   else:return True
 return False

def match(c,x,y):
 rows=c.execute('SELECT b.hash,b.geometry FROM footprints.spatial s CROSS JOIN footprints.buildings b ON b.pk=s.pk WHERE s.minlon<=? AND s.maxlon>=? AND s.minlat<=? AND s.maxlat>=?',(x,x,y,y)).fetchall();found=[];boundary=False
 for digest,raw in rows:
  result=contains(json.loads(raw),x,y)
  if result is None:boundary=True
  elif result:found.append(digest.hex())
 if boundary or len(found)>1:return None,'ambiguous'
 return (found[0],'single-footprint-containment') if found else (None,'unmatched')

def store_page(c,source,features):
 cursor=0
 for feature in features:
  a=feature.get('attributes',{});oid=a.get('OBJECTID')
  if type(oid)is not int or oid<=cursor:raise ValueError('Invalid or unordered object IDs')
  cursor=oid
  if c.execute('SELECT 1 FROM addresses WHERE source=? AND object_id=?',(source,oid)).fetchone():continue
  g=feature.get('geometry') or {};x,y=g.get('x'),g.get('y');address=a.get('ADD_FULL')
  if any(type(v) not in (float,int) or not math.isfinite(v) for v in (x,y)) or not(-180<=x<=180 and -90<=y<=90) or not isinstance(address,str) or not address.strip():
   c.execute('INSERT OR IGNORE INTO rejected VALUES(?,?,?)',(source,oid,'Missing address or invalid WGS84 point'));continue
  bid,status=match(c,x,y)
  c.execute('INSERT INTO addresses(source,object_id,source_id,address,unit,city,county,region,postal,lon,lat,building_id,match_status,retrieved) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(source,oid,str(a.get('ADDRESS_ID','')),address.strip(),a.get('UNIT_VALUE'),a.get('CITY'),a.get('COUNTY'),a.get('STATE_ABBR'),a.get('ZIP_CODE'),x,y,bid,status,int(time.time())))
 return cursor

def fetch(source,params):
 allowed='https://www.portlandmaps.com/od/rest/services/COP_OpenData_Property/MapServer/47'
 if source.get('url')!=allowed or not source.get('permitted') or source.get('license')!='PDDL-1.0':raise ValueError('Unreviewed address source')
 url=source['url']+'/query?'+urllib.parse.urlencode(params|{'f':'json'})
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'1AGE-Space-Address-Indexer/001'}),timeout=40) as response:
  if not response.url.startswith(allowed+'/query?'):raise ValueError('Unexpected redirect')
  body=response.read(8*1024**2+1)
  if len(body)>8*1024**2:raise ValueError('Page too large')
  data=json.loads(body)
 if 'error' in data:raise ValueError('Address provider query failed')
 return data

def run(path,footprints,source,seconds=180):
 path=Path(path).resolve();path.parent.mkdir(parents=True,exist_ok=True)
 with path.with_suffix('.lock').open('a') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('Another address import is running')
  initialize(path);start=time.monotonic()
  with sqlite3.connect(path,uri=True,factory=ClosingConnection) as c:
   c.execute('PRAGMA foreign_keys=ON');c.execute('ATTACH DATABASE ? AS footprints',(Path(footprints).resolve().as_uri()+'?mode=ro',))
   c.execute('INSERT OR IGNORE INTO sources VALUES(?,?)',(source['id'],json.dumps(source)))
   c.execute("INSERT OR IGNORE INTO jobs VALUES(?,0,'pending',NULL,?,?,NULL)",(source['id'],int(time.time()),int(time.time())));c.commit()
   job=c.execute('SELECT cursor,status FROM jobs WHERE source=?',(source['id'],)).fetchone();cursor=job[0]
   if job[1]=='complete':return stats(path)
   try:
    total=fetch(source,{'where':'1=1','returnCountOnly':'true'})['count'];c.execute("UPDATE jobs SET reported_total=?,status='running',error=NULL WHERE source=?",(total,source['id']));c.commit()
    while time.monotonic()-start<seconds:
     ensure_space(path.parent)
     data=fetch(source,{'where':f'OBJECTID>{cursor}','orderByFields':'OBJECTID ASC','outFields':FIELDS,'returnGeometry':'true','outSR':'4326','resultRecordCount':500})
     rows=data.get('features')
     if not isinstance(rows,list):raise ValueError('Missing address features')
     if not rows:
      c.execute("UPDATE jobs SET status='complete',updated=? WHERE source=?",(int(time.time()),source['id']));c.commit();break
     c.execute('BEGIN');new_cursor=store_page(c,source['id'],rows)
     if new_cursor<=cursor:raise ValueError('Non-advancing address page')
     cursor=new_cursor;c.execute("UPDATE jobs SET cursor=?,updated=? WHERE source=?",(cursor,int(time.time()),source['id']));c.commit()
     print(json.dumps({'source':source['id'],'cursor':cursor,'page':len(rows)}),flush=True)
     time.sleep(.15)
    else:c.execute("UPDATE jobs SET status='paused',updated=? WHERE source=?",(int(time.time()),source['id']));c.commit()
   except Exception as error:
    c.rollback();c.execute("UPDATE jobs SET status='failed',error=?,updated=? WHERE source=?",(str(error),int(time.time()),source['id']));c.commit();raise
 return stats(path)

def stats(path):
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row
  return {'asOf':int(time.time()),'sources':[json.loads(r[0]) for r in c.execute('SELECT record FROM sources ORDER BY id')],'addresses':c.execute('SELECT COUNT(*) FROM addresses').fetchone()[0],'linkedBuildings':c.execute('SELECT COUNT(DISTINCT building_id) FROM addresses WHERE building_id IS NOT NULL').fetchone()[0],'matches':[dict(r) for r in c.execute('SELECT match_status,COUNT(*) records FROM addresses GROUP BY match_status')],'cities':[dict(r) for r in c.execute('SELECT upper(trim(city)) city,COUNT(*) records FROM addresses GROUP BY upper(trim(city)) ORDER BY records DESC')],'jobs':[dict(r) for r in c.execute('SELECT * FROM jobs')],'rejected':c.execute('SELECT COUNT(*) FROM rejected').fetchone()[0],'independentlyVerified':False}

def lookup(path,q,limit=50,*,after=0,city=None,linked=False):
 if not isinstance(q,str) or len(q)>200 or type(limit)is not int or not 1<=limit<=100 or type(after)is not int or not 0<=after<=9223372036854775807 or type(linked)is not bool:raise ValueError('Invalid address search')
 if city is not None and (not isinstance(city,str) or len(city)>100):raise ValueError('Invalid city')
 city=city.strip().upper() if city else None
 tokens=re.findall(r'[^\W_]+',q,flags=re.UNICODE)
 provenance='source-reported; containment is inferred, not independently verified'
 if not tokens and (q.strip() or not(city or linked)):return {'results':[],'nextCursor':None,'provenance':provenance}
 where=['a.pk>?'];args=[after];table='addresses a'
 if tokens:
  table='address_fts f JOIN addresses a ON a.pk=f.rowid';where.append('address_fts MATCH ?');args.append(' AND '.join('"'+t+'"*' for t in tokens[:12]))
 if city:where.append('upper(trim(a.city))=?');args.append(city)
 if linked:where.append('a.building_id IS NOT NULL')
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row
  rows=[dict(r) for r in c.execute('SELECT a.* FROM '+table+' WHERE '+' AND '.join(where)+' ORDER BY a.pk LIMIT ?',args+[limit+1])]
 more=len(rows)>limit;rows=rows[:limit]
 return {'results':rows,'nextCursor':rows[-1]['pk'] if more else None,'provenance':provenance,'order':'stable record ID','filters':{'city':city,'linked':linked}}

def enrich_features(path,collection):
 with sqlite3.connect(Path(path).resolve().as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row
  collection['addressAttribution']=[json.loads(r[0]) for r in c.execute('SELECT record FROM sources ORDER BY id')]
  for feature in collection['features']:
   rows=c.execute('SELECT source,address,unit,city,county,region,postal,match_status FROM addresses WHERE building_id=? ORDER BY pk LIMIT 5',(feature['id'],)).fetchall()
   feature['properties']['reportedAddresses']=[dict(r) for r in rows]
   feature['properties']['reportedAddressCount']=c.execute('SELECT COUNT(*) FROM addresses WHERE building_id=?',(feature['id'],)).fetchone()[0]
 return collection

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--db',required=True);p.add_argument('--footprints');p.add_argument('--seconds',type=int,default=180);p.add_argument('--query');args=p.parse_args()
 if args.query:report=lookup(args.db,args.query)
 else:
  if not args.footprints:p.error('--footprints required for import')
  source=json.loads(Path(__file__).with_name('address_sources.json').read_text())[0];report=run(args.db,args.footprints,source,args.seconds)
 print(json.dumps(report,indent=2))
