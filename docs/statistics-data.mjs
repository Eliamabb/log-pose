export function startOfWeek(value){
 const date=new Date(value);date.setHours(0,0,0,0);
 date.setDate(date.getDate()-((date.getDay()+6)%7));
 return date;
}
function datedCompletions(tasks,now){
 return tasks.filter(task=>task.status===2&&typeof task.date==='number'&&Number.isFinite(task.date)&&task.date>0&&task.date<=now.getTime());
}
export function completionMetrics(tasks,now=new Date()){
 const day=new Date(now);day.setHours(0,0,0,0);
 const week=startOfWeek(now),month=new Date(now.getFullYear(),now.getMonth(),1);
 const dated=datedCompletions(tasks,now);
 const since=start=>dated.filter(task=>task.date>=start.getTime()).length;
 return {day:since(day),week:since(week),month:since(month),
  undated:tasks.filter(task=>task.status===2&&!(typeof task.date==='number'&&Number.isFinite(task.date)&&task.date>0)).length};
}
export function weeklyCompletions(tasks,now=new Date(),count=12){
 const current=startOfWeek(now),dated=datedCompletions(tasks,now);
 return Array.from({length:count},(_,index)=>{
  const start=new Date(current);start.setDate(start.getDate()-7*(count-1-index));
  const end=new Date(start);end.setDate(end.getDate()+7);
  return {start,end,count:dated.filter(task=>task.date>=start.getTime()&&task.date<end.getTime()).length};
 });
}
export function completedGroups(tasks,projects,mode='projects'){
 const map=new Map(projects.map(project=>[project.id,project])),groups=new Map();
 for(const task of tasks.filter(task=>task.status===2)){
  const linked=map.get(task.project)||(task.historicalProjectName?{id:task.project,name:task.historicalProjectName,parent:task.historicalRootId!==task.project?task.historicalRootId:''}:null);
  const parent=linked?.parent?(map.get(linked.parent)||{id:linked.parent,name:task.historicalRootName}):null;
  const group=mode==='projects'?(parent||linked):linked;
  const key=group?.id||'independent';
  const label=!group?'Sans projet':mode==='subprojects'&&parent?parent.name+' › '+group.name:mode==='subprojects'?group.name+' (tâches directes)':group.name;
  if(!groups.has(key))groups.set(key,{id:key,label,count:0});
  groups.get(key).count++;
 }
 return [...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'fr'));
}
