import {attachCitySky} from '../../space/shared/weather/city-sky.mjs';
export function portlandSky(scene,sun,ambient){
  return attachCitySky({scene,sun,ambient,station:'KPDX',latitude:45.56,longitude:-122.67,
    timeZone:'America/Los_Angeles',status:document.querySelector('#weather')});
}
