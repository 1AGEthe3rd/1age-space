// Virtual passenger travel, not a real flight schedule or ticketing service.
export const airports=Object.freeze({
  pdx:{code:'PDX',name:'Portland International Airport',city:'Portland',hq:'../hq1/'},
  dca:{code:'DCA',name:'Ronald Reagan Washington National Airport',city:'Washington, D.C.',hq:'../hq2/'}
});
export const phases=Object.freeze([
  {name:'Taxi',duration:12,altitude:0},
  {name:'Takeoff',duration:10,altitude:220},
  {name:'Cruise',duration:35,altitude:550},
  {name:'Descent',duration:15,altitude:0},
  {name:'Arrival',duration:8,altitude:0}
]);
export const flightDuration=phases.reduce((sum,p)=>sum+p.duration,0);
export function createJourney(origin){
  if(!Object.hasOwn(airports,origin))throw new RangeError('Unknown airport');
  const destination=origin==='pdx'?'dca':'pdx';
  let status='terminal',elapsed=0;
  return {
    origin,destination, get status(){return status},get elapsed(){return elapsed},
    get progress(){return elapsed/flightDuration},
    board(){if(status!=='terminal')return false;status='boarded';return true;},
    depart(){if(status!=='boarded')return false;status='flying';return true;},
    tick(dt){if(status!=='flying'||!Number.isFinite(dt)||dt<=0)return;elapsed=Math.min(flightDuration,elapsed+dt);if(elapsed===flightDuration)status='arrived';},
    sample(){
      let start=0,previous=0;
      for(const phase of phases){
        if(elapsed<start+phase.duration){
          const t=Math.max(0,Math.min(1,(elapsed-start)/phase.duration));
          return {name:phase.name,altitude:previous+(phase.altitude-previous)*t,t};
        }
        start+=phase.duration;previous=phase.altitude;
      }
      return {name:'Arrived',altitude:0,t:1};
    }
  };
}
