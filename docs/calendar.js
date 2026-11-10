import {TimeSelect} from './ui-controls.js?v=20261110-8';
import {projectOccurrences} from './recurrence.mjs?v=20261110-8';
import {React as R} from './react.js';
import {dateKey,weekDays,monthDays,shiftPeriod,layoutTimedTasks,droppedTask,reschedule} from './calendar-data.mjs?v=20261110-8';
const h=R.createElement;
const weekdays=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const dateLabel=date=>date.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
export function Calendar({tasks,recurrenceSkips=[],onOpen,onReschedule}){
 const [view,setView]=R.useState('week'),[anchor,setAnchor]=R.useState(()=>new Date()),[move,setMove]=R.useState(null),[notice,setNotice]=R.useState('');
 const scroll=R.useRef(null),dragged=R.useRef(0);
 R.useEffect(()=>{if(view==='week'&&scroll.current)scroll.current.scrollTop=7*56},[view]);
 const days=view==='week'?weekDays(anchor):monthDays(anchor),today=dateKey(new Date());
 const displayed=projectOccurrences(tasks,days[0],days[days.length-1],recurrenceSkips);
 const sorted=[...displayed].sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||'')||(a.startTime||'').localeCompare(b.startTime||'')||a.title.localeCompare(b.title,'fr'));
 const undated=sorted.filter(task=>!task.dueDate);
 const title=view==='week'?dateLabel(days[0])+' – '+dateLabel(days[6]):anchor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
 async function apply(task,date,slot){
  try{
   const next=droppedTask(task,date,slot);
   if(await onReschedule(next))setNotice('« '+task.title+' » déplacée au '+dateLabel(new Date(date+'T12:00:00'))+(next.startTime?' de '+next.startTime+' à '+next.endTime:''));
  }catch(error){setNotice(error.message)}
 }
 function drop(event,date,slot){
  event.preventDefault();event.stopPropagation();
  const id=event.dataTransfer.getData('application/x-logpose-task');
  const task=displayed.find(item=>item.id===id);
  if(task)apply(task,date,slot);
 }
 function eventButton(task,style){
  const timing=task.startTime?task.startTime+'–'+task.endTime:'Sans horaire';
  return h('button',{type:'button',key:task.id,className:'calevent '+(task.space==='Professionnel'?'pro':'personal')+(task.status===2?' completed':'')+(task._virtual?' projected':''),style,
   title:task.title+' · '+task.space+' · '+timing,
   'aria-label':task.title+' · '+task.space+' · '+timing,
   draggable:true,onDragStart:event=>{dragged.current=Date.now();event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('application/x-logpose-task',task.id)},
   onDragEnd:()=>{dragged.current=Date.now()},onClick:()=>{if(Date.now()-dragged.current>200)onOpen(task)}},
   h('strong',null,(task._virtual?'↻ ':'')+task.title),h('span',null,timing+' · '+task.space+(task._virtual?' · Prévue':'')));
 }
 function changeMove(id){
  const task=displayed.find(item=>item.id===id);
  setMove(task?{id,date:task.dueDate||today,start:task.startTime||'',end:task.endTime||''}:null);
 }
 async function submitMove(event){
  event.preventDefault();
  const task=displayed.find(item=>item.id===move.id);
  if(!task){setNotice('Cette tâche n’est plus disponible.');setMove(null);return}
  try{const next=reschedule(task,move.date,move.start,move.end);if(await onReschedule(next)){setMove(null);setNotice('Planning mis à jour.')}}catch(error){setNotice(error.message)}
 }
 return h('section',{className:'calendar'},
  h('div',{className:'caltoolbar'},
   h('div',{className:'actions'},h('button',{type:'button',onClick:()=>setAnchor(shiftPeriod(anchor,view,-1)),'aria-label':'Période précédente'},'‹'),
    h('button',{type:'button',onClick:()=>setAnchor(new Date())},'Aujourd’hui'),
    h('button',{type:'button',onClick:()=>setAnchor(shiftPeriod(anchor,view,1)),'aria-label':'Période suivante'},'›')),
   h('h2',null,title),
   h('div',{className:'switch'},['week','month'].map(value=>h('button',{type:'button',key:value,className:view===value?'chosen':'','aria-pressed':view===value,onClick:()=>setView(value)},value==='week'?'Semaine':'Mois')))),
  h('div',{className:'callegend'},h('span',{className:'personal'},'Personnel'),h('span',{className:'pro'},'Professionnel'),
   h('button',{type:'button',disabled:!tasks.length,onClick:()=>move?setMove(null):changeMove(sorted[0].id)},move?'Fermer le déplacement':'Déplacer une tâche')),
  h('p',{className:'periodnote'},'Les deux espaces sont affichés · horaires locaux · glissez une tâche vers une date ou un créneau. Cliquez sur une tâche pour voir son détail ou la supprimer. ↻ Prévue indique une occurrence à venir.'),
  notice&&h('p',{className:'calnotice',role:'status'},notice),
  move&&h('form',{className:'calmove',onSubmit:submitMove},
   h('label',null,'Tâche',h('select',{value:move.id,onChange:event=>changeMove(event.target.value)},sorted.map(task=>h('option',{key:task.id,value:task.id},task.title+' · '+task.space)))),
   h('label',null,'Date',h('input',{type:'date',required:true,value:move.date,onChange:event=>setMove({...move,date:event.target.value})})),
   h('label',null,'Début',h(TimeSelect,{label:'Heure de début',value:move.start,onChange:value=>setMove({...move,start:value})})),
   h('label',null,'Fin',h(TimeSelect,{label:'Heure de fin',value:move.end,onChange:value=>setMove({...move,end:value})})),
   h('button',{type:'submit',className:'primary'},'Enregistrer')),
  view==='week'?h('div',{className:'calweekviewport',ref:scroll},
   h('div',{className:'calweek'},
    h('div',{className:'caldayheaders'},h('div',{className:'calcorner'},'Heures'),days.map((day,index)=>h('div',{className:dateKey(day)===today?'today':'',key:dateKey(day)},weekdays[index],h('b',null,day.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}))))),
    h('div',{className:'calallday'},h('span',null,'Sans horaire'),days.map(day=>h('div',{key:dateKey(day),onDragOver:event=>event.preventDefault(),onDrop:event=>drop(event,dateKey(day),null),'aria-label':'Sans horaire le '+dateLabel(day)},
     sorted.filter(task=>task.dueDate===dateKey(day)&&!task.startTime).map(task=>eventButton(task))))),
    h('div',{className:'calhoursbody'},h('div',{className:'calhourlabels'},Array.from({length:24},(_,hour)=>h('div',{key:hour},String(hour).padStart(2,'0')+':00'))),
     days.map(day=>h('div',{className:'caltimedday',key:dateKey(day)},
      Array.from({length:96},(_,slot)=>h('div',{className:'calslot',key:slot,onDragOver:event=>event.preventDefault(),onDrop:event=>drop(event,dateKey(day),slot*15)})),
      layoutTimedTasks(sorted.filter(task=>task.dueDate===dateKey(day))).map(item=>eventButton(item.task,{
       top:(item.start/60*56)+'px',height:Math.max(22,(item.end-item.start)/60*56)+'px',
       left:'calc('+item.column*100/item.columns+'% + 2px)',width:'calc('+100/item.columns+'% - 4px)'}))))))):
   h('div',{className:'calmonthviewport'},h('div',{className:'calmonth'},
    weekdays.map(day=>h('div',{className:'calmonthheading',key:day},day)),
    days.map(day=>h('section',{key:dateKey(day),className:'calmonthday'+(day.getMonth()!==anchor.getMonth()?' outside':'')+(dateKey(day)===today?' today':''),onDragOver:event=>event.preventDefault(),onDrop:event=>drop(event,dateKey(day)),'aria-label':dateLabel(day)},
     h('h3',null,day.getDate()),sorted.filter(task=>task.dueDate===dateKey(day)).map(task=>eventButton(task)))))),
  h('section',{className:'calundated'},h('h3',null,'Tâches sans date ('+undated.length+')'),
   h('p',null,'Vous pouvez les glisser dans le calendrier ou utiliser Déplacer une tâche.'),
   h('div',null,undated.map(task=>eventButton(task)))),
  !tasks.length&&h('p',{className:'chartempty'},'Créez une tâche dans le tableau de bord pour commencer à planifier.')
 );
}
