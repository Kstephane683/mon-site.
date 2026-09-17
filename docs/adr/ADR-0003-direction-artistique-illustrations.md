# ADR-0003 — Direction artistique des illustrations de cartes

**Date :** 17 septembre 2026
**Statut :** Accepté
**Contexte :** le brief demande des illustrations SVG custom, abstraites et sobres, pour ~25 cartes du site et du blog. Trois directions étaient envisageables ; le brief demande de décider et de justifier, pas de faire choisir.

---

## Le problème à résoudre

Les cartes portent aujourd'hui une icône Feather monochrome de 24 px dans un carré de 46 px. C'est propre, mais **une icône de 24 px ne dit pas de quoi parle une carte**. Le visiteur doit lire le titre. Et visuellement, la carte est pauvre : un petit glyphe dans beaucoup de vide.

Contrainte de fond : **la marque vend des ratios, de la mesure, de la précision.** Un site qui vend du CAC, de la LTV et du Payback ne peut pas se permettre des illustrations décoratives qui ne mesurent rien.

---

## Trois directions examinées

### Direction 1 — « Organique » (écartée)

Formes fluides, courbes douces, dégradés subtils. C'est le langage d'undraw et de la majorité des illustrations générées.

**Écartée** parce que le brief l'interdit explicitement, et à raison : c'est un langage *mou*, générique, reconnaissable, et il dit l'inverse de la rigueur vendue. Sur un site qui parle de marges nettes, des courbes douces sont un contre-message.

### Direction 2 — « Isométrique technique » (écartée)

Volumes en perspective, grilles 3D, profondeur simulée.

**Écartée** parce que c'est le cliché du site B2B tech, et parce que la perspective ajoute de la complexité visuelle là où la carte a besoin de lisibilité. Le brief interdit aussi la 3D isométrique.

### Direction 3 — « Instrumentation » (retenue)

**Une illustration ePerformance est un instrument de mesure, pas un dessin.**

Le langage visuel est dérivé des objets réels du métier : la règle graduée, le cadran, le graphe, l'axe, le seuil, l'échantillon. Aucune forme n'est décorative — chaque trait est une graduation, une mesure ou une trajectoire.

---

## Le langage visuel, en règles exécutables

### Répertoire de sept primitives

Aucune illustration n'utilise autre chose que ces sept formes :

| Primitive | Sens | Usage |
|---|---|---|
| **Cercle concentrique** | calibrage, mesure | cible, cadran, précision |
| **Arc gradué** | seuil, progression | atteinte d'un palier |
| **Barres verticales** | distribution, échantillon | séries de données |
| **Grille de points** | points de mesure | échantillonnage, densité |
| **Segment en escalier** | croissance, palier | progression discrète |
| **Rectangle imbriqué** | structure, cadre | modules, composition |
| **Diagonale** | trajectoire, tendance | direction, pente |

### Cinq règles non négociables

**1. Un seul accent or par illustration.** Le reste est en `currentColor` et en `var(--border)`. Deux accents et la composition devient bruyante ; l'or cesse de signaler.

**2. Aucune couleur littérale.** Les traits utilisent `currentColor` (qui suit le thème via `color: var(--gold)` sur le conteneur) et `var(--border)` / `var(--gold-border)`. Une illustration écrite avec `#c9a96e` casserait le thème clair.

**3. Grille de 4 px.** Toutes les coordonnées sont des multiples de 4 dans un `viewBox="0 0 120 72"`. C'est ce qui produit l'alignement perçu comme « mesuré ».

**4. Épaisseur de trait : deux valeurs seulement.** `1` pour la trame de fond, `1.5` pour la forme structurante. Jamais trois — c'est la discipline qui distingue le sobre du confus.

**5. La trame est toujours partielle.** Une grille de points qui couvre toute la surface devient un aplat. Elle est interrompue, ou limitée à un quadrant.

### Différenciation par concept

Chaque illustration est une **combinaison unique de deux ou trois primitives**, ce qui garantit qu'aucune ne ressemble à sa voisine tout en restant dans le même langage.

| Carte | Composition |
|---|---|
| Stratégie & acquisition | cercles concentriques + un point hors axe = écart à la cible |
| IA générative | nœuds reliés, un nœud or = génération depuis un corpus |
| Automatisation | rectangles chaînés en boucle, un maillon or = cycle sans intervention |
| Web premium | grille modulaire, un module or surélevé = hiérarchie |
| CAC | barres décroissantes, la plus courte en or = coût qu'on réduit |
| LTV | barres ascendantes cumulées, la dernière en or = valeur dans le temps |
| Payback | arc gradué avec un repère or = franchissement du seuil |
| Marge nette | deux rectangles superposés, l'écart en or = ce qui reste |
| Méthode 01 → 04 | complexité géométrique croissante = progression de la méthode |
| Formules 1 → 3 | 1, 2 puis 3 modules empilés = montée en périmètre |
| Cas client | escalier de barres + point or = résultat mesuré |

---

## Application : icône, illustration, ou les deux

Le brief laisse le choix par carte. Règle retenue :

- **Les cartes larges** (piliers, ratios, méthode, cas d'usage) reçoivent **l'illustration seule**. L'icône y serait redondante.
- **Les cartes compactes** (formules, article-card, pilier-card) reçoivent **l'illustration en bandeau**, l'icône restant pour l'ancrage visuel rapide.
- **Aucune icône n'est supprimée** sans que l'illustration porte le sens à sa place.

L'illustration est **décorative** (`aria-hidden="true"`) dans tous les cas : elle double un titre qui porte déjà l'information. La rendre descriptive ferait doubler la lecture aux lecteurs d'écran sans rien ajouter.

---

## Ce que cette direction évite

Les tics visuels qui trahissent une illustration générée :

- Pas de blob, pas de forme organique « amibe »
- Pas de dégradé multicolore
- Pas d'objet figuratif (fusée, ampoule, engrenage, ordinateur)
- Pas de personnage, pas de visage, pas de main
- Pas de ligne qui serpente sans raison
- Pas de cercle décoratif isolé en coin
- Pas d'illustration identique déclinée par changement de couleur
- Pas de remplissage : ce sont des **traits**, pas des aplats

---

## Conséquences

**Positives :**
- Langage reproductible : n'importe quelle future carte peut recevoir une illustration cohérente en combinant deux primitives
- Zéro requête, zéro bitmap, zéro dépendance — du SVG inline
- Thème clair/sombre automatique par `currentColor`
- Signature reconnaissable : les illustrations disent « mesure » avant de dire « carte »

**Négatives, assumées :**
- **Le style est austère.** C'est délibéré : le brief dit « si tu hésites entre deux directions, choisis la plus sobre ». Sur un site qui vend des marges nettes, l'austérité est un argument, pas un défaut.
- **Le poids augmente.** Chaque illustration pèse 300 à 600 octets ; il y en a ~25, soit 8 à 15 Ko. Non compressible par gzip de façon spectaculaire (le SVG se compresse bien, ~60 %), mais c'est du contenu inline, pas une requête.
- **Demande de la discipline.** Une illustration hors langage décrédibiliserait l'ensemble. Le contrôle est donc explicite : sept primitives, cinq règles.

---

## Vérification

Un contrôle automatique vérifie que chaque illustration produite respecte les règles : aucune couleur littérale, un seul accent or, coordonnées multiples de 4, deux épaisseurs de trait maximum, `aria-hidden` présent.
