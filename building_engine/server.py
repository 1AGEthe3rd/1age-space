"""Loopback-only read-only discovery API. Deploy behind reviewed HTTPS/auth infrastructure."""
import argparse,json,sqlite3
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
from .index import search,metrics
from .addresses import lookup,stats,enrich_features
from .scene import scene
from pathlib import Path
import mimetypes

STATIC={'/buildings.html','/space/building-layer.css','/space/building-layer.js','/space/building-viewer.js','/space/shared/three.module.js','/space/shared/three.core.js','/assets/1age-logo.svg','/space/data/buildings/summary.json','/space/data/buildings/portland-area.json','/space/data/buildings/vancouver-wa-area.json'}
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,data):
  raw=json.dumps(data,separators=(',',':')).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(raw)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(raw)
 def do_GET(self):
  if self.headers.get('Host') not in self.server.allowed_hosts:return self.reply(403,{'error':'Host denied'})
  try:
   url=urlparse(self.path);args=parse_qs(url.query,keep_blank_values=True)
   root=getattr(self.server,'web_root',None)
   if root and url.path=='/':
    self.send_response(302);self.send_header('Location','https://1age.com');self.end_headers();return
   if root and url.path in STATIC:
    root=Path(root).resolve();path=(root/url.path.lstrip('/')).resolve()
    if root not in path.parents or not path.is_file():return self.reply(404,{'error':'Asset unavailable'})
    raw=path.read_bytes();self.send_response(200);self.send_header('Content-Type',mimetypes.guess_type(path)[0] or 'application/octet-stream');self.send_header('Content-Length',str(len(raw)));self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw);return
   if any(len(v)!=1 for v in args.values()):raise ValueError('Repeated query')
   if url.path=='/api/addresses':
    if set(args)-{'q','limit','after','city','linked'} or 'q' not in args:raise ValueError('Invalid address query')
    if not getattr(self.server,'addresses',None):return self.reply(503,{'error':'Address enrichment not configured'})
    linked=args.get('linked',['false'])[0]
    if linked not in ('true','false'):raise ValueError('Invalid linked filter')
    return self.reply(200,lookup(self.server.addresses,args['q'][0],int(args.get('limit',['50'])[0]),after=int(args.get('after',['0'])[0]),city=args.get('city',[None])[0],linked=linked=='true'))
   if url.path=='/api/buildings/scene':
    if set(args)!={'id'}:raise ValueError('Scene requires one building ID')
    data=scene(self.server.db,args['id'][0],getattr(self.server,'addresses',None))
    return self.reply(200,data) if data else self.reply(404,{'error':'Building not indexed'})
   if set(args)-{'bbox','region','id','limit','offset','after'}:raise ValueError('Invalid query')
   if url.path=='/api/buildings/status':
    if args:raise ValueError('Status takes no filters')
    data=metrics(self.server.db)
    if getattr(self.server,'addresses',None):data['addressEnrichment']=stats(self.server.addresses)
    return self.reply(200,data)
   if url.path!='/api/buildings':return self.reply(404,{'error':'Unknown route'})
   get=lambda k,default=None:args.get(k,[default])[0]
   bbox=[float(x) for x in get('bbox').split(',')] if get('bbox') else None
   data=search(self.server.db,bbox=bbox,region=get('region'),building_id=get('id'),limit=int(get('limit','100')),offset=int(get('offset','0')),after=int(get('after')) if get('after') is not None else None)
   if getattr(self.server,'addresses',None):enrich_features(self.server.addresses,data)
   return self.reply(200,data)
  except (ValueError,TypeError):return self.reply(400,{'error':'Invalid filters, ID, or pagination'})
  except sqlite3.Error:return self.reply(503,{'error':'Building index unavailable'})
 def do_POST(self):self.reply(405,{'error':'Read-only index; no property claims, payments or listing writes'})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--db',required=True);parser.add_argument('--addresses');parser.add_argument('--web-root');parser.add_argument('--port',type=int,default=4184);args=parser.parse_args()
 server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler);server.db=args.db;server.web_root=args.web_root;server.addresses=args.addresses;server.allowed_hosts={f'127.0.0.1:{args.port}',f'localhost:{args.port}'}
 print(f'Local building API: http://127.0.0.1:{args.port}/api/buildings',flush=True);server.serve_forever()
