import copy,datetime as dt,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from space_structure import validate_structure,eligible_listings,claim_scope_matches
from property_index import CatalogError

class StructureTests(unittest.TestCase):
 def setUp(self):
  # Fictional fixtures, never inserted into the public catalog.
  self.data={'sources':[{'id':'fixture-source','scope':['name','address','availability']}],
   'buildings':[{'id':'fixture-building','address':{'countryCode':'US','region':'Washington','city':'Example City','line1':'100 Example Street'},'sourceIds':['fixture-source']}],
   'units':[{'id':'fixture-room','name':'Fictional rehearsal room','buildingId':'fixture-building','disciplines':['music'],'rentalDurations':['hour'],'availability':'unknown','sourceIds':['fixture-source']}],
   'physicalListings':[{'id':'fixture-listing','buildingId':'fixture-building','unitId':'fixture-room','kind':'booking','status':'temporarily_available','durations':['hour'],'rate':{'amountMinor':2500,'currency':'USD','per':'hour'},'sourceIds':['fixture-source'],'authorized':True,'verifiedAt':'2026-11-01','expiresAt':'2026-12-01'}]}
 def test_temporary_hourly_discovery_and_expiry(self):
  self.assertEqual(len(eligible_listings(self.data,duration='hour',discipline='music',now=dt.date(2026,11,21))),1)
  self.assertEqual(eligible_listings(self.data,duration='day',now=dt.date(2026,11,21)),[])
  self.assertEqual(eligible_listings(self.data,now=dt.date(2026,12,1)),[])
 def test_unknown_is_not_available(self):
  self.data['physicalListings'][0]['status']='unknown';self.assertEqual(eligible_listings(self.data),[])
 def test_availability_requires_appropriate_evidence(self):
  self.data['sources'][0]['scope']=['name','address']
  with self.assertRaises(CatalogError):validate_structure(self.data)
 def test_unit_cannot_reference_another_building_listing(self):
  self.data['physicalListings'][0]['buildingId']='another-building'
  with self.assertRaises(CatalogError):validate_structure(self.data)
 def test_duplicate_building_and_price_tampering(self):
  duplicate=copy.deepcopy(self.data['buildings'][0]);duplicate['id']='another-building';self.data['buildings'].append(duplicate)
  with self.assertRaises(CatalogError):validate_structure(self.data)
  self.data['buildings'].pop();self.data['physicalListings'][0]['rate']['amountMinor']=25.5
  with self.assertRaises(CatalogError):validate_structure(self.data)
 def test_tenant_scope_cannot_control_parent_or_other_unit(self):
  claim={'scope':'unit','buildingId':'fixture-building','unitId':'fixture-room'}
  self.assertTrue(claim_scope_matches(claim,building_id='fixture-building',unit_id='fixture-room'))
  self.assertFalse(claim_scope_matches(claim,building_id='fixture-building'))
  self.assertFalse(claim_scope_matches(claim,building_id='fixture-building',unit_id='other-room'))
