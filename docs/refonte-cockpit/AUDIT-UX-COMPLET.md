# Cockpit ePerformance — audit UX/UI complet

19 septembre 2026. Fichier audité : `toolkit_eperformance/cockpit.html`
(2 600 lignes, 147 Ko) et son serveur `prospect_app.py` (75 routes).

**Cet audit remplace `AUDIT-ET-STRATEGIE.md`.** Ce premier document comptait
des `innerHTML` et des `onclick` : il mesurait le code, jamais l'interface. Il
ne pouvait pas voir qu'un écran était vide. Celui-ci a été fait en ouvrant
l'outil et en mesurant ce qui s'affiche.

---

## 0. Ce que l'audit précédent ne pouvait pas voir

Les deux documents précédents (`AUDIT-ET-STRATEGIE.md`, `CONCEPTION.md`)
tiraient leurs chiffres du fichier source : 101 `innerHTML`, 97 `onclick`,
0 `pushState`, 1 clé `localStorage`. Tous exacts, et tous hors sujet.

Le tableau de bord n'avait jamais été **ouvert**. Deux conséquences :

**On a audité un fichier au lieu d'un outil.** Trois défauts majeurs étaient
invisibles depuis le code et sautent aux yeux à l'écran : un mot du titre
absent, les barres de l'entonnoir vides, les boutons principaux noirs sur noir.
Aucun n'est détectable en lisant le source, parce que le source est correct —
c'est le **moteur CSS** qui les annule, pour une raison qu'on ne voit qu'en
mesurant le résultat.

**Un des trois documents contenait une recommandation fausse présentée comme
certaine.** Le concepteur visuel de la session précédente avait lu
`mockups/assets/css/eperf.css` — un ancien emplacement — au lieu du
`assets/css/eperf.css` réel, et en avait tiré « la correction la plus rentable
de tout ce document » : les polices viendraient de Google Fonts. Faux : le site
auto-héberge ses polices depuis longtemps. La même erreur s'est reproduite dans
la session d'aujourd'hui, sous une autre forme (voir §2.3).

**Méthode de cet audit.** L'application a été démarrée, ouverte dans un
navigateur en 1440×900, et mesurée par script dans la page : contrastes calculés
par composition alpha sur la chaîne d'ancêtres, débordement réel, hauteurs
réelles, noms accessibles, anneaux de focus, couleurs effectivement rendues.
Cinq écrans ont été ouverts et observés : Pipeline (accueil), Publications,
Actions rapides, Concurrence, plus les quinze modales recensées.

---

## 1. Ce que l'outil est réellement

Un poste de pilotage personnel, utilisé par une seule personne, sur un écran
d'ordinateur large. Cinq moments d'usage, à des cadences très différentes :

| Moment | Ce qu'il fait | Cadence | Durée |
|---|---|---|---|
| **Piloter** | décider quoi finir aujourd'hui | chaque matin | 15-20 min |
| **Produire** | sortir les publications | 2-3×/semaine | 45-90 min |
| **Acquérir** | trouver, qualifier, relancer | 1×/semaine | 1-2 h |
| **Veiller** | voir ce que font les concurrents | 1×/semaine | 30 min |
| **Régler** | fournisseur, compétences, apparence | rare, bloquant | — |

**Le volume de données est modeste** : 22 prospects, 7 publications. Ce n'est pas
un outil qu'on utilise parce qu'il tient un gros volume — c'est un outil qu'on
utilise parce qu'il **tient la mémoire** et **enchaîne les étapes**. Sa valeur
est dans le travail qu'il fait, pas dans ce qu'il affiche.

C'est le critère qui juge tout le reste : **chaque seconde passée à chercher un
bouton est une seconde prise sur le temps de production.**

---

## 2. Les huit défauts qui comptent

Classés par gravité réelle, c'est-à-dire par ce qu'ils coûtent à l'usage.

### 2.1 L'écran d'accueil était mort — CORRIGÉ

**Ce qui se voyait.** À l'ouverture, l'écran affichait le titre PIPELINE, une
zone entièrement vide, un champ de recherche, et en bas à droite une pastille
rouge « Serveur injoignable ». Aucun message d'explication, aucun bouton de
reprise. Un utilisateur qui ouvre cet outil conclut que rien ne marche.

**La cause, mesurée.** `load()` appelle `/api/state` et attend un objet complet :
`rate`, `stats`, `total`, `due_count`, `hot`, `taux_reponse`, `taux_conversion`,
`prospects`. La route renvoyait un **entier**.

Le commit `560cb1e` du 19 septembre à 03:14 — intitulé « branche le cockpit sur
les gabarits ePerformance » — a inséré une nouvelle fonction **entre le
décorateur et sa fonction** :

```python
@app.get("/api/state")          # ligne 138, du commit initial
def _gabarits_disponibles():    # ← inséré par 560cb1e
    return len(GABARITS)

def api_state():                # ← n'a plus de décorateur : code mort
```

`api_state()` existe toujours, intacte, mais n'est **plus routée**. Flask
répondait 500, le `catch` de `load()` affichait « Serveur injoignable » et
`render()` ne s'exécutait jamais.

**Correction appliquée.** Le décorateur est revenu sur `api_state()`. Vérifié :
`/api/state` répond 200 avec 22 prospects, 2 relances dues, 5 leads chauds,
0/10 requêtes IA consommées.

**Le défaut de conception qui reste.** Le message disait « Serveur injoignable »
alors que le serveur répondait parfaitement — il répondait 500. **Une erreur
technique a été traduite en une phrase qui envoie l'utilisateur chercher au
mauvais endroit.** La refonte doit distinguer « injoignable », « erreur du
serveur » et « données illisibles », et donner une action dans chaque cas.

### 2.2 Deux jetons de couleur se définissaient par eux-mêmes — CORRIGÉ

**Ce qui se voyait.** L'interface paraissait terne et inachevée. Concrètement :
le mot « Cockpit » du titre **n'apparaissait pas** ; les 19 boutons WhatsApp
principaux étaient **noirs sur noir** ; les barres de l'entonnoir du Pipeline
**n'étaient pas dessinées** ; la puce de filtre active **était invisible** ;
aucun bouton n'avait d'**anneau de focus**.

**La cause, mesurée.** Le bloc `:root` de `cockpit.html` contenait :

```css
--gold: var(--gold);
--wa:   var(--wa);
```

Deux **définitions circulaires**. En CSS, un jeton défini par lui-même est
invalide ; et surtout, quand un `var()` d'une déclaration ne se résout pas,
**la déclaration entière est annulée** — elle ne retombe pas sur la valeur
précédente de la cascade, mais sur sa valeur initiale.

D'où, mesuré dans la page :

| Élément | Propriété rendue | Conséquence |
|---|---|---|
| `.gold` (« Cockpit ») | `color: rgba(0,0,0,0)`, gradient `none` | texte **transparent** |
| `.btn.wa` ×19 | fond `rgba(0,0,0,0)`, texte `rgb(6,18,10)` | **noir sur noir** |
| `.fbar` (entonnoir) | gradient `none` | barre **invisible** |
| `.chip.on` | gradient `none`, texte `var(--bg)` | puce active **invisible** |
| `.btn:focus-visible` | `outline-style: none` | **aucun anneau de focus** |

**24 règles CSS** étaient annulées en silence, dont 8 fonds, 6 bordures, 2
anneaux de focus, 2 ombres et 23 couleurs de texte.

**Correction appliquée.** Les deux jetons ont reçu les valeurs canoniques du
site (contrat N1) : `--gold: #c9a96e`, `--wa: #25D366`. Mesuré après
correction : le dégradé du titre s'applique, les boutons WhatsApp sont verts,
les barres se dessinent, la puce active a son fond.

**La leçon, et elle est générale.** Un jeton qui ne se résout pas ne produit
**aucune erreur** : ni à l'écriture, ni au chargement, ni dans la console. Il
produit une interface qui a l'air d'avoir été conçue ainsi. C'est le pire mode
de défaillance possible pour un design system, et c'est celui qu'on a choisi.
**Il faut un contrôle automatique qui vérifie que chaque `var()` utilisé se
résout** — c'est la seule protection.

### 2.3 La police des chiffres n'existe pas

**Ce qui se voit.** Les six chiffres des KPI, les 22 scores, les 22 noms de
prospects et les 15 titres de modale s'affichent dans **la police par défaut du
navigateur**.

**La cause.** Quatre règles déclarent `font-family:'Outfit'` :

```
ligne  24  .kpi .v      les chiffres des indicateurs
ligne  43  .c-nom       les noms de prospects
ligne  50  .score       les scores
ligne  61  .modal h3    les titres de modale
```

Recherche `*outfit*` sur tout le dépôt : **zéro fichier**. Les 9 `.woff2`
présents sont 5 Cormorant Garamond et 4 DM Sans. Aucun `@font-face` pour Outfit
n'est déclaré, et **aucun repli n'est prévu** dans les quatre règles.

**Pourquoi c'est une régression et non un choix.** Le commit `560cb1e` a
précisément retiré la passerelle qui chargeait Outfit depuis Google Fonts
(interdit par le contrat : aucune dépendance externe, aucune police par CDN) —
**sans embarquer la police en remplacement**. La dépendance a été supprimée, le
besoin ne l'a pas été.

**Ce qu'il faut faire.** Embarquer Outfit en 3 graisses (400/700/900) comme les
autres polices, **ou** basculer ces quatre règles sur une police embarquée en
assumant le changement. La première option préserve l'intention ; la seconde est
plus économique. **Recommandation : embarquer**, parce que les chiffres d'un
poste de mesure méritent une fonte chiffrée et qu'Outfit pèse peu en `woff2`.

### 2.4 Le bandeau déborde de 305 px et casse un bouton sur quatre lignes

**Mesuré.** Le bandeau `.topbar` fait **137 px de haut**, contient 10 boutons
visibles, et demande **1 730 px** là où il en dispose de **1 425**. Débordement :
**305 px**, d'où une barre de défilement horizontale sur toute la page.

Les dix boutons ont un poids visuel **identique** : même hauteur (38 px), même
rayon, même bordure, même taille de texte. Rien ne dit lequel est le principal.
« Anti-ban », coincé dans la rangée, s'affiche sur **quatre lignes** et étire
tout le bandeau.

**Ce que ça coûte.** Le bandeau occupe **15 % de la hauteur d'un écran de
900 px** avant le moindre contenu, et le bouton « Scraper » est **coupé au bord
droit** — donc partiellement inaccessible.

**Ce qu'il faut faire.** La navigation ne doit pas vivre dans le bandeau. Un
rail latéral de 240 px la sort du chemin vertical, supprime le débordement par
construction, et rend le bandeau à sa seule fonction : l'identité, le compte, le
quota. « Anti-ban » n'est pas un bouton — c'est un **compteur**, et il doit
s'afficher comme tel.

### 2.5 Vingt-deux listes déroulantes sans nom, avec des valeurs techniques

**Mesuré.** Le fichier contient **32 `<select>`**, dont 22 visibles. **22 n'ont
aucun nom accessible** : ni `aria-label`, ni `name`, ni `id`.

Ils affichent **les valeurs brutes de la base** :

```
Nouveau   Contacté_J0   Relancé_J3   Relancé_J7   Froid
Répondu_Positif   Répondu_Négatif   En_Conversation   Converti   Refusé
```

« Contacté_J0 » et « Répondu_Positif » sont des **identifiants de programme**,
avec underscore et sans accents, présentés à un utilisateur francophone dans une
liste déroulante. C'est le signe qu'aucune couche de présentation n'a été prévue
entre le modèle de données et l'écran.

Un lecteur d'écran annonce ces 22 listes sans dire à quoi elles servent : elles
apparaissent comme « liste déroulante, Froid », vingt-deux fois.

**Ce qu'il faut faire.** Un libellé lisible par statut, et un nom accessible sur
chaque liste (le nom du prospect qu'elle modifie). Le statut ne devrait
d'ailleurs pas être une liste déroulante posée sur chaque carte : c'est une
**action**, elle appartient à un menu de la carte.

### 2.6 Aucun anneau de focus sur 196 des 198 éléments interactifs

**Mesuré.** Deux règles `:focus-visible` existent dans tout le fichier —
`.btn` et `.btn2`. Elles couvrent les boutons. Les **22 listes déroulantes
visibles, les 17 puces de filtre, les 22 cartes de prospect et les champs de
recherche n'en ont aucun**, et `.btn:focus-visible` était de toute façon annulée
par le jeton circulaire (§2.2).

Pire : plusieurs règles posent `outline:none` sans rien mettre à la place
(`select.st`, `input[type=text]`, `.field input`).

**Ce que ça coûte.** L'outil est inutilisable au clavier. Pour un poste de
pilotage consulté tous les matins, c'est une gêne quotidienne : impossible de
savoir où l'on est sans regarder la souris.

**Ce qu'il faut faire.** Une règle de focus unique et visible sur **tout**
élément interactif, et l'interdiction d'`outline:none` sans remplacement. La
règle existante — `outline: 2px solid var(--gold); outline-offset: 2px` — est
bonne ; elle doit simplement s'appliquer partout.

### 2.7 La couleur ne veut rien dire

**Observé.** Le panneau Publications aligne ses boutons en **quatre couleurs** :
vert plein (« Générer 7 pubs », « Calendrier 7j »), vert bordé (« Sync
serveur »), bleu (« Récupérer statuts »), orange (« Doctor »). Dans la liste des
prospects, une carte porte une **bordure verte** — et rien, nulle part,
n'explique ce que le vert signifie.

Le vert est le jeton WhatsApp (`--wa: #25D366`). Il est donc employé ici pour
dire « action principale », ce qui **entre en collision avec son sens premier** :
dans tout le reste du projet, le vert veut dire « WhatsApp ».

**Ce que ça coûte.** Une couleur qui ne porte pas de sens stable est du bruit
visuel. L'utilisateur apprend à l'ignorer, et perd le seul signal qui aurait pu
l'aider à balayer l'écran.

**Ce qu'il faut faire.** Une règle stricte sur la répartition :

- **or** — « ici tu agis » et « voilà l'état actuel ». Jamais autre chose.
- **vert** — réservé à WhatsApp. C'est déjà son sens ailleurs.
- **rouge** — destructif et erreur, uniquement.
- **ambre** — avertissement, en bordure seulement.

Soit **un seul bouton à fond plein par écran**, et la catégorie portée par
l'icône, pas par la couleur.

### 2.8 Rien ne survit à un rafraîchissement

**Constat.** Aucune URL par vue (`pushState` : 0, hash : 0), une seule clé
`localStorage`, aucun `beforeunload`. Un rafraîchissement ramène au Pipeline et
perd le filtre, la recherche, le brouillon en cours. Fermer l'onglet pendant une
génération de sept publications **perd la génération** — alors que le même
travail lancé par le cron nocturne, lui, survit très bien.

**Ce que ça coûte.** C'est le défaut qui fait **contourner l'outil**. Un outil
auquel on ne se fie pas pour garder le travail en cours n'est utilisé que pour
ce qu'on peut refaire.

**Ce qu'il faut faire.** Une URL par vue et par objet (`#/produire/publications`,
`#/acquerir/pipeline/PRO-0042`), et les tâches longues écrites côté serveur avec
un état, une progression et une reprise.

---

## 3. Ce qui fonctionne déjà bien

Un audit qui ne relève que les défauts est aussi peu fiable qu'un audit qui n'en
relève aucun. Quatre choses sont bonnes et doivent survivre à la refonte :

**Le panneau Concurrence.** Un formulaire de trois champs, deux boutons,
720×328. Rien à jeter. C'est le niveau de sobriété que les autres panneaux
devraient atteindre.

**La structure des Actions rapides.** Cinq cartes avec titre, description et
action — la bonne anatomie. Elle est gâchée par deux détails : le libellé du
bouton répète le titre de la carte (« Calendrier 7 jours » → bouton « Créer
calendrier »), et rien n'indique la progression d'une génération qui dure
plusieurs minutes.

**L'entonnoir du Pipeline.** Une fois le jeton `--gold` réparé, c'est la
meilleure visualisation de l'écran : une barre par statut, proportionnelle,
lisible d'un coup d'œil.

**Le socle de composants récemment écrit.** `.btn2`, `.carte2`, `.champ2`,
`.tableau2`, `.modale2`, `.badge2`, `.vide2`, `.squelette2`, `.progression2`
existent aux lignes 170-273, avec les jetons. **Ils ne sont utilisés nulle
part** — c'est un socle posé et non branché, mais c'est du travail juste qu'il
faut câbler, pas refaire.

---

## 4. L'inventaire des écrans

Ouverts et observés directement. Le reste est décrit d'après les quinze calques
`.overlay` du fichier.

| Écran | Forme | Taille | Boutons | État observé |
|---|---|---|---|---|
| **Pipeline** | page | plein écran | 198 éléments | 6 KPI, entonnoir, 6 puces, 22 cartes |
| **Publications** | modale | 1090×823 | 13 avant contenu | 2 rangées de chrome, encart Analytics vide |
| **Actions rapides** | modale | 600×792 | 6 | 5 cartes, bonne anatomie |
| **Concurrence** | modale | 720×328 | 2 | sobre, propre |
| **Ajout** | modale | — | 2 | formulaire à 8 champs |
| **Génération de message** | modale | — | — | — |
| **Qualification ICP** | modale | — | — | — |
| **Scraper** | modale | — | — | — |
| **Design** | modale | — | — | — |
| **Statut IA** | modale | — | — | — |
| **Paramètres** | modale | — | — | — |
| **Skills IA** | modale | — | — | — |
| **Configuration fournisseur** | modale | — | — | — |
| **Sync** | overlay | — | — | créé dynamiquement |
| **Édition** | overlay | — | — | créé dynamiquement |
| **Doctor** | overlay | — | — | créé dynamiquement |

**Le fait structurant : douze destinations sont des modales.** Ouvrir
« Publications » recouvre le tableau de bord d'un panneau de 1090 px qui
contient à lui seul treize boutons. On ne peut pas consulter une fiche en
laissant une analyse tourner, ni revenir en arrière, ni garder un lien.

---

## 5. La conception

Trois documents, dans `docs/refonte-cockpit/` :

| Document | Contenu |
|---|---|
| **`ARCHITECTURE-ECRANS.md`** | les 5 destinations, la répartition des 12 panneaux et 15 modales, la file du jour, les 4 parcours avec comptage de clics, le clavier, les points de rupture |
| **`SYSTEME-VISUEL.md`** | direction visuelle, échelles typographique et d'espacement, palette d'états, bibliothèque de composants, remplacement des emojis, grille |
| **ce document** | l'état des lieux et les preuves |

### Les cinq décisions structurantes

**La navigation quitte le bandeau.** Un rail de 240 px, cinq destinations, des
onglets à l'intérieur. Le bandeau tombe de 137 à 56 px et ne contient plus
jamais de navigation. Le débordement de 305 px disparaît par construction.

**Une URL par vue.** `#/produire/publications`, `#/acquerir/pipeline/PRO-0042`.
Coût nul — l'application est déjà servie par Flask — et gain immédiat : retour
arrière, favori, rechargement sans perte.

**Les modales disparaissent.** La règle : un objet déjà visible devient un
panneau latéral ; un ensemble homogène devient un onglet ; un objet avec un
cycle de vie devient une page ; un simple état disparaît. Aucune des quinze ne
survit comme modale.

**Les tâches longues deviennent des objets.** Toute action de plus de deux
secondes a un nom, un début, une progression, un résultat et une reprise. Elle
survit au rafraîchissement et à la fermeture de l'onglet. Le seul retour n'est
plus une notification qui disparaît en quatre secondes.

**L'or ne dit que deux choses.** « Ici tu agis » et « voilà l'état actuel ». Le
vert redevient WhatsApp. Un seul bouton à fond plein par écran.

---

## 6. Plan de travail

| Étape | Contenu | État |
|---|---|---|
| **0 — Débloquer** | `/api/state` routé, jetons circulaires réparés | ✅ **fait** |
| **1 — Réparer le visible** | police Outfit, anneaux de focus, débordement, libellés des 22 listes | à faire |
| **2 — Socle et navigation** | rail de 240 px, les 5 destinations, les URL, câbler `UI` et `Etat` existants | à faire |
| **3 — La file du jour** | le nouvel écran d'accueil | à faire |
| **4 — Les écrans** | les 12 panneaux répartis dans les 5 destinations | à faire |
| **5 — Les tâches longues** | persistance serveur, progression, reprise, annulation | à faire |
| **6 — Le détail** | les 65 emojis → icônes SVG, états vides, états d'erreur | à faire |

**L'étape 1 se fait avant tout le reste**, parce qu'elle rend l'outil utilisable
et qu'elle est courte. Les étapes 2 et 5 vont ensemble : une navigation neuve
sur un outil qui perd encore le travail en cours resterait un outil auquel on ne
se fie pas.

**Ce que je ne recommande pas** : réécrire les douze panneaux d'un coup. C'est
le scénario qui produit un cockpit cassé dont personne ne sait quelle moitié
fonctionne.
