import {fitsRoad} from './crossings.mjs';
import {stepVehicle} from '../../world/gameplay/vehicle-physics.mjs';
export function stepVan(car,input,dt,parked){return stepVehicle(car,input,dt,parked,fitsRoad);}
