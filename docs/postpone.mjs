import {withSeriesIds,materializeOccurrence} from './recurrence.mjs?v=20261113-1';
import {parseDay,dateKey} from './calendar-data.mjs?v=20261113-1';
function phase(from,date,frequency){
 const a=parseDay(from),b=parseDay(date);
 if(frequency==='monthly')return Math.max(0,(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth());
 const distance=(Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000;
 return Math.max(0,Math.round(distance/(frequency==='weekly'?7:1)));
}
function shifted(start,index,frequency){
 const date=parseDay(start);
 if(frequency==='monthly'){
  const month=date.getMonth()+index,year=date.getFullYear(),last=new Date(year,month+1,0,12).getDate();
  return dateKey(new Date(year,month,Math.min(date.getDate(),last),12));
 }
 date.setDate(date.getDate()+index*(frequency==='weekly'?7:1));return dateKey(date);
}
export function postponeTask(data,id,date){
 if(!parseDay(date))throw Error('Choisissez une date valide.');
 const tasks=withSeriesIds(data.tasks),task=tasks.find(item=>item.id===id);
 if(!task)throw Error('Tâche introuvable.');
 if(task.recurrenceEndDate&&date>task.recurrenceEndDate)throw Error('Cette date dépasse la fin de récurrence. Modifiez d’abord sa date de fin.');
 if(!['daily','weekly','monthly'].includes(task.recurrence)||!task.dueDate)return {...data,tasks:tasks.map(item=>item.id===id?{...item,dueDate:date}:item)};
 const seriesId=task.seriesId,from=task.recurrenceSourceDate||task.dueDate;
 if(from===date)return {...data,tasks};
 const mapped=tasks.map(item=>{
  const logical=item.recurrenceSourceDate||item.dueDate;
  if(item.seriesId!==seriesId||item.status===2||!logical||logical<from)return item;
  const dueDate=shifted(date,phase(from,logical,task.recurrence),task.recurrence);
  if(item.recurrenceEndDate&&dueDate>item.recurrenceEndDate)throw Error('Le report dépasserait la fin de récurrence pour une tâche déjà enregistrée. Prolongez d’abord cette date de fin.');
  const {recurrenceSourceDate,...rest}=item;
  return {...rest,dueDate,recurrenceDay:parseDay(date).getDate(),seriesRebased:date};
 });
 const recurrenceSkips=(data.recurrenceSkips||[]).map(item=>item.seriesId===seriesId&&item.date>=from?{...item,date:shifted(date,phase(from,item.date,task.recurrence),task.recurrence)}:item);
 const plan={seriesId,fromDate:from,startDate:date,anchorDay:parseDay(date).getDate(),projectId:task.project||''};
 return {...data,tasks:mapped,recurrenceSkips,seriesPlans:[...(data.seriesPlans||[]),plan]};
}

export function updateTaskSchedule(data,input){
 const {kind,...task}=input;
 const previous=data.tasks.find(item=>item.id===task.id);
 if(previous?.status===3&&['daily','weekly','monthly'].includes(previous.recurrence)&&task.dueDate&&task.dueDate!==previous.dueDate){
  const planned=postponeTask(data,task.id,task.dueDate);
  const {recurrenceSourceDate,recurrenceDay,seriesRebased,...editable}=task;
  return {...planned,tasks:planned.tasks.map(item=>item.id===task.id?{...item,...editable}:item)};
 }
 return materializeOccurrence(data,task);
}
