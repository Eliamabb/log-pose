export const status=['À faire','En cours','Terminé','Non réalisé'], priorities={Basse:10,Moyenne:20,Haute:40};
export const grades=["Moussaillon d’East Blue","Pirate Primeur","Capitaine Traversateur de Red Line","Supernova","Membre du Nouveau Monde","Grand Corsaire","Vice-Amiral / Second de Yonko","Amiral de la Marine","Empereur des Mers","Légende des Mers","Roi des Pirates"];
export function totalXP(tasks){return tasks.reduce((sum,task)=>sum+(task.status===2?(priorities[task.priority]||0):0)-((task.missedPenalty||task.status===3)?10:0),0)}
export function profile(tasks){let xp=Math.max(0,totalXP(tasks)),level=1;while(level<50&&xp>=level*100){xp-=level++*100}return {xp,level,grade:grades[level===50?10:Math.floor((level-1)/5)],title:level<3?'Débutant':level<6?'Productif':level<10?'Stratège':'Maître du temps'}}
export function move(tasks,id,status){return tasks.map(t=>t.id!==id||t.status===status?t:{...t,status,date:status===2?Date.now():null})}
export const empty=()=>({space:'Personnel',projects:[],tasks:[]});
export function restore(storage){const data=JSON.parse(storage.getItem('logpose-v1')||'null');return data||empty()}
export function save(storage,data){storage.setItem('logpose-v1',JSON.stringify(data))}
