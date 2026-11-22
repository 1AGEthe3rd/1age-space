"""Bounded 3D scene data around a selected indexed footprint."""
from .index import search
from .addresses import enrich_features

def scene(db,building_id,addresses=None):
 if not isinstance(building_id,str) or len(building_id)!=64:raise ValueError('Invalid building ID')
 target=search(db,building_id=building_id,limit=1)
 if not target['features']:return None
 feature=target['features'][0];points=[]
 for polygon in feature['geometry']['coordinates']:
  for ring in polygon:points.extend(ring)
 x=(min(p[0] for p in points)+max(p[0] for p in points))/2;y=(min(p[1] for p in points)+max(p[1] for p in points))/2
 bbox=[max(-180,x-.0025),max(-90,y-.0025),min(180,x+.0025),min(90,y+.0025)]
 data=search(db,bbox=bbox,limit=200)
 if not any(f['id']==building_id for f in data['features']):data['features']=([feature]+data['features'])[:200]
 if addresses:enrich_features(addresses,data)
 data.update(bbox=bbox,selectedId=building_id,representation='Source outlines with illustrative 3-metre height; not verified exteriors or interiors')
 return data
