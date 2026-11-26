// Existing compressed HQ1 coordinates; founder reports fenced lot with vehicle opening.
// Dimensions and gate placement are illustrative until a georeferenced survey is available.
export const javanLot=Object.freeze({minX:-24,maxX:-11.7,minZ:94,maxZ:116,gateMinZ:99.5,gateMaxZ:108.5,spawnX:-18.5,spawnZ:104,spawnHeading:-Math.PI/2});
export function fitsJavanAccess(x,z,heading){
  const {minX,maxX,minZ,maxZ,gateMinZ,gateMaxZ}=javanLot;
  // Sample the oriented footprint including edge interiors across the concave driveway.
  const c=Math.cos(heading),s=Math.sin(heading);
  for(let u=0;u<=4;u++)for(let v=0;v<=10;v++){
    const side=-.92+1.84*u/4,end=-2.05+4.1*v/10;
    const px=x+side*c+end*s,pz=z-side*s+end*c;
    const road=Math.abs(px)<=5.95&&pz>=-258&&pz<=117;
    const lot=px>=minX+.12&&px<=maxX&&pz>=minZ+.12&&pz<=maxZ-.12;
    const gate=px>=maxX-.25&&px<=-5.95&&pz>=gateMinZ+.12&&pz<=gateMaxZ-.12;
    // Fence spans on the frontage, except the open gate.
    const fence=Math.abs(px-maxX)<.12&&(pz<gateMinZ+.12||pz>gateMaxZ-.12);
    if(fence||!(road||lot||gate))return false;
  }
  return true;
}
