import {fitsRoad} from './crossings.mjs';
import {createWorldVehicle} from '../../world/gameplay/vehicle.mjs';
export function createVan(scene,x,z,heading,bodyColor,profile=null){return createWorldVehicle(scene,x,z,heading,bodyColor,profile,fitsRoad);}
