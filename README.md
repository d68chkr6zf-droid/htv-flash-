# HTV Flash 📸

Application tactile pour gérer les photos des clients pendant les séances photo, pensée pour un **Chromebook à écran tactile**.

## Le parcours client, étape par étape

1. **Carte microSD** : le photographe insère la carte du client et l'application lit toutes les photos (y compris les dossiers DCIM). Les fichiers RAW (CR3, NEF, ARW…) sont associés à leur JPEG.
2. **Coordonnées** : nom, prénom, e-mail, n° de portable.
3. **Choix des photos** : le client touche les photos qu'il veut garder (appui long pour agrandir, glisser pour faire défiler).
4. **Droit à l'image** : « J'accepte » ou « Je refuse » (le texte se modifie dans les réglages).
5. **Enregistrement** : un dossier est créé pour le client, avec `1-A-retoucher` (photos choisies + RAW), `2-Retouchees` (vide, pour vos retouches), `fiche-client.txt` et `client.json`.
6. **Paiement SumUp** : choix de la formule, QR code du lien de paiement SumUp, puis « Payé par carte » ou « Payé en espèces ».

Depuis l'accueil, les 4 boutons donnent aussi un accès direct : import microSD, fiche client, photos à retoucher (liste des clients, filtres « à retoucher » / « non payés ») et paiement.

## Thèmes

Réglages ⚙️ → Thème : Automatique (suit la date), Classique, Clair, Hiver, Printemps, Été, Automne, Halloween, Noël, Nouvel An, Saint-Valentin, Pâques, Mariage. Les animations (neige, feuilles, cœurs…) peuvent être coupées.

## Installation sur le Chromebook

1. Ouvrez l'adresse GitHub Pages de l'application dans **Chrome** (ex. `https://<votre-compte>.github.io/htv-flash/`).
2. Cliquez sur l'icône **Installer** à droite de la barre d'adresse (ou menu ⋮ → « Installer HTV Flash »).
3. L'application apparaît dans le lanceur comme une vraie application, s'ouvre en plein écran et **fonctionne sans internet**.

Les mises à jour arrivent automatiquement à la prochaine ouverture avec internet.

> Pourquoi pas un fichier APK via Downloader ? Une application web installée par Chrome est la seule façon simple de lire la microSD et d'écrire dans les dossiers du Chromebook (et de Google Drive) sans passer par le Play Store. Elle se met à jour toute seule depuis GitHub.

## Google Drive

Dans Réglages → Dossier des clients, choisissez un dossier dans **Google Drive › Mon Drive** : ChromeOS synchronise les dossiers clients automatiquement.

## SumUp

- **Lien de paiement** (recommandé) : dans l'app SumUp, créez un lien de paiement et collez-le dans les réglages (un lien général, ou un lien par formule avec montant fixe). Le client scanne le QR code et paie par carte, Apple Pay ou Google Pay sur son téléphone.
- **Avancé** : avec une clé d'affiliation SumUp (tableau de bord développeur SumUp), le bouton « Encaisser avec l'app SumUp » ouvre l'app SumUp Android avec le montant déjà saisi, pour payer sur le lecteur de carte. À tester sur votre Chromebook.

## Confidentialité

Tout reste sur le Chromebook : la liste des clients est stockée dans le navigateur et les fiches dans les dossiers clients. Aucune donnée n'est envoyée sur internet.

## Mise en ligne (GitHub Pages)

Dépôt GitHub → Settings → Pages → Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.

Fichiers : `index.html`, `styles.css`, `app.js`, `sw.js` (hors ligne), `manifest.webmanifest`, `icons/`, `vendor/qrcode.js` (bibliothèque QR code, licence MIT, © Kazuhiko Arase).
