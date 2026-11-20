import copy,json,sys,tempfile,threading,unittest,urllib.request,urllib.error
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from property_index import validate,build,CatalogError
from catalog_batch import merge,quality
from world_export import manifest
from space_api import Handler,ThreadingHTTPServer
class BatchTests(unittest.TestCase):
 def setUp(self):
  self.catalog=json.loads((ROOT/'space/data/catalog.json').read_text());self.batch=json.loads((ROOT/'space/data/batches/2026-11-20-expanded-places.json').read_text())
 def test_expansion_is_idempotent_and_preserves_existing(self):
  ids={p['id'] for p in self.batch['properties']};sids={s['id'] for s in self.batch['sources']};base=copy.deepcopy(self.catalog);base['properties']=[p for p in base['properties'] if p['id'] not in ids];base['sources']=[s for s in base['sources'] if s['id'] not in sids]
  merged,report=merge(base,self.batch);self.assertEqual(report['added'],24);self.assertEqual(merged['properties'][:len(base['properties'])],base['properties']);again,retry=merge(merged,self.batch);self.assertEqual(retry['added'],0);self.assertEqual(again,merged)
 def test_no_silent_record_overwrite(self):
  batch=copy.deepcopy(self.batch);batch['properties'][0]['name']='Unexpected replacement'
  with self.assertRaises(CatalogError):merge(self.catalog,batch)
 def test_no_conflicting_source_overwrite(self):
  batch=copy.deepcopy(self.batch);batch['sources'][0]['url']='https://example.org/replaced'
  with self.assertRaises(CatalogError):merge(self.catalog,batch)
 def test_address_duplicates_need_review(self):
  batch=copy.deepcopy(self.batch);p=copy.deepcopy(self.catalog['properties'][0]);p['id']='new-duplicate-address';p['address']['line1']=p['address']['line1'].replace('Boulevard','Blvd');batch['properties']=[p]
  with self.assertRaises(CatalogError):merge(self.catalog,batch)
 def test_field_evidence_cannot_reference_wrong_scope(self):
  p=self.catalog['properties'][-1];p['verification']['fieldSources']['unknown-field']=p['verification']['sourceIds']
  with self.assertRaises(CatalogError):validate(self.catalog)
 def test_operating_notice_not_vacancy(self):
  p=next(p for p in self.catalog['properties'] if p['id']=='place-us-washington-anacostia-arts-1231');self.assertIn('renovation',p['operatingNotice']['text']);self.assertEqual(p['physical']['status'],'unknown');self.assertIsNone(p['physical']['listingId'])
 def test_quality_and_manifest(self):
  q=quality(self.catalog);self.assertEqual(q['properties'],len(self.catalog['properties']));self.assertGreaterEqual(len(q['countries']),6);self.assertEqual(q['physicalAvailable'],0);m=manifest(self.catalog['properties']);self.assertFalse(m['activationAllowed']);self.assertTrue(all(p['worldPosition'] is None and p['coordinates'] is None and p['bindingStatus']=='unconnected' for p in m['places']))
class APItests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.db=Path(self.tmp.name)/'catalog.sqlite3';build(json.loads((ROOT/'space/data/catalog.json').read_text()),self.db);self.server=ThreadingHTTPServer(('127.0.0.1',0),Handler);self.server.index=self.db;self.url=f'http://127.0.0.1:{self.server.server_port}';self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
 def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
 def get(self,path):
  with urllib.request.urlopen(self.url+path) as response:return json.load(response)
 def test_paginated_country_city_search(self):
  a=self.get('/api/space/properties?country=GB&city=London&limit=2');b=self.get('/api/space/properties?country=GB&city=London&limit=2&offset=2');self.assertEqual(a['total'],4);self.assertEqual(len(a['properties']),2);self.assertFalse(set(p['id'] for p in a['properties'])&set(p['id'] for p in b['properties']))
 def test_id_lookup_and_world_binding(self):
  p=self.get('/api/space/properties/property-hq1-5601-ne-mlk');self.assertEqual(p['virtual']['status'],'demo');self.assertIsNone(p['worldDestination']);m=self.get('/api/space/world-manifest?country=DE&limit=1');self.assertEqual(m['total'],2);self.assertEqual(len(m['places']),1);self.assertFalse(m['activationAllowed']);self.assertFalse(m['places'][0]['replicaRightsVerified'])
 def test_reject_invalid_query_and_no_file_exposure(self):
  for path,status in [('/api/space/properties?limit=1000',400),('/api/space/properties?q=a&q=b',400),('/api/space/properties?sql=DELETE',400),('/scripts/space_api.py',404),('/api/space/properties/missing',404)]:
   with self.assertRaises(urllib.error.HTTPError) as error:self.get(path)
   self.assertEqual(error.exception.code,status)
 def test_source_attribution_lookup(self):
  source=self.get('/api/space/sources/src-aac-contact');self.assertEqual(source['url'],'https://anacostiaartscenter.com/contact/');self.assertIn('operatingNotice',source['scope'])
 def test_writes_disabled(self):
  req=urllib.request.Request(self.url+'/api/space/properties',data=b'{}',method='POST')
  with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(req)
  self.assertEqual(error.exception.code,405)
if __name__=='__main__':unittest.main()
