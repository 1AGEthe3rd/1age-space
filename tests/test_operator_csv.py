import copy,csv,json,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from operator_csv import convert
from property_index import CatalogError,build,query
from catalog_batch import merge
class FeedTests(unittest.TestCase):
 def setUp(self):
  with (ROOT/'space/data/feeds/workspace-reviewed-20261120.csv').open(newline='') as f:self.rows=list(csv.DictReader(f))
  self.data=json.loads((ROOT/'space/data/catalog.json').read_text())
 def test_replay_import_does_not_duplicate(self):
  batch=convert(self.rows,'test');result,report=merge(self.data,batch);self.assertEqual(report['added'],0);self.assertEqual(len(result['properties']),len(self.data['properties']))
 def test_no_prices_or_vacancy_inferred(self):
  batch=convert(self.rows,'test')
  for p in batch['properties']:self.assertEqual(p['physical']['status'],'unknown');self.assertIsNone(p['physical']['listingId']);self.assertEqual(p['virtual']['status'],'not_offered');self.assertIsNone(p['worldDestination'])
 def test_invalid_feed_rejected(self):
  for field,value in [('checked_at','2099-01-01'),('source_url','http://example.org'),('source_url','https://user:password@example.org'),('space_uses','made_up'),('rights_note','')]:
   rows=copy.deepcopy(self.rows);rows[0][field]=value
   with self.assertRaises(CatalogError):convert(rows,'test')
 def test_unreviewed_columns_rejected(self):
  self.rows[0]['available']='yes'
  with self.assertRaises(CatalogError):convert(self.rows,'test')
 def test_office_index_filter(self):
  with tempfile.TemporaryDirectory() as t:
   path=Path(t)/'db';build(self.data,path);result=query(path,space_use='office');self.assertEqual(result['total'],sum('office' in p.get('spaceUses',[]) for p in self.data['properties']));self.assertTrue(all('office' in p['spaceUses'] for p in result['properties']));self.assertEqual(query(path,space_use='warehouse')['total'],0)
if __name__=='__main__':unittest.main()
