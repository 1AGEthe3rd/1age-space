// Explicit virtual reservations. This is a client-side rule, not proof of physical ownership.
const reservedIds=new Set(['hq1','hq2','hq1-portland-sol-road','hq2-washington-anacostia','hq1-northleftchef','hq1-nnb-gym','property-hq1-5601-ne-mlk','vs-nlc-template']);
export function isReservedVirtual(record){
 if(!record)return false;
 return record.protection?.claimEligible===false||record.protection?.reserved===true||reservedIds.has(record.id)||reservedIds.has(record.propertyId)||record.virtual?.spaceIds?.some(id=>reservedIds.has(id))===true;
}
