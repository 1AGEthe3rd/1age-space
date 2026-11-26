import {attachPortlandSky} from './portland-sky.mjs';
export function portlandSky(scene,sun,ambient,roadMaterials){
  const requested=new URLSearchParams(location.search).get('weatherPreview');
  const preview=['rain','clear','snow','cloud'].includes(requested)?requested:null;
  return attachPortlandSky({scene,sun,ambient,station:'KPDX',latitude:45.56,longitude:-122.67,
    timeZone:'America/Los_Angeles',status:document.querySelector('#weather'),roadMaterials,preview});
}
