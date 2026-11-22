"""Discover state snapshots from the already-reviewed Microsoft ODbL dataset.

This does not discover/review arbitrary providers or authorize private listing feeds.
"""
import argparse,datetime as dt,json,re,urllib.request
from pathlib import Path

README='https://raw.githubusercontent.com/microsoft/USBuildingFootprints/master/README.md'
def discover(text,template):
 if 'ODbL' not in text and 'Open Database License' not in text:raise ValueError('Upstream licence statement changed; review required')
 result=[];seen=set()
 for name,url in re.findall(r'\[([^\]]+)\]\((https://minedbuildings\.z5\.web\.core\.windows\.net/legacy/usbuildings-v2/[A-Za-z]+\.geojson\.zip)\)',text):
  if url in seen:continue
  seen.add(url);slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-')
  if name=='District of Columbia':slug='dc'
  result.append(template|{'id':'microsoft-us-'+slug+'-v2','title':'Microsoft US Building Footprints — '+name+' legacy v2','region':name,'url':url})
 if not result:raise ValueError('No reviewed-domain state snapshots discovered')
 return result

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--out',required=True);args=parser.parse_args();target=Path(args.out)
 if target.exists():parser.error('Refusing to overwrite a reviewed source catalog')
 with urllib.request.urlopen(README,timeout=30) as response:text=response.read(2*1024*1024).decode()
 sources=discover(text,json.loads((Path(__file__).parent/'sources.json').read_text())[0]);target.write_text(json.dumps(sources,indent=2)+'\n');print(json.dumps({'discoveredRegions':len(sources),'downloadedBuildingFiles':0,'source':README}))
