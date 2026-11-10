import {normalize} from './activity.mjs?v=20261110-9';
import {valid} from './validation.mjs?v=20261110-9';
export const MAX_BYTES=800000;
export function encode(data){
 if(!valid(data))throw Error('La sauvegarde contient des données invalides.');
 const payload=JSON.stringify(normalize(data));
 if(new TextEncoder().encode(payload).length>MAX_BYTES)throw Error('Limite de 800 Ko par compte atteinte. Exportez vos données avant de les alléger.');
 return payload;
}
export function decode(document){
 if(!document)return {data:null,revision:0};
 if(!Number.isSafeInteger(document.revision)||document.revision<1)throw Error('Révision de sauvegarde invalide.');
 const data=JSON.parse(document.payload);
 if(!valid(data))throw Error('Données du compte invalides. Conservez votre export et vérifiez la base.');
 return {data:normalize(data),revision:document.revision,mutationId:document.mutationId};
}
// Une transaction vérifie la révision avant d'enregistrer le document complet.
// mutationId rend la reprise idempotente si l'accusé de réception a été perdu.
export async function saveSnapshot(sdk,db,reference,data,revision,mutationId){
 const payload=encode(data);
 return sdk.runTransaction(db,async transaction=>{
  const snapshot=await transaction.get(reference);
  const existing=snapshot.exists()?snapshot.data():null;
  if(existing?.mutationId===mutationId)return existing.revision;
  if((existing?.revision||0)!==revision){
   const error=Error('Conflit de sauvegarde');error.code='conflict';throw error;
  }
  transaction.set(reference,{payload,revision:revision+1,mutationId});
  return revision+1;
 });
}
