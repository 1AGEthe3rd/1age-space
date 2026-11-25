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
  // Four corners must fit the boulevard, including when reversing at full lock.
  for(const side of [-.92,.92]) for(const end of [-2.05,2.05]) {
    const cornerX=x+side*Math.cos(heading)+end*Math.sin(heading);
    const cornerZ=z-side*Math.sin(heading)+end*Math.cos(heading);
    if(Math.abs(cornerX)>5.95 || cornerZ < -258 || cornerZ > 117) {
      car.speed=0;
      return;
    }
  }
  if(parked && Math.hypot(x-parked.x,z-parked.z)<4.6){
    // Separating axes of both oriented vehicle footprints.
    const axes=h=>[[Math.cos(h),-Math.sin(h)],[Math.sin(h),Math.cos(h)]];
    const a=axes(heading),b=axes(parked.heading);
    const span=(basis,u,v)=>.92*Math.abs(basis[0][0]*u+basis[0][1]*v)+2.05*Math.abs(basis[1][0]*u+basis[1][1]*v);
    if([...a,...b].every(([u,v])=>Math.abs((x-parked.x)*u+(z-parked.z)*v)<span(a,u,v)+span(b,u,v))){
      car.speed=0;return;
    }
  }
  Object.assign(car,{x,z,heading});
}
