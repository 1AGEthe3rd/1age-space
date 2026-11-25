// Original single-player paddle cabinet. All graphics and game rules run locally.
export function playCabinet() {
  const dialog=document.createElement('dialog');
  dialog.className='cabinet';
  dialog.innerHTML='<h2>Orbit Rally</h2><canvas width="320" height="240" aria-label="Paddle rally game"></canvas><p></p><button type="button">Leave cabinet</button>';
  document.body.append(dialog);dialog.showModal();
  const canvas=dialog.querySelector('canvas'),ctx=canvas.getContext('2d'),status=dialog.querySelector('p');
  let paddle=160, x=160,y=90,vx=75,vy=83,score=0,lives=3,last=0,frame;
  const keys=new Set();
  function key(e){if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)){e.preventDefault();if(e.type==='keydown')keys.add(e.code);else keys.delete(e.code);}}
  function pointer(e){const r=canvas.getBoundingClientRect();paddle=(e.clientX-r.left)*320/r.width;}
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointer(e);};canvas.onpointermove=e=>{if(e.buttons)pointer(e);};
  addEventListener('keydown',key);addEventListener('keyup',key);
  const leave=()=>dialog.close();dialog.querySelector('button').onclick=leave;
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);removeEventListener('keydown',key);removeEventListener('keyup',key);dialog.remove();},{once:true});
  function tick(now){
    if(!dialog.open)return;
    const dt=Math.min(.04,(now-(last||now))/1000);last=now;
    const pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);
    const axis=pad?.axes[0]||0;
    paddle+=((keys.has('ArrowRight')||keys.has('KeyD'))-(keys.has('ArrowLeft')||keys.has('KeyA'))+(Math.abs(axis)>.15?axis:0))*215*dt;
    paddle=Math.max(27,Math.min(293,paddle));x+=vx*dt;y+=vy*dt;
    if((x<=5&&vx<0)||(x>=315&&vx>0))vx=-vx;
    if(y<=5&&vy<0)vy=-vy;
    if(y>=209&&y<220&&vy>0&&Math.abs(x-paddle)<=30){score++;vy=-Math.min(185,vy+6);vx=(x-paddle)*4.3;}
    if(y>245){lives--;x=160;y=80;vx=75;vy=83;}
    ctx.fillStyle='#10162b';ctx.fillRect(0,0,320,240);
    ctx.fillStyle='#45416c';for(let n=0;n<45;n++)ctx.fillRect((n*43)%319,(n*37)%239,2,2);
    ctx.fillStyle='#87eed0';ctx.fillRect(paddle-27,215,54,5);ctx.fillStyle='#ffc877';ctx.fillRect(x-4,y-4,8,8);
    status.textContent='Score '+score+' · '+lives+' lives';
    if(lives)frame=requestAnimationFrame(tick);else {status.textContent='Game over · Score '+score;const again=document.createElement('button');again.textContent='Play again';again.onclick=()=>{again.remove();score=0;lives=3;last=0;frame=requestAnimationFrame(tick);};dialog.append(again);}
  }
  frame=requestAnimationFrame(tick);
}
