// Original procedural sound; no downloads, autoplay, microphone, or recorded assets.
export function createDriveAudio(){
  let context=null,engine=null,harmonic=null,road=null,filter=null,master=null,roadGain=null,enabled=false;
  function init(){
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!Audio)return false;
    context=new Audio();
    master=context.createGain();master.gain.value=0;master.connect(context.destination);
    filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;filter.Q.value=.6;filter.connect(master);
    engine=context.createOscillator();engine.type='triangle';engine.frequency.value=37;engine.connect(filter);engine.start();
    harmonic=context.createOscillator();harmonic.type='sine';harmonic.frequency.value=74;
    const harmonicGain=context.createGain();harmonicGain.gain.value=.18;harmonic.connect(harmonicGain);harmonicGain.connect(filter);harmonic.start();
    const buffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
    const data=buffer.getChannelData(0);
    let smooth=0;for(let i=0;i<data.length;i++){smooth=.85*smooth+.15*(Math.random()*2-1);data[i]=smooth;}
    road=context.createBufferSource();road.buffer=buffer;road.loop=true;
    roadGain=context.createGain();roadGain.gain.value=0;
    const roadFilter=context.createBiquadFilter();roadFilter.type='lowpass';roadFilter.frequency.value=900;
    road.connect(roadFilter);roadFilter.connect(roadGain);roadGain.connect(master);road.start();
    return true;
  }
  function silence(){if(context&&master)master.gain.setTargetAtTime(0,context.currentTime,.035);}
  function toggle(){
    if(enabled){enabled=false;silence();return;}
    // Only invoked from an explicit user input. Unsupported or blocked audio remains off.
    try{
      if(!context&&!init())return;
      enabled=true;const pending=context.resume();
      pending?.catch(()=>{enabled=false;silence();});
    }catch{enabled=false;silence();}
  }
  function frame(active,speed,gas,wet,cockpit){
    if(!enabled||!active||!context||context.state!=='running'){silence();return;}
    const t=context.currentTime,v=Math.min(1,Math.abs(speed)/10.7),load=Math.max(0,Math.min(1,gas));
    const pitch=33+v*37+load*20;
    engine.frequency.setTargetAtTime(pitch,t,.09);harmonic.frequency.setTargetAtTime(pitch*2,t,.09);
    filter.frequency.setTargetAtTime(135+load*190+v*140,t,.12);
    roadGain.gain.setTargetAtTime(v*(wet?.55:.29),t,.12);
    master.gain.setTargetAtTime((cockpit?.045:.032)*(1+load*.4),t,.12);
  }
  function dispose(){enabled=false;silence();if(context&&context.state!=='closed')context.close().catch(()=>{});}
  return {toggle,frame,silence,dispose,get enabled(){return enabled;}};
}
