import json,sqlite3,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
from building_engine.importer import ingest
from building_engine.addresses import initialize,store_page,contains,lookup,stats,run

class AddressTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.base=self.root/'base.sqlite3';self.db=self.root/'address.sqlite3';self.poly={'type':'Polygon','coordinates':[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}
  zpath=self.root/'in.zip'
  with zipfile.ZipFile(zpath,'w') as z:z.writestr('a.geojson',json.dumps({'features':[{'type':'Feature','geometry':self.poly,'properties':{}}]}))
  ingest(self.base,zpath,{'id':'fixture','country':'US','region':'Fixture','permitted':True,'license':'ODbL-1.0'})
  initialize(self.db)
  self.source={'id':'fixture-address','url':'fixture','permitted':True,'license':'PDDL-1.0'}
 def connection(self):
  c=sqlite3.connect(self.db,uri=True);c.execute('ATTACH DATABASE ? AS footprints',(self.base.as_uri()+'?mode=ro',));c.execute('INSERT OR IGNORE INTO sources VALUES(?,?)',(self.source['id'],json.dumps(self.source)));c.commit();return c
 def row(self,oid,x=.5,y=.5,address='100 Main Street',unit=None):return {'attributes':{'OBJECTID':oid,'ADDRESS_ID':oid,'ADD_FULL':address,'CITY':'Fixture','UNIT_VALUE':unit},'geometry':{'x':x,'y':y}}
 def test_links_and_search_without_mutating_base(self):
  before=self.base.read_bytes()
  with self.connection() as c:store_page(c,self.source['id'],[self.row(1),self.row(2,address='100 Main Street Apt 2',unit='2')])
  result=lookup(self.db,'100 Main');self.assertEqual(len(result['results']),2);self.assertEqual(stats(self.db)['linkedBuildings'],1)
  self.assertIsNotNone(result['results'][0]['building_id']);self.assertEqual(self.base.read_bytes(),before)
 def test_boundary_outside_and_holes_not_assumed_match(self):
  with self.connection() as c:store_page(c,self.source['id'],[self.row(1,x=0),self.row(2,x=2)])
  states={r['match_status'] for r in lookup(self.db,'Main')['results']};self.assertEqual(states,{'ambiguous','unmatched'})
  hole={'type':'Polygon','coordinates':self.poly['coordinates']+[[[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.2,.2]]]}
  self.assertFalse(contains(hole,.5,.5));self.assertIsNone(contains(hole,.2,.5));self.assertTrue(contains(hole,.1,.1))
 def test_duplicate_replay_and_invalid_point_retained(self):
  with self.connection() as c:
   store_page(c,self.source['id'],[self.row(1)]);store_page(c,self.source['id'],[self.row(1),self.row(2,x=999)])
  self.assertEqual(stats(self.db)['addresses'],1);self.assertEqual(stats(self.db)['rejected'],1)
 def test_fts_and_queries_are_safe(self):
  with self.connection() as c:store_page(c,self.source['id'],[self.row(1)])
  self.assertEqual(len(lookup(self.db,'Main" OR *')['results']),0)
  self.assertEqual(lookup(self.db,'***')['results'],[])
  with self.assertRaises(ValueError):lookup(self.db,'x'*201)
  with self.assertRaises(ValueError):lookup(self.db,'Main',101)
 def test_resume_and_network_failure_preserves_commits(self):
  def fake(source,params):
   if params.get('returnCountOnly'):return {'count':2}
   if params['where']=='OBJECTID>0':return {'features':[self.row(1)]}
   raise OSError('fixture interruption')
  with patch('building_engine.addresses.fetch',side_effect=fake):
   with self.assertRaises(OSError):run(self.db,self.base,self.source,30)
  report=stats(self.db);self.assertEqual(report['addresses'],1);self.assertEqual(report['jobs'][0]['cursor'],1);self.assertEqual(report['jobs'][0]['status'],'failed')
  def again(source,params):return {'count':2} if params.get('returnCountOnly') else {'features':[self.row(2)] if params['where']=='OBJECTID>1' else []}
  with patch('building_engine.addresses.fetch',side_effect=again):self.assertEqual(run(self.db,self.base,self.source,30)['addresses'],2)
 def test_paging_reaches_every_result_without_duplicates(self):
  with self.connection() as c:store_page(c,self.source['id'],[self.row(i,address=f'{i} Main Street') for i in range(1,8)])
  ids=[];cursor=0
  while True:
   page=lookup(self.db,'Main',2,after=cursor);ids.extend(r['object_id'] for r in page['results'])
   if page['nextCursor'] is None:break
   cursor=page['nextCursor']
  self.assertEqual(ids,list(range(1,8)))
 def test_city_and_link_filters_preserve_unmatched_records(self):
  with self.connection() as c:store_page(c,self.source['id'],[self.row(1),self.row(2,x=2)])
  self.assertEqual(len(lookup(self.db,'',city=' fixture ')['results']),2)
  self.assertEqual(len(lookup(self.db,'Main',city='FIXTURE',linked=True)['results']),1)
  self.assertEqual(len(lookup(self.db,'Main',city='Elsewhere')['results']),0)
  self.assertEqual(stats(self.db)['addresses'],2)
  for kwargs in [{'after':-1},{'after':2**63},{'linked':'yes'},{'city':'x'*101}]:
   with self.assertRaises(ValueError):lookup(self.db,'Main',**kwargs)
 def test_unrelated_database_rejected(self):
  with self.assertRaises(ValueError):initialize(self.base)
