import copy,io,json,math,sqlite3,sys,tempfile,unittest,zipfile,threading
from unittest.mock import patch
from types import SimpleNamespace
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from building_engine.index import normalize_geometry,search,metrics,connect
from building_engine.importer import ingest,features

class BuildingEngineTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.db=self.root/'index.sqlite3';self.zip=self.root/'source.zip'
  self.source={'id':'fixture-source','country':'US','region':'Test region','license':'ODbL-1.0','permitted':True}
  self.geometry={'type':'Polygon','coordinates':[[[-122.01,45],[-122,45],[-122,45.01],[-122.01,45.01],[-122.01,45]]]}
 def archive(self,rows):
  with zipfile.ZipFile(self.zip,'w') as z:z.writestr('data.geojson',json.dumps({'type':'FeatureCollection','features':rows}))
 def feature(self,geometry=None):return {'type':'Feature','geometry':copy.deepcopy(geometry or self.geometry),'properties':{}}
 def test_store_search_and_replay(self):
  self.archive([self.feature()]);first=ingest(self.db,self.zip,self.source,batch_size=1);self.assertEqual(first['added'],1)
  row=search(self.db,bbox=[-122.1,44.9,-121.9,45.1])['features'][0];self.assertIsNone(row['properties']['address']);self.assertEqual(row['properties']['availability'],'unknown')
  self.assertEqual(search(self.db,building_id=row['id'])['total'],1);self.assertEqual(search(self.db,region='Elsewhere')['total'],0)
  self.assertEqual(ingest(self.db,self.zip,self.source)['checkpoint'],1);self.assertEqual(metrics(self.db)['uniqueFootprints'],1)
 def test_geometry_dedup_and_checkpoint_resume(self):
  reverse=copy.deepcopy(self.geometry);reverse['coordinates'][0]=list(reversed(reverse['coordinates'][0]))
  another=copy.deepcopy(self.geometry);another['coordinates']=[[[x+1,y] for x,y in self.geometry['coordinates'][0]]]
  self.archive([self.feature(),self.feature(reverse),self.feature(another)])
  self.assertEqual(ingest(self.db,self.zip,self.source,batch_size=1,max_records=1)['status'],'paused')
  result=ingest(self.db,self.zip,self.source,batch_size=1);self.assertEqual(result['added'],2);self.assertEqual(result['duplicates'],1);self.assertEqual(result['checkpoint'],3)
  with connect(self.db) as c:self.assertEqual(c.execute('SELECT COUNT(*) FROM observations').fetchone()[0],3)
 def test_invalid_geometry_is_retained_for_review(self):
  self.archive([self.feature(),self.feature({'type':'Point','coordinates':[0,0]})]);job=ingest(self.db,self.zip,self.source)
  self.assertEqual(job['rejected'],1)
  with connect(self.db) as c:self.assertEqual(c.execute('SELECT COUNT(*) FROM rejected').fetchone()[0],1)
 def test_invalid_source_and_query(self):
  self.archive([self.feature()]);bad=self.source|{'permitted':False}
  with self.assertRaises(ValueError):ingest(self.db,self.zip,bad)
  ingest(self.db,self.zip,self.source)
  for args in [{'limit':501},{'bbox':[0,0,0,0]},{'building_id':'not-an-id'}]:
   with self.assertRaises(ValueError):search(self.db,**args)
 def test_cursor_can_continue_without_deep_offset(self):
  shifted=copy.deepcopy(self.geometry);shifted['coordinates']=[[[x+1,y] for x,y in self.geometry['coordinates'][0]]]
  self.archive([self.feature(),self.feature(shifted)]);ingest(self.db,self.zip,self.source)
  a=search(self.db,limit=1,after=0);b=search(self.db,limit=1,after=a['nextCursor'])
  self.assertEqual(a['total'],2);self.assertEqual(b['total'],2);self.assertNotEqual(a['features'][0]['id'],b['features'][0]['id'])
 def test_parser_rejects_truncation_and_job_preserves_committed_rows(self):
  with self.assertRaises(ValueError):list(features(io.StringIO('{"features":[')))
  with zipfile.ZipFile(self.zip,'w') as z:z.writestr('data.geojson','{"features":['+json.dumps(self.feature())+',')
  with self.assertRaises(ValueError):ingest(self.db,self.zip,self.source,batch_size=1)
  report=metrics(self.db);self.assertEqual(report['uniqueFootprints'],1);self.assertEqual(report['jobs'][0]['status'],'failed');self.assertEqual(report['jobs'][0]['checkpoint'],1)
 def test_bad_coordinates_and_zero_area(self):
  for geometry in [{'type':'Polygon','coordinates':[[[0,0],[1,1],[2,2],[0,0]]]},{'type':'Polygon','coordinates':[[[0,0],[1,0],[1,float('nan')],[0,0]]]}]:
   with self.assertRaises(ValueError):normalize_geometry(geometry)
 def test_storage_pause_is_resumable(self):
  self.archive([self.feature()])
  with patch('building_engine.storage.shutil.disk_usage',return_value=SimpleNamespace(free=0)):
   with self.assertRaises(RuntimeError):ingest(self.db,self.zip,self.source)
  self.assertEqual(metrics(self.db)['jobs'][0]['status'],'paused');self.assertEqual(metrics(self.db)['uniqueFootprints'],0)
  self.assertEqual(ingest(self.db,self.zip,self.source)['status'],'complete')
 def test_foreign_database_is_not_modified(self):
  with sqlite3.connect(self.db) as c:c.execute('CREATE TABLE unrelated(value TEXT)')
  self.archive([self.feature()])
  with self.assertRaises(ValueError):ingest(self.db,self.zip,self.source)
  with sqlite3.connect(self.db) as c:self.assertEqual(c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall(),[('unrelated',)])
 def test_parallel_writer_is_rejected_without_resetting_job(self):
  entered=threading.Event();release=threading.Event()
  def hold(*args,**kwargs):entered.set();release.wait(3);return {'status':'fixture'}
  with patch('building_engine.importer._ingest',side_effect=hold):
   thread=threading.Thread(target=lambda:ingest(self.db,self.zip,self.source));thread.start()
   try:
    self.assertTrue(entered.wait(2))
    with self.assertRaisesRegex(RuntimeError,'Another building import'):ingest(self.db,self.zip,self.source)
   finally:release.set();thread.join()
