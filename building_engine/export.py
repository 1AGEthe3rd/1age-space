"""Export a measured dashboard snapshot and bounded real-data 3D tiles."""
import argparse,json,time
from pathlib import Path
from .index import search,metrics
from .addresses import stats,enrich_features

AREAS={
 'portland-area':{'title':'Portland area window','region':'Oregon','bbox':[-122.84,45.43,-122.45,45.66],'tile':[-122.655,45.525,-122.65,45.53]},
 'vancouver-wa-area':{'title':'Vancouver, Washington area window','region':'Washington','bbox':[-122.75,45.58,-122.45,45.75],'tile':[-122.675,45.63,-122.67,45.635]}}

def export(db,directory,addresses=None):
 directory=Path(directory);directory.mkdir(parents=True,exist_ok=True);report=metrics(db);report['previewAreas']=[]
 if addresses:report['addressEnrichment']=stats(addresses)
 for key,area in AREAS.items():
  tile=search(db,bbox=area['tile'],region=area['region'],limit=200);tile['sourceAttribution']=report['sources'];tile['snapshotAt']=report['asOf'];tile['bbox']=area['tile'];tile['title']=area['title']
  if addresses:enrich_features(addresses,tile)
  (directory/(key+'.json')).write_text(json.dumps(tile,separators=(',',':'))+'\n')
  coverage=search(db,bbox=area['bbox'],region=area['region'],limit=1)
  report['previewAreas'].append(area|{'id':key,'windowFootprints':coverage['total'],'tileFootprints':tile['total'],'renderedPreviewCount':len(tile['features']),'coverageNote':'Bounding-box intersection window, not an official city boundary or complete city inventory.'})
 (directory/'summary.json').write_text(json.dumps(report,indent=2)+'\n');return report

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--db',required=True);parser.add_argument('--out',required=True);parser.add_argument('--addresses');args=parser.parse_args();report=export(args.db,args.out,args.addresses);print(json.dumps({'uniqueFootprints':report['uniqueFootprints'],'regions':report['regions'],'previewAreas':report['previewAreas']},indent=2))
