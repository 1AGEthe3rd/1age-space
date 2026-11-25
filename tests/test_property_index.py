import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('index',ROOT/'scripts/property_index.py');index=importlib.util.module_from_spec(spec);spec.loader.exec_module(index)
class IndexTests(unittest.TestCase):
 def setUp(self):self.data=json.loads((ROOT/'space/data/catalog.json').read_text())
 def test_seed(self):self.assertGreaterEqual(len(index.validate(self.data)['properties']),30)
 def test_duplicate_id(self):
  self.data['properties'].append(copy.deepcopy(self.data['properties'][0]))
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_unknown_not_available(self):
  self.data['properties'][0]['physical']['status']='available'
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_source_reference(self):
  self.data['properties'][0]['verification']['sourceIds']=['missing']
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_false_source_checked(self):
  self.data['properties'][0]['verification']['status']='source_checked'
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_coordinate_evidence(self):
  self.data['properties'][0]['coordinates']={'latitude':45,'longitude':-122,'sourceIds':[]}
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_relationship(self):
  self.data['virtualSpaces'][0]['propertyId']='missing'
  with self.assertRaises(index.CatalogError):index.validate(self.data)
 def test_fts_pagination_and_no_overwrite(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'index.sqlite3';index.build(self.data,path)
   self.assertGreaterEqual(index.query(path,'MLK',limit=1)['total'],3)
   self.assertGreaterEqual(index.query(path,category='art')['total'],2)
   self.assertGreaterEqual(index.query(path,country='GB')['total'],1)
   self.assertNotEqual(index.query(path,limit=1)['properties'][0]['id'],index.query(path,limit=1,offset=1)['properties'][0]['id'])
   self.assertEqual(index.query(path,'zzzz" OR 1=1 --')['total'],0)
   with self.assertRaises(index.CatalogError):index.build(self.data,path)
   with self.assertRaises(index.CatalogError):index.query(path,limit=101)
if __name__=='__main__':unittest.main()
