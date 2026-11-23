"""Checkpointed offline GeoJSON import. Source snapshots are immutable job inputs."""
import argparse,hashlib,io,json,re,sqlite3,time,zipfile,shutil,fcntl
from pathlib import Path
from .index import initialize,connect,normalize_geometry
from .storage import ensure_space,StorageBudgetExceeded

def features(stream):
 decoder=json.JSONDecoder();buffer='';ended=False
 while True:
  part=stream.read(65536)
  if not part:raise ValueError('Missing FeatureCollection features array')
  buffer+=part;match=re.search(r'"features"\s*:\s*\[',buffer)
  if match:buffer=buffer[match.end():];break
  if len(buffer)>1048576:raise ValueError('Invalid GeoJSON prefix')
 need_feature=True
 while True:
  buffer=buffer.lstrip()
  if buffer.startswith(']'):
   if not need_feature:pass
   tail=buffer[1:]+stream.read(1048577)
   if tail.strip()!='}':raise ValueError('Invalid or truncated FeatureCollection ending')
   return
  if not need_feature:
   if buffer.startswith(','):buffer=buffer[1:].lstrip();need_feature=True
   elif buffer:raise ValueError('Missing feature separator')
  if need_feature and buffer:
   try:feature,end=decoder.raw_decode(buffer)
   except json.JSONDecodeError:pass
   else:
    if not isinstance(feature,dict) or feature.get('type')!='Feature':raise ValueError('Invalid GeoJSON feature')
    yield feature;buffer=buffer[end:];need_feature=False;continue
  part=stream.read(65536)
  if not part:raise ValueError('Truncated FeatureCollection')
  buffer+=part
  if len(buffer)>16*1024*1024:raise ValueError('Feature exceeds bounded parser memory budget')

def fingerprint(path):
 h=hashlib.sha256()
 with open(path,'rb') as stream:
  while block:=stream.read(1024*1024):h.update(block)
 return h.hexdigest()

def _ingest(db,path,source,*,batch_size=5000,max_records=None):
 if type(batch_size)is not int or not 1<=batch_size<=20000:raise ValueError('Invalid batch size')
 if not source.get('permitted') or source.get('license')!='ODbL-1.0':raise ValueError('Source permission/licence has not been reviewed')
 initialize(db);version=fingerprint(path);now=int(time.time())
 with connect(db) as c:
  prior=c.execute('SELECT record FROM sources WHERE id=?',(source['id'],)).fetchone()
  encoded=json.dumps(source,sort_keys=True)
  if prior and prior[0]!=encoded:raise ValueError('Source registration changed; review under a new source ID')
  c.execute('INSERT OR IGNORE INTO sources VALUES(?,?)',(source['id'],encoded))
  c.execute('INSERT OR IGNORE INTO jobs(source_id,fingerprint,started,updated) VALUES(?,?,?,?)',(source['id'],version,now,now))
  job=dict(c.execute('SELECT * FROM jobs WHERE source_id=? AND fingerprint=?',(source['id'],version)).fetchone())
 if job['status']=='complete':return job
 try:
  with zipfile.ZipFile(path) as archive:
   members=[m for m in archive.infolist() if m.filename.lower().endswith(('.geojson','.json')) and not m.is_dir()]
   if len(members)!=1:raise ValueError('Expected one GeoJSON member; archive is never extracted to disk')
   with io.TextIOWrapper(archive.open(members[0]),encoding='utf-8') as stream,connect(db) as c:
    c.execute('UPDATE jobs SET status=?,error=NULL WHERE id=?',('running',job['id']));c.commit()
    pending=0
    for ordinal,feature in enumerate(features(stream),1):
     if ordinal<=job['checkpoint']:continue
     if max_records is not None and ordinal>max_records:break
     if pending==0:
      ensure_space(Path(db).resolve().parent)
      c.execute('BEGIN IMMEDIATE')
     try:digest,geometry,bbox=normalize_geometry(feature.get('geometry'))
     except (ValueError,TypeError,KeyError) as error:
      c.execute('INSERT INTO rejected VALUES(?,?,?,?)',(job['id'],ordinal,str(error),json.dumps(feature,separators=(',',':'))));job['rejected']+=1
     else:
      existing=c.execute('SELECT pk,geometry FROM buildings WHERE hash=?',(digest,)).fetchone()
      if existing:
       if existing['geometry']!=geometry:raise ValueError('Geometry fingerprint collision')
       pk=existing['pk'];job['duplicates']+=1
      else:
       cursor=c.execute('INSERT INTO buildings(hash,geometry,minlon,maxlon,minlat,maxlat,country,region,first_seen) VALUES(?,?,?,?,?,?,?,?,?)',(digest,geometry,*bbox,source['country'],source['region'],now));pk=cursor.lastrowid
       c.execute('INSERT INTO spatial VALUES(?,?,?,?,?)',(pk,*bbox));job['added']+=1
      props=feature.get('properties') or {};capture=props.get('capture_dates_range') if isinstance(props,dict) else None
      c.execute('INSERT INTO observations VALUES(?,?,?,?)',(job['id'],ordinal,pk,str(capture)[:200] if capture else None))
     pending+=1;job['checkpoint']=ordinal
     if pending>=batch_size:
      c.execute('UPDATE jobs SET checkpoint=?,added=?,duplicates=?,rejected=?,updated=? WHERE id=?',(ordinal,job['added'],job['duplicates'],job['rejected'],int(time.time()),job['id']));c.commit();pending=0
      print(json.dumps({k:job[k] for k in ['source_id','checkpoint','added','duplicates','rejected']}),flush=True)
    else:job['status']='complete'
    if job['status']!='complete':job['status']='paused'
    c.execute('UPDATE jobs SET checkpoint=?,added=?,duplicates=?,rejected=?,status=?,updated=? WHERE id=?',(job['checkpoint'],job['added'],job['duplicates'],job['rejected'],job['status'],int(time.time()),job['id']));c.commit()
 except BaseException as error:
  with connect(db) as c:c.execute('UPDATE jobs SET status=?,error=?,updated=? WHERE id=?',('paused' if isinstance(error,StorageBudgetExceeded) else 'failed',str(error)[:500],int(time.time()),job['id']))
  raise
 return job

def ingest(db,path,source,*,batch_size=5000,max_records=None):
 """One writer per database; kernel releases the lock if the process stops."""
 db=Path(db).resolve();db.parent.mkdir(parents=True,exist_ok=True)
 with open(str(db)+'.import.lock','a+b') as lock:
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise RuntimeError('Another building import is active for this database') from None
  return _ingest(db,path,source,batch_size=batch_size,max_records=max_records)

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--db',required=True);parser.add_argument('--source',required=True);parser.add_argument('--file',required=True);parser.add_argument('--batch-size',type=int,default=5000);parser.add_argument('--max-records',type=int);args=parser.parse_args()
 sources=json.loads((Path(__file__).parent/'sources.json').read_text());source=next(s for s in sources if s['id']==args.source)
 print(json.dumps(ingest(args.db,args.file,source,batch_size=args.batch_size,max_records=args.max_records)),flush=True)
