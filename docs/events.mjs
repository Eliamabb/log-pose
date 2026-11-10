import {validSchedule,clock} from './calendar-data.mjs?v=20261110-9';
export function eventRecord(input){
 const result={id:input.id||crypto.randomUUID(),title:(input.title||'').trim(),description:input.description||'',space:'Personnel',dueDate:input.dueDate||'',startTime:input.startTime||'',endTime:input.endTime||'',status:input.status??0};
 if(!result.title||!validSchedule(result)||![0,1,2].includes(result.status))throw Error('Saisissez un titre et un créneau valide, avec la fin après le début le même jour.');
 return result;
}
export function upsertEvent(data,input){
 const record=eventRecord(input),events=data.events||[];
 if(input.id&&!events.some(event=>event.id===input.id))throw Error('Cet événement n’est plus disponible.');
 return {...data,events:events.some(event=>event.id===record.id)?events.map(event=>event.id===record.id?record:event):[...events,record]};
}
export function deleteEvent(data,id){return {...data,events:(data.events||[]).filter(event=>event.id!==id)}}
export function calendarEvents(data){return (data.events||[]).map(event=>({...event,id:'event:'+event.id,_event:true,_eventId:event.id,space:'Personnel'}))}
export function calendarDraft(date,slot){
 return {dueDate:date||'',startTime:Number.isInteger(slot)?clock(slot):'',endTime:Number.isInteger(slot)?clock(Math.min(slot+60,1439)):''};
}
