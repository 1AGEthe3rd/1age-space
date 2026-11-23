import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from building_engine.discover import discover

class DiscoveryTests(unittest.TestCase):
 def test_reviewed_family_only_and_duplicate_urls(self):
  url='https://minedbuildings.z5.web.core.windows.net/legacy/usbuildings-v2/Oregon.geojson.zip'
  text=f'ODbL\n[Oregon]({url})\n[Oregon]({url})\n[Fake](https://unreviewed.example/data.zip)'
  result=discover(text,{'license':'ODbL-1.0','permitted':True});self.assertEqual(len(result),1);self.assertEqual(result[0]['region'],'Oregon')
 def test_changed_licence_stops_discovery(self):
  with self.assertRaises(ValueError):discover('different terms',{})
