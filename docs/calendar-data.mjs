export function dateKey(date){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
}
export function parseDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const date=new Date(value+'T12:00:00');
 return Number.isFinite(date.getTime())&&dateKey(date)===value?date:null;
}
export function minutes(value){
 if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return null;
 const [hour,minute]=value.split(':').map(Number);return hour*60+minute;
}
export function clock(value){
 return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
}
export function validSchedule(task){
 const date=task.dueDate||'',start=task.startTime||'',end=task.endTime||'';
 if(date&&!parseDay(date))return false;
 if(!start&&!end)return true;
 return !!date&&minutes(start)!==null&&minutes(end)!==null&&minutes(end)>minutes(start);
}
export function reschedule(task,date,startTime=task.startTime||'',endTime=task.endTime||''){
 const next={...task,dueDate:date,startTime,endTime};
 if(!validSchedule(next))throw Error('Choisissez une date et un créneau valide dont la fin est après le début, le même jour.');
 if(task.recurrenceEndDate&&date>task.recurrenceEndDate)throw Error('Cette date dépasse la fin de la récurrence. Modifiez d’abord sa date de fin.');
 if(date!==task.dueDate&&!task.recurrenceSourceDate&&!task._virtual)next.recurrenceDay=parseDay(date)?.getDate()||null;
 return next;
}
export function droppedTask(task,date,slot){
 if(slot===undefined)return reschedule(task,date);
 if(slot===null)return reschedule(task,date,'','');
 const start=minutes(task.startTime),end=minutes(task.endTime);
 const duration=start!==null&&end!==null?end-start:60;
 if(slot+duration>1439)throw Error('Le créneau dépasserait minuit. Choisissez une heure plus tôt ou modifiez sa durée.');
 return reschedule(task,date,clock(slot),clock(slot+duration));
}
export function weekDays(date){
 const start=new Date(date);start.setHours(12,0,0,0);
 start.setDate(start.getDate()-((start.getDay()+6)%7));
 return Array.from({length:7},(_,index)=>{const day=new Date(start);day.setDate(day.getDate()+index);return day});
}
export function monthDays(date){
 const start=weekDays(new Date(date.getFullYear(),date.getMonth(),1,12))[0];
 return Array.from({length:42},(_,index)=>{const day=new Date(start);day.setDate(day.getDate()+index);return day});
}
export function shiftPeriod(date,view,direction){
 if(view==='week'){const next=new Date(date);next.setDate(next.getDate()+direction*7);return next}
 return new Date(date.getFullYear(),date.getMonth()+direction,1,12);
}
export function layoutTimedTasks(tasks){
 const sorted=tasks.filter(task=>minutes(task.startTime)!==null&&minutes(task.endTime)!==null)
  .map(task=>({task,start:minutes(task.startTime),end:minutes(task.endTime)}))
  .sort((a,b)=>a.start-b.start||a.end-b.end||a.task.id.localeCompare(b.task.id));
 let group=[],groupEnd=0;const output=[];
 function flush(){
  const ends=[];
  for(const item of group){
   let column=ends.findIndex(end=>end<=item.start);
   if(column===-1)column=ends.length;
   ends[column]=item.end;item.column=column;
  }
  for(const item of group)output.push({...item,columns:ends.length});
  group=[];
 }
 for(const item of sorted){
  if(group.length&&item.start>=groupEnd){flush();groupEnd=0}
  group.push(item);groupEnd=Math.max(groupEnd,item.end);
 }
 if(group.length)flush();
 return output;
}
