import json,sqlite3,tempfile,unittest
from pathlib import Path
from building_engine.addresses import initialize
from building_engine.compare_addresses import compare

class SnapshotTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.a=Path(self.tmp.name)/'a.db';self.b=Path(self.tmp.name)/'b.db'
  for p in (self.a,self.b):
   initialize(p)
   with sqlite3.connect(p) as c:
    c.execute('INSERT INTO sources VALUES(?,?)',('s',json.dumps({'url':'fixture','license':'fixture'})))
    c.execute("INSERT INTO jobs(source,status) VALUES('s','paused')")
 def add(self,p,oid,address):
  with sqlite3.connect(p) as c:c.execute("INSERT INTO addresses(source,object_id,address,lon,lat,match_status,retrieved) VALUES('s',?,?,0,0,'unmatched',1)",(oid,address))
 def test_changes_preserve_both_and_missing_is_not_retirement(self):
  self.add(self.a,1,'Old');self.add(self.a,2,'Absent');self.add(self.b,1,'Changed');self.add(self.b,3,'New')
  before=[p.read_bytes() for p in (self.a,self.b)];r=compare(self.a,self.b)
  self.assertEqual([r[k]['count'] for k in ('added','changed','absentFromCurrent')],[1,1,1]);self.assertFalse(r['currentEnumerationComplete']);self.assertEqual(r['automaticRetirements'],0)
  self.assertEqual(before,[p.read_bytes() for p in (self.a,self.b)])
 def test_completed_still_requires_review(self):
  self.add(self.a,1,'Old')
  with sqlite3.connect(self.b) as c:c.execute("UPDATE jobs SET status='complete'")
  r=compare(self.a,self.b);self.assertTrue(r['currentEnumerationComplete']);self.assertEqual(r['automaticRetirements'],0)
 def test_changed_source_is_blocked(self):
  with sqlite3.connect(self.b) as c:c.execute('UPDATE sources SET record=?',(json.dumps({'url':'other','license':'fixture'}),))
  with self.assertRaises(ValueError):compare(self.a,self.b)
 def test_same_snapshot_and_unrelated_database_rejected(self):
  with self.assertRaises(ValueError):compare(self.a,self.a)
  foreign=Path(self.tmp.name)/'foreign.db'
  with sqlite3.connect(foreign) as c:c.execute('CREATE TABLE unrelated(x)')
  with self.assertRaises(ValueError):compare(foreign,self.b)
