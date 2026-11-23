"""Read-only snapshot comparison. Missing records are review candidates, never deletions."""
import argparse,json,sqlite3,os
from pathlib import Path
from .index import ClosingConnection

FIELDS=('source_id','address','unit','city','county','region','postal','lon','lat','building_id','match_status')
def compare(previous,current,sample_limit=20):
 if type(sample_limit)is not int or not 0<=sample_limit<=100:raise ValueError('Invalid sample limit')
 previous,current=Path(previous).resolve(),Path(current).resolve()
 if previous==current:raise ValueError('Choose different snapshots')
 with sqlite3.connect(current.as_uri()+'?mode=ro',uri=True,factory=ClosingConnection) as c:
  c.row_factory=sqlite3.Row;c.execute('ATTACH DATABASE ? AS prior',(previous.as_uri()+'?mode=ro',))
  for prefix in ('main','prior'):
   if c.execute(f'PRAGMA {prefix}.application_id').fetchone()[0]!=0x31414741:raise ValueError('Not an address enrichment database')
  c.execute('BEGIN')
  old_sources={r[0] for r in c.execute('SELECT id FROM prior.sources')};new_sources={r[0] for r in c.execute('SELECT id FROM main.sources')}
  if old_sources!=new_sources:raise ValueError('Compare the same source set; source removal is not record retirement')
  # A changed source licence or endpoint must be reviewed before reconciling.
  for source in old_sources:
   a=json.loads(c.execute('SELECT record FROM prior.sources WHERE id=?',(source,)).fetchone()[0]);b=json.loads(c.execute('SELECT record FROM main.sources WHERE id=?',(source,)).fetchone()[0])
   if any(a.get(k)!=b.get(k) for k in ('url','license')):raise ValueError('Source identity or licence changed')
  join='c.source=p.source AND c.object_id=p.object_id'
  changed=' OR '.join(f'c.{f} IS NOT p.{f}' for f in FIELDS)
  cases={
   'added':('main.addresses c LEFT JOIN prior.addresses p ON '+join,'p.pk IS NULL'),
   'changed':('main.addresses c JOIN prior.addresses p ON '+join,changed),
   'absentFromCurrent':('prior.addresses p LEFT JOIN main.addresses c ON '+join,'c.pk IS NULL')}
  result={'previousRows':c.execute('SELECT COUNT(*) FROM prior.addresses').fetchone()[0],'currentRows':c.execute('SELECT COUNT(*) FROM main.addresses').fetchone()[0]}
  for name,(tables,where) in cases.items():
   alias='p' if name=='absentFromCurrent' else 'c'
   result[name]={'count':c.execute('SELECT COUNT(*) FROM '+tables+' WHERE '+where).fetchone()[0],'sample':[dict(r) for r in c.execute(f'SELECT {alias}.source,{alias}.object_id FROM '+tables+' WHERE '+where+f' ORDER BY {alias}.source,{alias}.object_id LIMIT ?',(sample_limit,))]}
  jobs=[dict(r) for r in c.execute('SELECT source,status,cursor,reported_total FROM main.jobs')]
  result.update(currentJobs=jobs,currentEnumerationComplete=bool(jobs) and all(j['status']=='complete' for j in jobs),automaticRetirements=0,note='Absent records are review candidates only. Incomplete enumeration, upstream edits, source ID reuse and geometry changes require review. No database writes or property verification occur.')
 return result

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--previous',required=True);p.add_argument('--current',required=True);p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out)
 if out.exists():p.error('Report already exists; refusing to overwrite')
 data=compare(args.previous,args.current)
 # Exclusive creation protects prior reports, and neither database is modified.
 with out.open('x') as f:json.dump(data,f,indent=2);f.write('\n')
 print(json.dumps(data,indent=2))
