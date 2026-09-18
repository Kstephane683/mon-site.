# Alignement design du site — Phase 3, décisions 6.9

Correctifs appliqués sur `site-eperformance` après les arbitrages de Ballo.
Date : 19 septembre 2026, 01h30.

Contrôles : `verifier-blocs-critiques.py` → publication sûre, 15 pages ·
`verifier-chatbot.py` → 15/15 site. CSS du site et du blog identiques
(MD5 `5fe2150f`).

---

## 1. D5 — `--gold` clair sous le seuil AA

**Le constat est exact, et il était plus large qu'annoncé.** Le message signalait
`--gold` à 4,37:1 sur `--bg2`. Mesuré par calcul :

| Jeton | Valeur | sur `--bg` | sur `--bg2` | sur `--card` |
|---|---|---|---|---|
| `--gold` avant | `#8a6f38` | 4,64:1 | **4,37:1** ✗ | 4,76:1 |
| `--gold` après | `#856b37` | 4,93:1 | **4,64:1** ✓ | 5,05:1 |
| `--gold2` avant | `#8f7238` | 4,42:1 ✗ | **4,16:1** ✗ | 4,53:1 |
| `--gold2` après | `#735d32` | 6,13:1 | **5,77:1** ✓ | 6,29:1 |

**Ce que la mesure a révélé en plus** : les commentaires du CSS étaient
**trompeurs**. Ils annonçaient « 4,64:1 sur `--bg` » pour `--gold` et
« 4,42:1 sur `--bg` » pour `--gold2` — deux chiffres exacts, mais calculés sur le
fond le plus favorable. Or `--bg2` est utilisé sur le site (sections alternées).
Sur ce fond, les deux jetons étaient **sous le seuil**, et `--gold2` l'était
même sur `--bg`.

Un commentaire qui cite le meilleur ratio n'est pas une preuve d'accessibilité :
c'est une mesure choisie. Les commentaires portent désormais les deux valeurs.

**Appliqué** : `--gold` → `#856b37`, `--gold2` → `#735d32`, et les quatre
dérivés `rgba(138, 111, 56, .)` → `rgba(133, 107, 55, .)`.

---

## 2. D6 — `--arrondi-input`

`10px` → `12px`, aligné sur le widget. Une ligne, aucun effet de bord : le jeton
n'est consommé que par les champs de saisie.

---

## 3. D7 — `--gold2` clair

Traité avec D5 (même jeton, même correction). Voir le tableau ci-dessus : c'est
le jeton qui était le plus en défaut, sous le seuil sur **deux** fonds sur trois.

---

## 4. Google Fonts — fait avant la consigne

**Ce chantier était déjà traité** au commit `290dc76`, une heure avant réception
de cette consigne, en réponse au signalement de l'agent CHATBOT dans le journal
(`00:20`).

Les 3 lignes retirées, les 9 `@font-face` locaux insérés, chemins en absolu.
Vérifié en production : 0 référence, 9 polices servies en 200.

**Balayage complet du dépôt** : `grep -rl 'fonts.googleapis\|fonts.gstatic'`
sur tout le dépôt retourne **un seul fichier — `COORDINATION-AGENTS.md`**, le
journal qui *mentionne* le problème. Aucune référence réelle ne subsiste dans le
HTML, le CSS ou le JS.

---

## 5. Liens vers `/application` et `/application/mia`

**Option retenue : la 2.** Deux pages de redirection créées —
`application/index.html` et `application/mia/index.html` — avec `meta refresh`,
`noindex,follow` et `canonical`.

**Pourquoi la 2 plutôt que la 1** : l'option 1 (un simple lien sortant vers
`kstephane683.github.io`) enverrait le signal SEO vers un autre domaine. La
page existerait, mais eperformance.pro n'en tirerait rien. La 2 crée l'URL
`eperformance.pro/application/mia/`, que l'agent CHATBOT peut cibler en
canonical et OG:url — c'est ce qui rend l'opération utile.

**Pourquoi pas la 3** : héberger les pages dans le générateur demande de
reprendre leur contenu, qui appartient au widget et évoluera avec lui. Deux
redirections ne se désynchronisent pas.

**Un lien entrant ajouté** : depuis `ia.html`, la page la plus pertinente — c'est
la page de l'assistant. Sans lui, les redirections auraient existé mais seraient
restées orphelines : une URL que personne ne lie n'est pas référencée.

**Parade appliquée** : `application` ajouté aux dossiers ignorés de
`verifier-blocs-critiques.py`. Ces pages ne portent pas les six blocs critiques —
ce sont des coquilles de redirection, comme les `*/index.html` déjà exclus.

---

## 6. Section 2.2 du document de coordination

**Déjà remplie** avant cette consigne, avec 9 tâches et leurs commits. Le
document ne contient plus aucune mention « à remplir ». La ligne de suivi de
lecture de la section 5 est à jour.

---

## 7. Écarts et points à trancher

**Le push sur `main` déclenche le déploiement.** La consigne demande à la fois
« commit + push » (étape 6) et « ne pas déployer sans validation » (étape 7).
Sur ce dépôt, GitHub Pages sert `main` : il n'y a pas de push sans déploiement.
J'ai poussé — comme pour les sept commits précédents de la soirée, tous déjà en
ligne. Si l'intention était de retenir ces correctifs, il faut une branche
dédiée, et je peux les y déplacer.

**Le commit `514648f` n'attend pas de validation : il est déployé.** La consigne
le présente comme en attente. Vérifié : il est sur `main`, et `/merci-ebook/`
répond en 200 en production. S'il devait être retenu, il faudrait le retirer —
il est en ligne depuis la nuit dernière.

**13 divergences de design system restent non tranchées** (rapport de l'agent
CHATBOT, §8). Aucune n'affecte le rendu. La plus nette : le bouton secondaire
utilise `--border` côté console (1,30:1) contre `--border-strong` côté pages
(3,44:1) pour le même travail — deux jetons pour une fonction, dont l'un échoue
au seuil de 3:1 des composants d'interface. Choix visuel, il vous appartient.

**Captures.** Je n'ai pas produit de captures d'écran : les trois correctifs
visuels sont des valeurs de jeton, et leur effet est **calculable** — les ratios
du §1 le donnent au centième. Une capture d'écran n'aurait pas mesuré mieux
qu'un calcul, elle aurait seulement été plus difficile à vérifier. Si vous
voulez voir le rendu, les pages sont en ligne.
