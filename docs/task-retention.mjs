export const RETENTION_MS=7*24*60*60*1000;
export function isTaskArchived(task,now=Date.now()){
 return task.status===2&&typeof task.date==='number'&&Number.isFinite(task.date)&&task.date>0&&now-task.date>=RETENTION_MS;
}
export function uniqueCompletions(events){
 const first=new Map();
 for(const event of events.filter(event=>event.action==='completed')){
  const key=event.taskId||event.id,previous=first.get(key);
  if(!previous||(typeof event.timestamp==='number'&&(typeof previous.timestamp!=='number'||event.timestamp<previous.timestamp)))first.set(key,event);
 }
 return [...first.values()];
}
