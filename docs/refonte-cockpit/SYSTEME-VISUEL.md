# Cockpit ePerformance — Système visuel

Document de conception. Rien n'est implémenté ici : ce document prescrit, valeur
par valeur, ce que l'implémentation doit produire.

**Sources mesurées** : `toolkit_eperformance/cockpit.html` (2 600 lignes, 147 Ko),
`site-eperformance/assets/css/eperf.css` (1 461 lignes, thème sombre),
`docs/adr/ADR-0003-direction-artistique-illustrations.md` (langage
« Instrumentation »), et l'état réel des données (22 prospects, 7 publications,
32 listes déroulantes, 198 éléments interactifs, 75 routes).

**Contrat** : les jetons de couleur et les noms de police sont gelés (contrat C3).
Ce document n'en renomme aucun. Il en ajoute quatre, nommés et justifiés en §4.

---

## 0. Deux corrections de fait, avant de concevoir

Deux affirmations du brief sont fausses sur le disque. Elles changent le travail,
donc elles passent en premier.

### 0.1 Outfit n'est pas embarquée — les chiffres du cockpit n'ont pas de police

Le brief annonce trois familles embarquées : Cormorant Garamond, DM Sans, Outfit.
**Outfit n'existe nulle part dans le projet.**

| Vérification | Résultat |
|---|---|
| Fichiers `.woff2` dans `assets/fonts/` | 9 — **5 Cormorant + 4 DM Sans**, aucun Outfit |
| `@font-face` dans `cockpit.html` | 7 — Cormorant 500/600/700, DM Sans 400/500/600/700 |
| `@font-face` dans `eperf.css` | 9 — les mêmes, plus Cormorant 500-italique et 600-italique |
| Recherche `*outfit*` sur tout `/home/ballo/OX6A` | **0 fichier** |
| `font-family:'Outfit'` dans `cockpit.html` | **4 règles** : `.kpi .v` (30 px), `.c-nom` (16 px), `.score` (14 px), `.modal h3` (19 px) |
| Google Fonts dans `cockpit.html` | **0** — le fichier est propre |

**Conséquence mesurée** : `font-family:'Outfit'` sans `@font-face` et sans police
de repli déclarée retombe sur la police par défaut du navigateur. **Aujourd'hui,
sur le poste de K. Stéphane, les 6 valeurs de KPI, les 22 scores de priorité, les
22 noms de prospect et les 15 titres de modale s'affichent dans une police qui
n'a jamais été choisie.** Outfit n'est référencée que dans `build_dashboard.py`
et `prospect_scraper.py`, et là elle est chargée par un `<link>` Google Fonts —
ce que le contrat interdit.

**Décision.** Outfit reste la police des chiffres — c'est un choix juste : un
chiffre mesuré mérite une fonte construite pour ça, et Cormorant (un Garamond
de titrage) rend des nombres mous à 14 px. Mais elle doit être **auto-hébergée**,
comme les deux autres. Coût : **3 fichiers, poids 400/700/900**, soit environ
66 Ko, ajoutés à `site-eperformance/assets/fonts/` à côté des 9 existants. Le
total passe à 12 fichiers `.woff2`, toujours **zéro dépendance Google Fonts**.

Poids retenus, justifiés par l'usage réel : `400` (compteurs secondaires),
`700` (noms de carte, scores, titres de modale), `900` (les grands nombres —
`.kpi .v` est aujourd'hui en `font-weight:900`).

**Repli obligatoire** pendant la transition, pour que l'absence de fichier
dégrade proprement au lieu de tomber dans l'inconnu :

```css
--police-chiffres: 'Outfit', 'DM Sans', system-ui, sans-serif;
```

### 0.2 Le socle de composants existe déjà — et il a quatre variantes de bouton

Les lignes 170 à 273 de `cockpit.html` contiennent un socle écrit lors d'une
passe précédente : `.btn2` (**4 variantes**, 3 tailles), `.carte2`, `.champ2`,
`.tableau2`, `.modale2`, `.badge2`, `.vide2`, `.squelette2`, `.progression2`.

Il n'est **utilisé nulle part** : le `<body>` appelle encore `.btn`, `.card`,
`.panel`, `.badge`. Le socle est écrit mais mort.

**Décision.** Ce document **ratifie le socle** — il est bien conçu, il consomme
les jetons, il porte `:focus-visible` et `prefers-reduced-motion`. Deux écarts
seulement, tous deux traités en §4 et §5 :

1. **4 variantes de bouton → 3.** Le brief plafonne à trois. `--destructif`
   devient un **modificateur** de `--secondaire`, pas une quatrième variante.
   Justification : « destructif » n'est pas un poids dans la hiérarchie d'action,
   c'est un avertissement posé sur une action secondaire. Un quatrième poids
   affaiblit les trois autres. C'est une modification de trois lignes.
2. **`.carte2--stat .valeur` est en `var(--police-titres)`** (Cormorant, 42 px)
   alors que tous les autres nombres du cockpit sont en Outfit. Incohérence :
   le même objet — un nombre mesuré — change de police selon le composant.
   Unifié sur `--police-chiffres`.

---

## 1. Direction visuelle

Le cockpit est un **poste de mesure**, pas un produit grand public. La différence
n'est pas esthétique, elle est fonctionnelle : un poste de mesure est jugé sur ce
qu'il permet de lire, pas sur ce qu'il donne envie de regarder.

Trois engagements, tenables et vérifiables.

### Engagement 1 — Le fond disparaît

`--bg` (#08080c) est un vide. Les surfaces (#101014, #14141a) sont posées dessus.
**Aucun dégradé, aucune ombre décorative, aucune texture.** En sombre, une ombre
ne se lit pas : ce qui sépare deux surfaces, c'est la **bordure à 1 px**.

*Pourquoi c'est tenable* : c'est déjà vrai du fond, et déjà faux ailleurs. Relevé
réel dans le fichier : **5 `linear-gradient`** (dont le titre en dégradé or
`linear-gradient(135deg, #7A6A3A, var(--gold), var(--gold2))` en
`background-clip:text`, les barres d'entonnoir `.fbar`, les puces actives
`.chip.on`) et **3 `box-shadow`** (dont la lueur verte `0 0 18px` des cartes dues).
**Huit dégradés et ombres à retirer.**

Les **2 `backdrop-filter:blur()` restent** : ils sont fonctionnels — l'un sur le
bandeau collant (le contenu défile dessous), l'autre sur le voile de modale (il
détache la boîte du fond). Ce ne sont pas des effets, ce sont des séparations.

*Critère de vérification* : zéro `linear-gradient`, zéro `box-shadow` dans le
fichier. Vérifiable par `grep`.

### Engagement 2 — L'or est un signal, pas une peinture

L'or dit **deux choses, jamais trois** :

1. **« Ici tu agis »** — l'action principale d'une vue, et rien d'autre.
2. **« Voilà l'état actuel »** — ce qui est sélectionné maintenant : l'onglet
   ouvert, la puce de filtre active, la ligne choisie, l'étape courante.

Il ne dit **jamais** : succès, erreur, avertissement, information, décoration,
titre de section, chiffre mis en avant.

*Pourquoi c'est tenable, et pourquoi c'est le point dur* : aujourd'hui l'or est
partout. Relevé dans le fichier : titre en dégradé or, `.kpi .v` (les 6 valeurs),
`.panel h2` (tous les titres de section), `.chip.on`, `.fbar` (toutes les barres
d'entonnoir), `.modal h3` (15 titres), `.variant` (bordure gauche), `.tst`
(bordure), `.b-Contacté_J0`, `.b-Relancé_J3`, `.s-WARM`, `.ratebox b`,
`.bqual`, `.fixbtn`… **Un signal qui s'allume partout n'est plus un signal.**
C'est la cause directe du défaut relevé « 6 indicateurs KPI de poids identique » :
si tout est or, plus rien n'est prioritaire.

*Le budget* : **moins de 5 % des pixels d'un écran.** Sur une vue ouverte, cela
veut dire : le bouton primaire, la puce active, l'onglet actif, l'anneau de
focus, et l'étape courante de l'entonnoir. Cinq objets au maximum.

*Critère de vérification* : sur une capture de n'importe quelle vue, compter les
éléments or. Au-delà de cinq, la vue est en faute.

### Engagement 3 — La densité est une politesse

Le site public respire à 96 px de section. **Le cockpit respire à 16 et 24.**
L'utilisateur est le même, mais il vient ici 5 fois par semaine pendant 45
minutes pour faire un travail, pas pour lire une page.

*Pourquoi c'est tenable* : la conséquence est mesurable. Un espacement de 24 px
entre cartes, 16 px à l'intérieur, permet d'afficher **les 22 prospects en
3 colonnes sur un écran de 1440 sans défilement vertical**, contre un défilement
de 1,7 écran aujourd'hui. Pour un utilisateur quotidien, le vide n'est pas de
l'élégance, c'est du défilement.

*Critère de vérification* : à 1440 × 900, la liste des 22 prospects tient dans
la zone de travail sans barre de défilement.

### Le test, en une phrase

**Une capture imprimée du cockpit doit ressembler à un cadran, pas à une
plaquette commerciale.** Si l'or domine, si une ombre se voit, si une zone de
50 px ne porte aucune information — c'est raté.

---

## 2. Échelle typographique

### Le raisonnement, avant les valeurs

Un écran consulté 20 minutes par jour impose trois contraintes qui n'existent
pas sur le site public :

1. **La lecture est un balayage, pas une lecture.** Il ne lit pas les libellés,
   il cherche le chiffre qui a changé. Donc **l'écart entre le chiffre et son
   libellé doit être énorme** — c'est le seul mécanisme qui rend un chiffre
   trouvable en un regard. Aujourd'hui `.kpi .v` est à 30 px et `.kpi .l` à
   12 px, soit un rapport de 2,5. C'est insuffisant pour 6 cartes identiques.
2. **Six niveaux suffisent, et un septième coûte.** Chaque niveau supplémentaire
   est une décision que l'implémenteur doit prendre 110 fois. Le cockpit en
   utilise aujourd'hui **onze** (10,5 / 11 / 11,5 / 12 / 12,5 / 13 / 13,5 / 14 /
   15 / 16 / 19 / 22 / 30). C'est la cause mécanique des incohérences visibles.
   **On passe à huit niveaux nommés, et on n'en sort pas.**
3. **Le plancher est 12 px, et il est conditionnel.** En dessous de 12 px, aucun
   texte. À 12 px, uniquement des capitales espacées de plus de 0,06 em, et
   uniquement en `--muted` **plein** — jamais en opacité réduite. `--muted`
   (#8b8b96) tient **5,63:1** sur `--card` et **5,44:1** sur `--card2` : vérifié,
   conforme AA même à 12 px. C'est ce qui autorise le plancher.

Aucune taille en dessous de 12 px, aucune taille intermédiaire de 0,5 px.

### L'échelle

Huit niveaux. La grille de taille est celle de l'espacement (§3) : 12 · 14 · 16 ·
18 · 20 · 24 · 32 · 40. **Aucune taille hors grille.**

| Niv. | Rôle | Police | Taille / interligne | Graisse | Couleur | Où |
|---|---|---|---|---|---|---|
| **T0** | Le chiffre de tête — la décision du jour | `--police-chiffres` | **40 / 44** | 900 | `--text` | Une seule occurrence par vue : le nombre de la file du jour |
| **T1** | Nombre d'instrument | `--police-chiffres` | **32 / 36** | 700 | `--text` | Les 3 compteurs de la rangée d'instruments |
| **T2** | Titre de vue | `--police-titres` | **24 / 28** | 600 | `--text` | Le titre de la destination ouverte (« Publications ») |
| **T3** | Titre de section / panneau | `--police-titres` | **18 / 24** | 600 | `--text` | Les en-têtes de blocs. **Plus en or** (engagement 2) |
| **T4** | Titre de carte | `--police-texte` | **16 / 22** | 600 | `--text` | Nom du prospect, nom de la publication |
| **T5** | Corps | `--police-texte` | **14 / 20** | 400 | `--text` | Texte courant, valeurs de tableau, options de champ |
| **T6** | Corps dense | `--police-texte` | **14 / 18** | 400 | `--soft` | Lignes de tableau et de liste (interligne serré, pas la taille) |
| **T7** | Étiquette | `--police-texte` | **12 / 16** | 500 | `--muted` | Libellé de KPI, en-tête de colonne, libellé de champ — **capitales, `letter-spacing:.06em`** |
| **T8** | Méta / technique | `--police-technique` | **12 / 18** | 400 | `--soft` | Identifiants, chemins, journaux de synchronisation, `Post_ID` |

**Huit niveaux, pas plus.** Correspondance avec l'existant : T0 et T1 remplacent
`.kpi .v` (30 px) ; T3 remplace `.panel h2` (15 px, en or) et `.modal h3`
(19 px, en or) ; T7 remplace quatre tailles (10,5 / 11 / 11,5 / 12).

### Pourquoi ces tailles précisément

**T0 à 40 px** — c'est le seul chiffre qui décide de la matinée. À 60 cm de
l'écran, 40 px est lisible sans accommodation, c'est-à-dire sans que l'œil ait à
faire un effort de mise au point. Il doit être **unique dans la vue** : deux
chiffres à 40 px, et aucun des deux n'est le chiffre du jour.

**T1 à 32 px, contre 30 aujourd'hui** — l'écart de 2 px n'est pas cosmétique :
il place la valeur sur la grille de 4 px, ce qui aligne les trois instruments
entre eux et avec les marges. À 32 px, une valeur de 4 chiffres (`1 240` en
tabular) mesure 72 px de large à graisse 700 — elle tient dans une colonne de
240 px sans repli, ce qui est la largeur du rail.

**T5 à 14 px, et non 16** — c'est la taille qui permet les 3 colonnes à 1280 et
les 22 lignes sans défilement au-delà de 1680. Toute la densité du cockpit
repose sur cette valeur. Passer à 16 px coûte une colonne entière à 1280 et une
seconde ligne par carte.

**T6 : même 14 px, interligne 18 au lieu de 20** — c'est une décision explicite.
Pour densifier, on serre **l'interligne**, on ne réduit pas la taille. Un
tableau à 13 px se lit mal ; un tableau à 14/18 se lit bien et gagne 10 % de
hauteur sur 20 lignes. La ligne de tableau fait **40 px** (18 de texte, 11 de
rembourrage haut et bas).

**T7 à 12 px, capitales, `--muted` plein** — le plancher. Il est autorisé parce
que le contraste est vérifié (5,63:1). Il porte l'`letter-spacing:.06em` parce
qu'en capitales sous 14 px, les lettres se collent sans ce correctif. **Interdit
d'ajouter une opacité sur ce niveau** : `--muted` à 80 % tombe sous 4,5:1.

**Jamais d'italique** pour du texte d'interface. Le cockpit s'en sert pourtant
(`.waitmsg`, `.rap`, `.vrat`) : c'est un signal de « pas important » qui, répété,
devient un signal de « pas fiable ». Remplacé par `--muted` en T7.

### Les nombres — quatre règles non négociables

Les nombres sont le contenu du cockpit. Quatre règles les rendent comparables.

1. **`font-variant-numeric: tabular-nums` partout où un nombre peut changer.**
   Sans chasse fixe, passer de `9` à `10` décale toute la colonne et l'œil perd
   sa ligne. La règle est **déjà écrite** dans le socle (`.tableau2 .nombre`,
   `.carte2--stat .valeur`) : elle devient générale, y compris sur les badges de
   score, les compteurs de puces et les lignes d'entonnoir.
2. **Aligner à droite** dès qu'au moins deux nombres sont empilés (tableaux,
   entonnoir, listes). Les césures doivent tomber sur la même verticale.
3. **Jamais de nombre centré.** Le centrage casse l'alignement décimal : c'est
   ce que fait aujourd'hui `.score { width:52px; justify-content:center }`.
4. **Une valeur absente n'est pas un zéro.** Voir §5, composant *Instrument* :
   `—` (aucune donnée), `0` (donnée réelle valant zéro) et `·` (non applicable)
   sont trois états typographiques distincts, avec trois traitements.

### Les listes déroulantes techniques

Les 22 listes déroulantes sans nom accessible affichent des valeurs brutes :
`Contacté_J0`, `Relancé_J3`, `Répondu_Positif`. Ce sont des **identifiants de
machine**, pas du français.

**Règle** : la `value` reste l'identifiant (`Contacté_J0`) — c'est le contrat
avec Flask, on n'y touche pas. Le **libellé affiché** est corrigé :

| Valeur (inchangée) | Libellé affiché |
|---|---|
| `Nouveau` | Nouveau |
| `Contacté_J0` | Contacté |
| `Relancé_J3` | Relancé — J+3 |
| `Relancé_J7` | Relancé — J+7 |
| `Froid` | Froid |
| `Répondu_Positif` | A répondu · positif |
| `Répondu_Négatif` | A répondu · négatif |
| `En_Conversation` | En conversation |
| `Converti` | Converti |
| `Refusé` | Refusé |

Cette table vit à **un seul endroit** dans le code, et sert à la fois au `<option>`,
au badge et au libellé de filtre. Aujourd'hui elle existe trois fois, en trois
formes différentes : `STATUTS` (les identifiants), `FILTERS` (des libellés
partiels avec emoji), et le `.badge b-${st}` qui affiche la valeur brute.

### Déclaration des jetons typographiques

```css
:root {
  /* Familles — C3 : 'Cormorant Garamond' et 'DM Sans' sont les noms gelés du site */
  --police-titres:    'Cormorant Garamond', Georgia, serif;
  --police-texte:     'DM Sans', system-ui, -apple-system, sans-serif;
  --police-chiffres:  'Outfit', 'DM Sans', system-ui, sans-serif;   /* §0.1 : 3 woff2 à embarquer */
  --police-technique: ui-monospace, 'SF Mono', 'DM Mono', monospace;

  /* Échelle — 8 niveaux, tailles sur la grille de 4 px */
  --t0-taille: 40px;  --t0-lh: 44px;
  --t1-taille: 32px;  --t1-lh: 36px;
  --t2-taille: 24px;  --t2-lh: 28px;
  --t3-taille: 18px;  --t3-lh: 24px;
  --t4-taille: 16px;  --t4-lh: 22px;
  --t5-taille: 14px;  --t5-lh: 20px;
  --t6-taille: 14px;  --t6-lh: 18px;
  --t7-taille: 12px;  --t7-lh: 16px;
  --t8-taille: 12px;  --t8-lh: 18px;

  /* Interlettrage — trois valeurs, pas quatre */
  --ls-etiquette: .06em;   /* T7 en capitales */
  --ls-chiffre:  -.01em;   /* T0/T1 : les grands nombres se resserrent */
  --ls-normal:   0;
}
```

**Ce qui disparaît** : les tailles `10.5px`, `11px`, `11.5px`, `12.5px`,
`13px`, `13.5px`, `15px`, `19px`, `22px`, `30px`. **Dix tailles supprimées,
huit conservées.**

---

## 3. Échelle d'espacement et de rayons

### Espacement — base 4 px

Une seule règle : **tout multiple de 4**. Un écart de 5 px ou 7 px est un écart
accidentel : il ne se reproduit pas, donc il ne construit rien.

| Jeton | Valeur | Usage — et rien d'autre |
|---|---|---|
| `--e-1` | 4 px | Entre une icône et son texte, entre deux pastilles |
| `--e-2` | 8 px | Entre deux éléments dans un même groupe d'action |
| `--e-3` | 12 px | Entre un libellé et son champ ; rembourrage interne d'un badge |
| `--e-4` | 16 px | **Rembourrage interne d'une carte** — la valeur la plus utilisée du système |
| `--e-5` | 20 px | Séparation entre deux cartes d'une même colonne |
| `--e-6` | 24 px | **Gouttière entre colonnes** ; marge de page |
| `--e-8` | 32 px | Marge de page au-delà de 1680 ; séparation entre deux sections |
| `--e-10` | 40 px | Séparation entre la rangée d'instruments et le contenu |
| `--e-12` | 48 px | Vertical d'un état vide. **Le maximum du cockpit.** |

**Pourquoi la base est 4 et non 8.** Le site public peut se permettre la base 8
(il a 96 px de section). Le cockpit doit placer 22 cartes sur un écran : la
différence entre `--e-3` (12) et un 16 arrondi, multipliée par 4 rembourrages
par carte, c'est 16 px par carte sur 8 lignes — un tiers d'écran. **La base 4 est
ce qui rend la densité possible.** Le plafond à 48 px est l'autre moitié de la
règle : au-delà, c'est du site vitrine.

**Le maximum utilisé aujourd'hui** est de 50 px (`.empty { padding:50px }`) : hors
grille, et sur une carte d'état vide qui occupe tout l'écran. Ramené à 48.

### Rayons — cinq valeurs

**Le rayon encode la taille de la surface**, pas la décoration. Règle
arithmétique : `rayon ≤ moitié de la plus petite dimension`. Un bouton de 38 px
ne peut pas porter un rayon de 20 px — il devient une capsule, et une capsule
n'a plus de coins, donc plus de forme.

| Jeton | Valeur | Surfaces |
|---|---|---|
| `--r-xs` | **6 px** | Marqueur dense : pastille de score (26 px), pastille d'état interne, marqueur d'étape |
| `--r-sm` | **12 px** | Champ, liste déroulante, ligne de tableau sélectionnée, carte compacte |
| `--r` | **20 px** | **Carte, panneau, instrument** — la valeur par défaut |
| `--r-lg` | **28 px** | Modale, panneau latéral |
| `--r-pill` | **999 px** | Bouton, puce de filtre, badge de statut, anneau |

**On consomme `--r-sm`, `--r`, `--r-lg`, `--r-pill` du site** (mêmes noms, mêmes
valeurs) et on **ajoute `--r-xs`**. Le site déclare aussi **`--r-xl: 36px` : le
cockpit ne le consomme pas.** 36 px de rayon sur une surface de 200 × 150 donne
un galet ; c'est un choix de site vitrine, pas d'instrument.

**La règle du coin imbriqué** — c'est elle qui distingue une interface finie
d'une interface approximative :

> `rayon_interne = rayon_externe − rembourrage`

Une carte à `--r` (20) et `--e-4` (16) de rembourrage donne des éléments
internes à **4 px** de rayon. Un badge à l'intérieur de cette carte n'est donc
**pas** en `--r-pill` : il est en `--r-xs`. Un objet interne ne peut jamais être
plus arrondi que son contenant moins son rembourrage, sinon les deux courbes se
croisent et le coin devient sale.

Exception explicite : les **pastilles pleines** (badge d'état, puce de filtre) ne
suivent pas cette règle — ce sont des objets autonomes, pas des surfaces
imbriquées. Elles restent en `--r-pill`.

### Rythme vertical d'un écran type

Valeurs à respecter, dans l'ordre :

| Zone | Espacement au-dessus |
|---|---|
| Bandeau collant | — |
| Titre de vue (T2) | `--e-6` (24) |
| Rangée d'instruments | `--e-6` (24) |
| Barre de filtres + recherche | `--e-8` (32) |
| Grille de cartes | `--e-4` (16) |
| Entre cartes | `--e-5` (20) vertical, `--e-6` (24) horizontal |

---

## 4. Palette d'états

### Le partage des cinq sémantiques

Cinq couleurs portent un sens. Aucune n'est décorative. **Trois règles de
répartition gouvernent tout le reste**, et elles se lisent dans cet ordre :

| Sémantique | Jeton | Dit exactement | Ne dit jamais |
|---|---|---|---|
| **Or** | `--gold` / `--gold2` | « Ici tu agis » · « Voilà l'état actuel » | Succès, erreur, alerte, décoration, titre |
| **Vert** | `--wa` / `--green-*` | **« Le monde extérieur a confirmé »** | Une promesse, un espoir, une action à faire |
| **Rouge** | `--erreur` / `--red-*` | « C'est cassé » · « C'est irréversible » | Attention, avertissement, prudence |
| **Ambre** | `--avertissement` *(nouveau)* | « Ça a failli » · « Ça vieillit » · « C'est à moitié fait » | Une action à faire, une erreur |
| **Bleu acier** | `--attente` *(nouveau)* | « C'est en cours » · « C'est en file » · « Pour information » | Un succès, une urgence |

### Les trois règles anti-concurrence

**Règle A — Un composant ne porte jamais deux sémantiques.**
Un bouton or ne peut pas avoir une bordure rouge. Un badge vert ne peut pas
porter un chiffre en or. Un panneau dont le titre est ambre ne peut pas contenir
un bouton or. Si deux sémantiques doivent cohabiter, ce sont deux composants.

**Règle B — L'or et l'ambre ne se rencontrent jamais dans le même composant.**
Les deux sont des oranges chauds : `--gold` est à 38,9° de teinte, `--avertissement`
à 24,7° — **14 degrés d'écart, c'est-à-dire rien pour un daltonien.**
Deux conséquences non négociables :
1. L'ambre n'est **jamais** utilisé comme fond plein ni comme couleur de bouton.
   Il n'existe qu'en **bordure gauche de 3 px** + **icône de forme triangulaire**
   + **texte**.
2. La forme porte le sens, pas la teinte : triangle pour l'avertissement, jamais
   pour l'or.

**Règle C — La couleur ne porte jamais un état seule.** WCAG 1.4.1. Tout état
coloré est doublé d'un indice non chromatique : pastille, forme d'icône, bordure,
ou mot. **Ceci résout directement les trois défauts « couleur sans légende » du
brief** — la bordure verte de carte, et les quatre couleurs de boutons du
panneau Publications. Une couleur qui n'a pas de mot n'existe pas.

### Ce qui remplace les défauts de couleur mesurés

**Le vert « à relancer » (`.card.due`, bordure verte).** Aujourd'hui une carte à
relancer porte une bordure et une lueur vertes. Deux erreurs : le vert signifie
« WhatsApp / confirmé » dans le contrat de jetons, et « à relancer » est
précisément une action **non confirmée**. Corrigé : la carte due porte
**l'or** — elle dit « ici tu agis », ce qui est exactement son sens — plus une
pastille d'échéance en T7 (« aujourd'hui ») et un **mot**, pas seulement une
couleur.

**Les quatre couleurs de boutons du panneau Publications.** Relevé réel :
9 boutons colorés — vert (`syncPubs`, `publierMaintenant`), bleu
(`generateQuickImage`, `quickExportZip`, `pullPubs`, `reprogrammerEchecs`), or
(`quickBatchVideo`), rouge (`quickRetryFailed`), orange (`runDoctor`). Aucune
légende, et aucune logique : `quickBatchVideo` est or sans raison, `pullPubs`
est bleu alors que `syncPubs` est vert, `runDoctor` est orange.

**Corrigé, et la règle qui le corrige est unique :**

> **La couleur d'un bouton dit sa conséquence, jamais sa catégorie. La catégorie
> est portée par l'icône.**

| Conséquence | Variante | Nombre | Exemples |
|---|---|---|---|
| Fait avancer l'état, irréversible ou coûteux | **primaire** (or) | 1 par vue | Valider et publier |
| Action technique sans effet sur l'état | **secondaire** (neutre) | autant que nécessaire | Exporter, tester, synchroniser, récupérer |
| Détruit ou perd quelque chose de récupérable | **secondaire + `--destructif`** | — | Régénérer les échecs, vider l'archive |

Les 9 boutons colorés deviennent **1 primaire, 7 secondaires, 1 destructif.**
Les quatre couleurs disparaissent. La différence entre « récupérer les statuts »
et « générer une image » n'est pas une couleur : c'est **deux icônes
différentes**, ce qui est plus lisible, plus accessible, et impossible à
confondre.

### Pourquoi l'ambre et le bleu sont deux jetons nouveaux

Le contrat gèle les **noms existants** ; il n'interdit pas d'en ajouter, à
condition de les nommer et de les justifier. Deux manques réels :

- **L'ambre est inventé en dur dans le cockpit** : `#f0b35b` (badge
  `Relancé_J7`), `rgba(217,119,6,.18)` (fond du même badge), `rgba(255,159,94,.12)`
  (`runDoctor`), `#ffb08a` (texte de `runDoctor`). **Quatre valeurs littérales
  pour un seul sens** — et c'est la violation « aucune valeur hexadécimale en
  dur » la plus visible du fichier.
- **Le bleu est inventé en dur cinq fois** : `rgba(157,216,253,.12)`,
  `rgba(120,160,255,.12)`, `#a5c4ff`, `#7ce4f4`, `rgba(125,211,252,.13)`. Il
  porte pourtant un seul sens : « en cours / en file ».

**Valeurs retenues, contraste calculé sur les quatre fonds du thème sombre**
(`--bg` #08080c, `--bg2` #0c0c10, `--card` #101014, `--card2` #14141a) :

| Jeton | Valeur | `--bg` | `--bg2` | `--card` | `--card2` | Seuil |
|---|---|---|---|---|---|---|
| `--avertissement` | **#e2914f** | 7,99 | 7,59 | **7,34** | 7,10 | 4,5 ✓ |
| `--attente` | **#8ab8e6** | 9,60 | 9,11 | **8,81** | 8,52 | 4,5 ✓ |

Teintes : `--avertissement` 26°, `--gold` 39°, `--attente` 208°, `--wa` 142°,
`--erreur` 0°. **Cinq teintes largement séparées** — sauf or et ambre, traités
par la règle B.

### Le tableau des états

Pour chaque état d'un composant interactif : les quatre canaux, et l'indice
non chromatique qui satisfait la règle C.

| État | Fond | Bordure | Texte | Indice non chromatique | Jeton d'anneau |
|---|---|---|---|---|---|
| **Normal** | `--card` | `--border` | `--text` | — | — |
| **Survol** | `--card2` | `--border2` | `--text` | Curseur `pointer` | — |
| **Focus** | inchangé | inchangé | inchangé | **`outline: 2px solid var(--gold)`, `offset: 2px`** | `--gold` — 8,20:1 minimum, vérifié |
| **Actif (pressé)** | `--bg2` | `--border-strong` | `--text` | Aucun déplacement, aucune transformation | — |
| **État courant** | `--gold-bg` | `--gold` | `--gold2` | Le **seul** élément or de la vue | — |
| **Désactivé** | `--bg2` | aucune | `--muted` | `cursor:not-allowed`, `aria-disabled="true"` | — |
| **Chargement** | `--card2` | `--border` | `--muted` | Squelette animé + **mot** (« Chargement… ») | — |
| **Erreur** | `--red-bg` | `--red-border` | `--red-text` | Icône `etat--echec` + texte | — |
| **Succès** | `--green-bg` | `--green-border` | `--green-text` | Icône `etat--valide` + texte | — |
| **Avertissement** | transparent | **`--avertissement` bordure gauche 3 px** | `--avertissement` | Icône `etat--attention` (triangle) | — |
| **En attente** | `--attente-bg` | `--attente-border` | `--attente` | Icône `etat--attente` (arc) + durée | — |

### Deux corrections d'accessibilité sur les états

**1. Ne jamais désactiver par `opacity` sur le composant entier.**

Le socle écrit `.btn2[disabled] { opacity:.5 }` et le `.btn` actuel
`opacity:.5` / `.btn.wa:disabled { opacity:.35 }`. C'est mesurable et faux :

| Traitement | Résultat | Verdict |
|---|---|---|
| `--text` à 50 % sur `--card` | #7e7d7c → **4,62:1** | passe de justesse |
| `--text` à 45 % sur `--card` | #737271 → **3,95:1** | **échoue** |
| `--border-strong` à 50 % sur `--card` | #3a3a42 → **1,68:1** | **échoue** (seuil composant 3:1) |

Un bouton désactivé à 50 % d'opacité **perd sa bordure** : il n'est plus
identifiable comme bouton. Or un contrôle désactivé doit rester
reconnaissable — c'est précisément ce que l'utilisateur cherche (« pourquoi je
ne peux pas cliquer ? »).

**Corrigé** : le désactivé **recolore**, il ne diminue pas.

```css
.btn:disabled {
  background: var(--bg2);        /* le contrôle reste un bloc identifiable */
  border-color: var(--border);   /* la forme tient */
  color: var(--muted);           /* 5,63:1 sur --card : lisible, et lisible exprès */
  cursor: not-allowed;
  /* jamais d'opacity */
}
```

**2. L'anneau de focus est en or, jamais en `--border-strong`.**

`--gold` sur les quatre fonds : 8,93 / 8,72 / 8,48 / 8,20. `--border-strong` :
3,43 / 3,35 / 3,25 / 3,14 — il passe le seuil composant de 3:1, mais de 3 %.
**Un anneau de focus à 3,14:1 est un anneau qu'on ne voit pas.** L'or est à
8,2:1 minimum. C'est la couleur de focus, sur les 198 éléments interactifs.

**Corrigé et généralisé** : aujourd'hui **2 règles `:focus-visible`** pour 198
éléments interactifs. Les listes déroulantes, les puces de filtre et les cartes
n'en ont aucune. Une seule déclaration globale les couvre tous :

```css
:where(button, a, input, select, textarea, [tabindex], [role="button"], [role="tab"]) :focus-visible,
:where(button, a, input, select, textarea, [tabindex], [role="button"], [role="tab"]):focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  border-radius: var(--r-xs);   /* l'anneau épouse la forme, sans déborder */
}
```

**Seuil de 24 px.** Les 18 cibles mesurées sous 24 px (`.bcopy` ≈ 22 px,
`.fixbtn` ≈ 24 px, `.score` 26 px, `.bia` ≈ 18 px) passent à **28 px minimum**,
ou deviennent non interactives (un badge de score n'est pas un bouton). Un
contrôle de 28 px n'est autorisé que **dans une ligne de 40 px ou plus**.

### Déclaration des jetons de couleur

```css
:root {
  /* ---- DÉJÀ LÀ : ne pas toucher (C3) ---- */
  --bg:#08080c; --bg2:#0c0c10; --card:#101014; --card2:#14141a;
  --text:#edeae3; --soft:#b0aaa0; --muted:#8b8b96;
  --gold:#c9a96e; --gold2:#e2c07a;
  --gold-bg:rgba(201,169,110,.08); --gold-border:rgba(201,169,110,.22);
  --border:#1c1c22; --border2:#282830; --border-strong:#646470;
  --on-gold:#0a0a0e; --wa:#25D366; --wa-text:#25D366;
  --green-text:#6fcf8a; --green-border:rgba(60,180,100,.3); --green-bg:rgba(60,180,100,.1);
  --erreur:#e07070; --red-text:#e07070;
  --red-border:color-mix(in srgb, var(--erreur) 30%, transparent);
  --red-bg:color-mix(in srgb, var(--erreur) 12%, transparent);

  /* ---- NOUVEAUX : les deux manques mesurés (§4) ---- */
  --avertissement:        #e2914f;   /* 7,34:1 sur --card */
  --avertissement-bg:     color-mix(in srgb, var(--avertissement) 10%, transparent);
  --avertissement-border: color-mix(in srgb, var(--avertissement) 30%, transparent);
  --attente:              #8ab8e6;   /* 8,81:1 sur --card */
  --attente-bg:           color-mix(in srgb, var(--attente) 10%, transparent);
  --attente-border:       color-mix(in srgb, var(--attente) 30%, transparent);

  /* ---- NOUVEAU : la seule surface d'état or, nommée ---- */
  --focus: var(--gold);
}
```

**Ces deux jetons doivent aussi être déclarés dans `eperf.css`**, thème clair
**et** sombre, avec leurs propres valeurs. Sans cela, le cockpit invente des
couleurs que le site ignore, et le contrat « le cockpit consomme les jetons du
site » devient faux au premier écran qui affiche un avertissement. C'est un
ajout, pas un renommage : le contrat C3 est respecté.

**Aucune valeur littérale.** Les 336 couleurs écrites à la main dans le fichier
disparaissent : tout état passe par l'un des jetons ci-dessus.

---

## 5. Bibliothèque de composants

15 composants. Pour chacun : anatomie, variantes, états, tailles, usage et
**contre-usage** — le contre-usage est la moitié utile de la règle.

Les noms de classe ci-dessous prolongent le socle existant (`.btn2`, `.carte2`…)
pour que l'implémentation soit un **delta**, pas une réécriture.

---

### 5.1 Bouton

**Anatomie** : `[icône 16px] [libellé T5 600]`, `gap: --e-2`, hauteur fixe,
rembourrage horizontal `--e-4`.

**Trois variantes — le plafond du brief, tenu.**

| Variante | Fond | Bordure | Texte | Sémantique |
|---|---|---|---|---|
| **primaire** | `--gold` | aucune | `--on-gold` (8,83:1 vérifié) | La seule action qui fait avancer l'état |
| **secondaire** | transparent | `--border-strong` | `--text` | Action technique, sans effet d'état |
| **tertiaire** | transparent | aucune | `--soft` | Action de moindre poids, dans un en-tête ou une ligne |

**Modificateurs** (pas des variantes) :
`--destructif` → `--red-text` en bordure et en texte, fond transparent (se
combine avec `secondaire`) ; `--icone-seule` → carré, pas de rembourrage
horizontal ; `--pleine-largeur` → `width:100%`.

**Tailles** — trois, en jetons :

| Taille | Hauteur | Rembourrage | Typo | Usage |
|---|---|---|---|---|
| `--sm` | **30 px** | 0 14px | T5 | Dans une ligne de tableau de 40 px |
| `--md` | **38 px** | 0 18px | T5 | Défaut |
| `--lg` | **46 px** | 0 24px | T6 | **Une seule par vue** : l'action principale |

Ces valeurs ratifient le socle existant (30/38/46) : elles sont conformes au
seuil de 24 px, et les changer serait un coût sans bénéfice.

**États** : les 5 du §4 (normal, survol, focus, actif, désactivé) +
**chargement** (libellé remplacé par « Envoi… », bouton désactivé, largeur
conservée pour ne pas déplacer la mise en page) + **erreur** (jamais sur le
bouton : dans la notification).

**Usage** : un bouton primaire par vue, et le libellé est un **verbe à
l'infinitif** (« Publier », « Relancer »), jamais « OK », « Valider »,
« Envoyer » — trois mots qui ne disent pas ce qui va se passer.

**Contre-usage** :
- Jamais deux `--lg` dans la même vue.
- Jamais de bouton primaire pour une action **réversible** (exporter, filtrer) :
  c'est exactement le défaut actuel des 9 boutons colorés.
- Jamais de bouton coloré pour coder une **catégorie**.
- Jamais de bouton dont le libellé change de largeur au survol.
- Le `--destructif` n'est jamais `--lg` : une action destructive se demande deux
  fois, dans une confirmation, pas dans un gros bouton.

---

### 5.2 Carte

**Anatomie** : `--card` + bordure 1 px `--border` + `--r` (20) + rembourrage
`--e-4` (16). Pas d'ombre (engagement 1).

**Trois variantes, et c'est tout :**

| Variante | Hauteur | Usage |
|---|---|---|
| **carte** (défaut) | libre, `p:--e-4` | Prospect, publication — l'objet de travail |
| **carte--ligne** | **40 px fixe** | Ligne dense, `--r-sm`, `p:0 --e-3` — remplace les `.rrow` |
| **carte--instrument** | 96 px fixe | Un chiffre + son libellé (§5.11) |

**Résolution du défaut « deux hauteurs pour le même objet » (164 et 210 px).**
La cause est structurelle, pas cosmétique : les actions sont en `margin-top:auto`
dans un conteneur `flex-direction:column`, donc **la carte s'étire à la hauteur
du plus grand contenu, ligne par ligne**. Corrigé :

1. **Hauteur de carte imposée** : `min-height: 168px`, `max-height: 168px`,
   `overflow: hidden`. Le contenu qui déborde est tronqué, jamais la carte.
2. **Grille de cartes en `align-items: start`** — une carte ne s'étire jamais
   pour égaler sa voisine.
3. **Zones fixes** : en-tête 40 px (pastille de score 28 + nom T4 + badge), corps
   56 px (deux lignes de T5 en `--soft`), pied 40 px (actions alignées à
   gauche). Total 136 + 2 × 16 de rembourrage = **168 px**.

**États** : survol (`--border2`), focus (`--gold` + `offset:2px`, **la carte
entière est focusable si elle ouvre une fiche**), courant (`--gold` en bordure +
`--gold-bg`), chargement (squelette), vide.

**La carte « à relancer »** — le défaut de la bordure verte sans légende :

```
┌─────────────────────────────────────────┐
│ 78  Fatou Ouedraogo      ● Aujourd'hui  │   ← pastille or + mot, pas seulement couleur
│ ─────────────────────────────────────── │
│ +226 70 12 34 56 · Ouagadougou · Beauté │
│ Relancé J+3 · il y a 4 jours            │
│ ─────────────────────────────────────── │
│ [Relancer sur WhatsApp]     [Fiche]     │
└─────────────────────────────────────────┘
   ↑ bordure --gold 2px + fond --gold-bg  : « ici tu agis »
```

Le vert disparaît. **Trois indices non chromatiques** remplacent la couleur
seule : la bordure épaissie à 2 px, la pastille d'échéance, et le mot
« Aujourd'hui ». Un daltonien, ou une impression noir et blanc, lit la même
information.

**Contre-usage** : jamais de carte pour un contenu de moins de 3 lignes (utiliser
`carte--ligne`) ; jamais de carte dans une carte (utiliser une bordure gauche
`--border-strong`) ; jamais de carte cliquable sans bouton visible à l'intérieur
— un utilisateur ne doit pas deviner que la surface entière est un lien.

---

### 5.3 Champ (texte, zone de texte)

**Anatomie, dans cet ordre obligatoire** :
`<label>` → `input` → message d'erreur → texte d'aide.
`label` **au-dessus**, jamais à gauche : le `.flabel { text-align:right }` actuel
oblige à lire en zigzag et ne résiste pas à un libellé long.

| Élément | Typo | Couleur | Marge |
|---|---|---|---|
| Étiquette | T7, capitales, `--ls-etiquette` | `--muted` | `--e-1` sous elle |
| Champ | T5 | `--text` | — |
| Message d'erreur | T7 (12/16), sans capitales | `--red-text` | `--e-1` au-dessus |
| Texte d'aide | T7, sans capitales | `--muted` | `--e-1` au-dessus |

**Dimensions** : hauteur `38 px` (`--md`), `--r-sm` (12), fond `--bg2`, bordure
1 px `--border`, rembourrage `--e-3 / --e-4`.

**États** : normal, survol (`--border2`), focus (`--gold` + `box-shadow: 0 0 0 2px
gold 18%` — déjà écrit dans le socle), désactivé (`--muted`, sans opacité),
erreur (`--red-text` en bordure **et** icône dans le message), lecture seule
(`--card2`, texte `--soft`).

**Variante `--technique`** : police `--police-technique`, T8. Pour les
identifiants, les clés d'API, les chemins. Le socle l'a déjà (`.champ2--technique`) :
**elle doit être utilisée**, aujourd'hui les clés d'API sont dans le même champ
que les noms.

**Contre-usage** : jamais de `placeholder` en remplacement d'étiquette (il
disparaît à la saisie : c'est la cause des 22 listes déroulantes sans nom) ;
jamais de largeur `100%` pour un champ numérique de 4 caractères ; jamais de
formulaire sans message d'erreur textuel — une bordure rouge seule ne dit pas
ce qui est faux.

---

### 5.4 Liste déroulante

**C'est le composant le plus défectueux du cockpit** : 32 listes natives, **22
sans aucun nom accessible**, et des valeurs techniques brutes à l'écran.

**Anatomie** : identique au champ, plus une flèche.
**Le `<label>` visible est obligatoire, et son `for` doit pointer sur l'`id` du
`<select>`.** Quand la place manque (dans une ligne de carte), le `<label>` est
visuellement masqué **mais reste dans le DOM** — jamais `display:none`, jamais
absent, sinon le nom accessible disparaît :

```css
.visuellement-masque {
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0;
}
```

**Libellés lisibles** : la table de correspondance de §2 est la seule source.
`<option value="Contacté_J0">Contacté</option>` — la valeur ne change pas, le
libellé oui. **Aucun `_` ni majuscule technique à l'écran, jamais.**

**Résolution du défaut « valeurs techniques brutes »** : un `<select>` qui
affiche `Répondu_Positif` oblige l'utilisateur à traduire mentalement à chaque
lecture. Sur 22 champs × 5 consultations par semaine, c'est un coût réel.

**États** : les 6 du champ. Le `<select>` reçoit `:focus-visible` avec l'anneau
or — **il n'en a aucun aujourd'hui**.

**Contre-usage** : jamais de `<select>` pour un choix de 2 options mutuellement
exclusives (une paire de boutons radio ou une bascule) ; jamais de `<select>` de
plus de 12 options sans regroupement `<optgroup>` ; jamais de `<select>` dont la
première option est vide sans le mot « Choisir… ».

---

### 5.5 Tableau

**Anatomie** : en-tête collant (`position:sticky`) + lignes de **40 px** + colonnes
de largeur déclarée. Déjà écrit dans `.tableau2` — à ratifier et compléter.

| Partie | Typo | Couleur | Bordure |
|---|---|---|---|
| `<th>` | T7, capitales, `--ls-etiquette` | `--muted` | basse `--border` |
| `<td>` | T6 (14/18) | `--text` | basse `--border` |
| Cellule nombre | T6 + `tabular-nums` | `--text` | **alignée à droite** |
| Ligne survolée | — | fond `--card2` | — |
| Ligne sélectionnée | — | `box-shadow: inset 0 0 0 1px var(--gold)` | déjà écrit |

**La colonne d'actions est la dernière**, alignée à droite, largeur fixe de
`3 × --sm + gaps` = 130 px. Elle ne contient que des boutons `--sm`.

**États** : chargement (3 lignes squelettes de 40 px — **pas un spinner**, pour
que la page ne saute pas), vide (ligne unique « Aucun résultat » en T6 `--muted`,
`colspan` complet), erreur (ligne unique en `--red-text`).

**Contre-usage** : jamais plus de 5 colonnes sans défilement horizontal assumé
avec une première colonne figée ; jamais de tableau pour moins de 4 lignes (une
liste de cartes `--ligne`) ; **jamais de tableau sous 1024 px** — il se replie en
cartes (§7).

---

### 5.6 Badge de statut

**Anatomie** : `[pastille 6px] [libellé T7 500]`, hauteur **20 px**, `--r-pill`,
fond `color-mix(currentColor 12%)`. Déjà écrit dans `.badge2` — modèle à suivre.

**Sept états, sept libellés, sept couleurs** — la table de §2 fait foi :

| Statut | Couleur | Sémantique |
|---|---|---|
| Brouillon | `--muted` | Rien n'est engagé |
| En attente | `--attente` | Quelqu'un attend une décision |
| Programmé | `--soft` | Date fixée, rien à faire |
| Publié | `--wa` | **Le monde extérieur a confirmé** |
| Échoué | `--red-text` | C'est cassé |
| En file | `--border-strong` | Le système va le prendre |
| À relancer (prospect) | `--gold` | **Ici tu agis** |

**Le badge n'est jamais interactif.** Tout badge cliquable devient un bouton ou
une puce de filtre (§5.7).

**Contre-usage** : jamais de badge pour un texte de plus de 3 mots (au-delà, le
`--r-pill` fait une capsule trop longue → `--r-xs`) ; jamais de badge sans
pastille, sauf dans une colonne dont l'en-tête porte la légende ; jamais de rouge
pour un avertissement.

---

### 5.7 Puce de filtre

**Anatomie** : `[libellé T6 500] [compteur T7 tabular]`, hauteur **30 px**,
`--r-pill`. Le compteur en `--muted`, jamais en gras.

| État | Fond | Bordure | Texte | Compteur |
|---|---|---|---|---|
| Repos | transparent | `--border` | `--soft` | `--muted` |
| Survol | `--card2` | `--border2` | `--text` | `--muted` |
| **Actif** | `--gold-bg` | `--gold` | `--gold2` | `--gold2` |
| Vide (compteur 0) | transparent | `--border` | `--muted` | masqué |

**Résolution de l'incohérence** : aujourd'hui, `.chip.on` a un **dégradé or plein**
avec texte sur fond (`color:var(--bg)`) et `font-weight:700`, contre `font-weight:500`
au repos. Deux conséquences : le texte change de graisse donc de largeur (la
rangée se réagence au clic), et une puce or pleine concurrence le bouton primaire
— **trois puces actives et le bouton primaire ne se voit plus.** Corrigé : fond
`--gold-bg` (8 % d'or), bordure `--gold`, et **la graisse ne change pas**.

**Puce à 0** : reste visible et cliquable, en `--muted`, compteur masqué. Une puce
qui disparaît quand le compte tombe à zéro fait douter de l'existence de la
catégorie.

**Contre-usage** : jamais plus de 8 puces (au-delà, un `<select>` multiple ou des
onglets) ; jamais de puce pour une navigation (c'est un onglet) ; jamais de puce
sans compteur, sauf si le total est affiché à côté.

---

### 5.8 Onglet

**Anatomie** : `[libellé T5 500] [compteur éventuel]`, hauteur **36 px**, **sans
fond**, souligné à 2 px. Les onglets se placent en tête de vue et remplacent les
12 panneaux en pile.

| État | Texte | Trait bas | Fond |
|---|---|---|---|
| Repos | `--soft` | transparent | transparent |
| Survol | `--text` | `--border2` 2 px | transparent |
| **Actif** | `--gold2` | **`--gold` 2 px** | transparent |
| Désactivé | `--muted` | transparent | transparent |

**Différence avec la puce, qui n'est pas cosmétique** : la **puce filtre une
liste** sur place (les données restent, la vue se réduit) ; l'**onglet change de
vue** (les données changent, l'objet reste). Une même rangée ne mélange jamais
les deux.

**Souligné plutôt que rempli** : parce que l'onglet actif est un « où suis-je »,
et qu'un onglet rempli d'or à côté d'un bouton primaire or donne deux ors de même
poids — l'engagement 2 est violé. Le souligné distingue sans peser.

**Contre-usage** : jamais plus de 5 onglets ; jamais d'onglet sans son contenu
déjà chargé (sinon c'est un lien) ; jamais d'onglet imbriqué dans un onglet.

---

### 5.9 Modale

**Décision de conception, alignée sur `CONCEPTION.md`** : *une modale est un
aveu*. Quatre tests dans l'ordre, et la modale est le dernier recours :
1. Agit sur un objet déjà visible → **panneau latéral**
2. Liste un ensemble homogène → **onglet**
3. A un cycle de vie propre → **page avec URL**
4. Est un état ou un point d'entrée → **disparaît**

Il reste **deux usages légitimes** : la **confirmation** (une question, une
réponse, on ferme) et le **formulaire court** (moins de 4 champs). Les 15 modales
actuelles se réduisent à ces deux cas ; les 13 autres deviennent des panneaux ou
des vues.

**Anatomie** : voile `rgba(0,0,0,.7)` + boîte `--card` + bordure `--border` +
`--r-lg` (28) + rembourrage `--e-6` (24).

**Trois tailles, une seule raison chacune** :

| Taille | Largeur | Usage |
|---|---|---|
| `--sm` | **480 px** | Confirmation. Jamais de formulaire. |
| `--md` | **640 px** | Formulaire court. **Défaut.** |
| `--lg` | **880 px** | Réservé aux contenus déjà structurés en tableau. **À justifier. Devenir rare.** |

**Structure obligatoire** : titre (T3, `--text` — **plus en or**, engagement 2) ·
corps · barre d'actions en bas, **à droite**, avec l'action primaire en dernier
position. **Jamais l'action dangereuse à gauche de l'action sûre.**

**États et comportements non négociables** :
- `Échap` ferme. **Aujourd'hui aucune modale ne le fait.**
- Le focus entre dans la boîte à l'ouverture et en sort à la fermeture.
- Le focus ne sort pas de la boîte tant qu'elle est ouverte (`inert` sur le reste).
- **Le titre reçoit le focus à l'ouverture** et annonce la modale aux lecteurs
  d'écran via `aria-labelledby`.
- Fermeture par clic sur le voile **uniquement** si aucune saisie n'est en cours ;
  sinon, confirmation.
- La modale n'est jamais empilée sur une modale. Si un second niveau est
  nécessaire, c'est une vue.

**Contre-usage** : jamais de modale pour afficher un résultat long (elle
défile) ; jamais de modale ouverte après un succès qui change l'objet affiché
derrière (l'utilisateur ne voit pas le changement) ; jamais plus de 3 champs
sans étiquette visible ; **jamais de `prompt()` natif** — l'actuel
`scheduleAllModal()` en ouvre trois pour programmer un lot.

---

### 5.10 Panneau latéral

**Le composant neuf du système**, et celui qui résout le plus de défauts : il
remplace la modale pour tout ce qui agit sur un objet déjà visible.

**Anatomie** : colonne à droite de **380 px** (`360 px` sous 1680), plein
hauteur sous le bandeau, bordure gauche 1 px `--border`, fond `--card`,
rembourrage `--e-4`. En-tête fixe (titre T3 + fermeture), corps défilant, pied
d'actions fixe.

**États** : fermé (absent du DOM, pas `display:none` — voir §7 pour le focus),
ouverture (`translateX` 220 ms `--ease-out`), ouvert, **réduit** (56 px, bandeau
d'onglets verticaux).

**Pourquoi 380 px** : c'est la largeur qui affiche une fiche prospect complète
(nom, téléphone, ville, secteur, historique, actions) **sans replier de ligne**,
sur une colonne. Vérifié : 380 − 2 × 16 de rembourrage = 348 px utiles ; un
numéro de téléphone international en T5 mesure 140 px, un nom en T4 sur une ligne
mesure 200 px.

**Comportement, par palier** (§7) : **superposé** sous 1680 (la zone de travail
ne se rétrécit pas, le panneau passe au-dessus) · **en colonne** au-delà, où il
pousse la grille sans la recouvrir.

**Contre-usage** : jamais deux panneaux latéraux ouverts simultanément ; jamais
un panneau qui cache la liste qu'il sert à parcourir (d'où la superposition sous
1680 : la liste reste au même endroit) ; jamais de panneau pour une action qui
change toute la vue (c'est une page).

---

### 5.11 Indicateur de progression

**Premier correctif, et il est de fond** : *un toast qui disparaît en 4,2 secondes
pour une génération qui dure des minutes est un mensonge*. **Toute tâche de plus
de 2 secondes est une entité visible qui survit à la page** : un nom, un début, un
état, un résultat, une reprise.

**Anatomie** : `[icône d'état] [nom de la tâche T5] [barre 4px] [étape T7] [temps T7]`.
Barre : hauteur **4 px**, `--border` en piste, `--attente` en remplissage,
transition 320 ms linéaire.

**Trois paliers, choisis par la durée annoncée — jamais par le goût :**

| Palier | Déclencheur | Composant |
|---|---|---|
| **< 400 ms** | Réponse immédiate | **Rien.** Pas de spinner : l'affichage du résultat suffit |
| **400 ms – 2 s** | Action courte | Squelette (structure connue) ou ligne `--muted` « Chargement… » |
| **> 2 s** | Tâche longue | **Entité nommée persistante**, avec étape, progression et annulation |

**Le troisième palier est le manque réel du cockpit** : 0 `AbortController` dans
le fichier, donc **aucune tâche longue n'est annulable**. Une entité qui dure des
minutes sans bouton d'annulation n'est pas une entité, c'est une attente.

**La progression est nommée et réelle.** Jamais une barre indéterminée qui tourne
pour un travail qui a des étapes connues. Les étapes d'une génération de
publication sont connues (texte → image → validation) : elles s'affichent.

**Contre-usage** : jamais de barre indéterminée pour une tâche de plus de 10
secondes ; jamais de progression estimée sans repère temporel ; **jamais de toast
pour une tâche longue** (défaut mesuré) ; jamais d'overlay bloquant sans issue —
`doSync()` est aujourd'hui sans `try/catch` : le réseau tombe, l'overlay reste
bloqué pour toujours.

---

### 5.12 État vide

**Quatre cas distincts**, parce qu'ils n'appellent pas la même réaction :

| Cas | Message | Action |
|---|---|---|
| **Aucune donnée** (jamais eu) | « Aucun prospect pour l'instant. » + ce qu'il faut faire pour en avoir | Bouton primaire : « Ajouter un prospect » |
| **Aucun résultat** (filtre trop étroit) | « Aucun prospect ne correspond à ce filtre. » | **Tertiaire** : « Effacer les filtres » |
| **Aucune donnée aujourd'hui** (cas normal et heureux) | « Rien à relancer aujourd'hui. » | **Aucune action.** C'est une bonne nouvelle, pas un vide |
| **Erreur de chargement** | « Les données n'ont pas pu être chargées. » + cause | Secondaire : « Réessayer » |

**Anatomie** : icône 32 px `--border-strong` (**jamais or** : rien à faire ici)
· titre T4 `--text` · texte T6 `--muted`, `max-width:44ch` · action.
Vertical `--e-12` (48), centré, `min-height:240px`.

**La distinction qui manque** : le troisième cas est le plus important et
n'existe pas aujourd'hui. Le cockpit n'a qu'un `.empty` (« Aucun prospect
ici. ») pour les quatre situations. Une file vide le matin doit dire « Rien à
faire aujourd'hui » — et surtout pas ressembler à une panne.

**Contre-usage** : jamais d'état vide sans texte (une zone blanche fait croire à
un bug) ; jamais d'état vide avec une action primaire or quand il n'y a rien à
faire ; jamais le même message pour « aucune donnée » et « aucun résultat ».

---

### 5.13 Chargement

**Trois formes, une par durée** (§5.11). Jamais de mélange.

1. **Squelette** (400 ms – 2 s, structure connue) : blocs `--card2` animés par
   `pulse2` 1,2 s. **La forme du squelette est celle du contenu réel** — un
   squelette de carte pour une carte, des lignes de 40 px pour un tableau. Un
   squelette générique ne sert à rien.
2. **Ligne de chargement** (liste, rafraîchissement) : une ligne T7 `--muted`,
   « Chargement… », **avec le mot**. Jamais un spinner seul : un spinner ne dit
   ni quoi, ni combien de temps, ni si c'est bloqué.
3. **Entité de tâche** (> 2 s) : §5.11.

**`prefers-reduced-motion: reduce` annule l'animation du squelette et le remplace
par un fond `--card2` fixe** — déjà écrit dans le socle, à conserver.
**Une animation de plus de 400 ms est interdite**, sauf la barre de progression
qui est un indicateur, pas une décoration.

**Contre-usage** : jamais de squelette à la place d'un état vide (un squelette
qui ne finit jamais est pire qu'un message) ; jamais de chargement sans mot ;
jamais d'indicateur qui reste après la fin de la tâche — aujourd'hui le toast de
génération se détruit à 4,2 s, ce qui produit exactement le défaut inverse : il
disparaît avant la fin.

---

### 5.14 Notification

**Trois niveaux, et le niveau décide de la position et de la durée.** C'est
l'inverse de l'actuel, où `toast()` sert à tout.

| Niveau | Où | Durée | Contenu | Rôle ARIA |
|---|---|---|---|---|
| **Information** | coin bas droit | 6 s | « Synchronisation terminée : 3 publications. » | `role="status"` |
| **Succès** | coin bas droit | 6 s | Le résultat, **avec sa preuve** | `role="status"` |
| **Erreur** | **en tête du bloc concerné, dans le flux** | **permanente** | La cause + l'action de reprise | `role="alert"` |

**Anatomie** : bordure gauche 3 px colorée selon le §4 (or, vert, rouge) + fond
`--card` + `--r-sm` + rembourrage `--e-3` · `--e-4` + `max-width:380px`.
**Jamais or pour un succès, jamais vert pour une information.**

**Deux règles de fond, alignées sur le parcours** :
1. **Une notification parle du monde, pas des clics de l'utilisateur.** « Le post
   est sorti » (avec l'URL), « Le prospect a répondu » (avec la date). Le reste —
   « Enregistré », « Filtre appliqué », « 3 éléments sélectionnés » — passe sans
   commentaire. Aujourd'hui le cockpit notifie l'inverse : il confirme des clics
   et se tait sur les résultats.
2. **Une erreur ne disparaît jamais toute seule.** Elle reste jusqu'à ce que la
   cause soit traitée ou l'action de reprise effectuée. Un message d'erreur qui
   s'efface en 4 secondes oblige à reproduire l'erreur pour la lire.

**Contre-usage** : jamais plus de 3 notifications empilées (empiler, c'est déjà
avoir échoué) ; jamais de notification pour un succès évident à l'écran (la
ligne disparaît de la liste : c'est la preuve) ; jamais de notification d'erreur
en bas à droite, hors du regard.

---

### 5.15 Info-bulle

**Usage unique : rappeler ce qu'une icône veut dire.** Rien d'autre.

**Anatomie** : fond `--card2`, bordure `--border2`, `--r-xs` (6), texte T7
(12/16) `--text`, rembourrage `--e-1` · `--e-2`, `max-width:280px`, délai
**400 ms** avant apparition.

**Déclenchement** : survol **et** focus clavier (`:focus-visible`). Une info-bulle
qui ne s'ouvre qu'au survol n'existe pas au clavier.

**Le texte est un mot ou une phrase courte, jamais une phrase complète** :
l'info-bulle aide à lire, elle n'explique pas. Si l'explication dépasse 12 mots,
c'est un texte d'aide dans le champ, ou une section d'aide.

**Contre-usage** : jamais d'information **nécessaire à l'action** dans une
info-bulle (elle n'est pas toujours ouverte, ni sur écran tactile) ; jamais
d'info-bulle sur un élément non focusable ; jamais d'info-bulle qui répète le
libellé visible — `title="Cliquer pour changer de provider"` sur un badge qui
affiche « DeepSeek » est exactement ce contre-usage.

**Et une règle de fond** : les 35 attributs `title` actuels qui portent une
information utile (`title="Stoppe J+3 et J+7 — je prends le relais"`) doivent
**devenir du texte visible**, pas des info-bulles. Ce qui commande une
conséquence ne se cache pas dans un survol.

---

## 6. Remplacement des emojis — table complète

### Le relevé réel

Le brief annonce 35 emojis distincts. **Le relevé du fichier en trouve 65** :
59 pictogrammes, plus 6 signes typographiques détournés en icônes (`★`, `↗`,
`ℹ️`, `⏱️`, `❄`, `⛔`). Le total des occurrences est de **348**. La table
ci-dessous couvre les 65 — un remplacement partiel laisserait des emojis au
milieu d'icônes, ce qui est pire que l'état actuel.

### Le langage : « Instrumentation », décliné pour les icônes

Le site possède 111 icônes d'interface en `viewBox="0 0 24 24"`, `stroke`, et
26 illustrations en `viewBox="0 0 120 72"` sous le langage Instrumentation
(7 primitives, 5 règles, coordonnées multiples de 4, trait 1 ou 1,5).

**Les icônes du cockpit sont des icônes d'interface, pas des illustrations** :
elles vivent à 16, 20 ou 24 px, pas à 120 px. Le langage est donc **adapté, pas
copié**, et les cinq règles du langage sont conservées telles quelles :

| Règle Instrumentation (ADR-0003) | Application au 24 × 24 |
|---|---|
| **1. Un seul accent or maximum** | Une icône n'a **jamais** d'or, sauf quand elle marque l'état courant. Sinon : `currentColor` seul |
| **2. Aucune couleur littérale** | `stroke="currentColor"`, `fill="none"`. **Zéro `#` dans un SVG** |
| **3. Grille de 4 px** | Toutes les coordonnées ∈ {4, 8, 12, 16, 20}. `viewBox="0 0 24 24"` |
| **4. Deux épaisseurs, jamais trois** | **1,5 px** pour le trait porteur, **1 px** pour la trame secondaire. Les 111 icônes du site sont à 2 : trop lourd à côté d'un texte de 14 px |
| **5. La trame reste partielle** | Une grille de points ne couvre jamais tout le carré ; elle est interrompue ou limitée à un quadrant |

**Sept primitives, comme le langage d'origine** : cercle concentrique (C), arc
gradué (A), barres verticales (B), grille de points (G), segment en escalier (E),
rectangle imbriqué (R), diagonale (D).

**Contraintes de dessin, en plus** :
- **3 primitives maximum** par icône (le langage en autorise 2 ou 3 pour les
  illustrations ; à 24 px, au-delà de 3, la forme devient une tache).
- `stroke-linecap="round"`, `stroke-linejoin="round"` — cohérent avec le site.
- `aria-hidden="true"` **systématiquement** : l'icône double toujours un mot.
  Un emoji dans un attribut `title` ou un libellé est remplacé par du texte, pas
  par une icône.
- **Jamais de glyphe figuratif** : pas de fusée, pas d'ampoule, pas d'engrenage,
  pas de visage — la règle du langage l'interdit déjà (ADR-0003, « ce que cette
  direction évite »).

### La table de correspondance

**Format** : icône · occurrences · sens réel · construction.

#### Famille 1 — États de résultat

| Emoji | N | Sens dans le cockpit | Icône | Construction (24 × 24, trait 1,5) |
|---|---|---|---|---|
| ✅ | 43 | Succès confirmé | `etat--valide` | C + D. Arc de cercle (A) ouvert en haut à droite, Ø20 centré (12,12) ; la corde devient une diagonale à deux segments (8,12)→(11,15) puis (11,15)→(17,7). Le tracé d'un seuil franchi, pas une coche scolaire |
| ❌ | 39 | Échec, erreur | `etat--echec` | D + D. Deux diagonales (7,7)→(17,17) et (17,7)→(7,17), trait 1,5, extrémités arrondies. Aucun cercle : la forme dit « cassé », pas « attention » |
| ⚠️ | 8 | Avertissement | `etat--attention` | A + G. Triangle ouvert (12,4)→(20,19)→(4,19), non fermé en bas ; barre verticale (12,9)→(12,14) ; point (12,17). Géométrie de seuil, jamais de visage |
| ⛔ | 1 | Limite atteinte | `etat--limite` | C + B. Cercle Ø20 (12,12) ; barre horizontale pleine (5,12)→(19,12) trait 3. Un cadran à zéro, pas un panneau routier |
| ℹ️ | 1 | Information | `etat--info` | C + D. Cercle Ø20 (12,12) ; barre (12,9)→(12,17) ; point (12,6). La hampe d'un cadran |
| ★ | 1 | Mis en avant | `marque--priorite` | D + D. Deux diagonales croisées à (12,4)-(12,20) et (5,9)-(19,9), plus bissectrice courte. Signature de repère, pas d'étoile décorative |

#### Famille 2 — Actions techniques

| Emoji | N | Sens dans le cockpit | Icône | Construction |
|---|---|---|---|---|
| 🔄 | 13 | Actualiser, réessayer | `actu--rafraichir` | A + D. Arc Ø18 ouvert sur 90° en haut à droite ; pointe de flèche courte (16,5)→(20,7)→(17,10). Rotation, pas cycle complet |
| 🔎 | 4 | Chercher (lancer) | `actu--chercher` | C + D. Cercle Ø12 (10,10) ; manche (17,17)→(21,21) trait 1,5. Verre de visée, pas loupe d'enquête |
| 🔍 | 3 | Rechercher (filtrer) | `actu--filtrer` | C + D + G. Identique à `chercher`, plus trois points (4,20),(8,20),(12,20) : dit « dans une liste » |
| 📥 | 4 | Importer, tirer du serveur | `actu--importer` | A + D. Arc (A) en bas ; flèche descendante (12,5)→(12,15) + pointe. Le sens est porté par la flèche |
| 📤 | 3 | Exporter, pousser | `actu--exporter` | A + D. Miroir vertical du précédent. **Jamais deux icônes identiques retournées sans raison** : ici la raison est le sens du transfert |
| 🗑️ | 8 | Supprimer | `actu--supprimer` | R + B + B. Rectangle ouvert (6,8)-(18,20) ; deux barres verticales (10,12)→(10,17) et (14,12)→(14,17). Aucun couvercle, aucun couvercle bombé : un conteneur vidé |
| ✏️ | 7 | Modifier | `actu--modifier` | D + D. Diagonale (5,19)→(17,7) trait 1,5 ; seconde diagonale parallèle décalée (8,20)→(20,8) trait 1, la pointe coupée. Un trait qui corrige un autre trait |
| 📋 | 8 | Copier | `actu--copier` | R + R. Deux rectangles imbriqués de 4 px décalés en diagonale. **La primitive « rectangle imbriqué » du langage, à l'état pur** |
| 💾 | 2 | Sauvegarder | `actu--enregistrer` | R + B + A. Cadre ouvert ; barre de disque ; arc de contrôle en haut. Structure, pas disquette figurative |
| ➕ | 2 | Ajouter | `actu--ajouter` | D + D. Barre (12,5)→(12,19) ; barre (5,12)→(19,12). Deux traits, rien d'autre |
| 🛑 | 5 | Stopper | `actu--stopper` | B + B. Deux barres verticales épaisses (10,6)→(10,18) et (14,6)→(14,18). **Jamais de carré plein** (c'est le glyphe « stop » générique) : un frein, pas un panneau |
| ⚙️ | 2 | Paramètres | `actu--regler` | C + C + B. Deux cercles concentriques Ø16 et Ø8 ; trois barres courtes rayonnantes à 0°, 120°, 240°. **La primitive « cercle concentrique »** — un cadran réglé, pas un engrenage |
| 👁️ | 1 | Afficher, prévisualiser | `actu--afficher` | A + A + C. Deux arcs symétriques (paupière) ; petit cercle Ø6 au centre. Forme d'ouverture, pas d'œil anatomique |
| 🗑 (variante) | 1 | (même sens) | — | Même icône que `actu--supprimer` |

#### Famille 3 — Domaines et objets du métier

| Emoji | N | Sens dans le cockpit | Icône | Construction |
|---|---|---|---|---|
| 📱 | 6 | WhatsApp, téléphone | `dom--telephone` | R + R. Rectangle haut 6 px (10,2)-(14,8) ; rectangle bas (7,8)-(17,20) `--r-xs`. Appareil, pas bulle |
| 💬 | 2 | WhatsApp (plateforme) | `dom--message` | R + C + C. Bulle rectangulaire à coin coupé ; deux points (10,12),(14,12). Forme de conversation |
| 📍 | 1 | Ville, localisation | `dom--lieu` | C + D + C. Goutte : cercle Ø8 en (12,10) prolongé par deux diagonales vers (12,21) ; point central Ø2. Repère de carte |
| 🏷 | 1 | Secteur, étiquette | `dom--etiquette` | R + C + D. Rectangle à coin coupé ; Ø4 en (8,8) ; diagonale (5,19)→(19,5). Étiquette d'inventaire |
| 💼 | 1 | LinkedIn | `dom--profil` | R + B + B. Rectangle haut (6,8)-(18,16) ; deux barres latérales (9,16)→(9,21) et (15,16)→(15,21). **Forme neutre de profil, pas de figure humaine** |
| 👤 | 1 | Facebook | `dom--compte` | C + A. Cercle Ø8 (12,8) ; arc Ø16 (12,19) ouvert vers le haut. **C'est la seule icône autorisée à évoquer une personne**, et uniquement pour désigner un compte : aucun visage, aucun trait |
| 🎵 | 1 | TikTok | `dom--audio` | C + D. Cercle Ø6 (10,16) ; diagonale (13,16)→(13,5) ; barre horizontale courte (13,5)→(17,7). Trajectoire sonore, pas note de musique |
| 📇 | 2 | Contacts (.vcf) | `dom--contacts` | G + G + R. Deux colonnes de trois points ; rectangle ouvert à gauche. Grille de fiches |
| 📅 | 7 | Programmer, calendrier | `dom--echeance` | R + R + G. Cadre ; barre d'en-tête ; **une seule barre verticale** de séparation (16,4)→(16,20) ; deux points de mesure. La colonne « quand » |
| 📚 | 9 | Publications, archive | `dom--archive` | B + B + B. Trois barres verticales de hauteurs décroissantes (6,8)-(8,20), (11,6)-(13,20), (16,9)-(18,20). **La primitive « barres verticales »** : une étagère lue comme un histogramme |
| 📰 | 1 | Veille, actualité | `dom--veille` | R + B + B + B. Cadre ; trois barres horizontales de largeurs décroissantes. Colonnes de journal, pas de papier roulé |
| 🖼️ | 8 | Image, visuel | `dom--image` | R + D + C. Cadre ; diagonale montante (6,18)→(12,11) ; cercle Ø4 (16,9). La primitive « diagonale » comme ligne de fuite |
| 🎬 | 5 | Vidéo | `dom--video` | R + R + D. Cadre ; rectangle interne décalé ; triangle ouvert (10,9)→(16,12)→(10,15). Image en mouvement |
| 📸 | 2 | Aperçu photo | `dom--capture` | R + C + R. Cadre ; cercle Ø10 centre ; petit rectangle (9,3)-(15,6) (viseur). Capture, distinct de `dom--image` |
| 📦 | 2 | Lot, archive ZIP | `dom--lot` | R + D + D. Rectangle ; deux diagonales croisées à l'angle supérieur ; le tout fermé. Un contenant scellé, pas une boîte en perspective |
| 📢 | 2 | Publier, diffuser | `dom--diffusion` | A + A + A. Trois arcs concentriques ouverts vers la droite, Ø8 / Ø14 / Ø20, sans source figurative. **Onde, pas mégaphone** |
| 📡 | 2 | Statut des API | `dom--signal` | C + A + B. Point central Ø3 ; arc Ø12 ; arc Ø20 ; barre de base. Antenne mesurée |
| 🗺️ | 1 | Cartes, sources OSM | `dom--carte` | R + D + D + G. Cadre ; deux diagonales convergentes (routes) ; trois points de mesure. Quadrillage, pas carte pliée |
| 🛠️ | 1 | Réparation, correctif | `dom--correctif` | D + D + C. Deux diagonales croisées en X ; petit cercle Ø4 à une extrémité. Un ajustement, pas d'outil |
| 🔗 | 1 | Lien, identifiant de post | `dom--lien` | R + R + D. Deux rectangles ouverts imbriqués, reliés par une diagonale courte. Le chaînage, pas deux maillons |
| 📝 | 1 | Notes, modèles | `dom--modele` | R + B. Cadre à coin coupé ; deux barres horizontales (8,12)→(16,12) et (8,16)→(13,16). **Le rectangle imbriqué + deux barres** : un formulaire, pas un crayon |
| 📈 | 1 | Résumé, courbe | `dom--courbe` | D + D + D. Trois segments en escalier montant (5,17)→(9,13)→(14,15)→(19,7). **La primitive « segment en escalier »** — à ne pas confondre avec `dom--archive`, qui est en barres |
| 📊 | 5 | Statistiques | `dom--mesure` | R + B + B + B. Cadre ouvert en bas ; trois barres verticales de hauteurs 8 / 14 / 11 à l'intérieur. Barres **dans** un cadre : le tableau de bord |
| 🏆 | 1 | Classement, top 5 | `dom--classement` | E + G + C. Trois paliers d'escalier ; deux points ; cercle Ø3 au sommet. Podium lu comme une courbe |
| 🎓 | 1 | Formation, pédagogie | `dom--savoir` | R + E + B. Rectangle ouvert ; escalier descendant ; barre de base. Progression, pas chapeau |
| 💰 | 4 | Coût, prix par image | `dom--cout` | C + C + B. Deux cercles concentriques Ø16 / Ø10 ; barre verticale traversante (12,2)→(12,22). Prix, mesuré |

#### Famille 4 — Intelligence et système

| Emoji | N | Sens dans le cockpit | Icône | Construction |
|---|---|---|---|---|
| 🤖 | 10 | Fournisseur IA | `sys--ia` | R + G + G. Rectangle à coins `--r-xs` ; **grille de points 2 × 2** à l'intérieur, interrompue en bas à droite (règle 5 : la trame est partielle). Un module, pas un robot |
| 🧠 | 9 | Compétences IA, skills | `sys--skills` | C + D + D. Cercle Ø10 (12,12) ; deux diagonales rayonnantes courtes (17,7)→(21,4) et (17,17)→(21,20). Rayonnement depuis un noyau, pas un cerveau |
| ✨ | 7 | Génération IA | `sys--generer` | D + D + D. Trois diagonales courtes divergentes depuis (12,12), angles 45°, 90°, 135°, longueurs 5 / 7 / 5. **Étincelle géométrique** — aucune courbe |
| ⚡ | 8 | Actions rapides | `sys--rapide` | D + D. Éclair construit en deux diagonales (14,3)→(9,12)→(13,12) et (13,12)→(10,21). Trajectoire, pas symbole |
| 💡 | 6 | Conseil, idée | `sys--conseil` | C + C + B. Demi-cercle Ø12 supérieur ; barre de base (9,19)→(15,19) ; deux traits courts (10,15)→(10,17) et (14,15)→(14,17). Ampèremètre, pas ampoule |
| 🩺 | 6 | Diagnostic système | `sys--diagnostic` | C + G + D. Cercle Ø16 (12,12) ; **grille de points limitée au quadrant bas-droit** ; aiguille diagonale (12,12)→(17,7). Cadran avec aiguille : c'est le geste du diagnostic |
| ⚔️ | 6 | Concurrence | `sys--concurrence` | D + D + D. Deux diagonales croisées (5,5)→(19,19) et (19,5)→(5,19) ; troisième diagonale courte (17,17)→(21,21). Croisement de trajectoires, **jamais d'épée** |
| 🔬 | 2 | Test A/B | `sys--test` | A + A + B. Arc Ø18 ouvert en bas ; second arc Ø10 ; barre verticale de descente (12,13)→(12,21). Deux échantillons comparés |
| 🚀 | 2 | Performance, accélération | `sys--performance` | D + D + A. Deux diagonales parallèles montantes ; arc de sortie en haut. **Aucune fusée** : une accélération se lit par la pente |
| 🔥 | 2 | Lead prioritaire, chaud | `sys--chaud` | E + E. Deux segments d'escalier convergents vers le haut. Une montée, pas une flamme |
| ❄ | 1 | Prospect froid | `sys--froid` | G + G. Deux grilles de points 2 × 2 décalées, **interrompues** (règle 5). Un état de mesure bas, pas un flocon |
| 💎 | 1 | Qualité maximale | `sys--qualite` | C + D + D + D. Cercle Ø10 ; trois diagonales formant un losange ouvert autour de lui. Facettes lues comme un calibre |
| 💙 | 1 | DeepSeek (fournisseur) | `sys--fournisseur` | C + C + B. Même base que `actu--regler`, avec la barre d'index décalée de 45°. Différenciation par un **décalage mesurable**, pas par une couleur |
| 👍 | 2 | Approuver | `sys--approuver` | A + B. Arc Ø16 ouvert vers le haut ; barre de base (8,18)→(16,18). Validation par un arc de seuil |
| 👌 | 1 | Confirmation courte | `sys--confirmer` | C + D. Cercle Ø18 ; diagonale courte de contrôle (14,9)→(18,13). Variante légère de `etat--valide` |
| ⏳ | 43 | En attente, en cours | `etat--attente` | A + A + C. **Sablier géométrique** : trapèze supérieur ouvert, trapèze inférieur ouvert, cercle Ø2 au centre. Trois formes, cadre vide. **L'emoji le plus utilisé du cockpit après ✅** |
| ⏱️ | 1 | Durée estimée | `etat--duree` | C + D + D. Cercle Ø16 ; aiguille (12,12)→(12,5) ; aiguille courte (12,12)→(16,12). Chronomètre schématique |
| ↗ | 1 | Lien externe | `sys--externe` | D + D + B. Diagonale (8,16)→(16,8) ; pointe (12,8)→(16,8)→(16,12) ; barre de base courte (7,17)→(10,20). Le geste d'ouverture |
| ⛔ | 1 | Quota atteint | — | Voir `etat--limite` |

### Utilisation, une fois la table appliquée

```html
<!-- Libellé de bouton : l'icône précède, le mot suit, l'icône se tait -->
<button class="btn2 btn2--secondaire">
  <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true" focusable="false">
    <path d="M5 3v6h6"/><path d="M19 21v-6h-6"/>
    <path d="M5 9a8 8 0 0 1 14-3"/><path d="M19 15a8 8 0 0 1-14 3"/>
  </svg>
  Actualiser
</button>
```

**La taille est portée par la classe, jamais par l'attribut** — les icônes
courantes font 16 px dans un bouton, 20 px dans un en-tête, 24 px dans un état
vide et **jamais plus**. Le `width`/`height` en dur dans le SVG est ce qui produit
aujourd'hui des mélanges de tailles dans la même rangée.

**Trois règles d'écriture** :
1. **Une icône n'apparaît jamais seule sans nom accessible.** Si le bouton n'a pas
   de texte visible, il porte un `aria-label` — jamais un `title` seul.
2. **Une icône ne porte jamais l'information seule.** `⚠️ Réponse cron: …` doit
   dire « Réponse cron : … » avec l'icône à côté, pas à la place.
3. **Les emojis ne sont pas retirés des chaînes de notification seulement** : les
   101 `innerHTML` doivent être passés au crible, `🛑 Bouton "Stopper relances"`
   est un **commentaire de code** et n'est pas concerné.

---

## 7. Grille et points de rupture

### Le fait de départ

Le cockpit est utilisé **sur un écran d'ordinateur large**. Les paliers ci-dessous
ne sont donc pas une concession au mobile : **ce sont des paliers de confort
décroissant sur un poste de travail**, plus un plancher de survie sous 1024 px,
qui ne doit simplement rien casser.

Aujourd'hui : `.wrap { max-width:1280px }`, une seule colonne de contenu, un
bandeau de 137 px avec 305 px de débordement horizontal, et 10 boutons de poids
identique. **Le débordement horizontal est le pire défaut du lot** : sur un poste
de 1440, une partie de la navigation est hors écran, et un bouton se casse sur
4 lignes (« Anti-ban »).

### La structure

Trois zones, et jamais plus :

```
┌──────────┬────────────────────────────────────────┬──────────────┐
│          │  bandeau : identité · état · actions   │              │
│  rail    ├────────────────────────────────────────┤  inspection  │
│  240 px  │  zone de travail : grille de cartes    │   380 px     │
│          │                                        │  (repliable) │
└──────────┴────────────────────────────────────────┴──────────────┘
```

| Zone | Largeur | Contenu | Comportement |
|---|---|---|---|
| **Rail** | 240 / 232 / 216 / 64 px | 5 destinations, un seul niveau | Se replie en rail d'icônes sous 1280, devient une barre horizontale sous 1024 |
| **Bandeau** | fluide, **56 px de haut** | Identité · état courant · **une seule** action primaire | Collant, `backdrop-filter` conservé |
| **Travail** | fluide | Grille de cartes, instruments, tableau | Seul endroit qui défile verticalement |
| **Inspection** | 380 / 360 px | Panneau latéral (§5.10) | **Colonne** au-delà de 1680, **superposé** en dessous |

**Le bandeau, corrigé.** 137 px et 12 éléments de poids identique deviennent
**56 px et trois zones** :

| Zone | Contenu | Traitement |
|---|---|---|
| Identité | « ePerformance · Cockpit » | T2 (Cormorant 24), `--text`. **Le dégradé or disparaît** (engagement 1) |
| État courant | Fournisseur IA · compte client · quota | Badges neutres + **un seul** chiffre en T1 tabulaire. **Le badge fournisseur n'est plus or ni cliquable par accident** |
| Actions | La destination courante + **une action primaire** | L'or apparaît **ici et nulle part ailleurs** dans le bandeau |

**Les 305 px de débordement disparaissent par construction** : 5 destinations
vivent dans le rail (240 px fixes), pas dans le bandeau. Le bandeau ne contient
plus jamais une liste de navigation, donc il ne peut plus déborder.
**« Anti-ban » ne se casse plus sur 4 lignes** : ce n'est plus un bouton, c'est un
compteur de quota (chiffre + barre de 4 px), qui vit dans la zone d'état.

### Les cinq paliers

| Palier | Largeur | Rail | Travail | Inspection | Cartes | Marges | Notes |
|---|---|---|---|---|---|---|---|
| **A — Poste large** | **≥ 1680** (dont 1920) | 240 fixe | fluide, plafonnée à **1320** | **380, en colonne** | **3 (4 si inspection fermée)** | `--e-8` (32) | Le palier nominal du poste de travail |
| **B — Poste standard** | **1440 – 1679** | 232 | fluide | **360, superposé** | **3** | `--e-6` (24) | Le palier de confort minimum garanti |
| **C — Poste étroit** | **1280 – 1439** | 216 | fluide | 360, superposé | **3** | `--e-6` (24) | Dernier palier à 3 colonnes |
| **D — Petit poste** | **1024 – 1279** | **64 (icônes)** | fluide | 360, superposé | **2** | `--e-5` (20) | Le rail perd ses libellés, garde ses info-bulles |
| **E — Plancher** | **< 1024** | barre horizontale 56 | fluide | **plein écran** | **1** | `--e-4` (16) | Aucune garantie de confort, garantie de non-casse |

### Ce qui se passe exactement, à chaque palier

**1920 px.** Le pire risque est celui-ci : une grille élastique étire les cartes
sur 1 656 px, soit 6 colonnes de 260 px — l'œil ne peut pas suivre une ligne sur
cette largeur, et une carte de 260 px ne contient pas un nom de prospect en T4.
**Corrigé** : la zone de travail est **plafonnée à 1320 px** et la grille est
**plafonnée à 4 colonnes**. Au-delà de 1 320 px, la largeur gagnée n'est pas
distribuée aux cartes : elle devient **la colonne d'inspection**, qui passe
d'overlay à colonne réelle. C'est le seul palier où l'inspection ne recouvre
rien — et c'est le bon comportement en 1920, puisqu'il y a la place.

**1440 px.** Le palier de confort. Vérifié : 1440 − 232 (rail) − 48 (marges) =
**1 160 px de zone de travail**. Trois colonnes de 320 px minimum demandent
3 × 320 + 2 × 24 = **1 008 px**. Il reste 152 px de marge — c'est ce qui autorise
`--e-4` de rembourrage de carte sans que le texte se replie. **L'inspection passe
en superposition** : la liste ne se rétrécit pas, l'objet consulté s'ouvre
par-dessus. C'est ce qui permet de parcourir les 22 prospects et d'ouvrir une
fiche sans perdre sa position dans la liste.

**1280 px.** Dernier palier à trois colonnes : 1280 − 216 − 48 = **1 016 px**,
soit 3 × 320 + 32 de gouttières = 992 px. **24 px de marge.** C'est serré et
c'est assumé — en dessous, on passe à deux colonnes plutôt que de comprimer les
cartes. C'est la largeur du poste secondaire.

**1024 px.** Deux colonnes. Le rail se replie à **64 px** : les 5 icônes seules,
avec info-bulle **et** `aria-label`. La largeur gagnée (216 − 64 = 152 px) va
entièrement à la zone de travail, qui reste à 2 × 320 + 24 = 664 px sur 912
disponibles.

**Sous 1024 px.** Le rail devient une **barre horizontale de 56 px en haut**,
défilante horizontalement, avec 5 icônes. L'inspection devient **plein écran**
(elle remplace la vue, avec un retour explicite). Les cartes passent à **1
colonne**. **Le tableau se replie en cartes `--ligne`** : chaque ligne devient
une carte, chaque colonne devient une paire libellé / valeur en T7 / T6. Un
tableau à 6 colonnes sur 1024 px ne se lit pas — il ne doit pas être comprimé, il
doit changer de forme.

### Trois règles de grille non négociables

**1. Aucun débordement horizontal, à aucun palier.** C'est la règle qui coûte le
plus cher aujourd'hui (305 px). Vérifiable : `document.documentElement.scrollWidth
<= window.innerWidth` sur les 5 paliers, dans les 12 vues. C'est un test
automatisable, donc une règle tenable.

**2. La zone de travail est la seule qui défile.** Rail, bandeau et inspection
sont fixes. Aujourd'hui, le bandeau est `position:sticky` mais la page entière
défile : ouvrir une modale depuis une position de défilement basse la fait
apparaître en dehors du regard.

**3. Le contenu ne se comprime jamais pour tenir.** Il change de forme :
tableau → cartes, 4 colonnes → 3, panneau en colonne → panneau superposé. Une
carte de 240 px de large est un échec, pas une adaptation.

### Les seuils, en jetons

```css
:root {
  --rail:            240px;
  --rail-plancher:    64px;
  --bandeau:          56px;
  --inspection:      380px;
  --travail-max:    1320px;

  --gouttiere:       var(--e-6);   /* 24 — entre colonnes */
  --marge-page:      var(--e-6);   /* 24 — puis --e-8 (32) au-delà de 1680 */
}

@media (min-width: 1680px) { :root { --rail:240px; --inspection:380px; --marge-page:var(--e-8); } }
@media (max-width: 1679px) { :root { --rail:232px; --inspection:360px; } }
@media (max-width: 1439px) { :root { --rail:216px; } }
@media (max-width: 1279px) { :root { --rail:var(--rail-plancher); --gouttiere:var(--e-5); --marge-page:var(--e-5); } }
@media (max-width: 1023px) { :root { --rail:0px; --marge-page:var(--e-4); } }
```

### Et la question qui n'est pas dans le brief : la largeur du texte

Sur un poste large, **une ligne de texte de 1 320 px de large ne se lit pas** : au
retour à la ligne suivant, l'œil saute la ligne ou reprend la précédente. Toute
zone de texte **rédigé** (notes d'un prospect, contenu d'une publication, message
généré) est donc plafonnée :

```css
--lecture: 68ch;   /* déjà déclaré par le site */
```

**La grille de cartes peut être large ; le texte à l'intérieur des cartes ne
l'est pas.** C'est la distinction que le site public fait depuis le début
(`--reading: 68ch`) et que le cockpit n'a jamais faite : il n'existe **aucune
limite de largeur de lecture dans le fichier**. Relevé réel des conteneurs de
texte rédigé : la modale de base fait `min(480px, 92vw)`, celle d'édition de
publication `min(700px, 94vw)` — soit environ 100 caractères par ligne, bien
au-delà des 68 — et le socle prévoit `--lg` à 880 px, soit **125 caractères par
ligne**. Aucun de ces trois conteneurs ne plafonne son texte rédigé.

**Corrigé** : `--lecture` s'applique au **contenu rédigé** (texte d'une
publication, message généré, note de prospect, texte d'aide), à l'intérieur de
son conteneur, quel qu'en soit le palier. Le conteneur peut être large — c'est le
bloc de texte qui ne l'est pas.

---

## 8. Ce que ce document résout, défaut par défaut

Chaque défaut mesuré du brief, et la section qui le traite.

| Défaut mesuré | Résolu en | Comment |
|---|---|---|
| 10 boutons de poids identique, bandeau 137 px, débordement 305 px, « Anti-ban » sur 4 lignes | §7 | Bandeau de 56 px à 3 zones ; **la navigation quitte le bandeau** pour un rail de 240 px — le débordement devient structurellement impossible ; « Anti-ban » devient un compteur de quota, pas un bouton |
| 6 indicateurs KPI de poids identique, dont deux affichent une absence de donnée sans distinction | §2, §5.2, §5.12 | Hiérarchie **T0 (40) / T1 (32) / T7 (12)** : un chiffre de tête, trois instruments, le reste en ligne de lecture. Trois états typographiques distincts : `—` (aucune donnée), `0` (donnée réelle), `·` (non applicable) |
| Libellés de KPI à 12 px en `--muted` à 3,37:1 | §2 | `--muted` est aujourd'hui à **5,63:1** sur `--card` (vérifié). Le plancher de 12 px est autorisé **parce que** le contraste est mesuré. T7 en capitales avec `--ls-etiquette` |
| 22 listes déroulantes sans nom accessible, valeurs techniques brutes | §2, §5.4 | `<label for>` obligatoire, classe `visuellement-masque` quand la place manque (jamais `display:none`). Table de correspondance unique `Contacté_J0 → Contacté` |
| 2 règles `:focus-visible` pour 198 éléments | §4, §5.1 | Une déclaration `:where(...)` globale couvre boutons, liens, champs, listes, cartes et onglets. Anneau `--gold` à **8,20:1 minimum** (contre 3,14:1 pour `--border-strong`) |
| 18 cibles cliquables sous 24 px | §4, §5.1 | Plancher de **28 px**, autorisé seulement dans une ligne de 40 px. Les badges de score redeviennent non interactifs |
| Deux hauteurs de carte (164 et 210) pour le même objet | §5.2 | Hauteur imposée à **168 px** (40 + 56 + 40 + 2 × 16) et `align-items:start` sur la grille : une carte ne s'étire plus pour égaler sa voisine |
| Bordure verte sans légende sur une carte | §4, §5.2 | Le vert est réservé à « confirmé par l'extérieur ». La carte due passe à **l'or** + trois indices non chromatiques : bordure 2 px, pastille d'échéance, mot « Aujourd'hui » |
| 4 couleurs de boutons sans légende dans Publications | §4, §5.1 | Règle unique : **la couleur dit la conséquence, l'icône dit la catégorie.** 9 boutons colorés → 1 primaire, 7 secondaires, 1 destructif |
| 35 emojis (réel : **65**, 348 occurrences) | §6 | Table complète des 65, avec construction géométrique dans le langage Instrumentation : 7 primitives, trait 1,5, grille de 4, `currentColor` |
| *(hors brief)* Outfit non embarquée — tous les chiffres en police système | §0.1 | 3 fichiers `.woff2` à ajouter, plus un repli déclaré |
| *(hors brief)* `opacity:.5` sur les contrôles désactivés | §4 | Mesuré : la bordure tombe à **1,68:1** et le contrôle n'est plus identifiable. Recoloration au lieu de diminution |

---

## 9. Ordre d'implémentation

1. **Jetons** (§2, §3, §4) — le bloc `:root` du cockpit, plus les 2 jetons à
   ajouter à `eperf.css` en clair et en sombre.
2. **Embarquer Outfit** (§0.1) — 3 `.woff2`, 3 `@font-face`, un repli.
3. **L'anneau de focus global** (§4) — une déclaration, 198 éléments corrigés.
4. **Le bandeau et le rail** (§7) — c'est ce qui supprime le débordement.
5. **Les 15 composants** (§5) — le socle existe déjà pour 9 d'entre eux : c'est
   un delta, pas une réécriture.
6. **Les icônes** (§6) — 65 SVG, une seule fois, dans un objet `UI.icone()`.
7. **Les écrans** — les 12 panneaux, un par session, en composant depuis le socle.

**Ce que ce document ne tranche pas**, parce que ce n'est pas son périmètre :
le sort des 50 routes Flask, la persistance côté serveur des brouillons et des
filtres, et le découpage du fichier unique. Ces trois questions sont posées dans
`AUDIT-ET-STRATEGIE.md` (§5) et `CONCEPTION.md` (« Ce qu'il faut décider »), et
aucune n'est résolue par un système visuel.

---
**Système visuel du Cockpit ePerformance** — 19 septembre 2026
**Périmètre** : jetons, typographie, espacement, états, composants, icônes, grille
**Contrat respecté** : C3 (aucun jeton renommé), zéro emoji, zéro hexadécimal en dur, WCAG AA
**Prêt pour l'implémentation** : chaque valeur est nommée, chaque contraste est calculé
