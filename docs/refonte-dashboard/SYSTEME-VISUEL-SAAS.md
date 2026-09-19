# Dashboard unifié ePerformance — Système visuel SaaS

Document de conception. Il ne décrit aucune implémentation : il prescrit, valeur par
valeur, ce que l'implémentation doit produire. Chaque affirmation de contraste, d'écart
de couleur ou de comptage est **calculée** ; chaque chiffre est reproductible par la
méthode donnée en §9.

**Objet.** Le langage visuel du dashboard unifié qui absorbe `toolkit_eperformance/cockpit.html`
(socle), et dont le `cockpit.html` de `agent-ia-web` fournit la structure de navigation.

**Sources mesurées.**

| Sigle | Fichier | Ce qui en est tiré |
|---|---|---|
| `A` | `toolkit_eperformance/cockpit.html` | le socle de composants, les jetons, les états, les emojis |
| `B` | `toolkit_eperformance/dashboard.html` | 4 graphiques, 7 KPI, le tableau filtrable, 358 séquences emoji |
| `C` | `agent-ia-web/templates_dashboard/dashboard.html` | la coque SaaS (rail, sections, KPI), 2 CDN |
| `SITE` | `site-eperformance/assets/css/eperf.css` | un **dérivé conforme** des jetons (11/12 identiques au noyau en thème sombre), 59 noms, deux thèmes |
| `NOYAU` | `agent-ia-web/eperf_core/assets/css/` + `agent-ia-web/eperf_core/jetons.py` | **la source canonique des jetons** (§9, contrôle 3 bis) — arbitrage du NOYAU du 19/09 |
| `DSU` | `/home/ballo/OX6A/DESIGN-SYSTEM-UNIFIE.md` (480 l.) | un document de **description**, hors dépôt : il décrit, il ne fait pas foi. Le chemin cité dans la version antérieure (`design-system/DESIGN-SYSTEM-UNIFIE.md`) **n'existe pas** |
| `CV` | `docs/refonte-cockpit/SYSTEME-VISUEL.md` | le système visuel du cockpit, 1 502 lignes — **repris, corrigé, étendu** |
| `M5` | `docs/refonte-dashboard/AUDIT-M5-SOCLE.md` | l'état réel du socle : 0 % d'utilisation, polices en 404, 315 séquences |
| `AE` | `docs/refonte-cockpit/ARCHITECTURE-ECRANS.md` | les 5 destinations, les 4 états d'écran obligatoires, les paliers |

**Contrat.** Les noms de jetons de couleur et de police sont gelés (contrat C3). Ce
document n'en renomme aucun. Il en ajoute deux, nommés et justifiés en §2.2, et il en
**retire trois** de la déclaration du dashboard (§2.2), ce qui n'est pas un renommage.

---

## 0. Ce qui est repris, ce qui est corrigé, ce qui est abandonné

### 0.1 Repris tel quel de `CV`

Le système visuel du cockpit n'est pas refait. Ces blocs passent au SaaS sans
modification, et le SaaS les **étend** au lieu de les redéfinir :

| Repris | Pourquoi c'est déjà juste |
|---|---|
| Les trois engagements (§1 de `CV`) | Ils sont mesurables (`grep`-vérifiables) et ils tiennent sur un poste de commande |
| L'échelle typographique à 8 niveaux (§2 de `CV`) | Elle remplace 13 tailles par 8, sur la grille de 4 px |
| L'échelle d'espacement base 4 px et le plafond à 48 (§3 de `CV`) | C'est ce qui rend 22 lignes lisibles sur un écran |
| Les 5 rayons `--r-xs / --r-sm / --r / --r-lg / --r-pill` et la règle du coin imbriqué | La règle `interne = externe − rembourrage` distingue une interface finie d'une interface approximative |
| Les trois règles anti-concurrence A, B, C (§4 de `CV`) | La règle C est démontrée par la mesure ci-dessous (§2.7), pas seulement affirmée |
| La récoloration du désactivé au lieu de l'opacité | Mesuré : `opacity:.5` fait tomber la bordure à 1,68:1 |
| L'anneau de focus `--gold` 2 px, `offset:2px`, global | 8,48:1 minimum contre 3,25:1 pour `--border-strong` |
| Les 4 cas d'état vide et les 3 paliers de chargement | Ils correspondent aux 4 états d'écran obligatoires de `AE` §2 |
| Le langage « Instrumentation » décliné en icônes 24 × 24 | 7 primitives, 3 primitives maximum par icône, trait 1,5, `currentColor` |
| Le tableau des états et ses 11 lignes | Étendu à 13 en §2.5 (`partiel`, `périmé`) |
| La règle « la couleur d'un bouton dit sa conséquence, la catégorie est portée par l'icône » | Elle transforme 9 boutons colorés en 1 primaire + 7 secondaires + 1 destructif |

### 0.2 Corrigé, avec la mesure qui l'impose

Treize corrections. Elles portent toutes sur des valeurs écrites, pas sur des intentions.
La colonne « pourquoi » est le seul endroit qui compte : une correction sans mesure est
un goût.

| # | Ce qui est écrit aujourd'hui | Ce qui est décidé | Pourquoi (mesuré) |
|---|---|---|---|
| 1 | `.btn2--primaire { color:#08080c }` (`A:184`) | `color: var(--on-gold)` | Une valeur hexadécimale hors `:root` viole la règle (c). `--on-gold` existe et vaut `#0a0a0e`, 8,83:1 sur `--gold` |
| 2 | `.btn2[disabled] { opacity:.5 }` (`A:180`) | recoloration : fond `--bg2`, bordure `--border`, texte `--muted` | À 50 %, la bordure tombe à **1,68:1** : le contrôle n'est plus identifiable |
| 3 | `.carte2--stat .valeur { font:600 42px var(--police-titres) }` | `--police-chiffres`, T1 (32 px) | Le même objet — un nombre mesuré — changeait de police selon le composant. Cormorant rend des chiffres elzéviriens non tabulaires (§3.3) |
| 4 | `.btn2--destructif` : 4ᵉ variante | **modificateur** de `secondaire` | « Destructif » n'est pas un poids dans la hiérarchie d'action, c'est un avertissement sur une action secondaire. Un 4ᵉ poids affaiblit les trois autres |
| 5 | Tailles `11px` (badge, étiquette, `th`), `13px` (texte, message), `15px` (`--lg`) | 12 / 14 / 16 | Trois tailles hors grille, sur 4 composants, dans un système qui en compte 8 |
| 6 | `.badge2--attente { color: var(--gold) }` | classe renommée **`.badge2--a-decider`** | **Collision de nom** : le jeton `--attente` est le bleu acier « en cours » (§2.2). Deux sens opposés sous un mot identique |
| 7 | `.progression2 > .barre > i { background: var(--gold) }` | `var(--attente)` | Une barre de progression est un objet passif : elle ne dit ni « ici tu agis » ni « voilà l'état actuel ». Elle consommait le budget d'or (engagement 2) |
| 8 | `.squelette2 { border-radius: 8px }` | le rayon de l'objet remplacé (`--r` ou `--r-sm`) | 8 px n'est sur aucune échelle du projet ; un squelette de carte à 8 px annonce une carte à 20 px |
| 9 | `--avertissement: #e2914f` (`CV` §4) | **`#e58a3c`** | Écart à l'or : ΔE76 **24,4 → 32,1** en vision normale, **18,3 → 30,7** en deutéranopie, **11,7 → 24,0** en protanopie. Contraste conservé : 7,65 / 7,47 / 7,26 / 7,02 sur les 4 surfaces |
| 10 | 6 badges de statut (`.badge2--brouillon…--file`) | 9 badges (§5.6) | `AE` §2 exige un état `partiel` ; il manquait aussi `à décider` (l'or) et `en cours` (le bleu) |
| 11 | `T3` en Cormorant 18 px (`CV` §2) | **T3 en DM Sans 600, 18 px** ; Cormorant ne descend pas sous 20 px | Un Garamond à 18 px sur `#101014` perd ses déliés. Et 24 → 18 = rapport 1,33, contre 24 → 20 = 1,20, sous le minimum de 1,25 que le projet s'est fixé (`DSU` §2.7) |
| 12 | Pas de règle pour la donnée périmée ; le cockpit affiche `0 %` et `—` sans doctrine | 7 états typographiques (§4.1) | « zéro mesuré », « non mesuré », « non applicable », « non calculable », « partiel », « périmé » sont six choses différentes ; le cockpit en rend une seule |
| 13 | La pile de repli `'Cormorant Garamond', Georgia, serif` (`A:154`) | `'Cormorant Garamond', 'Cormorant Fallback', Georgia, serif` | Deux noms de repli manquants, déjà écrits dans `SITE:144-145`. C'est une correction de deux chaînes |

**Deux corrections de fond, qui ne sont pas dans le tableau parce qu'elles ne sont pas
visuelles mais qui conditionnent tout l'affichage** (`M5` §6.4 et §6.5) :

- **Les 7 `@font-face` de `A` renvoient 404 en HTTP.** Le chemin `../site-eperformance/assets/fonts/`
  est juste sur le disque et faux à l'URL : `urljoin` ne remonte pas au-dessus de la racine.
  Vérifié : `curl` renvoie 404 sur les deux instances. **Le cockpit tourne en
  police système.** Aucun système visuel ne corrige cela — il exige une route
  `send_from_directory`, ou les polices dans un dossier statique du toolkit, **et il exige
  que les trois polices soient vérifiées par un contrôle automatique** (§9, contrôle 4).
  **Rectification du 19/09 (correction H) :** ces 7 règles **ne datent pas de plusieurs
  semaines** — avant le commit `8389309` du 19/09 03:25, `cockpit.html` n'avait **aucun**
  `@font-face` (0 requête, 0 erreur sur les douze jours précédents) et tournait en police
  système **par construction** ; les 7 règles et les **62 seuls 404 de l'historique** sont
  arrivés avec ce commit, qui est celui de la refonte. Le fait mesuré reste « le cockpit
  tourne en police système », la cause est **une régression de la refonte**, et la
  correction est la même (`CONTRE-EXPERTISE §G0`).
- **`Outfit` n'existe pas sur le disque** et 4 règles l'invoquent sans pile de repli
  (`A:24,43,50,61`) — dont `.kpi .v`, les 5 valeurs de KPI. Elle doit être **embarquée**
  (§3.4), pas remplacée par du repli silencieux.

### 0.3 Ce que le SaaS absorbe des deux autres dashboards

Uniquement de la mise en page et de la structure. Aucune couleur, aucune police, aucun CDN.

| Absorbé | Source | Nature |
|---|---|---|
| Rail de navigation à sections, 5 destinations, une seule visible | `C` | Structure. Le rail ne disparaît jamais avant 1024 px, il se réduit |
| Grille de KPI en tête de vue | `B`, `C` | Structure |
| 4 visualisations de répartition (statuts, scores, pays, secteur) | `B` | **Le besoin**, pas l'outil : Chart.js est un CDN, il est remplacé par 4 formes SVG du langage (§4.4) |
| Tableau filtrable + export | `B` | Structure |
| États de chargement par squelette | `C`, et le socle `A` | Le socle existe déjà pour cela |
| Sélecteur de compte client dans le bandeau | `AE` §2 | Un compte à la fois — pas un niveau de navigation |

### 0.4 Abandonné

| Abandonné | Où c'était | Pourquoi |
|---|---|---|
| Palette `#0A0B0F` + `success/warning/danger/info` | `B:9` | 8 jetons qui ne correspondent à aucun canon. Un **cinquième** vocabulaire d'état |
| Palette Tailwind indigo `#6366f1` / `slate-900` | `C:16-32` | Générique, hors marque : l'or et l'encre disparaissent |
| 3 dégradés radiaux animés sur le fond | `C:36,83` | Engagement 1 : en sombre, un dégradé de fond ne se lit pas, il salit |
| `backdrop-filter: blur(20px)` de la coque | `C` | Le verre dépoli sur du sombre ne sépare rien. Seuls deux `blur()` restent dans le système : le bandeau collant et le voile de modale — ils séparent, ils ne décorent pas |
| Les 2 `@font-face` Google Fonts | `B:5`, `C:7-8` | Règle (a) : aucune police par CDN. Le dashboard tourne hors ligne (`A:161`) |
| `transform: translateY(-1px)` au survol d'une carte ou d'un bouton | `A`, `C` | Le site n'agrandit ni ne soulève jamais un contrôle (`SITE:509` fait `translateY(1px)` **à l'actif**). Un élément qui bouge au survol déplace la grille pour rien |
| Le titre en dégradé or (`background-clip:text`) | `A` | Un dégradé d'accent est un tic listé par `ADR-0003`. Et il met de l'or sur un titre — interdit par l'engagement 2 |
| Les 4 jetons sans consommateur | `A:146,147,156,157` | `--gold-bg`, `--gold-border`, `--arrondi`, `--arrondi-sm` : déclarés, consommés 0 fois. Un jeton sans consommateur est une invitation à la dérive |
| `--r-xl: 36px` du site | `SITE:205` | 36 px de rayon sur une surface de 300 × 150 donne un galet. Le dashboard ne le consomme pas |

---

## 1. Direction visuelle — trois engagements

Le dashboard est un **poste de commande**. La différence avec un produit grand public
n'est pas esthétique, elle est fonctionnelle : un poste de commande est jugé sur ce qu'il
permet de décider, pas sur ce qu'il donne envie de regarder. L'utilisateur est unique, il
y passe **20 minutes par jour**, et il cherche la ligne qui a changé — pas une page à lire.

Trois engagements. Chacun a un critère de vérification qui tient en une commande.

### Engagement 1 — Le fond disparaît

`--bg` (`#08080c`) est un vide. Les surfaces (`--card` `#101014`, `--card2` `#14141a`) sont
posées dessus. Ce qui sépare deux surfaces en thème sombre, c'est la **bordure de 1 px**,
jamais une ombre : une ombre portée sur du noir ne produit aucun décalage perceptible de
luminance, elle produit un halo.

**Conséquence, et c'est un ajout propre au SaaS** — la coque SaaS apporte exactement les
trois effets que cet engagement interdit : **3 dégradés radiaux animés** sur le fond, un
**verre dépoli** sur l'en-tête, et des **ombres portées** sur les cartes. Ils sont refusés.

*Ce qui reste, et pourquoi* : deux `backdrop-filter: blur()` — le bandeau collant (le
contenu défile dessous, la séparation doit tenir quelle que soit la position de défilement)
et le voile de modale (il détache la boîte du fond). Ce ne sont pas des effets, ce sont
deux séparations que la bordure seule ne peut pas produire.

*Critère* : `grep -c 'linear-gradient\|radial-gradient\|box-shadow'` hors du bloc `:root`
doit renvoyer **0**, sauf les 4 ombres `--shadow-*` déclarées à `:root` et utilisées
exactement 3 fois (§8.2).

### Engagement 2 — L'or est un signal, et il a un budget

L'or dit **deux choses, jamais trois** :

1. **« Ici tu agis »** — l'action primaire de la vue, et rien d'autre.
2. **« Voilà l'état actuel »** — ce qui est sélectionné maintenant : l'onglet ouvert, la
   ligne choisie, l'étape courante, la puce active.

Il ne dit **jamais** : succès, erreur, avertissement, information, décoration, titre de
section, chiffre mis en avant, catégorie de bouton.

**Le budget, chiffré :**
- **Moins de 5 % des pixels d'un écran** — soit, sur une vue ouverte : le bouton primaire,
  la puce active, l'onglet actif, l'anneau de focus, l'étape courante. **Cinq objets or au
  maximum, et cinq est déjà beaucoup.**
- **Un seul aplat or plein par écran** : le bouton primaire. Tout le reste de l'or est
  bordure, texte ou trace (`--gold-bg` à 8 %). Vérifiable :
  `grep -n 'background: *var(--gold)\b'` doit renvoyer une seule règle.

C'est l'engagement le plus dur, parce qu'aujourd'hui l'or est partout dans `A` : titre en
dégradé, `.kpi .v`, `.panel h2`, `.chip.on`, `.fbar`, `.modal h3`, `.variant`, `.tst`,
`.b-Relancé_J3`, `.s-WARM`, `.ratebox b`. **Un signal qui s'allume partout n'est plus un
signal** — c'est la cause directe du défaut « 6 indicateurs de poids identique ».

### Engagement 3 — La densité est une politesse

Le site public respire à 96 px de section. Le dashboard respire à **16 et 24**. Le même
utilisateur, mais il vient ici faire un travail pendant 20 minutes, pas lire une page.
**Pour un utilisateur quotidien, le vide n'est pas de l'élégance, c'est du défilement.**

Le SaaS ajoute une précision que le cockpit n'avait pas : la densité est **réglable, à
deux valeurs**, et l'une est le défaut selon la largeur (`AE` §7) — compacte (ligne 36 px,
défaut ≥ 1280) et confortable (44 px, défaut en dessous). Deux valeurs, pas un curseur :
un curseur continu produirait des hauteurs de ligne que personne n'a testées.

*Critère* : à 1440 × 900, la file du jour complète tient dans la zone de travail sans
barre de défilement verticale ; et à aucun palier le document ne dépasse la largeur de la
fenêtre (§7, règle 1).

### Le test, en une phrase

**Une capture imprimée du dashboard doit ressembler à un cadran, pas à une plaquette
commerciale.** Si l'or domine, si une ombre se voit, si une zone de 50 px ne porte aucune
information — c'est raté.

---

## 2. La répartition de la couleur

### 2.1 Cinq teintes, cinq sens, aucun chevauchement

| Sémantique | Jeton | Dit exactement | Ne dit jamais |
|---|---|---|---|
| **Or** | `--gold` / `--gold2` | « Ici tu agis » · « Voilà l'état actuel » | Succès, erreur, alerte, décoration, titre |
| **Vert** | `--wa` | **WhatsApp** — le canal et la marque | Succès, confirmation, « c'est bon », une action à faire |
| **Rouge** | `--erreur` / `--red-text` | « C'est cassé » · « C'est irréversible » | Attention, avertissement, prudence, ancienneté |
| **Ambre** | `--avertissement` | « Ça a failli » · « Ça vieillit » · « C'est à moitié fait » | Une action à faire, une erreur, un succès |
| **Bleu acier** | `--attente` | « C'est en cours » · « C'est en file » | Un succès, une urgence, une action |
| **Neutre** | `--text` / `--soft` / `--muted` | **Tout le reste, et c'est le régime normal** | — |

**Trois décisions qui découlent de ce tableau, et qui sont des changements par rapport à `CV` :**

**1. Le succès n'est pas une couleur.** `CV` §5.6 donnait `--wa` au badge « Publié » avec le
sens « le monde extérieur a confirmé ». Cela contredisait déjà la règle du contrat de
jetons (« `--wa` est la marque WhatsApp, elle ne se rethématise pas », `DSU` §2.6), et le
brief tranche : **le vert est réservé à WhatsApp**. Un succès ne se colore donc pas. Il se
dit par **trois marques non chromatiques** : l'icône `etat--valide`, le **mot**, et le
**résultat** (l'URL du post, la date de réponse). Régime : `--text` sur `--card2`.

*Pourquoi c'est défendable et pas austère* : dans un poste de commande, « ça va » n'est pas
une information, c'est l'absence d'information. **La couleur sert à marquer des exceptions.**
Un écran dont trois lignes portent une marque et dont les vingt autres sont neutres se lit
en deux secondes ; un écran où tout est vert, orange et rouge se relit ligne à ligne. Le
succès garde sa place, mais il n'occupe plus de surface : il passe par la notification
(§5.17) et par le mot.

**2. Le dashboard ne déclare pas les jetons `--green-text`, `--green-border`, `--green-bg`.**
Le vert y a un seul usage (WhatsApp) et un seul jeton (`--wa`). **Déclarer un jeton sans
consommateur est une invitation à l'utiliser** — c'est exactement ce qui est arrivé aux
4 jetons morts de `A:146-157` (`M5` §3.3). Ils existent dans `SITE` et dans `DSU` ; ils ne
sont pas copiés ici.

**3. Deux sens d'« attente » ne peuvent pas porter le même mot.** Le jeton `--attente`
(bleu) dit « le système travaille, toi tu ne fais rien ». La classe `.badge2--attente` de
`A` dit « quelqu'un attend **ta** décision » — c'est-à-dire « ici tu agis », donc **l'or**.
Deux sens opposés, un seul mot. Corrigé par le vocabulaire, pas par la couleur :

> **Le mot « en attente » est interdit dans un libellé d'interface.** On écrit
> **« à décider »** (or, ça te concerne) ou **« en cours »** (bleu acier, ça ne te concerne
> pas). La classe du badge devient **`.badge2--a-decider`** (le suffixe `2` du socle est
> conservé : c'est un delta, pas une réécriture).

### 2.2 Les jetons — N1 gelés, N2 dérivés

**N1 : les douze jetons gelés (contrat C3), thème sombre, ne pas toucher.**

```css
:root {
  /* ---- N1 — gelés, thème sombre (contrat C3) ------------------------- */
  --bg:#08080c;  --bg2:#0c0c10;  --card:#101014;  --card2:#14141a;
  --text:#edeae3; --soft:#b0aaa0; --muted:#8b8b96;
  --gold:#c9a96e; --gold2:#e2c07a;
  --border-strong:#646470;
  --wa:#25D366;
  --erreur:#e07070;
```

**D'où viennent ces douze valeurs, et comment on le vérifie (arbitrage du NOYAU,
19/09).** La source canonique n'est **ni** ce document, **ni** `eperf.css` du
site (qui est un dérivé : il a déjà dérivé d'une valeur), **ni** `DSU`. C'est
`agent-ia-web/eperf_core/assets/css/` — les cinq couches, lues dans l'ordre de la
cascade — **résolues par `agent-ia-web/eperf_core/jetons.py`**. Le contrôle
compare les **12 paires `(nom, valeur résolue)`**, jamais un `md5` de fichier :

| Élément | Chemin |
|---|---|
| les VALEURS | `agent-ia-web/eperf_core/assets/css/10-primitives.css` (`--p-*`, littéraux) |
| les NOMS | `agent-ia-web/eperf_core/assets/css/20-semantic.css` (alias + bloc sombre) |
| le résolveur | `agent-ia-web/eperf_core/jetons.py` (`charger_noyau`, `theme_effectif`) |

Empreintes de référence, mesurées et à citer telles quelles : **`b89dcba06940079e`
(sombre)** · **`e6d40d572271fc7d` (clair)**. Le contrôle refuse de comparer des
chaînes brutes (le même rouge s'écrit `#a8302f` au noyau et `rgb(168, 48, 47)`
dans `eperf.css`) : il normalise en littéral, `lower()`, trie, hache — et il
**échoue si la source est injoignable**. Détail et code : §9, contrôle 3 bis.

**Aucun jeton n'est renommé ici.** L'arbitrage du vocabulaire appartient au
NOYAU : les noms ajoutés pour la typographie (`--police-texte`,
`--police-chiffres`, `--police-technique`, `--t0`…`--t8`) sont soumis à une
entrée `⚠️ CONTRAT` du NOYAU, avec leur justification et leur liste — ils ne sont
pas consacrés par ce document (`AVIS-NOYAU §4.1`, `VALIDATION-CHATBOT §A5`).

**N2 : les dérivés. Trois catégories, et la troisième est celle où l'on se trompe.**

```css
  /* ---- N2a — repris du site, mêmes noms, mêmes valeurs (DSU §2) ------- */
  --border:#1c1c22;        /* décoratif : il sépare */
  --border2:#282830;       /* filet appuyé */
  --gold-bg:color-mix(in srgb, var(--gold) 8%, transparent);
  --gold-border:color-mix(in srgb, var(--gold) 22%, transparent);
  --on-gold:#0a0a0e;       /* 8,83:1 sur --gold */
  --on-wa:#0a0a0e;         /* 9,96:1 sur --wa — jamais de blanc sur le vert */
  --red-text:var(--erreur);
  --red-border:color-mix(in srgb, var(--erreur) 30%, transparent);
  --red-bg:color-mix(in srgb, var(--erreur) 12%, transparent);
  --focus:var(--gold);

  /* ---- N2b — les deux jetons nouveaux, mesurés ----------------------- */
  --avertissement:#e58a3c; /* 7,26:1 sur --card */
  --avertissement-bg:color-mix(in srgb, var(--avertissement) 10%, transparent);
  --avertissement-bord:color-mix(in srgb, var(--avertissement) 45%, transparent);
  --attente:#8ab8e6;       /* 9,11:1 sur --card */
  --attente-bg:color-mix(in srgb, var(--attente) 10%, transparent);
  --attente-bord:color-mix(in srgb, var(--attente) 50%, transparent);

  /* ---- N2c — ce qui n'est PAS déclaré ici, et c'est volontaire -------- */
  /* --green-text / --green-border / --green-bg : le vert du dashboard   */
  /*   est WhatsApp (--wa) et rien d'autre. Un jeton sans consommateur   */
  /*   est une invitation à l'utiliser.                                  */
  /* --red-bg : déclaré pour compatibilité de lecture, consommé 0 fois.  */
  /*   Le rouge n'est jamais un fond (règle 2.6).                        */
}
```

**Les deux seuils de mélange ne sont pas arbitraires** : calculés, ils sont les premiers
qui distinguent le filet de son fond sans le confondre avec le texte (voir §2.7).

**Ces deux jetons doivent aussi exister dans `eperf.css`, thème clair et sombre**, avec
leurs propres valeurs. Sans cela le dashboard invente des couleurs que le site ignore, et
la règle « le cockpit consomme les jetons du site » devient fausse au premier écran qui
affiche un avertissement. C'est un ajout, pas un renommage : C3 est respecté.

### 2.3 Les contrastes, calculés

Méthode : luminance relative WCAG 2.1, `(L1+0,05)/(L2+0,05)`, sRGB, sur les **quatre**
surfaces du thème sombre. Les valeurs ci-dessous sont recalculées pour ce document ; elles
remplacent celles de `CV` là où elles diffèrent, et les écarts sont signalés.

| Premier plan | `--bg`<br>`#08080c` | `--bg2`<br>`#0c0c10` | `--card`<br>`#101014` | `--card2`<br>`#14141a` | Seuil | Verdict |
|---|---:|---:|---:|---:|---|---|
| `--text` `#edeae3` | 16,64 | 16,25 | 15,80 | 15,27 | 4,5 | conforme |
| `--soft` `#b0aaa0` | 8,67 | 8,46 | 8,23 | 7,95 | 4,5 | conforme |
| `--muted` `#8b8b96` | 5,93 | 5,79 | **5,63** | **5,44** | 4,5 | conforme — c'est le plancher, et c'est ce qui autorise 12 px |
| `--gold` `#c9a96e` | 8,93 | 8,72 | 8,48 | 8,20 | 4,5 | conforme — anneau de focus |
| `--gold2` `#e2c07a` | 11,48 | 11,21 | 10,90 | 10,53 | 4,5 | conforme |
| `--erreur` `#e07070` | 6,40 | 6,25 | 6,08 | 5,87 | 4,5 | conforme |
| `--wa` `#25D366` | 10,08 | 9,84 | 9,57 | 9,25 | 4,5 | conforme |
| `--avertissement` `#e58a3c` | 7,65 | 7,47 | 7,26 | 7,02 | 4,5 | conforme **et 7:1 partout** : l'ambre passe AAA |
| `--attente` `#8ab8e6` | 9,60 | 9,37 | 9,11 | 8,81 | 4,5 | conforme |
| `--border-strong` `#646470` | 3,43 | 3,35 | **3,25** | 3,14 | **3,0** | conforme — c'est un filet de contrôle (WCAG 1.4.11) |
| `--border` `#1c1c22` | 1,18 | 1,15 | 1,12 | 1,08 | — | **décoratif uniquement** |
| `--border2` `#282830` | 1,37 | 1,34 | 1,30 | 1,25 | — | **décoratif uniquement** |

**Trois paires de texte sur aplat :**

| Paire | Ratio | Verdict |
|---|---:|---|
| `--on-gold` `#0a0a0e` sur `--gold` | **8,83** | conforme — c'est le texte du bouton primaire |
| `--on-gold` `#0a0a0e` sur `--gold2` (survol) | 11,34 | conforme, le survol **augmente** le contraste, il ne le réduit pas |
| `--on-wa` `#0a0a0e` sur `--wa` | **9,96** | conforme |
| `#ffffff` sur `--wa` | **1,98** | interdit — c'est l'erreur qui était présente sur `ebook.html` |

**Ce que la mesure corrige dans `CV` et dans `DSU`.** Deux valeurs y sont fausses, et comme
ce projet a déjà été recalé deux fois sur des contrastes, elles sont signalées :

- `DSU` §2.2 annonce `--text` à **17,71:1** sur `--bg`. Le calcul donne **16,64:1**. L'écart
  ne change aucun verdict (le seuil est 4,5), mais la table de `DSU` n'est pas
  reproductible telle quelle.
- `CV` §4 donne la teinte de l'ambre à `26°` en un endroit, à `24,7°` en un autre, et
  l'écart à l'or à « 14 degrés ». Les trois nombres ne tiennent pas : `#e2914f` est à
  **26,9°**, l'écart à `--gold` (38,9°) est de **12,0°**. Le §2.4 ci-dessous traite cette
  proximité par la mesure, pas par l'arithmétique de teinte, qui est le mauvais outil.
- `CV` §4 donne l'ambre `#e2914f` à « 7,99 / 7,59 / 7,34 » sur trois fonds. Les quatre
  valeurs réelles sont **7,99 / 7,81 / 7,59 / 7,34**. Le jeton retenu ici est `#e58a3c`.

### 2.4 L'or et l'ambre — le problème, mesuré, et la règle qui le résout

La teinte ne dit pas si deux couleurs se distinguent : elle dit d'où elles viennent. La
question utile est **quelle distance perçoit un œil qui confond les rouges et les verts**
— 8 % des hommes. Mesure : conversion LMS de Viénot-Brettel-Mollon 1999, simulation
protanopie / deutéranopie / tritanopie, écart CIELAB ΔE76 recalculé après simulation.

| Paire | ΔE normal | protanopie | deutéranopie | tritanopie | Lecture |
|---|---:|---:|---:|---:|---|
| `--gold` / `--avertissement` | **32,1** | 24,0 | 30,7 | 1,5 | Séparés, y compris pour les daltonismes rouge-vert |
| `--gold` / `--erreur` | 43,4 | 11,5 | **4,7** | 1,0 | **Presque confondus en deutéranopie** |
| `--gold` / `--wa` | 69,2 | 18,8 | **6,3** | 122,5 | **Confondus en deutéranopie** |
| `--gold` / `--attente` | 63,0 | 56,4 | **61,0** | 127,0 | **La seule paire sûre en toutes circonstances** |
| `--erreur` / `--avertissement` | 37,6 | 33,3 | 35,0 | 0,5 | Séparés |
| `--attente` / `--wa` | 92,8 | 72,8 | 67,2 | 6,3 | Séparés |

**Ce que ça change — et c'est l'inverse de l'intuition du brief.** Le brief signale que
l'ambre et l'or sont proches en teinte. C'est vrai (12,0°) et **c'est le couple le moins
dangereux des trois** : avec le jeton retenu, ils restent à ΔE 30,7 en deutéranopie. Les
deux paires réellement dangereuses sont **or / rouge (4,7)** et **or / vert WhatsApp
(6,3)** : dans les deux cas, un deutéranope ne distingue plus l'accent d'une erreur, ni
l'accent d'un bouton WhatsApp.

Quatre règles en découlent. Elles sont plus précises que la règle B de `CV`, et elles la
remplacent.

> **Règle B1 — L'or est le seul aplat. Le rouge est toujours un trait.**
> Le rouge n'est jamais un fond plein ni un bouton plein : il est filet de 3 px, icône, ou
> texte court. Là où la teinte ne sépare plus (ΔE 4,7), c'est **la forme** qui sépare : un
> objet plein contre un objet tracé. Cette règle sert aussi l'engagement 2, puisqu'elle
> laisse l'aplat or unique dans l'écran.

> **Règle B2 — Le bouton WhatsApp porte toujours son icône de canal et le mot « WhatsApp ».**
> ΔE 6,3 en deutéranopie contre l'or : la couleur seule ne dit pas « WhatsApp ». Le libellé
> est « Ouvrir WhatsApp », jamais « Envoyer » ni « Contacter ». Corollaire : **le vert ne
> sert jamais de remplissage d'état** (un badge n'est vert que s'il désigne le canal).

> **Règle B3 — Deux états voisins ne se distinguent par la couleur que si la paire est or /
> bleu acier.** 61,0 en deutéranopie, la seule paire sûre. Toute autre paire exige une
> marque de forme ou un mot — ce que la règle C impose déjà.

> **Règle B4 — L'ambre n'est jamais un aplat, et sa marque est un triangle.**
> `--avertissement` à 10 % sur `--card` donne `#251c18`, soit **1,14:1** : une trace ambre
> n'est pas un fond, elle est à peine visible. Sa marque est le **triangle** (`etat--attention`)
> et le **mot**. Quand la marque porte sur la donnée elle-même (périmé), elle devient un
> **cercle concentrique barré** (`etat--perime`) — voir §2.5.

### 2.5 Les treize états — canal par canal

Un composant interactif se décrit par **quatre canaux** (fond, bordure, texte, marque non
chromatique). La quatrième colonne est celle qu'on oublie, et c'est celle qui rend l'état
lisible sans couleur.

| État | Fond | Bordure | Texte | Marque non chromatique | Jeton |
|---|---|---|---|---|---|
| **Normal** | `--card` | `--border` | `--text` | — | — |
| **Survol** | `--card2` | `--border2` | `--text` | Curseur `pointer`. **Aucun déplacement, aucune ombre** | — |
| **Focus** | inchangé | inchangé | inchangé | `outline:2px solid var(--focus)`, `offset:2px` | `--gold` — 8,48:1 sur `--card` |
| **Actif (pressé)** | `--bg2` | `--border-strong` | `--text` | Aucune transformation d'échelle | — |
| **État courant** (sélection, onglet, étape) | `--gold-bg` | `--gold` | `--gold2` | Bordure 2 px **et** mot (« ouvert », « étape 2/3 ») **et** position | `--gold` |
| **Désactivé** | `--bg2` | `--border` | `--muted` (5,63:1) | `cursor:not-allowed` + `aria-disabled="true"` — **jamais d'opacité** | `--muted` |
| **Chargement** | `--card2` | `--border` | `--muted` | Squelette **à la forme du contenu** + le mot « Chargement… » | — |
| **Erreur** | `--card` | filet gauche 3 px `--erreur` | cause en `--text` | Croix (D+D) + **le mot** + l'action de reprise | `--erreur` — 6,08:1 |
| **Succès** | `--card` | `--border` | `--text` | **Aucune couleur** : icône `etat--valide` + le mot + **le résultat** | **neutre** |
| **Avertissement** | `--card` | filet gauche 3 px `--avertissement` | `--avertissement` | **Triangle** (A+G) + le mot | `--avertissement` — 7,26:1 |
| **En attente / en cours / en file** | `--card` | `--attente-bord` | `--attente` | Arc (A) + **la durée** (« 3 min ») + le mot | `--attente` — 9,11:1 |
| **Partiel** | `--card` | filet gauche 3 px `--avertissement`, **sur la zone** | `--avertissement` | **Bandeau en tête de zone** : triangle + « 3 sources sur 4 · 14 h 12 » + un bouton secondaire « Resynchroniser » | `--avertissement` |
| **Périmé** | `--card` | `--border` | valeur en `--soft` | **Pastille d'âge collée à la valeur**, cercle barré + « il y a 6 j ». Un agrégat périmé s'écrit avec `≥` | `--avertissement` |

**Partiel et périmé partagent la même teinte — et ils se distinguent par leur position, pas
par leur couleur.** C'est la décision qui évite d'inventer une sixième teinte :

> **L'ambre marque soit la zone, soit la ligne, jamais les deux au même endroit.**
> **Partiel** = la donnée est incomplète *pour tout le bloc* → bandeau en tête de bloc.
> **Périmé** = la donnée est *datée pour cette ligne* → pastille d'âge dans la ligne.
> Une vue n'a jamais les deux à la même hauteur : c'est ce qui les rend lisibles.

*Pourquoi périmé n'est pas rouge* : le matin, un fichier de prospection non resynchronisé
est l'état **normal** du système, pas une panne. Le rouge dirait « c'est cassé » — et il
serait allumé tous les jours à la première consultation, ce qui détruit le rouge pour les
vraies pannes.

**Ce que l'ambre signifie, redit une fois** : « ça a failli » (une source a échoué mais on a
continué), « ça vieillit » (la donnée a un âge qui change une décision), « c'est à moitié
fait » (2 périodes sur 3 sont là). Les trois sont la même chose : **l'utilisateur doit
savoir avant de décider**. Jamais une action à faire, jamais une erreur.

### 2.6 Le budget chromatique d'un écran

Quatre règles, vérifiables sur une capture, dans cet ordre.

1. **Un seul aplat or plein par écran** : le bouton primaire. **Un seul aplat vert plein**
   : le bouton WhatsApp — et jamais dans le même bloc que le primaire.
2. **Aucun autre aplat coloré**, à aucune opacité supérieure à 12 %. Une zone marquée est
   un **filet de 3 px** sur la gauche, pas un fond.
3. **La couleur porte sur des objets courts.** Un état coloré ne colore jamais plus de
   **quatre mots d'affilée** : badge, libellé de bouton, en-tête de zone, icône. **Une
   phrase est en `--text`.** Le rouge sur une phrase se lit mal *et* il crie — le message
   d'erreur est en `--text`, sa cause en `--soft`, seuls l'icône et le filet sont rouges.
4. **Jamais plus de trois teintes sémantiques visibles simultanément** dans un écran (or,
   ambre, bleu acier, rouge — le vert WhatsApp n'entre pas dans le budget, c'est une
   marque). Au-delà de trois, l'écran devient un sapin : la file du jour en utilise au plus
   deux (rouge pour ce qui bloque, or pour ce qui attend une décision).

### 2.7 Pourquoi un filet teinté ne peut jamais être la marque d'un état

C'est la mesure qui rend la règle C obligatoire au lieu de recommandée. Calcul : mélange
du jeton avec `--card`, puis contraste du résultat sur `--card`.

| Filet | 22 % | 30 % | 40 % | 50 % | 60 % |
|---|---:|---:|---:|---:|---:|
| `--gold-border` | 1,50 | 1,81 | 2,31 | 2,93 | 3,75 |
| `--avertissement` | 1,42 | 1,69 | 2,11 | 2,64 | **3,30** |
| `--attente` | 1,53 | 1,86 | 2,41 | **3,10** | 3,96 |
| `--erreur` | 1,36 | 1,57 | 1,91 | 2,36 | 2,91 |

**Aucun filet teinté aux valeurs d'usage (10 à 30 %) n'atteint 3:1** — le seuil WCAG 1.4.11
pour un élément qui identifie un état. Le seul filet du système qui atteint 3:1 est
`--border-strong` en couleur pleine, à 3,25:1, et c'est pour cela qu'il existe : **il
délimite un contrôle, il ne décore pas.** Les valeurs retenues en §2.2 (45 % pour l'ambre,
50 % pour le bleu) sont les premiers crans qui approchent 3:1 **sans jamais l'atteindre
seuls** : ils sont un renfort, pas la marque.

**Conséquence, et c'est tout l'intérêt de la règle C :** la marque d'un état est portée par
le **texte et l'icône à couleur pleine**, qui sont entre 6,08:1 et 9,11:1. Le filet et la
trace sont du renfort. Une interface dont les états ne sont lisibles que par leurs filets
n'est pas lisible.

---
## 3. L'échelle typographique

### 3.1 Le raisonnement, avant les valeurs

Un écran consulté 20 minutes par jour impose trois contraintes qui n'existent pas sur le
site public.

1. **La lecture est un balayage.** L'utilisateur ne lit pas les libellés, il cherche le
   chiffre qui a changé. Donc **l'écart entre le chiffre et son libellé doit être énorme** :
   c'est le seul mécanisme qui rend un chiffre trouvable en un regard. Le cockpit est à
   30 px contre 12 px, soit un rapport de 2,5 — insuffisant pour six cartes identiques. Le
   système passe à **40 contre 12**, soit 3,3.
2. **Huit niveaux, et pas un neuvième.** Chaque niveau supplémentaire est une décision que
   l'implémenteur doit prendre cent fois. `A` en utilise **treize** (10,5 / 11 / 11,5 / 12 /
   12,5 / 13 / 13,5 / 14 / 15 / 16 / 19 / 22 / 30) : c'est la cause mécanique des
   incohérences visibles. **Treize tailles supprimées, huit conservées.**
3. **Le plancher est 12 px, et il est conditionnel.** En dessous, aucun texte. À 12 px,
   uniquement des capitales espacées de plus de 0,06 em et en `--muted` **plein** — jamais
   en opacité réduite. `--muted` tient **5,63:1** sur `--card` et **5,44:1** sur `--card2` :
   c'est la mesure qui autorise le plancher.

**Une précision qui lève une ambiguïté courante** : la grille de 4 px règle **l'espacement
entre objets** (rembourrages, gouttières, marges). **L'interligne n'appartient pas à cette
grille** : il appartient à la typographie, et il suit sa propre échelle (16 / 18 / 20 / 22 /
24 / 28 / 36 / 44). Un écart de 10 px entre deux lignes d'un même bloc de texte n'est pas
une violation de la grille de 4 — c'est un interligne.

### 3.2 Les huit niveaux

| Niv. | Rôle | Police | Taille / interligne | Graisse | Couleur | Où, et combien de fois |
|---|---|---|---|---|---|---|
| **T0** | Le chiffre de tête — la décision du jour | `--police-chiffres` | **40 / 44** | 900 | `--text` | **Une seule occurrence par vue.** Le nombre de la file du jour |
| **T1** | Nombre d'instrument | `--police-chiffres` | **32 / 36** | 700 | `--text` | Les 3 à 5 compteurs de la rangée d'instruments |
| **T2** | Titre de vue | `--police-titres` | **24 / 28** | 600 | `--text` | **Le seul niveau en Cormorant.** Le titre de la destination ouverte, et le nom « ePerformance » du bandeau |
| **T3** | Titre de section, de panneau, de boîte de dialogue | `--police-texte` | **18 / 24** | 600 | `--text` | En-têtes de blocs, titres de modale et de panneau |
| **T4** | Titre de carte, nom d'objet | `--police-texte` | **16 / 22** | 600 | `--text` | Nom de prospect, titre de publication |
| **T5** | Corps | `--police-texte` | **14 / 20** | 400 | `--text` | Texte courant, valeurs de tableau, options de champ |
| **T6** | Corps dense | `--police-texte` | **14 / 18** | 400 | `--soft` | Lignes de tableau et de liste : on serre l'interligne, on ne réduit pas la taille |
| **T7** | Étiquette | `--police-texte` | **12 / 16** | 500 | `--muted` | Libellé de KPI, en-tête de colonne, libellé de champ, badge — **capitales, `letter-spacing:.06em`** |
| **T8** | Méta, technique | `--police-technique` | **12 / 18** | 400 | `--soft` | Identifiants, chemins, journaux de synchronisation, clés d'API, `Post_ID` |

**Neuf lignes pour huit niveaux** : T5 et T6 partagent la taille 14 et diffèrent par
l'interligne. C'est le seul cas, et il est délibéré (§3.2, note ci-dessous).

**Pourquoi ces valeurs, et pas d'autres.**

- **T0 à 40 px** : c'est le seul chiffre qui décide de la matinée. À 60 cm de l'écran, 40 px
  est lisible sans accommodation — sans que l'œil ait à faire un effort de mise au point.
  Il doit être **unique dans la vue** : deux chiffres à 40 px, et aucun des deux n'est le
  chiffre du jour.
- **T1 à 32 px et non 30** : l'écart de 2 px place la valeur sur la grille de 4, ce qui
  aligne les instruments entre eux et avec les marges. À 32 px, une valeur de 4 chiffres
  (`1 240`, tabulaire) mesure 72 px à graisse 700 — elle tient dans une colonne de 240 px
  sans repli, ce qui est la largeur du rail.
- **T5 et T6 à 14 px, et non 16** : c'est la taille qui permet 3 colonnes à 1280 et les
  22 lignes sans défilement au-delà de 1680. Toute la densité repose sur cette valeur.
  **Pour densifier, on serre l'interligne (18 au lieu de 20), on ne réduit pas la taille** :
  un tableau à 13 px se lit mal, un tableau à 14/18 se lit bien et gagne 10 % de hauteur.
- **T7 à 12 px, capitales, `--muted` plein** : le plancher, autorisé par la mesure (5,63:1).
  Les capitales sous 14 px exigent `letter-spacing:.06em`, sinon les lettres se collent.
  **Interdit : ajouter une opacité sur ce niveau** — `--muted` à 80 % tombe sous 4,5:1.
- **Jamais d'italique** pour du texte d'interface. `A` s'en sert (`.waitmsg`, `.rap`,
  `.vrat`) : c'est un signal de « pas important » qui, répété, devient un signal de « pas
  fiable ». Remplacé par `--muted` en T7.

### 3.3 Cormorant Garamond — trois interdits, mesurés

Cormorant est la police de titrage du site. Dans un dashboard, elle est **un seul niveau
(T2), avec trois interdits**.

| Interdit | Pourquoi |
|---|---|
| **Jamais sous 20 px sur fond sombre** | Cormorant Garamond est un Garamond : ses déliés sont des traits de moins d'un demi-pixel aux petites tailles. Sur `#101014`, un trait clair fin ne compense pas sa faible couverture : la lettre perd sa forme avant de perdre son contraste. À 20 px, les déliés tiennent ; à 18, ils disparaissent par plaques |
| **Jamais en capitales** | Les capitales de Cormorant sont larges, espacées et sans `small-caps` : un libellé en capitales y mesure 30 % de plus qu'en DM Sans et se lit comme un titre de journal. Les étiquettes du dashboard sont en DM Sans, capitales, 12 px, `--muted` — sans exception |
| **Jamais pour un chiffre** | Cormorant compose en **chiffres elzéviriens** : le « 0 » se lit comme un « o », le « 3 » descend sous la ligne de base. Et il n'expose pas de chasse tabulaire. **Un chiffre de tableau en Cormorant fait danser la colonne** — c'est-à-dire exactement ce que la densité cherche à empêcher |

**La conséquence sur le système précédent, et c'est un changement assumé.** `CV` §2 plaçait
T3 (18 px) en Cormorant. Trois raisons de le corriger, dans l'ordre :

1. **18 px < 20 px** : le niveau violait l'interdit n° 1, dans le même document qui l'énonce.
2. **24 → 18 = 1,33** alors que **24 → 20 = 1,20**, sous le rapport minimum de 1,25 que le
   projet s'est fixé (`DSU` §2.7 : « le minimum pour qu'une hiérarchie se lise »).
3. **Le site fait déjà autrement** : `h2` est en Cormorant, **`h3` est en sans-serif 600**
   (`DSU` §2.7, `SITE:351`). Le niveau « titre de section » est sans-serif dans la charte
   du site. Le dashboard s'aligne sur le site, pas sur l'erreur de `CV`.

**Résultat : Cormorant n'apparaît qu'une fois par écran** — le titre de la vue, en T2 à
24 px, plus le nom du produit dans le bandeau. C'est peu, et c'est la bonne quantité :
**une serif de titrage nomme les choses, elle ne les décrit pas.**

### 3.4 Outfit — les chiffres, embarqués et vérifiés

Outfit reste la police des chiffres : un chiffre mesuré mérite une fonte construite pour
ça, et c'est le seul niveau où elle sert. Elle doit être **auto-hébergée**, comme les deux
autres (`M5` §6.4 : `find / -iname "*outfit*"` ne remonte rien, et 4 règles CSS l'invoquent).

| Poids | Usage | Pourquoi ce poids |
|---|---|---|
| **400** | Compteurs secondaires, valeurs de ligne | Le chiffre qu'on lit en passant |
| **700** | T1 (nombre d'instrument), valeurs de carte | Le chiffre qu'on compare |
| **900** | T0 (le chiffre de tête) | Le chiffre qu'on décide |

**Trois fichiers, environ 66 Ko, ajoutés aux 9 `woff2` existants** → 12 fichiers,
**toujours zéro dépendance Google Fonts**.

**Vérification obligatoire à l'embarquement, et c'est une mesure, pas une confiance.**
Outfit n'expose pas forcément de chasse tabulaire. Donc, avant de valider l'embarquement :

1. mesurer au canvas la largeur de `"1111"` et celle de `"0000"` en Outfit 700 à 32 px ;
2. **si les deux largeurs diffèrent, Outfit n'a pas de tabulaire** : les colonnes chiffrées
   passent à **DM Sans 400 en `font-variant-numeric: tabular-nums`**, et Outfit reste sur
   T0 seul (un chiffre isolé, jamais dans une colonne) ;
3. dans tous les cas, la déclaration porte `font-variant-numeric: lining-nums tabular-nums`
   et `font-feature-settings:'tnum' 1,'lnum' 1`, comme le site (`SITE:362-367`).

**Ce n'est pas une exception, c'est une décision de repli documentée** : un système visuel
qui affirme une chasse tabulaire sans la vérifier grave le défaut qu'il prétend corriger.
Le squelette de contrôle est en §9 (contrôle 4).

**Pile de repli obligatoire**, pour que l'absence de fichier dégrade proprement :

```css
--police-chiffres: 'Outfit', 'DM Sans', system-ui, sans-serif;
```

Jamais `'Outfit'` seule : c'est ce qu'écrit `A:24` aujourd'hui, et le navigateur résout
alors vers la police par défaut de l'agent utilisateur sans le dire.

### 3.5 Les jetons typographiques

```css
:root {
  /* Familles — C3 : les noms du site sont gelés */
  --police-titres:    'Cormorant Garamond', 'Cormorant Fallback', Georgia, serif;
  --police-texte:     'DM Sans', 'DM Sans Fallback', system-ui, -apple-system, sans-serif;
  --police-chiffres:  'Outfit', 'DM Sans', system-ui, sans-serif;
  --police-technique: ui-monospace, 'SF Mono', 'DM Mono', monospace;

  /* Échelle — 8 niveaux, tailles sur la grille de 4 px */
  --t0: 40px; --t0-lh: 44px;
  --t1: 32px; --t1-lh: 36px;
  --t2: 24px; --t2-lh: 28px;
  --t3: 18px; --t3-lh: 24px;
  --t4: 16px; --t4-lh: 22px;
  --t5: 14px; --t5-lh: 20px;
  --t6: 14px; --t6-lh: 18px;
  --t7: 12px; --t7-lh: 16px;
  --t8: 12px; --t8-lh: 18px;

  /* Interlettrage — trois valeurs, pas quatre */
  --ls-etiquette: .06em;   /* T7 en capitales */
  --ls-chiffre:  -.01em;   /* T0 / T1 : les grands nombres se resserrent */
  --ls-normal:   0;
}
```

**Ce qui disparaît** : `10,5px` `11px` `11,5px` `12px`(badge) `12,5px` `13px`(×2) `13,5px`
`15px` `19px` `22px` `30px`. **Aucune taille hors de ces huit niveaux, à aucun endroit.**

### 3.6 Le thème — le dashboard est sombre, et c'est une exception assumée

**Décision : le dashboard unifié est mono-thème, sombre.** Pas de bascule, pas de
`prefers-color-scheme`, pas de variante claire à maintenir.

*Pourquoi, en trois points :*

1. **C'est une console, pas un contenu lu.** Le thème clair du site existe parce qu'on lit
   une page longue en plein jour. Un poste de commande se regarde à côté d'un éditeur, d'un
   terminal et d'un navigateur — le sombre est le régime de l'environnement, pas un goût.
2. **Une variante claire double le travail de mesure pour un usage de zéro.** Les 12 paires
   de contraste de `DSU` §2.7 sont validées **par thème** ; ajouter le clair demande de
   revalider les 12 teintes sur 4 surfaces claires, plus les filets, pour un état que
   personne n'utilisera dans un outil mono-utilisateur.
3. **`DSU` §8.5 a déjà recommandé cette exception** : « conserver le dark-only pour le
   dashboard, c'est une console et non un contenu lu — mais alors le documenter comme une
   exception assumée, pas comme un oubli. » Ce paragraphe est cette documentation.

*Quatre conséquences, et elles sont opérationnelles :*

| Règle | Détail |
|---|---|
| `data-theme="dark"` est posé **en dur sur `<html>`**, par un script inline bloquant en tête de `<head>` | Le même mécanisme que le site (`SITE/index.html:6-10`), pas un autre. Sans lui, le navigateur peint une première frame claire avant que le CSS n'arrive — c'est le seul défaut visible d'un dashboard sombre |
| **Le dashboard lit `localStorage['eperf-theme']` et l'ignore.** Il ne l'écrit jamais | Sinon un utilisateur qui bascule le site en clair se retrouve avec un dashboard clair à moitié peint. La clé reste unique et partagée : c'est le site qui commande, le dashboard qui subit |
| `color-scheme: dark` sur `:root` | Sans lui, la liste déroulante native, la barre de défilement et le sélecteur de date s'ouvrent **en blanc** sur un fond sombre. C'est le défaut le plus visible d'un dashboard sombre mal déclaré |
| **Aucun jeton clair n'est déclaré.** Ni `--bg` clair, ni `--gold` `#856b37` | Un jeton clair déclaré mais non utilisé est un piège à copier-coller |

---

## 4. Les chiffres et les données

C'est un dashboard : les nombres **sont** le contenu. Quatre sections : les états d'une
valeur, les grands nombres, les formes de visualisation, les listes.

### 4.1 Les sept états d'une valeur — et le défaut qu'ils corrigent

**Le défaut mesuré** : le cockpit affiche `0 %` et `—` sans règle. Un taux de réponse
calculé sur zéro envoi vaut `0 %` par division, un compteur qui n'a jamais tourné vaut `0`,
et une source qui n'a pas répondu vaut `—`. **Les trois s'affichent de la même façon, donc
l'utilisateur ne sait pas s'il doit agir.** `AE` §2 exige un état `partiel` explicite, et
le brief exige `périmé`. Sept états, donc, et chacun a un signe.

| État | Signe | Rendu | Sens |
|---|---|---|---|
| **Valeur mesurée** | `1 240` | `--police-chiffres`, tabulaire, `--text`, aligné à droite | — |
| **Zéro mesuré** | `0` | **Même taille, même graisse, même couleur qu'une valeur non nulle** | « On a mesuré : c'est zéro. » Un zéro est une information, pas un vide |
| **Non mesuré** | `—` (cadratin U+2014) | `--muted`, même alignement | « On n'a pas mesuré. » Ni bon, ni mauvais |
| **Non applicable** | `·` (point médian U+00B7) | `--muted` | « La question ne se pose pas. » Ex. : un taux de réponse quand il n'y a pas eu d'envoi |
| **Non calculable** | **jamais `0 %`** | `—` | Un pourcentage dont le dénominateur est zéro n'existe pas. Afficher `0 %` est un mensonge arithmétique |
| **Partiel** | `≥ 412` | `--text` + bandeau ambre de zone en tête de bloc | « On a mesuré sur 3 sources sur 4 : le vrai total est au moins celui-là. » **Un agrégat partiel n'est jamais présenté comme exact** |
| **Périmé** | `1 240` + pastille d'âge | `--soft` + pastille ambre « il y a 6 j » | « Mesuré, mais il y a longtemps » |

**Les deux règles qui font tenir l'ensemble :**

> **Règle N1 — `0` n'est jamais gris.** Un zéro mesuré s'affiche en `--text`, à la même
> taille que les autres valeurs. Le griser, c'est dire « rien à voir » alors que c'est
> précisément le chiffre qui explique la file vide du jour.

> **Règle N2 — `—` n'est jamais coloré.** L'absence de donnée n'est ni une erreur (rouge),
> ni un avertissement (ambre), ni une attente (bleu). Elle est grise, et elle est
> **accompagnée du mot** : dans un en-tête de colonne, la légende dit « Aucune donnée ».
> Une colonne pleine de tirets sans légende fait croire à une panne.

**Troisième règle, sur la fraîcheur — elle n'existait nulle part :**

> **Règle N3 — Une valeur périmée porte toujours son âge, et l'âge est en T7.** « 14 : 12 »
> (l'heure) est le format par défaut du jour même ; au-delà, « il y a 6 j ». **Une valeur
> sans âge est une valeur qu'on croit fraîche** — c'est le mensonge le plus courant d'un
> dashboard.

### 4.2 Les grands nombres, l'unité, l'alignement

| Règle | Détail |
|---|---|
| **Séparateur de milliers** | **Espace fine insécable** (U+202F), jamais la virgule ni le point : `1 240`, pas `1,240` ni `1.240`. Le `,` est le séparateur décimal français |
| **Décimale** | Jamais plus d'une : `12,4 %`, `3,2 j`. Deux décimales sur un taux de réponse à 22 prospects, c'est de la fausse précision |
| **Abréviation** | < 10 000 : le nombre exact. 10 000 → 999 999 : `12,4 k`. ≥ 1 000 000 : `1,24 M`. **L'unité `k` / `M` est toujours écrite** — un `12,4` sans unité est illisible |
| **Où vit le nombre exact** | **Dans la fiche (panneau latéral), pas dans une info-bulle.** Une info-bulle n'existe pas au clavier ni au tactile, et elle disparaît. La liste abrège, la fiche donne le chiffre exact |
| **Unité** | Dans un `<span>` séparé, en T7 `--muted`, **après** le nombre : `1 240` + ` ms`. La colonne s'aligne alors sur les chiffres, pas sur les unités |
| **Unité monétaire** | `FCFA` en T7 après le nombre, jamais un symbole monétaire en préfixe. Devise **toujours** nommée : `6 500 000 FCFA` |
| **Grandeur dans le temps** | `il y a 4 j` pour le passé relatif, `12 sept. 14:12` pour une date absolue. **Jamais les deux mélangés dans la même colonne** |
| **Alignement** | **À droite dès que deux nombres sont empilés** (tableau, liste de mesures, entonnoir, axe d'un graphique). Les césures tombent sur la même verticale |
| **Jamais de nombre centré** | Le centrage casse l'alignement décimal. `A` le fait pour `.score { width:52px; justify-content:center }` — corrigé |
| **Largeur de colonne** | Déclarée en `ch` sur la colonne, jamais en `px` : `min-width: 7ch` pour une colonne de montants en milliers |
| **Chasse** | `font-variant-numeric: lining-nums tabular-nums` **partout où un nombre peut changer** : tableaux, badges de compteur, valeurs d'instrument, barres, entonnoir. Pas seulement dans `.tableau2` |

### 4.3 Les indicateurs — trois niveaux, pas six

Un écran de dashboard affiche aujourd'hui 6 à 7 cartes de même poids (`B` en a 7, `C` en a
6, `A` en a 6). **Six indicateurs de poids identique, c'est zéro indicateur prioritaire.**
Trois niveaux, et chacun a une place :

| Niveau | Typo | Forme | Nombre par vue |
|---|---|---|---|
| **Chiffre de tête** | T0 (40/44) 900 | Nu, sans carte, sans bordure, aligné à gauche, suivi de son libellé en T7 | **1** |
| **Instrument** | T1 (32/36) 700 + libellé T7 + unité | Sur `--card`, `--r` (20), rembourrage `--e-4`, **hauteur fixe 96 px** | **3 à 5** |
| **Compteur de rangée** | T5 700 + libellé T6 | Dans une ligne de 36 px, dans le flux d'un texte ou d'un onglet | Autant que nécessaire |

**Anatomie d'un instrument** : `[libellé T7 capitales] / [nombre T1] / [unité T7] / [variation en T7, positive ou négative]`.
La variation n'est **pas** une flèche colorée : c'est un mot et un signe — `+12 %` en
`--text`, `−4 %` en `--text` aussi. **Le vert et le rouge sont interdits sur une variation** :
ΔE 4,7 entre l'or et le rouge, et une variation n'est ni une erreur ni une action. Si la
variation est significative, elle gagne une icône (`dom--courbe` montante ou `E` descendante),
pas une couleur.

### 4.4 Quatre formes de visualisation, et cinq interdites

**Décision : le dashboard n'embarque aucune bibliothèque de graphiques.** `B` charge
Chart.js depuis `cdn.jsdelivr.net` — c'est un CDN, donc interdit, et la note `M5` §7.2 est
explicite : « vendoriser la bibliothèque ou la remplacer ». **Remplacer** : les 4 besoins
mesurés de `B` (statuts, scores, pays, secteur) plus l'entonnoir du cockpit se couvrent avec
quatre formes en SVG, dans le langage Instrumentation, sans une ligne de JavaScript.

**Forme 1 — Barres verticales** (`B` primitive). Répartition d'un ensemble fini : statuts,
scores, pays (top 8), secteur.
- Hauteur de la zone **88 px**, largeur de barre **≤ 24 px**, gouttière `--e-2` (8),
- Un seul axe : la valeur. **Jamais d'axe vertical** — la valeur est écrite **au-dessus de
  chaque barre** en T7 tabulaire, `--muted`. Pas d'axe Y, pas de grille, pas de légende,
- Barre courante (celle du filtre actif) en `--gold`, **toutes les autres en `--border-strong`** :
  c'est « voilà l'état actuel », et ça consomme 1 objet or, pas 8,
- Sous chaque barre : le libellé en T7, tronqué à 12 caractères, sur une ligne.

**Forme 2 — Barre horizontale de 4 px.** Une part, une progression, un quota.
- Hauteur **4 px**, `--r-xs` (6) sur les extrémités, piste `--border`,
- Remplissage `--attente` pour « en cours », `--gold` **uniquement** pour la barre de
  progression courante d'une tâche **de l'utilisateur**, `--border-strong` pour un quota
  passif. **Jamais de remplissage rouge** : un quota dépassé se dit par un mot.

**Forme 3 — Segment en escalier** (`E` primitive). Une série dans le temps, sans axe.
- Trois segments **au maximum** (30 j, 7 j, 24 h) : un dashboard ne trace pas une courbe
  lissée, il montre une tendance,
- Tracé 1,5 px `--gold` pour la période affichée, `--border-strong` pour l'historique,
- **Aucun point de données, aucune infobulle, aucun dégradé sous la courbe, aucune animation
  d'entrée.** Les deux valeurs extrêmes (début, fin) sont écrites en T7.

**Forme 4 — Entonnoir.** Une chaîne de conversion (prospect → contacté → répondu → converti).
- **Une ligne par étape**, hauteur 36 px (compacte) : libellé T6 à gauche, barre de 4 px au
  milieu, valeur à droite en T7 tabulaire,
- La **largeur relative** est proportionnelle ; la **décroissance est écrite en pourcentage**
  à droite de chaque barre. Un entonnoir sans pourcentage ne dit rien,
- L'étape courante en `--gold`, les autres en `--border-strong`.

**Interdits, et le motif est le même pour les cinq :** le camembert (un anneau de 5 parts
se lit moins bien que 5 barres, et il interdit la comparaison de longueur), l'anneau, la
courbe lissée, l'axe double, la 3D. Aucune de ces formes n'est plus lisible que la barre
verticale, et toutes coûtent une bibliothèque.

### 4.5 Les listes denses et le tableau

| Règle | Valeur |
|---|---|
| Hauteur de ligne | **36 px** en compacte (défaut ≥ 1280), **44 px** en confortable (défaut < 1280) — `AE` §7 |
| Colonnes | Largeur déclarée par type : texte `1fr` avec `min-width:0`, nombre `Nch`, badge `auto`, actions `130px` |
| `Tab` dans une liste | **Sort de la liste** et va aux actions suivantes. Le parcours ligne à ligne se fait avec `j` / `k` |
| Tri | L'en-tête porte l'état de tri par **trois marques** : le mot (`trié par`), le glyphe (triangles de 1,5 px), et l'`aria-sort`. Jamais une couleur |
| Nombre de colonnes | Au-delà de 5 colonnes, les colonnes secondaires se **replient dans le dépliage de ligne** — pas de défilement horizontal |
| Sous 1024 px | **Le tableau se replie en cartes `--ligne`** : chaque ligne devient un bloc, chaque colonne une paire libellé (T7) / valeur (T6). Un tableau à 6 colonnes sur 936 px ne se lit pas : il ne doit pas être comprimé, il doit changer de forme |
| Ligne vide | **Une seule ligne**, `colspan` complet, `--r-xl` de hauteur : « Aucun résultat » en T6 `--muted` + l'action qui défait le filtre |
| Chargement | **3 lignes squelettes de la hauteur réelle** (36 ou 44 px), pas un spinner : la page ne doit pas sauter quand les données arrivent |

**La demi-ligne qui n'existe pas** : dans une ligne de 36 px, les contrôles font au maximum
**28 px de haut**, et il n'y a **pas de bouton `--sm` (30 px) dans une ligne de 36 px** — la
place restante (4 px) ne suffit pas. Les actions d'une ligne dense sont des **icônes de
28 px** avec `aria-label`, ou rien (l'action vit dans le dépliage).

---

## 5. La bibliothèque de composants

23 composants. Pour chacun : anatomie, variantes, états, tailles, **usage**, **contre-usage**.
Le contre-usage est la moitié utile de la règle.

Les noms de classe prolongent le socle de `A` (`.btn2`, `.carte2`, `.champ2`…) pour que
l'implémentation soit un **delta**, pas une réécriture — le socle existe, il est cohérent,
et son taux d'utilisation atteignable est de **0 %** (`M5` §3.3). **Le travail n'est pas de
le réécrire, c'est de le brancher.**

**Index.** 5.1 Bouton · 5.2 Carte · 5.3 Champ · 5.4 Liste déroulante · 5.5 Tableau ·
5.6 Badge · 5.7 Puce de filtre · 5.8 Onglet · 5.9 Modale · 5.10 Panneau latéral ·
5.11 Rail de navigation · 5.12 Bandeau · 5.13 Fil d'Ariane · 5.14 Indicateur de progression ·
5.15 État vide · 5.16 Chargement · 5.17 Notification · 5.18 Info-bulle · 5.19 Menu contextuel ·
5.20 Sélecteur de date · 5.21 Barre de tâches · 5.22 Ligne de décision · 5.23 Bloc de mesures

---

### 5.1 Bouton

**Anatomie** : `[icône 16px] [libellé T5 600]`, `gap: --e-2` (8), hauteur fixe, rembourrage
horizontal `--e-4` (16).

**Trois variantes — le plafond du brief, tenu.**

| Variante | Fond | Bordure | Texte | Sémantique |
|---|---|---|---|---|
| **primaire** | `--gold` (seul aplat or de l'écran) | aucune | `--on-gold` (8,83:1) | La seule action qui fait avancer l'état |
| **secondaire** | transparent | `--border-strong` | `--text` | Action technique, sans effet sur l'état |
| **tertiaire** | transparent | aucune | `--soft` | Action de moindre poids, dans un en-tête ou une ligne |

**Modificateurs** (pas des variantes, ils se combinent) :
`--destructif` → bordure et texte `--erreur`, fond transparent, **jamais d'aplat** (règle B1) ;
`--wa` → **la seule variante à fond vert**, qui porte l'icône `dom--message` et le mot
« WhatsApp » (règle B2) ; `--icone-seule` → carré 38 px, `aria-label` obligatoire ;
`--pleine-largeur` → `width:100%`.

**Tailles** — trois, alignées sur le socle et remises sur la grille :

| Taille | Hauteur | Rembourrage | Typo | Usage |
|---|---|---|---|---|
| `--sm` | **30 px** | `0 14px` | T7 (12) | Dans une ligne de tableau de 40 px, ou dans un en-tête |
| `--md` | **38 px** | `0 18px` | T5 (14) | Défaut |
| `--lg` | **46 px** | `0 24px` | T4 (16) | **Une seule par vue** : l'action principale |

**États** : les cinq du §2.5 (normal, survol, focus, actif, désactivé) plus **chargement**
(le libellé devient « Envoi… », le bouton est désactivé, **la largeur ne change pas**), et
**erreur** — jamais sur le bouton, toujours dans la notification.

**Usage** : un bouton primaire par vue, et le libellé est un **verbe à l'infinitif**
(« Publier », « Relancer », « Qualifier ») — jamais « OK », « Valider », « Envoyer », trois
mots qui ne disent pas ce qui va se passer.

**Contre-usage** :
- Jamais deux `--lg` dans la même vue.
- Jamais de bouton primaire pour une action **réversible** (exporter, filtrer, tester).
- Jamais de bouton coloré pour coder une **catégorie** — la catégorie est portée par l'icône.
- Jamais de bouton dont le libellé change de largeur au survol ni au chargement.
- **Le `--destructif` n'est jamais `--lg`** : une action destructive se demande deux fois,
  dans une confirmation, pas dans un gros bouton.
- **Jamais « Actualiser » comme contenu d'un bloc vide** (`AE` §2).

---

### 5.2 Carte

**Anatomie** : `--card` + bordure 1 px `--border` + `--r` (20) + rembourrage `--e-4` (16).
**Pas d'ombre.**

**Trois variantes, et c'est tout :**

| Variante | Hauteur | Usage |
|---|---|---|
| **carte** | **156 px fixe** (`min-height` = `max-height`, `overflow:hidden`) | L'objet de travail : prospect, publication, concurrent |
| **carte--ligne** | **36 px** (compacte) / **44 px** (confortable) | La ligne dense d'une liste |
| **carte--instrument** | **96 px** fixe | Un chiffre + son libellé (§4.3) |

**La hauteur fixe est la correction du défaut « deux hauteurs pour le même objet » (164 et
210 px).** La cause était structurelle : les actions en `margin-top:auto` dans un conteneur
`flex-direction:column` étirent la carte à la hauteur du plus grand contenu. Corrigé par
trois règles :

1. **hauteur imposée** : 156 px, `overflow:hidden` — le contenu qui déborde est tronqué,
   jamais la carte ;
2. **`align-items:start` sur la grille** — une carte ne s'étire jamais pour égaler sa voisine ;
3. **quatre zones fixes** : en-tête 40 (pastille de score 28 + nom T4 + badge) · corps 44
   (deux lignes : T6 18 + T7 16 + 10 d'interligne) · séparateur 1 px `--border` · pied 39
   (actions alignées à gauche).

**Le nom est tronqué, et c'est mesuré.** Le nom le plus long du fichier réel
(`prospects_tracking.csv`, 22 lignes) mesure **30 caractères** : « Santé Business Longrich
Center ». Sur une carte de 314 px, après la pastille de score (28) et le badge de score
(≤ 88) et trois gouttières de 8, il reste **150 px** pour le nom, soit environ 18 caractères
en DM Sans 600 16 px. **La carte tronque donc avec une ellipse, et le nom entier vit dans
le panneau latéral** — le seul endroit sans concurrence d'espace. Jamais deux lignes pour
un nom : deux cartes voisines changeraient de hauteur.

**États** : survol (`--border2` seulement, **sans déplacement ni ombre**), focus (`--gold`
+ `offset:2px`, **la carte entière est focusable si elle ouvre une fiche**), courant
(`--gold` 2 px + `--gold-bg`), chargement (squelette de la même forme), vide.

**La carte « à relancer »** — le défaut de la bordure verte sans légende :

```
┌─────────────────────────────────────────────┐
│ [78] Fatou Ouedraogo            ● Aujourd'hui│  ← pastille or + MOT, pas seulement couleur
│ ─────────────────────────────────────────── │
│ +226 70 12 34 56 · Ouagadougou · Beauté     │  ← T6 --soft
│ Relancé J+3 · il y a 4 jours                │  ← T7 --muted
│ ─────────────────────────────────────────── │
│ [Relancer sur WhatsApp]           [Fiche]   │  ← pied d'actions
└─────────────────────────────────────────────┘
    ↑ bordure --gold 2 px + --gold-bg = « ici tu agis »
```

**Le vert disparaît** : le vert dit WhatsApp, et « à relancer » est précisément une action
non confirmée. Trois marques non chromatiques le remplacent : la bordure épaissie à 2 px,
la pastille d'échéance, le mot « Aujourd'hui ». Un daltonien, ou une impression noir et
blanc, lit la même information.

**Contre-usage** : jamais de carte pour un contenu de moins de 3 lignes (utiliser
`carte--ligne`) ; **jamais de carte dans une carte** (utiliser un filet gauche
`--border-strong`) ; jamais de carte cliquable sans bouton visible à l'intérieur — une
surface entière cliquable se devine, elle ne se voit pas.

---

### 5.3 Champ (texte, zone de texte)

**Anatomie, dans cet ordre obligatoire** : `<label>` → `input` → message d'erreur → texte
d'aide. Le libellé est **au-dessus**, jamais à gauche : `.flabel { text-align:right }` oblige
à lire en zigzag et ne résiste pas à un libellé long.

| Élément | Typo | Couleur | Espace |
|---|---|---|---|
| Étiquette | T7, capitales, `--ls-etiquette` | `--muted` | `--e-1` sous elle |
| Champ | T5 | `--text` | — |
| Message d'erreur | T7, sans capitales | `--erreur` + icône `etat--echec` | `--e-1` au-dessus |
| Texte d'aide | T7, sans capitales | `--muted` | `--e-1` au-dessus |

**Dimensions** : hauteur **38 px** (`--md`), `--r-sm` (12), fond `--bg2`, bordure 1 px
**`--border-strong`** — pas `--border` : 1,12:1 ne délimite pas un contrôle (WCAG 1.4.11),
3,25:1 oui. C'est la correction la plus fréquente des design systems, et `DSU` §2.4 la
documente déjà.

**États** : normal, survol (`--border2`), focus (**`--gold` + `box-shadow: 0 0 0 2px
color-mix(in srgb, var(--gold) 18%, transparent)`**, exactement comme `SITE:1041-1045`),
désactivé (`--muted`, sans opacité), erreur (`--erreur` **en bordure et en icône**, plus le
message), lecture seule (`--card2`, texte `--soft`).

**Variante `--technique`** : `--police-technique`, T8. Pour les identifiants, les clés
d'API, les chemins. Le socle l'a déjà (`.champ2--technique`) : **elle doit être utilisée** —
aujourd'hui les clés d'API sont dans le même champ que les noms.

**Contre-usage** : jamais de `placeholder` en remplacement d'étiquette (il disparaît à la
saisie : c'est la cause directe des 22 listes sans nom de `A`) ; jamais de largeur `100%`
pour un champ de 4 caractères ; jamais de formulaire sans message d'erreur textuel — une
bordure rouge seule ne dit pas **ce qui** est faux.

---

### 5.4 Liste déroulante

**C'est le composant le plus défectueux du cockpit** : 32 listes natives, **22 sans aucun
nom accessible**, et des valeurs techniques brutes à l'écran (`Contacté_J0`, `Répondu_Positif`).

**Anatomie** : identique au champ, plus une flèche. **Le `<label>` visible est obligatoire,
et son `for` pointe sur l'`id` du `<select>`.** Quand la place manque (dans une ligne de
carte), le libellé est **visuellement masqué mais reste dans le DOM** :

```css
.visuellement-masque{
  position:absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0;
}
```
Jamais `display:none`, jamais absent : sinon le nom accessible disparaît.

**Libellés lisibles** : la table de correspondance de `CV` §2 est la seule source —
`<option value="Contacté_J0">Contacté</option>`. **Aucun `_` ni majuscule technique à
l'écran, jamais**, et cette table vit **à un seul endroit** (aujourd'hui elle existe trois
fois, en trois formes, dont une avec emoji).

**Le cas du sélecteur de fournisseur IA** : il est **alimenté par le serveur**
(`GET /api/ia-config` renvoie déjà `providers_disponibles` et `models`). Le menu écrit en
dur de `A:768-773` offre 5 fournisseurs dont **3 échouent en 400** ; le serveur en accepte 2.
Un menu de sélection ne contient jamais une option que le serveur refuse.

**États** : les 6 du champ. Le `<select>` reçoit `:focus-visible` avec l'anneau or — **il
n'en a aucun aujourd'hui**.

**Contre-usage** : jamais de `<select>` pour **2 options** mutuellement exclusives (bascule
ou paire de boutons radio) ; jamais de `<select>` de **moins de 5 options** — **il devient
une rangée de puces** (`AE` §2) ; jamais plus de 12 options sans `<optgroup>` ; jamais un
`<select>` **de filtre** — un filtre est une rangée de puces, parce qu'on veut lire le
nombre de résultats de chaque valeur **avant** de cliquer.

---

### 5.5 Tableau

**Anatomie** : en-tête collant + lignes de **36 / 44 px** + colonnes de largeur déclarée.

| Partie | Typo | Couleur | Bordure |
|---|---|---|---|
| `<th>` | T7, capitales, `--ls-etiquette` | `--muted` | basse `--border` |
| `<th>` d'une colonne nombre | T7 capitales, **`text-align:right`** | `--muted` | — |
| `<td>` | T6 (14/18) | `--text` | basse `--border` |
| `<td>` nombre | T6 + tabulaire, **aligné à droite** | `--text` | — |
| Ligne survolée | — | fond `--card2` | — |
| Ligne sélectionnée | — | **bordure gauche 2 px `--gold`** + `--gold-bg` | — |

**La colonne d'actions est la dernière**, alignée à droite, largeur fixe de `3 × 30 + 2 × 8`
= **106 px**, et elle ne contient que des icônes de 28 px ou un bouton `--sm`.

**États** : chargement (3 lignes squelettes **de la hauteur réelle**), vide (ligne unique
« Aucun résultat » + action), erreur (ligne unique en `--text` + icône `--erreur`), **partiel**
(bandeau ambre **au-dessus** du tableau, jamais dans une ligne).

**Contre-usage** : jamais plus de 5 colonnes sans repli assumé et première colonne figée ;
jamais de tableau pour moins de 4 lignes (une liste de `carte--ligne`) ; **jamais de tableau
sous 1024 px** — il se replie (§4.5).

---

### 5.6 Badge de statut

**Anatomie** : `[pastille 6 px] [libellé T7 500, sans capitales]`, hauteur **20 px**,
`--r-pill`, fond `color-mix(in srgb, currentColor 12%, transparent)`. **Le badge n'est
jamais interactif** — tout badge cliquable devient un bouton ou une puce de filtre.

**Neuf états, neuf libellés, neuf traitements** — c'est la table du §2.5 appliquée :

| Statut | Couleur | Sémantique |
|---|---|---|
| Brouillon | `--muted` | Rien n'est engagé |
| **À décider** | **`--gold`** | **Ici tu agis** — renomme `.badge2--attente` (§2.1) |
| Programmé | `--soft` | Date fixée, rien à faire |
| En cours / en file | `--attente` | Le système va le prendre — **jamais le mot « en attente »** |
| Publié / confirmé | **`--text`** (neutre) + icône `etat--valide` | **Le succès ne se colore pas** (§2.1) |
| WhatsApp | `--wa` | Le canal, et rien d'autre |
| Partiel | `--avertissement` | Il manque une source |
| Périmé | `--avertissement` + âge | C'est daté |
| Échoué | `--erreur` | C'est cassé |

**La pastille avant le libellé est obligatoire** (règle C) : un badge sans pastille n'est
qu'un mot coloré, et un mot coloré ne survit pas à une impression noir et blanc.

**Contre-usage** : jamais de badge pour un texte de plus de **3 mots** (au-delà, le
`--r-pill` fait une capsule trop longue → `--r-xs`) ; jamais de rouge pour un avertissement
et jamais d'ambre pour une erreur — la distinction est mesurée (§2.4) ; jamais un badge
seul pour dire une action : « À décider » dit l'état, le bouton dit le geste.

---

### 5.7 Puce de filtre

**Anatomie** : `[libellé T6 500] [compteur T7 tabulaire]`, hauteur **30 px**, `--r-pill`,
`gap: --e-2`. Le compteur est en `--muted`, **jamais en gras**.

| État | Fond | Bordure | Texte | Compteur |
|---|---|---|---|---|
| Repos | transparent | `--border` | `--soft` | `--muted` |
| Survol | `--card2` | `--border2` | `--text` | `--muted` |
| **Actif** | `--gold-bg` | `--gold` | `--gold2` | `--gold2` |
| Compteur 0 | transparent | `--border` | `--muted` | **masqué** |

**La correction du cockpit** : `.chip.on` a aujourd'hui un **dégradé or plein**, texte sur
fond, et `font-weight:700` contre 500 au repos. Deux conséquences — le texte change de
graisse donc de largeur (la rangée se réagence au clic), et une puce or pleine concurrence
le bouton primaire. **Trois puces actives et le bouton primaire ne se voit plus.** Corrigé :
`--gold-bg` (8 %), bordure `--gold`, **et la graisse ne change pas**.

**Puce à 0** : reste visible et cliquable, en `--muted`. Une puce qui disparaît quand le
compte tombe à zéro fait douter de l'existence de la catégorie.

**Contre-usage** : jamais plus de **8 puces** (au-delà : un `<select>` multiple ou des
onglets) ; **jamais de puce pour une navigation** (c'est un onglet) ; jamais une puce sans
compteur.

---

### 5.8 Onglet

**Anatomie** : `[libellé T5 500] [compteur éventuel T7]`, hauteur **36 px**, **sans fond**,
souligné à 2 px. Les onglets se placent en tête de vue.

| État | Texte | Trait bas | Fond |
|---|---|---|---|
| Repos | `--soft` | transparent | transparent |
| Survol | `--text` | `--border2` 2 px | transparent |
| **Actif** | `--gold2` | **`--gold` 2 px** | transparent |
| Désactivé | `--muted` | transparent | transparent |

**Différence avec la puce, qui n'est pas cosmétique** : la **puce filtre une liste** sur
place (les données restent, la vue se réduit) ; l'**onglet change de vue** (les données
changent, l'objet reste). **Une même rangée ne mélange jamais les deux.**

**Souligné plutôt que rempli** : l'onglet actif est un « où suis-je » ; un onglet rempli
d'or à côté d'un bouton primaire or donne **deux ors de même poids** — l'engagement 2 est
violé. Le souligné distingue sans peser.

**Contre-usage** : jamais plus de **5 onglets** ; jamais d'onglet sans son contenu déjà
chargé (ce serait un lien) ; jamais d'onglet dans un onglet ; **jamais un onglet dont le
`id` de section n'existe pas** — le défaut mesuré de `C` (`switchSection('settings')` sur un
`id` inexistant lève un `TypeError` et l'onglet ne fait rien).

---

### 5.9 Modale

**Une modale est un aveu.** Quatre tests dans l'ordre, et la modale est le dernier recours :

1. Agit sur un objet déjà visible → **panneau latéral**
2. Liste un ensemble homogène → **onglet**
3. A un cycle de vie propre → **vue avec URL**
4. Est un état ou un point d'entrée → **disparaît**

Il reste **deux usages légitimes** : la **confirmation** (une question, une réponse, on
ferme) et le **formulaire court** (moins de 4 champs).

**Anatomie** : voile `color-mix(in srgb, var(--bg) 78%, transparent)` + boîte `--card` +
bordure `--border` + `--r-lg` (28) + rembourrage `--e-6` (24).

| Taille | Largeur | Usage |
|---|---|---|
| `--sm` | **480 px** | Confirmation. Jamais de formulaire |
| `--md` | **640 px** | Formulaire court. **Défaut** |
| `--lg` | **880 px** | Contenu déjà structuré en tableau. **À justifier, et rare** |

**Structure obligatoire** : titre (T3, `--text` — **jamais en or**, engagement 2) · corps ·
barre d'actions en bas **à droite**, l'action primaire **en dernière position**. Jamais
l'action dangereuse à gauche de l'action sûre.

**Comportements non négociables** :
- `Échap` ferme. **Aujourd'hui aucune modale de `A` ne le fait.**
- Le focus **entre** dans la boîte à l'ouverture, **n'en sort pas** tant qu'elle est
  ouverte (`inert` sur le reste), et **revient au déclencheur** à la fermeture.
- Le titre reçoit le focus et annonce la boîte (`aria-labelledby`).
- Fermeture par clic sur le voile **uniquement** si aucune saisie n'est en cours.
- **Jamais deux modales empilées.** Si un second niveau est nécessaire, c'est une vue.

**Contre-usage** : jamais de modale pour un résultat long (elle défile) ; jamais de modale
ouverte après un succès qui a changé l'objet derrière (on ne voit pas le changement) ;
**jamais de `prompt()` ni de `confirm()` natif** — `A` en ouvre 6 + 16, et
`scheduleAllModal()` en ouvre trois pour programmer un lot.

---

### 5.10 Panneau latéral

**Le composant neuf du système**, et celui qui résout le plus de défauts : il remplace la
modale pour tout ce qui agit sur un objet déjà visible.

**Anatomie** : colonne à droite, largeur **420 px** (≥ 1440) / **400 px** (1280–1439, en
surimpression avec voile) / **360 px** (1024–1279) / **plein écran** (< 1024) — `AE` §7.
Plein hauteur sous le bandeau, bordure gauche 1 px `--border`, fond `--card`, rembourrage
`--e-4`. En-tête fixe (titre T3 + fermeture) · corps défilant · pied d'actions fixe.

**Comportement par palier** : **superposé** sous 1440 (la zone de travail ne se rétrécit
pas) · **en colonne** au-delà, où il pousse la grille sans la recouvrir. C'est ce qui permet
de parcourir 22 prospects et d'ouvrir une fiche **sans perdre sa position dans la liste**.

**Ce qu'il porte, et qui n'a pas d'autre endroit** : le **nom entier** de l'objet (§5.2), le
**nombre exact** d'une mesure abrégée (§4.2), l'historique, les actions secondaires.

**États** : fermé (**absent du DOM**, pas `display:none`) · ouverture (`translateX`,
`--t` 300 ms `--ease-out`) · ouvert · **réduit** (56 px, bandeau d'onglets verticaux).

**Contre-usage** : jamais deux panneaux ouverts simultanément ; jamais un panneau qui cache
la liste qu'il sert à parcourir ; jamais un panneau pour une action qui change **toute** la
vue (c'est une vue).

---

### 5.11 Rail de navigation

**Anatomie** : largeur **240 px** (libellés) ou **56 px** (icônes seules) — **deux valeurs,
pas trois** (§7). Cinq destinations, **un seul niveau** : `Aujourd'hui` · `Produire` ·
`Acquérir` · `Veiller` · `Système`, chacune avec son **compteur à droite** du libellé en T7
tabulaire.

| État de l'entrée | Fond | Texte | Marque |
|---|---|---|---|
| Repos | transparent | `--soft` | — |
| Survol | `--card2` | `--text` | — |
| **Active** | `--gold-bg` | `--gold2` | **Filet gauche 2 px `--gold`** + `aria-current="page"` |
| Survolée avec compteur > 0 | — | — | Le compteur passe en `--text` |

**Le rail est un `tablist`** : `Tab` n'atteint que l'entrée active, les flèches `↑`/`↓`
parcourent les cinq (`AE` §8.1). C'est ce qui évite cinq arrêts de tabulation à chaque
passage — et c'est la seule concession du système au clavier, avec les raccourcis.

**Sous 1024 px**, le rail devient une **barre horizontale de 56 px** en haut, défilante,
avec les 5 icônes. **56 est la hauteur du bandeau** : le coin haut-gauche devient un carré
de 56 × 56, le seul coin de l'interface qui se voit à tous les paliers.

**Contre-usage** : jamais de sous-niveau dans le rail (les sous-vues sont des **onglets** de
la destination) ; jamais un rail de plus de 7 entrées (au-delà : deux groupes séparés par un
filet) ; jamais de rail qui disparaît complètement — il se réduit ou devient horizontal.

---

### 5.12 Bandeau

**Anatomie** : hauteur **56 px**, collant, `background: color-mix(in srgb, var(--bg) 82%, transparent)`
+ `backdrop-filter: blur()` — **une des deux seules transparences du système**.

**Trois zones, jamais plus :**

| Zone | Contenu | Traitement |
|---|---|---|
| **Gauche** | Identité : « ePerformance » + la destination courante | T2 (Cormorant 24), `--text`. **Aucun dégradé or** |
| **Centre** | Recherche globale (toutes destinations) | Un champ de 38 px, `--r-pill` |
| **Droite** | État : compte client · indicateur anti-ban · pastille de tâches · badge fournisseur · dernière synchro | Badges neutres + **un seul chiffre en T1 tabulaire** (le quota) |

**Le défaut que ce composant corrige, chiffré** : le bandeau de `A` fait **137 px** de haut,
porte **12 éléments de poids identique**, déborde de **305 px** horizontalement, et
« Anti-ban » se casse sur 4 lignes. Corrigé par construction : **la navigation quitte le
bandeau** (elle vit dans le rail de 240 px), donc le bandeau ne peut plus déborder ; et
« Anti-ban » n'est plus un bouton — c'est **un chiffre + une barre de 4 px**, dans la zone
d'état.

**L'or apparaît une fois dans le bandeau, au maximum** : l'action primaire de la vue
courante. Jamais dans les deux autres zones.

**Contre-usage** : jamais une liste de navigation dans le bandeau ; jamais plus d'un bouton
par zone ; jamais un bandeau qui change de hauteur selon la vue (la zone de travail
sauterait).

---

### 5.13 Fil d'Ariane

**Anatomie** : `[destination] › [sous-vue] › [objet]`, T7, `--muted` pour les niveaux
intermédiaires, `--text` pour le niveau courant (dernier, sans lien). Séparateur : `›`
(U+203A), 12 px, `--border-strong`, `--e-2` de chaque côté.

**Il ne remplace pas les onglets** : le fil d'Ariane dit **où l'on est dans la hiérarchie
des objets** (une publication dans un lot, un prospect dans un segment) ; les onglets
disent **quelle sous-vue de la destination** est ouverte. **Une destination n'affiche jamais
les deux** pour le même niveau.

**Troncature** : au-delà de **4 niveaux**, les niveaux intermédiaires sont remplacés par
`…` cliquable qui ouvre le menu contextuel de la hiérarchie. Le niveau 1 et les deux
derniers restent toujours visibles.

**Contre-usage** : jamais un fil d'Ariane dans une vue de premier niveau (il n'y a rien
au-dessus) — c'est le défaut d'un fil qui affiche « Accueil » seul ; jamais un niveau
intermédiaire non cliquable ; jamais de fil d'Ariane qui répète le titre de la vue.

---

### 5.14 Indicateur de progression

**Premier correctif, et il est de fond** : *un toast qui disparaît en 4,2 secondes pour une
génération qui dure des minutes est un mensonge.* **Toute tâche de plus de 2 secondes est
une entité visible qui survit à la page** : un nom, un début, un état, un résultat, une
reprise.

**Trois paliers, choisis par la durée annoncée — jamais par le goût :**

| Palier | Déclencheur | Composant |
|---|---|---|
| **< 400 ms** | Réponse immédiate | **Rien.** Pas de spinner : l'affichage du résultat suffit |
| **400 ms – 2 s** | Action courte | Squelette (structure connue) ou ligne `--muted` « Chargement… » |
| **> 2 s** | Tâche longue | **Entité nommée persistante** (§5.21), avec étape, progression, annulation |

**Anatomie de la barre** : hauteur **4 px**, piste `--border`, remplissage **`--attente`**
(jamais `--gold`, §0.2 correction 7), transition **320 ms linéaire** — la seule durée
linéaire du système, parce qu'une progression est un compteur, pas un mouvement.

**La progression est nommée et réelle.** Jamais une barre indéterminée qui tourne pour un
travail qui a des étapes connues : les étapes d'une génération sont connues (texte → image →
validation) et elles s'affichent.

**Le manque réel du cockpit** : **0 `AbortController`** dans le fichier — donc aucune tâche
longue n'est annulable. Une entité qui dure des minutes sans bouton d'annulation n'est pas
une entité, c'est une attente. **Annulation obligatoire au troisième palier.**

**Contre-usage** : jamais de barre indéterminée pour une tâche de plus de 10 secondes ;
jamais de progression estimée sans repère temporel (« environ 40 s », pas « 47 % ») ; jamais
de toast pour une tâche longue ; **jamais d'overlay bloquant sans issue** — `doSync()` est
aujourd'hui sans `try/catch` : le réseau tombe, l'overlay reste bloqué indéfiniment.

---

### 5.15 État vide

**Quatre cas distincts**, qui n'appellent pas la même réaction — et ce sont exactement les
quatre cas du socle `UI.vide` de `A` et des 4 états d'écran de `AE` §2 :

| Cas | Message | Action |
|---|---|---|
| **Aucune donnée** (jamais eu) | « Aucun prospect pour l'instant. » + comment en avoir | Primaire : « Ajouter un prospect » |
| **Aucun résultat** (filtre trop étroit) | « Aucun prospect ne correspond à ce filtre. » | **Tertiaire** : « Effacer les filtres » |
| **Rien à faire aujourd'hui** (cas normal et heureux) | « Rien à relancer aujourd'hui. » | **Aucune action.** C'est une bonne nouvelle, pas un vide |
| **Échec de chargement** | « Les données n'ont pas pu être chargées. » + la cause | Secondaire : « Réessayer » + « Diagnostic » |

**Anatomie** : icône 32 px `--border-strong` (**jamais or** : il n'y a rien à faire ici) ·
titre T4 `--text` · texte T6 `--muted`, `max-width:44ch` · action. Vertical `--e-12` (48),
centré, `min-height:240px`.

**La distinction qui manque** : le troisième cas est le plus important et **n'existe pas
aujourd'hui**. `A` n'a qu'un `.empty` (« Aucun prospect ici. ») pour les quatre situations.
Une file vide le matin doit dire « Rien à faire aujourd'hui » — et surtout pas ressembler à
une panne.

**Contre-usage** : jamais d'état vide sans texte (une zone blanche fait croire à un bug) ;
jamais un état vide avec une action primaire or quand il n'y a rien à faire ; jamais le même
message pour « aucune donnée » et « aucun résultat ».

---

### 5.16 Chargement

**Trois formes, une par durée** (§5.14). Jamais de mélange.

1. **Squelette** (400 ms – 2 s, structure connue) : blocs `--card2` animés `pulse` 1,2 s.
   **La forme du squelette est celle du contenu réel** — un squelette de carte pour une
   carte, des lignes de 36 ou 44 px pour un tableau. Un squelette générique ne sert à rien.
   **Le rayon est celui de l'objet remplacé** (`--r` pour une carte, `--r-sm` pour une
   ligne) : un squelette de carte à 8 px annonce une carte à 8 px.
2. **Ligne de chargement** (liste, rafraîchissement) : une ligne T7 `--muted`,
   « Chargement… », **avec le mot**. Jamais un spinner seul : un spinner ne dit ni quoi, ni
   combien de temps, ni si c'est bloqué.
3. **Entité de tâche** (> 2 s) : §5.21.

**Contre-usage** : jamais de squelette à la place d'un état vide (un squelette qui ne finit
jamais est pire qu'un message) ; jamais de chargement sans mot ; **jamais d'indicateur qui
survit à la fin de la tâche** — le défaut inverse existe aussi : un toast qui se détruit à
4,2 s et disparaît **avant** la fin de la génération qu'il annonce.

---

### 5.17 Notification

**Trois niveaux, et le niveau décide de la position et de la durée.** C'est l'inverse de
`A`, où `toast()` sert à tout.

| Niveau | Où | Durée | Contenu | Rôle ARIA |
|---|---|---|---|---|
| **Information** | coin bas droit | 6 s | « Synchronisation terminée : 3 publications. » | `role="status"` |
| **Succès** | coin bas droit | 6 s | Le résultat, **avec sa preuve** (l'URL, la date) | `role="status"` |
| **Erreur** | **en tête du bloc concerné, dans le flux** | **permanente** | La cause en `--text` + l'action de reprise | `role="alert"` |

**Anatomie** : filet gauche 3 px coloré (`--attente` pour l'information, `--erreur` pour
l'erreur, `--border-strong` pour le succès — **le succès n'a pas de couleur**, §2.1), fond
`--card`, `--r-sm`, rembourrage `--e-3` / `--e-4`, `max-width:380px`. Le mot porte le sens :
« Terminé », « Échec », « Info ».

**Deux règles de fond :**

1. **Une notification parle du monde, pas des clics de l'utilisateur.** « Le post est sorti »
   (avec l'URL), « Le prospect a répondu » (avec la date). Le reste — « Enregistré », « Filtre
   appliqué », « 3 éléments sélectionnés » — passe sans commentaire. `A` notifie aujourd'hui
   l'inverse : il confirme des clics et se tait sur les résultats.
2. **Une erreur ne disparaît jamais toute seule.** Elle reste jusqu'à ce que la cause soit
   traitée. Un message d'erreur qui s'efface en 4 secondes oblige à reproduire l'erreur pour
   la lire.

**Contre-usage** : jamais plus de **3 notifications empilées** (empiler, c'est déjà avoir
échoué) ; jamais de notification pour un succès évident à l'écran (la ligne disparaît de la
liste : c'est la preuve) ; jamais une erreur en bas à droite, hors du regard.

---

### 5.18 Info-bulle

**Usage unique : rappeler ce qu'une icône veut dire.** Rien d'autre.

**Anatomie** : fond `--card2`, bordure `--border2`, `--r-xs` (6), texte T7 `--text`,
rembourrage `--e-1` / `--e-2`, `max-width:280px`, délai **400 ms**.

**Déclenchement : survol ET focus clavier.** Une info-bulle qui ne s'ouvre qu'au survol
n'existe pas au clavier.

**Le texte est un mot ou une phrase courte, jamais une phrase complète.** Si l'explication
dépasse **12 mots**, c'est un texte d'aide dans le champ, ou une section d'aide.

**Contre-usage** : jamais d'information **nécessaire à l'action** dans une info-bulle (elle
n'est ouverte ni au clavier sans focus, ni au tactile, ni à l'impression) ; jamais d'info-bulle
sur un élément non focusable ; jamais d'info-bulle qui répète le libellé visible — le
`title="Cliquer pour changer de provider"` sur un badge qui affiche « DeepSeek » est
exactement ce contre-usage.

**Et une règle de fond** : les **35 attributs `title`** de `A` qui portent une information
utile (`title="Stoppe J+3 et J+7 — je prends le relais"`) doivent **devenir du texte
visible**, pas des info-bulles. Ce qui commande une conséquence ne se cache pas dans un survol.

---

### 5.19 Menu contextuel

**Usage** : les actions **secondaires** d'un objet, quand il y en a plus de deux et qu'elles
n'ont pas leur place dans la ligne. Il remplace la prolifération de boutons dans une colonne
d'actions.

**Anatomie** : surface `--card2` + bordure `--border2` + `--r-sm` (12) + `--shadow-md` (une
des trois ombres autorisées) + rembourrage `--e-1` (4). Une entrée = `[icône 16] [libellé T5]`,
hauteur **32 px**, `--r-xs` au survol.
**Séparateur** : filet 1 px `--border`, `--e-1` au-dessus et au-dessous. **Maximum 7 entrées
avant un séparateur de groupe.**

**Déclenchement** : clic sur un bouton `--icone-seule` (`⋯`, `aria-haspopup="menu"`), **et**
touche `Menu` / `Shift+F10` au clavier. `Échap` ferme, `↑`/`↓` parcourent, `Entrée` active,
`Tab` **ferme le menu et sort** vers l'élément suivant.

**Les actions destructives sont toujours la dernière entrée**, après un séparateur, en
`--erreur` — et elles demandent confirmation (§5.9). L'ordre des entrées est **stable entre
deux objets** : un menu dont les entrées changent de place selon la ligne interdit la
mémoire musculaire.

**Contre-usage** : jamais une action **primaire** dans un menu contextuel (elle doit être
visible) ; jamais un menu de plus de 10 entrées (c'est un panneau) ; jamais un menu qui
s'ouvre au survol ; jamais un menu contextuel comme seul moyen d'atteindre une action —
il double toujours un chemin visible.

---

### 5.20 Sélecteur de date

**Décision : le sélecteur de date est un composant maison, jamais `<input type="date">`.**
Le contrôle natif est peint par l'agent utilisateur : en thème sombre il ouvre un calendrier
**blanc** (défaut le plus visible d'un dashboard sombre mal déclaré), il ignore les jetons,
et il ne sait pas afficher « les 7 derniers jours », qui est la seule plage réellement
utilisée ici.

**Anatomie** : un **champ de saisie libre** (`jj/mm/aaaa`, `--police-chiffres` tabulaire) +
**un bouton calendrier** de 32 px (`actu--calendrier`) + **une rangée de 4 puces de plage** :
`Aujourd'hui` · `7 j` · `30 j` · `Tout`. Le calendrier s'ouvre dans un popover de 280 × 320 px,
6 colonnes de 40 px, `--r-sm`.

| Élément | Traitement |
|---|---|
| Jour courant | `--gold` en texte + pastille `--gold-bg`, **le seul or du popover** |
| Jour sélectionné | fond `--gold`, texte `--on-gold` (8,83:1) |
| Plage | `--gold-bg` sur les jours intermédiaires, `--gold` sur les extrémités |
| Jour hors du mois | `--muted`, cliquable |
| Jour sans donnée | `--muted` + point 4 px `--border-strong` — **on n'interdit pas la sélection, on informe** |

**Le champ reste saisissable au clavier** : c'est ce qui distingue un sélecteur de date
utilisable d'un calendrier obligatoire. Saisie `jj/mm/aaaa`, `↑`/`↓` incrémentent le jour,
`Page↑`/`Page↓` le mois.

**Contre-usage** : jamais de calendrier comme seule entrée (le clavier doit pouvoir saisir) ;
jamais de plage relative ambiguë — « 30 j » signifie **30 jours avant aujourd'hui**, et c'est
écrit dans le libellé de l'en-tête de colonne ; jamais de fuseau non affiché : l'horloge de
dernière synchro du bandeau porte son format (`14:12` local).

---

### 5.21 Barre de tâches

**Ce que c'est** : le logement permanent des tâches longues (§5.14, 3ᵉ palier). **Jamais
masquée, jamais repliée, à aucun palier de largeur** — c'est l'une des deux informations dont
l'absence coûte du travail (`AE` §7).

**Anatomie** : bandeau ancré **en bas du rail** (240 px), hauteur **48 px par tâche**,
`--card2`, filet haut 1 px `--border`. Par tâche :
`[icône d'état] [nom de la tâche T6, tronqué] [barre 4 px] [étape T7] [temps T7] [annuler]`.

| État | Icône | Barre | Droit |
|---|---|---|---|
| En cours | `etat--attente` (arc) en `--attente` | `--attente`, 320 ms linéaire | « Annuler » |
| Terminée | `etat--valide` en `--text` | pleine, `--border-strong` | « Voir le résultat » |
| Échouée | `etat--echec` en `--erreur` | vide, `--border` | « Réessayer » + « Diagnostic » |

**Le nom de la tâche est un nom, pas une catégorie** : « Lot de 7 publications · 12 sept. »,
pas « Génération ». L'utilisateur doit pouvoir dire laquelle il annule.

**Contre-usage** : jamais plus de **3 tâches** affichées (au-delà : un compteur + un
panneau) ; jamais une tâche terminée qui reste plus de **30 s** ; jamais une entité de tâche
sans bouton d'annulation ; **jamais un toast pour une tâche de plus de 2 secondes**.

---

### 5.22 Ligne de décision

**L'objet central de la destination `Aujourd'hui`**, et la raison pour laquelle le dashboard
existe. Une ligne = un geste à faire, dans un seul des quatre groupes : ce qui bloque, ce qui
a échoué, ce qui attend une décision, ce qui tourne.

**Anatomie** : hauteur **44 px** (jamais 36 pour cette liste : elle se parcourt, elle ne se
scanne pas) · filet gauche 3 px selon le groupe · `[icône] [objet T6] [contexte T7 --muted]
[échéance T7] [bouton --sm]`.

| Groupe | Filet | Icône | Bouton |
|---|---|---|---|
| Ce qui bloque | `--erreur` | `etat--echec` (croix) | `--sm --destructif` ou « Diagnostic » |
| Ce qui a échoué | `--erreur` **atténuée** (`--red-border`) | `etat--echec` | `--sm` secondaire |
| Ce qui attend une décision | **`--gold`** | `etat--attention` | `--sm` primaire — **la seule or de la liste** |
| Ce qui tourne | `--border-strong` | `etat--attente` (arc) | aucun bouton |

**Chaque ligne porte un verbe** : « Publier », « Relancer », « Qualifier », « Réessayer ».
Une ligne sans verbe est un constat — donc elle n'a pas sa place dans la file.

**Contre-usage** : jamais plus de **2 boutons** par ligne ; jamais une ligne qui n'a ni
action ni échéance ; jamais de couleur de groupe sans le titre de groupe au-dessus (le filet
seul ne dit pas le groupe) ; **jamais 36 px ici** — c'est la seule liste où l'interligne
supplémentaire achète de la précision au clic.

---

### 5.23 Bloc de mesures

**Ce que c'est** : le conteneur des quatre formes de §4.4. **Un bloc = une question**, et le
titre du bloc est la question (« Répartition par statut », « Conversion du pipeline »).

**Anatomie** : titre T3 · sous-titre T7 `--muted` portant **la source et l'âge** de la donnée
(« 22 prospects · synchro 14:12 ») · la forme · une ligne de pied T7 `--muted` si le total
ne correspond pas à la somme des barres (donc si la donnée est partielle — §4.1).

**Le sous-titre est obligatoire.** Un graphique sans source ni date est une illustration.
`B` affiche 4 graphiques dont aucun ne porte ni source ni fraîcheur : c'est ce qui a permis
à un fichier de données divergentes de 20 lignes sur 22 (`M1` §2.3) de rester visible sans
être contesté.

**Contre-usage** : jamais deux formes différentes dans un même bloc ; jamais un graphique
sans son total écrit en T7 ; jamais un graphique qui répond à deux questions ; jamais un
bloc de mesures en or (l'or est une action ou un état courant, pas une donnée).

---
## 6. Le remplacement des emojis

### 6.1 Le relevé, et la réconciliation des quatre chiffres

Le brief annonce **306** emojis dans le cockpit. `M5` §6.3 en mesure **315** et parle d'« un
écart de méthode ». L'écart est en effet un écart de méthode, il est exactement
reproductible, et il cache un quatrième chiffre que personne n'a vu : **le comptage doit
déclarer son jeu de caractères, sinon il est faux.**

| Définition | `A` | `B` | `C` | `S` | Total | Ce qu'elle ajoute |
|---|---:|---:|---:|---:|---:|---|
| **R1 — pictogrammes** (`U+1F000–1FAFF`, `U+2600–27BF`, `U+2B00–2BFF`) — **le chiffre du brief** | **306** | 65 | 33 | 89 | **493** | — |
| **R2 — R1 + blocs techniques** (`U+2300–23FF` : `⏳` ×43, `⏱` ×2 ; `U+2139` `ℹ`) — **le chiffre de travail** | **351** | 65 | 34 | 89 | **539** | **45 séquences que R1 rate** |
| R1 + flèches (`U+2190–21FF`) — **le chiffre de `M5`** | 315 | 358 | 37 | 129 | 839 | 345 flèches |
| + sélecteurs de variante (`U+FE0F`) comptés comme des points de code — le « 359 » | 359 | — | — | — | — | `✅️` = 2 points de code |

**Le chiffre de travail est 351, et voici pourquoi il n'est pas 306.** Le deuxième emoji le
plus fréquent du cockpit après `✅` est **`⏳` (43 occurrences)** — et `⏳` est
`U+23F3`, dans le bloc *Divers technique* (`U+2300–23FF`), **hors des blocs pictographiques**.
Un comptage qui suit le brief à la lettre laisse donc **43 emojis en place** dans la file du
jour, c'est-à-dire précisément l'écran qui compte. `CV` §6 donne d'ailleurs `⏳` pour 43 :
il avait raison, et il ne l'avait pas dit.

**Le relevé complet, par fichier** (R1 / R2, plus les deux parts qui ne sont pas des icônes) :

| Fichier | Pictogrammes | dont en commentaire de code | Flèches (ponctuation) | Distinctes |
|---|---:|---:|---:|---:|
| `A` `cockpit.html` | **351** | 17 | 8 | 65 |
| `S` `prospect_app.py` | **89** | 15 | 40 | — |
| `B` `dashboard.html` | **65** | 5 | **293** | 18 |
| `C` `templates_dashboard/dashboard.html` | **34** | 0 | 4 | 16 |
| **Total** | **539** | **37** | **345** | — |

### 6.2 Deux parts qui ne sont pas des icônes — et qu'il ne faut pas remplacer

**1. `→` n'est pas un emoji dans `B`, c'est un séparateur.** 293 occurrences : `+226 70 … →
Ouagadougou → Beauté`. C'est de la **ponctuation typographique** dans une phrase, au même
titre que `·` ou `|`. **Les 345 flèches restent** : elles ne sont ni remplacées par une
icône ni comptées dans le nettoyage. La règle qui les distingue :

> **Une flèche est une icône quand elle porte une action** (aller à, ouvrir, monter d'un
> niveau) : elle devient un SVG. **Une flèche est de la ponctuation quand elle sépare deux
> valeurs dans une même chaîne** : elle reste un caractère, en `--muted`.

**2. 37 pictogrammes sont sur des lignes de commentaire de code.** Ils ne sont pas dans
l'interface : ils marquent des patchs et des notes. **Ils se suppriment à la source, ils ne
se remplacent pas par une icône** — le cas le plus net est `🛠` : **33 occurrences, dont 32
en commentaire** dans `prospect_app.py` (`# 🛠️ PATCH 2026-09-v3 : …`). Remplacer ce
pictogramme par un SVG serait une erreur de lecture du relevé.

### 6.3 Le cas le plus grave : les emojis qui traversent l'API

Le nettoyage du HTML ne suffit pas — `M5` §6.3 l'a établi et c'est ce qui conditionne tout
le reste : **le serveur renvoie des emojis dans ses réponses JSON**, et l'interface les
affiche tels quels.

```
$ curl -s .../api/ia/status
{"deepseek":{"status":"✅ Opérationnel"},"illustrations":{"status":"✅ 74 illustrations procédurales"}}

$ curl -s .../api/system-check
{"name":"Endpoint 📥 pull statuts (lire_publications.php)"}
```

Sources côté serveur : `prospect_app.py:1087, 1093, 1360, 1364, 1366, 1377, 1389, 1391,
1445, 1940`. **89 pictogrammes dans `S`, dont au moins 10 dans des charges utiles JSON.**

**Décision : l'API ne renvoie plus de chaîne décorée, elle renvoie un état et une donnée.**

| Aujourd'hui (serveur) | Demain (contrat) | Ce que l'interface compose |
|---|---|---|
| `"status": "✅ Opérationnel"` | `"etat": "ok"` | badge `Publié/confirmé` (neutre + icône + mot) |
| `"status": "⚠️ Clé API manquante"` | `"etat": "incomplet", "manque": "clé API"` | bandeau **partiel** ambre + le mot |
| `"status": "❌ Échec"` | `"etat": "echec", "cause": "…"` | filet rouge + croix + la cause |
| `"name": "Endpoint 📥 pull statuts"` | `"nom": "pull statuts", "type": "pull"` | ligne + icône `actu--importer` |

**La règle** : *le serveur ne décrit pas l'apparence, il décrit l'état.* Un serveur qui
renvoie « ✅ » a décidé de l'icône, de sa couleur et de sa position — trois décisions de
design prises dans du Python, sans possibilité de les changer sans redéployer. **Aucune
chaîne renvoyée par l'API ne contient de pictogramme** : c'est vérifiable d'un `grep` sur les
réponses, et c'est le seul contrôle qui empêche la régression (§9, contrôle 2).

**Conséquence sur l'ordre des travaux** : le nettoyage du HTML **et** de l'API sont la même
tâche. Un composant de badge qui ne ferait que retirer les emojis du HTML laisserait passer
ceux de `/api/ia/status` et `/api/system-check`.

### 6.4 Le langage : « Instrumentation » décliné en icônes d'interface

Le site possède 111 icônes d'interface en `viewBox="0 0 24 24"` et 26 illustrations en
`viewBox="0 0 120 72"` sous le langage Instrumentation (7 primitives, 5 règles). **Les icônes
du dashboard sont des icônes d'interface, pas des illustrations** : elles vivent à 16, 20 ou
24 px. Le langage est donc **adapté, pas copié**.

| Règle Instrumentation (ADR-0003) | Application au 24 × 24 |
|---|---|
| **1. Un seul accent or maximum** | Une icône n'a **jamais** d'or, sauf quand elle marque l'état courant. Sinon `currentColor` seul |
| **2. Aucune couleur littérale** | `stroke="currentColor"`, `fill="none"`. **Zéro `#` dans un SVG** |
| **3. Grille de 4 px** | Toutes les coordonnées ∈ {4, 8, 12, 16, 20}. `viewBox="0 0 24 24"` |
| **4. Deux épaisseurs, jamais trois** | **1,5 px** pour le trait porteur, **1 px** pour la trame secondaire. Les 111 icônes du site sont à 2 : trop lourd à côté d'un texte de 14 px |
| **5. La trame reste partielle** | Une grille de points ne couvre jamais tout le carré ; elle est interrompue ou limitée à un quadrant |

**Sept primitives** : cercle concentrique (C), arc gradué (A), barres verticales (B), grille
de points (G), segment en escalier (E), rectangle imbriqué (R), diagonale (D).
**Trois primitives maximum par icône** — à 24 px, au-delà, la forme devient une tache.
`stroke-linecap="round"`, `stroke-linejoin="round"`, `aria-hidden="true"` **systématiquement** :
l'icône double toujours un mot. **Jamais de glyphe figuratif** : pas de fusée, pas
d'ampoule, pas d'engrenage, pas de visage, pas de mégaphone, pas d'épée.

**La taille est portée par la classe, jamais par l'attribut** — 16 px dans un bouton, 20 px
dans un en-tête, 24 px dans un état vide, et **jamais plus**. Un `width`/`height` en dur dans
le SVG est ce qui produit aujourd'hui des mélanges de tailles dans la même rangée.

### 6.5 La table de correspondance

**47 lignes, 504 des 539 pictogrammes (93,5 %).** La colonne `état` dit si l'icône est
**ratifiée** (= spécifiée dans `CV` §6, aucune modification), **nouvelle** (absente de la
table du cockpit), ou **supprimée** (ce n'est pas une icône).

#### Famille 1 — États de résultat

| Emoji | N | Sens réel | Icône | Construction (24 × 24, trait 1,5) | État |
|---|---:|---|---|---|---|
| ✅ | 61 | Succès confirmé | `etat--valide` | **C + D.** Arc ouvert en haut à droite, Ø20 centré (12,12) ; corde en deux segments (8,12)→(11,15) puis (11,15)→(17,7). Un seuil franchi, pas une coche scolaire | ratifiée |
| ❌ | 49 | Échec, erreur | `etat--echec` | **D + D.** Deux diagonales (7,7)→(17,17) et (17,7)→(7,17). Aucun cercle : la forme dit « cassé », pas « attention » | ratifiée |
| ⏳ | **43** | En attente, en cours (**le 2ᵉ emoji le plus fréquent du cockpit**) | `etat--attente` | **A + A + C.** Trapèze supérieur ouvert, trapèze inférieur ouvert, cercle Ø2 au centre. Cadre vide, trois formes. **C'est le pictogramme qui justifie R2** : `U+23F3` est hors des blocs pictographiques | ratifiée |
| ⚠️ | 13 | Avertissement | `etat--attention` | **A + G.** Triangle ouvert (12,4)→(20,19)→(4,19), non fermé en bas ; barre (12,9)→(12,14) ; point (12,17). Géométrie de seuil, jamais de visage | ratifiée |
| 🛑 | 12 | Stopper | `actu--stopper` | **B + B.** Deux barres verticales (10,6)→(10,18) et (14,6)→(14,18). Un frein, jamais un carré plein | ratifiée |
| conforme | 5 | « Oui » (un mot, pas une icône) | `etat--valide` + le mot | Le pictogramme disparaît, **le mot « Oui » reste** en T6 `--text`, l'icône à côté | nouvelle |
| ✗ | 2 | « Non » | `etat--echec` + le mot | Idem : le mot « Non » en T6 `--text` | nouvelle |
| **🆕** | 4 | Nouveau, non traité | `etat--nouveau` | **C + G + B.** Cercle Ø16 (12,12) **ouvert à 45°** en haut à droite (l'arc s'interrompt) ; deux points (9,12) et (12,15) ; barre courte (12,15)→(15,15). Un contenant dont l'angle est vide : ce qui n'a pas encore été pris | nouvelle |
| ⛔ | 1 | Limite atteinte | `etat--limite` | **C + B.** Cercle Ø20 ; barre pleine (5,12)→(19,12). Un cadran à zéro, pas un panneau routier | ratifiée |
| ℹ️ | 1 | Information | `etat--info` | **C + D + G.** Cercle Ø20 ; barre (12,9)→(12,17) ; point (12,6) | ratifiée |

#### Famille 2 — Actions techniques

| Emoji | N | Sens réel | Icône | Construction | État |
|---|---:|---|---|---|---|
| 🔄 | 17 | Actualiser, réessayer | `actu--rafraichir` | **A + D.** Arc Ø18 ouvert sur 90° en haut à droite ; pointe courte (16,5)→(20,7)→(17,10). Une rotation, pas un cycle complet | ratifiée |
| 📥 | 8 | Importer, tirer du serveur | `actu--importer` | **A + D.** Arc en bas ; flèche descendante (12,5)→(12,15) + pointe. Le sens est porté par la flèche | ratifiée |
| 🖼️ | 8 | Image, visuel | `dom--image` | **R + D + C.** Cadre ; diagonale montante (6,18)→(12,11) ; cercle Ø4 (16,9). La diagonale comme ligne de fuite | ratifiée |
| 🗑️ | 9 | Supprimer | `actu--supprimer` | **R + B + B.** Rectangle ouvert (6,8)-(18,20) ; deux barres (10,12)→(10,17) et (14,12)→(14,17). Un conteneur vidé, aucun couvercle | ratifiée |
| ✏️ | 8 | Modifier | `actu--modifier` | **D + D.** Diagonale (5,19)→(17,7) trait 1,5 ; seconde parallèle décalée (8,20)→(20,8) trait 1. Un trait qui corrige un autre trait | ratifiée |
| 📋 | 8 | Copier | `actu--copier` | **R + R.** Deux rectangles imbriqués décalés de 4 px. La primitive « rectangle imbriqué » à l'état pur | ratifiée |
| 📊 | 8 | Statistiques | `dom--mesure` | **R + B + B + B.** Cadre ouvert en bas ; trois barres verticales de hauteurs 8 / 14 / 11. Barres **dans** un cadre | ratifiée |
| 🔎 | 6 | Chercher (lancer) | `actu--chercher` | **C + D.** Cercle Ø12 (10,10) ; manche (17,17)→(21,21) | ratifiée |
| 🔍 | 5 | Rechercher (dans une liste) | `actu--filtrer` | Identique, **plus trois points** (4,20),(8,20),(12,20) : dit « dans une liste » | ratifiée |
| 🎬 | 5 | Vidéo | `dom--video` | **R + R + D.** Cadre ; rectangle interne décalé ; triangle ouvert (10,9)→(16,12)→(10,15) | ratifiée |
| 📤 | 4 | Exporter, pousser | `actu--exporter` | **A + D.** Miroir vertical de `actu--importer`. La raison du miroir est le sens du transfert | ratifiée |
| 📸 | 4 | Aperçu, capture | `dom--capture` | **R + C + R.** Cadre ; cercle Ø10 au centre ; petit rectangle (9,3)-(15,6) (viseur) | ratifiée |
| 📝 | 4 | Note, modèle | `dom--modele` | **R + B.** Cadre à coin coupé ; deux barres (8,12)→(16,12) et (8,16)→(13,16) | ratifiée |
| ↗ | 4 | Lien externe | `sys--externe` | **D + D + B.** Diagonale (8,16)→(16,8) ; pointe (12,8)→(16,8)→(16,12) ; barre (7,17)→(10,20) | ratifiée |
| 🛠️ | 33 | **Rien — commentaire de code** | **aucune** | **Supprimé à la source.** 32 des 33 occurrences sont des `# 🛠️ PATCH …` | supprimée |

#### Famille 3 — Domaines et objets du métier

| Emoji | N | Sens réel | Icône | Construction | État |
|---|---:|---|---|---|---|
| 📱 | 13 | WhatsApp, téléphone | `dom--telephone` | **R + R.** Rectangle haut (10,2)-(14,8) ; rectangle bas (7,8)-(17,20) `--r-xs`. Un appareil, pas une bulle | ratifiée |
| 📚 | 10 | Publications, archive | `dom--archive` | **B + B + B.** Trois barres verticales de hauteurs décroissantes. Une étagère lue comme un histogramme | ratifiée |
| 📅 | 7 | Programmer, calendrier | `dom--echeance` | **R + R + G.** Cadre ; barre d'en-tête ; **une seule** barre de séparation (16,4)→(16,20) ; deux points | ratifiée |
| 💰 | 6 | Coût, prix | `dom--cout` | **C + C + B.** Deux cercles concentriques Ø16 / Ø10 ; barre verticale traversante (12,2)→(12,22) | ratifiée |
| ⚔️ | 7 | Concurrence, veille | `sys--concurrence` | **D + D + D.** Deux diagonales croisées (5,5)→(19,19) et (19,5)→(5,19) ; troisième courte (17,17)→(21,21). **Jamais d'épée** | ratifiée |
| 🗺️ | 1 | Carte, source OSM | `dom--carte` | **R + D + D + G.** Cadre ; deux diagonales convergentes ; trois points. Un quadrillage, pas une carte pliée | ratifiée |
| 🔗 | 1 | Lien, identifiant | `dom--lien` | **R + R + D.** Deux rectangles ouverts imbriqués reliés par une diagonale courte | ratifiée |
| 🎯 | 13 | Opportunité détectée | `dom--opportunite` | **C + C + G.** Anneau Ø16 ; anneau Ø9 ; point plein Ø3 au centre. La primitive « cercle concentrique » à l'état pur. Aucune fléchette, aucun trophée | **nouvelle** |
| 🎨 | 10 | Design, créativité, templates | `dom--design` | **R + D + G.** Cadre ouvert à droite ; diagonale basse (6,18)→(14,10) ; grille de points 2 × 2 dans le quadrant haut-gauche. Une **planche de travail**, pas une palette de peintre | **nouvelle** |
| 🌍 | 1 | Pays, zone | `dom--zone` | **R + G(G).** Cadre ouvert en haut ; deux colonnes de trois points inégalement réparties, **un seul point** marqué au centre. Une carte de points, pas un globe | **nouvelle** |

#### Famille 4 — Intelligence, système et signaux

| Emoji | N | Sens réel | Icône | Construction | État |
|---|---:|---|---|---|---|
| 🤖 | 14 | Fournisseur IA | `sys--ia` | **R + G + G.** Rectangle à coins `--r-xs` ; grille de points 2 × 2 **interrompue** en bas à droite. Un module, pas un robot | ratifiée |
| 🧠 | 15 | Compétences, skills | `sys--skills` | **C + D + D.** Cercle Ø10 (12,12) ; deux diagonales rayonnantes (17,7)→(21,4) et (17,17)→(21,20). Un noyau qui rayonne, pas un cerveau | ratifiée |
| ⚡ | 14 | Actions rapides | `sys--rapide` | **D + D.** Éclair en deux diagonales (14,3)→(9,12)→(13,12) et (13,12)→(10,21). Une trajectoire | ratifiée |
| ✨ | 13 | Génération IA | `sys--generer` | **D + D + D.** Trois diagonales divergentes depuis (12,12), angles 45° / 90° / 135°, longueurs 5 / 7 / 5. Aucune courbe | ratifiée |
| 🩺 | 9 | Diagnostic système | `sys--diagnostic` | **C + G + D.** Cercle Ø16 ; grille de points **limitée au quadrant bas-droit** ; aiguille (12,12)→(17,7) | ratifiée |
| 🔥 | 9 | Score chaud (≥ 70) | `sys--temperature` **cran haut** | **B + E + A.** Barre verticale (8,4)→(8,20) ; arc Ø8 en haut ; trois paliers d'escalier à droite, **le palier haut est rempli**. Voir ci-dessous : trois crans, une seule icône | **ratifiée et refondue** |
| 🌤️ | 17 | Score tiède (≥ 40) | `sys--temperature` **cran moyen** | Même icône, **palier médian rempli** | **nouvelle** |
| ❄️ | 4 | Score froid | `sys--temperature` **cran bas** | Même icône, **palier bas rempli** | ratifiée, refondue |
| ↘ | 1 | Tendance en baisse | `sys--baisse` | **E + D.** Escalier descendant de trois paliers (5,7)→(9,11)→(14,13)→(19,18) ; diagonale courte de sortie (19,18)→(19,14) | **nouvelle** |
| 💡 | 7 | Conseil, idée | `sys--conseil` | **C + C + B.** Demi-cercle Ø12 supérieur ; barre de base (9,19)→(15,19) ; deux traits courts. Un ampèremètre, pas une ampoule | ratifiée |
| 🚀 | 3 | Performance | `sys--performance` | **D + D + A.** Deux diagonales parallèles montantes ; arc de sortie en haut. **Aucune fusée** : une accélération se lit par la pente | ratifiée |
| ⚙️ | 3 | Paramètres | `actu--regler` | **C + C + B.** Deux cercles concentriques Ø16 et Ø8 ; trois barres courtes rayonnantes à 0° / 120° / 240°. Un cadran réglé, pas un engrenage | ratifiée |

**Les trois chiffres chaud / tiède / froid sont une seule icône, pas trois pictogrammes.**
`🔥` / `🌤️` / `❄️` désignent trois **crans du même instrument** — et dans `B` ce sont
littéralement trois valeurs du même score (`Hot ≥ 70`, `Warm ≥ 40`, `Cold`). Trois
pictogrammes différents pour trois valeurs d'une même échelle obligent l'œil à apprendre
trois formes ; **une jauge à trois crans se lit d'un coup**, et elle est cohérente avec la
règle du langage (une primitive, une variable). Le cran est aussi **écrit** (« chaud »,
« tiède », « froid ») : la forme porte l'ordre, le mot porte le sens.

**Le reste de la table** : les 35 pictogrammes restants sont ceux de `CV` §6 (65 emojis
spécifiés) — aucun n'est laissé au hasard, et aucun n'est repris ici.

### 6.6 Trois règles d'écriture d'une icône

1. **Une icône n'apparaît jamais seule sans nom accessible.** Si le bouton n'a pas de texte
   visible, il porte un `aria-label` — **jamais un `title` seul**.
2. **Une icône ne porte jamais l'information seule.** `⚠️ Réponse cron : …` doit dire
   « Réponse cron : … » **avec** l'icône à côté, pas à la place. Vaut pour les 6 familles.
3. **Le nettoyage porte sur les 101 `innerHTML` du fichier, pas sur les chaînes de
   notification seulement** — et sur les deux côtés (§6.3).

---

## 7. La grille et les points de rupture

### 7.1 Le fait de départ, et les deux contradictions à trancher

Le dashboard est utilisé **sur un écran d'ordinateur large**. Les paliers ne sont pas une
concession au mobile : ce sont des **paliers de confort décroissant sur un poste de travail**,
plus un plancher de non-casse sous 1024 px.

**Deux contradictions entre les documents existants, tranchées ici parce qu'elles changent
la grille :**

**1. `CV` §7 donne trois largeurs de rail (240 / 232 / 216). `AE` §7 en donne deux
(240 / 56).** Décision : **deux.** Un rail de 232 px au lieu de 240 ne se voit pas, mais il
exige un jeu de captures et un test de non-débordement par palier supplémentaire. **Trois
largeurs, c'est trois fois les tests pour un gain invisible.**

**2. `AE` §7 dit que le panneau latéral « pousse le contenu » au-dessus de 1440, et 3
colonnes de cartes au même palier. Les deux ne tiennent pas ensemble** : à 1440,
1440 − 240 (rail) − 420 (panneau) − 48 (marges) = 732 px de zone de travail, soit 3 colonnes
de 244 px — sous le plancher de carte de 300 px (§7.3). Décision : **le panneau ne pousse la
grille qu'au-delà de 1920.** En dessous, il est **superposé avec voile** : la liste ne se
rétrécit pas, l'objet consulté s'ouvre par-dessus, et l'utilisateur ne perd pas sa position
dans la liste. C'est le comportement que `AE` décrit lui-même à 1280 et qui doit simplement
commencer plus tôt.

### 7.2 Le pavage à 1920 — pourquoi 1200 px

```
┌────────┬──────────────────────────────────────────────┬──────────────┐
│        │  bandeau 56 px : identité · recherche · état  │              │
│  rail  ├──────────────────────────────────────────────┤  inspection  │
│  240   │  zone de travail 1 164 px  (plafond 1 200)    │    420 px    │
│        │  3 colonnes de 372 px                         │  (colonne)   │
└────────┴──────────────────────────────────────────────┴──────────────┘
   240   +        1164        +        420         = 1824  + 2×48 de marges = 1920
```

**1920 est le seul palier où les quatre zones pavent la largeur sans reste** — c'est ce qui
justifie le plafond de **1200 px** de la zone de travail (jeton `--maxw` du site) plutôt que
les 1320 px de `CV` : à 1920, 1320 + 420 + 240 + marges = 2028 > 1920, donc soit le panneau
passe en surimpression sur un écran qui a la place, soit la grille déborde. **1200 tient.**

Au-delà de 1920 (2048, 2560), le plafond se déclenche pour de bon : la zone de travail reste
à 1200 et **la largeur gagnée devient des marges**, jamais des colonnes. Une carte de 372 px
est la carte la plus large du système ; une carte de 500 px ne contient pas plus
d'information, elle contient la même information plus loin.

### 7.3 Les paliers

| Palier | Largeur | Rail | Zone de travail | Panneau | Colonnes | Marges |
|---|---|---|---|---|---|---|
| **A — Poste large** | **≥ 1920** | **240** libellés | 1 164 (plafond 1 200 non atteint) | **420, en colonne** | **3** × 372 | `--e-12` 48 |
| **B — Poste standard** | **1440 – 1919** | 240 | 1 152 | 420, **superposé + voile** | **3** × 368 | `--e-6` 24 |
| **C — Poste étroit** | **1280 – 1439** | 240 | 992 | 400, superposé | **3** × ≈315 | 24 |
| **D — Petit poste** | **1024 – 1279** | **56**, icônes seules | 936 | 360, superposé ; plein écran ≤ 1100 | **2** × 456 | `--e-4` 16 |
| **E — Plancher** | **768 – 1023** | **0** : barre horizontale 56 en haut | pleine largeur − 32 | **plein écran** | **2** | 16 |
| **F — Sous le plancher** | **< 768** | barre horizontale | pleine largeur − 32 | plein écran | **1** | 16 |

**La règle qui produit les colonnes, et elle est unique :**

> **Trois colonnes tant que la carte mesure au moins 300 px. Deux ensuite. Une sous 768.**
> La carte ne descend **jamais** sous 300 px, même si cela doit coûter une colonne.

*Pourquoi 300 px, et non un chiffre rond* : la carte la plus étroite porte, sur sa première
ligne, une pastille de score de 28 px, un nom en T4, un badge de score de 80 px au maximum et
trois gouttières de 8 px — soit **132 px d'objets fixes** et, après les 32 px de rembourrage,
**136 px pour le nom**, c'est-à-dire 15 caractères en DM Sans 600 16 px. C'est la largeur du
nom le plus long du fichier réel avant ellipse. **Descendre en dessous, c'est tronquer le nom
à moins de 12 caractères — et un nom tronqué à 12 caractères n'identifie plus personne.**

**Ce qui se passe exactement, palier par palier :**

- **1920** : les quatre zones pavent la largeur. C'est le seul palier où le panneau ne
  recouvre rien — et c'est le bon comportement, puisqu'il y a la place. **Le panneau ne
  s'ouvre jamais automatiquement** : il n'occupe la colonne que si l'utilisateur a ouvert
  une fiche.
- **1440** : le palier de confort minimum garanti. 1440 − 240 − 48 = **1 152 px**, trois
  colonnes de 368 px. Le panneau **superposé** est ce qui permet de parcourir 22 lignes et
  d'ouvrir une fiche sans perdre sa position.
- **1280** : dernier palier à trois colonnes. 1 280 − 240 − 48 = **992 px**, trois colonnes
  de ≈315 px. C'est serré et c'est assumé : **≈15 px de marge avant le plancher de 300.**
- **1024** : le rail perd ses libellés et passe à **56 px** (les 5 icônes, avec info-bulle
  **et** `aria-label`). 1 024 − 56 − 32 = **936 px** → **2 colonnes de 456**. Passer à trois
  donnerait 296 px, sous le plancher : **on perd une colonne plutôt que de comprimer la
  carte.** 56 px est aussi la hauteur du bandeau : le coin devient un carré de 56.
- **Sous 1024** : le rail devient une **barre horizontale de 56 px en haut**, défilante, avec
  les 5 icônes. Le panneau devient **plein écran** (il remplace la vue, avec un retour
  explicite). **Le tableau se replie en cartes `--ligne`** (§4.5).
- **Sous 768** : une colonne. L'outil reste utilisable, il n'est pas optimisé.

**Le passage 1280 → 1279 ne doit pas déplacer le contenu** : la largeur du rail est réservée
pendant la transition (200 ms), sinon la grille se recompose pendant l'animation.

### 7.4 Ce qui change de forme, jamais de largeur

**Règle 3 du système, et c'est celle qui coûte le plus cher quand on l'oublie.** Le contenu
ne se comprime pas pour tenir : **il change de forme.**

| Objet | À 1920 | À 1024 | Sous 768 |
|---|---|---|---|
| Tableau de 6 colonnes | toutes les colonnes | colonnes secondaires repliées dans le dépliage de ligne | **liste empilée** : une ligne = un bloc libellé / valeur |
| Grille de cartes | 3 colonnes | 2 colonnes | 1 colonne |
| Panneau latéral | colonne de 420 | superposition de 360 | plein écran |
| Rail | 240 avec libellés | 56 icônes + info-bulles | barre horizontale en haut |
| Rangée de puces de filtre | une ligne | une ligne, **défilante horizontalement si besoin** | `<select>` |

**Et les deux informations qui ne se replient jamais**, à aucun palier : **la barre de
tâches** (ancrée en bas, même sur un écran de 700 px) et **le compteur de quota** (dans le
bandeau). Ce sont les deux dont l'absence coûte du travail ou de l'argent.

### 7.5 Trois règles de grille non négociables

**1. Aucun débordement horizontal, à aucun palier, dans aucune vue.**
C'est ce qui coûte le plus cher aujourd'hui : **305 px de débordement** dans le bandeau de
`A`, et « Anti-ban » cassé sur 4 lignes. Vérifiable, donc tenable :
`document.documentElement.scrollWidth <= window.innerWidth` sur les 6 paliers **et dans les
5 destinations**.

**2. La zone de travail est la seule qui défile.** Rail, bandeau, panneau et barre de tâches
sont fixes. Aujourd'hui la page entière défile : ouvrir une boîte de dialogue depuis une
position de défilement basse la fait apparaître **hors du regard**.

**3. Une carte de 240 px de large est un échec, pas une adaptation.** (§7.3)

### 7.6 La largeur de lecture

Sur un poste large, **une ligne de texte de 1 164 px de large ne se lit pas** : au retour à
la ligne suivante, l'œil saute ou reprend la précédente. Toute zone de texte **rédigé** —
note de prospect, contenu de publication, message généré, texte d'aide — est plafonnée :
`--lecture: 68ch` (jeton `--reading` du site).

**La grille peut être large ; le texte à l'intérieur ne l'est pas.** C'est la distinction que
le site fait depuis le début et que le cockpit n'a jamais faite : **aucune limite de largeur
de lecture n'existe dans `A`**. La boîte de base fait `min(480px, 92vw)`, celle d'édition de
publication `min(700px, 94vw)` — environ 100 caractères par ligne — et le socle prévoit
`--lg` à 880 px, **soit 125 caractères par ligne**. Les trois sont corrigés : le conteneur
peut être large, **le bloc de texte porte la limite**.

### 7.7 Les seuils, en jetons

```css
:root{
  --rail:        240px;
  --rail-plancher: 56px;
  --bandeau:      56px;
  --inspection:  420px;
  --travail-max:1200px;   /* = --maxw du site */
  --carte-min:   300px;   /* le plancher qui produit le nombre de colonnes */
  --lecture:      68ch;   /* = --reading du site */
  --gouttiere:  var(--e-6);   /* 24 — entre colonnes */
  --marge-page: var(--e-6);   /* 24 — puis --e-12 (48) au-delà de 1920 */
}
@media (min-width:1920px){ :root{ --marge-page:var(--e-12); } }
@media (max-width:1439px){ :root{ --inspection:400px; } }
@media (max-width:1279px){ :root{ --rail:var(--rail-plancher); --inspection:360px; --marge-page:var(--e-4); } }
@media (max-width:1023px){ :root{ --rail:0px; } }
```

---

## 8. Le mouvement

### 8.1 Trois durées, deux courbes — et une durée qui n'est pas utilisée

| Jeton | Valeur | Ce qu'il fait, et rien d'autre |
|---|---|---|
| **`--t-fast`** | **150 ms** | Le **retour d'état** : survol, focus, changement de couleur d'un contrôle. C'est le seul endroit où l'œil attend une réponse |
| **`--t`** | **300 ms** | **L'entrée et la sortie d'un objet** : panneau latéral, voile, boîte de dialogue, notification, menu contextuel |
| **progression** | **320 ms**, **linéaire** | La barre de progression. **Seule durée linéaire du système** : une progression est un compteur, pas un mouvement |
| **`pulse`** | **1,2 s**, alterné | Le squelette de chargement. **La seule animation en boucle autorisée** |
| **`--t-slow`** | **600 ms** | **Non utilisée dans le dashboard.** Le site s'en sert pour les révélations au défilement ; un poste de commande n'a pas de révélation au défilement |

**Deux courbes, pas trois** : `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`) pour toutes les
entrées et sorties, et `linear` pour la progression. **`--ease-in-out` n'est pas utilisé
ici** : un objet qui apparaît décélère, il n'accélère pas au milieu. Aucun ressort, aucun
rebond, aucune courbe personnalisée.

### 8.2 Ce qui bouge

| Objet | Mouvement | Durée |
|---|---|---|
| Panneau latéral | `translateX` depuis la droite (100 % → 0) | 300 ms `--ease-out` |
| Voile de superposition | `opacity` 0 → 1 | 300 ms |
| Boîte de dialogue | `opacity` 0 → 1 + `translateY` 8 px → 0 | 300 ms |
| Notification | `translateY` 8 px → 0 + `opacity` | 300 ms |
| Menu contextuel | `opacity` + `translateY` 4 px | 300 ms |
| Squelette | `opacity` 1 → 0,45 → 1 | 1,2 s, en boucle |
| Barre de progression | `width` | 320 ms linéaire |
| Indicateur d'activité | Le point de la barre de tâches pulse **tant que la tâche court** | 1,2 s — **il porte un état, il n'est pas décoratif** |

**Deux transparences, et c'est tout** : le bandeau collant et le voile. `backdrop-filter`
n'existe nulle part ailleurs.

### 8.3 Ce qui ne bouge jamais

**C'est la moitié la plus importante de cette section, et c'est celle qu'on ne trouve dans
aucun design system.**

| Interdit | Pourquoi |
|---|---|
| **Les chiffres ne comptent pas.** Aucun compteur animé, aucun `count-up`, aucun défilement de chiffres | Le chiffre est la seule information de l'écran. Une animation de 600 ms le **retarde** de 600 ms, vingt fois par jour. Et un chiffre qui défile est un chiffre qu'on ne peut pas lire à mi-parcours |
| **Les données n'animent pas à l'arrivée.** Aucune barre qui pousse, aucune ligne de tableau qui apparaît en décalé, aucun graphique qui se dessine | Le décalage en cascade est une politesse de site vitrine. Ici, il fait attendre pour voir un chiffre qui est **déjà arrivé** |
| **Les cartes ne se soulèvent pas au survol.** Pas de `translateY`, pas d'ombre, pas d'échelle | Un élément qui bouge au survol déplace la grille pour rien, et le survol n'est pas une intention. **Seule la couleur de bordure change** |
| **Aucune largeur ne change au survol ni au chargement.** Un bouton garde sa largeur quand son libellé passe à « Envoi… » | Un contrôle qui change de largeur au moment du clic déplace le curseur hors de la cible |
| **Le rail et le bandeau ne bougent jamais** | Ce sont les deux repères fixes : si l'un se déplace, l'utilisateur ne sait plus où il est |
| **Aucune transition entre deux destinations.** Le changement de vue est instantané | L'utilisateur change de destination des dizaines de fois par jour. Une transition de 300 ms est un péage |
| **Aucun dégradé animé, aucun fond qui respire, aucun halo qui tourne** | C'est exactement les 3 dégradés radiaux de `C` : refusés (engagement 1) |
| **Aucun `scroll-behavior: smooth`** | Le défilement doux est un mouvement qu'on subit, et il casse les ancres |
| **Aucun curseur personnalisé, aucun `cursor: wait` global** | Le curseur appartient au système d'exploitation |

**Le test** : `grep -c '@keyframes'` doit renvoyer **1** — `pulse`. Tout `@keyframes`
supplémentaire doit être justifié comme porteur d'un état, et il n'y en a pas d'autre.

### 8.4 `prefers-reduced-motion`

**Le principe : on ne supprime pas l'information, on supprime le trajet.**

```css
@media (prefers-reduced-motion: reduce){
  *, *::before, *::after{
    animation-duration: 1ms !important;      /* jamais 0 */
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .squelette{ animation: none; background: var(--card2); }
  .progression .remplissage{ transition: none; }   /* la largeur change instantanément : c'est un indicateur */
}
```

**Pourquoi 1 ms et non 0.** Une transition de durée nulle **ne déclenche pas
`transitionend`** : le JavaScript qui écoute la fin d'une transition ne s'exécute jamais, et
le panneau ne se ferme pas. C'est une règle écrite dans `NOYAU-2:340-345` et reprise par
`SITE:1440-1444`.

**Ce que `prefers-reduced-motion` ne fait pas :**
- Il ne remplace **jamais** un squelette par un vide : le squelette devient un bloc
  `--card2` **fixe**, et **le mot « Chargement… » reste** — c'est le mot qui informe, pas
  l'animation.
- Il ne supprime **jamais** l'indicateur d'activité d'une tâche en cours : le point cesse de
  pulser, **il reste affiché** avec la durée écoulée. Une tâche en cours sans indicateur est
  une attente aveugle.
- Il ne bloque **jamais** l'ouverture d'un panneau : il la rend instantanée.

---

## 9. Les cinq contrôles automatiques

Le projet a une culture de contrôle (`eperf_core/validateurs/wcag.py`, `slop.py`,
`budget.py`) et deux de ses défauts sont passés parce qu'**aucun contrôle n'était branché
dessus** : les 7 `@font-face` en 404, et le socle de composants utilisé 0 fois. Cinq
contrôles, donc, et chacun attrape un défaut déjà survenu.

| # | Contrôle | Méthode | Attrape |
|---|---|---|---|
| **1** | **Zéro hexadécimal hors `:root`** | retirer le bloc `:root` par équilibrage d'accolades, puis `grep -n '#[0-9a-fA-F]\{3,8\}'` sur le reste → **0** | Les 21 valeurs hors `:root` de `A` (dont `#08080c` dans `.btn2--primaire`) |
| **2** | **Zéro pictogramme, des deux côtés** | `grep -P '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]'` sur les fichiers d'interface **et sur les corps de réponse JSON** → **0** | Les 4 fichiers de §6.1, et surtout `/api/ia/status` qui renvoie `"✅ Opérationnel"` |
| **3** | **Les 12 paires de contraste × 4 surfaces** | reprendre `eperf_core/validateurs/wcag.py` **et le brancher sur le CSS du dashboard** — il lit aujourd'hui `eperf_core/assets/css/`, pas le fichier servi. **Le branchement suppose que `jetons.py:32` (`DOSSIER_CSS`) devienne un paramètre** : c'est une tâche du NOYAU, pas une phrase à écrire (`AVIS-NOYAU §4.3`, `P7`) | Les trois valeurs fausses de §2.3, et toute teinte ajoutée sans mesure |
| **3 bis** | **L'empreinte N1 — 12 paires `(nom, valeur résolue)`** | `sys.path` sur `agent-ia-web` ; `eperf_core.jetons.theme_effectif(theme)` ; `hex_litteral`, `lower()`, tri, `sha256[:16]` → **`b89dcba06940079e` (sombre)**, **`e6d40d572271fc7d` (clair)**. **Jamais un `md5` de fichier** ; **échec si la source est injoignable** (C12 du site, mot pour mot) | Un `md5` casse sur un commentaire, ne voit pas le thème, et laisse passer une valeur qui change **sous** un alias — les deux classes de défaut qui se sont réellement produites (`--gold2` sombre, `--erreur` clair) |
| **4** | **Les 12 `woff2` servis en 200 par le dashboard** + le test de chasse tabulaire d'Outfit | `curl -o /dev/null -w '%{http_code}'` sur chacun des 12 fichiers depuis l'URL du dashboard → **12 × 200** ; puis mesure au canvas de `"1111"` et `"0000"` en Outfit 700 32 px → largeurs égales | Les **7 `@font-face` en 404, introduits par le commit `8389309` du 19/09 03:25** — une régression de la refonte, pas un défaut de plusieurs semaines : avant ce commit le cockpit tournait en police système **par construction** (0 `@font-face`, 0 requête, 0 erreur en douze jours) |
| **5** | **Aucun débordement horizontal** | `document.documentElement.scrollWidth <= window.innerWidth` sur 6 paliers × 5 destinations = **30 mesures** | Les 305 px de débordement du bandeau de `A` |

**Un sixième contrôle, non bloquant mais utile** : le **compteur d'usage du socle**. `M5`
§3.3 mesure un taux d'utilisation atteignable de **0 %** pour 9 classes sur 9. Un contrôle
qui compte les occurrences de `.btn2`, `.carte2`, `.champ2`, `.tableau2`, `.badge2`, `.vide2`,
`.squelette2`, `.progression2` **hors de leur déclaration CSS et de la fabrique `UI()`** doit
être croissant. Un socle écrit et non branché est le défaut structurel de ce projet.

**Le script du contrôle 3 bis, à porter tel quel** (`AVIS-NOYAU §2.2`, `P2`) :

```python
import hashlib, sys
sys.path.insert(0, "/home/ballo/OX6A/agent-ia-web")
from eperf_core import jetons

N1 = ("--bg", "--bg2", "--card", "--card2", "--text", "--soft", "--muted",
      "--gold", "--gold2", "--border-strong", "--wa", "--erreur")

def empreinte(theme):
    effectif = jetons.theme_effectif(theme=theme)
    paires = sorted(f"{n}={str(jetons.hex_litteral(effectif[n]) or effectif[n]).lower()}"
                    for n in N1)
    return hashlib.sha256("\n".join(paires).encode()).hexdigest()[:16]

print(empreinte("sombre"), empreinte("clair"))   # b89dcba06940079e e6d40d572271fc7d
```

**La copie est GÉNÉRÉE, pas écrite à la main.** Un script lit la source par
`eperf_core.jetons` et émet le bloc `:root` ; `verifier.py` compare l'empreinte
du fichier émis à celle de la source. C'est la seule forme qui ne rejoue pas le
scénario des quatre copies existantes (`AVIS-NOYAU P3`).

---

## 10. Ordre d'implémentation

1. **Les polices, avant tout le reste.** Les 12 `woff2` servis en 200, `Outfit` embarquée
   (3 fichiers), les 3 piles de repli correctes, le test de chasse tabulaire. **Reprendre le
   fichier sans corriger cela graverait un rendu typographique faux dans le dashboard
   unifié** (`M5` §7.3, réserve 1). Ce n'est **pas** la réparation d'un défaut ancien : les
   7 `@font-face` sont une **régression du commit `8389309` du 19/09 03:25** (correction H).
2. **Les jetons** (§2.2), sombre seul, plus les 2 nouveaux dans `eperf.css` — **et les 3
   jetons verts non déclarés** dans le dashboard.
3. **Les emojis, des deux côtés** (§6) : les 351 pictogrammes de `A` (dont 43 `⏳`), les 89 de
   `S` dont ceux des réponses JSON, les 65 de `B`, les 34 de `C`. Le contrat d'API change **en même
   temps** que le HTML (`M5` §7.3, réserve 2).
4. **L'anneau de focus global** (§2.5) : une déclaration, les 198 éléments interactifs
   corrigés.
5. **Le rail, le bandeau et la barre de tâches** (§5.11, §5.12, §5.21) — c'est ce qui
   supprime le débordement de 305 px et rend le socle de navigation réel.
6. **Les 23 composants** (§5) — le socle existe déjà pour 9 d'entre eux : **c'est un delta
   et un branchement, pas une réécriture** (`M5` §7.3).
7. **Les icônes** (§6.5) : 47 lignes, dont 8 nouvelles, une seule fois, dans un objet `UI.icone()`.
8. **Les 5 destinations**, une par session, composées depuis le socle.

**Ce que ce document ne tranche pas**, parce que ce n'est pas son périmètre : le sort des
routes Flask, la persistance côté serveur des brouillons et des filtres, le découpage du
fichier unique, et le remplacement de la bibliothèque de graphiques par du SVG (tranché en
principe en §4.4, à faire en pratique). Ces questions sont posées dans `M5` §7 et dans
`ARCHITECTURE-ECRANS.md`, et aucune n'est résolue par un système visuel.

---
**Système visuel du Dashboard unifié ePerformance — 19 septembre 2026**
**Périmètre** : direction, couleur, typographie, données, composants, icônes, grille, mouvement
**Repris de** `docs/refonte-cockpit/SYSTEME-VISUEL.md` (ratifié), **corrigé** en 13 points (§0.2)
**Contrat respecté** : C3 (aucun jeton gelé renommé), zéro emoji, zéro hexadécimal en dur, WCAG AA
**Thème** : sombre seul, exception assumée et documentée (§3.6)

---

## Errata du 19 septembre 2026

Consolidation des trois revues indépendantes et des corrections du superviseur.
**Aucun texte d'origine n'a été effacé** ; les phrases réfutées sont citées puis
rectifiées. Trois corrections touchent ce document.

| # | Ce qui a changé | Pourquoi (mesure) |
|---|---|---|
| **C** | `--gold2:#e2c07a` en `§2.2` est **confirmé**, et devient la valeur **gelée** : c'est le noyau qui se corrige (`10-primitives.css:90`, `#cfb583` → `#e2c07a`), par une entrée `⚠️ CONTRAT`. Le nombre de polices reste **12** (`§3.4`). | Cinq emplacements sur six portent déjà `#e2c07a` (site, blog, widget, cockpit, canon écrit) ; le coût est asymétrique — 1 ligne contre 4 fichiers. Le document avait raison **avant** l'arbitrage (`AVIS-NOYAU §2.3`, `P1`). |
| **D** | La table des **sources mesurées** gagne la ligne `NOYAU` et corrige deux entrées : `SITE` n'est plus « les jetons canoniques » mais **un dérivé conforme** (11/12 en sombre) ; `DSU` n'est plus « la source de vérité » mais **un document de description**, et son chemin cité (`design-system/DESIGN-SYSTEM-UNIFIE.md`) **n'existe pas** — le fichier réel est `/home/ballo/OX6A/DESIGN-SYSTEM-UNIFIE.md`, hors de tout dépôt. `§2.2` gagne le paragraphe de la source canonique et des empreintes ; `§9` gagne le **contrôle 3 bis** (12 paires résolues, `b89dcba06940079e` sombre / `e6d40d572271fc7d` clair, jamais un `md5`, échec si source injoignable) et le contrôle 3 note que le branchement de `wcag.py` est une tâche du NOYAU (`DOSSIER_CSS` paramétrable). | Les documents désignaient **trois sources canoniques différentes** pour le même objet, et l'une des douze valeurs divergeait réellement (`AVIS-NOYAU §2.2`, `§4.1`, `P2`, `P3`, `P7`). **Aucun jeton n'est renommé ici** : l'arbitrage du vocabulaire (`--police-texte`, `--police-chiffres`, `--police-technique`, `--t0`…`--t8`) appartient au NOYAU et passe par `⚠️ CONTRAT`. |
| **H** | `§0.2` et `§9` (contrôle 4) ne disent plus « depuis des semaines ». Le fait mesuré est **« le cockpit tourne en police système »** ; la cause est **une régression du commit `8389309` du 19/09 03:25**, qui a introduit les 7 `@font-face` et les **62 seuls 404 de l'historique** ; la correction est inchangée. Même rectification en `§10`, point 1. | Avant ce commit, `cockpit.html` n'avait **aucun** `@font-face` : 0 requête, 0 erreur en douze jours, police système **par construction** — il n'y avait rien à signaler, et la phrase « depuis des semaines, sans que rien ne le signale » décrivait un état qui n'a jamais produit d'erreur (`CONTRE-EXPERTISE §G0`). |

