# Log Pose — GitHub Pages et Firebase

Version statique de Log Pose avec Firebase Authentication et Cloud Firestore. Elle inclut projets, sous-projets, descriptions, Kanban, fiches détaillées, statistiques, arborescences, progression RPG, export et import JSON.

Cette archive est adaptée pour un dépôt GitHub Pages. Elle ne contient pas vos données du compte ChatGPT, ni de configuration Firebase personnelle. Le site hébergé actuellement sur ChatGPT est indépendant de cette distribution.

## 1. Créer Firebase

1. Ouvrir https://console.firebase.google.com/ et créer un projet.
2. Conserver le forfait gratuit Spark. Google Analytics est facultatif.
3. Dans Authentication, activer le fournisseur E-mail/Mot de passe.
4. Dans Authentication > Utilisateurs, ajouter votre utilisateur avec une adresse e-mail et un mot de passe.
5. Dans Firestore Database, créer une base de données Standard, identifiant (default), en mode production, dans une région adaptée (par exemple européenne).
6. Ouvrir l'onglet Règles, remplacer le texte par le contenu intégral du fichier firestore.rules et cliquer sur Publier.

Ne laissez pas des règles ouvertes de mode test. Les règles fournies autorisent un utilisateur connecté à lire et écrire uniquement son document sous users/SON_UID/state/main. Les autres chemins et la liste des comptes sont interdits.

Les mots de passe sont gérés par Firebase Authentication. L'application ne fournit pas de formulaire public d'inscription. Les comptes sont créés dans votre console Firebase. L'absence d'un formulaire d'inscription ne constitue pas une restriction de sécurité de l'API d'inscription Firebase. Chaque UID est isolé par les règles et dispose de ses propres données.

## 2. Renseigner la configuration

Dans les paramètres du projet Firebase, ajouter une application Web. Copier les champs de firebaseConfig dans docs/firebase-config.js :

```javascript
export const firebaseConfig = {
 apiKey: 'VOTRE_CLE_WEB',
 authDomain: 'VOTRE_PROJET.firebaseapp.com',
 projectId: 'VOTRE_PROJET',
 appId: 'VOTRE_APP_ID'
};
```

Ces identifiants Web sont destinés à être présents dans le navigateur. La protection des données est assurée par Authentication et firestore.rules. Ne fournissez jamais une clé privée, un fichier de compte de service, un jeton administrateur ou un mot de passe dans le dépôt.

Le SDK Firebase Web 12.5.0 est chargé depuis le CDN officiel www.gstatic.com. React et l'interface sont livrés localement. Aucune variable .env ni serveur Node.js de production ne sont nécessaires.

## 3. Publier sur GitHub Pages

Méthode simple sans Actions :

1. Créer un dépôt GitHub public, par exemple log-pose, avec votre compte GitHub Free.
2. Décompresser cette archive.
3. Envoyer les fichiers et dossiers dans le dépôt en conservant la structure, notamment docs/ et firestore.rules.
4. Dans Settings > Pages, sélectionner Deploy from a branch.
5. Sélectionner main et le dossier /docs, puis Save.
6. Attendre la publication et copier l'adresse réellement affichée par GitHub.

Votre adresse ressemblera à https://VOTRE_PSEUDO.github.io/log-pose/. Les chemins relatifs de l'interface fonctionnent avec ce préfixe. La navigation de l'application ne dépend pas de routes serveur.

Alternative avec Actions : le workflow .github/workflows/pages.yml est fourni. Si vous publiez ce dossier, choisissez GitHub Actions comme source dans Settings > Pages. Le workflow déploie uniquement docs/. Utilisez l'une de ces méthodes de publication.

Pour modifier ensuite l'application, mettez à jour les fichiers du dépôt. Pour modifier les règles de sécurité, publiez-les aussi dans la console Firebase. Modifier firestore.rules dans GitHub ne déploie pas automatiquement les règles Firebase.

## 4. Autoriser votre domaine

Dans Firebase Authentication > Settings > Authorized domains, ajouter :

VOTRE_PSEUDO.github.io

Il s'agit du domaine, sans https:// ni /log-pose/. Conserver les domaines Firebase déjà présents.

Pour tester en local, ajouter localhost. Les projets Firebase récents ne l'ajoutent pas nécessairement par défaut. Configurer également les modèles d'e-mail Firebase si vous souhaitez personnaliser la réinitialisation des mots de passe.

## 5. Utiliser et importer

1. Ouvrir l'adresse GitHub Pages.
2. Se connecter avec le compte ajouté à Firebase Authentication.
3. Importer votre sauvegarde JSON avec Importer une sauvegarde.
4. Confirmer le remplacement des données de ce compte.
5. Ouvrir la même adresse sur le téléphone et se connecter au même compte.
6. Les modifications reçues de Firestore actualisent automatiquement le tableau.

Si deux appareils écrivent depuis une révision différente, le second reçoit un conflit. Exporter sa modification en attente, puis Actualiser pour charger les données du compte. Une reprise utilise le même identifiant de modification pour éviter de réappliquer une écriture après une réponse perdue.

La sauvegarde locale logpose-v1 d'une ancienne installation sur la même origine peut être fusionnée après confirmation par le bouton Transférer mes projets. Une origine GitHub Pages ne peut pas lire le LocalStorage du domaine ChatGPT.

## 6. Exporter depuis Log Pose sur ChatGPT

Ouvrir l'ancienne application et se connecter. Dans la console du navigateur de cet onglet, exécuter :

```javascript
(async () => {
 const response = await fetch('/api/state', {cache:'no-store'});
 if (!response.ok) throw new Error('Connectez-vous à Log Pose.');
 const result = await response.json();
 if (!result.data) throw new Error('Aucune donnée sauvegardée dans ce compte.');
 const url = URL.createObjectURL(new Blob(
  [JSON.stringify(result.data, null, 2)],
  {type:'application/json'}
 ));
 const link = document.createElement('a');
 link.href = url;
 link.download = 'log-pose-sauvegarde.json';
 link.click();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
})();
```

Importer ensuite le fichier dans votre nouvelle application. Les comptes ChatGPT et Firebase sont distincts. Les données de projets sont transférées, les mots de passe et sessions ne le sont pas.

## Stockage et limites

Chemin Firestore :

users/{uid}/state/main

Le document contient trois champs :
- payload, un texte JSON contenant space, projects et tasks.
- revision, un entier strictement croissant.
- mutationId, un UUID permettant de reconnaître une écriture déjà effectuée.

Le modèle conserve un document par compte pour limiter les lectures et simplifier les imports. L'application vérifie une limite de 800 000 octets pour conserver une marge sous la limite Firestore de 1 Mio par document. Au-delà, elle affiche un message et refuse la sauvegarde. Il faudra alors exporter et alléger les données, ou faire évoluer le modèle vers plusieurs documents.

Les règles vérifient la propriété, les champs, la taille du texte et la révision. Le détail du JSON est validé dans l'application. Le contenu de ce document est propre à l'utilisateur, il n'accorde aucun privilège sur d'autres comptes.

Spark est soumis aux quotas Firebase. Une connexion Internet et l'accès au CDN Firebase sont nécessaires. Les transactions ne permettent pas de créer ou modifier les tâches hors ligne. En cas de sauvegarde en attente, conserver l'onglet ouvert ou exporter la modification avant de le fermer.

Les données personnelles et les exports JSON doivent rester hors du dépôt GitHub public. Le code et la configuration Web peuvent être publics.

## Tests et aperçu local

Avec Node.js 24 :

```bash
npm test
```

Les tests vérifient format, hiérarchie, descriptions, limite de taille, conflits et reprises idempotentes avec un adaptateur simulé. Ils ne remplacent pas une vérification réelle du projet Firebase et des règles.

Pour servir le site avec Python 3 :

```bash
python -m http.server 8000 --directory docs
```

Ouvrir http://localhost:8000. Les modules JavaScript doivent être servis en HTTP, pas ouverts directement en fichier local.

Les étapes de création du projet Firebase, publication des règles et connexion sur deux appareils restent à effectuer avec votre compte. Aucun identifiant Firebase n'était disponible lors de la préparation, la connexion et les règles n'ont pas été testées contre un projet réel.

## Fichiers

- docs/ contient tous les fichiers à publier.
- firestore.rules contient les règles à publier dans Firestore.
- firebase.json permet le déploiement des règles via Firebase CLI si vous l'utilisez : firebase deploy --only firestore:rules --project VOTRE_PROJET.
- .github/workflows/pages.yml est le workflow facultatif GitHub Pages.
- tests/ contient les tests du stockage.
- CODE_COMPLET.md reproduit le contenu intégral des fichiers, hors lui-même.
- THIRD_PARTY_NOTICES.md et LICENSE-APACHE-2.0.txt contiennent les notices des composants embarqués.

Documentation officielle :
https://firebase.google.com/docs/auth/web/password-auth
https://firebase.google.com/docs/firestore/manage-data/transactions
https://firebase.google.com/docs/firestore/quotas
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
