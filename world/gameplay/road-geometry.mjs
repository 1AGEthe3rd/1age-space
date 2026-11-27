// Local city geometry is supplied by the adapter. No Portland coordinates here.
export function vehicleFootprint(x,z,heading,contains){
  const c=Math.cos(heading),s=Math.sin(heading);
  for(let u=0;u<=4;u++)for(let v=0;v<=10;v++){
    const side=-.92+1.84*u/4,end=-2.05+4.1*v/10;
    if(!contains(x+side*c+end*s,z-side*s+end*c))return false;
  }
  return true;
}
export function segmentDistance(x,z,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;
  const t=len?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/len)):0;
  return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
}
export function roadContains(segments,x,z){
  return segments.some(({a,b,width})=>segmentDistance(x,z,a,b)<=Math.max(0,width/2-.25));
}
export function occupiedVehicle(car,x,z,padding=.22){
  const c=Math.cos(car.heading),s=Math.sin(car.heading),dx=x-car.x,dz=z-car.z;
  return Math.abs(dx*c-dz*s)<.92+padding&&Math.abs(dx*s+dz*c)<2.05+padding;
}
