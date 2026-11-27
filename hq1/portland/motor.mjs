import {fitsRoad} from './crossings.mjs';
// Metres, seconds and radians. Positive speed points down the vehicle's local -Z.
export function stepVan(car, input, dt, parked) {
  const approach = (value,target,step) => value + Math.sign(target-value)*Math.min(step,Math.abs(target-value));
  const steerLimit=.53/(1+Math.abs(car.speed)*.065);
  car.steer=approach(car.steer,-input.steer*steerLimit,1.9*dt);
  const acceleration=car.reverse ? 1.35 : 2.1;
  const limit=car.reverse ? 2.8 : 10.7;
  const drag=.22+.013*car.speed**2;
  car.speed=approach(car.speed,0,(drag+input.brake*5.6)*dt);
  if(!input.brake) car.speed=approach(car.speed,(car.reverse?-1:1)*limit,input.gas*acceleration*dt);
  const heading=car.heading+car.speed*Math.tan(car.steer)/2.6*dt;
  const x=car.x-Math.sin(heading)*car.speed*dt;
  const z=car.z-Math.cos(heading)*car.speed*dt;
  if(!fitsRoad(x,z,heading)){car.speed=0;return;}
  for(const other of (Array.isArray(parked)?parked:[parked])){
    if(!other||Math.hypot(x-other.x,z-other.z)>=4.6)continue;
    // Separating axes of both oriented vehicle footprints.
    const axes=h=>[[Math.cos(h),-Math.sin(h)],[Math.sin(h),Math.cos(h)]];
    const a=axes(heading),b=axes(other.heading);
    const span=(basis,u,v)=>.92*Math.abs(basis[0][0]*u+basis[0][1]*v)+2.05*Math.abs(basis[1][0]*u+basis[1][1]*v);
    if([...a,...b].every(([u,v])=>Math.abs((x-other.x)*u+(z-other.z)*v)<span(a,u,v)+span(b,u,v))){
      car.speed=0;return;
    }
  }
  Object.assign(car,{x,z,heading});
}
