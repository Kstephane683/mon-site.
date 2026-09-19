# CONCEPTION APP — Système visuel et écrans de l'application Mia

**Émetteur** : agent SITE · **Destinataire** : agent CHATBOT, propriétaire · **Date** : 2026-09-19
**Sources qui font foi** : `CONSIGNE-SITE.md` (§1 design system, §2 écrans, §4 règles produit, §7 exigences propriétaire) · `PLAN-COMPLET.md` (§3 structure de l'app) · `API-CLIENT-V1.md` (le contrat de données, 31 endpoints) · `agent-ia-web/eperf_core/assets/css/` (les 5 couches canoniques — jetons consommés, jamais redéfinis) · captures Jèko (`references-visuelles/`, référence STRUCTURELLE uniquement).
**Portée** : les 14 écrans de l'app Mia (outil de gestion du chatbot, pour le propriétaire du site client) + le système visuel + la stack + la performance. La landing page sectorielle fait l'objet d'un document séparé.

---

## 0. Les cinq principes directeurs

1. **Puissante** : chaque écran répond à « que puis-je faire maintenant ? », pas « voici des informations ». Les actions primaires sont à portée de pouce, les filtres sont un geste, pas un formulaire.
2. **Facile** : le premier parcours (livraison → première conversation lue) ne demande jamais de savoir-faire technique. Les réglages techniques portent une infobulle en français.
3. **Wow moments** : trois scènes signées — l'ouverture de « Mia en direct » depuis le bouton central, la prise de main qui bascule une conversation en mode humain, la bascule multi-sites qui recharge tout le scope. Rien d'autre n'anime pour décorer.
4. **Premium** : zéro valeur hors jetons. La marque se lit dans la typographie (Cormorant Garamond pour la voix, DM Sans pour la donnée), l'or en accent, le papier comme fond — jamais dans des aplats décoratifs.
5. **Rapide** : priorité absolue. Chaque décision de ce document a été passée au filtre « ça coûte combien en millisecondes ? ». Les budgets chiffrés sont en §6 et sont bloquants en CI.

**Règles produit appliquées partout** (bloquantes) : seul « Mia » est visible (jamais d'agent ni de compteur) ; « Mia répond » ≠ « Mia exécute » (aucune capacité opérationnelle présentée comme active) ; RGPD C4 complet (§3 écran Confidentialité) ; français intégral ; zéro emoji ; icônes SVG du sprite existant (`public/icons.svg` du dépôt du widget).

---

## 1. L'architecture de navigation

### 1.1 La barre inférieure — 4 onglets + bouton central

Structure reprise de la référence Jèko (capture `jeko-01-accueil-dashboard.png.webp`) : une barre basse fixe, 4 onglets, et un bouton central en relief qui dépasse de la barre.

```
┌──────────────────────────────────────────────────────┐
│  [Accueil]  [Conversations]  (Mia)  [Analyses]  [Réglages] │
└──────────────────────────────────────────────────────┘
```

| Position | Élément | Écran | Icône (sprite existant, à doter si absent) |
|---|---|---|---|
| 1 | Accueil | 2 | maison |
| 2 | Conversations | 3 | bulles |
| — | **Bouton central « Mia en direct »** | 10 | monogramme Mia (celui du widget visiteur) |
| 3 | Analyses | 6 | courbe |
| 4 | Réglages | 7 | engrenage |

- **Onglet actif** : `aria-current="page"`, couleur `--accent` + point sous l'icône (4 px, `--rayon-pilule`), l'inactif est `--texte-discret` (5,41:1 sur `--fond` — au-dessus du seuil 3:1 exigé par WCAG 1.4.11 pour un contrôle).
- **Bouton central** : 64 px de diamètre, fond `--accent`, icône `--sur-accent` (5,05:1 en clair / 8,83:1 en sombre sur l'accent), ombre `--ombre-accent`. Touch target réel 72 px (zone invisible).
- **Barre** : fond `--surface`, filet haut `--filet`, hauteur 64 px + `env(safe-area-inset-bottom)` (le TWA Android et l'installation iOS en ont besoin). Le contenu des écrans défile en dessous avec un padding-bottom de 96 px.
- La cloche de **Notifications (écran 5)** n'est PAS un onglet : elle vit dans l'en-tête, avec un badge `--erreur` portant le nombre de non lues (`GET .../notifications`, champ `non_lues`). Raison : une notification n'est pas une destination, c'est un flux — elle doit être atteignable depuis n'importe quel onglet sans consommer un des 4 emplacements.

### 1.2 La pile de navigation

Un routeur à pile (cf. §5, stack) : 4 racines d'onglet + une racine modale (Mia en direct) + des écrans poussés.

| Écran | Niveau | Poussé depuis | Transition d'entrée |
|---|---|---|---|
| 1 Connexion (+ changement forcé, + 2FA) | hors pile | — | fondu 300 ms `--courbe` |
| 0 Onboarding (3 étapes) | hors pile | après connexion | fondu + révélation |
| 2 Accueil | racine onglet | — | fondu croisé 150 ms `--duree-rapide` |
| 3 Conversations | racine onglet | — | fondu croisé 150 ms |
| 6 Analyses | racine onglet | — | fondu croisé 150 ms |
| 7 Réglages | racine onglet | — | fondu croisé 150 ms |
| 10 Mia en direct | **racine modale** | bouton central | **montée depuis le bouton** (voir 1.5) |
| 4 Détail conversation | pile +1 | 3, 2 (carte escalade), 5 (notification), 12 | glissement latéral 300 ms `--courbe` |
| 5 Notifications | pile +1 | cloche (tout onglet) | glissement latéral |
| 8 Compétences | pile +1 | 7, 2 (carte « compétences ») | glissement latéral |
| 9 Horaires | pile +1 | 7 | glissement latéral |
| 12 Prospects | pile +1 | 2 (KPI leads) | glissement latéral |
| Confidentialité (RGPD) | pile +1 | 7 | glissement latéral |
| Compte et sécurité | pile +1 | 7 | glissement latéral |
| 11 Commandes | pile +1 (v2) | 2, 7 | glissement latéral — masqué tant que `orders.disponible` est faux |
| 13 Messages ePerformance | pile +1 (v2) | 7 | glissement latéral |

- **Retour** : geste système + bouton retour dans l'en-tête (chevron + libellé de l'écran parent). L'état de la pile est conservé par onglet (retour sur Conversations = là où on était, y compris filtre actif).
- **Deep-link** : les notifications push portent un chemin (`/conversations/{id}`) — le tap ouvre la pile directement sur le détail, bouton retour actif. La PWA réponde aux liens `mia.eperformance.pro/app/...` via le manifeste (`scope`, `start_url`).
- **Fermeture modale « Mia en direct »** : bouton fermer en haut à gauche + glissement vers le bas (le geste naturel d'une modale mobile) + retour système.

### 1.3 Le sélecteur multi-sites

- Un compte peut gérer plusieurs sites (`GET /api/client/v1/me` → `sites[]`). Le sélecteur est une **puce dans l'en-tête**, en haut à gauche : nom du site + chevron. Le rôle du compte s'affiche à l'intérieur de la feuille (`role_client` : « Administrateur », « Opérateur », « Lecteur »).
- Tap → feuille basse listant les sites (`site_name`, `site_url`, secteur). Choisir un site = **le wow moment n° 3** : l'écran courant se voile (voile `--fond` à 70 %), le scope bascule, et toutes les données se rechargent avec une transition orchestrée (KPI qui recomptent, cartes qui se révèlent en cascade de 40 ms). Durée totale plafonnée à 600 ms perçus : la transition démarre immédiatement, les données arrivent en squelettes puis se substituent (pas d'écran blanc).
- Le dernier site choisi est persisté localement ; à la réouverture, le scope est rétabli. `site_id` alimente toutes les routes §4-9 de `API-CLIENT-V1.md`.
- Un compte mono-site voit la puce sans chevron (elle informe, elle n'ouvre rien).

### 1.4 Les écrans masqués par secteur

Deux écrans existent dans le plan mais pas partout :

- **Commandes (11)** : masqué hors secteur e-commerce ; de plus, `GET .../orders` répond toujours 200 avec `disponible: false` tant que l'intégration n'est pas branchée (§4.7 du contrat). Décision : l'écran **n'existe dans la navigation d'aucun site tant que `disponible` est faux** — ni onglet, ni carte, ni entrée désactivée. Pas d'entrée grise : une entrée désactivée raconte qu'il manque quelque chose, un écran absent raconte que l'app est complète (règle C2 appliquée à la navigation elle-même). Quand l'intégration existera, une carte « Commandes » apparaîtra sur l'Accueil du site e-commerce concerné.
- **Prospects (12)** : visible uniquement pour immobilier, artisan, vitrine (services professionnels) — la liste des secteurs est pilotée par le secteur renvoyé dans `/me` et `/settings`. Entrée : le KPI « leads du jour » de l'Accueil devient tappable et pousse l'écran 12. Hors secteurs concernés, le KPI reste non tappable et libellé « contacts capturés ».
- Conséquence technique : la structure de navigation est **déclarative** (une table écran → condition d'affichage évaluée à chaque changement de scope), pas un `if` éparpillé dans les composants.

### 1.5 Le bouton central — pourquoi « Mia en direct » et rien d'autre

Proposition demandée : justifier ou proposer mieux. **Décision : le bouton central ouvre « Mia en direct » (écran 10). Justification :**

1. **C'est le seul écran qui mérite un coût de navigation nul.** Le propriétaire a un chatbot, il veut le tester : « elle dit quoi aujourd'hui ? ». C'est le geste le plus fréquent du propriétaire non-opérationnel, et celui qui fait comprendre le produit en 10 secondes pendant l'onboarding.
2. **C'est le wow moment n° 1.** La modale monte depuis le bouton lui-même (échelle 0,92 → 1, origine centrée sur le bouton, 300 ms `--courbe`) : la conversation naît littéralement de l'icône Mia. Aucun autre écran ne fait ça — la barre entière s'efface, le fond passe en `--fond` uni, l'écran est une scène.
3. **La conversation de test n'est jamais enregistrée** : une destination permanente (et non un lien enfoui dans Réglages) évite la confusion avec la vraie boîte de réception. La modale porte en permanence la mention « Conversation de test — rien n'est enregistré ».
4. **Alternatives écartées** : « Nouvelle réponse » (le geste réel est de répondre depuis Conversations — un bouton central qui ouvre une liste vide la moitié du temps est un pari perdu) ; « + Ajouter » (rien à créer pour un propriétaire scopé). Le test vivant est le seul candidat qui vaut un emplacement premium 100 % du temps.

---

## 2. Le système visuel

### 2.1 Typographie — trois polices, trois métiers

| Police | Jeton | Rôle dans l'app | Tailles utilisées |
|---|---|---|---|
| **Cormorant Garamond** (600, 700) | `--police-titres` | La **voix** : titres d'écrans, nom de la Mia, intention sectorielle (écran 8, citée comme une phrase éditoriale), titres d'états vides | `--p-taille-2xl` (24-25 px) pour les titres d'écran, `--p-taille-3xl` pour le nom sur l'écran Mia en direct |
| **DM Sans** (400, 500, 600) | `--police-corps` | Tout le reste : corps, libellés, boutons, champs | `--p-taille-base` (15 px) corps, `--p-taille-sm` (13 px) libellés secondaires, `--p-taille-md` (16 px) champs de saisie |
| **DM Sans tabulaire** | `--police-chiffres` (= `--police-corps` + `font-variant-numeric: tabular-nums`) | **La donnée** : KPI, compteurs, horaires, taux. Les chiffres elzéviriens de Cormorant rendraient un « 0 » ambigu — c'est le choix documenté du noyau | KPI en `--p-taille-3xl` graisse 600 |

- Interlignage : `--p-interligne-titre` (1,22) sur les titres, `--p-interligne-corps` (1,65) sur les corps, `--p-interligne-serre` sur les grands chiffres.
- **Chargement des polices** : auto-hébergées (dossier `public/fonts` existant), `font-display: swap`, sous-ensemble latin étendu français, chaque fichier en `woff2` unique. Cormorant est réservé aux titres : il est préchargé uniquement sur l'écran de connexion et l'Accueil, requis ailleurs à la demande du CSS. Repli métrique : Georgia pour Cormorant, `system-ui` pour DM Sans (CLS contenu).
- Échelle : celle du noyau (`--p-taille-xs` à `--p-taille-4xl`), rapport 1,25 entre paliers — consommée telle quelle, aucune taille inventée.

### 2.2 Espacement et grille mobile

- Échelle du noyau, pas de 4 px : `--p-espace-1` (4) à `--p-espace-8` (64). Application mobile :
  - gouttière d'écran : `--espace-4` (16 px) de chaque côté ;
  - intervalle entre cartes : `--espace-3` (12 px) ;
  - padding interne de carte : `--espace-4` (16 px) horizontal, `--espace-4` vertical ;
  - séparation de section : `--espace-6` (32 px) ;
  - en-tête : `--hauteur-entete` (72 px) réutilisée telle quelle.
- Espacement par **relation** (règle du noyau) : un titre est à `--espace-2` de son texte, un KPI à `--espace-1` de son libellé — jamais un seul gap partout.
- Largeur : l'app est un document mobile (`max-width: 480px` centré au-delà, fond `--fond-2` de part et d'autre). Aucune mise en page tablette en v1 ; l'écran Analyses s'élargit à 640 px en paysage (le seul qui en a besoin).

### 2.3 La carte, unité de base

Toute l'app compose avec UN objet : `.card` existant du noyau (fond `--surface`, `--rayon-carte` 28 px, ombre `--ombre-1`, filet `--filet`). Déclinaisons app :

| Variante | Usage | Différence |
|---|---|---|
| Carte posée | KPI, conversation, compétence, réglage | par défaut |
| Carte surélevée | actions rapides de l'Accueil (le motif Jèko) | ombre `--ombre-2`, LÉGÈRE élévation au tap (translateY -2 px, 150 ms) |
| Carte d'alerte | conversation escaladée non lue | filet gauche 3 px `--alerte` + fond `--alerte-trace` |
| Carte accent | carte « Tester Mia » | fond `--accent-trace`, filet `--accent-filet` |
| Bloc intérieur | à l'intérieur d'une carte (une ligne de réglage, un créneau horaire) | fond `--surface-2`, `--rayon-bloc` (20 px), sans ombre |

- Rayons : la hiérarchie du noyau est conservée et porte du sens — carte 28 (`--rayon-carte`), bloc intérieur 20 (`--rayon-bloc`), champ 12 (`--rayon-champ`), bouton pilule (`--rayon-bouton` 999). Un rayon = une nature d'objet, jamais une décoration.
- Les cartes interactives sont des `<button>` ou des `<a>` réels (navigation clavier gratuite), focus visible : anneau 2 px `--accent` avec décalage 2 px.

### 2.4 Les cinq états — exigeance du propriétaire, spécifiés écran par écran

| État | Rendu | Jetons |
|---|---|---|
| **Vide** | Une illustration SVG au trait (`--filet-2`), titre en Cormorant (`--p-taille-lg`), UNE phrase qui dit quoi faire, un bouton d'action quand il existe. Chaque écran a le sien, rédigé en §3 | titre `--texte`, phrase `--texte-doux` |
| **Chargement** | Squelettes de la vraie structure (mêmes cartes, mêmes proportions) — jamais de spinner nu. Animation : pulsation d'opacité 0,45 ↔ 0,7, 1,2 s, `--courbe-2` — pas de balayage dégradé (le dégradé reste la trame du noyau, seul) | blocs `--surface-2` sur `--fond` |
| **Erreur** | Encart `.encart-erreur` existant : titre « Impossible de charger », la raison en français, un bouton **Réessayer** (l'action de reprise est obligatoire). 429 : bouton relance temporisée avec décompte (le contrat fournit le message) | `--erreur`, `--erreur-filet`, `--erreur-trace` |
| **Hors ligne** | Bannière fine permanente sous l'en-tête : « Hors ligne — vous consultez les conversations récentes. Les réglages sont en lecture seule. » L'app passe en lecture (les écritures sont désactivées avec libellé explicite, sauf le marquage « lu » mis en file et rejoué au retour) | `--alerte`, `--alerte-trace` |
| **Permission refusée** | La carte ou l'action d'écriture porte un cadenas SVG, le libellé reste lisible et l'action est **remplacée** par « Demandez à un administrateur ». Exemple Lecteur : les boutons d'écriture disparaissent de la barre d'action (pas de boutons grisés) et une pastille « Lecture seule » s'affiche dans l'en-tête | `--texte-discret`, pastille `--surface-2` |

### 2.5 Sombre et clair — même empreinte

- Les deux thèmes consomment EXACTEMENT les mêmes noms de jetons (`[data-theme='dark']` rebascule les primitives, couche 2 du noyau). Aucune condition de thème dans un composant. Le bouton de bascule vit dans Réglages → Compte, plus le `theme-toggle` existant en en-tête de connexion.
- Les 6 balises `<meta name="theme-color">` valent `--bg` — exception documentée de la règle « zéro hexadécimal » (CONSIGNE §1).
- Le grain de papier (`--grain`, opacité `--grain-opacite`) et la trame d'accent (`--trame`) sont appliqués tels quels : c'est la signature premium du noyau, elle voyage gratuitement.
- Contrastes : toutes les paires utilisées par l'app sont mesurées (§2.7).

### 2.6 Le mouvement — ce qui anime et ce qui n'anime jamais

**Trois durées, deux courbes** (jetons du noyau, consommés sans exception) :

| Usage | Durée | Courbe |
|---|---|---|
| Micro-interaction (tap de bouton, bascule, coche) | `--duree-rapide` 150 ms | `--courbe` (sortie franche) |
| Navigation, apparition de cartes, transitions d'état | `--duree` 300 ms | `--courbe` |
| Révélation signée (ouverture Mia en direct, bascule multi-sites, onboarding) | `--duree-revelation` 780 ms max | `--courbe`, cascade 40 ms par élément |

**Ce qui anime** : l'entrée des cartes (fade + translateY 8 px, cascade 40 ms, 6 éléments max par écran) ; le bouton central (échelle 0,94 au press) ; les bascules de compétences (curseur 150 ms + coche qui se dessine 200 ms, path `--coche` en `mask`) ; le compteur KPI qui recompte (300 ms, chiffres tabulaires) ; le curseur « prendre la main » ; les squelettes (pulsation d'opacité) ; l'indicateur de saisie de Mia (trois points, 900 ms en boucle — la seule boucle animée de l'app, réservée à l'écran 10).

**Ce qui n'anime JAMAIS** : les fonds et la trame (statiques par décision du noyau) ; les listes longues en défilement (aucun parallaxe) ; les chiffres en vol perpétuel ; les ombres pulsantes ; tout ce qui bouge pendant qu'une donnée charge (le contenu apparaît une fois, net) ; les transitions au-delà de 780 ms.

**`prefers-reduced-motion`** : la couche 2 du noyau réduit déjà toutes les durées à 1 ms — l'app n'a RIEN à redéclarer ; vérifié en test (les cascades deviennent des apparitions sèches, `transitionend` reste déclenché).

**Performance du mouvement** : uniquement `transform` et `opacity` (compositing GPU), aucune animation de layout. Les listes virtualisées (§6) rendent le défilement à 60 fps sur un mobile d'entrée de gamme.

### 2.7 Accessibilité — contrastes mesurés (calculés, pas affirmés)

Ratios calculés selon WCAG 2.1 (luminance relative) sur les paires réellement posées par l'app :

| Paire (jetons) | Clair | Sombre | Seuil |
|---|---|---|---|
| `--texte` sur `--fond` | 17,71:1 | 16,64:1 | AA texte 4,5 — large |
| `--texte-doux` sur `--fond` | 9,60:1 | 8,67:1 | large |
| `--texte-discret` sur `--fond` (libellés, horodatages) | 5,41:1 | 5,93:1 | AA texte — conforme |
| `--accent` sur `--fond` (liens, onglet actif) | 4,93:1 | 8,93:1 | AA texte et UI 3:1 — conforme |
| `--accent` sur `--surface` | 5,05:1 | 8,48:1 | conforme |
| `--sur-accent` sur `--accent` (bouton central, CTA) | 5,05:1 | 8,83:1 | conforme |
| `--succes` sur `--fond` (statut « Mia en ligne ») | 6,00:1 | 10,44:1 | conforme |
| `--alerte` sur `--fond` (bannière hors ligne) | 5,77:1 | 10,34:1 | conforme |
| `--erreur` sur `--fond` | 6,55:1 | 6,40:1 | conforme |
| `--info` sur `--fond` | 7,09:1 | 9,00:1 | conforme |
| `--filet-controle` sur `--surface` (bordures de champs, WCAG 1.4.11) | 3,44:1 | 3,25:1 | UI 3:1 — conforme |

Règles structurelles : navigation clavier complète (pile = Tab naturel, feuilles = piège de focus + Échap, retour = Alt+Gauche) ; `aria-current="page"` sur l'onglet actif ; zones tactiles ≥ 44 px ; libellés de formulaire explicites (`<label for>`) avec `.field-hint` pour les infobulles techniques ; les états portés par le MOT autant que par la couleur (un lead « chaud » est écrit, pas seulement orange) ; `aria-live="polite"` sur le compteur de non lues et sur les résultats de recherche ; validation du code 2FA annoncée à la lecteur d'écran.

---

## 3. Les 14 écrans

Convention : chaque écran liste Rôle / Structure (de haut en bas) / Données (routes de `API-CLIENT-V1.md`) / États / Interactions / **Moment** (ce qui le rend puissant plutôt que générique).

---

### Écran 0 — Onboarding guidé

**Rôle.** Transformer la livraison (e-mail + mot de passe temporaire) en propriétaire qui a compris, testé et configuré l'essentiel en moins de 3 minutes.

**Structure.** Plein écran, 3 étapes, points de progression en haut, bouton « Passer » discret en haut à droite (jamais enfoui) :
1. **« Voici Mia »** — le nom en Cormorant, une phrase : « Mia répond à vos visiteurs avec les informations de votre site. Testez-la tout de suite. » Bouton unique « Tester Mia » → ouvre l'écran 10 (première prise de contact, non enregistrée).
2. **« Ce qu'elle dit de votre site »** — 3 puces tirées des données réelles du secteur : l'intention (`GET .../competences`, champ `intention` résumée en une ligne), deux thèmes FAQ actifs (`competences[].theme`), et la mention « ePerformance règle la voix de Mia, vous réglez ce qu'elle sait ».
3. **« Où la régler »** — carte éclatée miniature de l'Accueil avec 3 repères annotés : les non lues, les leads, les Réglages. Bouton « Terminer » → Accueil.

**Données.** `GET /api/client/v1/me` (rôle, sites, `tfa`) · `GET .../competences` (intention, thèmes). Aucune écriture.

**États.** Reprise : quitter l'onboarding à l'étape 2 le réouvre à l'étape 2 (persisté localement, purgé à la fin). Secteur non renseigné (`competences.disponible: false`) : l'étape 2 affiche « Votre secteur est en cours de configuration par ePerformance » et saute à l'étape 3.

**Interactions.** Suivant = balayage horizontal OU bouton ; retour = balayage inverse.

**Moment.** L'onboarding NE raconte pas l'app : il se termine sur une vraie conversation avec la vraie Mia. Le propriétaire retient « ça répond » avant d'avoir vu un seul réglage.

---

### Écran 1 — Connexion (avec changement forcé et 2FA)

**Rôle.** Entrée sécurisée du compte, y compris le parcours de livraison (mot de passe temporaire) et l'activation 2FA obligatoire du rôle Admin.

**Structure.** Trois sous-écrans dans une même pile :
1. **Connexion** : logo Mia (Cormorant), champs e-mail + mot de passe, case « Rester connecté 30 jours » (`remember_me`, cochée par défaut), bouton « Se connecter ». Lien « Mot de passe perdu » → message : contactez ePerformance (pas de route self-service en v1 — dit honnêtement).
2. **Changement forcé** : déclenché par `must_change_password: true`. Ancien mot de passe pré-rempli (la valeur du champ connexion est conservée en mémoire de l'écran, jamais persistée), nouveau + confirmation, règles affichées (8 caractères minimum), bouton « Définir mon mot de passe ». Tant que ce n'est pas fait, TOUTE autre route répond 403 (contrat §2.3) : l'app n'affiche donc rien d'autre — un seul écran, zéro impasse.
3. **2FA (client_admin uniquement)** : « Protégez votre compte » — bouton « Configurer la vérification en deux étapes » → `POST /2fa/setup` → affichage du QR **généré côté client** depuis `otpauth_uri` (SVG, jetons uniquement) + clé secrète copiable ; champ code 6 chiffres ; « Activer » → `POST /2fa/activate`. Le secret est affiché UNE fois (contrat) : l'écran le dit (« notez cette clé maintenant ») et la sortie d'écran efface la valeur.

**Données.** `POST /api/auth/login` (form ou `/login/json`) avec `remember_me`, `totp_code` · `GET /api/client/v1/me` · `POST /api/client/v1/password` · `POST /api/client/v1/2fa/setup` / `2fa/activate` / `2fa/disable` (la désactivation vit dans Compte et sécurité).

**États.** 401 `Incorrect email or password` : erreur sous le champ, focus rendu au champ. 401 **`2fa_requise`** : PAS une erreur — le champ code se révèle en glissement (150 ms) avec focus automatique, clavier numérique (`inputmode="numeric"`). 429 : encart avec le message du contrat et bouton relance à décompte. 403 `Account is disabled` : encart neutre « Contactez ePerformance ». 503 (chiffrement indisponible) : « Service momentanément indisponible, réessayez dans un instant ». Squelette sur le QR pendant le `setup`.

**Interactions.** Validation en direct (longueur du mot de passe) ; autocapitalize off sur l'e-mail ; le code 2FA se soumet à 6 chiffres.

**Moment.** La vitesse. Ce sera l'écran le plus mesuré de l'app (c'est le LCP vécu) : interactif avant les polices, champs autocomplétables, aucune image. Et la révélation du champ 2FA qui remplace une page d'erreur par un couloir fluide.

---

### Écran 2 — Accueil (l'état vivant)

**Rôle.** En un regard : Mia va bien, il s'est passé quoi, et qu'est-ce qui m'attend. Le « tableau de bord » du propriétaire, pensé pour 8 secondes d'attention.

**Structure (haut → bas).**
1. **En-tête vivant** : « Bonjour » selon l'heure (matin/après-midi/soir), nom du site en Cormorant, pastille de statut — point `--succes` + « Mia est en ligne » (dérivé de `sites[0].is_active`) ou point `--alerte` + « Mia est en pause ».
2. **KPI principal** : **non lues** — grand chiffre tabulaire (`--p-taille-3xl`), libellé « messages à lire ». Tap → Conversations avec filtre non lu pré-coché. Zéro non lue : le chiffre devient « 0 » en `--texte-discret` et le libellé devient « tout est lu » (le silence est un état, il s'affiche).
3. **Carte surélevée d'actions rapides** (motif Jèko : 3 actions sur une carte blanche) : **Tester Mia** (ouvre l'écran 10), **Répondre** (Conversations), **Régler** (Réglages).
4. **Dernière escalade** — carte d'alerte conditionnelle : si une conversation `escalade` + `non_lu` existe, elle prend sa place ici avec extrait du dernier message (`last_message`, 120 premiers caractères fournis), bouton « Prendre en main » → détail (écran 4). Aucune escalade : la carte n'existe pas (pas de carte « tout va bien » — du bruit).
5. **Leads du jour** — carte accent : chiffre du jour, tap → Prospects (secteurs concernés) ou → liste des leads en filtre. Zéro : « Aucun contact capturé aujourd'hui — Mia en capture dès qu'un visiteur laisse ses coordonnées. »
6. **Activité 7 jours** — mini-rangée : conversations, taux de capture (2 chiffres + delta vs 7 jours précédents), lien « Voir les analyses » → écran 6.

**Données.** `GET /api/client/v1/me` · `GET .../conversations?escalade=true&non_lu=true&page_size=1` · `GET .../conversations?non_lu=true` (compteur via `total`) · `GET .../analytics?period_days=14` (7 jours vs 7 précédents calculés côté client sur deux appels `period_days=7` et `period_days=14`) · `GET .../leads` (comptage du jour côté client, `created_at`) · `GET .../notifications` (`non_lues`, pour le badge cloche).

**États.** Premier lancement : squelettes de la structure exacte. Hors ligne : les compteurs s'affichent depuis le cache chiffré avec l'étiquette « à l'instant près : hors ligne ». Erreur par bloc (chaque carte a sa reprise, l'écran entier ne tombe jamais pour une carte). Lecteur : identique en lecture — l'Accueil est 100 % lisible pour tous les rôles.

**Interactions.** Pull-to-refresh (arc en `--accent` qui se remplit, relâche = rafraîchissement de toutes les cartes) ; long-press sur la carte escalade → menu (marquer comme lue [notification], ouvrir).

**Moment.** Le KPI principal recompte à l'arrivée d'une push (300 ms, chiffres tabulaires) : le propriétaire ENTEND son site vivre. Et la carte d'escalade qui surgit avec son filet `--alerte` fait de l'Accueil une vigie, pas une vitrine.

---

### Écran 3 — Conversations (la boîte unifiée)

**Rôle.** Toutes les conversations du site, filtrables en un geste, avec la recherche et les actions de masse du quotidien.

**Structure.**
1. **Barre de recherche** (`q` du contrat : nom, e-mail, téléphone, contenu des messages) + bouton filtre.
2. **Chips de filtre** : Tout · Non lues · Escaladées · Avec lead (mappées respectivement sur `non_lu`, `escalade`, `avec_lead`). Le chip actif : fond `--accent-trace`, filet `--accent-filet`, texte `--accent` (4,93:1). `aria-pressed`.
3. **Liste** — cartes conversation : nom du visiteur (ou « Visiteur »), extrait `last_message` sur une ligne, horodatage relatif (« il y a 4 min »), badges d'état : pastille point + libellé — « Non lue » (point `--erreur`), « Escaladée » (`--alerte`), « Lead capturé » (`--succes`), « Vous avez la main » (`--accent`, si `human_active`). Pagination infinie (page/page_size, 20 par page, sentinelle IntersectionObserver).
4. **Bouton retour en haut** après 2 écrans de défilement.

**Données.** `GET /api/client/v1/sites/{site_id}/conversations` avec `page`, `page_size`, `non_lu`, `escalade`, `avec_lead`, `q`.

**États.** Vide filtré : « Aucune conversation avec ce filtre. Retirez le filtre pour voir tout l'historique. » + bouton « Retirer le filtre ». Vide total : « Votre boîte est vide. Dès qu'un visiteur parle à Mia, la conversation apparaît ici. » + bouton « Tester Mia ». Erreur : encart + réessayer, la liste déjà chargée reste visible (réponse = rafraîchissement, pas de page blanche).

**Interactions.** Tap → détail (4). **Balayage droit → « Prendre la main »** (action primaire, `POST /takeover` — voir écran 4). **Long-press → feuille contextuelle** : copier le téléphone (`visitor_phone`), copier l'e-mail, « Rechercher dans cette conversation » (filtre local des messages du détail). Pull-to-refresh. Le swipe « archiver » demandé dans la consigne n'a pas de route en v1 (le contrat n'expose pas de changement de statut) : il est remplacé par le swipe « prendre la main » et sera ajouté avec la route — noté au journal, pas simulé.

**Moment.** La recherche est instantanée et servie par le backend (`q`), le clavier s'ouvre sans re-rendu de la liste ; et une conversation escaladée non lue porte le filet `--alerte` : elle se repère avant même d'être lue.

---

### Écran 4 — Détail conversation (la prise en main)

**Rôle.** Lire l'historique complet, prendre la main quand Mia a besoin d'un humain, rendre la main, documenter.

**Structure.**
1. **En-tête de conversation** : nom du visiteur, contact (téléphone/e-mail tappables si présents), statut, badge lead (`lead.lead_type` : chaud/tiède/froid/information, en mots + couleur d'état), horodatage de début.
2. **Fil de messages** : bulles visiteur (fond `--surface-2`, alignées à gauche) / bulles Mia (fond `--accent-trace`, filet `--accent-filet`, alignées à droite, préfixées « Mia ») / bulles humaines (fond `--accent`, texte `--sur-accent`, étiquette `human_name` — le contrat fournit `human` et `human_name`). Le message du lead capturé (`lead.message`, `lead.intent`) s'affiche en carte intercalée.
3. **Bandeau d'état de main** : « Mia répond » ou, si `human_active`, bandeau `--accent-trace` : « Vous avez la main — Mia est en pause sur cette conversation. »
4. **Composeur** (rôles Opérateur et plus) : champ texte (4000 caractères max, compteur discret), bouton « Envoyer » — envoyer PREND la main (contrat §4.3) ; ou bouton « Prendre la main » seul (`/takeover`) sans message. Quand la main est prise : bouton « Rendre la main à Mia » (`/release`).
5. **Barre d'actions secondaires** : Réponses rapides (feuille de 8 réponses éditables, stockées localement), note interne (champ pliable — voir états), taguer (v1.1), Exporter (RGPD, voir écran Confidentialité), Supprimer (RGPD, admin).

**Données.** `GET .../conversations/{conversation_id}` · `POST .../reply` · `POST .../takeover` · `POST .../release` · (RGPD) `GET .../rgpd/conversations/{id}/export`, `DELETE .../rgpd/conversations/{id}`.

**États.** Chargement : squelettes des bulles (3 tailles déterministes). Erreur 404 : « Cette conversation n'existe pas ou a été supprimée » + retour (l'isolation multi-tenant renvoie 404, jamais 403 — le message ne dit jamais « ce n'est pas la vôtre »). **Notes internes et tags : le contrat v1 n'expose pas encore ces routes** (chantier 3) — les emplacements UI existent mais sont masqués tant que la route n'est pas là, comme pour Commandes. Pas de note stockée localement : une note « interne » en cache local serait un faux sentiment de sécurité.

**Interactions.** Tap long sur un message → « Copier ». Le composeur prend le focus après « Prendre la main ». Envoi optimiste : la bulle apparaît immédiatement en opacité 0,6, la confirmation réseau la passe à 1 (ou l'annule avec encart erreur + bouton « Renvoyer » conservant le texte).

**Moment.** **La prise en main est le wow moment n° 2** : au tap, la barre du composeur monte, le bandeau glisse depuis le haut (« Vous avez la main »), le fil se teinte d'une trace d'accent — en 300 ms le propriétaire comprend que l'humain a remplacé la machine, sans qu'un mot ne l'explique. Le rendu de main inverse la scène avec une confirmation (« Mia reprend la main »).

---

### Écran 5 — Notifications (le flux et les canaux)

**Rôle.** Ce qui s'est passé (flux in-app) et ce qui doit me prévenir (canaux par type).

**Structure.**
1. **Feuille de réglage** (bouton engrenage en haut) : matrice 3 types × 3 canaux — `nouveau_lead` / `escalade` / `nouveau_visiteur` en lignes, `push` / `e-mail` / `Telegram` en colonnes, bascules par cellule. Interrupteurs généraux au-dessus : e-mail actif, Telegram actif (`notification_telegram_enabled`, `notification_email_enabled`) + destinataires (liste éditable d'e-mails / `notification_recipients`). Infobulles : « nouveau visiteur est silencieux par défaut : Mia vous écrit seulement quand un contact est capturé ou quand un humain est demandé » (les défauts du contrat §7.3 sont affichés à la première ouverture).
2. **Flux** : cartes notification (titre, corps, âge, non lue en gras avec point), tap → conversation liée (`conversation_id` → écran 4) et marquage lu (`POST .../notifications/read` avec `ids`). « Tout marquer comme lu » en pied de liste.
3. **Activation du push** (C4) : si la permission navigateur n'est pas accordée, une carte dédiée « Recevez les alertes sur votre téléphone » avec bouton « Activer » — le consentement explicite précède TOUTE demande de permission ; refusée : « Les notifications sont désactivées dans votre navigateur. Réactivez-les dans les réglages du navigateur pour recevoir les alertes de Mia. »

**Données.** `GET .../notifications` (`lu`, `page`) · `POST .../notifications/read` (`ids` ou `toutes`) · `PUT .../settings` (`notification_settings`, `notification_telegram_enabled`, `notification_email_enabled`, `notification_recipients`).

**États.** Vide : « Rien pour l'instant. Les leads et les demandes d'aide d'un visiteur arrivent ici. » 422 (type inconnu) : impossible par construction (la matrice ne propose que les 3 types du contrat). Opérateur/Lecteur : la feuille de réglage est en lecture avec pastille « réservé aux administrateurs ».

**Interactions.** Bascules optimistes avec retour arrière (toast « Annuler », 5 s). Les bascules push non consenties affichent la carte de consentement au lieu de s'activer.

**Moment.** La matrice tactile 3×3 : le réglage le plus utile du SaaS (qui me prévient, pour quoi, où) tient dans un écran sans défilement.

---

### Écran 6 — Analyses (l'historique et les tendances)

**Rôle.** La tendance sur la durée — distincte de l'Accueil (le jour) : combien de conversations, quels sujets, quelle capture.

**Structure.**
1. **Sélecteur de période** : 7 / 30 / 90 jours (segmented control, pilule).
2. **Le chiffre héros : taux de capture** (`conversion_rate`), en tabulaire géant, avec **delta vs période précédente** (deux appels : `period_days=N` et `period_days=2N`, la différence donne la période précédente — méthode honnête, les seules données que le contrat expose). Flèche et texte : « +3,2 pts vs les 30 jours précédents ».
3. **Rangée de 3 chiffres** : conversations (`total_conversations`), messages (`total_messages`), contacts capturés (`total_leads_captured`), chacun avec son delta.
4. **Sujets les plus demandés** (`top_intents`) : barres horizontales — c'est le seul graphique de v1, et il vient des données réelles du contrat. Libellés des intents traduits en français métier (carte des libellés par secteur, cohérente avec l'écran 8).
5. **Durée moyenne** (`avg_messages_per_conversation`) + phrase d'interprétation : « En moyenne, un visiteur échange 6 messages avec Mia. »
6. **Export** : CSV (conversations agrégées + leads via `GET .../leads`) et PDF (feuille d'impression stylée — aucun bundle de bibliothèque PDF).

**Données.** `GET .../analytics` (`period_days` 1-365) ×2 pour le delta · `GET .../leads` (export CSV).

**États.** Vide (site neuf) : « Pas encore de données. Elles apparaîtront dès les premières conversations. » Chargement : squelettes de chiffres (blocs `--surface-2` aux dimensions des nombres). Erreur : encart + réessayer, les chiffres précédents restent affichés avec l'étiquette « au [date] ».

**Interactions.** Le sélecteur de période commute sans re-rendu du squelette (les chiffres se recomptent, 300 ms). Pull-to-refresh.

**Moment.** Le delta qui apparaît en second (chiffre, puis flèche, puis comparaison, cascade 40 ms) — l'écran raconte « mieux qu'avant » ou « à surveiller » en une seconde de lecture.

---

### Écran 7 — Réglages (le centre de commande, en catégories)

**Rôle.** La porte de tous les réglages, organisés en catégories lisibles (motif Jèko : paramètres en catégories), avec le niveau de permission visible.

**Structure.**
1. **Carte site** : nom, URL, secteur (nom français du secteur), rôle du compte connecté.
2. **Catégories** (cartes-listes, une ligne = un écran, chevron) :
   - **Message d'accueil** (aperçu en sous-titre) — édition en pile +1 ;
   - **Compétences de Mia** (sous-titre : « 7 sur 9 actives ») → écran 8 ;
   - **Horaires et disponibilités** (sous-titre : état du jour, « Ouvert · 9 h – 14 h ») → écran 9 ;
   - **Notifications** → écran 5 ;
   - **Limites de conversation** → pile +1 (rate limits) ;
   - **Confidentialité (RGPD)** → pile +1 ;
   - **Compte et sécurité** (mot de passe, 2FA, sessions, thème clair/sombre, déconnexion) → pile +1.
3. **Carte « La voix de Mia »** (lecture seule, volontairement visible) : le `system_prompt` affiché tronqué, cadenas, légende « La voix de Mia est réglée par ePerformance pour votre métier. Demandez une modification à votre contact ePerformance. » Une tentative d'édition est impossible par construction — le contrat répond 400 et l'app ne propose pas le champ.

**Données.** `GET .../settings` (une seule charge, partagée aux sous-écrans) · `PUT .../settings` pour le message d'accueil et les limites · `GET /api/client/v1/me` (rôle).

**États.** Opérateur/Lecteur : toutes les catégories restent visibles (voir > ne pas voir), les catégories en écriture portent la pastille cadenas et poussent un écran en lecture avec la mention « réservé aux administrateurs ». Hors ligne : tout l'écran passe en lecture seule explicite. Erreur de sauvegarde : l'optimiste est annulé, l'ancienne valeur restaurée, encart erreur.

**Interactions.** Édition du message d'accueil : compteur 2000 caractères, enregistrement automatique au retour (debounce 1 s, `PUT` partiel — le contrat accepte les champs seuls fournis), toast « Enregistré » avec « Annuler ». Les limites : steppers (messages/minute 1-120, conversations/jour 1-10000) avec infobulle « Protège Mia des abus ; au-delà, un visiteur est invité à patienter ».

**Moment.** La carte « La voix de Mia » : assumer la contrainte produit (le prompt n'est PAS modifiable) en la rendant lisible et rassurante — c'est une promesse de qualité, pas une limitation cachée.

---

### Écran 8 — Compétences de Mia (l'écran sectoriel)

**Rôle.** Le cœur de la promesse « chaque Mia est contextuelle » : ce que Mia sait du métier, thème par thème, activable.

**Structure.**
1. **Carte identité sectorielle** : « Mia pour la Restauration » en Cormorant, puis l'**intention** du noyau citée comme une phrase éditoriale en italique (« Donner faim et lever le doute pratique : la carte, l'accueil… »), et le vocabulaire du métier (`item.nom` : « Plat », « Chambre », « Bien »…) affiché comme une étiquette de lexique. C'est la seule place de l'app où le texte du noyau est exposé tel quel : il est traité comme une citation, pas comme un réglage.
2. **Compteur et action de masse** : « 7 compétences sur 9 actives » + « Tout désactiver » / « Tout réactiver » (avec confirmation).
3. **Liste des thèmes** (`competences[]`) : une ligne par thème, bascule à droite. Désactiver le dernier actif déclenche une confirmation explicite : « Mia ne saura plus répondre sur ce thème. Les visiteurs seront orientés vers un contact humain. »
4. **Carte « Tester »** : « Posez-lui une question sur la carte et les plats » (thème du haut) → bouton « Ouvrir Mia en direct » (écran 10, suggestions pré-remplies avec les thèmes actifs).

**Données.** `GET .../competences` (thèmes du noyau via le snapshot versionné, état actif depuis `allowed_intents`) · `PUT .../settings` avec `competences` (la liste des thèmes ACTIFS ; liste vide = tout couper — la confirmation de masse existe pour ça).

**États.** `disponible: false` (secteur non renseigné) : état explicite du contrat affiché tel quel — « Le secteur du site n'est pas encore renseigné par ePerformance » + bouton « Contacter ePerformance ». Hors ligne : liste en lecture, bascules désactivées avec libellé.

**Interactions.** Bascule optimiste (150 ms) + toast « Annuler » 5 s ; le compteur recompte. La liste conserve l'ordre du noyau (pas de tri alphabet local : l'ordre du métier fait sens).

**Moment.** **L'écran qui matérialise le positionnement.** Le propriétaire de restaurant voit « carte et plats », celui d'hôtel voit « chambres » — jamais une liste générique. L'intention en Cormorant italique, sous le nom du métier, transforme une page de réglages en page d'identité.

---

### Écran 9 — Horaires et disponibilités

**Rôle.** La donnée que Mia utilise pour répondre « quand » : horaires, fermetures, fuseau, notes.

**Structure.**
1. **Bandeau du jour** : « Aujourd'hui : ouvert de 9 h à 14 h » ou « Fermé aujourd'hui » — calculé localement depuis l'objet horaires + fuseau.
2. **Semaine** : 7 lignes (lundi → dimanche), interrupteur « ouvert » par jour, créneaux en blocs intérieurs éditables (début / fin, steppers de 15 min ou sélecteur natif `<input type="time">`). Plusieurs créneaux par jour (ajout, suppression avec confirmation).
3. **Fermetures exceptionnelles** (`fermetures[]`) : liste début / fin / motif, bouton « Ajouter une fermeture » (calendrier natif).
4. **Fuseau** (`fuseau`) : sélecteur (valeur du contrat, ex. `Africa/Ouagadougou`), infobulle « Mia répondra selon ce fuseau ».
5. **Notes** (`notes`) : texte libre, 200 caractères conseillés — « Service continu le week-end » dans le modèle du contrat.
6. **Aperçu vivant** : une bulle Mia qui cite ce que Mia répondra : « Nous sommes fermés le dimanche. Nous vous accueillons du lundi au samedi, de 9 h à 14 h. » — régénérée à chaque édition.

**Données.** Lecture : `horaires` dans `GET .../settings`. Écriture : `PUT .../settings` champ `horaires` (objet complet obligatoire — 422 sinon) avec la structure exacte du contrat §6 (`ouverture` par jour avec `creneaux` debut/fin, `fermetures`, `fuseau`, `notes`).

**États.** `horaires: null` (jamais réglé) : l'écran s'ouvre sur le gabarit vide du contrat avec le bandeau « Mia répondra avec prudence tant que vos horaires ne sont pas réglés » + CTA « Régler maintenant ». Validation locale avant envoi : début < fin, créneaux qui se chevauchent signalés, dates de fermeture cohérentes. Erreur 422 : encart avec la raison et le champ fautif surligné (`--erreur-filet`).

**Interactions.** Enregistrement automatique comme l'écran 7 (debounce, PUT partiel sur `horaires`), steppers ≥ 44 px, l'aperçu se met à jour à la frappe.

**Moment.** **L'aperçu vivant** : le propriétaire n'édite pas un JSON, il entend ce que Mia dira. La boucle éditer → voir la phrase changer est ce qui rend l'écran évident sans documentation.

---

### Écran 10 — Mia en direct (le test vivant)

**Rôle.** Parler à SA Mia comme un visiteur, sans rien enregistrer — le test avant d'activer, la démonstration permanente.

**Structure.** Modale plein écran.
1. **Barre** : fermer (croix), « Mia en direct », mention permanente « Conversation de test — rien n'est enregistré » (chip `--info-trace`/`--info-filet`).
2. **Scène d'ouverture** : le monogramme Mia au centre, halo `--accent-halo` qui respire (2 s, une seule fois), phrase « Posez-lui une question, comme un visiteur le ferait. »
3. **Suggestions sectorielles** : 3 chips tirées des thèmes FAQ actifs (`GET .../competences`) — « Quels sont vos horaires ? », « La carte du jour ? » (les libellés sont composés par secteur depuis les thèmes réels, pas hard-codés).
4. **Fil de conversation** : mêmes bulles que l'écran 4 (cohérence visuelle : le test ressemble au widget).
5. **Composeur** : champ + envoyer. Indicateur de saisie (trois points en `--accent`, boucle 900 ms) pendant l'attente de réponse.

**Données.** `POST /api/chatbot/message` (la route du widget, limite 12/60 s) sur le canal de test avec le flag `test` spécifié par PLAN-COMPLET §3.1 (« message API + flag `test` », conversations non enregistrées). **Point de coordination au journal** : le contrat `API-CLIENT-V1.md` ne documente pas ce canal de test — l'UI est conçue pour la sémantique « non enregistré, flag test » et le paramétrage exact (chemin, corps, réponse) est validé avec CHATBOT avant implémentation. Aucun écran de l'app ne dépend d'autre chose que du contrat livré.

**États.** 429 (limite 12/60 s) : « Mia a besoin d'une petite pause. Réessayez dans quelques secondes » + décompte. Hors ligne : le composeur est désactivé, « Le test demande une connexion — Mia répond depuis le serveur ». Réponse vide/erreur : « Mia n'a pas pu répondre. Vérifiez que le site est actif, puis réessayez. »

**Interactions.** Les chips de suggestion envoient la question au tap ; le fil défile automatiquement vers la dernière bulle ; glissement vers le bas = fermeture.

**Moment.** **Le wow moment n° 1.** Ouverture montée depuis le bouton central, halo qui respire, première réponse qui arrive en révélation. C'est l'écran de démonstration capturé pour la section 5 de la landing (captures réelles exigées) : il doit être photogénique dans les deux thèmes.

---

### Écran 11 — Commandes (masqué hors e-commerce, v2)

**Rôle.** Lire les commandes du site quand l'intégration e-commerce sera branchée (« Mia exécute », roadmap).

**Décision de v1.** L'écran n'existe dans aucune navigation tant que `GET .../orders` répond `disponible: false` (réponse toujours 200, contrat §4.7) ET que le secteur n'est pas e-commerce. La conception est figée maintenant (structure : liste des commandes — numéro, date, client, total, statut — tap → détail lecture seule, export CSV), l'implémentation attend l'intégration. Rien n'est affiché comme « bientôt » dans l'app : la règle C2 se traduit par l'absence, pas par un badge.

---

### Écran 12 — Prospects (secteurs immobilier / artisan / vitrine)

**Rôle.** Le pipeline des contacts capturés par Mia — l'écran où le chatbot devient du chiffre d'affaires.

**Structure.**
1. **Chips de qualification** : Tous · Chaud · Tiède · Froid · Information (`lead_type`, en mots — la couleur accompagne : `--erreur` pour chaud, `--alerte` tiède, `--info` froid, `--texte-discret` information).
2. **Liste de cartes lead** : nom, qualification en badge, extrait du message (`message`), âge (« il y a 2 h »), contact en boutons directs téléphone / e-mail (`tel:`, `mailto:`) — l'action primaire d'un lead est de rappeler.
3. **Tap → détail conversation** (écran 4, via `conversation_id`) : le lead vit dans sa conversation.

**Données.** `GET .../leads` (pagination `page`/`page_size` ; champs `name`, `email`, `phone`, `company`, `lead_type`, `status`, `intent`, `message`, `created_at`) · export CSV client-side.

**États.** Vide : « Aucun contact pour l'instant. Mia capture un contact dès qu'un visiteur laisse ses coordonnées. » + bouton « Tester la capture dans Mia en direct ». Filtre sans résultat : « Aucun contact chaud aujourd'hui — élargissez le filtre. » Hors secteurs concernés : écran absent de la navigation (voir §1.4).

**Interactions.** Balayage droit → rappeler (`tel:`) ; balayage gauche → écrire (`mailto:`). Pull-to-refresh.

**Moment.** Une carte « chaud » neuve porte le filet `--erreur` et le téléphone en bouton plein accent : le geste attendu (rappeler maintenant) est le plus court de toute l'app.

---

### Écran 13 — Messages ePerformance (v2)

**Rôle.** Le canal ePerformance → client (support, maintenance, nouvelles capacités) — explicitement hors mission (PLAN §3.1).

**Décision de v1.** Aucun écran. L'emplacement est réservé dans Réglages (une ligne « Messages d'ePerformance — bientôt » N'EST PAS affichée : la règle « bientôt » s'applique aux capacités de Mia côté visiteur ; côté app, une entrée non fonctionnelle n'est pas montrée). L'implémentation attendra le canal B4+ (v2).

---

### Écran + — Confidentialité (RGPD, obligatoire en v1, C4)

**Rôle.** Le lieu où le propriétaire exerce les droits du visiteur final et où la conformité est visible.

**Structure.**
1. **Cadre en français, trois encarts** :
   - **Qui voit les conversations** : « ePerformance agit comme sous-traitant du propriétaire du site. Seuls le propriétaire et les comptes qu'il crée (Opérateur, Lecteur) accèdent aux conversations de son site. Mia est l'assistante du site ; aucun nom d'agent ni de modèle n'est utilisé ni affiché. »
   - **Durée de conservation** : la rétention appliquée par la purge backend, affichée en clair (« Les conversations sont conservées [durée réelle fournie par le backend] puis supprimées automatiquement. ») — la valeur est fournie par la configuration serveur, jamais inventée côté app ; si le backend n'expose pas encore la valeur, l'écran affiche le texte convenu avec CHATBOT et un point de coordination est posé au journal (l'affichage est bloquant C4, la valeur ne peut pas être une approximation).
   - **Le cache hors ligne** : « L'app garde une copie chiffrée des conversations récentes sur ce téléphone. Elle est chiffrée, liée à votre session, et effacée à la déconnexion. »
2. **Exercer les droits d'un visiteur** : champ de recherche (même `q` que l'écran 3) → résultat(s) → tap → **feuille d'actions** sur la conversation : « Exporter les données » (JSON complet, téléchargé et partageable) et « Supprimer définitivement » (rôle Admin uniquement).
3. **Journal de conformité local** : les actions export/suppression de la session courante (le backend trace chaque opération en audit, `export_rgpd_conversation` / `suppression_rgpd_conversation`) — l'app affiche les siennes avec horodatage.

**Données.** `GET .../conversations?q=` (recherche du visiteur) · `GET .../rgpd/conversations/{id}/export` (Opérateur minimum) · `DELETE .../rgpd/conversations/{id}` (Admin uniquement).

**États.** Recherche sans résultat : « Aucune conversation trouvée pour ce nom, cet e-mail ou ce téléphone. » Suppression par un non-Admin : l'action n'est pas montrée (pas de bouton cadenassé) ; la feuille affiche seulement l'export. Erreur de suppression : encart + réessayer ; succès : écran de confirmation avec les compteurs renvoyés (« 12 messages et 1 contact supprimés » — champs `messages_supprimes`, `leads_supprimes` du contrat).

**Interactions.** **La suppression est doublement confirmée** : écran dédié listant ce qui sera supprimé (conversation, messages, contacts), case « Je confirme la suppression définitive », bouton qui reste inactif jusqu'à la case. Aucun geste rapide ne peut supprimer.

**Moment.** La conformité comme fonctionnalité : le propriétaire peut répondre « je vous l'exporte, je vous le supprime » en 30 secondes quand un visiteur l'appelle. C'est un argument de vente caché dans un écran d'obligation.

---

### Écran + — Compte et sécurité (transverse, dans Réglages)

**Rôle.** Le compte : identité, sécurité, session, thème.

**Structure.** Nom, e-mail, rôle · Changer le mot de passe (`POST /password`, rate limit 5/300 s affiché en cas de 429) · Vérification en deux étapes : état actif/inactif, activer (`/2fa/setup` + `/activate`), désactiver (`/2fa/disable`, mot de passe exigé — réservé client_admin) · Déverrouillage biométrique (passkeys/WebAuthn) : **v1.1** — la ré-authentification après 15 min d'inactivité se fait en v1 par mot de passe + code 2FA ; l'emplacement UI est décrit, la route de provisionnement de clé n'existe pas dans le contrat et ne sera pas simulée · Appareils et sessions : « Vous restez connectée 30 jours sur cet appareil » (`remember_me`) + bouton « Se déconnecter partout » (efface le cache chiffré local — la purge hors ligne est locale et immédiate) · Thème : clair / sombre / automatique · À propos : version de l'app, lien vers le site ePerformance.

---

## 4. Les parcours de bout en bout (comptage de gestes)

Un geste = un tap, une saisie de champ, un balayage. Les saisies complètes de clavier comptent pour le champ, pas par lettre.

### (a) Première connexion → changement forcé → 2FA → onboarding

| # | Geste | Écran |
|---|---|---|
| 1 | Ouvrir le lien de livraison (l'app s'ouvre sur Connexion) | 1 |
| 2 | Saisir l'e-mail (autocomplétion du gestionnaire) | 1 |
| 3 | Saisir le mot de passe temporaire | 1 |
| 4 | Tap « Se connecter » | 1 → 1b |
| 5 | Saisir le nouveau mot de passe (confirmation auto-vérifiée à la saisie) | 1b |
| 6 | Tap « Définir mon mot de passe » | 1b → 1c |
| 7 | Tap « Configurer la vérification en deux étapes » | 1c |
| 8 | Scanner le QR avec l'app authentifiante (hors app Mia) | 1c |
| 9 | Saisir le code à 6 chiffres | 1c |
| 10 | Tap « Activer » | 1c → 0 |
| 11 | Tap « Tester Mia » (étape 1 de l'onboarding) | 0 → 10 |
| 12 | Poser une question à Mia | 10 |
| 13 | Fermer (glisser vers le bas) | 10 → 0 |
| 14 | Tap « Suivant » (étape 2) puis « Terminer » (étape 3, geste fusionné du balayage final) | 0 → 2 |

**Total : 14 gestes**, dont 1 hors app. Objectif de conception : ≤ 16. Aucun écran mort : chaque étape produit un état visible immédiatement.

### (b) Conversation escaladée → notification → prise en main → réponse → rendu de la main

| # | Geste | Écran |
|---|---|---|
| 0 | La push arrive (0 geste — le propriétaire ne cherche rien) | système |
| 1 | Tap la notification (deep-link direct sur la conversation) | 4 |
| 2 | Tap « Prendre la main » (le bandeau glisse, composeur monte, focus auto) | 4 |
| 3 | Saisir la réponse (réponses rapides : 1 geste de plus si tap) | 4 |
| 4 | Tap « Envoyer » (bulle optimiste immédiate) | 4 |
| 5 | Tap « Rendre la main à Mia » | 4 |
| 6 | Tap « Confirmer » (feuille de confirmation) | 4 |

**Total : 6 gestes du verrouillage au rendu de la main.** C'est le parcours critique du SaaS : il est mesuré en CI (trace Playwright, §6) avec un budget de 4 s d'exécution totale sur mobile d'entrée de gamme.

### (c) Activer / désactiver une compétence

Réglages (1) → Compétences (2) → bascule (3). **3 gestes**, effet immédiat, toast « Annuler » 5 s. Désactivation du dernier thème actif : +1 confirmation. Toutes / aucune : +1 confirmation.

### (d) Régler les horaires

Réglages (1) → Horaires (2) → interrupteur du jour (3) → régler le créneau (4) → (+1 si second créneau) → enregistrement automatique (0 geste). **4 à 6 gestes**. Fermeture exceptionnelle : +3 (bouton, dates, motif). La validation est locale et continue : aucun écran d'erreur modal.

### (e) Exercer le droit RGPD d'un visiteur (export puis suppression)

| # | Geste | Écran |
|---|---|---|
| 1 | Réglages → Confidentialité | + |
| 2 | Saisir le nom / e-mail du visiteur | + |
| 3 | Tap le résultat | + |
| 4 | Tap « Exporter les données » (le JSON se télécharge) | + |
| 5 | Tap « Supprimer définitivement » | + |
| 6 | Lire l'écran de confirmation, cocher « Je confirme » | + |
| 7 | Tap « Supprimer » | + |

**Total : 7 gestes, dont 2 de confirmation volontaire** — la friction est placée exactement là où le droit l'exige, nulle part ailleurs. Rôle Admin requis (l'export seul : 4 gestes, Opérateur). Chaque étape est tracée en audit côté backend, affichée dans le journal local de l'écran.

---

## 5. La stack, tranchée

**Décision : deux livrables, deux budgets, un seul dépôt (le widget), une entrée Vite chacun.**

1. **La landing** : HTML statique pur — zéro framework, contenu dans le balisage, indexable sans JavaScript, consommant `eperf.css` (c'est la convention imposée et celle du portail `/application`). Un seul fichier d'entrée Vite, aucun runtime JS au-delà des micro-interactions écrites à la main (sélecteur de secteur, scrolles).
2. **L'application** : **Preact 10 + `@preact/signals` + wouter, en TypeScript, entrée Vite dédiée `app.html`** (PWA installable), dans le dépôt du widget (`toolkit_eperformance/eperformance-widget/`), aux côtés de l'app actuelle.

**Justification contre les cinq critères demandés :**

| Critère | Décision |
|---|---|
| **Un bundle ou deux** | **Deux, délibérément.** La LP n'a pas besoin de framework (et l'indexation sans JS l'interdit de facto) ; l'app n'a pas besoin d'être indexée. Un bundle commun ferait payer à la LP un runtime qu'elle ne consomme pas et à l'app un poids de document qu'elle ne veut pas. Le CSS canonique est le seul actif partagé — c'est le vrai contrat commun, pas le JS. |
| **La PWA existante** | L'infrastructure (manifeste, service worker, invite, hors-ligne Lighthouse 100) est agnostique du framework : elle est réutilisée telle quelle, les précache mis à jour pour le shell `app.html`. Le TWA Android (`twa-manifest.json`) pointe le même shell. |
| **Performance mobile (priorité absolue)** | Preact : ~4,5 KB gzip de runtime, ~1,5 KB signals, ~1,5 KB wouter — **moins de 8 KB gzip de framework**. Vue 3 avec routeur : ~34 KB gzip. L'écart se paie deux fois : au LCP (le coût le plus visible sur réseau moyen) et au démarrage (parsing/exécution JS sur mobile d'entrée de gamme). Le budget §6 (≤ 45 KB gzip tout compris hors polices) n'est tenable avec marge qu'ici. |
| **Maintenabilité par un agent** | Preact est un sous-ensemble de l'API React — la base de code la plus documentée qui existe, avec signals pour l'état (pas de gestion d'état à apprendre : `.value` réactif). L'app vit dans son répertoire `src/app-mia/` avec ses conventions documentées dans le dépôt ; la cohabitation de deux frameworks est encadrée (un framework par entrée, jamais d'import croisé). Svelte et Solid sont exclus : surface de corpus d'entraînement plus faible et idiomes moins partagés. Le vanilla structuré est exclu : recoder diffing, routage et file de rendu à la main coûte plus de maintenance qu'un runtime de 8 KB. |
| **Cohabitation jusqu'au basculement** | La configuration Vite est déjà multi-entrées (quatre entrées existantes). La nouvelle app s'ajoute comme cinquième entrée sans toucher à l'existant ; l'app Vue actuelle (`application/mia`) reste servie inchangée jusqu'à la validation du propriétaire, puis retrait en un commit (suppression d'entrée). **L'app actuelle n'est PAS réutilisée** : son architecture (le widget visité transposé en app) est précisément ce que la refonte corrige ; on en reprend les leçons d'endpoints, pas le code. |

**Conséquence pour le SDK** : gelé (contrat N3) — `src/sdk/` n'est pas importé par l'app ; les seuls partages autorisés sont les polices (`public/fonts`), le sprite d'icônes et les jetons CSS.

---

## 6. La performance, mesurée

**Priorité absolue du propriétaire : budgets chiffrés, vérifiés en CI, bloquants.**

### 6.1 Budgets

| Indicateur | Budget | Mesure |
|---|---|---|
| **Bundle initial JS (app, gzip)** | ≤ 45 KB (framework ≤ 8, code écrans ≤ 30, routeur/vendeur ≤ 7) | `size-limit` en CI sur les chunks d'entrée |
| **CSS initial** | ≤ 15 KB gzip (les 5 couches consommées, purge des composants LP non utilisés par l'app) | idem |
| **Polices** | Cormorant sous-ensemble ≤ 25 KB woff2, DM Sans ≤ 20 KB woff2, `swap`, non bloquantes | audit Lighthouse |
| **LCP** (écran Accueil, profil mobile, 4G lente) | ≤ 2,0 s p75 — objectif 1,5 s | Lighthouse CI + web-vitals |
| **INP** | ≤ 200 ms p75 — objectif < 100 ms (le tap sur un onglet ne doit jamais dépasser une frame) | web-vitals en page + trace Playwright |
| **CLS** | ≤ 0,05 (squelettes aux dimensions exactes du contenu ; polices avec repli métrique) | web-vitals |
| **Temps d'interaction après tap onglet** | ≤ 100 ms (fondu 150 ms inclus dans le budget d'impression, le rendu est synchrone) | trace Playwright, frames > 16 ms comptées |

### 6.2 Le hors-ligne chiffré (C4)

- **Contenu** : les 20 dernières conversations (listes + messages) et la dernière réponse `settings` — le minimum utile pour consulter hors connexion. Les leads, analytics et notifications restent en ligne.
- **Schéma** : IndexedDB ; chaque enregistrement chiffré **AES-GCM 256** ; clé dérivée **PBKDF2-SHA256 (250 000 itérations)** du jeton de session (salé par un sel aléatoire local) — la clé ne quitte pas le navigateur, elle est reconstruite au démarrage et **effacée à la déconnexion** (purge totale du compartiment, y compris les méta-données). Le service worker ne stocke JAMAIS de réponse API non chiffrée : le cache HTTP est désactivé pour `/api/`, le stockage passe par la couche chiffrée de l'app.
- **Hors ligne = lecture seule** : les écritures sont désactivées avec libellé explicite ; seul le marquage « lu » est mis en file (idempotent, rejoué au retour réseau).
- La mention est visible dans Confidentialité (§3, écran RGPD).

### 6.3 Stratégie de cache du service worker

| Ressource | Stratégie |
|---|---|
| Shell `app.html` + CSS + JS + polices + icônes | **Precache** à l'installation (hash de build) + `StaleWhileRevalidate` pour les mises à jour silencieuses |
| `GET /api/client/v1/*` | **NetworkFirst avec délai 3 s** : réponse réseau sinon retour à la couche chiffrée de l'app (le SW ne garde pas la réponse lui-même) |
| Mutations (`POST`/`PUT`/`DELETE`) | **Jamais cachées**, jamais rejouées automatiquement (sauf la file « marquer lu » gérée par l'app) |
| Landing (entrée LP) | Precache du document HTML et du CSS — navigation hors-ligne complète |

### 6.4 Comment on PROUVE la fluidité (mesures, pas des affirmations)

1. **Lighthouse CI** sur chaque commit : mobile, throttling 4G, sur les deux entrées (LP, app) et les deux thèmes pour l'a11y — seuil ≥ 95, standard du produit 97-100 ; régression = CI rouge.
2. **web-vitals dans l'app** (`web-vitals` lib, ~1 KB) : LCP/INP/CLS loggés en console en développement et agrégés localement en préproduction ; un tableau de bord de mesures est archivé à chaque fin de phase (le même protocole que les précédentes tâches du produit).
3. **Traces d'interaction Playwright** (profil Moto G, CPU 4× throttle) sur les 5 parcours de §4 : frames lissées, aucun jank > 50 ms, budgets de temps par parcours (parcours (b) ≤ 4 s total).
4. **Bundle** : `size-limit` en CI (les chiffres de 6.1), rapport `rollup-plugin-visualizer` archivé à chaque release.
5. **Contrastes** : le validateur du noyau (`eperf_core/validateurs/wcag.py`) est exécuté sur les paires de l'app à chaque tâche (l'empreinte des jetons est vérifiée clair et sombre, comme l'exige la CONSIGNE).
6. **Captures avant/après clair et sombre de chaque écran** : protocole harnais existant (112 maquettes reproductibles), exigées pour la validation du propriétaire.

---

## 7. Les maquettes à produire (validation du propriétaire)

**4 variantes des écrans clés, chacune un parti pris distinct — pas des nuances.** Toutes en clair ET sombre, toutes avec les jetons canoniques (ce qui change est la composition, jamais l'identité).

| Variante | Parti pris | Où elle gagne | Risque assumé |
|---|---|---|---|
| **V1 « L'atelier »** | La référence Jèko structurale assumée : KPI géant en haut, carte d'actions rapides surélevée, listes de cartes empilées, paramètres en catégories. La version « sûre et familière » | Adoptée en 10 secondes par un propriétaire qui connaît les apps bancaires | Moins distinctive |
| **V2 « Le fil »** | Éditorial : l'activité du site racontée comme un journal — une seule colonne chronologique (escalade 10 h 12, lead 9 h 47, 3 conversations cette nuit), titres Cormorant, beaucoup d'air, les KPI réduits à une ligne d'en-tête | La plus élégante, la plus « premium », la plus lisible pour un non-technique | Moins d'actions visibles à l'écran |
| **V3 « Le pupitre »** | Densité professionnelle : listes compactes, badges d'état systématiques, compteurs multi-colonnes, filtres persistants, cible l'Opérateur qui traite 30 conversations par jour | La plus « puissante » au sens throughput | Plus froide, plus exigeante pour un lecteur occasionnel |
| **V4 « La scène »** | Wow maximal : l'écran Accueil EST une scène Mia — le monogramme respire au centre, les événements arrivent en cartes flottantes autour, « Mia en direct » est un overlay permanent, révélation en cascade au moindre changement | La plus mémorable, la plus démo (captures de landing) | Le plus coûteux en mesure de performance, risque de décorer au lieu d'informer |

**Plan de maquettes** (24 planches) : Accueil V1-V4 × clair/sombre (8) · Conversations V1-V4 × clair/sombre (8) · Configuration (Réglages) V1 et V2 × clair/sombre (4) · Compétences V1 et V2 × clair/sombre (4). Chaque planche est légendée : jetons utilisés, contrastes des paires posées, état montré (vide / chargement / erreur / hors ligne en annexe séparée pour V1 et V4).

**Critères de choix du propriétaire** (lui sont soumis tels quels) : laquelle fait comprendre l'app sans explication ; laquelle donne envie de l'ouvrir chaque matin ; laquelle reste la plus rapide à produire sans dette.

**Recommandation de l'agent SITE** : V1 pour la structure, avec le bandeau vivant et la carte d'escalade de V2 (le « fil du jour » en tête d'Accueil) et la scène d'ouverture de V4 réservée à l'écran 10 uniquement — le wow concentré là où il raconte le produit, la sobriété partout ailleurs.

---

**Rappel des blocants suivis** : canal de test de l'écran 10 (flag `test`) à valider avec CHATBOT · durée de rétention RGPD à faire confirmer par le backend avant affichage · notes/tags et swipe « archiver » attendent leurs routes (chantier 3) — emplacements réservés, jamais simulés.
