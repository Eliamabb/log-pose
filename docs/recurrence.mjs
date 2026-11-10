import {dateKey,parseDay} from './calendar-data.mjs?v=20261110-9';
const frequencies=new Set(['daily','weekly','monthly']);
export function seriesKeys(tasks){
 const byId=new Map(tasks.map(task=>[task.id,task]));
 const parents=new Map();
 for(const task of tasks)if(task.nextTaskId&&byId.has(task.nextTaskId))parents.set(task.nextTaskId,task.id);
 const keys=new Map();
 for(const task of tasks){
  let node=task;const seen=new Set();
  while(!node.seriesId&&parents.has(node.id)&&!seen.has(node.id)){
   seen.add(node.id);node=byId.get(parents.get(node.id));
  }
  keys.set(task.id,node.seriesId||node.id);
 }
 return keys;
}
export function withSeriesIds(tasks){
 const keys=seriesKeys(tasks);
 return tasks.map(task=>frequencies.has(task.recurrence)||task.seriesId?{...task,seriesId:keys.get(task.id)}:{...task});
}
export function advanceOccurrence(value,frequency,anchor){
 const date=parseDay(value);
 if(!date||!frequencies.has(frequency))return null;
 if(frequency==='monthly'){
  const month=date.getMonth()+1,year=date.getFullYear();
  const last=new Date(year,month+1,0,12).getDate();
  return dateKey(new Date(year,month,Math.min(anchor||date.getDate(),last),12));
 }
 date.setDate(date.getDate()+(frequency==='weekly'?7:1));return dateKey(date);
}
function firstVisibleOccurrence(value,from,frequency,anchor){
 if(value>=from)return value;
 const date=parseDay(value),target=parseDay(from);
 if(frequency==='monthly'){
  const difference=(target.getFullYear()-date.getFullYear())*12+target.getMonth()-date.getMonth();
  const month=date.getMonth()+difference,year=date.getFullYear();
  const last=new Date(year,month+1,0,12).getDate();
  const candidate=dateKey(new Date(year,month,Math.min(anchor,last),12));
  return candidate<from?advanceOccurrence(candidate,frequency,anchor):candidate;
 }
 const distance=(Date.UTC(target.getFullYear(),target.getMonth(),target.getDate())-Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()))/86400000;
 const step=frequency==='weekly'?7:1;
 date.setDate(date.getDate()+Math.ceil(distance/step)*step);
 return dateKey(date);
}
export function projectOccurrences(tasks,start,end,skips=[]){
 const from=dateKey(start),until=dateKey(end),keys=seriesKeys(tasks),groups=new Map(),result=[...tasks];
 for(const task of tasks){
  const key=keys.get(task.id);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(task);
 }
 const skipped=new Set(skips.map(item=>item.seriesId+'|'+item.date));
 for(const [seriesId,members] of groups){
  const pending=members.filter(task=>task.status!==2&&parseDay(task.dueDate))
   .sort((a,b)=>(a.recurrenceSourceDate||a.dueDate).localeCompare(b.recurrenceSourceDate||b.dueDate));
  const source=pending.find(task=>!task.recurrenceSourceDate)||pending[0];
  if(!source||!frequencies.has(source.recurrence))continue;
  const base=source.recurrenceSourceDate||source.dueDate;
  const anchor=source.recurrenceDay||parseDay(base).getDate();
  const represented=new Set(members.map(task=>task.recurrenceSourceDate||task.dueDate));
  let date=advanceOccurrence(base,source.recurrence,anchor);
  if(date)date=firstVisibleOccurrence(date,from,source.recurrence,anchor);
  while(date&&date<=until&&(!source.recurrenceEndDate||date<=source.recurrenceEndDate)){
   if(date>=from&&!represented.has(date)&&!skipped.has(seriesId+'|'+date)){
    const {nextTaskId,date:completedDate,recurrenceSourceDate,...template}=source;
    result.push({...template,id:'preview:'+seriesId+':'+date,dueDate:date,status:0,date:null,seriesId,recurrenceDay:anchor,startTime:source.seriesStartTime??source.startTime,endTime:source.seriesEndTime??source.endTime,
     _virtual:true,_sourceTaskId:source.id,_occurrenceDate:date});
   }
   date=advanceOccurrence(date,source.recurrence,anchor);
  }
 }
 return result;
}
export function materializeOccurrence(data,task){
 if(!task._virtual)return {...data,tasks:data.tasks.map(item=>item.id===task.id?task:item)};
 const tasks=withSeriesIds(data.tasks);
 const source=tasks.find(item=>item.id===task._sourceTaskId);
 if(!source)throw Error('La tâche source a changé. Rechargez le calendrier.');
 const seriesId=source.seriesId||source.id;
 const exists=tasks.find(item=>item.seriesId===seriesId&&(item.recurrenceSourceDate||item.dueDate)===task._occurrenceDate);
 if(exists)throw Error('Cette occurrence existe déjà. Rechargez le calendrier.');
 const {_virtual,_sourceTaskId,_occurrenceDate,nextTaskId,...saved}=task;
 return {...data,tasks:[...tasks,{...saved,id:crypto.randomUUID(),seriesId,recurrenceSourceDate:_occurrenceDate,seriesStartTime:source.seriesStartTime??source.startTime??'',seriesEndTime:source.seriesEndTime??source.endTime??''}]};
}
export function removeOccurrence(data,task){
 if(!task._virtual)return {...data,tasks:data.tasks.filter(item=>item.id!==task.id)};
 const tasks=withSeriesIds(data.tasks),source=tasks.find(item=>item.id===task._sourceTaskId);
 if(!source)throw Error('La série a changé. Rouvrez le calendrier.');
 const seriesId=source.seriesId||source.id,date=task._occurrenceDate;
 if(tasks.some(item=>item.seriesId===seriesId&&(item.recurrenceSourceDate||item.dueDate)===date))throw Error('Cette occurrence a changé. Rouvrez le calendrier.');
 const skips=[...(data.recurrenceSkips||[])];
 if(!skips.some(item=>item.seriesId===seriesId&&item.date===date))skips.push({seriesId,date,projectId:source.project||''});
 return {...data,tasks,recurrenceSkips:skips};
}
