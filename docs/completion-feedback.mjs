let context;
export function prepareCompletionSound(){
 try{
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
  if(!Audio)return null;
  if(!context||context.state==='closed')context=new Audio();
  if(context.state==='suspended')context.resume().catch(()=>{});
  return context;
 }catch{return null}
}
export async function playCompletionSound(audio){
 if(!audio)return;
 try{
  if(audio.state==='suspended')await audio.resume();
  if(audio.state!=='running')return;
  const start=audio.currentTime;
  [523.25,659.25,783.99].forEach((frequency,index)=>{
   const oscillator=audio.createOscillator(),gain=audio.createGain(),time=start+index*.085;
   oscillator.type='sine';oscillator.frequency.value=frequency;
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.065,time+.015);gain.gain.exponentialRampToValueAtTime(.001,time+.24);
   oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(time);oscillator.stop(time+.26);
  });
 }catch{/* Un navigateur sans audio ne doit pas bloquer la sauvegarde. */}
}
export function focusRpgProfile(element){
 const frame=globalThis.requestAnimationFrame||((callback)=>callback());
 frame(()=>{
  if(!element)return;
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView?.({behavior:reduced?'instant':'smooth',block:'center'});
 });
}
