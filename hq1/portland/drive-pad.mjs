const icons={
  enter:'M5 11h11m-5-5 5 5-5 5 M18 3h3v18h-3',
  exit:'M19 12H7m5-5-5 5 5 5 M4 3H2v18h2',
  camera:'M3 7h4l2-3h6l2 3h4v13H3z M12 10a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  gear:'M6 4v16m0-16h12v16 M6 12h12 M14 4l4-3 4 3',
  lights:'M11 6C5 6 3 9 3 12s2 6 8 6V6z M15 7h6m-6 5h6m-6 5h6',
  left:'M20 12H4m7-7-7 7 7 7',
  right:'M4 12h16m-7-7 7 7-7 7',
  gas:'M8 3h8l2 18H6L8 3z M10 7h4m-4 4h4m-4 4h4',
  brake:'M4 7h16v11H4z M7 10h10m-10 4h10',
  play:'M8 4l12 8-12 8z'
};
function icon(button,name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');
  path.setAttribute('d',icons[name]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');
  svg.append(path);button.replaceChildren(svg);
}
export function createDrivePad(activate,toggle){
  const panel=document.createElement('section');
  panel.className='hq1-drive-pad';panel.setAttribute('role','group');panel.setAttribute('aria-label','1AGE driving gamepad');panel.hidden=true;
  const controls=document.createElement('div');controls.className='hq1-drive-actions';controls.hidden=true;
  const pedalsRow=document.createElement('div');pedalsRow.className='hq1-drive-pedals';pedalsRow.hidden=true;
  const pedals={gas:0,brake:0};
  function button(name,label,fn,host){
    const el=document.createElement('button');el.type='button';el.setAttribute('aria-label',label);icon(el,name);
    el.onclick=()=>{fn();el.blur();};host.append(el);return el;
  }
  const action=button('enter','Enter vehicle',activate,panel);
  const camera=button('camera','Change camera',()=>toggle('KeyV'),controls);
  const gear=button('gear','Toggle forward or reverse',()=>toggle('KeyR'),controls);
  const lights=button('lights','Headlights',()=>toggle('KeyH'),controls);
  const left=button('left','Left indicator',()=>toggle('KeyQ'),controls);
  const right=button('right','Right indicator',()=>toggle('KeyC'),controls);
  for(const [name,label] of [['brake','Brake pedal'],['gas','Accelerator pedal']]){
    const el=button(name,label,()=>{},pedalsRow);
    let owner=null;
    el.onpointerdown=e=>{if(e.button!==0||owner!==null)return;e.preventDefault();e.stopPropagation();owner=e.pointerId;el.setPointerCapture(e.pointerId);pedals[name]=1;};
    const release=e=>{if(e&&owner!==e.pointerId)return;owner=null;pedals[name]=0;};
    el.onpointerup=el.onpointercancel=el.onlostpointercapture=release;
    el.onkeydown=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();pedals[name]=1;}};
    el.onkeyup=e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();pedals[name]=0;}};
    el.addEventListener('blur',()=>release());
  }
  panel.append(controls,pedalsRow);document.body.append(panel);
  function reset(){pedals.gas=pedals.brake=0;}
  for(const event of ['blur','pagehide','orientationchange','gamepaddisconnected'])addEventListener(event,reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  let last='';
  function render(driving,near,car,view){
    const state=driving?'exit':near==='game'?'play':'enter';
    if(last!==state){icon(action,state);action.setAttribute('aria-label',driving?'Exit vehicle':near==='game'?'Play arcade':'Enter vehicle');last=state;}
    document.body.classList.toggle('hq1-driving',driving);
    panel.hidden=!(driving||near);controls.hidden=pedalsRow.hidden=!driving;
    action.disabled=driving&&Math.abs(car.speed)>.15;gear.disabled=action.disabled;
    if(!driving)reset();
    gear.setAttribute('aria-pressed',String(car.reverse));lights.setAttribute('aria-pressed',String(car.lights));
    left.setAttribute('aria-pressed',String(car.signal===-1));right.setAttribute('aria-pressed',String(car.signal===1));
    camera.setAttribute('aria-label','Change camera; current '+view);
  }
  return {pedals,render,reset};
}
