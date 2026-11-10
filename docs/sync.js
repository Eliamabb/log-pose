import {normalize} from './activity.mjs?v=20261110-5';
import {Login} from './login.js';
import {React as R} from './react.js';
import {empty,restore} from './model.mjs';
import {getServices,message} from './firebase.js';
import {saveSnapshot,decode,encode} from './store.mjs?v=20261110-5';
const h=R.createElement;
function exportData(data){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='log-pose-sauvegarde.json';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function useCloud(setData){
 const [state,setState]=R.useState({phase:'loading',email:'',local:false});
 const current=R.useRef({generation:0,revision:0,busy:false,pending:null,user:null,unsubscribe:null});
 const local=R.useRef(null);
 function listen(services,user){
  const session=current.current;
  session.unsubscribe?.();
  session.buffered=null;session.generation++;session.user=user;session.revision=0;session.pending=null;session.busy=false;
  setData(empty());
  if(!user){setState({phase:'signin'});return}
  try{local.current=restore(localStorage)}catch{local.current=null}
  const generation=session.generation;
  const reference=services.storeSdk.doc(services.db,'users',user.uid,'state','main');
  session.reference=reference;
  setState({phase:'loading',email:user.email});
  session.unsubscribe=services.storeSdk.onSnapshot(reference,{includeMetadataChanges:true},snapshot=>{
   if(generation!==session.generation||snapshot.metadata.hasPendingWrites)return;
   if(session.busy||session.pending){if(!snapshot.metadata.fromCache)session.buffered=snapshot;return;}
   try{
    if(snapshot.metadata.fromCache){setState(s=>({...s,phase:'loading',message:'Connexion à Firebase…'}));return}
    const saved=decode(snapshot.exists()?snapshot.data():null);
    session.revision=saved.revision;setData(saved.data||empty());
    setState({phase:'ready',email:user.email,local:!!(local.current?.tasks.length||local.current?.projects.length)});
   }catch(error){setState(s=>({...s,phase:'loaderror',message:message(error)}))}
  },error=>{if(generation===session.generation)setState(s=>({...s,phase:'loaderror',message:message(error)}))});
 }
 R.useEffect(()=>{
  let stopped=false,unsubscribe;
  getServices().then(services=>{
   if(stopped)return;
   unsubscribe=services.authSdk.onAuthStateChanged(services.auth,user=>listen(services,user));
  }).catch(error=>{if(!stopped)setState({phase:'loaderror',message:message(error)})});
  return()=>{stopped=true;unsubscribe?.();current.current.generation++;current.current.unsubscribe?.()};
 },[]);
 async function persist(data,retry=false){
  if(data)data=normalize(data);
  const session=current.current;
  if(session.busy||!session.user)return false;
  try{encode(data)}catch(error){window.alert(message(error));return false}
  const pending=retry?session.pending:{data,revision:session.revision,id:crypto.randomUUID()};
  if(!pending)return false;
  session.pending=pending;session.busy=true;
  const generation=session.generation;
  const reference=session.reference;
  setState(s=>({...s,phase:'saving',message:''}));
  try{
   const services=await getServices();
   if(generation!==session.generation)return false;
   const revision=await saveSnapshot(services.storeSdk,services.db,reference,pending.data,pending.revision,pending.id);
   if(generation!==session.generation)return false;
   session.revision=revision;session.pending=null;setData(pending.data);
   setState(s=>({...s,phase:'ready',message:''}));
   return true;
  }catch(error){
   if(generation===session.generation)setState(s=>({...s,phase:error.code==='conflict'?'conflict':'saveerror',message:message(error)}));
   return false;
  }finally{
   if(generation===session.generation){
    session.busy=false;
    if(!session.pending&&session.buffered){
     try{
      const snapshot=session.buffered;
      const latest=decode(snapshot.exists()?snapshot.data():null);
      if(latest.revision>session.revision){session.revision=latest.revision;setData(latest.data||empty())}
     }catch(error){setState(s=>({...s,phase:'loaderror',message:message(error)}))}
     session.buffered=null;
    }
   }
  }
 }
 async function reload(){
  const session=current.current;
  if(session.pending&&!window.confirm('Abandonner la modification en attente et recharger le compte ? Exportez-la pour la conserver.'))return;
  try{
   const services=await getServices();
   if(services.auth.currentUser)listen(services,services.auth.currentUser);
   else window.location.reload();
  }catch(error){setState(s=>({...s,phase:'loaderror',message:message(error)}))}
 }
 async function migrate(data){
  const legacy=normalize(local.current);
  const combined={...data,projects:[...data.projects],tasks:[...data.tasks],activities:[...(data.activities||[])]};
  const eventIds=new Set(combined.activities.map(event=>event.id));
  for(const event of legacy.activities)if(!eventIds.has(event.id))combined.activities.push(event);
  for(const key of ['projects','tasks']){
   const ids=new Set(combined[key].map(item=>item.id));
   for(const item of local.current[key])if(!ids.has(item.id))combined[key].push(item);
  }
  if(await persist(combined)){localStorage.removeItem('logpose-v1');local.current=null;setState(s=>({...s,local:false}))}
 }
 async function logout(){
  if(current.current.pending&&!window.confirm('Se déconnecter et abandonner la modification en attente ? Exportez-la pour la conserver.'))return;
  try{const {auth,authSdk}=await getServices();await authSdk.signOut(auth)}
  catch(error){window.alert(message(error))}
 }
 const locked=state.phase!=='ready';
 function panel(data){
  return h('section',{className:'cloudpanel','aria-live':'polite'},
   h('span',null,({loading:'Connexion à Firebase…',signin:'Connectez-vous pour retrouver vos projets.',ready:'✓ Synchronisé avec votre compte',saving:'Enregistrement…',loaderror:'Chargement impossible',saveerror:'Sauvegarde en attente',conflict:'Modifications concurrentes détectées'})[state.phase]),
   state.email&&h('small',null,state.email),
   state.message&&h('p',null,state.message),
   state.phase==='signin'&&h(Login),
   state.phase==='saveerror'&&h('button',{onClick:()=>persist(current.current.pending?.data,true)},'Réessayer'),
   ['loaderror','conflict','ready'].includes(state.phase)&&h('button',{onClick:reload},'Actualiser'),
   current.current.pending&&h('button',{onClick:()=>exportData(current.current.pending.data)},'Exporter la modification en attente'),
   state.local&&h('div',{className:'migration'},h('span',null,'Des projets sont présents dans ce navigateur.'),
    h('button',{disabled:locked,onClick:()=>migrate(data)},'Transférer mes projets'),
    h('button',{onClick:()=>exportData(local.current)},'Exporter la sauvegarde locale')),
   state.email&&h('button',{disabled:state.phase==='saving',onClick:logout},'Se déconnecter'),
   state.phase==='ready'&&h('button',{onClick:()=>exportData(data)},'Exporter mes données'),
   state.phase==='ready'&&h('label',{className:'importlabel'},'Importer une sauvegarde',
    h('input',{type:'file',accept:'.json,application/json',onChange:async event=>{
     const file=event.target.files[0];event.target.value='';if(!file)return;
     try{
      if(file.size>800000)throw Error('Fichier supérieur à 800 Ko.');
      const imported=JSON.parse(await file.text());encode(imported);
      if(window.confirm('Remplacer les données du compte par '+imported.projects.length+' projets et '+imported.tasks.length+' tâches ? Exportez les données actuelles pour les conserver.'))await persist(imported);
     }catch(error){window.alert(message(error))}
    }})));
 }
 return {panel,persist,locked};
}
