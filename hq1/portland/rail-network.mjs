// 1AGE World Portland — named stations for the compressed passenger rail prototype.
// Source: https://trimet.org/home/route/190/ and https://www.trimet.org/home/route/90/
export const stops=['Overlook Park','N Prescott St','N Killingsworth St','Rosa Parks','N Lombard TC','Kenton/N Denver Ave','Delta Park/Vanport','Expo Center'];
export const airportYellowStops=['Interstate/Rose Quarter','Albina/Mississippi',...stops];
export const redStops=['Rose Quarter TC','Convention Center','NE 7th Ave','Lloyd Center/NE 11th Ave','Hollywood/NE 42nd Ave','NE 60th Ave','NE 82nd Ave','Gateway/NE 99th Ave TC','Parkrose/Sumner TC','Cascades','Mt Hood Ave','Portland International Airport'];

export function stationId(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
}
export function platformConnection(line,name,aboard=false,riding=false){
  if(aboard||riding)return null;
  if(line==='red'){
    if(name===redStops[0])return ['?rail=yellow&station='+stationId(airportYellowStops[0]),'Transfer to Yellow Line'];
    if(name===redStops[redStops.length-1])return ['?airport=pdx','Enter PDX'];
  }else if(line==='yellow'&&name===airportYellowStops[0]){
    return ['?rail=red&station='+stationId(redStops[0]),'Transfer to Red Line'];
  }
  return null;
}
