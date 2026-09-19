# Cockpit ePerformance — architecture d'information et écrans

Suite de `CONCEPTION.md`, qui posait les cinq destinations sans dire ce qu'elles
contiennent. **Ce document tranche** : la carte de répartition des 12 panneaux et
des 15 modales, le contenu écran par écran, la file du jour, les tâches longues,
les parcours, les points de rupture et le clavier. Aucun « à définir ».

Décisions pures : **rien n'est implémenté ici**, aucun fichier de l'outil n'est
touché. Les contrats d'API à ajouter sont listés en fin de document (§9) parce
qu'un écran non servi n'est pas constructible.

---

## État mesuré au 19 septembre 2026 (sources de ce document)

| Mesure | Valeur | Où |
|---|---|---|
| `cockpit.html` | 2 600 lignes, 147 Ko | 12 fonctions `open*`, 15 calques `.overlay`, 98 `onclick`, 101 `innerHTML` |
| Éléments interactifs | 198 dont **32 listes déroulantes** | mesuré sur la page rendue |
| Routes Flask | **75**, dont **11 sous `/api/etat`** | `prospect_app.py` |
| Historique / URL | `pushState` : 0 · `location.hash` : 0 | aucune vue n'a d'adresse |
| `localStorage` | **1 clé** (`fb_token`, 2 appels) | filtres, recherches, brouillons : perdus |
| Toasts | détruits après **4 200 ms**, 136 appels | `toast()` |
| Données | 22 prospects (20 Froids, 2 Nouveaux) · 7 publications (7 brouillons, 0 publiée) | `prospects_tracking.csv`, `publications.csv` |
| Socle phase A | `UI` — 8 composants, écrit, **0 usage** | fin de `cockpit.html` |
| Client phase C | `Etat` — tâches, brouillons, vues, **0 usage** | fin de `cockpit.html` |
| Serveur phase C | `etat_cockpit.py` + 11 routes `/api/etat`, **opérationnels** | écriture atomique, purge à 6 h, `pourcent` borné à 92 |
| Registre fournisseur | **deux registres divergents** : `/api/ia-config` (5 valeurs) et `/api/config/llm-provider` (2 valeurs) | à unifier |

**Le socle existe, il n'est pas branché.** La phase A (composants) et la phase C
(persistance) sont écrites dans `cockpit.html` et dans `etat_cockpit.py`, et pas
une seule ligne de l'interface actuelle ne les appelle. Le travail décrit ici
n'est donc pas « construire la persistance » : c'est **câbler l'existant**, écran
par écran.

Deux conséquences que ce document prend pour acquises :

1. Une route dont la durée dépasse deux secondes doit rendre la main en moins
   d'une seconde avec un identifiant de tâche. Aujourd'hui chaque génération est
   un `fetch` synchrone : fermer l'onglet pendant les trois minutes de génération
   ne laisse ni trace ni reprise. **C'est le seul changement de contrat serveur
   qui touche le quotidien.**
2. Ce qui vit dans le navigateur ne survit à rien. Filtres, recherche, brouillons
   et tâches vont dans `/api/etat` — les routes sont déjà là.

---

## 1. Carte de répartition — les 12 panneaux et les 15 modales

### 1.1 La règle, cinq tests dans l'ordre

`CONCEPTION.md` proposait quatre tests. Je les garde et j'en ajoute un
cinquième, parce que les cinq « Actions rapides » ne relèvent d'aucun des quatre :
ce ne sont ni des objets, ni des ensembles, ni des cycles de vie, ni des états.
Ce sont **des verbes**.

1. **Objet déjà visible à l'écran ?** → panneau latéral, la liste reste derrière.
2. **Ensemble homogène d'objets du même type ?** → onglet.
3. **Cycle de vie propre, adressable, à revoir plus tard ?** → page avec URL.
4. **N'est qu'un état, un doublon ou un point d'entrée ?** → disparaît, fusionné.
5. **(nouveau) Commande sans objet — un verbe, pas un nom ?** → devient l'action
   de l'écran qui possède l'objet qu'elle produit.

Et une règle de bord, qui vaut pour tout : **une modale reste légitime seulement
si elle demande une décision sur un objet déjà visible et ne navigue nulle part.**
Dans ce cockpit, ce cas est couvert par la confirmation en deux temps (le bouton
devient « Confirmer »), donc **aucune des 15 modales ne survit sous forme de
modale.**

### 1.2 Le sort des 15 modales, nommément

Les **12 panneaux sont 12 des 15 modales** : les 15 calques `.overlay` du fichier
sont les 12 panneaux ouverts par `open*`, plus `syncOverlay`, `editOverlay` et
`doctorOverlay` (les deux derniers étant créés dynamiquement). Les 15 sont donc
traitées ci-dessous, aucune n'est écartée sans justification.

| # | Modale (id) | Fonction | Ce que c'est | Test | Destination |
|---|---|---|---|---|---|
| 1 | `pubsOverlay` | `openPubs` | Liste + 13 commandes sur les publications | 2 puis 3 | **Page** `#/produire/publications` + 4 onglets |
| 2 | `quickActionsOverlay` | `openQuickActions` | 5 verbes sans objet | 5 | **Disparaît** : chaque verbe rejoint l'écran de son objet |
| 3 | `settingsOverlay` | `openSettings` | 4 ensembles hétérogènes | 2 | **Onglets** de `#/systeme/apparence` (+ Test A/B → Atelier) |
| 4 | `providerConfigOverlay` | `openProviderConfig` | Choix global, une décision, un historique | 3 | **Page** `#/systeme/fournisseur` |
| 5 | `designOverlay` | `openDesign` | Produit une image pour **une** publication | 1 | **Panneau latéral** de l'atelier `#/produire/atelier/<ID>` |
| 6 | `iaStatusOverlay` | `openIAStatus` | Monitoring : status, logs, historique | 2 | **Onglet** `#/systeme/journal` (3 sous-onglets) |
| 7 | `scrOverlay` | `openScraper` | 3 sources qui produisent des prospects | 2 | **Onglet** `#/acquerir/sources` (3 modes d'une même action) |
| 8 | `msgOverlay` | `openMsgGen` | Agit sur un prospect | 1 | **Panneau latéral** de la fiche prospect, onglet Messages |
| 9 | `qualOverlay` | `openQualify` | Agit sur un prospect | 1 | **Panneau latéral** de la fiche prospect, onglet Qualification |
| 10 | `compOverlay` | `openCompetitor` | Crée un document à revoir | 3 | **Page** `#/veiller/concurrents`, fiche `#/veiller/concurrents/<slug>` |
| 11 | `addOverlay` | `openAdd` | Crée un prospect | 1 | **Panneau latéral** `#/acquerir/pipeline/nouveau` |
| 12 | `skillsPanelOverlay` | `openSkillsPanel` | Aide-mémoire (3 fiches) + Offres & Prix | 4 puis 1 | **Disparaît** ; l'aide passe dans les actions, le prix devient un panneau `#/prix` |
| 13 | `syncOverlay` | `doSync` | Journal d'une opération | 5 | **Tâche longue** ; seul le journal survit, dans le tiroir de tâches |
| 14 | `editOverlay` | `editPub` | Édite une publication visible | 1 | **Panneau latéral d'édition**, brouillon écrit à la frappe |
| 15 | `doctorOverlay` | `runDoctor` | Diagnostic système | 3 | **Page** `#/systeme/diagnostic`, atteignable depuis toute erreur |

Trois modales disparaissent en tant qu'écrans : `quickActionsOverlay`,
`skillsPanelOverlay`, `syncOverlay`. Aucune ne perd de fonction :

- **`quickActionsOverlay`** → les 5 verbes et leurs 5 routes sont redistribués,
  avec leur libellé final, dans le tableau 1.3.
- **`skillsPanelOverlay`** → ses 4 fiches décrivent 4 actions qui vivent
  désormais ailleurs (`Générateur de messages` → fiche prospect ; `Qualification
  ICP` → fiche prospect ; `Analyse concurrentielle` → Veiller ; `Offres &
  Pricing` → panneau `#/prix`). Un aide-mémoire qui décrit des boutons qui ne
  cohabitent plus est un mensonge : **la description se déplace dans l'action
  elle-même** (sous-titre d'une ligne, `title` d'un bouton). La route
  `/api/offer-pricing` reste, servie par le panneau Prix.
- **`syncOverlay`** → son seul contenu est `<div id="synclog">`, un journal. Un
  journal n'est pas un écran : il appartient à la tâche qui le produit (§5).

### 1.3 Les 13 boutons de Publications et les 5 cartes d'Actions rapides

Les 13 boutons du panneau Publications, dans l'ordre du fichier, plus le
sélecteur de fournisseur et le bloc Analytics qui les accompagnent, et leur
destination. C'est la liste la plus utile du document : elle supprime la seule
rangée d'écran qui précède tout contenu.

| Bouton actuel | Devenir | Où |
|---|---|---|
| Générer 7 pubs | « Nouveau lot » — action **primaire** de la page | En-tête de `#/produire/publications` |
| Calendrier 7j (49 pubs) | Un des trois formats de « Nouveau lot » (1 · 7 · 49) | `#/produire/nouveau` |
| Veille (suggestions) | « Suggérer des idées » | `#/veiller/idees` |
| Sync serveur | Tâche « Sync serveur » (journal conservé) | Menu de page + `Aujourd'hui` si en retard |
| Récupérer statuts serveur | Tâche « Récupérer les statuts » | Menu de page (groupe « Serveur ») |
| Doctor | Lien « Diagnostic » | `#/systeme/diagnostic`, et dans **tout** état d'erreur |
| Sélecteur fournisseur (5 valeurs) | **Supprimé** — doublon divergent du vrai registre | `#/systeme/fournisseur` |
| Fermer | Disparaît : c'est une page | — |
| Toutes les images | Action de lot sur la sélection | Menu de page (groupe « Lot ») |
| Recréer images | Action de lot destructive, confirmation en deux temps | Menu de page (groupe « Lot ») |
| Programmer tout | « Programmer la sélection » (créneaux préremplis) | Barre de sélection de l'onglet À valider |
| Reprogrammer échecs | Ligne « Échecs » de la file du jour | `#/aujourdhui` + menu de page |
| Archive | Onglet (ensemble homogène) | Onglet `Archives` |
| Tout supprimer (zone batch) | Zone dangereuse, hors du flux quotidien | `#/systeme/preferences` |
| Bloc Analytics + « Actualiser » | Chargé à l'ouverture, jamais un bouton à cliquer | `#/veiller/performance` |

Les 5 cartes d'Actions rapides (« titre + description + bouton qui répète le
titre » — trois fois la même information) :

| Carte | Route | Devenir |
|---|---|---|
| Générer post complet | `/api/quick/full-post` | `#/produire/nouveau`, mode « 1 publication complète » |
| Calendrier 7 jours | `/api/quick/weekly-batch` | `#/produire/nouveau`, mode « 7 publications » |
| Export ZIP | `/api/quick/export-zip` | Onglet `Archives`, bouton « Exporter le mois » |
| Batch vidéo | `/api/quick/batch-video` | Atelier, action sur les 7 lignes sélectionnées |
| Régénérer échecs | `/api/quick/retry-failed` | `#/aujourdhui`, zone Échecs (« Réessayer ») |

### 1.4 Les modales déguisées : 6 `prompt()` et 16 `confirm()`

Elles ne sont pas dans les 15 — elles n'ont ni titre ni mise en page — mais ce
sont les pires, parce qu'elles bloquent le fil du navigateur et ne se mettent pas
en forme.

| Appel | Ce qu'il fait | Devenir |
|---|---|---|
| `prompt()` programmer une publication | saisit `YYYY-MM-DD HH:MM:SS` | Le panneau Programmer : 3 créneaux proposés + champ date |
| `prompt()` × 3 `scheduleAllModal` | date, mode (« tape 1, 2 ou 3 »), incrément | Un seul écran de programmation : liste des publications, créneau par ligne, incrément réglable par curseur |
| `prompt()` numéro WhatsApp | corrige un numéro manquant | Panneau latéral de la fiche, champ téléphone prérempli |
| `prompt()` type d'animation vidéo | « tape 1, 2, 3 ou 4 » | Sélecteur à 4 vignettes dans l'Atelier |
| `confirm()` × 13 | stopper les relances, générer 49 publications, supprimer une publication, publier maintenant, sync serveur, récupérer les statuts, toutes les images, recréer les images, reprogrammer les échecs, vider l'archive (× 2), calendrier 7 jours, batch vidéo | **Confirmation en deux temps, sur place** : le bouton devient « Confirmer » (mode destructif) pendant 6 s |
| `confirm()` × 3 `deleteAllModal` | deux confirmations + « supprimer les images ? » | Zone dangereuse de `#/systeme/preferences`, avec saisie du nombre de publications à supprimer |

---

## 2. Les cinq destinations, écran par écran

### Conventions communes

**Cadre fixe** (sur les cinq destinations) :

- Rail gauche 240 px : 5 destinations, compteur à droite de chaque libellé
  (`Aujourd'hui 6`, `Produire 7`…), un seul élément actif à la fois.
- Bandeau haut 56 px : recherche globale (toutes destinations), indicateur
  anti-ban (`used/limit` de l'heure), bouton tâches (pastille du nombre de tâches
  en cours), badge fournisseur, horloge de dernière synchro.
- Barre d'onglets de la destination, sous le bandeau.
- Bandeau de tâches en bas du rail (permanent, jamais masqué, §5).
- Le **compte client** est un sélecteur du bandeau, pas un niveau de navigation :
  un compte à la fois. Il est affiché quand `client` existera dans les CSV
  (aujourd'hui absent — la migration n'est pas du ressort de ce document).

**Quatre états obligatoires par écran**, avec le vocabulaire du socle `UI` :

| État | Rendu |
|---|---|
| **Chargement** | Squelettes à la forme du contenu (le `UI.squelette` existe), jamais un spinner seul. Pour les blocs lents : nommer l'étape, pas « Chargement… » |
| **Vide** | Les 4 cas de `UI.vide` : `rien` (aucune donnée), `recherche` (aucun résultat), `horsligne` (données locales), `echec` (le service n'a pas répondu). Toujours **une** action |
| **Erreur** | La cause en clair + « Réessayer » + « Diagnostic » (mène à `#/systeme/diagnostic`) |
| **Partiel** | Bandeau ambre : « 3 sources sur 4 · dernière synchro à 14 h 12 » + « Resynchroniser ». Ce qui est présenté reste utilisable |

**Interdits dans les cinq destinations** : un bouton dont le texte répète un
titre au-dessus ; plus d'un bouton vert plein par écran ; un `<select>` de moins
de 5 options (devient une rangée de puces) ; un `<select>` de filtre (devient des
puces) ; « Actualiser » comme contenu d'un bloc vide.

---

### 2.1 AUJOURD'HUI — `#/aujourdhui`

**Rôle** : décider quoi finir aujourd'hui. Ouverture par défaut : `#/` redirige
vers `#/aujourdhui`. C'est la seule destination sans onglets.

**En arrivant**, l'utilisateur voit : le titre du jour (« vendredi 19 septembre —
6 éléments, dont 2 bloquants »), puis des **lignes de décision**, une par
élément à traiter. Aucun KPI, aucun graphique, aucun entonnoir : ce sont des
mesures du monde, pas des décisions. Détail complet en §3.

**Blocs** : le résumé du jour (1 ligne) · zone *Ce qui bloque* · zone *Ce qui a
échoué* · zone *Ce qui attend une décision* · zone *Ce qui tourne* · pied *État
du système*. Les lignes sont des `UI.carte` variante `ligne`.

**Actions possibles** : par ligne — une action primaire, une secondaire, un menu
`⋯` (Reporter à demain · Ignorer · Copier le lien). En haut à droite : « Tout
voir » (menu des 5 destinations) et rien d'autre.

**Peuplement à la première seconde** : un seul appel réseau, `GET /api/aujourdhui`
(§9), qui agrège les routes existantes. La file doit s'afficher en un paint, pas
en huit `fetch`.

---

### 2.2 PRODUIRE — `#/produire/publications`

**Onglets** : `À valider · Programmées · Publiées · Archives`.
URL par onglet : `#/produire/publications?a-valider`, `?programmees`, `?publiees`,
`?archives`. Trois écrans annexes : `#/produire/nouveau`,
`#/produire/atelier/<ID>`, `#/produire/lot/<tache>`.

**En arrivant** (onglet À valider) : le titre `Publications`, à droite **un seul**
bouton primaire « Nouveau lot ». Puis la barre de sélection (« 7 sélectionnées ·
Tout valider · Programmer · Générer les images · Exporter · ⋯ ») et la liste.

**Blocs** :

1. **En-tête de page** : titre, compteur (« 7 brouillons · 0 programmée ·
   0 publiée »), bouton primaire « Nouveau lot », menu `⋯` (groupe *Lot* :
   générer toutes les images, recréer les images ; groupe *Serveur* : sync
   serveur, récupérer les statuts, diagnostic ; groupe *Archive* : exporter le
   mois).
2. **Barre de sélection** : apparaît dès une ligne cochée ; contient les actions
   de masse ; « Tout valider » n'est jamais armé par défaut.
3. **Tableau des publications** (`UI.tableau`, colonnes triables) : `Sélection ·
   ID · Aperçu (vignette 40 px ou carré vide) · Pilier · Plateforme · Statut
   (badge) · Créneau · Sortie (Post_ID ou raison d'échec) · ⋯`.
4. **Ligne dépliée** : le texte complet, les hashtags, le CTA, le chemin d'image,
   les métriques si publiée (Vues, Likes, Commentaires, Partages — les colonnes
   existent déjà dans `publications.csv`), et 4 actions : *Ouvrir l'atelier ·
   Éditer · Programmer · Publier maintenant*.
5. **Pied de tableau** : « 30 dernières sur N » quand la liste dépasse 30 — le
   code coupe aujourd'hui à 30 lignes sans le dire.

**Par onglet** :

- **À valider** — `Statut = brouillon`. C'est l'onglet du travail : on relit, on
  corrige, on valide. Une ligne sans image porte un badge `sans image` et
  l'action primaire devient « Générer l'image ».
- **Programmées** — `Statut = programmée`, groupées par jour, la première
  surlignée si elle tombe dans l'heure. Actions : *Programmer · Décaler ·
  Publier maintenant · Annuler la programmation*.
- **Publiées** — `Statut = publiée`, avec le `Post_ID` en lien sortant et les
  métriques. C'est ici qu'on répond à « est-ce que c'est bien sorti ? ».
- **Archives** — les deux archives, dans un même onglet sous deux
  sous-onglets : *Anti-répétition* (`publications_archive.csv`, ce qui a déjà
  été écrit — sert à ne pas se répéter) et *Sorties* (publications supprimées).
  Actions : parcourir, vider l'archive anti-répétition (zone dangereuse,
  confirmation en deux temps), exporter le mois en ZIP.

**Écran annexe — `#/produire/nouveau`** (remplace 2 boutons + 5 cartes) :
un formulaire unique à 4 champs — *Combien* (1 · 7 · 49), *Quand* (maintenant ·
ce soir 18 h · demain 8 h · à partir du…), *Piliers* (variés · un seul, au
choix), *Plateforme* (Instagram · Facebook · LinkedIn). Un aperçu de ce qui va
être produit (« 7 publications, 1 par jour à 8 h 00, piliers variés »), puis
**une** action : « Lancer ». Le lancement crée une tâche (§5) et renvoie à la
liste.

**Écran annexe — `#/produire/atelier/<ID>`** : l'atelier d'**une** publication.
Colonne gauche : le texte (zone d'édition, brouillon écrit à la frappe via
`/api/etat/brouillon/atelier-<ID>`), les hashtags, le CTA. Colonne droite :
l'image et ses variantes, le bouton *Générer l'image* / *3 variantes A/B*, le
bouton *Vidéo* avec le sélecteur à 4 vignettes d'animation, et la comparaison
**A/B** intégrée : les variantes s'affichent côte à côte, un clic enregistre la
préférence (`/api/settings/ab-preference`) — plus besoin de taper un chemin
d'image (aujourd'hui : deux champs de texte libres). C'est ici que vit
`designOverlay`, et c'est ici que vit le Test A/B.

**Actions possibles** : lot (valider, programmer, images, exporter, supprimer) ;
ligne (ouvrir, éditer, programmer, publier, copier) ; page (sync, pull,
diagnostic).

**États** :
- Vide (À valider) : « Aucune publication en attente. » + « Nouveau lot ».
- Vide (Publiées) : « Rien n'est encore sorti. » + « Voir les programmées ».
- Chargement : 6 lignes squelettes, en-tête déjà peint avec les compteurs
  précédents.
- Erreur : bandeau « Le serveur local n'a pas répondu » + « Réessayer » +
  « Diagnostic » ; la liste reste affichée si un chargement précédent a réussi.
- Partiel : quand `/api/publications/stats` répond et `/api/publications` non —
  l'en-tête est chiffré, le tableau affiche « Dernière liste connue, 14 h 12 ».

---

### 2.3 ACQUÉRIR — `#/acquerir/pipeline`

**Onglets** : `Pipeline · Sources · Messages`.

**En arrivant (Pipeline)** : la barre de filtres existante en puces (Tous · À
relancer · Nouveaux · Contactés · Réponses · Froids · Conclus) avec leurs
compteurs — **c'est ce qui marche déjà, on le garde tel quel** —, un champ de
recherche, les 22 cartes en grille, et un bouton primaire « Nouveau prospect ».
Ni KPI, ni entonnoir en haut de l'écran : l'entonnoir monte dans le bandeau de
l'onglet, sous forme d'une barre de répartition de 10 statuts unique et cliquable
(cliquer un segment filtre la liste).

**Blocs** :

1. **Barre de filtres** (puces avec compteur) + recherche + tri
   (Score · Ancienneté · Dernier contact).
2. **Répartition par statut** : une barre, 10 segments, une infobulle par
   segment, clic = filtre. Remplace le bloc « entonnoir » vertical actuel.
3. **Grille de cartes** : inchangée dans son contenu (score, nom, statut,
   téléphone, ville, secteur, lien page, date de contact, nombre d'envois,
   pastille pub), avec **une seule** rangée d'actions : *Relancer* (l'action due,
   selon la séquence), *Msg*, *ICP*, `⋯` (Stopper les relances · Corriger le
   numéro · Copier · Supprimer).
4. **Panneau latéral de fiche** — l'endroit qui remplace trois modales
   (`msgOverlay`, `qualOverlay`, et l'édition du numéro). Largeur 420 px, la
   liste reste visible et utilisable derrière. Trois onglets :
   - **Fiche** : les champs éditables en place (nom, ville, secteur, followers,
     pub active, notes), le statut, l'historique des envois (séquences J0/J+3/J+7
     et leurs dates), la date du dernier contact, le lien page.
   - **Qualification** : le verdict ICP (score, priorité, action, raisons, ICP
     fit). Lancé automatiquement à la première ouverture, **mis en cache** : une
     qualification ne se recalcule pas à chaque clic (aujourd'hui chaque clic
     rappelle `/api/qualify`).
   - **Messages** : les 3 variantes (AIDA, PAS, BAB) générées à l'ouverture,
     l'analyse psychologique repliée sous un « Pourquoi ces variantes », le choix
     d'une variante, et un bouton « Utiliser ce texte ». Le générateur garde la
     séquence (J0 · J+3 · J+7 · Réactivation) en puces, pas en liste déroulante.
   - Pied du panneau : *Envoyer sur WhatsApp* (ouvre `wa.me`, décrémente le
     quota, marque l'envoi) · *Reporter* · *Stopper les relances*.

**Onglet Sources** — remplace `scrOverlay`. Une seule tâche : **importer des
prospects**. Trois modes, en puces, un seul formulaire affiché à la fois :
*Pages qui diffusent des publicités* (token Meta, pays, requêtes) · *Commerces
et services* (catégorie, ville, rayon) · *Contacts .vcf* (fichier ou texte).
Sous le formulaire, **la table des résultats** (colonnes : *Sélection · Nom ·
Téléphone · Ville · Secteur · Indice (pub active, followers) · doublon*), avec
« tout cocher les nouveaux », le compteur de doublons et **une** action :
« Importer la sélection ». Le formulaire et les résultats coexistent : on ne perd
pas les résultats en changeant de mode.

**Onglet Messages** — les 4 séquences du moteur (J0, J+3, J+7, Réactivation) :
pour chacune, le texte type, les variables (`{nom}`, `{ville}`, `{secteur}`), le
nombre de prospects qui la recevront cette semaine, et une prévisualisation avec
un vrai prospect. Lecture seule au départ : on ne réécrit pas le moteur ici, on
le rend lisible — aujourd'hui il est invisible.

**États** :
- Vide : « Aucun prospect. » + « Importer » (mène à l'onglet Sources).
- Recherche sans résultat : « Aucun prospect pour "…" » + « Effacer la
  recherche » (le filtre actif est rappelé).
- Chargement : 6 cartes squelettes.
- Erreur : « Le serveur n'a pas répondu » + « Réessayer » ; la grille précédente
  reste affichée.
- Partiel : fiches affichées, qualification indisponible → l'onglet
  Qualification affiche « Indisponible — Réessayer », les autres onglets
  fonctionnent.

---

### 2.4 VEILLER — `#/veiller/concurrents`

**Onglets** : `Concurrents · Idées · Performance`.

**En arrivant (Concurrents)** : la liste des concurrents analysés (aujourd'hui :
aucune conservation — le résultat d'`analyze-competitor` vit dans un `<div>` et
meurt au rechargement). Chaque ligne : nom, niche, date d'analyse, nombre de
dimensions renseignées sur 7, statut (`à compléter`, `analysé`, `périmé de plus
de 90 jours`).

**Blocs** :

1. **En-tête** : « Analyser un concurrent » (ouvre le panneau latéral : nom,
   niche, URL — les 3 champs d'aujourd'hui, propres, gardés tels quels) +
   comparaison.
2. **Liste des concurrents** : une ligne par concurrent, sélectionnable.
3. **Comparaison** : deux concurrents côte à côte, dimension par dimension. La
   grille à 7 dimensions est produite par le serveur ; ce que l'utilisateur
   remplit est **enregistré** (état par dimension : vide · hypothèse · vérifié).
4. **Opportunités ePerformance** : le bloc `opportunités_eperformance` renvoyé
   par l'analyse, conservé avec la fiche, avec un bouton « En faire une
   publication » qui ouvre `#/produire/nouveau` prérempli du pilier et du sujet.
   C'est le lien qui manquait entre Veiller et Produire.

**Onglet Idées** — reçoit la veille de contenu (`/api/veille`) : les suggestions
(titre, pilier, source, enseignement) en liste, chacune avec « Utiliser »
(→ Nouveau lot prérempli) et « Écarter ». Aujourd'hui ce bloc s'affiche sous la
liste des publications, dans un `<div id="veilleResult">` partagé avec
l'archive — un conteneur pour deux fonctions, d'où l'effet de surprise.

**Onglet Performance** — reçoit `/api/analytics/summary` (le bloc « Cliquez sur
Actualiser »). Contenu : l'engagement agrégé par pilier (les Vues, Likes,
Commentaires, Partages existent par publication), la chronologie 7 jours, les
agents/producteurs les plus utilisés, la répartition par fournisseur. Chargé à
l'ouverture, sans bouton.

**États** : vide (« Aucun concurrent analysé » + Analyser) ; chargement
(squelettes de barres) ; erreur (cause + Réessayer) ; partiel (les 7 dimensions
arrivées, les opportunités non → « Opportunités indisponibles, réessayer »).

---

### 2.5 SYSTÈME — `#/systeme/fournisseur`

**Onglets** : `Fournisseur · Compétences · Apparence · Préférences · Journal`.
Plus une page hors onglets : `#/systeme/diagnostic`.

**Onglet Fournisseur** (remplace `providerConfigOverlay` et tranche la
divergence des deux registres) :

- **Un seul registre**. Les deux routes actuelles sont unifiées :
  `/api/config/llm-provider` devient la source, `/api/ia-config` son alias en
  lecture. Le `<select>` à 5 valeurs du panneau Publications disparaît — il
  écrit aujourd'hui dans un registre que la modale n'affiche pas.
- **Deux cartes** : DeepSeek (rapide, économique) et Claude Sonnet (premium),
  chacune avec son état **testé**, horodaté : « testé il y a 4 min — 320 ms ».
  Le test se lance à l'ouverture de l'écran, en tâche courte.
- **Une action** : « Choisir ». Elle écrit, teste, et met à jour le badge du
  bandeau dans le même geste. Pas d'« Enregistrer » séparé d'un « Test
  connexion » : c'est le même acte.
- **Un historique** : fournisseur actif par jour sur 30 jours (les générations
  enregistrent déjà `Genere_Par` dans `publications.csv`).

**Onglet Compétences** (remplace `skillsPanelOverlay`, qui décrit au lieu de
servir) : la liste des agents (`/api/agents`) et des compétences IA, mais
**opérationnelle** : pour chaque ligne — nom, ce qu'elle fait en une phrase, son
état (active, absente, en erreur), sa dernière exécution, son taux de réussite,
et « Tester sur un exemple ». L'aide-mémoire devient un banc d'essai.

**Onglet Apparence** (absorbe 3 des 4 onglets de `settingsOverlay`) :
sous-onglets `Templates · Couleurs · Icônes`.
- Templates : la liste des templates signature, en aperçu miniature.
- Couleurs : la palette par pilier, **chargée à l'ouverture** (aujourd'hui :
  « Cliquez sur Actualiser pour charger les couleurs »).
- Icônes : la bibliothèque SVG et l'upload (max 50 Ko), l'upload ramenant à la
  grille au lieu d'écrire un résultat dans un `<div>`.
Le quatrième onglet, **Test A/B**, part dans l'Atelier (§2.2) : comparer deux
images est un geste de production, pas un réglage.

**Onglet Préférences** : les réglages qui ne sont ni structurels ni visuels —
destination d'ouverture, densité d'affichage (compact · confortable), seuils de
la file du jour (âge des brouillons, horizon des relances), **et la zone
dangereuse** : vider l'archive anti-répétition, supprimer toutes les publications
(avec saisie du nombre), supprimer les images locales.

**Onglet Journal** (absorbe `iaStatusOverlay`) : les trois vues d'aujourd'hui en
sous-onglets — *État des API*, *Logs des 20 dernières générations*, *Historique
des 50 dernières*. Plus la partie qui manque : **les tâches** (§5), en cours et
récentes, avec leur durée et leur résultat. Le bouton « Actualiser » de chaque
bloc est remplacé par un rafraîchissement automatique de 15 s quand l'onglet est
visible, avec l'heure de la dernière actualisation affichée.

**Page Diagnostic** — `#/systeme/diagnostic`, hors onglets, atteignable depuis
**tout** état d'erreur de l'outil (le bouton « Diagnostic » y mène). C'est
`runDoctor` : une liste de vérifications (Playwright, clé DeepSeek, serveur LWS,
endpoints), chacune avec son verdict, sa cause probable et sa correction. Une
tâche « Lancer le diagnostic » plutôt qu'un `toast` de 4,2 s.

**États** : vide (Compétences sans agent installé → « Aucun agent détecté » +
Diagnostic) ; chargement (lignes squelettes) ; erreur (« Le fournisseur ne
répond pas — 401 » + « Tester » + « Diagnostic ») ; partiel (Journal : « 18
entrées sur 20, la dernière page n'a pas répondu »).

---

## 3. La file du jour — contenu exact

Elle n'existe pas. Voici ce qu'elle agrège, dans quel ordre, et comment chaque
ligne se résout.

### 3.1 Principe

Une seule question : **« Qu'est-ce que je finis aujourd'hui ? »**. Une ligne =
une décision, pas une mesure. Un KPI n'entre dans la file que s'il demande une
action (un quota atteint est un bloquant ; un taux de conversion ne l'est pas).
**Douze lignes maximum** ; au-delà, chaque zone affiche « et N autres » qui ouvre
l'écran concerné, filtré.

L'ordre est fixé par le **coût de l'inaction**, puis par l'échéance :

1. ce qui bloque tout le reste ;
2. ce qui a échoué ;
3. ce qui attend une décision humaine ;
4. ce qui tourne déjà ;
5. l'état du système, en lecture seule.

### 3.2 Zone A — Ce qui bloque (liseré rouge)

| Ligne | Source | Condition | Action primaire |
|---|---|---|---|
| Le fournisseur ne répond pas | `/api/config/llm-status` | dernier test en échec ou non testé depuis 24 h | « Voir le fournisseur » → `#/systeme/fournisseur` |
| Le serveur local est injoignable | échec de `/api/state` | la requête échoue | « Réessayer » |
| Quota anti-ban atteint | `S.rate.remaining = 0` | au moins une relance due | « Voir les relances » (elles partiront à la prochaine heure) |
| Diagnostic en échec | `/api/system-check` | `all_ok = false` et la dernière exécution date de moins de 24 h | « Diagnostic » → `#/systeme/diagnostic` |

Une ligne de cette zone ne se reporte pas : elle se résout ou elle reste.

### 3.3 Zone B — Ce qui a échoué (liseré rouge atténué)

| Ligne | Source | Condition | Action primaire |
|---|---|---|---|
| Publication en échec | `publications.csv` | `Statut` ∈ {`echec`, `erreur`} | « Réessayer » (relance la tâche, unité par unité) |
| Image manquante ou en échec | `publications.csv` | `Image_Path` vide et `Erreur` non vide | « Générer l'image » |
| Tâche en erreur | `/api/etat/taches` | `etat = echoue` depuis moins de 24 h | « Voir la tâche » (ouvre son journal) |

Tri : plus ancien d'abord. La preuve affichée est la **raison** (`Erreur`
tronquée à 80 caractères), jamais « une erreur est survenue ».

### 3.4 Zone C — Ce qui attend une décision (liseré or)

| Ligne | Source | Condition | Actions |
|---|---|---|---|
| Publication à valider | `publications.csv` | `Statut = brouillon` | « Relire » (atelier) · « Valider » · `⋯` Regénérer |
| Programmée aujourd'hui | `/api/publications/stats` → `programmees_aujourd_hui` | créneau dans les 3 h | « Voir » · « Publier maintenant » · « Décaler » |
| Relance due | `S.due_ids` | le prospect est dans `due_ids` | « Ouvrir WhatsApp » · « Reporter à demain » · `⋯` Stopper |
| Réponse à traiter | `S.stats` | statut ∈ {`Répondu_Positif`, `En_Conversation`} | « Ouvrir la fiche » · « Marquer traité » |

Tri de la zone : échéance la plus proche d'abord, puis score décroissant, puis
ancienneté.

### 3.5 Zone D — Ce qui tourne déjà (liseré neutre)

| Ligne | Source | Condition | Actions |
|---|---|---|---|
| Tâche en cours | `/api/etat/taches` → `en_cours` | toujours | « Reprendre » (ouvre l'écran d'origine) · « Arrêter » |
| Brouillon en attente | `/api/etat/brouillons` | écrit depuis plus de 10 min | « Reprendre » (ouvre l'objet et son panneau) · « Jeter » |

Une tâche en cours s'affiche avec son étape et son pourcentage : « Génération des
publications — 3 sur 7 · 47 % · 1 min 20 ». Quand une tâche se termine, **sa
ligne reste jusqu'à acquittement** — c'est là qu'on remplace le toast de 4,2 s.

### 3.6 Pied — État du système (lecture seule, une ligne)

Fournisseur actif et horodatage de son dernier test · quota IA de l'heure ·
dernière synchro serveur · rappel des volumes (« 22 prospects · 7 publications »).
Aucune action, aucune couleur d'alerte.

### 3.7 Anatomie d'une ligne de décision

| Colonne | Contenu | Règle |
|---|---|---|
| 1 | liseré de gravité, 4 px | rouge = bloquant/échec · or = décision · neutre = en cours |
| 2 | nature, icône 16 px | publication, prospect, tâche, système |
| 3 | titre, une ligne, tronqué | le nom de la chose, pas le nom de l'action |
| 4 | preuve, une ligne, 13 px, gris | le fait mesuré : « brouillon depuis 3 j, sans image », « dû depuis 5 j », « étape 3 sur 7 » |
| 5 | âge ou échéance | « aujourd'hui 8 h », « il y a 2 h », « J+3 » |
| 6 | actions | 1 primaire (or), 1 secondaire, menu `⋯` |

Toute ligne se résout de trois façons, et les trois sont écrites côté serveur
(`POST /api/etat/vue/aujourdhui`) :

- **Fait** — la ligne disparaît, le compteur du titre décrémente et l'animation
  reste discrète (fond qui s'éclaircit en 200 ms, pas de sortie animée).
- **Reporté** — la ligne disparaît jusqu'à demain 8 h, avec une trace (`reportee`
  datée) consultable dans le tiroir de tâches.
- **Ignoré** — la ligne disparaît pour la journée. Le pied de zone affiche
  « 1 ignoré » : la file ne ment pas, elle range.

### 3.8 États de la file

- **Vide** : « Rien à décider. » puis une phrase vraie, construite à partir des
  données : « 7 publications sont programmées, la première demain à 8 h 00. »
  Plus une action : « Préparer la semaine » (→ `#/produire/nouveau`).
- **Chargement** : 6 lignes squelettes de hauteur fixe (pas de décalage de mise
  en page), titre du jour déjà peint.
- **Erreur** : si `/api/aujourdhui` échoue, la zone A affiche « Le serveur local
  n'a pas répondu » + « Réessayer ». Si une seule source interne a échoué, sa
  zone porte l'erreur et les autres s'affichent (jamais une page blanche pour un
  bloc manquant).
- **Partiel** : bandeau « Données locales — dernière synchro il y a 12 min ».

---

## 4. Le sort des 15 modales — récapitulatif de la règle appliquée

La règle est au §1.1, les verdicts au §1.2. Ce qui suit dit **pourquoi** les
cinq décisions non évidentes ont été prises ainsi.

- **`addOverlay` (créer un prospect)** — le test 3 (cycle de vie → page) aurait
  donné `#/acquerir/pipeline/nouveau`. Je tranche pour le **panneau latéral**,
  avec la même URL, parce que le geste ne s'arrête pas à la création : après
  l'ajout, il faut voir où le prospect atterrit, son score, et enchaîner sur la
  qualification. Une page pleine écran obligerait à revenir pour vérifier.
- **`designOverlay` (générer une image)** — teste 3, mais l'objet est **une**
  publication. En faire une page créerait un écran sans identité propre. Il
  devient un onglet de l'atelier : c'est le même objet, à côté du texte qu'il
  illustre.
- **`compOverlay`** — c'est bien un objet neuf, mais l'objet est **persistant**
  (une analyse qu'on revoit, complète, compare). Il a un cycle de vie, donc une
  URL.
- **`iaStatusOverlay`** — monitoring sans action. Trois ensembles homogènes
  (états, logs, historique) : trois sous-onglets d'un onglet du Système, pas une
  destination, parce qu'on n'y va pas par plaisir.
- **`doctorOverlay`** — page atteignable depuis toute erreur. C'est le seul
  écran dont l'URL doit pouvoir être envoyée à quelqu'un (« regarde ce
  diagnostic »), et il doit exister avant que l'outil ne marche, pas après.

Deux ajouts à la règle, appris de ce fichier :

- **Le test 5 (commande sans objet)** : sans lui, `quickActionsOverlay`
  n'aurait aucune case où tomber.
- **La confirmation en deux temps remplace le dialogue** : 16 `confirm()` natifs
  dans ce fichier, non stylables, bloquants, et l'un d'eux demande de choisir
  entre « OK » et « Annuler » pour dire oui ou non à la suppression des images.
  Un bouton qui devient « Confirmer » pendant 6 s est plus lisible et ne bloque
  pas le fil.

---

## 5. Les tâches longues

### 5.1 La règle

**Toute opération dont la durée médiane dépasse deux secondes est un objet
nommé, daté, suivi et annulable, qui vit sur le serveur.** Un toast de 4,2 s ne
rend compte que d'une action immédiate (un statut changé, un texte copié), et
seulement si l'action est réversible dans les 8 s (alors il porte « Annuler »).

Ce qui devient une tâche : génération de lot, calendrier 7 j, génération d'image
d'une publication, toutes les images, recréer les images, post complet,
calendrier hebdomadaire, batch vidéo, régénérer les échecs, export ZIP, scraping
(ads, cartes, .vcf), analyse concurrent, sync serveur, récupération des statuts,
veille, diagnostic, et la génération de message si elle dépasse 2 s.

Ce qui reste synchrone : tout le reste (statut, notes, filtres, qualifications
mises en cache).

### 5.2 Contrat

Le socle serveur est **déjà écrit** (`etat_cockpit.py`, 11 routes `/api/etat`) :
un identifiant, un nom, une étape, un pourcentage borné à 92 tant que la tâche
court, une date de début, une fin, un résultat, une erreur, une purge à 6 h.

Ce qui manque :

1. **Les routes longues doivent rendre la main.** Aujourd'hui
   `/api/publications/generate-batch` bloque la requête plusieurs minutes. Elle
   doit répondre `{ ok: true, tache: "t_ab12…" }` en moins d'une seconde et
   poursuivre dans un fil. Un verrou d'écriture protège `publications.csv` (déjà
   nécessaire aujourd'hui, deux générations simultanées le corrompraient).
2. **L'annulation coopérative** : `POST /api/etat/tache/<id>/annuler` pose un
   drapeau ; la boucle de génération le lit entre deux unités et s'arrête en
   marquant ce qui est fait. Sans drapeau, « Annuler » ne serait qu'un bouton
   qui ferme une fenêtre pendant que le travail continue.
3. **Le journal** : la tâche porte les N dernières lignes de son journal
   (`tache_maj(id, journal=[...])`), pour que le détail s'affiche sans avoir à
   rouvrir l'onglet qui l'a lancée.

### 5.3 Ce qui survit à quoi

| Événement | Ce qui survit |
|---|---|
| Rafraîchissement (F5) | Tout : la tâche est sur le serveur, l'interface la retrouve par `/api/etat/resume` |
| Fermeture de l'onglet | La tâche (fil serveur) ; à la réouverture, le bandeau annonce les tâches en cours |
| Plantage du navigateur | Idem — rien ne vivait dans le navigateur |
| Coupure réseau locale | La tâche continue ; l'interface passe en « Reconnexion… » et rattrape son retard par sondage |
| Plantage du serveur | Les unités déjà écrites dans `publications.csv` sont conservées ; la tâche reste `en_cours` et le bandeau propose « Reprendre » (les unités faites sont sautées) |

**Ce qui n'est jamais perdu** : une publication générée est écrite dans le CSV
**au moment où elle est produite**, pas à la fin du lot. Le lot est une
commodité d'affichage, pas une transaction. C'est déjà vrai
(`generated_so_far` est renvoyé aujourd'hui) ; l'interface doit enfin l'afficher.

### 5.4 Où ça s'affiche

1. **Bandeau de tâches**, en bas du rail, permanent. Forme : une ligne par tâche
   en cours (« Génération 3/7 · 47 % · 1 min 20 » + « Arrêter »), et, à la fin,
   une ligne **qui reste** : « Terminé — 7 publications · Voir ». Il ne
   disparaît qu'à l'acquittement (clic sur « Voir » ou sur la croix).
2. **File du jour**, zone D — une ligne par tâche, même contenu.
3. **À l'endroit de l'objet** : la ligne de publication concernée affiche sa
   progression à la place de ses boutons. On voit le lot avancer dans la liste,
   pas dans une bulle.
4. **Tiroir de tâches** (`t`, ou clic sur la pastille du bandeau) : en cours,
   puis les 20 dernières tâches avec durée, résultat et lien vers leur objet.
   C'est là que le journal de `syncOverlay` atterrit.

### 5.5 Reprendre, annuler, échouer

- **Reprendre (démarrage)** : au chargement, `GET /api/etat/resume` ; s'il y a
  des tâches `en_cours`, le bandeau s'ouvre déplié sur elles, avec « Reprendre »
  = aller à l'écran d'origine. Le sondage tourne à 3 s quand l'onglet est
  visible, à 15 s quand il ne l'est pas (`visibilitychange`).
- **Reprendre (après échec)** : « Réessayer » ne relance que les unités en échec
  — les routes existent déjà pour les images (`/api/quick/retry-failed`,
  `/api/publications/reprogrammer-echecs`).
- **Annuler** : confirmation immédiate, pas de dialogue. La tâche passe à
  `annule` avec `{ faits: 3, restants: 4 }`, et la file du jour propose
  « Reprendre les 4 restantes » — annuler n'est pas perdre.
- **Échouer** : message de cause + « Réessayer » + « Diagnostic ». Le résultat
  partiel est conservé et **affiché comme tel** (« 3 publications générées avant
  l'échec »). Aujourd'hui ce message existe déjà dans le code de `genBatch` — il
  est simplement détruit après 4,2 s.

---

## 6. Les parcours de bout en bout

Comptage : un **clic** = un appui sur un bouton, une case ou un lien. Une
**saisie** = une frappe dans un champ (comptée à part). Un **dialogue** = une
`confirm()` ou une `prompt()` native.

### 6.1 Publier un lot de 7 publications

**Avant — 6 clics, 3 saisies, 3 dialogues, aucune trace**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Publications » | la modale s'ouvre, 13 boutons avant le premier contenu |
| 2 | clic « Générer 7 pubs » | un toast qui meurt en 4,2 s ; le `fetch` bloque 1 à 4 min sans aucun indicateur |
| — | attendre | si l'onglet est fermé ici, rien n'annonce ni ne reprend le travail |
| 3 | clic « Programmer tout » | `prompt()` : date |
| 4 | saisie + OK | `prompt()` : « tape 1, 2 ou 3 » |
| 5 | saisie + OK | `prompt()` : incrément en minutes |
| 6 | clic « Récupérer statuts serveur » | `confirm()` — recommandé pour éviter la republication (bug connu) |
| 7 | clic « Sync serveur » | `confirm()` — pour que le cron publie |
| 8 | clic « Fermer » | — |

Non comptés mais réels : il faut **croire** que les 7 publications sont bonnes
sans les avoir lues (elles sont listées tronquées à 300 caractères, dans l'ordre
inverse), et il n'existe aucun moyen de savoir lesquelles sont sorties avant
d'aller voir sur Facebook.

**Après — 8 clics, 0 saisie obligatoire**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Produire » (ou `g p`) | |
| 2 | clic « Nouveau lot » | formulaire prérempli : 7 publications · 1 par jour à 8 h · piliers variés |
| 3 | clic « Lancer » | la tâche apparaît **immédiatement** dans la liste et dans le bandeau |
| 4 | (plus tard) clic sur « Terminé — 7 publications » | ouvre l'onglet **À valider** |
| 5 | clic sur une ligne, `Échap` | relecture dans l'atelier ; le brouillon est conservé |
| 6 | clic « Tout valider » | les 7 passent à `validée` ; le bouton n'est armé qu'après sélection explicite |
| 7 | clic « Programmer les 7 » | créneaux préremplis (demain 8 h + 30 min d'écart), modifiables par curseur |
| 8 | clic « Confirmer » | la sync serveur part en tâche |

Le compte est proche (6 → 8) mais la nature du parcours a changé sur trois
points qui pèsent plus que deux clics : **l'étape 3 est récupérable** (onglet
fermé, plantage, coupure réseau), **l'étape 5 n'existait pas** (il validait à
l'aveugle), et **l'étape 8 prouve la sortie** au lieu d'un toast.

### 6.2 Ajouter et qualifier un prospect, puis lancer une relance WhatsApp

**Avant — 8 clics, 8 saisies, 3 surfaces empilées**

`Ajouter` (1 clic + 7 champs) → `Ajouter (score auto)` (1 clic) → retrouver la
carte dans les 22 (1 saisie de recherche) → `ICP` (1 clic, modale, attente, lire,
`Fermer` : 1 clic) → `Msg` (1 clic, modale, attente, 3 variantes, `Copier` :
1 clic, `Fermer` : 1 clic) → bouton d'action J0 (1 clic). Rien n'est conservé :
fermer l'onglet à la 3e étape efface la qualification et les variantes.

**Après — 5 clics, 2 saisies, un seul panneau**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Acquérir » (ou `g a`) | |
| 2 | clic « Nouveau prospect » | panneau latéral ; la liste reste visible |
| 3 | saisie téléphone + nom | le reste est facultatif ; ville et secteur se déduisent du numéro et de l'URL |
| 4 | clic « Ajouter » | le panneau **bascule sur la fiche du prospect créé** ; la qualification se lance seule |
| 5 | clic sur la variante retenue | les 3 variantes J0 sont arrivées pendant la qualification |
| 6 | clic « Envoyer sur WhatsApp » | ouvre `wa.me`, marque l'envoi, décrémente le quota |

La relance J+3 est déjà planifiée par le moteur de séquence : elle apparaîtra
dans la file du jour le jour dit, sans geste. **C'est le vrai gain** : la
relance cesse d'être une chose à retenir.

### 6.3 Analyser un concurrent

**Avant — 6 clics, 3 saisies, résultat jetable**
`Concurrence` (1) → 3 champs → `Analyser` (1) → attendre → lire la grille →
`Fermer` (1). Le résultat vit dans un `<div>` : recharger la page le détruit, et
il n'existe aucun endroit où comparer deux concurrents.

**Après — 4 clics, 2 saisies, résultat conservé**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Veiller » (ou `g v`) | |
| 2 | clic « Analyser un concurrent » | panneau latéral : nom, niche (préremplie `mlm`), URL |
| 3 | saisie du nom + `Entrée` | la tâche part ; la fiche apparaît dans la liste en « analyse en cours » |
| 4 | clic sur la fiche terminée | grille 7 dimensions, opportunités, lien « En faire une publication » |

Le document est adressable (`#/veiller/concurrents/longrich-burkina`), il se
rouvre des mois plus tard, et deux fiches se comparent côte à côte.

### 6.4 Changer de fournisseur LLM

**Avant — 5 clics, et un doute**
Badge du bandeau (1) → radio Claude (1) → `Test connexion` (1) → attente →
`Enregistrer` (1) → `Fermer` (1). Le réglage existe **deux fois** : la modale
écrit `/api/config/llm-provider` (2 valeurs), le sélecteur du panneau
Publications écrit `/api/ia-config` (5 valeurs). Rien ne garantit que les deux
soient d'accord — et c'est ce que le doute de l'utilisateur traduit.

**Après — 2 clics (ou 1 par le badge), et un seul registre**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Système » (ou clic sur le badge) | les deux fournisseurs s'affichent avec leur état réel, testé à l'ouverture |
| 2 | clic « Choisir Claude » | écrit, teste, met à jour le badge du bandeau dans le même geste |

Le deuxième registre est supprimé, l'onglet Fournisseur est la seule autorité.

---

## 7. Points de rupture

Le rail ne disparaît **jamais** avant 1024 px : il se réduit. En dessous, il est
remplacé par une barre d'onglets — la navigation reste accessible au clic, et les
raccourcis clavier couvrent le reste.

| Largeur | Rail | Contenu | Panneau latéral | Grille de cartes | Tableaux |
|---|---|---|---|---|---|
| ≥ 1440 px | 240 px, libellés | max 1200 px, centré | 420 px, pousse le contenu (pas de voile) | 3 colonnes | toutes les colonnes |
| 1280–1439 px | 240 px, libellés | fluide | 400 px, **surimpression** avec voile | 3 colonnes | toutes les colonnes |
| 1024–1279 px | **56 px, icônes seules**, libellé en info-bulle et au survol | fluide, marges 16 px | 360 px, surimpression plein écran à partir de 1100 px | 2 colonnes | colonnes secondaires repliées dans le dépliage de ligne |
| 768–1023 px | **masqué** — barre d'onglets horizontale défilante + bouton `⋯` pour le reste | pleine largeur | plein écran (glisse par la droite) | 2 colonnes | liste empilée (une ligne = un bloc) |
| < 768 px | masqué | pleine largeur | plein écran | 1 colonne | liste empilée |

Décisions qui vont avec :

- **Ce qui ne rétrécit jamais** : le bandeau de tâches (il reste ancré en bas,
  même sur téléphone) et l'indicateur anti-ban (il reste dans l'en-tête). Ce sont
  les deux informations dont l'absence coûte de l'argent ou du travail.
- **Sous 768 px**, l'outil reste utilisable mais n'est pas optimisé : la file du
  jour et les relances fonctionnent (ce sont les seuls gestes qui se font debout,
  hors du bureau) ; l'atelier et la programmation demandent une confirmation
  explicite avant d'être ouverts.
- **Le passage 1280 → 1279 px ne doit pas déplacer le contenu** : le rail se
  réduit sans reflow du corps (largeur réservée constante pendant 200 ms).
- **Aucun défilement horizontal**, à aucune largeur : les tableaux larges
  replient leurs colonnes secondaires avant de déborder.
- **Densité** : deux valeurs, réglables dans `#/systeme/preferences` — compacte
  (hauteur de ligne 36 px, par défaut sur ≥ 1280 px) et confortable (44 px, par
  défaut en dessous).

---

## 8. Navigation au clavier

Un outil utilisé tous les jours ne se pilote pas à la souris. Les raccourcis
ci-dessous sont la spécification, pas une suggestion.

### 8.1 Ordre de tabulation

1. **Bandeau** : recherche globale → anti-ban (non focalisable, information) →
   pastille des tâches → badge fournisseur.
2. **Rail** : les 5 destinations, dans l'ordre d'affichage. Une seule est
   atteignable par `Tab` (l'active) ; les autres par les flèches (`↑`/`↓`),
   comportement `tablist` — c'est ce qui évite 5 arrêts à chaque passage.
3. **Barre d'onglets** de la destination : mêmes règles (`←`/`→`).
4. **Barre d'actions de l'écran**, puis **contenu** : dans un tableau, `Tab` sort
   de la liste et va aux actions suivantes (le parcours ligne à ligne se fait au
   clavier avec `j`/`k`) ; dans une grille de cartes, `Tab` parcourt les cartes.
5. **Panneau latéral**, s'il est ouvert : le focus y entre à l'ouverture, y
   reste (`Tab` boucle : titre → champs → actions → fermer → titre) et **rend le
   focus à l'élément déclencheur** à la fermeture. Sans ça, un panneau qui
   pousse le contenu est une souricière.

### 8.2 Échappement

- `Échap` ferme le panneau latéral s'il est ouvert ; sinon ferme le menu `⋯` ;
  sinon ne fait rien. **`Échap` ne ferme jamais une tâche en cours ni un
  formulaire contenant un brouillon non enregistré** — dans ce cas, il demande
  (« Garder le brouillon ? » en deux temps, ou fermeture qui conserve le
  brouillon côté serveur, ce qui est la réponse par défaut).
- Un clic sur le voile ferme le panneau (sauf si un champ est modifié et non
  enregistré : le voile clignote une fois au lieu de fermer).

### 8.3 Raccourcis

| Touche | Action | Portée |
|---|---|---|
| `g` puis `a` `p` `i` `v` `s` | Aujourd'hui · Produire · Acquérir · Veiller · Système | globale (deux touches, comme les outils de développement) |
| `/` ou `:` | focus recherche globale | globale |
| `Alt` + `1…5` | onglet n de la destination courante | destination |
| `n` | action primaire de l'écran (Nouveau lot · Nouveau prospect · Analyser un concurrent) | destination |
| `j` / `k` | ligne suivante / précédente | listes et tableaux |
| `Entrée` | ouvre la ligne (atelier, fiche, tâche) | listes |
| `x` / `Maj`+`x` | coche la ligne / coche tout | listes |
| `a` `p` `e` | avec une sélection : Valider · Programmer · Exporter | onglet À valider |
| `t` | ouvre/ferme le tiroir de tâches | globale |
| `w` | ouvre WhatsApp de la ligne courante | relances |
| `Ctrl`+`Entrée` | action primaire du formulaire (Lancer, Ajouter, Envoyer) | formulaires |
| `Ctrl`+`z` | annule la dernière action réversible (statut, report, validation) dans les 8 s | globale |
| `?` | feuille des raccourcis | globale |
| `Échap` | voir §8.2 | globale |

Règles de sûreté, parce qu'un raccourci mal placé fait plus de dégâts qu'il n'en
évite :

- **Aucun raccourci à une touche pour une action destructive.** Supprimer,
  vider, recréer : uniquement au clic, avec confirmation en deux temps.
- Les raccourcis sont **désactivés quand le focus est dans un champ** (`input`,
  `textarea`, `select`), sauf `Échap`, `Ctrl`+`Entrée` et `Ctrl`+`z`.
- Les raccourcis sont **annoncés** : chaque bouton qui en a un porte son
  raccourci dans son info-bulle (« Nouveau lot — n »).
- Le focus visible est l'anneau or 2 px du socle (`:focus-visible`) ; il ne
  disparaît jamais, et après une action il revient au déclencheur, ou à la ligne
  suivante si la ligne a disparu.
- Le bandeau des tâches porte `aria-live="polite"` : la fin d'une tâche est
  annoncée sans interrompre la frappe.

---

## 9. Ce que le serveur doit exposer en plus

Rien de ce qui suit n'existe. C'est la liste minimale pour que les écrans
ci-dessus soient constructibles — elle s'ajoute aux 75 routes sans en modifier
le contrat, sauf mention contraire.

| Route | Méthode | Pourquoi |
|---|---|---|
| `/api/aujourdhui` | GET | La file du jour en un seul appel (agrège `state`, `publications/stats`, `etat/taches`, `etat/resume`). Sans elle : 6 requêtes et 6 états de chargement pour peindre un écran |
| `/api/etat/tache/<id>/annuler` | POST | Annulation coopérative (§5.2) |
| `/api/etat/tache/<id>` | GET | Détail d'une tâche : journal, étapes, résultat — ajouté aux 11 routes `/api/etat` existantes |
| `/api/publications/generate-batch` | POST | **Changement de contrat** : rend `{ ok, tache }` immédiatement au lieu de bloquer plusieurs minutes |
| `/api/publications/weekly-calendar`, `/api/quick/*`, `/api/scrape/*`, `/api/analyze-competitor`, `/api/sync-pubs`, `/api/pubs-pull`, `/api/system-check`, `/api/veille`, `/api/publications/<id>/image`, `/api/publications/generate-all-images` | POST/GET | Même changement : identifiant de tâche au lieu de blocage |
| `/api/prospects/<ID>/fiche` | GET | Fiche complète (qualification en cache, messages, historique d'envois) pour le panneau latéral |
| `/api/concurrents` · `/api/concurrents/<slug>` | GET/POST | Persistance des analyses concurrent (`concurrents.json`, à côté des autres données) — aujourd'hui le résultat n'est jamais écrit |
| `/api/config/llm-provider` | POST/GET | **Registre unique** ; `/api/ia-config` devient un alias de lecture |

Deux précisions d'implémentation qui évitent des surprises :

- Les routes longues tournent dans un fil (`threading.Thread`) ; `prospect_app.py`
  doit servir avec `threaded=True`. Un verrou protège `publications.csv`.
- `etat_cockpit.py` écrit déjà de façon atomique et hors du dépôt git
  (`~/Documents/cockpit_etat.json`). Rien à changer : les tâches y sont déjà
  prévues, il suffit de les créer.

---

## 10. Ordre de construction

Un écran par session, vérifié isolément, dans cet ordre — calculé sur ce qui
débloque le plus :

1. **Le câblage de `Etat` et de `UI`** (le socle existe, il est mort) : brancher
   les composants dans `render()` et les 12 `open*`, puis remplacer les toasts
   des opérations longues par des tâches. C'est mécanique et ça change tout.
2. **Le rail, les URL, les onglets** : cinq destinations, `hashchange`, retour
   arrière, favoris. Sans lui, aucune des sections précédentes n'est
   adressable.
3. **Aujourd'hui** (§3) — la vue d'ouverture.
4. **Produire** (§2.2) — le plus gros volume (13 boutons, 15 000 lignes de
   sortie par semaine).
5. **Acquérir** (§2.3) — les trois modales remplacées par un panneau.
6. **Veiller** (§2.4), puis **Système** (§2.5) — les plus rares.
7. **Le clavier** (§8) — à la fin, mais avant la mise en service : il ne s'ajoute
   pas après coup, il se pose quand les écrans sont stables.

Les étapes 1 et 2 vont ensemble : un socle branché sans navigation ne se vérifie
pas, une navigation sans socle se réécrit. Après l'étape 2, chaque écran est
indépendant — c'est ce qui rend le reste planifiable sans risque.
