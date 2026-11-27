// Conservative candidate review, not title, occupancy authorization or issuance.
import {isReservedVirtual} from '../space/reserved-virtual.mjs';
import {isAvailable} from '../space/catalog.mjs';
export function ownershipCandidate(p,now=new Date()){
 if(!p||isReservedVirtual(p))return false;
 if(!p.physical||!Array.isArray(p.physical.sourceIds)||!isAvailable(p,now))return false;
 // Availability for rent is not proof of emptiness; an explicit approved verification is required.
 if(p.physical.vacancyVerified!==true)return false;
 return p.virtual?.status==='available'&&p.virtual?.spaceIds?.length===0;
}
