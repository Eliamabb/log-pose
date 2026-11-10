import {React as R} from './react.js';
const h=R.createElement;
export const quarterHours=Array.from({length:96},(_,index)=>String(Math.floor(index/4)).padStart(2,'0')+':'+String(index%4*15).padStart(2,'0'));
export function TimeSelect({value='',onChange,label}){
 const values=value&&!quarterHours.includes(value)?[...quarterHours,value].sort():quarterHours;
 function close(root){root.open=false;root.querySelector('summary').focus()}
 function opened(event){
  const root=event.currentTarget;if(!root.open)return;
  const list=root.querySelector('.timeoptions'),option=list.querySelector('[data-time="'+(value||'12:00')+'"]');
  if(option)list.scrollTop=option.offsetTop-(list.clientHeight-option.offsetHeight)/2;
 }
 function keys(event){
  const root=event.currentTarget.closest('details');
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(root);return}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const buttons=[...event.currentTarget.querySelectorAll('[role="option"]')],index=buttons.indexOf(event.target);
  const target=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+(event.key==='ArrowDown'?1:-1)));
  buttons[target]?.focus();
 }
 return h('details',{className:'timepicker',onToggle:opened,onBlur:event=>{if(!event.currentTarget.contains(event.relatedTarget))event.currentTarget.open=false}},
  h('summary',{role:'button','aria-haspopup':'listbox','aria-label':label},value||'Sans horaire'),
  h('div',{className:'timeoptions',role:'listbox','aria-label':label+' disponibles',onKeyDown:keys},
   ['',...values].map(time=>h('button',{type:'button',role:'option',key:time,'data-time':time,'aria-selected':value===time,onClick:event=>{onChange(time);close(event.currentTarget.closest('details'))}},time||'Sans horaire'))));
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
