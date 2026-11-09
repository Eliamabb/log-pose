export function valid(data){
 if(!data||!['Personnel','Professionnel'].includes(data.space)||!Array.isArray(data.tasks)||!Array.isArray(data.projects))return false;
 if(data.tasks.length>20000||data.projects.length>2000)return false;
 const ids=new Set();
 for(const p of data.projects){if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!['Personnel','Professionnel'].includes(p.space))return false;ids.add(p.id)}
 for(const p of data.projects){if(p.parent&&!data.projects.some(x=>x.id===p.parent&&!x.parent&&x.space===p.space))return false}
 const tids=new Set();
 return data.tasks.every(t=>{if(!t||typeof t!=='object'||tids.has(t.id))return false;tids.add(t.id);return typeof t.id==='string'&&typeof t.title==='string'&&t.title.trim()&&(!t.description||typeof t.description==='string')&&['Basse','Moyenne','Haute'].includes(t.priority)&&[0,1,2].includes(t.status)&&['Personnel','Professionnel'].includes(t.space)&&(!t.project||data.projects.some(p=>p.id===t.project&&p.space===t.space))});
}
