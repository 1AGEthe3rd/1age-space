// End the drivable arms inside the walking boundary so a parked driver can exit.
export const crossings = {
  alberta: { z:13, halfWidth:5.4 },
  killingsworth: { z:-66, halfWidth:5 },
  church: { z:-87, halfWidth:3.7, minX:-5.95 },
  jessup: { z:-113.1, halfWidth:3.1, maxX:5.95 },
  jarrett: { z:-165, halfWidth:4 }
};
const roads = Object.values(crossings);
export function fitsRoad(x,z,heading) {
  const cos=Math.cos(heading), sin=Math.sin(heading);
  if (Math.abs(x)+.92*Math.abs(cos)+2.05*Math.abs(sin)<=5.95)
    return z-.92*Math.abs(sin)-2.05*Math.abs(cos)>=-258 && z+.92*Math.abs(sin)+2.05*Math.abs(cos)<=117;
  const road=roads.find(r=>Math.abs(z-r.z)<=r.halfWidth+2.25);
  if (!road) return false;
  for (const side of [-.92,.92]) for (const end of [-2.05,2.05]) {
    const px=x+side*cos+end*sin, pz=z-side*sin+end*cos;
    if (px<(road.minX??-31) || px>(road.maxX??31) || (Math.abs(px)>5.95 && Math.abs(pz-road.z)>road.halfWidth)) return false;
  }
  // A rotated body can clip a curb even when all four wheels are on asphalt.
  for (const edge of [-5.95,5.95]) for(const dz of [-road.halfWidth,road.halfWidth]){
    const dx=edge-x, offset=road.z+dz-z;
    if(Math.abs(dx*cos-offset*sin)<.92 && Math.abs(dx*sin+offset*cos)<2.05)return false;
  }
  return true;
}

export function signalPhases(seconds) {
  const t=seconds%36;
  return [t<15?'green':t<18?'amber':'red',t<20?'red':t<30?'green':t<33?'amber':'red'];
}
