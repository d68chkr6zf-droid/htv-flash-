# Brancher le terminal SumUp Solo à HTV Flash

Une fois l'installation faite, au moment du paiement, l'appli envoie le montant directement sur le Solo. Le client paie sans contact, et l'appli enregistre le paiement toute seule. Le QR code et les boutons « Payé par carte » et « Payé en espèces » restent disponibles en secours.

Comptez environ 20 minutes, une seule fois. Vous aurez besoin de votre compte SumUp, d'une adresse e-mail pour Cloudflare (gratuit) et du Solo branché en Wi-Fi.

---

## Étape 1 : deux clés dans votre compte SumUp

Connectez-vous sur **https://me.sumup.com** depuis un ordinateur.

**a) La clé API (secrète)**
1. Cliquez sur votre profil, puis sur **Paramètres**.
2. Ouvrez **Pour les développeurs › Toolkit › Clés API**, puis **Créer**. Donnez-lui le nom « HTV Flash ».
3. **Copiez la clé tout de suite** (elle commence par `sup_sk_`). SumUp ne l'affiche qu'une seule fois. Collez-la dans une note pour l'instant.

**b) La clé d'affiliation**
1. Allez sur **https://me.sumup.com/settings/affiliate-keys** (Paramètres › Pour les développeurs › Affiliate Keys).
2. Dans « Application identifier », tapez exactement : `com.htvflash.app`, puis **Ajouter**.
3. Copiez la clé générée dans votre note.

> Ces clés donnent accès à votre caisse : ne les envoyez à personne, même pas à moi. Elles ne vont que dans Cloudflare (étape 2).

---

## Étape 2 : le relais sur Cloudflare (gratuit)

Le relais est un petit programme en ligne qui garde la clé secrète, pour que l'appli n'ait jamais à la contenir.

1. Créez un compte gratuit sur **https://dash.cloudflare.com/sign-up**.
2. Dans le menu de gauche : **Workers & Pages (Compute) › Créer › Worker**, puis choisissez le modèle « Hello World ».
3. Nommez-le `htv-solo`, puis cliquez sur **Déployer**.
4. Cliquez sur **Modifier le code**. Effacez tout le code affiché et remplacez-le par le contenu de ce fichier :
   **https://d68chkr6zf-droid.github.io/htv-flash-/relais-solo/worker.js**
   (ouvrez-le, Ctrl+A pour tout sélectionner, Ctrl+C pour copier, puis Ctrl+V dans Cloudflare). Cliquez sur **Déployer**.
5. Revenez sur la page du Worker, puis **Paramètres › Variables et secrets › Ajouter**. Ajoutez ces 4 variables en choisissant le type **Secret** :

   | Nom | Valeur |
   |---|---|
   | `SUMUP_API_KEY` | la clé API `sup_sk_…` (étape 1a) |
   | `SUMUP_AFFILIATE_KEY` | la clé d'affiliation (étape 1b) |
   | `SUMUP_APP_ID` | `com.htvflash.app` |
   | `RELAY_TOKEN` | un mot de passe long, inventé par vous (ex. 20 lettres et chiffres) |

   Cliquez sur **Déployer** pour enregistrer.
6. Notez l'adresse du Worker, affichée sur sa page. Elle ressemble à `https://htv-solo.votre-nom.workers.dev`.

---

## Étape 3 : préparer le Solo

1. Allumez le Solo et branchez-le sur sa base. Vérifiez qu'il est connecté au **Wi-Fi** et à jour (un Solo récent se met à jour tout seul).
2. Dans le menu du Solo : **Paramètres › À propos › Se déconnecter**.
3. Ensuite : **Connexions › API › Connecter**. Un **code** s'affiche. Il est valable 5 minutes, alors gardez-le pour l'étape 4.

> Pour réutiliser plus tard le Solo seul, sans l'appli : **Connexions › API › Déconnecter**, puis reconnectez-vous à votre compte SumUp.

---

## Étape 4 : dans HTV Flash

1. **Réglages ⚙️ › SumUp › Terminal SumUp Solo**.
2. **Adresse du relais** : l'adresse de l'étape 2.6.
3. **Mot de passe du relais** : le `RELAY_TOKEN` de l'étape 2.5.
4. Touchez **Tester la connexion**. Le message « Relais OK ✅ » doit s'afficher.
5. Tapez le **code affiché sur le Solo**, puis touchez **Associer le terminal**. Le message « Terminal associé ✅ » s'affiche.

C'est prêt : à l'écran de paiement, un bouton **« 💳 Payer … sur le terminal Solo »** apparaît.

---

## En cas de souci

| Message | Que faire |
|---|---|
| Mot de passe du relais incorrect | Recopiez le `RELAY_TOKEN` exactement, puis redéployez le Worker si vous l'avez changé. |
| Clé API SumUp refusée | Recréez la clé API (étape 1a) et remplacez `SUMUP_API_KEY` dans Cloudflare. |
| Clé d'affiliation refusée | Vérifiez `SUMUP_AFFILIATE_KEY` et que `SUMUP_APP_ID` vaut bien `com.htvflash.app`. |
| Le Solo est hors ligne | Allumez-le, vérifiez le Wi-Fi, puis réessayez. |
| Code refusé ou expiré | Refaites Connexions › API › Connecter sur le Solo pour obtenir un nouveau code. |
| Pas de réponse du terminal | Regardez sur le Solo si le paiement est passé. S'il est passé, touchez « Payé par carte ». |
