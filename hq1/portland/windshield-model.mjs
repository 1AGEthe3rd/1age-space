// Original windshield simulation in normalized windshield-width coordinates.
export const windshieldHeight=.44;
export const wiperPivots=Object.freeze([.28,.72]);
const minAngle=-2.76,maxAngle=-.57;
const bladeStart=.075,bladeEnd=.34;
export function wiperAngle(position){return minAngle+(maxAngle-minAngle)*position;}
export function nextWiperMode(mode){return (mode+1)%3;}
export function createWindshield(random=Math.random){
  const drops=[];
  let position=0,direction=1,spawn=0;
  function tick(dt,raining,mode,speed=0){
    dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
    const previous=position;
    if(mode===0){
      position=Math.max(0,position-dt*1.6);
      direction=1;
    }else{
      position+=direction*dt*(mode===2?2.4:1.25);
      if(position>=1){position=2-position;direction=-1;}
      if(position<=0){position=-position;direction=1;}
    }
    const a=wiperAngle(previous),b=wiperAngle(position);
    for(let i=drops.length-1;i>=0;i--){
      const d=drops[i];
      d.y+=dt*(.009+Math.abs(speed)*.0018)*d.size/.008;
      d.life-=dt*(raining?.035:.65);
      const wiped=position!==previous&&wiperPivots.some(px=>{
        const dx=d.x-px,dy=d.y-windshieldHeight;
        const radius=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
        return radius>=bladeStart-.015&&radius<=bladeEnd+.015&&angle>=Math.min(a,b)-.085&&angle<=Math.max(a,b)+.085;
      });
      if(wiped||d.y>windshieldHeight||d.life<=0)drops.splice(i,1);
    }
    if(raining){
      spawn+=dt*28;
      while(spawn>=1){
        spawn--;
        if(drops.length<100)drops.push({x:.018+random()*.964,y:.015+random()*(windshieldHeight-.03),size:.003+random()*.009,life:.65+random()*.35});
      }
    }else spawn=0;
    return {drops,position,angle:wiperAngle(position),bladeStart,bladeEnd};
  }
  return {tick,get drops(){return drops},get position(){return position}};
}
