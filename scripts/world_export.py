#!/usr/bin/env python3
"""Data-only bridge. No scene creation, invented positions or automatic World routing."""
import argparse,json
from pathlib import Path
from urllib.parse import quote
from property_index import validate

def world_record(p):
 return dict(propertyId=p['id'],title=p['name'],spacePath='/?property='+quote(p['id'],safe=''),address=p['address'],district=p.get('district'),coordinates=p['coordinates'],verification=p['verification'],sourcePaths=['/api/space/sources/'+quote(s,safe='') for s in p['verification']['sourceIds']],physical=p['physical'],virtual=p['virtual'],operatingNotice=p.get('operatingNotice'),worldDestination=p['worldDestination'],bindingStatus='unconnected' if p['worldDestination'] is None else 'requires_runtime_verification',sceneAsset=None,worldPosition=None,replicaRightsVerified=False)
def manifest(properties,total=None,limit=None,offset=0):
 return dict(schemaVersion=1,kind='1age-space-world-bindings',mode='data_only',total=len(properties) if total is None else total,limit=len(properties) if limit is None else limit,offset=offset,activationAllowed=False,notes='Stable record bindings for later authorized World integration. Coordinates are passed through only when supplied by cited sources; world positions remain unassigned. This export does not create a destination, replica, lease or ownership right.',places=[world_record(p) for p in properties])
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--catalog',default='space/data/catalog.json');parser.add_argument('--out',required=True);a=parser.parse_args();data=validate(json.loads(Path(a.catalog).read_text()))
 with Path(a.out).open('x') as f:json.dump(manifest(data['properties']),f,indent=2,ensure_ascii=False);f.write('\n')
 print(a.out)
