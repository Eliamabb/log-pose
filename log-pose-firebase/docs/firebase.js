import {firebaseConfig} from './firebase-config.js';
let services;
export function getServices(){
 if(!firebaseConfig.apiKey||!firebaseConfig.projectId||!firebaseConfig.authDomain||!firebaseConfig.appId){
  return Promise.reject(Error('Complétez docs/firebase-config.js avec la configuration de votre application Web Firebase.'));
 }
 if(!services){
  services=(async()=>{
   const [appSdk,authSdk,storeSdk]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js')
   ]);
   const app=appSdk.initializeApp(firebaseConfig);
   const auth=authSdk.getAuth(app);
   await authSdk.setPersistence(auth,authSdk.browserLocalPersistence);
   return {auth,db:storeSdk.getFirestore(app),authSdk,storeSdk};
  })().catch(error=>{services=null;throw error});
 }
 return services;
}
export function message(error){
 const messages={
  'auth/invalid-credential':'Adresse ou mot de passe incorrect.',
  'auth/invalid-email':'Adresse e-mail invalide.',
  'auth/too-many-requests':'Trop de tentatives. Réessayez plus tard.',
  'auth/network-request-failed':'Connexion réseau indisponible.',
  'permission-denied':'Accès refusé. Vérifiez les règles Firestore et le compte connecté.',
  'unavailable':'Firebase est injoignable. Vérifiez votre connexion.',
  'resource-exhausted':'Quota Firebase atteint. Réessayez après son renouvellement.',
  'conflict':'Une modification plus récente existe sur un autre appareil.'
 };
 return messages[error.code]||error.message||'Une erreur est survenue.';
}
