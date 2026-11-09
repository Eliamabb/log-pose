import {React as R} from './react.js';
import {getServices,message} from './firebase.js';
const h=R.createElement;
export function Login(){
 const [email,setEmail]=R.useState(''),[password,setPassword]=R.useState(''),[notice,setNotice]=R.useState(''),[busy,setBusy]=R.useState(false);
 async function submit(event){
  event.preventDefault();setBusy(true);setNotice('');
  try{const {auth,authSdk}=await getServices();await authSdk.signInWithEmailAndPassword(auth,email.trim(),password);setPassword('')}
  catch(error){setNotice(message(error))}finally{setBusy(false)}
 }
 async function reset(){
  if(!email.trim()){setNotice('Saisissez votre adresse e-mail.');return}
  setBusy(true);
  try{const {auth,authSdk}=await getServices();await authSdk.sendPasswordResetEmail(auth,email.trim());setNotice('Si ce compte existe, vous recevrez un e-mail de réinitialisation.')}
  catch(error){setNotice(message(error))}finally{setBusy(false)}
 }
 return h('form',{onSubmit:submit,className:'loginform'},
  h('h2',null,'Connexion à Log Pose'),
  h('label',null,'Adresse e-mail',h('input',{type:'email',autoComplete:'username',required:true,value:email,onChange:event=>setEmail(event.target.value)})),
  h('label',null,'Mot de passe',h('input',{type:'password',autoComplete:'current-password',required:true,value:password,onChange:event=>setPassword(event.target.value)})),
  notice&&h('p',{role:'status'},notice),
  h('button',{type:'submit',disabled:busy,className:'primary'},busy?'Connexion…':'Se connecter'),
  h('button',{type:'button',disabled:busy,onClick:reset},'Mot de passe oublié'));
}
