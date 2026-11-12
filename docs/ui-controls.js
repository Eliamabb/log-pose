import {React as R} from './react.js';
const h=R.createElement;
export const quarterHours=Array.from({length:96},(_,index)=>String(Math.floor(index/4)).padStart(2,'0')+':'+String(index%4*15).padStart(2,'0'));
export function TimeSelect({value='',onChange,label}){
 const afternoon=quarterHours.filter(time=>time>='12:00'),morning=quarterHours.filter(time=>time<'12:00');
 return h('select',{className:'nativetime','aria-label':label,value,onChange:event=>onChange(event.target.value)},
  h('option',{value:''},'Sans horaire'),
  value&&!quarterHours.includes(value)&&h('option',{value},value+' (horaire personnalisé)'),
  h('optgroup',{label:'Midi et après-midi'},afternoon.map(time=>h('option',{key:time,value:time},time))),
  h('optgroup',{label:'Matin et nuit'},morning.map(time=>h('option',{key:time,value:time},time))));
}
export function projectOptions(projects){
 return ['Personnel','Professionnel'].map(space=>({space,options:projects.filter(project=>project.space===space&&!project.parent).flatMap(parent=>[
  {id:parent.id,label:parent.name,path:space+' › '+parent.name},
  ...projects.filter(child=>child.space===space&&child.parent===parent.id).map(child=>({id:child.id,label:'\u2003↳ '+child.name,path:space+' › '+parent.name+' › '+child.name}))
 ])}));
}
export function ProjectFilter({projects,value,onChange}){
 return h('select',{'aria-label':'Périmètre',value,onChange:event=>onChange(event.target.value)},
  h('option',{value:''},'Tous les projets'),
  projectOptions(projects).filter(group=>group.options.length).map(group=>h('optgroup',{key:group.space,label:group.space},
   group.options.map(option=>h('option',{key:option.id,value:option.id,'aria-label':option.path},option.label)))));
}
