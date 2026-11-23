import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from north_america_intake import convert,point
from catalog_batch import merge
from property_index import validate

class MunicipalIntakeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.original=json.loads((ROOT/'space/data/snapshots/catalog-before-north-america-20261121.json').read_text())
  intake=ROOT/'space/data/intake'
  cls.batch,cls.report=convert(json.loads((intake/'vancouver-cultural-records.json').read_text()),json.loads((intake/'nyc-museums-records.json').read_text()))
 def test_preservation_and_replay(self):
  result,report=merge(self.original,self.batch);self.assertEqual(report['added'],368);self.assertEqual(len(result['properties']),408)
  old={p['id']:p for p in self.original['properties']};new={p['id']:p for p in result['properties']}
  self.assertTrue(all(new[k]==v for k,v in old.items()))
  repeated,report=merge(result,self.batch);self.assertEqual(report['added'],0);self.assertEqual(repeated,result)
  validate(result)
 def test_snapshot_attribution_and_no_offers(self):
  self.assertEqual(self.report['vancouverLatestYear'],2020);self.assertEqual(len(self.report['skipped']),10)
  for p in self.batch['properties']:
   self.assertEqual(p['physical']['status'],'unknown');self.assertEqual(p['virtual']['status'],'not_offered');self.assertIsNone(p['worldDestination'])
   self.assertTrue(p['sourceRecords']);self.assertTrue(p['operatingNotice']['sourceIds'])
   if p['address']['countryCode']=='CA':self.assertEqual(p['sourceSnapshot'],'2020');self.assertIn('Historical',p['description'])
 def test_no_duplicate_addresses_or_invented_points(self):
  self.assertEqual(len({p['id'] for p in self.batch['properties']}),368)
  self.assertGreater(self.report['eligibleSourceRecords'],368,'Co-addressed venues are grouped, not repeated buildings')
  self.assertIsNone(point('NaN',-123));self.assertIsNone(point(49,999));self.assertIsNone(point(None,None))
  for p in self.batch['properties']:
   if p['coordinates']:self.assertTrue(p['coordinates']['sourceIds'])
