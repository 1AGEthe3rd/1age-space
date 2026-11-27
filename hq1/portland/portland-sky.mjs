import {attachWorldSky} from '../../world/gameplay/city-sky.mjs';
import {portlandSplash} from './rain.mjs';
export function attachPortlandSky(options){return attachWorldSky({...options,sampleSplash:portlandSplash});}
