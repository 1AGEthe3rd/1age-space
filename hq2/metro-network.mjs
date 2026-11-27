// Public WMATA station order; compressed fictional service, not live transit guidance.
export const GREEN=Object.freeze(["L'Enfant Plaza",'Waterfront','Navy Yard–Ballpark','Anacostia','Congress Heights','Southern Avenue','Naylor Road','Suitland','Branch Avenue']);
export const YELLOW=Object.freeze(["L'Enfant Plaza",'Pentagon','Pentagon City','Crystal City','Ronald Reagan Washington National Airport']);
export const AIRPORT_STOP=YELLOW[YELLOW.length-1];
export const TRANSFER=GREEN[0];
export const lines=Object.freeze({green:GREEN,yellow:YELLOW});
export function lineStops(line){return lines[line]||GREEN;}
export function otherLine(line,stop){return stop===TRANSFER?(line==='yellow'?'green':'yellow'):null;}
export function exitDestination(line,stop){
 if(line==='yellow'&&stop===AIRPORT_STOP)return 'airport';
 if(line==='green'&&stop==='Navy Yard–Ballpark')return 'navy-yard-half-street';
 if(line==='green'&&stop==='Anacostia')return 'anacostia-metro';
 return null;
}
export const airportUrl='../hq1/?airport=dca';
export const airportMetroUrl='../hq2/?destination=dca-metro';
