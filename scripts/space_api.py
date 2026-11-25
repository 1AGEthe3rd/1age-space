#!/usr/bin/env python3
"""Local read-only property API for integration testing, not a production service."""
import argparse,json,re,sqlite3
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse,parse_qs,unquote
from property_index import query,CatalogError,protected_property
from world_export import manifest

class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,value):
  body=json.dumps(value,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.send_header('X-Content-Type-Options','nosniff');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(body)
 def do_GET(self):
  try:
   url=urlparse(self.path);params=parse_qs(url.query,keep_blank_values=True)
   if any(len(v)!=1 for v in params.values()) or set(params)-{'q','country','category','city','use','limit','offset'}:raise CatalogError('Unknown or repeated query parameter')
   get=lambda key,default=None:params.get(key,[default])[0]
   if len(get('q',''))>500:raise CatalogError('Query too long')
   if url.path in ['/api/space/properties','/api/space/world-manifest']:
    result=query(self.server.index,get('q',''),get('country'),get('category'),int(get('limit','20')),int(get('offset','0')),city=get('city'),space_use=get('use'))
    return self.reply(200,manifest(result['properties'],result['total'],result['limit'],result['offset']) if url.path.endswith('world-manifest') else result)
   if url.path.startswith('/api/space/sources/'):
    key=unquote(url.path[len('/api/space/sources/'):])
    if not key or '/' in key:raise CatalogError('Invalid source ID')
    with sqlite3.connect(Path(self.server.index).resolve().as_uri()+'?mode=ro',uri=True) as db:row=db.execute('SELECT record FROM sources WHERE id=?',(key,)).fetchone()
    return self.reply(200,json.loads(row[0])) if row else self.reply(404,{'error':'Source not found'})
   if url.path.startswith('/api/space/properties/'):
    key=unquote(url.path[len('/api/space/properties/'):]);
    if not key or '/' in key:raise CatalogError('Invalid property ID')
    with sqlite3.connect(Path(self.server.index).resolve().as_uri()+'?mode=ro',uri=True) as db:row=db.execute('SELECT record FROM properties WHERE id=?',(key,)).fetchone()
    return self.reply(200,json.loads(row[0])) if row else self.reply(404,{'error':'Property not found'})
   return self.reply(404,{'error':'Unknown route'})
  except (CatalogError,ValueError,TypeError):return self.reply(400,{'error':'Invalid query or pagination'})
  except sqlite3.Error:return self.reply(503,{'error':'Index unavailable; rebuild the local snapshot'})
 def reject_write(self):
  path=unquote(urlparse(self.path).path)
  match=re.fullmatch(r'/api/space/properties/([a-z0-9-]+)(?:/.*)?',path)
  if match:
   try:
    with sqlite3.connect(Path(self.server.index).resolve().as_uri()+'?mode=ro',uri=True) as db:
     row=db.execute('SELECT record FROM properties WHERE id=?',(match[1],)).fetchone()
    if row and protected_property(json.loads(row[0])):
     return self.reply(403,{'error':'This virtual property is reserved. Public exploration remains available.'})
   except sqlite3.Error:
    return self.reply(503,{'error':'Index unavailable; rebuild the local snapshot'})
  return self.reply(405,{'error':'Read-only index. No property writes can be submitted.'})
 do_POST=do_PUT=do_PATCH=do_DELETE=reject_write
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--db',required=True);parser.add_argument('--port',type=int,default=4182);a=parser.parse_args();path=Path(a.db).resolve()
 if not path.is_file():parser.error('Build the validated index before starting the API')
 server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler);server.index=path;print(f'Local read-only API: http://127.0.0.1:{a.port}/api/space/properties',flush=True);server.serve_forever()
