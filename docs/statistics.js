import {React as R} from './react.js';
import {completionMetrics,weeklyCompletions,completedGroups} from './statistics-data.mjs';
const h=R.createElement;
const shortDate=date=>date.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});
function polar(cx,cy,r,angle){return [cx+r*Math.cos(angle),cy+r*Math.sin(angle)]}
function slicePath(start,end){
 const [sx,sy]=polar(100,100,84,start),[ex,ey]=polar(100,100,84,end);
 return 'M100 100 L'+sx+' '+sy+' A84 84 0 '+(end-start>Math.PI?1:0)+' 1 '+ex+' '+ey+' Z';
}
export function TaskStatistics({tasks,projects}){
 const [mode,setMode]=R.useState('projects'),[now,setNow]=R.useState(()=>new Date());
 R.useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 const metrics=completionMetrics(tasks,now),weeks=weeklyCompletions(tasks,now);
 const groups=completedGroups(tasks,projects,mode),total=groups.reduce((sum,group)=>sum+group.count,0);
 const maximum=Math.max(1,...weeks.map(week=>week.count)),top=Math.max(1,Math.ceil(maximum/4)*4);
 const ticks=[0,top/4,top/2,top*3/4,top].filter(Number.isInteger);
 let angle=-Math.PI/2;
 const slices=groups.map((group,index)=>{
  const start=angle;angle+=2*Math.PI*group.count/total;
  return {...group,start,end:angle,color:'hsl('+Math.round(index*137.508%360)+' 64% 66%)'};
 });
 return h('div',{className:'taskstatistics'},
  h('div',{className:'metrics completionmetrics'},[
   [metrics.day,'Terminées aujourd’hui'],
   [metrics.week,'Terminées cette semaine'],
   [metrics.month,'Terminées ce mois-ci']
  ].map(([value,label])=>h('section',{key:label},h('b',null,value),h('p',null,label)))),
  h('p',{className:'periodnote'},'Périodes calendaires · semaine du lundi au dimanche · heure locale de cet appareil'),
  metrics.undated>0&&h('p',{className:'periodnote'},metrics.undated+' tâche(s) terminée(s) sans date exploitable, exclue(s) des compteurs par période et du graphique hebdomadaire.'),
  h('section',{className:'chartpanel'},
   h('h3',null,'Tâches réalisées par semaine'),
   h('p',null,'Les 12 dernières semaines, semaine en cours incluse'),
   weeks.some(week=>week.count>0)?h('div',{className:'barviewport'},
    h('svg',{viewBox:'0 0 740 250',role:'img','aria-label':'Nombre de tâches terminées par semaine. Les valeurs sont disponibles dans le tableau sous le graphique.'},
     ticks.map(tick=>h('g',{key:tick},h('line',{x1:42,x2:732,y1:205-tick/top*170,y2:205-tick/top*170,stroke:'#3c3547'}),h('text',{x:32,y:209-tick/top*170,textAnchor:'end'},tick))),
     weeks.map((week,index)=>{
      const x=52+index*56,height=week.count/top*170;
      const end=new Date(week.end);end.setDate(end.getDate()-1);
      return h('g',{key:week.start.toISOString()},
       h('rect',{x,y:205-height,width:30,height,rx:4,fill:index===11?'#e6c68c':'#b99aef'},h('title',null,shortDate(week.start)+' au '+shortDate(end)+' · '+week.count+' tâche(s)')),
       h('text',{x:x+15,y:Math.max(20,197-height),textAnchor:'middle'},week.count),
       h('text',{x:x+15,y:229,textAnchor:'middle'},shortDate(week.start)));
     }))):h('p',{className:'chartempty'},'Aucune tâche terminée sur ces 12 semaines.'),
   h('details',null,h('summary',null,'Voir les valeurs hebdomadaires'),
    h('table',null,h('thead',null,h('tr',null,h('th',null,'Semaine du'),h('th',null,'Tâches terminées'))),
     h('tbody',null,weeks.map(week=>h('tr',{key:week.start.toISOString()},h('td',null,week.start.toLocaleDateString('fr-FR')),h('td',null,week.count))))))),
  h('section',{className:'chartpanel'},
   h('div',{className:'sectiontitle'},h('h3',null,'Répartition des tâches réalisées'),
    h('select',{'aria-label':'Regrouper les tâches réalisées',value:mode,onChange:event=>setMode(event.target.value)},
     h('option',{value:'projects'},'Par projet'),
     h('option',{value:'subprojects'},'Par sous-projet'))),
   h('p',null,'Réalisations conservées dans le journal pour le périmètre sélectionné'),
   total?h('div',{className:'piecontent'},
    h('svg',{viewBox:'0 0 200 200',className:'piechart',role:'img','aria-label':'Répartition de '+total+' tâches terminées. Les catégories et pourcentages figurent dans la légende.'},
     slices.map(group=>groups.length===1?
      h('circle',{key:group.id,cx:100,cy:100,r:84,fill:group.color},h('title',null,group.label+' · '+group.count+' tâches')):
      h('path',{key:group.id,d:slicePath(group.start,group.end),fill:group.color,stroke:'#191a21',strokeWidth:1},h('title',null,group.label+' · '+group.count+' tâches')))),
    h('ul',{className:'pielegend'},slices.map(group=>h('li',{key:group.id},
     h('span',{className:'colorswatch',style:{backgroundColor:group.color},'aria-hidden':true}),
     h('span',null,group.label),
     h('b',null,group.count+' · '+(100*group.count/total).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %'))))):
    h('p',{className:'chartempty'},'Terminez une tâche pour afficher sa répartition.'),
   mode==='subprojects'&&h('p',{className:'periodnote'},'Chaque sous-projet est distingué. Les tâches rattachées directement à un projet et celles sans projet ont leur propre catégorie.'))
 );
}
