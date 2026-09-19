# Cockpit — audit et stratégie de refonte

Audit du 19 septembre 2026. Fichier : `toolkit_eperformance/cockpit.html`,
2 289 lignes, 126 Ko. Le seul endroit où le propriétaire pilote la production.

**Ce document constate et propose. Rien n'est implémenté au-delà de
l'alignement des jetons (commit `8389309`).**

---

## 1. Ce qu'est réellement le cockpit

L'alignement des couleurs que je viens de faire traitait le symptôme. L'audit
montre autre chose.

| Mesure | Valeur | Ce que ça dit |
|---|---|---|
| HTML statique | 33 Ko | 15 % du fichier |
| **CSS** | **13,5 Ko, 160 lignes** | minuscule — il ne décrit presque rien |
| **JavaScript** | **82 Ko** | 64 % du fichier |
| Fonctions JS | 84 | une application, pas une page |
| Appels `fetch` | 56 vers **50 routes** | 12 domaines d'API |
| Templates HTML dans le JS | **110** | l'interface est **générée**, pas écrite |
| `innerHTML` | 101 | injection de HTML par chaînes |
| `classList` | 22 | presque aucun état géré par classe |

**Conclusion : le cockpit est une SPA, pas une page.** Le HTML statique ne
contient presque rien — un seul `.panel`, aucun `form`, `input`, `select` ni
`table`. **Tout est construit en JavaScript**, dans 110 chaînes de template
littéral.

**Conséquence directe sur la stratégie** : refondre « la feuille de style »
n'a presque aucun effet. Le CSS ne décrit que 160 lignes. **C'est le JS qu'il
faut refondre** — 110 templates, un par bloc d'interface.

---

## 2. Les 12 écrans

Le cockpit s'organise en panneaux ouverts par des fonctions `open*` :

| Écran | Fonction | Domaine d'API |
|---|---|---|
| Publications | `openPubs` | `publications` (10 routes) |
| Actions rapides | `openQuickActions` | `quick` (5) |
| Réglages | `openSettings` | `settings` (4) |
| Configuration | `openProviderConfig` | `config` (3) |
| Design | `openDesign` | `design` (3) |
| Statut IA | `openIAStatus` | `ia` (3) |
| Scraping | `openScraper` | `scrape` (3) |
| Génération de message | `openMsgGen` | `generate-msg` |
| Analyse concurrent | `openCompetitor` | `analyze-competitor` |
| Qualification | `openQualify` | `qualify` |
| Ajout | `openAdd` | `add` |
| Compétences | `openSkillsPanel` | — |

**78 boutons** dans le fichier, **15 modales**. Aucun système d'onglets
(`data-tab` : 0) : la navigation est entièrement pilotée par JS.

---

## 3. Les défauts, par ordre de gravité

### 3.1 Aucun composant — c'est le défaut central

Il n'y a pas de « bouton » au sens du design system. Il y a **78 boutons**
répétés dans 110 templates, chacun avec ses classes écrites à la main. Il n'y a
pas de carte, pas de champ, pas de tableau réutilisable — 1 seul `.card` dans
tout le fichier.

**C'est la cause de tout le reste** : 336 couleurs littérales, un fond à
`#0A0B0F`, des tailles incohérentes. Quand chaque bloc réécrit son style, il
dérive. Le site et le blog n'ont pas ce problème parce qu'ils composent des
fragments avec des classes nommées.

### 3.2 Des emojis dans l'interface

`✏️ Modifier`, `🩺 Doctor — diagnostic système`. La règle du projet est
**zéro emoji dans l'interface**. Ce sont des titres, donc visibles.

### 3.3 Aucun thème, aucune structure de jetons

`:root` : 1 (le mien, d'hier). `data-theme` : 0. Le cockpit vit en sombre —
c'est un choix défendable pour un outil interne, mais il ne peut pas suivre le
thème du site, et il ne partage aucune valeur.

### 3.4 101 `innerHTML` et 110 templates en chaînes

Chaque bloc d'interface est une chaîne de caractères. Conséquences :
- Pas d'autocomplétion, pas de vérification, pas d'erreur à la compilation
- Une faute de frappe dans une classe ne se voit qu'à l'écran
- Impossible de tester un composant isolément
- 22 `classList` seulement : les états (actif, chargement, erreur) sont
  probablement gérés par duplication de chaînes

### 3.5 28 couleurs littérales restantes

Après mon alignement : 21 variantes rares, 28 occurrences — ors dérivés et
couleurs de statut. À trancher au cas par cas.

---

## 4. Stratégie de refonte

### Le principe

**Extraire des composants, pas retoucher des styles.** Le cockpit n'a pas un
problème de charte — il a un problème d'architecture d'interface. La charte est
réglée depuis `8389309`. Ce qui reste, c'est de remplacer 110 chaînes par un
petit nombre de fonctions qui produisent du balisage nommé.

C'est exactement ce que le site a fait avec `compose.py` : sept en-têtes
différents sont devenus un seul, appelé partout.

### Phase A — le socle (le plus rentable)

**Extraire 8 composants** et les écrire une fois :

| Composant | Remplace |
|---|---|
| `btn(texte, {variante, taille, icone})` | 78 boutons réécrits à la main |
| `carte({titre, contenu, actions})` | 1 `.card` + les blocs qui l'imitent |
| `champ({label, type, valeur})` | les inputs inline |
| `tableau({colonnes, lignes})` | les listes — le cockpit en affiche partout |
| `modale({titre, contenu, actions})` | 15 modales |
| `badge(texte, {etat})` | les statuts |
| `etat_vide({titre, action})` | les écrans sans données |
| `chargement()` | les états d'attente |

**Livrable** : un objet `UI` de ~200 lignes, plus les classes CSS
correspondantes dans le bloc `:root` que j'ai posé.

**Bénéfice mesurable** : les 336 couleurs littérales ne peuvent pas revenir —
un composant porte ses jetons. Et une correction de style s'applique aux 12
écrans d'un coup.

### Phase B — les écrans, un par un

Réécrire les 12 `open*` pour qu'ils composent depuis `UI` au lieu d'assembler
des chaînes. **Un écran par session**, chacun vérifié isolément.

Ordre proposé, par valeur d'usage :
1. `openPubs` — 10 routes, le cœur du travail quotidien
2. `openQuickActions` — 5 routes, l'entrée la plus fréquente
3. `openSettings` — 4 routes
4. les 9 autres

### Phase C — les emojis et les détails

Retirer les emojis des titres, remplacer par les icônes SVG du système
« Instrumentation » — 26 SVG existent déjà côté site, avec 7 primitives et
5 règles.

### Ce qui ne bouge pas

**Les 50 routes et la logique Flask.** La refonte est de surface, comme la
demande l'impose. Aucun endpoint ne change de contrat.

---

## 5. Ce qu'il faut décider

**1. Le cockpit suit-il le thème clair/sombre du site ?**
Il vit en sombre aujourd'hui. Un outil de pilotage consulté le jour gagnerait
peut-être au clair. C'est un choix d'usage, pas technique.

**2. Une seule page ou douze ?**
Les 12 panneaux s'ouvrent dans une page unique. Sur 12 écrans et 50 routes,
une navigation par onglets ou par URL serait plus lisible — et permettrait de
revenir en arrière. Mais c'est une refonte de structure, pas de surface.

**3. Le cockpit reste-t-il un fichier unique ?**
126 Ko dans un seul fichier HTML. Extraire le JS et le CSS dans
`assets/` le rapprocherait du site et rendrait le travail possible à plusieurs.
Mais il doit tourner hors ligne : un fichier unique est plus simple à déplacer.

**4. Qui fait quoi.**
L'agent SOCIAL a proposé de le faire lui-même en consommant mes jetons. Ma
recommandation : **je fais la phase A** (le socle de composants — c'est du
design system, mon périmètre), **et lui fait la phase B** (les 12 écrans,
mécanique une fois le socle posé). Cela sépare la décision de design du travail
répétitif.

---

## 6. Estimation honnête

**Phase A** : une session. ~200 lignes de JS + les classes CSS. C'est le
travail à plus fort rendement — sans lui, chaque écran réécrit ses styles.

**Phase B** : une session par écran, soit ~12 sessions. Mécanique et
vérifiable, mais volumineux.

**Phase C** : une demi-session, une fois B fait.

**Ce que je ne recommande pas** : tout faire d'un coup. 110 templates réécrits
en une passe, sans vérification intermédiaire, sur un outil qui pilote la
production — c'est le scénario qui produit un cockpit cassé dont personne ne
sait quelle moitié fonctionne.

**Ce que je recommande en premier** : la phase A seule, puis vérifier sur les
deux écrans les plus utilisés (`openPubs`, `openQuickActions`) que le socle
tient. Si oui, le reste est mécanique.
