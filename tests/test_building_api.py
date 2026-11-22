import io,json,sys,tempfile,threading,unittest,urllib.request,urllib.error,zipfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from building_engine.importer import ingest
from building_engine.server import Handler,ThreadingHTTPServer
from building_engine.run import download
from building_engine.addresses import initialize,store_page
import sqlite3

class BuildingAPITests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.db=self.root/'index.sqlite3';path=self.root/'fixture.zip'
  feature={'type':'Feature','properties':{},'geometry':{'type':'Polygon','coordinates':[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}}
  with zipfile.ZipFile(path,'w') as z:z.writestr('data.geojson',json.dumps({'type':'FeatureCollection','features':[feature]}))
  ingest(self.db,path,{'id':'fixture','country':'US','region':'Fixture','license':'ODbL-1.0','permitted':True})
  self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);self.server.db=self.db;self.host=f'127.0.0.1:{self.server.server_port}';self.server.allowed_hosts={self.host};self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
 def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
 def call(self,path,data=None,host=None):
  req=urllib.request.Request('http://'+self.host+path,data=json.dumps(data).encode() if data is not None else None,headers={'Host':host or self.host})
  with urllib.request.urlopen(req) as r:return json.load(r)
 def test_status_spatial_query_and_cursor(self):
  self.assertEqual(self.call('/api/buildings/status')['uniqueFootprints'],1)
  result=self.call('/api/buildings?bbox=-1,-1,2,2&limit=1&after=0');self.assertEqual(len(result['features']),1)
  self.assertEqual(self.call('/api/buildings?limit=1&after='+str(result['nextCursor']))['features'],[])
 def test_address_search_and_building_enrichment(self):
  side=self.root/'addresses.sqlite3';initialize(side)
  with sqlite3.connect(side,uri=True) as c:
   c.execute('ATTACH DATABASE ? AS footprints',(self.db.as_uri()+'?mode=ro',));c.execute('INSERT INTO sources VALUES(?,?)',('fixture','{}'));store_page(c,'fixture',[{'attributes':{'OBJECTID':1,'ADD_FULL':'100 Main Street','CITY':'Fixture'},'geometry':{'x':.5,'y':.5}}])
  self.server.addresses=side
  result=self.call('/api/addresses?q=Main');self.assertEqual(len(result['results']),1)
  filtered=self.call('/api/addresses?q=Main&city=Fixture&linked=true&after=0&limit=1');self.assertEqual(len(filtered['results']),1);self.assertIsNone(filtered['nextCursor'])
  bid=result['results'][0]['building_id'];feature=self.call('/api/buildings?id='+bid)['features'][0]
  self.assertEqual(feature['properties']['reportedAddressCount'],1);self.assertIsNone(feature['properties']['address'])
  self.assertEqual(self.call('/api/buildings/status')['addressEnrichment']['addresses'],1)
  for path in ['/api/addresses?q=Main&limit=101','/api/addresses?q=Main&q=Other','/api/addresses?q=Main&sql=DELETE','/api/addresses?q=Main&linked=yes','/api/addresses?q=Main&after=-1']:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path)
   self.assertEqual(e.exception.code,400)
 def test_scene_is_bounded_and_selects_existing_building(self):
  bid=self.call('/api/buildings')['features'][0]['id'];data=self.call('/api/buildings/scene?id='+bid)
  self.assertEqual(data['selectedId'],bid);self.assertLessEqual(len(data['features']),200);self.assertTrue(any(f['id']==bid for f in data['features']));self.assertEqual(len(data['bbox']),4)
  for path,status in [('/api/buildings/scene?id=',400),('/api/buildings/scene?id=bad',400),('/api/buildings/scene?id='+'f'*64,404),('/api/buildings/scene?id='+bid+'&limit=999',400)]:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path)
   self.assertEqual(e.exception.code,status)
 def test_static_allowlist_does_not_expose_database_or_source(self):
  self.server.web_root=self.root;(self.root/'buildings.html').write_text('<h1>Fixture</h1>');(self.root/'secret.txt').write_text('private')
  with urllib.request.urlopen('http://'+self.host+'/buildings.html') as r:self.assertEqual(r.read(),b'<h1>Fixture</h1>')
  for path in ['/index.sqlite3','/secret.txt','/../secret.txt','/space/../../secret.txt']:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path)
   self.assertEqual(e.exception.code,404)
 def test_missing_address_database_is_explicit(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/addresses?q=Main')
  self.assertEqual(e.exception.code,503)
 def test_no_writes_file_exposure_or_invalid_query(self):
  for path,status in [('/index.sqlite3',404),('/api/buildings?limit=501',400),('/api/buildings?limit=1&limit=2',400),('/api/buildings?sql=DELETE',400)]:
   with self.assertRaises(urllib.error.HTTPError) as e:self.call(path)
   self.assertEqual(e.exception.code,status)
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/buildings',data={})
  self.assertEqual(e.exception.code,405)
  with self.assertRaises(urllib.error.HTTPError) as e:self.call('/api/buildings',host='untrusted.example')
  self.assertEqual(e.exception.code,403)

class DownloadTests(unittest.TestCase):
 def test_resume_and_server_ignored_range(self):
  for status in (200,206):
   with self.subTest(status=status),tempfile.TemporaryDirectory() as folder:
    root=Path(folder);url='https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/Fixture.zip';source={'id':'fixture','url':url,'region':'Fixture','permitted':True,'license':'ODbL-1.0'}
    raw=io.BytesIO()
    with zipfile.ZipFile(raw,'w') as z:z.writestr('data.geojson','{"features":[]}')
    payload=raw.getvalue();cut=30
    (root/'Fixture.geojson.partial').write_bytes(payload[:cut]);(root/'Fixture.geojson.download.json').write_text(json.dumps({'url':url,'etag':'fixture-etag'}))
    response=io.BytesIO(payload[cut:] if status==206 else payload);response.status=status;response.url=url;response.headers={'Content-Length':str(len(payload)-cut if status==206 else len(payload)),'ETag':'fixture-etag','Content-Range':f'bytes {cut}-{len(payload)-1}/{len(payload)}'}
    with patch('urllib.request.urlopen',return_value=response):path=download(source,root)
    self.assertEqual(path.read_bytes(),payload)
