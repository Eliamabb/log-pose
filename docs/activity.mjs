export const recurrenceLabels={none:'Aucune',daily:'Tous les jours',weekly:'Toutes les semaines',monthly:'Tous les mois'};
const uuid=()=>crypto.randomUUID();
export function isArchived(projectId,projects){
 const project=projects.find(item=>item.id===projectId);
 return !!(project?.archived||projects.find(item=>item.id===project?.parent)?.archived);
}
export function snapshot(task,projects){
 const linked=projects.find(project=>project.id===task.project);
 const root=projects.find(project=>project.id===linked?.parent)||linked;
 return {taskId:task.id,title:task.title,description:task.description||'',priority:task.priority,space:task.space,
  projectId:linked?.id||'',projectName:linked?.name||'',rootProjectId:root?.id||'',rootProjectName:root?.name||''};
}
export function normalize(data){
 if(data.activityVersion===1&&Array.isArray(data.activities))return data;
 const activities=[...(data.activities||[])];
 for(const task of data.tasks.filter(item=>item.status===2)){
  const id='legacy-'+task.id;
  if(!activities.some(event=>event.id===id))activities.push({id,action:'completed',timestamp:typeof task.date==='number'&&task.date>0?task.date:null,legacy:true,...snapshot(task,data.projects)});
 }
 return {...data,activityVersion:1,activities};
}
export function nextDue(task,now=new Date()){
 const value=task.dueDate;
 let date=value?new Date(value+'T12:00:00'):new Date(now);
 date.setHours(12,0,0,0);
 const anchor=task.recurrenceDay||date.getDate();
 const today=new Date(now);today.setHours(12,0,0,0);
 do{
  if(task.recurrence==='monthly'){
   const year=date.getFullYear(),month=date.getMonth()+1;
   const last=new Date(year,month+1,0).getDate();
   date=new Date(year,month,Math.min(anchor,last),12);
  }else date.setDate(date.getDate()+(task.recurrence==='weekly'?7:1));
 }while(date<=today);
 const formatted=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 if(task.recurrenceEndDate&&formatted>task.recurrenceEndDate)return null;
 return {dueDate:formatted,recurrenceDay:anchor};
}
export function recordChanges(before,next,now=Date.now()){
 const original=normalize(before);
 const removedProjects=new Set(before.projects.filter(project=>!next.projects.some(item=>item.id===project.id)).map(project=>project.id));
 const activities=[...(next.activityVersion===1?next.activities:original.activities)]
  .filter(event=>!removedProjects.has(event.projectId)&&!removedProjects.has(event.rootProjectId));
 let tasks=next.tasks.map(task=>({...task}));
 const byId=new Map(before.tasks.map(task=>[task.id,task]));
 for(const task of tasks){
  const old=byId.get(task.id);
  if(task.status===2&&old?.status!==2){
   task.date=now;
   activities.push({id:uuid(),action:'completed',timestamp:now,...snapshot(task,next.projects)});
   const schedule=['daily','weekly','monthly'].includes(task.recurrence)&&!task.nextTaskId?nextDue(task,new Date(now)):null;
   if(schedule){
    const nextId=uuid();
    task.nextTaskId=nextId;
    const {nextTaskId,date,...template}=task;
    tasks.push({...template,id:nextId,status:0,date:null,...schedule});
   }
  }else if(old?.status===2&&task.status!==2){
   activities.push({id:uuid(),action:'reopened',timestamp:now,...snapshot(old,before.projects)});
  }
 }
 const ids=new Set(next.tasks.map(task=>task.id));
 for(const task of before.tasks)if(!ids.has(task.id)&&!removedProjects.has(task.project))activities.push({id:uuid(),action:'deleted',timestamp:now,...snapshot(task,before.projects)});
 return {...next,tasks,activities,activityVersion:1};
}
export function archiveProject(data,id,archived,now=Date.now()){
 const state=normalize(data),project=state.projects.find(item=>item.id===id);
 if(!project)throw Error('Projet introuvable.');
 const ids=new Set([id,...state.projects.filter(item=>item.parent===id).map(item=>item.id)]);
 const tasks=state.tasks.filter(task=>ids.has(task.project));
 if(archived&&(!tasks.length||tasks.some(task=>task.status!==2)))throw Error('Terminez toutes les tâches de ce projet et de ses sous-projets avant de l’archiver.');
 if(!!project.archived===archived)return state;
 return {...state,projects:state.projects.map(item=>item.id===id?{...item,archived}:item),
  activities:[...state.activities,{id:uuid(),action:archived?'archived':'restored',timestamp:now,space:project.space,title:project.name,projectId:id,projectName:project.name,rootProjectId:project.parent||id,rootProjectName:state.projects.find(item=>item.id===project.parent)?.name||project.name}]};
}
export function deleteProject(data,id){
 const state=normalize(data);
 if(!state.projects.some(project=>project.id===id))throw Error('Projet introuvable.');
 const removed=new Set([id,...state.projects.filter(project=>project.parent===id).map(project=>project.id)]);
 return {...state,
  projects:state.projects.filter(project=>!removed.has(project.id)),
  tasks:state.tasks.filter(task=>!removed.has(task.project)),
  activities:state.activities.filter(event=>!removed.has(event.projectId)&&!removed.has(event.rootProjectId))
 };
}
export function completions(data,space,filter=''){
 return normalize(data).activities.filter(event=>event.action==='completed'&&(!space||event.space===space)&&(!filter||event.projectId===filter||event.rootProjectId===filter))
  .map(event=>({id:event.id,status:2,date:event.timestamp,project:event.projectId,title:event.title,historicalProjectName:event.projectName,historicalRootId:event.rootProjectId,historicalRootName:event.rootProjectName}));
}
