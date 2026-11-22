"""Repeatable reviewed-source download and resumable import; no paid services."""
import argparse,json,os,time,urllib.request,zipfile
from pathlib import Path
from .importer import ingest
from .index import metrics,initialize
from .storage import ensure_space,StorageBudgetExceeded

def download(source,directory,refresh=False):
 url=source['url'];prefix='https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/'
 if not source.get('permitted') or source.get('license')!='ODbL-1.0' or not url.startswith(prefix):raise ValueError('Unreviewed download source')
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);path=directory/(source['region']+'.geojson.zip');partial=path.with_suffix('.partial');metadata=path.with_suffix('.download.json')
 if path.exists() and not refresh:return path
 ensure_space(directory)
 # Immutable completed snapshots are preserved before an explicit refresh.
 if path.exists():
  from .importer import fingerprint
  path.rename(path.with_name(path.stem+'.'+fingerprint(path)[:16]+'.zip'))
 previous=json.loads(metadata.read_text()) if metadata.exists() else {};offset=partial.stat().st_size if partial.exists() else 0
 headers={'User-Agent':'1AGE-Space-Building-Indexer/001'}
 if offset and previous.get('etag') and previous.get('url')==url:headers.update({'Range':f'bytes={offset}-','If-Range':previous['etag']})
 else:offset=0
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=45) as response:
  if not response.url.startswith(prefix):raise ValueError('Unexpected download redirect')
  resumed=response.status==206 and offset>0
  if resumed and not response.headers.get('Content-Range','').startswith(f'bytes {offset}-'):raise ValueError('Invalid resumed response range')
  if not resumed:offset=0
  length=int(response.headers.get('Content-Length',0));expected=offset+length if length else None
  if expected and expected>2*1024**3:raise ValueError('Download exceeds this runner storage budget; configure a tiled source')
  ensure_space(directory,max(0,(expected or 0)-offset))
  metadata.write_text(json.dumps({'url':url,'etag':response.headers.get('ETag'),'retrieved':int(time.time()),'expectedBytes':expected}))
  with partial.open('ab' if resumed else 'wb') as stream:
   received=offset
   while chunk:=response.read(1024*1024):
    ensure_space(directory,len(chunk))
    received+=len(chunk)
    if received>2*1024**3:raise ValueError('Download storage budget exceeded')
    stream.write(chunk)
  if expected and received!=expected:raise ValueError('Incomplete source download; partial file retained')
  if not zipfile.is_zipfile(partial):raise ValueError('Source is not a ZIP archive')
 os.replace(partial,path);return path

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--runtime',required=True);parser.add_argument('--sources',default=str(Path(__file__).parent/'sources.json'));parser.add_argument('--refresh',action='store_true');parser.add_argument('--source',action='append');args=parser.parse_args();root=Path(args.runtime);root.mkdir(parents=True,exist_ok=True)
 sources=json.loads(Path(args.sources).read_text());failures=[];initialize(root/'buildings.sqlite3')
 if args.source and set(args.source)-{s['id'] for s in sources}:parser.error('Unknown source ID')
 for source in sources:
  if args.source and source['id'] not in args.source:continue
  try:ingest(root/'buildings.sqlite3',download(source,root/'downloads',args.refresh),source)
  except Exception as error:
   failures.append({'source':source['id'],'error':str(error)});print(json.dumps(failures[-1]),flush=True)
   if isinstance(error,StorageBudgetExceeded):break
 report=metrics(root/'buildings.sqlite3');report['runnerFailures']=failures
 (root/'index-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(bool(failures))
