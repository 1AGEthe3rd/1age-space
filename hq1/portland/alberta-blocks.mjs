// Compressed scene distances keep the existing venue doors and return poses fixed.
export const albertaBlocks=[
  {id:'webster',label:'NE WEBSTER ST',z:-6,halfWidth:3},
  {id:'sumner',label:'NE SUMNER ST',z:-24,halfWidth:3},
  {id:'roselawn',label:'NE ROSELAWN ST',z:-43,halfWidth:3},
  {id:'emerson',label:'NE EMERSON ST',z:-57.4,halfWidth:3}
];

export function eastSidewalkRuns(){
  const runs=[];
  let end=7.5;
  for(const {z,halfWidth} of albertaBlocks){
    const start=z+halfWidth;
    runs.push([(start+end)/2,end-start]);
    end=z-halfWidth;
  }
  if(end>-61)runs.push([(-61+end)/2,end+61]);
  return runs;
}

export function buildAlbertaBlocks({box,sign,scene,material}){
  const road=material('asphalt','#494b48',12,4);
  const paving=material('paving','#c6bfb0',9,2);
  for(const {label,z,halfWidth} of albertaBlocks){
    box(21,.018,z,30,.035,2*halfWidth,road);
    for(const side of [-1,1]){
      const edge=z+side*halfWidth;
      box(24,.04,edge+side*.62,24,.08,1.24,paving);
      box(24,.078,edge+side*.07,24,.12,.14,'#b0a89b');
      box(10.9,.092,edge+side*.40,1.2,.018,.63,'#bd9866');
    }
    box(10.55,.046,z-1.55,.18,.01,2.7,'#e0dccf');
    box(10.7,1.66,z+3.65,.11,3.32,.11,'#58665d');
    for(const side of [-1,1]){
      const blade=sign(label,scene,10.7,3.3,z+3.65+side*.055,2.7,{background:'#305e45'});
      blade.rotation.y=side>0?0:Math.PI;
    }
    const mlk=sign('NE MLK JR BLVD',scene,10.7,2.98,z+3.65,2.55,{background:'#305e45'});
    mlk.rotation.y=Math.PI/2;
  }
}
