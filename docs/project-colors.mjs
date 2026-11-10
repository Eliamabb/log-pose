function hash(value){let result=2166136261;for(const character of String(value)){result^=character.codePointAt(0);result=Math.imul(result,16777619)}return result>>>0}
export function projectColor(id,projects){
 const project=projects.find(item=>item.id===id);
 if(!project)return '#a4a3b1';
 const parent=project.parent?projects.find(item=>item.id===project.parent):null;
 const root=parent||project,hue=hash(root.id)%360;
 const lightness=parent?[46,52,56,72,78,84][hash(project.id)%6]:64;
 return `hsl(${hue} 64% ${lightness}%)`;
}
export function projectStyle(id,projects){return {'--project-color':projectColor(id,projects)}}
export function completionXPGain(before,after){
 const points={Basse:10,Moyenne:20,Haute:40},previous=new Map(before.map(task=>[task.id,task]));
 if(!after.some(task=>task.status===2&&previous.get(task.id)?.status!==2))return 0;
 const total=tasks=>tasks.reduce((sum,task)=>sum+(task.status===2?(points[task.priority]||0):0),0);
 return Math.max(0,total(after)-total(before));
}
