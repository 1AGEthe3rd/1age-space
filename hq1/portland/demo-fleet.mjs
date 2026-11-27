import {javanLot} from './javan-lot.mjs';
// Stable demo IDs, not real inventory/VINs, ownership records or purchasable goods.
// The same conservative collision envelope is retained for all original procedural models.
export const demoFleet=Object.freeze([
  {id:'hq1-javan-demo-001',style:'touring',reference:'HiAce-inspired touring van',color:'#6d777e',x:javanLot.spawnX,z:javanLot.spawnZ,heading:javanLot.spawnHeading},
  {id:'hq1-javan-demo-002',style:'highroof',reference:'Delica-inspired adventure van',color:'#536d57',x:javanLot.spawnX,z:100.7,heading:javanLot.spawnHeading},
  {id:'hq1-javan-demo-003',style:'compact',reference:'TownAce-inspired compact camper',color:'#9a655d',x:javanLot.spawnX,z:107.3,heading:javanLot.spawnHeading}
].map(record=>Object.freeze({...record,venueId:'hq1-javan-imports',rightHandDrive:true,availability:'virtual-demo',salesEnabled:false,rentalsEnabled:false})));

export function doorPoint(car,side=1){
  const c=Math.cos(car.heading),s=Math.sin(car.heading);
  return {x:car.x+side*1.35*c-.85*s,z:car.z-side*1.35*s-.85*c};
}
export function nearestAccessibleVehicle(fleet,x,z,clear=()=>true){
  let selected=null,best=Infinity;
  for(const item of fleet){
    const car=item.car;
    const distance=Math.hypot(x-car.x,z-car.z);
    if(distance>=3.5)continue;
    // Keep entry local to the car and reject interactions through scene walls/fences.
    for(const side of [1,-1]){
      const door=doorPoint(car,side),d=Math.hypot(x-door.x,z-door.z);
      if(d>3.6||distance>=best)continue;
      let accessible=true;
      const others=fleet.filter(other=>other!==item);
      for(let i=1;i<=8;i++){
        const px=x+(door.x-x)*i/8,pz=z+(door.z-z)*i/8;
        if(!clear(px,pz)||!vehicleWalkable(others,px,pz)){accessible=false;break;}
      }
      if(accessible){selected=item;best=distance;break;}
    }
  }
  return selected;
}
export function vehicleWalkable(fleet,x,z,padding=.22){
  return !fleet.some(({car})=>{
    const c=Math.cos(car.heading),s=Math.sin(car.heading),dx=x-car.x,dz=z-car.z;
    return Math.abs(dx*c-dz*s)<.92+padding&&Math.abs(dx*s+dz*c)<2.05+padding;
  });
}
