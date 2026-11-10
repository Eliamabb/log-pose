export function valid(data){
 if(!data||!['Personnel','Professionnel'].includes(data.space)||!Array.isArray(data.tasks)||!Array.isArray(data.projects))return false;
 if(data.tasks.length>20000||data.projects.length>2000)return false;
 if(data.activityVersion!==undefined&&data.activityVersion!==1)return false;
 if(data.activities!==undefined){
  if(!Array.isArray(data.activities))return false;
  const eventIds=new Set();
  for(const event of data.activities){
   if(!event||typeof event.id!=='string'||eventIds.has(event.id)||!['completed','reopened','deleted','archived','restored'].includes(event.action)||typeof event.title!=='string'||!['Personnel','Professionnel'].includes(event.space))return false;
   if(event.timestamp!==null&&!(typeof event.timestamp==='number'&&Number.isFinite(event.timestamp)&&event.timestamp>0))return false;
   for(const key of ['projectId','projectName','rootProjectId','rootProjectName'])if(typeof event[key]!=='string')return false;
   eventIds.add(event.id);
  }
 }
 const ids=new Set();
 for(const p of data.projects){if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!['Personnel','Professionnel'].includes(p.space))return false;if(p.archived!==undefined&&typeof p.archived!=='boolean')return false;ids.add(p.id)}
 for(const p of data.projects){if(p.parent&&!data.projects.some(x=>x.id===p.parent&&!x.parent&&x.space===p.space))return false}
 const tids=new Set();
 return data.tasks.every(t=>{if(!t||typeof t!=='object'||tids.has(t.id))return false;tids.add(t.id);
 if(t.recurrence!==undefined&&!['none','daily','weekly','monthly'].includes(t.recurrence))return false;
 if(t.recurrenceDay!=null&&(!Number.isInteger(t.recurrenceDay)||t.recurrenceDay<1||t.recurrenceDay>31))return false;
 if(t.dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(t.dueDate)||new Date(t.dueDate+'T12:00:00').getDate()!==Number(t.dueDate.slice(-2))))return false;
 if(t.recurrenceEndDate){
  if(typeof t.recurrenceEndDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.recurrenceEndDate)||new Date(t.recurrenceEndDate+'T12:00:00').getDate()!==Number(t.recurrenceEndDate.slice(-2)))return false;
  if(t.dueDate&&t.recurrenceEndDate<t.dueDate)return false;
 }
 return typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim()&&(!t.description||typeof t.description==='string')&&['Basse','Moyenne','Haute'].includes(t.priority)&&[0,1,2].includes(t.status)&&['Personnel','Professionnel'].includes(t.space)&&(!t.project||data.projects.some(p=>p.id===t.project&&p.space===t.space))});
}
