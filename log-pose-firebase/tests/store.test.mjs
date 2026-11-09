import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encode,decode,saveSnapshot} from '../docs/store.mjs';
const data={space:'Personnel',projects:[{id:'root',name:'Parent',space:'Personnel',parent:''},{id:'sub',name:'Enfant',space:'Personnel',parent:'root'}],tasks:[{id:'t',title:'Tâche',description:'Texte complet',space:'Personnel',project:'sub',priority:'Haute',status:2,date:1}]};
test('Format, hiérarchie, descriptions et limite de taille',()=>{
 assert.deepEqual(decode({payload:encode(data),revision:1}).data,data);
 assert.throws(()=>encode({...data,tasks:[{...data.tasks[0],project:'absent'}]}));
 assert.throws(()=>encode({...data,tasks:[{...data.tasks[0],description:'x'.repeat(800000)}]}));
 assert.throws(()=>encode({...data,projects:[null]}));
 assert.deepEqual(decode(null),{data:null,revision:0});
});
test('Transactions, conflit concurrent, reprise idempotente et séparation des références',async()=>{
 const documents=new Map();
 const sdk={async runTransaction(db,callback){return callback({
  async get(reference){return {exists:()=>documents.has(reference),data:()=>documents.get(reference)}},
  set(reference,value){documents.set(reference,value)}
 })}};
 const id='00000000-0000-4000-8000-000000000001';
 assert.equal(await saveSnapshot(sdk,null,'users/a/state/main',data,0,id),1);
 assert.equal(await saveSnapshot(sdk,null,'users/a/state/main',data,0,id),1);
 await assert.rejects(saveSnapshot(sdk,null,'users/a/state/main',data,0,'other'),e=>e.code==='conflict');
 assert.equal(await saveSnapshot(sdk,null,'users/b/state/main',data,0,'b'),1);
 assert.equal(await saveSnapshot(sdk,null,'users/a/state/main',data,1,'a-next'),2);
 assert.equal(documents.get('users/b/state/main').revision,1);
});
