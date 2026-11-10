import {materializeOccurrence} from './recurrence.mjs?v=20261110-5';
import {Calendar} from './calendar.js?v=20261110-5';
import {validSchedule} from './calendar-data.mjs?v=20261110-5';
import {recordChanges,archiveProject,deleteProject,isArchived,completions,normalize,recurrenceLabels} from './activity.mjs?v=20261110-5';
import {TaskStatistics} from './statistics.js?v=20261110-5';
import {useCloud} from './sync.js?v=20261110-5';
import {React as R,DOM} from './react.js';import {draw} from './sea.js';import {profile,move,status,priorities,grades,restore,save,empty} from './model.mjs';
const h=R.createElement,S=R.useState,spaces=['Personnel','Professionnel'],uid=()=>crypto.randomUUID();
const paths={calendar:'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2',compass:'M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z M12 5v7l-6 0 M12 12l6 0-6 7Z',board:'M3 5h18v14H3z M9 5v14 M15 5v14',stats:'M3 20h18 M6 16v-5 M12 16V4 M18 16V8',folder:'M2 7V5h7l2 3h11v12H2z',plus:'M12 5v14 M5 12h14',anchor:'M12 8v13 M9 5a3 3 0 1 0 6 0 3 3 0 1 0-6 0 M3 13q0 7 9 8 9-1 9-8 M3 16v-3h3 M18 13h3v3',person:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0 M4 21q0-8 8-8t8 8',case:'M3 7h18v13H3z M8 7V4h8v3 M3 12q9 4 18 0',circle:'M12 3a9 9 0 1 0 .01 0',clock:'M12 3a9 9 0 1 0 .01 0 M12 7v5l4 2',check:'M12 3a9 9 0 1 0 .01 0 M8 12l3 3 5-6',edit:'m4 16 12-12 4 4L8 20H4z',layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5'};
function icon(name,size=18){return h('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true},h('path',{d:paths[name]}))}
function btn(label,action,cls='',ico){return h('button',{onClick:action,className:cls,type:'button'},ico&&icon(ico),label)}
function sel(v,change,opts,label){return h('select',{value:v,onChange:e=>change(e.target.value),'aria-label':label},opts.map(([v,t])=>h('option',{key:v,value:v},t)))}
function Sea(){let ref=R.useRef(null);R.useEffect(()=>draw(ref.current),[]);return h('canvas',{ref,className:'sea','aria-hidden':true})}
function App(){const [db,set]=S(empty),[tab,T]=S(0),[filter,F]=S(''),[modal,M]=S(null),[notice,N]=S('');const timer=R.useRef(),dialog=R.useRef();R.useEffect(()=>{if(modal&&!dialog.current.open)dialog.current.showModal()},[modal]);const cloud=useCloud(set);
async function commit(next){
 next=recordChanges(db,next);
 if(cloud.locked)return false;
 const a=profile(db.tasks),b=profile(next.tasks);
 if(await cloud.persist(next)){
  if(b.level>a.level){N('Niveau '+b.level+' atteint ! 🎉 · '+b.grade);clearTimeout(timer.current);timer.current=setTimeout(()=>N(''),3600)}
  return true;
 }
 return false;
}
const p=profile(db.tasks),projects=db.projects.filter(x=>tab===2||x.space===db.space),tasks=db.tasks.filter(x=>(tab===2||x.space===db.space)&&(tab!==0||!isArchived(x.project,db.projects))),roots=projects.filter(x=>!x.parent&&(tab!==0||!isArchived(x.id,db.projects))),belongs=(t,id)=>t.project===id||projects.some(x=>x.id===t.project&&x.parent===id),visible=tasks.filter(t=>!filter||belongs(t,filter)),projectName=id=>projects.find(x=>x.id===id)?.name,selected=projects.find(x=>x.id===filter),parent=selected?.parent||filter;
async function toggleArchive(project){
 try{
  if(await commit(archiveProject(db,project.id,!project.archived))){F('');M(null)}
 }catch(error){window.alert(error.message)}
}
async function removeProject(project){
 const next=deleteProject(db,project.id);
 const projectsRemoved=db.projects.length-next.projects.length;
 const tasksRemoved=db.tasks.length-next.tasks.length;
 const activitiesRemoved=normalize(db).activities.length-next.activities.length;
 const confirmed=window.confirm('Supprimer définitivement « '+project.name+' » ? Cela supprimera '+projectsRemoved+' projet(s) ou sous-projet(s), '+tasksRemoved+' tâche(s) et '+activitiesRemoved+' entrée(s) du journal. Les statistiques et l’XP seront recalculées. Exportez une sauvegarde si vous souhaitez pouvoir les restaurer.');
 if(confirmed&&await commit(next)){F('');M(null)}
}
function archiveView(){
 const archived=projects.filter(project=>project.archived&&!projects.find(parent=>parent.id===project.parent)?.archived);
 return h('section',{className:'archives'},h('h2',null,'Projets archivés'),
  archived.length?archived.map(project=>h('div',{className:'archiverow',key:project.id},
   btn(project.name,()=>openProject(project),'plain','folder'),
   btn('Restaurer',()=>toggleArchive(project),'outline'))):h('p',null,'Les projets archivés apparaîtront ici.'));
}
function activityView(){
 const events=normalize(db).activities.filter(event=>event.space===db.space).slice().sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
 const labels={completed:'Tâche terminée',reopened:'Tâche rouverte',deleted:'Tâche supprimée',archived:'Projet archivé',restored:'Projet restauré'};
 return h('section',{className:'activityjournal'},h('h2',null,'Journal d’activité'),
  h('p',null,'Les réalisations restent consultables après réouverture ou suppression.'),
  events.length?h('ol',null,events.slice(0,200).map(event=>h('li',{key:event.id},
   h('div',null,h('strong',null,labels[event.action]),h('time',null,event.timestamp?new Date(event.timestamp).toLocaleString('fr-FR'):'Date inconnue')),
   h('p',null,event.title),
   h('small',null,[event.rootProjectName,event.projectName!==event.rootProjectName?event.projectName:''].filter(Boolean).join(' › ')),
   event.legacy&&h('p',{className:'periodnote'},'Réalisation récupérée lors de la migration')))):
  h('p',null,'Aucune activité pour le moment.'),
  events.length>200&&h('p',null,'Les 200 dernières activités sont affichées. L’export JSON conserve le journal complet.'));
}
function openProject(project){F(project.id);M({kind:'tree',id:project.id,name:project.name})}
function openRpg(){M({kind:'rpg'})}
function rpgDetails(){
 const totalXP=db.tasks.reduce((sum,task)=>sum+(task.status===2?priorities[task.priority]:0),0);
 return h('div',{className:'rpgdetails'},
  h('p',null,'Niveau '+p.level+' / 50 · '+totalXP.toLocaleString('fr-FR')+' XP cumulés'),
  h('ol',{className:'gradelist'},grades.map((grade,index)=>{
   const first=index===10?50:index*5+1,last=index===10?50:index===9?49:first+4;
   const threshold=(first-1)*first*50;
   const current=p.level>=first&&p.level<=last,unlocked=p.level>=first;
   return h('li',{key:grade,className:current?'current':unlocked?'unlocked':'locked','aria-current':current?'step':undefined},
    h('span',{className:'gradebadge'},unlocked?'✓':'◇'),
    h('div',null,h('strong',null,grade),h('p',null,'Niveau'+(first===last?' '+first:'x '+first+' à '+last)+' · '+threshold.toLocaleString('fr-FR')+' XP cumulés'),
     current&&h('div',null,h('span',{className:'gradestate'},'Grade actuel'),
      index<10&&h('div',{className:'gradeprogress'},h('p',null,'Progression vers le prochain grade'),
       meter(totalXP-threshold,((last+1)*last*50)-threshold),
       h('p',null,(((last+1)*last*50)-totalXP).toLocaleString('fr-FR')+' XP restants')),
      index===10&&h('p',null,'Grade ultime atteint')),

     !unlocked&&h('p',null,(threshold-totalXP).toLocaleString('fr-FR')+' XP pour atteindre ce grade'))
   );
  }))
 );
}
function projectTasks(project){
 const list=tasks.filter(task=>belongs(task,project.id));
 return h('section',{className:'projecttasks'},
  h('h3',null,'Tâches de '+project.name+' ('+list.length+')'),
  project.parent?null:h('p',null,'Tâches du projet et de ses sous-projets'),
  list.length?status.map((label,index)=>{
   const group=list.filter(task=>task.status===index);
   if(!group.length)return null;
   return h('section',{className:'projecttaskgroup',key:label},
    h('h4',null,label+' · '+group.length),
    group.map(task=>h('button',{type:'button',className:'projecttask',key:task.id,onClick:()=>M({...task,kind:'detail'})},
     h('strong',null,task.title),
     h('span',null,task.priority+' · '+(projectName(task.project)||'Tâche indépendante')),
     task.description&&h('p',null,task.description)))
   );
  }):h('p',{className:'projecttaskempty'},'Aucune tâche dans ce projet pour le moment.')
 );
}
function projectTree(){
 const root=projects.find(project=>project.id===modal.id);
 if(!root)return h('p',null,'Projet introuvable');
 const children=projects.filter(project=>project.parent===root.id);
 const node=(project,isChild)=>{
  const list=tasks.filter(task=>isChild?task.project===project.id:belongs(task,project.id));
  const done=list.filter(task=>task.status===2).length;
  return h('div',{className:'treenode',key:project.id},
   btn(project.name,()=>openProject(project),'plain','folder'),
   h('span',null,done+' / '+list.length+' tâches terminées'),
   meter(done,list.length));
 };
 return h('div',{className:'projecttree'},node(root,false),
  h('div',{className:'treechildren'},children.map(project=>node(project,true))),
  !root.parent&&!children.length&&h('p',null,'Aucun sous-projet pour le moment.'),projectTasks(root),
  h('div',{className:'actions'},btn('Voir les tâches du projet',()=>{F(root.id);M(null)},'primary'),!isArchived(root.id,db.projects)&&!root.parent&&btn('Créer un sous-projet',()=>formProject(root.id),'outline','plus'),
   btn(root.archived?'Restaurer le projet':'Archiver le projet',()=>toggleArchive(root),'outline'),
   btn(root.parent?'Supprimer le sous-projet':'Supprimer le projet',()=>removeProject(root),'danger'))
 );
}
function projectStatistics(){
 const chosen=projects.find(project=>project.id===filter);
 if(chosen?.parent){
  const root=projects.find(project=>project.id===chosen.parent);
  return h('section',{className:'statgroup'},root&&statsRow(root,true),h('div',{className:'statschildren'},statsRow(chosen,true)));
 }
 return roots.filter(root=>!filter||root.id===filter).map(root=>
  h('section',{className:'statgroup',key:root.id},statsRow(root,true),
   h('div',{className:'statschildren'},projects.filter(project=>project.parent===root.id).map(project=>statsRow(project,true)))));
}
function taskDetails(task){
 const linked=db.projects.find(project=>project.id===task.project);
 const mainProject=linked?.parent?db.projects.find(project=>project.id===linked.parent):linked;
 const fields=[
  ['Priorité',task.priority],
  ['Statut',status[task.status]],
  ['Espace',task.space],
  ['Projet',mainProject?.name||'Aucun projet'],
  ['Sous-projet',linked?.parent?linked.name:'Aucun sous-projet'],
  ['Récurrence',recurrenceLabels[task.recurrence||'none']],
  ['Date prévue',task.dueDate?new Date(task.dueDate+'T12:00:00').toLocaleDateString('fr-FR'):'Non définie'],
  ['Créneau horaire',task.startTime&&task.endTime?task.startTime+' – '+task.endTime:'Sans horaire'],
  ['Fin de la récurrence',task.recurrenceEndDate?new Date(task.recurrenceEndDate+'T12:00:00').toLocaleDateString('fr-FR'):'Sans date de fin']
 ];
 return h('div',{className:'taskdetails'},
  h('h3',{className:'detailtitle'},task.title),
  task._virtual&&h('p',{className:'periodnote'},'Occurrence prévue de la série. Vous pouvez la déplacer depuis le calendrier, ou modifier la série avec le bouton ci-dessous.'),
  h('dl',{className:'detailfields'},fields.map(([label,value])=>h('div',{key:label},h('dt',null,label),h('dd',null,value)))),
  h('h4',null,'Description'),
  h('p',{className:'description'},task.description?.trim()?task.description:'Aucune description')
 );
}
function formTask(t){M({kind:'task',title:'',description:'',space:db.projects.find(project=>project.id===filter)?.space||db.space,project:filter,priority:'Moyenne',recurrence:'none',dueDate:'',recurrenceEndDate:'',startTime:'',endTime:'',...t})}
function formProject(parent='',existing){M({kind:'project',name:'',space:db.projects.find(project=>project.id===parent)?.space||db.space,parent,...existing})}
function update(key,v){M({...modal,[key]:v,...(key==='space'?{project:''}:{})})}
async function submit(e){e.preventDefault();let {kind,...obj}=modal;let field=kind==='task'?'title':'name';obj[field]=obj[field].trim();if(!obj[field])return;if(kind==='task'){
 if(!validSchedule(obj)){window.alert('Choisissez une date et les deux heures, avec une heure de fin après le début le même jour.');return}

 if(obj.recurrence&&obj.recurrence!=='none'&&!obj.dueDate){window.alert('Choisissez la date de la première occurrence.');return}
 if(obj.recurrence!=='none'&&obj.recurrenceEndDate&&obj.dueDate>obj.recurrenceEndDate){window.alert('La fin de récurrence doit être égale ou postérieure à la date prévue.');return}
 if(obj.recurrence==='none')obj.recurrenceEndDate='';
 const previous=db.tasks.find(task=>task.id===obj.id);
 if(obj.dueDate!==previous?.dueDate)obj.recurrenceDay=obj.dueDate?Number(obj.dueDate.slice(-2)):null;
}
 let key=kind==='task'?'tasks':'projects';let list=obj.id?db[key].map(x=>x.id===obj.id?obj:x):[...db[key],{...obj,id:uid(),...(kind==='task'?{status:0,date:null}:{})}];if(await commit({...db,[key]:list}))M(null)}
function meter(v,max){return h('progress',{value:v,max:max||1,'aria-label':'Progression'})}
function statsRow(x,clickable=false){const list=tasks.filter(t=>belongs(t,x.id)),done=list.filter(t=>t.status===2).length;return h(clickable?'button':'div',{className:'statrow'+(clickable?' projectstat':''),key:x.id,...(clickable?{type:'button',onClick:()=>openProject(x)}:{})},h('strong',null,x.name),h('span',null,list.length?done+' / '+list.length+' · '+Math.round(100*done/list.length)+' %':'Aucune tâche'),meter(done,list.length))}
const pic=['circle','clock','check'];const nav=['Tableau de bord','Calendrier','Statistiques','Journal','Archives'];
return h(R.Fragment,null,h('header',null,h('div',{className:'head'},h('b',{className:'brand'},icon('compass',30),'Log Pose'),h('nav',null,nav.map((v,i)=>btn(v,()=>{T(i);F('');M(null)},tab===i?'active':'',['board','calendar','stats','clock','folder'][i]))),h('div',{className:'avatar',title:'Profil personnel'},'EA'))),
h('main',null,cloud.panel(db),h('fieldset',{disabled:cloud.locked,className:'workspace'},h('div',{className:'intro'},h('div',null,h('small',null,'CARNET DE NAVIGATION'),h('h1',null,nav[tab])),tab!==1&&tab!==2&&h('div',{className:'switch'},spaces.map((v,i)=>btn(v,()=>{commit({...db,space:v});F('')},db.space===v?'chosen':'',i?'case':'person')))),
h('section',{className:'hero clickable',role:'button',tabIndex:0,'aria-label':'Voir ma progression RPG',onClick:openRpg,onKeyDown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openRpg()}}},h(Sea),h('div',{className:'badge'},icon('anchor',42)),h('div',{className:'profile'},h('small',null,'PROFIL RPG'),h('h2',null,p.grade),h('div',{className:'level'},h('b',null,'Niveau '+p.level),' · '+p.title),h('div',{className:'xp'},h('span',null,'Expérience'),h('b',null,p.level===50?'Niveau maximum':p.xp+' / '+p.level*100+' XP')),meter(p.level===50?1:p.xp,p.level===50?1:p.level*100)) ),
tab===1?h(Calendar,{
 tasks:db.tasks.filter(task=>!isArchived(task.project,db.projects)),
 recurrenceSkips:db.recurrenceSkips||[],
 onOpen:task=>M({...task,kind:'detail'}),
 onReschedule:task=>commit(materializeOccurrence(db,task))
}):tab===3?activityView():tab===4?archiveView():tab===0?h(R.Fragment,null,h('div',{className:'sectiontitle'},h('h2',null,'Mes projets ',h('em',null,roots.length)),btn('Créer un projet',()=>formProject(),'outline','plus')),h('div',{className:'projects'},roots.length?roots.map(x=>h('div',{className:'project '+(parent===x.id?'selected':''),key:x.id,onClick:e=>{if(!e.target.closest('button'))openProject(x)}},btn(x.name,()=>openProject(x),'plain','folder'),btn('Renommer',()=>formProject('',x),'mini'),statsRow({...x,name:''}))):h('div',{className:'emptyproject'},h('i',null,icon('folder',29)),h('div',null,h('strong',null,'Aucun projet pour le moment'),h('p',null,'Créez un projet pour regrouper vos tâches.')))),
parent&&h('div',{className:'subs'},btn(projectName(parent),()=>openProject(projects.find(x=>x.id===parent))),projects.filter(x=>x.parent===parent).map(x=>btn(x.name,()=>openProject(x),filter===x.id?'chosen':'')),btn('Sous-projet',()=>formProject(parent),'','plus'),selected?.parent&&btn('Renommer',()=>formProject(parent,selected))),
h('div',{className:'sectiontitle boardtitle'},h('h2',null,'Tableau Kanban'),h('div',{className:'actions'},sel(filter,F,[['','Toutes les tâches'],...projects.filter(x=>!isArchived(x.id,db.projects)).map(x=>[x.id,(x.parent?'↳ ':'')+x.name])],'Filtrer par projet'),btn('Nouvelle tâche',()=>formTask(),'primary','plus'))),
h('div',{className:'kanban'},status.map((name,i)=>{const list=visible.filter(t=>t.status===i);return h('section',{className:'column c'+i,key:name,onDragOver:e=>e.preventDefault(),onDrop:e=>{e.preventDefault();commit({...db,tasks:move(db.tasks,e.dataTransfer.getData('text/plain'),i)})}},h('h3',null,icon(pic[i]),name,h('em',null,list.length)),list.length?list.map(t=>h('article',{key:t.id,draggable:true,className:'taskcard',onClick:e=>{
 if(!e.target.closest('button,select,option'))M({...t,kind:'detail'});
},onDragStart:e=>e.dataTransfer.setData('text/plain',t.id)},btn(t.title,()=>M({...t,kind:'detail'}),'tasktitle'),h('p',null,projectName(t.project)),t.dueDate&&h('p',{className:'scheduledtag'},new Date(t.dueDate+'T12:00:00').toLocaleDateString('fr-FR')+(t.startTime?' · '+t.startTime+'–'+t.endTime:'')),t.recurrence&&t.recurrence!=='none'&&h('p',{className:'recurrencetag'},'↻ '+recurrenceLabels[t.recurrence]+(t.dueDate?' · '+new Date(t.dueDate+'T12:00:00').toLocaleDateString('fr-FR'):'')),h('div',{className:'taskmeta'},h('label',null,t.priority),sel(t.status,v=>commit({...db,tasks:move(db.tasks,t.id,+v)}),status.map((s,i)=>[i,s]),'Statut de '+t.title)))):h('div',{className:'void'},icon(pic[i],25),h('p',null,['Aucune tâche à faire','Aucune tâche en cours','Aucune tâche terminée'][i]),i===0&&btn('Ajouter une tâche',()=>formTask(),'link','plus'))) }))) :
h('section',{className:'analytics'},h('div',{className:'sectiontitle'},h('h2',null,'Avancée des projets'),sel(filter,F,[['','Tous les projets'],...projects.map(x=>[x.id,x.name+' · '+x.space])],'Périmètre')),h('div',{className:'metrics'},[[(visible.length?Math.round(100*visible.filter(t=>t.status===2).length/visible.length):0)+' %','Taux de complétion'],[visible.length,'Tâches au total']].map(([n,l])=>h('section',null,h('b',null,n),h('p',null,l)))),h(TaskStatistics,{tasks:completions(db,undefined,filter),projects,globalTasks:completions(db,undefined,filter),globalProjects:db.projects}),h('h3',null,'Répartition par statut'),status.map((s,i)=>{let n=visible.filter(t=>t.status===i).length;return h('div',{className:'statrow'},s,h('span',null,n),meter(n,visible.length))}),h('h3',null,'Projets et sous-projets'),projectStatistics(),!projects.length&&h('p',null,'Aucun projet pour le moment.'))),
),modal&&h('dialog',{ref:dialog,'aria-label':modal.kind==='rpg'?'Progression RPG':modal.kind==='tree'?'Projet et tâches':modal.kind==='detail'?'Détail de la tâche':'Formulaire',onCancel:()=>M(null)},h('div',{className:'sectiontitle'},h('h2',null,modal.kind==='rpg'?'Progression RPG':modal.kind==='tree'?'Projet et tâches':modal.kind==='detail'?'Détail de la tâche':modal.id?'Modifier '+(modal.kind==='task'?'la tâche':'le projet'):modal.kind==='task'?'Nouvelle tâche':modal.parent?'Nouveau sous-projet':'Nouveau projet'),btn('Fermer',()=>M(null),'mini')),modal.kind==='rpg'?rpgDetails():modal.kind==='tree'?projectTree():modal.kind==='detail'?h('div',null,taskDetails(modal),modal._virtual?h('div',{className:'actions'},btn('Modifier la série',()=>{const source=db.tasks.find(task=>task.id===modal._sourceTaskId);if(source)formTask(source);else{M(null);N('La série a changé. Rouvrez le calendrier.')}},'primary')):!isArchived(modal.project,db.projects)&&h('div',{className:'actions'},btn('Modifier',()=>formTask({...modal,kind:'task'}),'primary'),btn('Supprimer',async()=>{if(await commit({...db,tasks:db.tasks.filter(t=>t.id!==modal.id)}))M(null)}))):h('form',{onSubmit:submit},h('label',null,modal.kind==='task'?'Titre':'Nom',h('input',{autoFocus:true,required:true,value:modal.title??modal.name,onChange:e=>update(modal.kind==='task'?'title':'name',e.target.value)})),modal.kind==='task'&&h(R.Fragment,null,h('label',null,'Description',h('textarea',{rows:4,value:modal.description,onChange:e=>update('description',e.target.value)})),h('label',null,'Date prévue',h('input',{type:'date',value:modal.dueDate||'',onChange:event=>update('dueDate',event.target.value)})),
 h('div',{className:'tasktimefields'},h('label',null,'De',h('input',{type:'time',value:modal.startTime||'',onChange:event=>update('startTime',event.target.value)})),h('label',null,'À',h('input',{type:'time',value:modal.endTime||'',onChange:event=>update('endTime',event.target.value)}))),
 h('label',null,'Récurrence',sel(modal.recurrence||'none',v=>update('recurrence',v),Object.entries(recurrenceLabels),'Récurrence')),

 modal.recurrence&&modal.recurrence!=='none'&&h('label',null,'Fin de récurrence (facultative, date incluse)',h('input',{type:'date',min:modal.dueDate||undefined,value:modal.recurrenceEndDate||'',onChange:event=>update('recurrenceEndDate',event.target.value)})),
 [['Priorité','priority',Object.keys(priorities).map(s=>[s,s])],['Espace','space',spaces.map(s=>[s,s])],['Projet ou sous-projet','project',[['','Tâche indépendante'],...db.projects.filter(x=>x.space===modal.space&&!isArchived(x.id,db.projects)).map(x=>[x.id,(x.parent?(db.projects.find(y=>y.id===x.parent)?.name+' › '):'')+x.name])]]].map(([l,k,opts])=>h('label',null,l,sel(modal[k],v=>update(k,v),opts,l)))),h('button',{className:'primary'},'Enregistrer'))),notice&&h('aside',{role:'status'},notice))}
DOM.createRoot(document.querySelector('#root')).render(h(App));
