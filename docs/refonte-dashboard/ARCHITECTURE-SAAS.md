# Architecture SaaS — refonte du dashboard ePerformance

**Document d'architecture cible.** Version 1.0 — 19 septembre 2026.
**Autorité :** ce document tranche. Il ne pose aucune question ouverte et ne
contient aucun « à définir ». Les dix décisions D1 à D10 sont prises ; ce
document les applique et les rend exécutables.

**Portée :** le dashboard local unifié, ses services, sa persistance, ses
routes et son plan de construction. Hors portée : le site public, le blog
public, l'API PHP déployée chez LWS (traitée comme un système distant
souverain, jamais comme un composant à réécrire).

**Sources lues pour produire ce document :**

| Source | Ce qui en a été tiré |
|---|---|
| `docs/refonte-dashboard/AUDIT-M1-ACQUISITION.md` | chaînes concurrentes, modèle de données prospect, sort des briques |
| `docs/refonte-dashboard/AUDIT-M2-PRODUCTION-TEXTE.md` | chaîne de génération, personas, skills, qualité du corpus |
| `docs/refonte-dashboard/AUDIT-M3-PRODUCTION-VISUELLE.md` | deux chaînes d'image, contrôle qualité, temps mesurés |
| `docs/refonte-dashboard/AUDIT-M4-PUBLICATION-VEILLE.md` | cycle de vie, trois registres, collision d'identifiants, veille |
| `docs/refonte-dashboard/AUDIT-M5-SOCLE.md` | trois dashboards, recouvrement des routes, secrets, polices, lanceurs |
| `docs/refonte-cockpit/CONCEPTION.md` | cinq moments, cinq destinations, principes de parcours |
| `docs/refonte-cockpit/ARCHITECTURE-ECRANS.md` | sort des 15 modales, file du jour, clavier, contrats serveur manquants |
| `toolkit_eperformance/prospect_app.py` | les 75 routes, lues une par une et classées |
| `toolkit_eperformance/etat_cockpit.py` | le module de persistance conservé |
| `agent-ia-web/dashboard_app.py` | les 14 routes mortes, leur recouvrement nul |

---

## 0. Les dix décisions qui commandent tout

| # | Décision | Ce qu'elle ferme |
|---|---|---|
| **D1** | Flask 3.1 + Jinja2 rendu serveur + htmx 2.0.4 vendorisé + waitress 3.0.2 + SQLite WAL, Python 3.12. Aucun Node, aucun bundler, aucun CDN. | la question « SPA ou serveur » |
| **D2** | La base de départ est `toolkit_eperformance/cockpit.html` : sa couche de jetons et sa couverture fonctionnelle survivent, sa couche de rendu meurt. | la question « quel dashboard garder » |
| **D3** | Trois magasins, trois cycles de vie : métier en SQLite, exécution en JSON, publication au serveur. | la question « qui est la source de vérité » |
| **D4** | `PUB-%04d` immuable, alloué par une séquence persistante monotone **amorcée au-dessus du parc connu (`max(local, serveur, tombstones) + 1`)**, jamais réattribué, tombstone à la suppression. **Statut : REFUSÉE dans sa rédaction initiale, reformulée** — le validateur CHATBOT a revérifié `allouer()` et `migration_002()` : séquence à `0` et cache serveur vide produisaient **0 réparation et 0 événement**. Les corrections 1 à 3 du superviseur sont intégrées en §2.8 et l'étape 2 est re-séquencée (§6). | la réapparition de D1 de `AUDIT-M4 §1.4` |
| **D5** | Un seul objet publication, un propriétaire par champ, une provenance affichée, une machine à états à cinq valeurs. | les trois registres de `AUDIT-M4 §1.3` |
| **D6** | Toute opération de plus de deux secondes est une tâche serveur nommée, suivie, annulable, reprenable, purgée. | le toast de 4,2 s et le `fetch` bloquant |
| **D7** | `etat_cockpit.py` est gardé et complété, pas réécrit. | la tentation de recommencer la persistance |
| **D8** | Un seul fichier de secrets, `~/.config/eperformance/secrets.env`, `0600`, hors dépôt ; l'interface ne reçoit que des métadonnées. | les 11 jetons en clair dans le code |
| **D9** | Aucun état normal par défaut. La santé est calculée et affichée avec ses raisons. | le cas `#132001` de `AUDIT-M1 §4.1 F3` |
| **D10** | Une seule chaîne visuelle (`social_templates/`), une seule chaîne de contrôle éditorial, branchée sur un bouton. | les deux chaînes d'image et la chaîne éditoriale sans bouton |

### 0.1 Contraintes non négociables

Ces huit contraintes valent pour **tout** le document, tout le code produit et
tout écran livré. Elles ne sont pas des préférences : un contrôle automatique
échoue si l'une est violée (§1.7).

**1. Jetons N1 gelés.** **Douze** valeurs sont écrites une seule fois, dans
`statique/css/eperf-cockpit.css`, dans le bloc `:root`, et **nulle part
ailleurs**. La liste est celle de `SYSTEME-VISUEL-SAAS.md §2.2` (contrat C3),
et elle est **complète** : le chiffre « six » des versions antérieures de ce
document était faux (correction 4 du superviseur, `SUPERVISION §4.1`).

| Jeton | Valeur | Rôle |
|---|---|---|
| `--bg` | `#08080c` | le vide sur lequel les cartes sont posées |
| `--bg2` | `#0c0c10` | le fond des surfaces basses (repli, désactivé) |
| `--card` | `#101014` | la surface de carte |
| `--card2` | `#14141a` | la surface de carte appuyée (en-tête, ligne alternée) |
| `--text` | `#edeae3` | le texte |
| `--soft` | `#b0aaa0` | le texte secondaire |
| `--muted` | `#8b8b96` | l'étiquette, la légende, l'unité |
| `--gold` | `#c9a96e` | l'accent : « ici tu agis », « voilà l'état actuel » |
| `--gold2` | `#e2c07a` | l'accent appuyé (survol, actif) — **`#e2c07a`, jamais `#cfb583`** |
| `--border-strong` | `#646470` | la bordure de contrôle : elle délimite, elle se voit |
| `--wa` | `#25D366` | le vert WhatsApp, réservé à WhatsApp |
| `--erreur` | `#e07070` | l'erreur |

Les douze se résolvent **par paires `(nom, valeur résolue)`** depuis la source
canonique du NOYAU : `agent-ia-web/eperf_core/assets/css/` (cinq couches) lue
par `agent-ia-web/eperf_core/jetons.py`. Le contrôle n'est **pas** un `md5` de
fichier ; il est décrit en §1.7 (contrôle `C2`).

**2. Aucune valeur hexadécimale en dur dans le CSS.** Toute couleur consommée
passe par `var(--…)`. Une règle qui a besoin d'une couleur qui n'existe pas
déclare un jeton, dans `:root`, avec un commentaire qui dit d'où vient la
valeur. Le contrôle `C2` (§1.7) refuse le fichier sinon. État initial mesuré :
`AUDIT-M5 §6.2` — 21 hex hors `:root` dans `cockpit.html`, 62 `rgba()`.

**3. Polices auto-hébergées, zéro CDN de police.** Trois familles, **12
fichiers** au total (le « 14 » des versions antérieures de ce document était un
reliquat : correction 11 du superviseur) :

| Famille | Usage | Fichiers | État |
|---|---|---|---|
| Cormorant Garamond | titres | 5 `.woff2` | présents, `site-eperformance/assets/fonts/` |
| DM Sans | texte | 4 `.woff2` | présents, même dossier |
| **Outfit** | chiffres (KPI, scores, compteurs) | **3 à produire** (400 / 700 / 900) | **n'existe pas sur le disque** (`AUDIT-M5 §6.4`) |

5 + 4 + 3 = **12 `.woff2`**, et c'est le chiffre qui compte : `C4` contrôle la
**liste nommée** des 12 fichiers, pas un nombre (`SYSTEME-VISUEL-SAAS.md §3.4`).

Outfit est sous SIL OFL : elle doit être **téléchargée une fois, convertie en
`.woff2` et sous-ensemblée sur le latin**, puis versionnée dans
`statique/polices/` de la même façon que les neuf autres. Les quatre règles qui
l'invoquent aujourd'hui sans pile de repli (`cockpit.html:24, 43, 50, 61`) sont
reprises, et un contrôle échoue si le fichier est absent. Les trois familles ont
une pile de repli complète : `'Cormorant Garamond','Cormorant Fallback',Georgia,serif`,
`'DM Sans','DM Sans Fallback',system-ui,sans-serif`,
`'Outfit','Outfit Fallback',system-ui,sans-serif`.

**4. Zéro emoji.** Aucune séquence pictographique dans les gabarits, le CSS, le
JS, **ni dans les réponses de l'API**. `AUDIT-M5 §6.3` a mesuré 315 séquences
dans `cockpit.html` et 129 dans `prospect_app.py`, et le point décisif est que
les emojis **traversent l'API** (`/api/ia/status` renvoie un statut préfixé d'une
séquence pictographique, `"… Opérationnel"`).
Le nettoyage porte donc sur les deux côtés. Le contrôle `C3` grep les deux
dossiers et les deux fichiers Python.

**5. WCAG AA.** Chaque couple texte/fond consommé produit un ratio ≥ 4,5:1
(texte courant) ou ≥ 3:1 (grand texte, bordures de contrôle, éléments
d'interface). Le contrôle `C6` calcule les 19 couples utilisés et échoue si l'un
passe sous son seuil. `--border-strong` reste à 3,25:1, conforme à
`DESIGN-SYSTEM-UNIFIE.md §91`.

**6. Aucune dépendance externe au chargement.** Zéro `<script src>` distant, zéro
`<link href>` distant, zéro `@import` distant, zéro `url(http…)` dans le CSS,
zéro appel réseau au premier paint. L'outil doit fonctionner dans un avion, et
c'est déjà une propriété de `cockpit.html` (`AUDIT-M5 §6.1`) qu'il ne faut pas
perdre en la remplaçant.

**7. Aucun jeton, mot de passe ou clé en clair dans le code, les gabarits, les
journaux ou le dépôt.** Un seul fichier porte les secrets (§4.3).

**8. Le vocabulaire d'interface parle du monde, pas des clics.** Les libellés
nomment la chose produite (« 7 publications programmées »), jamais l'action
interne (« POST effectué »).

### 0.2 Vocabulaire

| Terme | Définition opérationnelle |
|---|---|
| **magasin** | un lieu de stockage avec un propriétaire unique et un cycle de vie propre (§2.4) |
| **objet publication** | la vue assemblée d'une publication, avec un propriétaire par champ (§2.6) |
| **tâche** | une opération serveur de plus de deux secondes, nommée, suivie, annulable, reprenable (§4.1) |
| **provenance** | l'origine affichée d'une valeur : `local` ou `serveur` |
| **événement** | une ligne du registre d'événements (§4.4), immuable |
| **état** | l'un des cinq états de la machine de publication (§2.7) |
| **écran** | une destination rendue par Jinja avec une URL |
| **partiel** | un fragment Jinja rendu seul en réponse à htmx |

---

## 1. Décision de stack

### 1.1 Les contraintes qui commandent

Quatre contraintes, dans l'ordre de force, éliminent la quasi-totalité des piles
possibles avant même de discuter.

**Contrainte 1 — un seul utilisateur, en local, souvent hors ligne.**
`AUDIT-M5 §5.4` : l'écoute est bornée à `127.0.0.1:8787`. Le contrat de
`cockpit.html:161-163` est explicite — « le cockpit tourne souvent hors ligne ».
L'outil n'a ni compte, ni session, ni concurrence d'accès, ni besoin de cache
distribué. **Toute complexité justifiée par le multi-utilisateur est une
complexité gratuite.**

**Contrainte 2 — 75 routes Flask à préserver.** Mesuré dans
`prospect_app.py` : 75 décorateurs. `AUDIT-M5 §2.3` : le cockpit en référence
67, soit 89,3 %. Ces 75 routes sont le vrai actif du projet ; elles contiennent
la logique métier (scraping, scoring, génération, publication, synchronisation).
Une pile qui demande de les réécrire n'est pas une pile : c'est une remise à
zéro.

**Contrainte 3 — le site et le blog sont déjà du HTML statique composé par un
générateur Python.** `blog-eperformance/_build/` compose 81 articles et leur
index avec Python. `site-eperformance` sert des fichiers statiques. Introduire
une chaîne npm (node, `node_modules`, bundler, `package.json`, lockfile, étape
de build, cache) serait **un second écosystème pour zéro bénéfice** : deux
gestionnaires de dépendances, deux façons de versionner, deux façons de casser
le démarrage, pour produire — au mieux — les mêmes octets.

**Contrainte 4 — l'état vit côté serveur.** Trois des cinq principes de
`CONCEPTION.md §3` l'exigent : les tâches survivent à l'onglet, les brouillons
vivent hors du navigateur, les vues se retrouvent. Une SPA ne ferait **que
dupliquer** cet état dans le navigateur, en créant un second propriétaire à
réconcilier — exactement le défaut que la refonte répare (trois registres, deux
charts, deux chaînes). Le rendu serveur n'a pas ce problème par construction :
ce qui est affiché est ce que le serveur sait.

### 1.2 La pile retenue

```
┌──────────────────────────────────────────────────────────────────────┐
│  INTERFACE                                                           │
│  Jinja2 (rendu serveur)  +  htmx 2.0.4 (vendorisé)  +  app.js (~400 l.)│
│  CSS unique, polices locales, SVG généré en Python                   │
├──────────────────────────────────────────────────────────────────────┤
│  SERVICE                                                             │
│  Flask 3.1 (routes, blueprints)  →  waitress 3.0.2 (WSGI, 1 process) │
├──────────────────────────────────────────────────────────────────────┤
│  MÉTIER                                                              │
│  services/ (publications, prospection, production, veille, mesure,    │
│             sante, blog, sync_serveur, taches)                        │
├──────────────────────────────────────────────────────────────────────┤
│  MOTEURS EXISTANTS (conservés tels quels)                            │
│  content_engine · agents_engine · skills_engine · scraper_engine      │
│  prospect_scraper · veille_engine · social_templates · social_        │
│  illustrations · video_micro_generator · image_optimizer              │
├──────────────────────────────────────────────────────────────────────┤
│  NOYAU                                                                │
│  db.py (SQLite WAL) · identifiants.py · etat_cockpit.py · taches.py   │
│  secrets.py · journal.py · evenements.py · chemins.py                 │
├──────────────────────────────────────────────────────────────────────┤
│  STOCKAGE                                                            │
│  ~/Documents/eperf/eperf.db (métier, WAL)                            │
│  ~/Documents/eperf/etat.json (exécution + interface)                 │
│  api.eperformance.pro (publication — souverain, local = cache)        │
│  ~/.config/eperformance/secrets.env (0600, hors dépôt)               │
└──────────────────────────────────────────────────────────────────────┘
```

**Versions d'outillage, épinglées :**

| Composant | Version | Provenance | Justification |
|---|---|---|---|
| Python | 3.12 | `/usr/bin/python3.12` | déjà l'interpréteur en service (`AUDIT-M5 §5.3`) |
| Flask | 3.1.3 | PyPI, installé | déjà présent, déjà utilisé |
| Jinja2 | ≥ 3.1.4 | vient avec Flask | aucun ajout |
| waitress | 3.0.2 | PyPI, à installer | serveur WSGI de production, pur Python, sans dépendance C |
| htmx | 2.0.4 | **vendorisé**, `statique/js/htmx.min.js` | 14 Ko, un fichier, aucune étape de build |
| SQLite | stdlib (`sqlite3`) | Python 3.12 | mode WAL, aucune installation |
| Pillow | 10.1.0 | installé | déjà utilisé par les moteurs conservés |
| Playwright | 1.62.0 | installé | rendu des visuels — **sérialisé sur un worker unique** (§4.1) |
| requests | 2.31.0 | installé | appels HTTP sortants |
| beautifulsoup4 | 4.12.3 | installé | parsing HTML du scraper |
| lxml | 5.2.1 | installé | parsing XML du scraper |
| python-dotenv | 1.0.0 | installé | **retiré** : les secrets passent par `secrets.env` lu par `noyau/secrets.py` |

Un `requirements.txt` unique apparaît à la racine du toolkit (il n'en existe
aucun aujourd'hui — `AUDIT-M5 §5.3`), avec ces onze lignes et un contrôle au
démarrage qui compare `pip freeze` aux épingles.

**Pourquoi waitress et pas le serveur de développement.** `app.run()` de Flask
est mono-thread par défaut et se met à jour tout seul (`debug=True` expose la
console Werkzeug — c'est le défaut de `dashboard_app.py:560`, écoutant sur
`0.0.0.0`). waitress est un WSGI de production, pur Python, sans dépendance
externe, qui supporte `threads=8` — nécessaire parce que les tâches longues
tournent dans des fils pendant que les pages continuent d'être servies.

**Pourquoi htmx et pas du `fetch` écrit à la main.** `cockpit.html` compte 101
`innerHTML` et 98 `onclick` inline (`ARCHITECTURE-ECRANS.md §État mesuré`).
htmx remplace ce motif par un contrat déclaratif : `hx-get`, `hx-post`,
`hx-target`, `hx-swap`. C'est 14 Ko, un fichier, aucune syntaxe à apprendre, et
cela permet au serveur de rendre un fragment Jinja au lieu de renvoyer du JSON
que le client reconstruit. **Ce qui restait du JSON + innerHTML est exactement
ce qui a produit les 104 fonctions JS et les 101 `innerHTML`** : chaque écran
était un `fetch` suivi d'une concaténation de chaînes. htmx supprime la
concaténation.

### 1.3 Alternatives écartées

| Alternative | Écartée parce que |
|---|---|
| **SPA React/Vue + API JSON** | Duplique l'état côté client (contrainte 4) ; exige Node, bundler, étape de build (contrainte 3) ; demande de transformer 75 routes en API JSON puis d'écrire une seconde fois toute la couche d'affichage. Le projet paierait deux fois pour le même écran. |
| **htmx par CDN** | Une dépendance externe au chargement (contrainte 6). L'outil tourne hors ligne. Un CDN est une panne programmée. |
| **Alpine.js / Stimulus en plus d'htmx** | Ajoute une seconde grammaire pour des interactions que htmx et 400 lignes de JS couvrent déjà. Deux bibliothèques = deux façons d'écrire la même chose. |
| **Chart.js (vendorisé)** | `dashboard.html:6` le charge depuis jsDelivr ; `AUDIT-M5 §7.2` a listé les 4 graphiques comme la seule chose à récupérer de B, en notant « vendoriser la bibliothèque ou la remplacer ». Un moteur de graphique complet (200+ Ko) pour **quatre formes** est disproportionné. Les quatre formes sont produites en **SVG par Python** (§1.6) : aucun JS de rendu, aucune dépendance, un rendu qui fonctionne sans JavaScript. |
| **Django** | Apporte ORM, admin, migrations, sessions, authentification — quatre choses dont l'outil n'a besoin d'aucune. Et il faudrait réécrire les 75 routes et leurs vues. |
| **FastAPI + Jinja** | Même volume de réécriture que Django pour un gain nul : il n'y a pas d'API publique à documenter, un seul consommateur, le même processus sert les pages. |
| **PostgreSQL** | Un serveur de base à installer, démarrer, sauvegarder, surveiller — pour un fichier de quelques mégaoctets et un utilisateur. SQLite en WAL supporte sans broncher la charge décrite. |
| **Redis / file de tâches externe** | Une seconde chose à démarrer. Le registre de tâches tient dans `etat.json` (§4.1) et les tâches longues tournent dans des fils, ce que Flask + waitress supportent nativement. |
| **Les polices par Google Fonts** | Contrainte 3 du contrat. `AUDIT-M5 §6.1` : c'est le seul des trois dashboards conforme, et il l'est par choix délibéré. |
| **Outfit remplacée par DM Sans pour les chiffres** | Tentation réelle : Outfit n'existe pas sur le disque (`AUDIT-M5 §6.4`). Mais les chiffres sont ce que l'utilisateur regarde le plus dans un poste de mesure, et la distinction titres/texte/chiffres est une décision de charte déjà prise. Outfit est sous licence libre, pèse ~20 Ko en woff2 sous-ensemblé : on l'embarque. C'est une session de travail, pas une exception à la charte. |
| **Reprendre `dashboard.html` + `build_dashboard.py` comme base** | `AUDIT-M5 §7.1` et `AUDIT-M1 §5.2` : doublon divergé, gelé depuis le 2026-09-07, 2 secteurs faux sur 6 testés, et un **jeton d'écriture en clair sur l'API de production** à la ligne 142. |
| **Reprendre `agent-ia-web/templates_dashboard/` comme base** | `AUDIT-M5 §2.2` : 7 routes communes toutes déjà servies par le cockpit, 4 doublons fonctionnels, 3 routes mortes, **0 capacité propre**, et le module n'est pas démarrable (`flask_cors` absent). Sa charte est la palette indigo Tailwind par défaut. |
| **Un générateur de site pour composer le dashboard** | Le dashboard n'est pas du contenu : chaque écran dépend de l'état courant de la base. Un générateur statique produirait des pages périmées à la seconde où l'état change. |

### 1.4 Comment le front est construit et servi

**Il n'y a pas d'étape de build.** Le front est servi par Flask, inchangé, depuis
le disque. Le cycle est : éditer un fichier, recharger la page.

**Arborescence servie :**

```
toolkit_eperformance/
├── gabarits/                 # Jinja2 — hérite de base.html
└── statique/
    ├── css/eperf-cockpit.css # unique feuille, jetons N1, zéro hex hors :root
    ├── js/htmx.min.js        # 2.0.4, vendorisé, jamais modifié
    ├── js/app.js             # le noyau, ~400 lignes
    ├── polices/              # 12 .woff2 (9 du site + 3 Outfit sous-ensemblées)
    └── illustrations/        # SVG des écrans (icônes, états vides)
```

**Service des fichiers statiques.** `Flask(__name__, static_folder="statique",
static_url_path="/statique", template_folder="gabarits")`. La route de police
n'existe plus : `@font-face` pointe vers `/statique/polices/<fichier>.woff2`,
résolu par le serveur statique de Flask. **C'est la correction du défaut de
`AUDIT-M5 §6.5`** : les 7 `@font-face` du cockpit renvoient 404 en HTTP parce que
`../site-eperformance/…` ne peut pas remonter au-dessus de la racine du serveur ;
mesuré, `curl` renvoie 404 sur les deux ports et **le cockpit tourne en police
système**. Une copie des 9 fichiers du site est déposée dans `statique/polices/`
pour que le dashboard ne dépende pas d'un chemin hors de son dépôt.

**Ce que ce défaut est, et ce qu'il n'est pas (rectification du 19/09).** Le fait
mesuré est : **le cockpit tourne en police système**. La cause est **une
régression de la refonte elle-même**, pas un défaut subi depuis des semaines :
avant le commit `8389309` du 19/09 03:25, `cockpit.html` ne contenait **aucun**
`@font-face` (0 requête, 0 erreur en douze jours) et tournait en police système
**par construction** ; les 7 règles et les **62 seuls 404 de l'historique** sont
apparus avec ce commit. La correction reste la même — servir les fichiers depuis
`/statique/` — et elle cesse d'être présentée comme la réparation d'un défaut
ancien (`CONTRE-EXPERTISE.md §G0`). Le défaut de socle qui a réellement coûté
quelque chose au propriétaire est l'**absence de tout signal quand l'application
se casse** (104 réponses 5xx en douze jours, 0 alerte — `CONTRE-EXPERTISE §G6`,
traité par D9 et l'étape 6).

**Versionnage des actifs par empreinte.** Chaque `<link>` et chaque `<script>`
porte un suffixe calculé en Python au démarrage :

```python
# noyau/static_version.py
def empreinte(chemin: Path) -> str:
    """Retourne les 8 premiers caractères du sha256 du fichier."""
    return hashlib.sha256(chemin.read_bytes()).hexdigest()[:8]
```

Un contexte global Jinja expose `v("css/eperf-cockpit.css")` :

```jinja
<link rel="stylesheet" href="/statique/css/eperf-cockpit.css?v={{ v('css/eperf-cockpit.css') }}">
<script src="/statique/js/htmx.min.js?v={{ v('js/htmx.min.js') }}" defer></script>
<script src="/statique/js/app.js?v={{ v('js/app.js') }}" defer></script>
```

L'empreinte est calculée **une fois au démarrage**, pas à chaque requête. Elle
résout le défaut structurel de `AUDIT-M5 §1.2` : aujourd'hui `cockpit.html` est
lu à chaud à chaque `GET /`, donc deux instances peuvent servir deux versions
différentes si l'on édite entre deux démarrages. Avec Jinja + suffixe, chaque
serveur sert une version cohérente, et un `Ctrl+Maj+R` n'est jamais nécessaire.

**Rendu.** Les écrans sont des gabarits complets ; les interactions sont des
fragments. Une seule convention :

```jinja
{# gabarits/partiels/liste_publications.html — fragment ET page #}
<div id="liste-publications">…</div>
```

Une route `GET /produire/publications` rend la page entière ; une route
`GET /partiel/publications/liste` rend le même fichier en mode fragment,
appelée par `hx-get` avec `hx-target="#liste-publications"`. **Le gabarit est
écrit une fois.** C'est le remplacement direct des 110 chaînes de gabarit
écrites à la main que `AUDIT-M5 §7.3` recommande d'éliminer.

**Les quatre états obligatoires de chaque écran** (`ARCHITECTURE-ECRANS.md §2`,
repris ici comme contrat de rendu) :

| État | Ce que le gabarit reçoit | Rendu |
|---|---|---|
| **Chargement** | `hx-indicator` sur la requête | squelettes à la forme du contenu ; pour un bloc lent, l'étape nommée, jamais « Chargement… » |
| **Vide** | `vide: {type: 'rien'|'recherche'|'horsligne'|'echec', action}` | un texte vrai, construit depuis les données, **et une action** |
| **Erreur** | `erreur: {cause, code, action}` | la cause en clair, « Réessayer », « Diagnostic » |
| **Partiel** | `partiel: {couvert, total, derniere_sync}` | bandeau ambre : « 3 sources sur 4 · dernière synchro à 14 h 12 » + « Resynchroniser » |

Un gabarit qui ne traite pas ces quatre cas échoue au contrôle `C5` (§1.7).

### 1.5 Le noyau JS : `app.js`, environ 400 lignes

Le JS n'est pas un framework. Il fait six choses, et rien d'autre :

| Bloc | Lignes (cible) | Rôle |
|---|---|---|
| `sondage()` | ~60 | sonde `GET /api/taches` toutes les 3 s quand l'onglet est visible, 15 s sinon (`visibilitychange`) ; met à jour le bandeau de tâches et les pastilles de progression |
| `deuxTemps()` | ~70 | confirmation en deux temps : le bouton devient « Confirmer » pendant 6 s (mode destructif), avec annulation par `Échap` — remplace les 16 `confirm()` natifs relevés par `ARCHITECTURE-ECRANS.md §1.4` |
| `clavier()` | ~90 | la table des raccourcis de `ARCHITECTURE-ECRANS.md §8.3` (`g` puis `a/p/i/v/s`, `/`, `Alt`+`1…5`, `n`, `j`/`k`, `x`, `t`, `w`, `?`) ; désactivé quand le focus est dans un champ, sauf `Échap`, `Ctrl`+`Entrée`, `Ctrl`+`z` |
| `brouillon()` | ~80 | écriture du brouillon à la frappe, `POST /partiel/etat/brouillon/<cle>` toutes les 2 s après la dernière frappe, reprise à l'ouverture |
| `progression()` | ~50 | affiche unités faites/total et temps écoulé contre temps estimé ; **jamais** un pourcentage qui atteint 100 % puis reste bloqué (`etat_cockpit.py` borne déjà à 92) |
| `sante()` | ~50 | lit `GET /api/sante`, peint le bandeau ; ne décide jamais de l'état — le serveur le calcule et en donne les raisons |

**Ce que `app.js` ne fait pas :** aucun rendu de HTML (htmx le fait), aucune
requête de données métier (Jinja les a déjà rendues), aucun état persistant
(le serveur le porte), aucun graphique (Python les génère en SVG).

### 1.6 Graphiques : SVG générés en Python

Quatre formes, pas plus. Elles couvrent les quatre blocs de mesure du projet :

| Forme | Usage | Fonction |
|---|---|---|
| **Barres** | répartition par pilier, par plateforme, par statut | `svg.barres(donnees, largeur=520, hauteur=180)` |
| **Barre de 4 px** | barre de répartition cliquable d'un onglet (10 statuts, 7 piliers) | `svg.barre_repartition(segments, largeur=520)` |
| **Escalier** | chronologie (publications par jour, jetons par jour) | `svg.escalier(series, largeur=520, hauteur=140)` |
| **Entonnoir** | pipeline de prospection en quatre paliers (repérés, contactés, réponses, convertis) | `svg.entonnoir(paliers, largeur=420, hauteur=200)` |

Chaque fonction retourne une chaîne `Markup` injectée dans le gabarit. Les
couleurs viennent de `var(--…)`, jamais d'une valeur littérale. Un graphique
sans donnée rend l'état vide correspondant et **le dit** (« aucun pilier mesuré
sur la période »), au lieu d'un cadre vide.

**Pourquoi c'est un gain et pas une privation.** Un graphique SVG rendu par le
serveur est du HTML : il fonctionne sans JS, il est copiable, il se met en
cache, et il ne peut pas afficher autre chose que ce que le serveur sait. Le
`chart.js` de `dashboard.html` affichait 4 graphiques alimentés par un vidage de
données **injecté à la génération** (`AUDIT-M5 §1.2` : la ligne 139 fait 197 128
caractères) : deux graphiques beaux et faux, contre quatre exacts.

### 1.7 Contrôles automatiques

Dix contrôles, un script `verifier.py` à la racine, exécuté à la fin de chaque
session. Un contrôle qui échoue bloque la session : on ne ferme pas une étape
sur un rouge.

| # | Contrôle | Méthode | Échoue si |
|---|---|---|---|
| **C1** | zéro dépendance externe | regex `https?://` sur `gabarits/**`, `statique/**` | une URL apparaît autrement que comme texte de contenu |
| **C2** | jetons N1 conformes **et** zéro hex hors `:root` | (a) comptage par équilibrage d'accolades sur `eperf-cockpit.css` ; (b) comparaison des **12 paires `(nom, valeur résolue)`** à l'empreinte de la source canonique du NOYAU (§1.7 bis) | > 0 hex hors `:root`, ou empreinte divergente, ou **source injoignable** |
| **C3** | zéro emoji | plages `U+1F000–U+1FAFF`, `U+2600–U+27BF`, `U+2B00–U+2BFF`, `U+2190–U+21FF` sur `gabarits/`, `statique/`, `routes/` | > 0 séquence |
| **C4** | polices présentes | chaque `src:url()` de `@font-face` résolu sur le disque, contre la **liste nommée des 12 fichiers** (5 Cormorant + 4 DM Sans + 3 Outfit) | un fichier **nommé** manque (dont `outfit-{400,700,900}.woff2`) |
| **C5** | quatre états par écran | rendu de chaque gabarit avec les jeux `vide`/`erreur`/`partiel` | un gabarit lève ou n'affiche pas son action |
| **C6** | WCAG AA | calcul des ratios des 19 couples consommés | un ratio sous son seuil |
| **C7** | aucun secret littéral | motifs des 11 emplacements de `AUDIT-M4 §D10` | une correspondance |
| **C8** | versionnage des actifs | présence de `?v=` sur chaque `<link>`/`<script>` de `base.html` | un actif sans empreinte |
| **C9** | pas de `<select>` pauvre | comptage des `<option>` dans `gabarits/` | un `<select>` de moins de 5 options, ou un `<select>` de filtre |
| **C10** | pas de `prompt()`/`confirm()` | grep sur `statique/js/` | une occurrence (0/natif est le contrat) |

**Contrôles de non-régression fonctionnels** (pytest, `tests/`) : les trois tests
d'identité de §2.8, le test d'idempotence de la migration, le test de reprise de
tâche (§4.1), le test de refus au pull (§2.6).

#### 1.7 bis La source canonique des jetons, et ce que `C2` compare (arbitrage du NOYAU)

Arbitrage rendu par le NOYAU, et repris ici tel quel (`AVIS-NOYAU.md §2.2`) :

> **La source canonique est `agent-ia-web/eperf_core/assets/css/` — les cinq
> couches, lues dans l'ordre de la cascade, et résolues par
> `agent-ia-web/eperf_core/jetons.py`.**

| Élément | Chemin |
|---|---|
| les VALEURS | `agent-ia-web/eperf_core/assets/css/10-primitives.css` (`--p-*`, littéraux) |
| les NOMS | `agent-ia-web/eperf_core/assets/css/20-semantic.css` (alias + bloc sombre) |
| le résolveur | `agent-ia-web/eperf_core/jetons.py` (`charger_noyau`, `theme_effectif`) |

**Ce que `C2` compare : 12 paires `(nom, valeur résolue)`, jamais un `md5` de
fichier.** Un `md5` casse sur un commentaire, ne voit pas le thème, et laisse
passer une valeur qui change **sous** un alias. Les paires sont normalisées en
littéral (`hex_litteral`), `lower()`, triées, hachées. Empreintes mesurées et à
citer telles quelles :

```
sombre  b89dcba06940079e
clair   e6d40d572271fc7d
```

`SYSTEME-VISUEL-SAAS.md §2.2` donne le code exact du contrôle (`AVIS-NOYAU P2`).
Deux règles l'accompagnent :

1. **Le contrôle échoue si la source est injoignable**, il ne passe pas — la
   comparaison sur zéro fichier est une erreur de mesure, jamais un succès
   (contrat C12 du SITE, mot pour mot).
2. **La copie est GÉNÉRÉE, pas écrite à la main** : un script lit la source par
   `eperf_core.jetons` et émet le bloc `:root` ; un `md5` ne suffit pas
   (`AVIS-NOYAU P3`).

**Aucun jeton n'est renommé par cette refonte.** L'arbitrage du vocabulaire
appartient au NOYAU, pas au SITE : les noms nouveaux de `SYSTEME-VISUEL-SAAS.md`
(`--police-texte`, `--police-chiffres`, `--police-technique`, `--t0`…`--t8`) sont
un ajout à faire consacrer par une entrée `⚠️ CONTRAT` du NOYAU avant la première
copie, et non une décision du SITE (`VALIDATION-CHATBOT §A5`, `AVIS-NOYAU §4.1`).

### 1.8 Structure de dossiers complète

```
toolkit_eperformance/
│
├── app.py                        # création Flask, enregistrement des blueprints,
│                                 #   démarrage waitress (host 127.0.0.1, threads 8)
├── verifier.py                   # les 10 contrôles automatiques (§1.7)
├── requirements.txt              # 11 épingles (§1.2)
├── config.py                     # chemins, constantes, TOOLKIT_VERSION
├── lancer-cockpit.sh             # lanceur unique, chemin absolu, écrit et testé
├── cockpit.desktop               # entrée de menu, chemin absolu, installée aux 2 endroits
│
├── noyau/                        # ce qui n'a pas de métier : chemins, base, secrets
│   ├── __init__.py
│   ├── chemins.py                # EPERF_HOME = ~/Documents/eperf ; surchargeable par env
│   ├── db.py                     # connexion SQLite WAL, migrations, transactions
│   ├── migrations.py             # migration 001 (schéma), 002 (collisions d'ID)
│   ├── identifiants.py           # sequence(nom) → PUB-%04d monotone et immuable
│   ├── taches.py                 # enveloppe etat_cockpit + états D6 + annulation
│   ├── secrets.py                # lecture secrets.env, empreintes, sondes
│   ├── journal.py                # configuration logging, jamais d'en-tête d'auth
│   ├── evenements.py             # écriture du modèle d'événement (§4.4)
│   ├── erreurs.py                # exceptions typées : ErreurMetier, ErreurExterne,
│   │                             #   ErreurConfig, ErreurIdentite
│   └── static_version.py         # empreinte sha256[:8] des actifs
│
├── services/                     # le métier, sans Flask : testable sans serveur
│   ├── __init__.py
│   ├── publications.py           # l'objet unique, propriétaire par champ, provenance
│   ├── machine_etats.py          # les 5 états + le tombstone, transitions légales
│   ├── prospection.py            # pipeline, scoring, séquences, réponses
│   ├── production_texte.py       # un seul chemin vers content_engine + contrôle
│   ├── production_visuelle.py    # un seul chemin vers social_templates
│   ├── veille.py                 # veille de contenu, persistée
│   ├── concurrents.py            # analyses concurrentes, persistées
│   ├── blog.py                   # le contrat blog (§2.10)
│   ├── sync_serveur.py           # montée/descente LWS, une transaction
│   ├── mesure.py                 # métriques sociales + coût réel mesuré
│   └── sante.py                  # le calcul de /api/sante (§4.5)
│
├── routes/                       # uniquement HTTP : lire l'entrée, appeler un service
│   ├── __init__.py               # enregistrer(app) — un blueprint par fichier
│   ├── ecrans.py                 # les pages Jinja (aujourdhui, produire, acquerir…)
│   ├── partiels.py               # les fragments htmx
│   ├── api_prospection.py        # /api/prospects*, /api/scrape*, /api/import
│   ├── api_publications.py       # /api/publications*
│   ├── api_production.py         # /api/design*, /api/social*, /api/quick*
│   ├── api_veille.py             # /api/veille, /api/concurrents*
│   ├── api_systeme.py            # /api/config*, /api/settings*, /api/secrets, /api/sante
│   ├── api_taches.py             # /api/taches*  (les 5 routes du contrat D6)
│   └── api_etat.py               # /api/etat/* (11 routes, contrat inchangé)
│
├── gabarits/                     # Jinja2
│   ├── base.html                 # <head>, jetons, rail, bandeau, bandeau de tâches
│   ├── partiels/
│   │   ├── rail.html             # 5 destinations + compteurs
│   │   ├── bandeau.html          # recherche, anti-ban, tâches, fournisseur, horloge
│   │   ├── bandeau_sante.html    # l'état et la liste de ses raisons (D9)
│   │   ├── bandeau_taches.html   # permanent, ancré en bas du rail
│   │   ├── table_publications.html
│   │   ├── carte_prospect.html
│   │   ├── ligne_decision.html   # une ligne de la file du jour
│   │   └── graphique.html        # enveloppe d'un SVG Python
│   ├── aujourdhui.html
│   ├── produire/{publications,nouveau,atelier,lot}.html
│   ├── acquerir/{pipeline,sources,messages}.html
│   ├── veiller/{concurrents,idees,performance}.html
│   ├── systeme/{fournisseur,competences,apparence,preferences,journal,diagnostic}.html
│   ├── fiche/{prospect,concurrent,publication}.html
│   └── prix.html
│
├── statique/
│   ├── css/eperf-cockpit.css     # unique feuille
│   ├── js/{htmx.min.js,app.js}
│   ├── polices/                  # 12 .woff2
│   └── illustrations/            # SVG
│
├── tests/
│   ├── test_identifiants.py      # les 3 tests de non-régression D4
│   ├── test_migration.py         # idempotence de la migration des 7 collisions
│   ├── test_taches.py            # création, annulation, reprise, purge
│   ├── test_publications.py      # propriété par champ, provenance, transitions
│   └── test_sante.py             # les 4 états et chaque raison
│
├── moteurs conservés (inchangés) :
│   content_engine.py  agents_engine.py  skills_engine.py  scraper_engine.py
│   prospect_scraper.py  veille_engine.py  image_optimizer.py
│   video_micro_generator.py  etat_cockpit.py
│   social_templates/  social_illustrations/
│
└── SUPPRIMÉS (D2, D10) :
    cockpit.html  dashboard.html  build_dashboard.py
    design_pipeline.py  image_generator_v3.py  image_generator.py
    variant_generator.py  video_generator.py  content_pipeline_v2.py
    prospect_scraper_v4.py  prospect_scraper_v5_authentique.py
```

**Règles de dossier, non négociables :**

1. `noyau/` ne connaît pas `services/`. `services/` ne connaît pas `routes/`.
   `routes/` ne connaît rien d'autre que `services/`, `noyau/` et Jinja.
2. `services/` ne connaît pas Flask. Il est testable sans serveur, et c'est ce
   qui rend les tests possibles.
3. Un moteur conservé (`content_engine`, `social_templates`, …) n'est appelé
   **que** depuis `services/`, jamais depuis une route.
4. Aucun fichier de `routes/` ne dépasse 200 lignes. Au-delà, la logique qui
   déborde appartient à `services/`.

---

## 2. Architecture cible

### 2.1 Schéma des couches

```
                                   NAVIGATEUR (un seul, en local)
   ┌────────────────────────────────────────────────────────────────────┐
   │  HTML rendu (Jinja)   ·  htmx 2.0.4  ·  app.js ~400 l.  ·  SVG      │
   │  AUCUN état métier. AUCUN accès disque. AUCUNE clé.                 │
   └───────────────┬────────────────────────────────────────────────────┘
                   │  HTTP 127.0.0.1:8787
   ┌───────────────▼────────────────────────────────────────────────────┐
   │  COUCHE 1 — ROUTES (routes/)                                        │
   │  Lit la requête, valide la forme de l'entrée, appelle UN service,   │
   │  rend un gabarit ou du JSON. Aucune règle métier. ≤ 200 l./fichier. │
   │  Si l'appel dure > 2 s : la route rend 202 {tache} immédiatement.   │
   └───────────────┬────────────────────────────────────────────────────┘
                   │  appel Python direct (jamais HTTP interne)
   ┌───────────────▼────────────────────────────────────────────────────┐
   │  COUCHE 2 — SERVICES (services/)                                    │
   │  La règle métier, et le seul endroit où elle vit.                   │
   │  publications · machine_etats · prospection · production_texte ·    │
   │  production_visuelle · veille · concurrents · blog · sync_serveur · │
   │  mesure · sante · taches                                            │
   │  Ne connaît pas Flask. Testable sans serveur.                       │
   └───┬───────────────┬───────────────────┬────────────────────────────┘
       │               │                   │
   ┌───▼──────────┐ ┌──▼──────────────┐ ┌──▼──────────────────────────┐
   │ COUCHE 3a    │ │ COUCHE 3b       │ │ COUCHE 3c                   │
   │ MOTEURS      │ │ NOYAU           │ │ SORTANT                     │
   │ (conservés)  │ │ db·identifiants │ │ sync_serveur → LWS (HTTPS)  │
   │ content_     │ │ etat·taches     │ │ production_visuelle →       │
   │ engine       │ │ secrets·journal │ │   DeepSeek + Chromium       │
   │ agents_      │ │ evenements      │ │ production_texte → DeepSeek │
   │ engine       │ │ erreurs         │ │ veille → 4 flux publics     │
   │ skills_      │ │                 │ │                             │
   │ engine       │ │                 │ │  Toute sortie réseau passe  │
   │ scraper_     │ │                 │ │  par noyau/secrets : aucune │
   │ engine       │ │                 │ │  clé n'est lue ailleurs.    │
   │ prospect_    │ │                 │ │                             │
   │ scraper      │ │                 │ │                             │
   │ veille_      │ │                 │ │                             │
   │ engine       │ │                 │ │                             │
   │ social_      │ │                 │ │                             │
   │ templates    │ │                 │ │                             │
   └───┬──────────┘ └─────────────────┘ └─────────────────────────────┘
       │
   ┌───▼──────────────────────────────────────────────────────────────────┐
   │  COUCHE 4 — STOCKAGE (trois magasins, trois cycles de vie)           │
   │                                                                      │
   │  (1) MÉTIER     ~/Documents/eperf/eperf.db        SQLite WAL         │
   │                 prospects, publications (contenu), identifiants,      │
   │                 événements, concurrents, veille, tombstones           │
   │                 propriétaire : l'application locale                  │
   │                                                                      │
   │  (2) EXÉCUTION  ~/Documents/eperf/etat.json       JSON atomique      │
   │                 tâches, brouillons, vues                              │
   │                 propriétaire : etat_cockpit.py                       │
   │                                                                      │
   │  (3) PUBLICATION  api.eperformance.pro            SOUVERAIN          │
   │                 statut, Post_ID, erreur, métriques, failures          │
   │                 le local n'en est qu'un CACHE (jamais la source)      │
   │                                                                      │
   │  (4) SECRETS    ~/.config/eperformance/secrets.env  0600 hors dépôt  │
   │                                                                      │
   │  (5) ÉCHANGE    publications.csv / prospects_tracking.csv → PHP      │
   │                 exportés à la demande, JAMAIS lus par l'interface     │
   └──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Règles de couche non négociables

| # | Règle | Pourquoi | Comment elle est contrôlée |
|---|---|---|---|
| **L1** | Une route n'écrit jamais dans un magasin. Elle appelle un service. | Les routes qui écrivaient directement sont exactement celles qui ont produit les trois registres de statut (`AUDIT-M4 §1.3`). | revue + `grep` de `open(`/`sqlite3` dans `routes/` |
| **L2** | Un service n'importe jamais Flask. | Sinon il n'est plus testable sans serveur, et la logique redescend dans les routes. | `grep -n "flask" services/` |
| **L3** | Un moteur conservé n'est appelé que par un service. | `content_engine` appelé depuis deux endroits produit deux comportements : c'est la cause du C10 de `AUDIT-M2 §5` (deux files d'images selon la route). | `grep -rn "import content_engine\|import social_templates" routes/` |
| **L4** | Aucune donnée métier dans `etat.json` ; aucun état d'interface dans `eperf.db`. | D3. La règle existe parce que le mélange est ce qui a produit l'ignorance de `AUDIT-M4 §1.3` : l'écran lisait le mauvais registre. | `tests/test_magasins.py` : les clés de `etat.json` sont exactement `taches`, `brouillons`, `vues` |
| **L5** | Le serveur est souverain sur tout ce qui a un effet externe. Le local ne peut pas l'écraser. | `SERVER/upload_publications.php:233-245` fait déjà cela pour huit champs ; on l'étend à six champs et on le rend **visible** (`provenance`). | `tests/test_publications.py` |
| **L6** | Aucune écriture sans synchronisation. Toute mutation d'une publication est une transaction locale **et** distante, ou rien. | Les trois défauts critiques de `AUDIT-M4 §8` (D1 identifiants, D3 programmation non synchronisée, D4 delete-all) sont tous des écritures locales non confirmées. | le motif `sync_warning` de `prospect_app.py:778`, généralisé et **bloquant** pour les lots |
| **L7** | Un identifiant ne se réattribue jamais, ne se dérive jamais d'un comptage, ne se recalcule jamais. | D4. `PUB-0004` désigne un texte pour toujours. | les 3 tests de §2.8 |
| **L8** | Toute opération > 2 s est une tâche. Une route ne bloque jamais plus d'une seconde. | D6. `AUDIT-M2 §5 A1` : un lot de 7 prend 38 s, un calendrier de 49 prend 5 min, sans progression ni annulation. | `tests/test_taches.py` : aucune route longue ne rend un corps sans `tache` |
| **L9** | Un secret n'est lu qu'à un endroit, et il n'apparaît dans aucune réponse. | D8. | contrôle `C7` + `tests/test_secrets.py` |
| **L10** | Aucun état normal par défaut. L'absence d'information produit `inconnu`, jamais `ok`. | D9, le défaut le plus coûteux du projet. | `tests/test_sante.py` |

**Note d'exploitation — la cascade de fournisseurs du noyau ne se retire pas en
même temps que la refonte (correction E, mesurée par le NOYAU).** Le schéma de
§2.1 ne montre que DeepSeek parce que **le toolkit est mono-fournisseur
aujourd'hui** : c'est un constat, pas une décision à étendre au noyau. Or
l'unification à DeepSeek seul **casse quatre modules du noyau** :

| Module | Nature de la dépendance | Ce qui casse |
|---|---|---|
| `agent-ia-web/auditeur.py:41` | garde dure à l'import (`raise EnvironmentError`) | `import auditeur` échoue |
| `agent-ia-web/onboarding.py:71` | garde dure au démarrage | l'onboarding client ne démarre plus |
| `agent-ia-web/blog_engine/generate_articles.py:69` | transport direct vers `open.bigmodel.cn` | `appeler_ia()` retourne `None` **avant** le `try` : le repli DeepSeek est inatteignable |
| `agent-ia-web/blog_engine/onboard_legacy.py:71` | transport direct, même endpoint | `extraire_profil_via_ia()` retourne `{}` |

Mesuré ce soir-là (`AVIS-NOYAU §3.1`) : DeepSeek `200`, **Z.ai `429 code 1113`
(compte non approvisionné, clé valide)**, Claude `200`. **Claude est le seul
secours fonctionnel** que le projet ait. Donc :

> **Ne pas retirer le palier Claude avant que ces quatre modules ne soient
> repris.** Le registre de fournisseurs (M10) reste à un fournisseur **actif**
> pour le toolkit, mais il ne doit pas supprimer le troisième palier du noyau ;
> et il porte, quand il n'y a pas de secours, la sémantique `consequence` déjà
> spécifiée en §4.3 : « aucun secours : une indisponibilité de DeepSeek échoue ».

### 2.3 Sort de chaque module Python existant

Vingt-deux modules du toolkit, **plus les trois modules du noyau qui perdent
leur consommateur** (correction I, en fin de tableau). Chaque ligne dit : ce
qu'il devient, où, et pourquoi.

| Module | Lignes | Sort | Destination | Justification |
|---|---|---|---|---|
| `prospect_app.py` | 2 382 | **DÉCOUPÉ** | `app.py` + `routes/*.py` (9 fichiers) | 75 routes dans un fichier, plus le `main()` : les routes partent par domaine, le noyau reste dans `app.py`. Aucune route perdue. |
| `content_engine.py` | ~3 200 | **CONSERVÉ** | appelé par `services/production_texte.py` | Cœur fonctionnel, « bien construit, testé, tracé » (`AUDIT-M2 §6.2`). Deux paramètres réparés : le rate limiter de 5 s hérité (`AUDIT-M2 §5 A1`) et le plafond d'appels. |
| `agents_engine.py` | ~400 | **CONSERVÉ** | idem | Le prompt d'agent est ce qui produit la voix (`AUDIT-M2 §6.2`). L'argument `fmt` cesse d'être oublié (`AUDIT-M2 §5 A5`). |
| `skills_engine.py` | ~900 | **CONSERVÉ** | `services/prospection.py` | « Tout est atteignable et utile — mais à la prospection, pas à la production de texte » (`AUDIT-M2 §6.2`). Reclassé, pas réécrit. |
| `scraper_engine.py` | 229 | **CONSERVÉ** | `services/prospection.py` | `search_osm` et `parse_vcf` sont les deux seules entrées d'acquisition fonctionnelles (`AUDIT-M1 §5.1`). |
| `prospect_scraper.py` | 821 | **CONSERVÉ** | `services/prospection.py` | `calculate_score`, `normalize_whatsapp`, `detect_pays` fonctionnent ; `A_Site_Web` et `Email` deviennent saisissables (`AUDIT-M1 §5.1`). |
| `veille_engine.py` | ~450 | **CONSERVÉ** | `services/veille.py` | Le score de niche fonctionne (90/80/70/60 sur des titres réels, `AUDIT-M4 §5.2`). `countries` passe à `["CI","BF"]` et `REDDIT_SUBREDDITS` cesse d'être mort. |
| `social_templates/` | ~90 Ko | **CONSERVÉ — CHAÎNE UNIQUE** | `services/production_visuelle.py` | D10. C'est la chaîne visuelle unique : jetons (`ST/coque/jetons.py`), 5 gabarits, contrôleur 8 postes, superviseur. Seule correction : contrôle **par slide** (§2.9 et `AUDIT-M3 §F3`). |
| `social_illustrations/` | 74 SVG | **CONSERVÉ** | appelé par `social_templates` | 74 illustrations SVG, 20 planches dont 12 sectorielles (`AUDIT-M3 §7.1`). |
| `etat_cockpit.py` | 176 | **CONSERVÉ ET COMPLÉTÉ** | `noyau/taches.py` l'enveloppe | D7. Trois ajouts : `tache_annuler()`, `tache_detail()` avec journal borné à 20 lignes, purge étendue. |
| `video_micro_generator.py` | ~300 | **CONSERVÉ** | `services/production_visuelle.py` | « Le seul moteur vidéo réellement branché et le seul qui fonctionne » (`AUDIT-M3 §7.1`), `ffmpeg` et `ffprobe` présents. |
| `image_optimizer.py` | 322 | **CONSERVÉ ET BRANCHÉ** | appelé par `ST/rendu.py` | FUSIONNER selon `AUDIT-M3 §7.2` : la chaîne gabarits ne l'appelle jamais. Deux lignes à ajouter dans `rendu.py`. |
| `metrics_tracker.py` | ~250 | **CONSERVÉ ET BRANCHÉ** | `services/mesure.py` | Rebranché sur des coûts **mesurés** (jetons de `lot.json`), pas des constantes (`AUDIT-M3 §F11`). Appelé par la génération de publications, ce qui n'était pas le cas (`AUDIT-M4 §6.1`). |
| `etat.json` (`COCKPIT_ETAT`) | — | **DÉPLACÉ** | `~/Documents/eperf/etat.json` | D3 et D7. Un seul répertoire de données. |
| `design_pipeline.py` | 545 | **SUPPRIMÉ** | rien | « Se déclare mort lui-même ; sa seule action restante est un prompt HTML qui demande des polices par CDN et un or hors charte » (`AUDIT-M3 §7.3`). |
| `image_generator_v3.py` | 319 | **SUPPRIMÉ** | rien | Coquille qui appelle `DP` ; son moteur de rendu a déjà été recopié dans `ST/rendu.py` (`AUDIT-M3 §7.2`). |
| `image_generator.py` (v2 Pillow) | 611 | **SUPPRIMÉ** | rien | Repli silencieux en `except ImportError`, contredit la décision « zéro fallback » (`AUDIT-M3 §7.3`). |
| `variant_generator.py` | ~250 | **SUPPRIMÉ** | intention reprise | Ne sait produire que les variables de la chaîne morte. L'intention A/B est reprise **sur les gabarits** : 3 variantes = 3 gabarits candidats du même pilier, chiffrés (§2.9). |
| `video_generator.py` | 271 | **SUPPRIMÉ** | rien | Importé par personne et cassé (`ig.gen_reel_cover(..., gradient=…)` sur une signature sans ce paramètre, `AUDIT-M3 §7.3`). |
| `content_pipeline_v2.py` | ~280 | **SUPPRIMÉ** | rien | `AUDIT-M2 §6.1` : le seul import vivant est un drapeau jamais relu, et le module dépend d'une CLI absente. |
| `build_dashboard.py` | ~900 | **SUPPRIMÉ** | rien | D2 et `AUDIT-M1 §5.3` : doublon divergé, jeton en clair, artefact gelé depuis le 2026-09-07. |
| `prospect_scraper_v4.py` / `_v5_authentique.py` | 310 / 312 | **SUPPRIMÉS** | corrections extraites | v5 a 0 import ; v4 est importé par deux fichiers non branchés (`AUDIT-M1 §5.3`). Leurs corrections (prénom réel, retrait de Telegram, offres réelles) passent dans le générateur unique. |
| `dashboard.html` / `cockpit.html` | 320 / 2 600 | **SUPPRIMÉS** | `gabarits/` | `cockpit.html` est la base de départ de D2 : ses **jetons** et sa **couverture** survivent ; sa couche de rendu (104 fonctions JS, 101 `innerHTML`) est remplacée par Jinja. |
| `agent-ia-web/dashboard_app.py` + `templates_dashboard/` | 560 | **SUPPRIMÉS — ⚠️ DEMANDE au NOYAU, dépôt tiers** | rien | D2 et `AUDIT-M5 §2.2` : 14 routes, 0 capacité propre, **écoute sur `0.0.0.0:5000` avec `debug=True`** — c'est la raison exacte de mort, elle suffit à elle seule. La formule « non démarrable » est vraie avec l'interpréteur du dépôt (`flask_cors` absent) et fausse là où le module *est* lancé : son lanceur pointe vers le venv d'une seconde copie du dépôt — **un accident d'environnement, pas une propriété**. Seule leur **coque** sert de référence de mise en page. **Ce fichier appartient au NOYAU** : la suppression est une opération inter-agents (`⚠️ DEMANDE` au journal, accord écrit avant l'étape 9), pas un effet de bord de la refonte. |
| `agent-ia-web/personas.py` | — | **ORPHELIN — décision requise** | à trancher par le NOYAU | Conséquence de la ligne ci-dessus : la suppression de `dashboard_app.py:30-32,50-51` **retire leur unique consommateur réel** à `personas.py`, `narrative_engine.py` et `meta_agent.py`. Hors lui : `validate_phase2.py` et `tests/test_phase2.py`, c'est-à-dire le banc qui les teste eux-mêmes. Recommandation du NOYAU : `personas.py` est redondant avec les 29 `agents/*.md` et `meta_agent.py` route vers des personas que le toolkit ne consomme pas — tous deux candidats au retrait, **mais la décision appartient au NOYAU et doit être écrite avant l'étape 9**. |
| `agent-ia-web/narrative_engine.py` | — | **ORPHELIN — décision requise** | à trancher par le NOYAU (recommandation : **conservé, avec un consommateur nommé**) | Seul moteur narratif du projet (3 actes, 500-800 mots) ; `agents/` du toolkit n'en a pas. La recommandation du NOYAU est l'option 2 : le garder comme bibliothèque avec un consommateur nommé côté production sociale longue (carrousels, articles), ce qui lui donne un second consommateur qui survit à la refonte **sans écrire une ligne de duplication**. |
| `agent-ia-web/meta_agent.py` | — | **ORPHELIN — décision requise** | à trancher par le NOYAU | Même cause. Ne rien décider est la seule option déconseillée : trois modules sans consommateur et sans décision deviennent la prochaine « copie périmée » (`AVIS-NOYAU §6.1`). |

**Ce qu'aucun de ces trois modules ne doit devenir : un module mort par
omission.** Ils ne figurent dans aucun des 9 postes du plan, et la refonte ne
les touche pas — mais la suppression de leur consommateur, si, et c'est une
décision à écrire, pas à découvrir après (`AVIS-NOYAU §6.1`, `SUPERVISION §6`).

### 2.4 Les trois magasins

**Règle absolue, écrite en tête de `noyau/db.py` et de `etat_cockpit.py` :**
*aucune donnée métier dans `etat.json`, aucun état d'interface dans la base.*

| Magasin | Chemin | Contenu | Propriétaire | Durée de vie | Sauvegarde |
|---|---|---|---|---|---|
| **Métier** | `~/Documents/eperf/eperf.db` | prospects, publications (contenu), identifiants, tombstones, événements, concurrents, veille, archives | l'application locale | indéfinie | copie quotidienne `.db.bak` + `VACUUM INTO` |
| **Exécution** | `~/Documents/eperf/etat.json` | tâches, brouillons, vues | `etat_cockpit.py` | tâches terminées 6 h, brouillons 30 j, vues jamais purgées | aucune — c'est de l'état de session |
| **Publication** | `api.eperformance.pro` | statut, `Post_ID`, `Erreur`, `Vues`, `Likes`, `Commentaires`, `Partages`, compteurs d'échecs | **le serveur LWS** | indéfinie | côté hébergeur (six scripts de sauvegarde en crontab) |
| **Secrets** | `~/.config/eperformance/secrets.env` | les clés et jetons | l'utilisateur | indéfinie | hors périmètre logiciel, `0600` |
| **Échange** | `export/*.csv` | projections de la base vers le PHP | généré | jetable | aucune |

**Les CSV ne disparaissent pas : ils changent de rôle.** `publications.csv` et
`prospects_tracking.csv` cessent d'être lus par l'interface et deviennent **le
format d'échange vers le PHP**, exportés à la demande :

```
 export à la demande                    lecture à l'ouverture
   eperf.db ──────► export/publications.csv ──────► LWS (upload)
   eperf.db ◄────── cache serveur ◄────────────── LWS (pull)
```

Une seule fonction produit le CSV (`services/publications.py:exporter_csv()`), et
elle est appelée par `sync_serveur.monter()`, jamais par une route d'affichage.
**Conséquence mesurable** : le défaut C9 de `AUDIT-M2 §5` (« 7 en local, 49 côté
serveur ») devient impossible, parce qu'il n'y a plus deux lectures concurrentes
du même objet.

### 2.5 Le schéma SQLite

Ouverture de chaque connexion, dans cet ordre :

```sql
PRAGMA journal_mode = WAL;      -- lecteurs concurrents pendant une écriture
PRAGMA synchronous = NORMAL;    -- WAL + NORMAL : un fsync par transaction, pas par écriture
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;     -- une écriture concurrente attend 5 s puis échoue proprement
```

```sql
-- ── Identité : la séquence monotone et le FORMAT, rien d'autre ───────────
CREATE TABLE identifiants (
  nom        TEXT    PRIMARY KEY,
  valeur     INTEGER NOT NULL,
  format     TEXT    NOT NULL,   -- PUB-%04d | PROS-%03d : le format est une DONNÉE
  maj        TEXT    NOT NULL
) STRICT;

-- La séquence n'est JAMAIS amorcée à 0 par le schéma (corrections 1 à 3 du
-- superviseur) : l'amorçage est le PREMIER acte de migration_002(), et il
-- s'écrit au-dessus du parc connu — serveur compris. Voir §2.8.
INSERT INTO identifiants (nom, valeur, format, maj)
VALUES ('PUB',  0, 'PUB-%04d',  datetime('now')),
       ('PROS', 0, 'PROS-%03d', datetime('now')),   -- %03d, PAS %04d
       ('TACHE', 0, 'TACHE-%04d', datetime('now'))
ON CONFLICT(nom) DO NOTHING;

-- Ce zéro est un point de départ de table VIDE, pas une autorisation
-- d'allouer. `migration_002()` refuse de tourner tant qu'il n'a pas été
-- remonté à max(local, serveur, tombstones) + 1 (§2.8).

-- ── Publications : le CONTENU appartient au local ────────────────────────
CREATE TABLE publications (
  id             TEXT PRIMARY KEY,          -- PUB-%04d, immuable à vie
  id_herite      TEXT,                      -- renseigné par la migration des collisions
  texte          TEXT NOT NULL,
  hashtags       TEXT NOT NULL DEFAULT '',
  cta            TEXT NOT NULL DEFAULT '',
  pilier         TEXT NOT NULL,
  plateforme     TEXT NOT NULL,
  format         TEXT NOT NULL DEFAULT '',
  objectif       TEXT NOT NULL DEFAULT '',  -- notoriete|credibilite|engagement|conversion|retention
  image_path     TEXT NOT NULL DEFAULT '',
  client         TEXT NOT NULL DEFAULT 'eperformance',
  date_prevue    TEXT,                      -- intention locale
  cree_le        TEXT NOT NULL,
  genere_par     TEXT NOT NULL DEFAULT '',  -- « deepseek · <agent> · <framework> »
  hash_contenu   TEXT NOT NULL,             -- sha256 du texte normalisé, ENTIER
  archive_ref    TEXT,                      -- clé d'archive anti-répétition
  cout_jetons    INTEGER NOT NULL DEFAULT 0,
  essais         INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX idx_pub_etat    ON publications(plateforme, pilier);
CREATE INDEX idx_pub_prevue  ON publications(date_prevue);

-- ── Cache serveur : champs dont le SERVEUR est propriétaire ──────────────
CREATE TABLE publication_cache_serveur (
  id             TEXT PRIMARY KEY REFERENCES publications(id) ON DELETE CASCADE,
  statut         TEXT,        -- brouillon|programmee|publiee|echouee|abandonnee
  post_id        TEXT,
  url_post       TEXT,
  publie_le      TEXT,
  vues           INTEGER,
  likes          INTEGER,
  commentaires   INTEGER,
  partages       INTEGER,
  erreur         TEXT,
  tentatives     INTEGER,
  date_confirmee TEXT,        -- la Date_Prevue telle que le serveur l'a acceptée
  vu_le          TEXT NOT NULL   -- horodatage du dernier pull : c'est ce qui rend la fraîcheur vérifiable
) STRICT;

-- ── Tombstones : une suppression ne libère jamais un identifiant ─────────
CREATE TABLE tombstones (
  id           TEXT PRIMARY KEY,
  supprime_le  TEXT NOT NULL,
  raison       TEXT NOT NULL,
  hash_contenu TEXT NOT NULL
) STRICT;

-- ── Archives : la mémoire anti-répétition du générateur ──────────────────
-- Importée de publications_archive.csv : 234 entrées, 227 empreintes uniques.
-- C'est le SEUL mécanisme anti-répétition du système (content_engine.py:1327
-- et :1937, `is_in_archive`). Sans cette migration, le générateur peut
-- reproduire un texte DÉJÀ PUBLIÉ. Migration : §6, étape 2.
CREATE TABLE archives (
  hash         TEXT PRIMARY KEY,            -- la colonne `Hash` du CSV : la clé de dédoublonnage
  pilier       TEXT NOT NULL DEFAULT '',
  plateforme   TEXT NOT NULL DEFAULT '',
  texte        TEXT NOT NULL DEFAULT '',
  publie_le    TEXT,
  importe_le   TEXT NOT NULL
) STRICT;

-- ── Prospects ────────────────────────────────────────────────────────────
CREATE TABLE prospects (
  id               TEXT PRIMARY KEY,        -- PROS-%03d (format %03d, JAMAIS %04d :
                                            -- c'est la chaîne que le webhook de réponses
                                            -- et lecture_csv.php?id=PROS-001 attendent)
  nom              TEXT NOT NULL DEFAULT '',
  page_facebook    TEXT NOT NULL DEFAULT '',
  numero_whatsapp  TEXT NOT NULL DEFAULT '',
  ville            TEXT NOT NULL DEFAULT '',
  secteur          TEXT NOT NULL DEFAULT '',
  niche            TEXT NOT NULL DEFAULT '',
  produit_interet  TEXT NOT NULL DEFAULT '',
  score            INTEGER NOT NULL DEFAULT 0,
  score_detail     TEXT NOT NULL DEFAULT '',
  statut           TEXT NOT NULL DEFAULT 'Nouveau',
  action_due       TEXT,                    -- action NOMMÉE, jamais un statut brut
  echeance         TEXT,
  source           TEXT NOT NULL DEFAULT 'cockpit',
  client           TEXT NOT NULL DEFAULT 'eperformance',
  test             INTEGER NOT NULL DEFAULT 0,   -- les 4 lignes de test de AUDIT-M1 §6.5
  cree_le          TEXT NOT NULL,
  maj_le           TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX idx_pros_tel ON prospects(numero_whatsapp)
  WHERE numero_whatsapp <> '';

-- ── Journal par prospect : quelle action, quand, par quel canal, résultat ─
CREATE TABLE prospect_journal (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  ts          TEXT NOT NULL,
  canal       TEXT NOT NULL,   -- whatsapp|telephone|manuel
  message     TEXT NOT NULL DEFAULT '',
  modele      TEXT NOT NULL DEFAULT '',
  resultat    TEXT NOT NULL,   -- envoye|repondu_positif|repondu_negatif|sans_reponse|bloque
  source      TEXT NOT NULL    -- local|serveur
) STRICT;

-- ── Événements : le registre du modèle D9 ────────────────────────────────
CREATE TABLE evenements (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ts       TEXT NOT NULL,
  domaine  TEXT NOT NULL,   -- publication|prospection|production|serveur|secrets|sante
  gravite  TEXT NOT NULL,   -- info|notable|grave|critique
  code     TEXT NOT NULL,   -- CONFLIT-IDENTITE, META-132001, SYNC-ECHEC, TACHE-ECHEC…
  message  TEXT NOT NULL,
  cause    TEXT NOT NULL DEFAULT '',
  action   TEXT NOT NULL DEFAULT '',
  cible    TEXT NOT NULL DEFAULT '',   -- l'ID de l'objet concerné
  source   TEXT NOT NULL,              -- local|serveur|lws|meta|deepseek|telegram
  tache_id TEXT,
  lu       INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE INDEX idx_ev_domaine ON evenements(domaine, gravite, ts DESC);

-- ── Concurrents : persistés, enfin ───────────────────────────────────────
CREATE TABLE concurrents (
  slug        TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  niche       TEXT NOT NULL DEFAULT '',
  url         TEXT NOT NULL DEFAULT '',
  grille      TEXT NOT NULL DEFAULT '{}',  -- 7 dimensions, avec état vide|hypothese|verifie
  opportunites TEXT NOT NULL DEFAULT '',
  analyse_le  TEXT,
  maj_le      TEXT NOT NULL
) STRICT;

-- ── Veille : conservée d'une passe à l'autre ─────────────────────────────
CREATE TABLE veille_resultats (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL,
  titre     TEXT NOT NULL,
  url       TEXT NOT NULL,
  source    TEXT NOT NULL,
  pays      TEXT NOT NULL,
  pilier    TEXT NOT NULL DEFAULT '',
  score     INTEGER NOT NULL DEFAULT 0,
  analyse   TEXT NOT NULL DEFAULT '',
  etat      TEXT NOT NULL DEFAULT 'propose'   -- propose|utilise|ecarte
) STRICT;
```

**Ce que le schéma interdit explicitement :**

1. **Aucune colonne `statut` dans `publications`.** Le statut vit dans
   `publication_cache_serveur`, et seulement là. C'est la traduction structurelle
   de D5 : on ne peut pas lire le mauvais registre parce qu'il n'y en a qu'un.
2. **Aucune table `taches`.** Une tâche est de l'état d'exécution : elle vit dans
   `etat.json` (règle L4). Le lien entre les deux se fait par le champ
   `evenements.tache_id`.
3. **Aucun `DELETE` sur `identifiants`.** La séquence ne recule jamais, et
   aucun `UPDATE` ne la fait reculer.
4. **`STRICT` partout.** SQLite typé : une chaîne dans une colonne INTEGER lève,
   au lieu de produire un `0` silencieux.
5. **Aucun format d'identifiant codé en dur dans le code.** Le format vit dans
   `identifiants.format` (`PUB-%04d`, `PROS-%03d`) : un `:04d` figé dans
   `allouer()` est ce qui a produit l'écart `PROS-%04d` contre `PROS-%03d`
   (`CONTRE-EXPERTISE §G1`).

### 2.6 L'objet publication unique — propriétaire par champ, provenance affichée

`services/publications.py` assemble **un** objet par publication, en joignant
`publications` (local) et `publication_cache_serveur` (serveur). Chaque champ a
**un** propriétaire, et l'objet porte la provenance.

| Champ | Propriétaire | Provenance affichée | Règle |
|---|---|---|---|
| `id` | **séquence locale** | `local` | immuable, jamais réattribué, jamais dérivé |
| `texte`, `hashtags`, `cta` | local | `local` | `SERVER_OWNED_FIELDS` ne les contient pas (`content_engine.py:2401`) |
| `image_path` | local | `local` | le serveur publie ce que le local a produit |
| `pilier`, `plateforme`, `format`, `objectif` | local | `local` | descriptifs de production |
| `client` | local | `local` | colonne nouvelle ; un seul client tant qu'il n'y en a qu'un |
| `date_prevue` | **local** | `local — non confirmée` | devient `serveur — confirmée` dès que le push a réussi |
| `statut` | **serveur** | `serveur` | local absent ou antérieur : affiché `inconnu` |
| `post_id`, `url_post`, `publie_le` | **serveur** | `serveur` | la preuve |
| `vues`, `likes`, `commentaires`, `partages` | **serveur** | `serveur` | écrits par le cron (`ENGINE:1882`), jamais par le local |
| `erreur`, `tentatives` | **serveur** | `serveur` | « 2 échecs sur 3 » — aujourd'hui invisible (`AUDIT-M4 §1.3`) |
| `cree_le`, `genere_par`, `cout_jetons`, `essais`, `hash_contenu`, `archive_ref` | local | `local` | la trace de production |

**La provenance est affichée, pas documentée.** Dans le tableau, chaque cellule
dont la valeur vient du serveur porte un `title` « serveur · lu il y a 12 min » ;
chaque cellule locale non confirmée porte un badge discret `non confirmé`. Le
pied de la page affiche une ligne unique :

```
Source : serveur (lu il y a 12 min) · 42 publications · contenu local · 3 non confirmées
```

**Fraîcheur.** `publication_cache_serveur.vu_le` est la seule horloge qui compte
pour le statut. Le bandeau n'affiche pas « à jour » sans elle : il affiche
« dernière synchro il y a N min », et au-delà de 15 minutes l'état passe à
`degrade` (§4.5). **C'est la correction directe de l'ignorance de
`AUDIT-M4 §1.3`** : l'utilisateur voyait `7 publications · 0 publiées` alors que
3 étaient sorties.

**Le pull automatique, trois déclencheurs :**

| Déclencheur | Quand | Coût |
|---|---|---|
| **au démarrage** | une fois, dans un fil, avant le premier rendu de `/aujourdhui` | un `GET` sur l'API PHP |
| **après chaque écriture** | après toute mutation de publication, dans la même tâche | un `POST` montant puis un `GET` descendant |
| **toutes les 5 minutes** | tâche planifiée dans le fil de fond | un `GET` descendant |

Le pull est **idempotent** et **unidirectionnel** sur les champs serveur : il
écrase `publication_cache_serveur`, jamais `publications`. Le motif existe déjà
et fonctionne (`ENGINE:2397-2490`, `SERVER_OWNED_FIELDS`) ; la refonte le rend
automatique et **le rend visible à l'écran**.

### 2.7 Machine à états unique

Cinq états, plus un tombstone.

```
                        ┌──────────────────────────────────────────┐
                        │                                          │
                   ┌────▼─────┐   programmer    ┌─────────────┐   │
    génération ───►│ brouillon│───────────────► │  programmee │   │
                   └────┬─────┘                 └──────┬──────┘   │
                        │                              │          │
                        │ publier maintenant           │ cron :   │
                        │ (facultatif)                 │ sortie   │
                        │                              ▼          │
                        │                        ┌───────────┐    │
                        └───────────────────────►│  publiee  │    │
                                                 └───────────┘    │
                                                                  │
                   échec serveur ────► ┌──────────┐                │
                                       │ echouee  │────────────────┘
                                       └────┬─────┘   reprogrammer
                                            │  3 échecs consécutifs
                                            ▼
                                       ┌────────────┐
                                       │ abandonnee │  (parking définitif)
                                       └────────────┘
                                            │
                    suppression ────────────▼────────────► tombstones
                                                          statut = supprimee
```

| État | Qui l'écrit | Ce que l'écran en fait |
|---|---|---|
| `brouillon` | local (génération) | onglet **À valider**, badge neutre, action « Relire » |
| `programmee` | local (écriture) puis **serveur** (confirmation) | onglet **Programmées**, groupé par jour, « 42 en retard sur 49 » visible |
| `publiee` | **serveur seul** (cron après succès réseau) | onglet **Publiées**, `Post_ID` en lien, métriques, écart prévu/réel |
| `echouee` | **serveur seul** (cron après échec) | onglet **Échecs**, message exact, « Réessayer » |
| `abandonnee` | **serveur seul** (3 échecs → parking) | onglet **Échecs**, section « Abandonnées », action « Rouvrir » |
| `supprimee` (tombstone) | local | nulle part, sauf dans l'onglet Archives / Sorties |

**Transitions légales, vérifiées par `services/machine_etats.py` :**

| De | Vers | Déclencheur | Autorisé |
|---|---|---|---|
| `brouillon` | `programmee` | action « Programmer » | oui |
| `brouillon` | `publiee` | action « Publier maintenant » (antidatage + `force_id`) | oui |
| `programmee` | `publiee` | cron | oui, **serveur seul** |
| `programmee` | `echouee` | cron | oui, **serveur seul** |
| `programmee` | `brouillon` | action « Annuler la programmation » | oui |
| `echouee` | `programmee` | action « Réessayer » (unitaire) | oui |
| `echouee` | `abandonnee` | 3 échecs consécutifs | oui, **serveur seul** |
| `abandonnee` | `programmee` | action « Rouvrir » | oui, avec avertissement |
| `publiee` | quoi que ce soit | — | **jamais** |
| n'importe quel | `supprimee` | action « Supprimer » | oui, écrit un tombstone |

**Ce que la machine supprime :** les cinq valeurs de `AUDIT-M4 §1.1`
(`brouillon`, `programmee`, `publie`, `echec`, `erreur`) et les dix statuts de
prospect librement exposés (`AUDIT-M1 §5.3`). L'interface n'a plus de `<select>`
de statuts : elle a des **actions nommées**, et le nom de l'état est une
conséquence, jamais une saisie.

### 2.8 Réparation de la collision d'identifiants

**Le défaut, mesuré.** `AUDIT-M4 §1.4` : sept identifiants communs entre
`TOOLKIT/publications.csv` et `SERVER/data/publications.csv` portent sept textes
différents, dont deux déjà `publie`. `generate_weekly_calendar()` renumérote à
partir de `PUB-0001` (`ENGINE:1810, 1849`), et le mode `append` recalcule
`f"PUB-{i:04d}"` (`APP:629-630`). Conséquence : le contenu neuf hérite du statut
`publie` d'un ancien, n'est jamais publié, et **remonte comme publié** au prochain
pull. C'est le défaut le plus grave du projet : il simule un succès.

**Rectification (19/09, corrections 1 à 3 du superviseur).** La version
antérieure de ce paragraphe était **inopérante** : la séquence était amorcée à
`0` et `allouer()` incrémentait puis lisait, donc la **première allocation
rendait `PUB-0001`** — l'identifiant même que le serveur détient déjà — et
`migration_002()` réattribuait à chaque ligne locale l'identifiant qu'elle
portait déjà. Le rapport affichait `renumerotees: 7` pour **0 réparation**. Ce
qui suit remplace ce texte et le remplace intégralement.

**L'amorçage — le premier acte, avant toute allocation :**

```python
# noyau/identifiants.py
def amorcer(nom: str, maximum_connu: int) -> int:
    """Remonte la séquence au-dessus de TOUT ce qui existe déjà.
    Idempotent, et jamais décroissant : un `UPDATE` qui ferait reculer la
    séquence est refusé (interdit n° 3 du schéma)."""
    with db.transaction() as c:
        c.execute("UPDATE identifiants SET valeur = MAX(valeur, ?), maj = datetime('now') "
                  "WHERE nom = ?", (maximum_connu, nom))
        return c.execute("SELECT valeur FROM identifiants WHERE nom = ?", (nom,)).fetchone()[0]


def maximum_connu(nom: str) -> int:
    """max(local, serveur, tombstones) — les TROIS sources, lues avant d'allouer.
    C'est la correction 1 : la séquence s'amorce au-dessus du parc, pas à 0."""
    motif = f"{nom}-%"
    local = db.lire("SELECT MAX(CAST(SUBSTR(id, ?) AS INTEGER)) FROM " + table_pour(nom),
                    (len(nom) + 2,), motif=motif)
    serveur = db.lire("SELECT MAX(CAST(SUBSTR(id, ?) AS INTEGER)) "
                      "FROM publication_cache_serveur WHERE id LIKE ?", (len(nom) + 2, motif))
    tombes = db.lire("SELECT MAX(CAST(SUBSTR(id, ?) AS INTEGER)) FROM tombstones "
                     "WHERE id LIKE ?", (len(nom) + 2, motif))
    return max(x or 0 for x in (local, serveur, tombes))
```

**L'allocation :**

```python
# noyau/identifiants.py
def allouer(nom: str = "PUB") -> str:
    """Alloue un identifiant neuf, monotone, jamais réutilisé.
    La monotonie vient de la base, pas d'un parcours de liste."""
    with db.transaction() as c:
        c.execute("UPDATE identifiants SET valeur = valeur + 1, maj = datetime('now') "
                  "WHERE nom = ?", (nom,))
        ligne = c.execute("SELECT valeur, format FROM identifiants WHERE nom = ?",
                          (nom,)).fetchone()
        if ligne is None:
            raise ErreurIdentite(f"séquence inconnue : {nom}")
        if ligne["valeur"] == 1:
            # Une allocation à 1 signifie que l'amorçage n'a pas eu lieu : on
            # refuse plutôt que de recréer PUB-0001 (`NC-1` du superviseur).
            raise ErreurIdentite(
                f"séquence {nom} non amorcée : appeler amorcer() au-dessus du parc connu")
        return (ligne["format"] % ligne["valeur"])   # le format est une DONNÉE
```

**Quatre interdits, contrôlés par les tests :**

1. **Jamais `len()`.** `PUB-{len(pubs)+1}` est le bug d'origine, corrigé
   localement dans `_next_pub_id` (`APP:441-453`) mais laissé vivant ailleurs.
2. **Jamais un index de boucle.** `f"PUB-{pid_counter:04d}"` avec
   `pid_counter = 1` (`ENGINE:1810`).
3. **Jamais réutilisé.** Un identifiant supprimé reste consommé.
4. **Jamais recalculé par lecture du contenu.** `max(ID)+1` comme **allocation**
   redevient faux dès qu'une purge a lieu ; la séquence est persistante par
   construction. La seule lecture de maximum autorisée est **l'amorçage**, et
   elle porte sur les **trois** sources (`local`, `serveur`, `tombstones`) :
   c'est une borne basse, jamais une attribution.

**Suppression = tombstone.** Supprimer une publication écrit une ligne dans
`tombstones` et supprime la ligne de `publications` :

```python
def supprimer(pub_id: str, raison: str) -> None:
    with db.transaction() as c:
        ligne = c.execute("SELECT hash_contenu FROM publications WHERE id = ?",
                          (pub_id,)).fetchone()
        if ligne is None:
            return                      # idempotent
        c.execute("INSERT INTO tombstones (id, supprime_le, raison, hash_contenu) "
                  "VALUES (?, datetime('now'), ?, ?) ON CONFLICT(id) DO NOTHING",
                  (pub_id, raison, ligne["hash_contenu"]))
        c.execute("DELETE FROM publications WHERE id = ?", (pub_id,))
```

Le tombstone sert à trois choses : refuser une réimportation depuis le serveur,
répondre « cette publication a été supprimée le … » au lieu d'un 404 muet, et
fournir la source de l'onglet Archives / Sorties.

**La garde d'identité au pull.** Règle exacte, dans `services/sync_serveur.py` :

```
pour chaque identifiant présent des DEUX côtés :
    si hash_contenu(local) != hash_contenu(serveur) :
        si statut_serveur ∈ { publiee, echouee, abandonnee } :
            → LA MONTÉE EST REFUSÉE pour cet identifiant
            → un événement CONFLIT-IDENTITE est écrit (gravite=critique)
            → l'interface réattribue un identifiant NEUF à la ligne locale
              (celle du serveur garde le sien, immuable)
        sinon :
            → la ligne locale est signalée « divergence de contenu, non protégée »
              dans la file du jour, zone A, avec l'action « Attribuer un ID neuf »
```

Le refus est **local à l'identifiant** : les 41 autres publications du lot
montent normalement. `CONFLIT-IDENTITE` apparaît immédiatement dans la file du
jour et dans le Journal, avec les deux empreintes et les deux textes tronqués à
80 caractères.

**La migration des 7 collisions existantes.** Exécutée par
`noyau/migrations.py:migration_002()` **après un pull serveur synchrone
explicite** (correction 3), enregistrée dans une table
`migrations(version, appliquee_le)`, donc **idempotente par le dispatcher** :

```python
def migration_002(c) -> dict:
    """Amorce la séquence au-dessus du parc, puis attribue un identifiant neuf
    à toute ligne locale qui partage son ID avec le serveur et porte un autre
    hash. Refuse de tourner sans cache serveur. Une seule fois, journalisée."""
    rapport = {"examinees": 0, "collisions_detectees": 0,
               "renumerotees": 0, "identiques": 0}

    # (b) — CORRECTION 2b : cache serveur vide ⇒ REFUS D'EXÉCUTER, pas 0 silencieux.
    # `publication_cache_serveur` est alimenté par le pull : sans lui, la boucle
    # ferait `continue` sur chaque ligne et la migration « réussirait » à zéro.
    if c.execute("SELECT COUNT(*) FROM publication_cache_serveur").fetchone()[0] == 0:
        evenements.ecrire(c, domaine="publication", gravite="critique",
                          code="MIGRATION-BLOQUEE",
                          message="cache serveur vide : lancer un pull d'abord",
                          cause="aucune donnée serveur disponible — la migration ne peut "
                                "pas distinguer une collision d'une ligne neuve",
                          action="lancer GET lire_publications.php, puis rejouer l'étape",
                          cible="migration_002", source="local")
        raise ErreurMigration("cache serveur vide : migration refusée")

    # (a) — CORRECTION 1 : la séquence s'amorce AU-DESSUS du parc connu.
    # Aucun identifiant alloué ensuite ne peut appartenir à l'ensemble serveur.
    amorcer("PUB", maximum_connu("PUB"))

    # (c) — CORRECTION 2a : ORDER BY id. Sans lui, l'ordre d'itération est
    # indéterminé et le premier `UPDATE` peut violer la clé primaire.
    for locale in c.execute("SELECT id, hash_contenu FROM publications "
                            "ORDER BY id").fetchall():
        rapport["examinees"] += 1
        serveur = c.execute("SELECT statut, post_id FROM publication_cache_serveur "
                            "WHERE id = ?", (locale["id"],)).fetchone()
        if serveur is None:
            continue
        if serveur["hash_contenu"] == locale["hash_contenu"]:
            rapport["identiques"] += 1
            continue
        rapport["collisions_detectees"] += 1
        neuf = allouer("PUB")
        c.execute("UPDATE publications SET id = ?, id_herite = ? WHERE id = ?",
                  (neuf, locale["id"], locale["id"]))
        c.execute("UPDATE publication_cache_serveur SET id = ? WHERE id = ?",
                  (neuf, locale["id"]))
        evenements.ecrire(c, domaine="publication", gravite="critique",
                          code="CONFLIT-IDENTITE",
                          message=f"{locale['id']} portait deux contenus : "
                                  f"renumerote en {neuf}",
                          cause="collision historique de identifiants",
                          action="verifier la publication serveur d'origine",
                          cible=neuf, source="local")
        rapport["renumerotees"] += 1

    # (d) — CORRECTION 2c : le rapport ÉCHOUE sur l'écart. Un compteur de
    # collisions supérieur au nombre de renumérotations est un rouge, jamais un vert.
    if rapport["collisions_detectees"] != rapport["renumerotees"]:
        raise ErreurMigration(
            f"{rapport['collisions_detectees']} collisions détectées, "
            f"{rapport['renumerotees']} réparées — la migration n'a pas tenu sa promesse")
    return rapport
```

**Trois règles d'exécution, non négociables (corrections 1 à 3 du superviseur) :**

| # | Règle | Ce qu'elle empêche |
|---|---|---|
| **R1** | La séquence est amorcée à `max(local, serveur, tombstones) + 1` **avant** toute allocation | `PUB-0001` réalloué ; sur la fixture réelle (7 locales, 49 serveur), les 7 lignes reçoivent un identifiant **≥ `PUB-0050`** |
| **R2** | La migration dépend d'un **pull synchrone explicite** — `GET lire_publications.php` en lecture, qui remplit `publication_cache_serveur` — exécuté **dans la même étape**. Serveur injoignable ⇒ **la migration ne s'exécute pas** et l'interface le dit (`MIGRATION-BLOQUEE`, raison + action), l'étape 2 finit en rouge **avec sa raison** | un vert à zéro ; un `publication_cache_serveur` vide que seul le service de l'étape 5 remplissait |
| **R3** | Le rapport distingue `examinees` / `collisions_detectees` / `renumerotees` et **échoue** si l'écart n'est pas nul | `renumerotees: 7` affiché pour 0 réparation |

**Décision assumée, et plus stricte que la garde courante :** la migration
renumérote **les sept**, y compris les cinq dont le statut serveur est
`programmee`. La garde d'exécution, elle, ne refuse que le triplet
`publiee|echouee|abandonnee` — c'est la règle D4, et elle ne bouge pas. La
migration est plus large parce qu'un identifiant dont le contenu diverge alors
que le serveur va **encore** le publier produirait exactement le même désastre
que `PUB-0004`, à retardement. Le rapport de migration est écrit dans
`evenements` et affiché une fois dans le Journal ; `id_herite` conserve la
trace de l'ancien identifiant pour toujours.

**Trois tests de non-régression, spécifiés :**

| Test | Ce qu'il monte | Ce qu'il vérifie | Ce qu'il empêche de revenir |
|---|---|---|---|
| **T1 — non-dérivation du comptage** | insère `PUB-0001`, `PUB-0002`, `PUB-0003` puis **amorce la séquence à 3** ; supprime `PUB-0002` ; appelle `allouer()` | l'identifiant retourné est `PUB-0004`, **pas** `PUB-0003` ; `PUB-0002` n'est jamais réattribué | le bug d'origine `PUB-{len(pubs)+1}` et le bug résiduel `max(ID)+1` |
| **T2 — non-renumérotation du calendrier** (version corrigée : l'ancienne attendait `PUB-0001…PUB-0049` en premier appel, c'est-à-dire **exactement le parc du serveur**) | fixture : séquence amorcée à 49 par la migration ; génère un calendrier de 49 publications deux fois de suite | le **premier** appel produit des identifiants **≥ `PUB-0050`** et n'en produit **aucun** de `PUB-0001…PUB-0049` ; le second produit la plage suivante | `ENGINE:1810` (`pid_counter = 1`) et `APP:629-630` (mode `append`) |
| **T3 — refus au pull** | fixture : `PUB-0007` local, texte A ; serveur `PUB-0007`, texte B, statut `publiee` | `sync_serveur.monter()` ne pousse pas cette ligne ; un événement `CONFLIT-IDENTITE` existe ; la ligne locale porte un identifiant neuf et `id_herite = 'PUB-0007'` | la réapparition de la collision, par n'importe quel chemin d'écriture |

**Trois tests ajoutés par les corrections 1 à 3 :**

| Test | Ce qu'il monte | Ce qu'il exige |
|---|---|---|
| **T4 — refus sur cache vide** | `publication_cache_serveur` vide | `migration_002()` **lève**, un événement `MIGRATION-BLOQUEE` existe avec sa raison et son action, et **aucune** ligne n'est renumérotée — jamais un « 0 renumérotée » vert |
| **T5 — rapport qui échoue sur l'écart** | fixture où une collision est détectée mais où l'`UPDATE` échoue | le rapport lève si `collisions_detectees != renumerotees` ; le test rejoue la fixture réelle (7 lignes locales, 49 serveur) et exige **7 identifiants ≥ `PUB-0050`**, `id_herite` renseigné, **aucun `UPDATE` sur une clé primaire existante** |
| **T6 — amorçage monotone** | séquence à `0`, 49 identifiants serveur connus | après `amorcer("PUB", maximum_connu("PUB"))`, la séquence vaut **49** et la première allocation rend `PUB-0050` ; un second appel de `amorcer()` avec une borne plus basse **ne fait pas reculer** la séquence |

`test_migration.py::test_idempotence` est écrit sur le **dispatcher**
(`noyau/migrations.appliquer()`), pas sur `migration_002()` : la fonction n'a
aucun garde interne, l'idempotence vient de la table `migrations(version)`
(`SUPERVISION §6, point 9`). Le test appelle donc le dispatcher deux fois et
vérifie que le second passage ne rejoue rien et n'écrit aucun événement.

### 2.9 La production — une seule chaîne, une seule porte

D10 : **une seule chaîne visuelle** et **une seule chaîne de contrôle
éditorial**, chacune branchée sur un bouton.

**Chaîne visuelle — `social_templates/`, et rien d'autre.**

| Ce qui entre | Ce qui décide | Ce qui contrôle | Ce qui sort |
|---|---|---|---|
| un texte + un objectif + une plateforme | `ST/publication.py:_gabarit_pour()` — déterministe par `sha256(gravé)[:4] % len(candidats)` | `ST/controleur.py` (8 postes pondérés, seuil 70) puis `ST/superviseur.py` (angle, accroche, promesse) | un PNG par slide, nommé `{id}-{gabarit}-{plateforme}[-n].png` |

Trois corrections, et trois seulement :

1. **Contrôle par slide.** `ST/publication.py:232` et `ST/lot.py:68` passent
   `fichiers[0]` : **68 % des images d'un lot échappent au contrôle**
   (`AUDIT-M3 §F3`, « les six carrousels produisent 30 des 44 images »). Le
   contrôle devient un **jeton unique** par slide, et la décision du lot
   (accepter/refuser) porte sur le **minimum** des scores, pas sur le premier.
   L'écran affiche 7 rapports pour un carrousel, pas un seul.
2. **Détection d'existence alignée.** `_image_exists_for_pub` teste aujourd'hui
   `{id}.png`, `{id}_slide_*.png`, `{id}/slide_*.png` — les conventions de la
   chaîne morte. La chaîne B nomme `{id}-{gabarit}-{plateforme}.png`
   (`ST/rendu.py:121-123`). Vérifié : `PUB-0001` a une image et la fonction
   renvoie `None` (`AUDIT-M3 §F2`). La détection devient un `glob` sur le motif
   réel, dans `services/production_visuelle.py`.
3. **`image_optimizer` branché.** La chaîne gabarits ne l'appelait jamais
   (`AUDIT-M3 §7.2`). Deux lignes dans `ST/rendu.py`, après la capture,
   `quality=85`, WebP sauf WhatsApp.

**L'atelier — les trois variantes A/B, repensées.** `variant_generator.py`
produisait des variables aléatoires de la chaîne morte ; il meurt. Les trois
variantes deviennent **les trois premiers gabarits candidats** du couple
(pilier, plateforme), chiffrés, avec le même texte : c'est des variantes de
mise en page, donc une comparaison qui a un sens. Le choix est enregistré dans
`/api/settings/ab-preference` et **alimente le hash de sélection** : la
préférence de l'utilisateur devient une entrée du choix déterministe, au lieu
d'un compteur décoratif.

**Chaîne de contrôle éditorial — branchée sur un bouton.** Aujourd'hui :
`grep "api/social" cockpit.html` renvoie **0 occurrence** (`AUDIT-M2 §6.3`).
Elle existe, elle note, elle juge, et aucune interface ne l'appelle. La refonte
fait de `/api/social/generer` l'action « Produire depuis un article » de l'écran
**Produire → Nouveau lot**, mode « depuis un article du blog ». Le superviseur
s'exécute pour tout lot, quel que soit le mode, et son verdict (5 critères ×
20 points) s'affiche dans l'atelier, **séparé du verdict technique**. Les deux
doivent passer pour qu'une publication soit publiable
(`ST/publication.py:246`).

### 2.10 La prospection

Un seul état par prospect, lu depuis une seule source, écrit par un seul
écrivain par champ.

| Champ | Propriétaire | Pourquoi |
|---|---|---|
| identité, page, ville, secteur, niche | local | saisi ou scrapé |
| téléphone normalisé | local, via `normalize_whatsapp` **à l'écriture** | appliqué systématiquement, ce qui n'est pas le cas aujourd'hui (`AUDIT-M1 §5.1`) |
| score et `score_detail` | local | barème lisible ; `A_Site_Web` et `Email` deviennent **saisissables**, sinon le barème reste décoratif (`AUDIT-M1 §2.2`) |
| statut | **serveur** (webhook de réponses) | `webhook_reponse.php` piloté par n8n est « la seule brique de la chaîne qui fonctionne en production » (`AUDIT-M1 §5.1`) |
| journal d'envois | local + serveur | une ligne par action, datée |
| `test` | local | les 4 lignes de test sur 22 sont exclues des KPI par défaut (`AUDIT-M1 §6.5`) |

**Le statut n'est plus un menu.** Les dix valeurs brutes (`prospect_app.py:90`)
deviennent des **actions nommées** : « J'ai envoyé le 1er message » · « Il a
répondu oui » · « Il a refusé » · « Ne plus contacter » · « Reporter ». La machine
à états reste interne. **Ce que cela répare** : `Froid` mélange aujourd'hui deux
situations opposées — jamais joignable et à réactiver dans 30 jours
(`AUDIT-M1 §4.1 F2`) — et trois prospects ayant répondu favorablement
s'affichent « Froid ».

**L'envoi cesse d'être un effet de bord.** `POST /api/send` génère un lien
`wa.me` **et** marque l'envoi dans le même geste. Deux actions distinctes les
remplacent : `POST /api/prospects/<id>/message` (aperçu + lien, **ne marque
rien**) et l'action nommée `envoye` (marque, journalise, décrémente le quota).
Aucun état ne peut plus dire « contacté » sans qu'un geste l'ait dit.

**Le garde-fou anti-ban reste**, mais il change de camp : il passe côté serveur,
dans `services/prospection.py`, alimenté par `prospect_journal`. Il cesse d'être
un fichier `rate_limit.json` que deux instances peuvent se disputer.

**Les réponses remontent en tête.** Une réponse positive
(`Repondu_Positif`, `En_Conversation`) est la première ligne de la zone C de la
file du jour, avec le message reçu et un bouton de passage en conversation. Le
webhook écrit dans la base locale **et** le pull le confirme.

### 2.11 Le contrat blog

Le blog n'est pas fusionné avec la publication : le blog **planifie des
articles**, la publication **planifie des postes**. Le point de jonction est un
seul contrat, pas un fichier partagé (`AUDIT-M4 §10.4`).

**Le problème mesuré.** `BLOG/_schedule.json` planifie 81 articles (5 par jour
du 18/09 au 03/10) et 81 dossiers existent sur le disque. `BLOG/chatbot-index.json`
a été généré le 18/09 à 10h40 et ne contient que **8 articles**, avec un drapeau
`published` vrai pour 8 entrées. `social_templates/remplisseur.py:47` lit
**l'index figé** : la production sociale est donc plafonnée à 8 sujets alors que
81 existent.

**Trois rôles, séparés :**

| Fichier | Rôle | Produit par | Nature |
|---|---|---|---|
| `_schedule.json` | **le plan** : heures, jours, slugs, drapeau `published` | la main de l'utilisateur | déclaratif |
| `chatbot-index.json` | **l'état de fait** : ce que le site sert réellement | le générateur du blog | dérivé |
| `services/blog.py` | **le lecteur du contrat** | cette refonte | lecture seule |

**Le contrat, écrit une fois :**

```python
# services/blog.py
def articles_publies() -> list[dict]:
    """Les articles réellement en ligne, d'après l'index GÉNÉRÉ.

    Retourne, par article : slug, titre, url, publie_le, illustration.
    Ne lit JAMAIS le drapeau `published` de _schedule.json, qui est un plan
    et non un état : AUDIT-M4 §10.4.
    """
```

**La divergence est signalée, pas absorbée.** Le module social lit l'écart entre
le plan et l'état de fait, et l'écrit comme un événement :

```
articles déclarés publiés dans _schedule.json mais absents de l'index :
  73 articles
→ événement BLOG-INDEX-RETARD, gravite=notable, action="régénérer l'index"
→ affiché dans Veiller → Idées, avec le compte et le lien vers la commande
```

**Décision :** `services/blog.py` lit l'index, et un contrôle de fraîcheur
refuse de servir une liste d'articles dont l'index a plus de 24 heures. Au-delà,
l'écran affiche « index du blog daté du 18/09 à 10h40 — 8 articles sur 81 »
avec l'action « Régénérer l'index ». C'est le module blog qui régénère ; la
refonte ne fait que **refuser de mentir** sur ce qu'il y a.

---

## 3. Carte module → destination

**Les onze modules du dashboard unifié.** C'est la décomposition retenue : onze
responsabilités, chacune avec ses routes, son service, ses écrans. Toute route
existante tombe dans exactement un module, et aucun module ne dépend d'un autre
module pour fonctionner.

| # | Module | Responsabilité en une phrase | Service |
|---|---|---|---|
| M1 | **Acquisition** | trouver des prospects et les faire entrer, avec un téléphone vérifié | `services/prospection.py` |
| M2 | **Pipeline** | faire vivre les 22 (puis N) prospects : score, séquence, réponses, hygiène | `services/prospection.py` |
| M3 | **Texte** | produire du texte contrôlé, un seul chemin | `services/production_texte.py` |
| M4 | **Visuel** | produire les images par la chaîne gabarits, contrôlées slide par slide | `services/production_visuelle.py` |
| M5 | **Publication** | l'objet unique, sa machine à états, sa synchronisation | `services/publications.py` |
| M6 | **Veille** | concurrents et idées, persistés | `services/veille.py`, `concurrents.py` |
| M7 | **Mesure** | ce qui est sorti, ce que ça a coûté, ce que ça a rapporté | `services/mesure.py` |
| M8 | **Blog** | le contrat `slug → article en ligne` | `services/blog.py` |
| M9 | **Tâches** | ce qui tourne, où ça en est, comment l'arrêter | `noyau/taches.py` |
| M10 | **Secrets et configuration** | fournisseur, clés, réglages, sans jamais exposer une valeur | `noyau/secrets.py` |
| M11 | **Socle** | rendu, jetons, polices, santé, événements, journal | `noyau/*`, `routes/ecrans.py` |

### 3.1 Tableau module → destination

| Module | Routes vivantes conservées | Routes fusionnées | Routes mortes | Écrans cibles |
|---|---|---|---|---|
| **M1 Acquisition** | `POST /api/scrape/{ads,maps,vcf}`, `POST /api/import`, `POST /api/update-phone` | les 3 `scrape/*` deviennent **1 route paramétrée** `POST /api/scrape/<source>` ; les 7 copies de `SECTOR_HOOKS` et les 3 générateurs J0 deviennent 1 registre et 1 générateur (`AUDIT-M1 §5.2`) | `prospect_scraper_v4.py`, `prospect_scraper_v5_authentique.py`, `real_research.py` | `#/acquerir/sources` (3 modes en puces) |
| **M2 Pipeline** | `GET /api/state`, `POST /api/add`, `POST /api/qualify`, `POST /api/generate-msg`, `POST /api/optimize-msg`, `GET /api/offer-pricing` | `POST /api/send` + `POST /api/status` + `POST /api/stop` → **1 route d'action nommée** `POST /api/prospects/<id>/action` | la colonne `Variation_Message` (tirage au sort qui ne change aucun message) ; `/api/qualify` sans effet devient une vraie qualification mise en cache | `#/acquerir/pipeline` + panneau de fiche (3 onglets) |
| **M3 Texte** | `POST /api/publications/generate`, `POST /api/social/articles`, `POST /api/social/generer`, `GET /api/agents`, `POST /api/analyze-competitor` | `content_engine` et `agents_engine` restent, mais **un seul point d'entrée** ; le mode `templates` meurt (`AUDIT-M2 §6.2`) ; `_build_hashtags` meurt et est remplacé | `content_pipeline_v2.py`, `content_engine._build_llm_prompt()` | `#/produire/nouveau` (mode « depuis un article ») + atelier |
| **M4 Visuel** | `POST /api/publications/<id>/image`, `POST /api/design/generate-image`, `GET /api/system-check` (partie visuelle) | les 6 routes qui passaient par `V3`→`DP` passent **toutes** par `social_templates` ; `variant_generator` meurt, l'intention A/B est reprise sur les gabarits | `design_pipeline.py`, `image_generator_v3.py`, `image_generator.py`, `variant_generator.py`, `video_generator.py` | `#/produire/atelier/<ID>` + `#/systeme/apparence` + `#/systeme/diagnostic` |
| **M5 Publication** | `GET /api/publications`, `POST /api/publications/<id>/edit`, `POST /api/publications/<id>/delete`, `POST /api/publications/<id>/schedule`, `POST /api/publications/<id>/publier-maintenant`, `GET /api/publications/archive`, `POST /api/publications/archive/clear`, `GET /api/publications/stats` | `schedule-all` + `reprogrammer-echecs` + `weekly-calendar` → **1 action « Planifier »** ; `sync-pubs` + `pubs-pull` + `/api/sync` → **1 synchronisation bidirectionnelle** | `build_dashboard.py`, `dashboard.html`, le mode `custom` (doublon strict de `single`), `delete-all` tel quel | `#/produire/publications` (4 onglets) + calendrier + journal |
| **M6 Veille** | `GET /api/veille`, `POST /api/analyze-competitor` | la veille cesse d'être un bouton sans mémoire : résultat persisté, pays corrigé (`BF` → `CI`), `url` et `analyse` affichés | `REDDIT_SUBREDDITS` (jamais lu) cesse d'être mort ; rien ne meurt, tout est réparé | `#/veiller/concurrents`, `#/veiller/idees` |
| **M7 Mesure** | `GET /api/ia/history`, `GET /api/quick/export-zip` | `analytics/summary` + `metrics_tracker` + métriques sociales → **1 route** `GET /api/mesure` (`AUDIT-M4 §9`) | `GET /api/ia/logs` (docstring : « simulé pour l'instant ») et `analytics/summary` (3 blocs sur 4 structurellement à zéro, `AUDIT-M4 §6.2`) ; `by_agent` indexé sur `"Agent:"` (`APP:1296`) ; le coût `0.002/0.005` sans source (`AUDIT-M3 §F11`) | `#/veiller/performance`, onglet `#/systeme/journal` |
| **M8 Blog** | `GET /api/social/articles` | rien à fusionner : un contrat à écrire (§2.11) | la lecture figée de `chatbot-index.json` sans contrôle de fraîcheur | panneau de `#/veiller/idees` |
| **M9 Tâches** | les 11 routes `/api/etat/*` | `POST /api/etat/tache` + `/fin` restent la plomberie ; le contrat public devient `/api/taches` (5 routes) | aucune : les 11 routes sont **branchées**, pas remplacées (`AUDIT-M5 §3.2`) | bandeau de tâches (permanent) + tiroir `t` |
| **M10 Secrets** | `GET /api/ia-config`, `GET /api/config/llm-status`, `POST /api/config/llm-test`, `POST /api/config/llm-provider`, `POST /api/ia-config`, `GET/POST /api/settings/*`, `POST /api/ia/config` | `ia-config` + `config/llm-provider` + `ia/config` → **1 registre** ; `ia-config` devient un alias de lecture (`ARCHITECTURE-ECRANS §9`) | les 11 jetons en clair (`AUDIT-M4 §D10`), `config_ia.json` et `config_api.json` purgés de leurs clés — **après la condition B (§4.3) et après la rotation** ; le registre de fournisseurs **ne supprime pas** le 3ᵉ palier (Claude) du noyau avant la reprise des 4 modules (§2.2) | `#/systeme/fournisseur`, `#/systeme/apparence` |
| **M11 Socle** | partiels `etat/*`, `GET /` (devient la page d'aujourd'hui) | les 3 dashboards → **1** (`cockpit.html` pour les jetons et la couverture, `templates_dashboard` pour la mise en page) | `cockpit.html`, `dashboard.html`, `agent-ia-web/dashboard_app.py`, `templates_dashboard/` — **⚠️ accord du NOYAU requis ; laisse trois modules orphelins, à trancher (§2.3)** | `base.html`, rail, bandeau, bandeau de santé, `#/systeme/diagnostic` |

### 3.2 Récapitulatif — aucune route ne disparaît sans remplacement

| | Routes | Dont conservées telles quelles | Dont contrat changé | Dont fusionnées | Dont disparues (remplacées) |
|---|---:|---:|---:|---:|---:|
| `prospect_app.py` | **75** | 44 | 12 | 14 | 5 |
| `dashboard_app.py` | **14** | 0 | 0 | 0 | 14 |
| **Total** | **89** | **44** | **12** | **14** | **19** |

Les 5 routes « disparues » de `prospect_app.py` ont chacune un remplacement
nommé (§5.3) ; les 14 de `dashboard_app.py` sont des doublons stricts, des
doublons fonctionnels ou des routes mortes (`AUDIT-M5 §2.2`).**

---

## 4. Services transverses

### 4.1 Les tâches longues

**La règle.** Toute opération dont la durée médiane dépasse **deux secondes** est
une tâche serveur nommée, datée, suivie, annulable et reprenable. Un toast ne
rend compte que d'une action immédiate et réversible dans les 8 s — et alors il
porte « Annuler » (`ARCHITECTURE-ECRANS §5.1`).

**Le contrat, cinq routes :**

| Route | Méthode | Entrée | Sortie | Statut |
|---|---|---|---|---|
| `/api/taches` | POST | `{nom, etape?, cible?, total?, reprise_de?}` | `201 {id, nom, etat, etape, fait, total, pourcent, debut}` | 201 |
| `/api/taches/<id>` | GET | — | `{id, nom, etat, etape, fait, total, pourcent, debut, fin, resultat, erreur, journal[20]}` | 200 / 404 |
| `/api/taches/<id>/annuler` | POST | — | `{id, etat:"annulation_demandee", fait, total}` | 200 / 409 si déjà finie |
| `/api/taches/<id>/reprendre` | POST | — | `{id, etat:"en_cours", fait, total, sautees}` | 200 / 409 |
| `/api/taches?etat=en_cours` | GET | `etat` (filtre), `limite` (défaut 50) | `{en_cours:[…], recentes:[…]}` | 200 |

**Les six états, et leur vocabulaire définitif :**

| État | Sens | Qui l'écrit |
|---|---|---|
| `en_cours` | la boucle tourne | le gestionnaire de tâche |
| `annulation_demandee` | le drapeau est posé, la boucle ne l'a pas encore lu | `POST …/annuler` |
| `annulee` | la boucle s'est arrêtée entre deux unités ; `fait` est conservé | le gestionnaire |
| `terminee` | toutes les unités sont écrites | le gestionnaire |
| `echouee` | une unité a levé, ou le plafond d'essais est atteint | le gestionnaire |
| `interrompue` | le processus a disparu avant la fin (détecté au démarrage suivant) | la reprise au démarrage |

**Migration de vocabulaire.** `etat_cockpit.py` écrit aujourd'hui `termine` et
`echoue`. Une table de correspondance, appliquée une fois par `noyau/taches.py`
au premier chargement, réécrit les entrées existantes
(`termine → terminee`, `echoue → echouee`). Aucune donnée n'est perdue : le
fichier peut être vide, mais la règle est écrite pour être vraie même s'il ne
l'est pas.

**Le journal borné à 20 lignes.** `tache_maj(tid, journal=[...])` remplace la
liste entière à chaque appel — pas d'ajout, pas de croissance. Vingt lignes
suffisent pour afficher « étape 4 sur 7 : slide 3 refusée, reprise » dans le
tiroir, et bornent le fichier. **Un `etat.json` qui grossit sans borne est un
fichier qui finira par casser la purge.**

**La reprise, et pourquoi elle est idempotente.** Le gestionnaire écrit chaque
unité **avant** de passer à la suivante, dans une transaction. La boucle est :

```python
for i, unite in enumerate(unites, start=1):
    if taches.annulation_demandee(tid):
        taches.terminer(tid, etat="annulee", fait=i - 1, total=len(unites))
        return
    if taches.deja_faite(tid, unite):        # reprise : on saute
        continue
    with db.transaction() as c:              # ← l'écriture d'abord
        resultat = travailleur(unite, c)
        taches.marquer_faite(c, tid, unite)  # ← le marqueur dans la MÊME transaction
    taches.maj(tid, etape=f"{libelle(unite)} ({i}/{len(unites)})",
               fait=i, total=len(unites), pourcent=int(92 * i / len(unites)))
```

Deux propriétés en découlent, et ce sont les seules qui comptent : une unité
faite n'est **jamais** refaite, et une unité à moitié faite n'existe **jamais**
(transaction). C'est ce qui rend `reprendre` sûr sans rejouer le lot.

**Le plafond de 92 %.** Conservé tel quel : `etat_cockpit.py:96-106` borne le
pourcentage à 92 tant que la tâche court, et ne laisse passer 100 que si
`etat == "terminee"`. La justification est écrite dans le module, elle est juste,
et elle n'est pas retouchée.

**Sérialisation des tâches visuelles.** Les tâches se répartissent en deux
files :

| File | Contenu | Parallélisme | Raison |
|---|---|---|---|
| **Texte** | génération de publications, veille, analyse, synchronisation | 4 fils | appels HTTP, indépendants |
| **Visuel** | toute tâche qui ouvre Chromium | **1 seul worker** | `ST/rendu.py:44-48` : « Playwright refuse deux contextes `sync_playwright()` imbriqués » |

Une tâche visuelle déposée pendant qu'une autre tourne attend en file, avec
l'état `en_cours` et l'étape « en attente d'un navigateur libre (position 2) ».
**L'utilisateur voit qu'il attend, il ne croit pas que rien ne se passe.** La
réutilisation du navigateur dans le worker visuel suit le modèle de `ST/lot.py`
(97-99) : un Chromium ouvert pour la tâche, réutilisé pour toutes ses unités, ce
qui supprime les **8 lancements de Chromium par carrousel** de
`AUDIT-M3 §F4`.

**Ce qui survit à quoi** — le tableau qui commande la conception :

| Événement | La tâche | L'interface | Ce qu'il reste à faire |
|---|---|---|---|
| **F5 (rafraîchissement)** | survit : elle est dans `etat.json`, sur le serveur | retrouve l'état par `GET /api/taches` au premier sondage | rien |
| **Onglet fermé** | survit : le fil serveur continue | à la réouverture, le bandeau de tâches annonce les tâches en cours | rien |
| **Coupure réseau locale** | survit : le fil ne dépend pas du navigateur | passe en « Reconnexion… », rattrape par sondage à 15 s | rien |
| **Plantage du navigateur** | survit : rien ne vivait dans le navigateur | idem onglet fermé | rien |
| **Plantage du serveur** | les unités écrites sont en base ; l'état reste `en_cours` | au démarrage suivant, l'état passe à `interrompue` et le bandeau propose « Reprendre les N restantes » | un clic |
| **Redémarrage de la machine** | idem plantage serveur | idem | un clic |
| **Redémarrage de la machine pendant une tâche visuelle** | le lot reprend au premier slide non fait ; le navigateur orphelin est tué par le worker au démarrage | idem | un clic |

**Purge — trois durées, jamais « jamais » :**

| Objet | Durée | Justification |
|---|---|---|
| tâches terminées (toutes issues) | **6 heures** | couvre une session de travail ; au-delà c'est un reste de plantage (`etat_cockpit.py:35`) |
| brouillons | **30 jours** | un brouillon d'il y a un mois n'a plus de valeur, et un fichier qui ne se vide jamais grossit sans fin |
| vues | **jamais purgées** | ce sont des préférences : filtre, tri, onglet ouvert. Quelques centaines d'octets. |

**Ce qui reste synchrone :** tout ce qui tient sous deux secondes — changer un
statut, écrire des notes, appliquer un filtre, lire une fiche, enregistrer une
préférence, une qualification mise en cache.

### 4.2 Persistance

| Question | Réponse |
|---|---|
| Qui écrit dans `eperf.db` ? | `noyau/db.py`, et lui seul. Les services passent par `db.transaction()`. |
| Un écrivain, plusieurs lecteurs ? | Oui. WAL autorise N lecteurs pendant une écriture. `busy_timeout = 5000` couvre la contention. |
| Une transaction par quoi ? | Par **unité de travail** (une publication générée, une unité de tâche, une action utilisateur). Jamais par lot. |
| Comment l'interface voit-elle du frais ? | Elle ne le suppose pas : `publication_cache_serveur.vu_le` porte l'horloge, l'affichage la montre. |
| Sauvegarde ? | `VACUUM INTO` quotidien vers `eperf-AAAA-MM-JJ.db`, rotation sur 14 jours, dans le fil de fond. |
| Retour arrière d'une migration ? | **Rectifié le 19/09 : voir §6.1.** « Impossible et assumé » était vrai de la *transaction* et faux du *produit* : cela ne disait pas comment revenir à l'ancien outil si le nouvel écran est mauvais, ni quoi faire si `migration_002` écrit des données **valides mais fausses** (elle renumérote 7 lignes : si la règle est mauvaise, l'original n'existe plus). Une migration est une transaction SQLite — elle passe entièrement ou pas du tout — **et** le produit garde une procédure de repli testée. |
| `etat.json` corrompu ? | Le module le déplace en `.corrompu.json` et repart d'un état vide (`etat_cockpit.py:43-51`). Propriété conservée. |
| Écriture atomique de `etat.json` ? | `mkstemp` dans le même répertoire puis `os.replace` (`etat_cockpit.py:57-70`). Conservée. |

**Chemins, surchargeables par variable d'environnement :**

```python
# noyau/chemins.py
EPERF_HOME = Path(os.environ.get("EPERF_HOME", Path.home() / "Documents" / "eperf"))
EPERF_DB   = Path(os.environ.get("EPERF_DB",   EPERF_HOME / "eperf.db"))
EPERF_ETAT = Path(os.environ.get("COCKPIT_ETAT", EPERF_HOME / "etat.json"))  # nom conservé
EPERF_SECRETS = Path(os.environ.get("EPERF_SECRETS",
                                    Path.home() / ".config" / "eperformance" / "secrets.env"))
```

`COCKPIT_ETAT` **garde son nom** : c'est une variable qui peut déjà exister dans
un profil utilisateur, et le module qui la lit est conservé (D7).
`EPERF_HOME` permet de faire tourner deux instances (8787 et 8788) sur des
données séparées — ce que `AUDIT-M5 §8` laissait « non établi » et qui devient
une possibilité explicite plutôt qu'un accident.

### 4.3 Secrets

**Un seul fichier**, `~/.config/eperformance/secrets.env`, permissions `0600`,
hors dépôt. Format `CLÉ=valeur`, une par ligne, commentaires `#`.

```bash
# ~/.config/eperformance/secrets.env      (0600, hors dépôt)
DEEPSEEK_API_KEY=…
ZAI_API_KEY=…
ANTHROPIC_API_KEY=…
EPERF_API_TOKEN=…          # jeton bearer de l'API PHP de production
EPERF_API_BASE=https://api.eperformance.pro
TELEGRAM_BOT_TOKEN=…
TELEGRAM_CHAT_ID=…
META_ACCESS_TOKEN=…
GITHUB_TOKEN=…
EPERF_ADMIN_TOKEN=…
```

**L'interface ne reçoit que des métadonnées.** `GET /api/secrets` renvoie, pour
chaque nom, jamais la valeur :

```json
{"secrets": [
  {"nom": "DEEPSEEK_API_KEY", "present": true,
   "empreinte": "sha256:3f9a1c07", "teste_le": "2026-09-19T14:02:11", "etat": "ok"},
  {"nom": "TELEGRAM_BOT_TOKEN", "present": false,
   "empreinte": null, "teste_le": null, "etat": "absent",
   "consequence": "aucune alerte ne peut être envoyée"}
]}
```

`empreinte` est `sha256(valeur)[:8]` : elle permet de vérifier **qu'une** clé a
changé sans jamais la révéler. `consequence` est obligatoire quand un secret
manque : c'est la traduction de l'état en effet observable, et elle alimente le
bandeau de santé (§4.5). **C'est le défaut le plus coûteux du projet transformé
en information** : le seul canal d'alerte avait un jeton vide et personne ne le
savait (`AUDIT-M4 §D16`).

**Les quatre sondes, une par usage réel :**

| Nom | Sonde | Coût | Ce qu'elle prouve |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | un appel `chat/completions` avec `max_tokens=1` | **1 jeton** | la clé est valide et le modèle répond |
| `META_ACCESS_TOKEN` | `GET /me` sur Graph | gratuit | le jeton est un jeton de page utilisable |
| `TELEGRAM_BOT_TOKEN` | `getMe` | gratuit | le bot existe et le jeton est celui du bon bot |
| `EPERF_API_TOKEN` | une **lecture** sur l'API PHP (`lire_publications.php`) | gratuit | le jeton autorise la lecture (jamais un test d'écriture) |

`POST /api/secrets/<nom>/tester` lance la sonde, écrit `teste_le` et `etat`
(`ok` · `invalide` · `absent` · `injoignable`), et écrit un événement. Les sondes
tournent **au démarrage** pour les quatre, puis à la demande.

**La sortie des onze emplacements de jeton en clair** est détaillée en annexe
(§7.2). En résumé : chaque occurrence est remplacée par un appel à
`noyau.secrets.lire("DEEPSEEK_API_KEY")` ou `noyau.secrets.lire("EPERF_API_TOKEN")`.
`config_ia.json` et `config_api.json` sont **purgés de leurs clés** (ils ne
gardent que le fournisseur actif et le modèle) ; `agent-ia-web/.env` passe en
`0600` et ses clés migrent vers `secrets.env`.

**⚠️ Condition bloquante AVANT la purge, et avant l'étape 4 (correction B).**
La purge de `config_ia.json` **casserait le backend chatbot en silence**, parce
que `unified-ia-backend/backend/core/llm_client.py:113-141` lit ce fichier
**avant** l'environnement et n'y retombe que s'il est **absent** : un fichier
présent mais vidé de ses clés ne déclenche **aucun repli**, et la clé DeepSeek
du backend disparaît sans erreur. Donc, **dans cet ordre** :

1. **Inverser l'ordre de résolution** : environnement (puis `secrets.env`)
   **d'abord**, fichier en **dernier recours** — et un fichier **présent mais
   vide** ne doit pas court-circuiter l'environnement.
2. **Appliquer la correction aux DEUX copies** (`unified-ia-backend/` et
   `docker-unified/unified-ia-backend/`, contrat **C12**, aujourd'hui
   `md5 93c26ce093d721eba3c8a513ba249553` de part et d'autre) **dans le même
   cycle**.
3. **Mesure de contrôle** : `md5sum` des deux copies identique, et
   `LLMClient().deepseek_key` non vide **avec** `config_ia.json` purgé.

Cette condition se lève **avant l'étape 4**, pas avant l'étape 1 : aucune des
trois valeurs de l'étape 1 ne dépend d'elle (`VALIDATION-CHATBOT §7, points 4
et 5`).

**Journalisation : jamais un en-tête d'authentification.**

```python
# noyau/journal.py
SECRETS_EN_MEMOIRE = frozenset(secrets.toutes_les_valeurs())

class FiltreSecrets(logging.Filter):
    """Retire toute valeur de secret d'un message, quelle que soit sa provenance."""
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        for valeur in SECRETS_EN_MEMOIRE:
            if valeur and valeur in message:
                message = message.replace(valeur, "«secret masqué»")
        record.msg, record.args = message, ()
        return True

INTERDITS = ("authorization", "x-api-key", "api-key", "token=", "key=")
```

Deux mécanismes, pas un : le filtre **retire les valeurs connues**, et un
`Formatter` qui refuse d'écrire une ligne contenant `Authorization`. Le
troisième filet : `EPERF_API_TOKEN` cesse d'être passé en paramètre d'URL
(`?key=…`, `APP:867`, `APP:2002`, `SERVER/cron_publications.php:79-84` — `AUDIT-M4
§D11`), parce qu'**un secret dans une chaîne de requête finit dans les journaux
d'accès**, et qu'aucun filtre côté application ne peut le rattraper.

### 4.4 Journalisation et erreurs

**Le modèle d'événement (D9).** Onze champs, stables :

| Champ | Type | Contenu |
|---|---|---|
| `ts` | texte ISO | l'horodatage, à la seconde |
| `domaine` | texte | `publication` · `prospection` · `production` · `serveur` · `secrets` · `sante` |
| `gravite` | texte | `info` · `notable` · `grave` · `critique` |
| `code` | texte | le code machine : `CONFLIT-IDENTITE`, `META-132001`, `SYNC-ECHEC`, `TACHE-ECHEC`, `SECRET-ABSENT`, `BLOG-INDEX-RETARD` |
| `message` | texte | ce qui s'est passé, en une phrase, sans jargon |
| `cause` | texte | pourquoi, quand elle est connue |
| `action` | texte | ce qu'il faut faire — **jamais vide pour `grave` et `critique`** |
| `cible` | texte | l'identifiant de l'objet concerné (`PUB-0004`, `PROS-0012`) |
| `source` | texte | `local` · `serveur` · `lws` · `meta` · `deepseek` · `telegram` |
| `tache_id` | texte | la tâche qui l'a produit, si elle existe |
| `lu` | entier | acquittement |

**Les exceptions typées.** Quatre classes, dans `noyau/erreurs.py`, chacune
traduite en un état de santé et une action :

| Exception | Ce qu'elle signifie | Effet sur la santé |
|---|---|---|
| `ErreurMetier` | la demande est impossible (statut illégal, identifiant inconnu) | aucun — c'est un 400 |
| `ErreurExterne` | un système distant n'a pas répondu ou a refusé (Meta, DeepSeek, LWS) | `degrade` ou `panne` selon le domaine |
| `ErreurConfig` | un secret manque ou est invalide | `panne` avec la conséquence écrite |
| `ErreurIdentite` | collision, réattribution, séquence inconnue | `panne` — c'est le seul cas où publier peut mentir |

Le handler commun écrit **toujours** un événement avant de rendre la réponse.
Un utilisateur qui voit « une erreur est survenue » sans ligne dans le Journal
est un défaut, pas une fatalité.

**Cinq emplacements d'affichage de l'erreur** (D9) :

| # | Emplacement | Ce qui y apparaît |
|---|---|---|
| 1 | **bandeau de santé**, en haut de tous les écrans | l'état et la liste des raisons |
| 2 | **file du jour**, zone A « Ce qui bloque » | une ligne par cause bloquante, avec l'action |
| 3 | **à l'endroit de l'objet** | la ligne de publication porte sa raison d'échec tronquée à 80 caractères, jamais « une erreur » |
| 4 | **tiroir de tâches** | la tâche en échec, son journal de 20 lignes, son action |
| 5 | **Journal** (`#/systeme/journal`) | l'historique complet, filtrable par domaine, gravité et date |

**Règle d'écriture :** un événement `grave` ou `critique` sans `action`
non vide échoue au test. Une alerte qui ne dit pas quoi faire est du bruit, et
c'est précisément ce que le projet produit aujourd'hui : rien.

### 4.5 Santé

`GET /api/sante` calcule **`ok | degrade | panne | inconnu`** et retourne toujours
la liste des raisons.

```json
{"etat": "degrade",
 "calcule_le": "2026-09-19T14:07:02",
 "raisons": [
   {"code": "SYNC-RETARD", "gravite": "grave",
    "message": "dernière synchronisation serveur il y a 41 min",
    "seuil": "15 min", "action": "Synchroniser"},
   {"code": "SECRET-ABSENT", "gravite": "critique",
    "message": "TELEGRAM_BOT_TOKEN absent",
    "consequence": "aucune alerte ne peut être envoyée",
    "action": "Renseigner le jeton"}
 ]}
```

**Les quatre conditions d'un `ok`, toutes obligatoires :**

| Condition | Seuil | Ce qu'elle détecte |
|---|---|---|
| dernière synchronisation serveur | **< 15 min** | le pull s'est arrêté |
| heartbeat du cron | **< 2 h** | le cron LWS est mort ou bloqué |
| publications `abandonnee` | **zéro** | un post a été parqué définitivement |
| chaque fournisseur testé | **< 24 h** | une clé a expiré ou a été révoquée |

**Un seul seuil manqué ⇒ l'état n'est plus `ok`.** Si l'information n'existe pas
(jamais testé, jamais synchronisé — le cas d'une première installation), l'état
est `inconnu`, **pas** `ok`. Règle L10 : l'absence d'information ne vaut jamais
quitus.

| État | Déclencheur | Rendu |
|---|---|---|
| `ok` | les quatre conditions réunies | bandeau discret, gris, une ligne |
| `degrade` | une condition manquée non bloquante (sync en retard, fournisseur non testé depuis 24 h) | bandeau ambre + la liste des raisons + « Resynchroniser » |
| `panne` | cron mort, publication abandonnée, secret critique absent, identifiant en conflit | bandeau rouge + les raisons + l'action de chacune |
| `inconnu` | aucune mesure disponible (première installation, base vide, serveur jamais joint) | bandeau neutre : « état inconnu — jamais synchronisé » + « Tester maintenant » |

**Le cas d'acceptation `#132001`.** C'est le scénario qui a motivé D9, et il est
spécifié comme test.

Situation : Meta refuse un envoi parce que le modèle de message WhatsApp n'est
pas approuvé (`#132001`). Le cron estampille la publication, incrémente le
compteur d'échecs, et au troisième essai la parke en `abandonnee`. Pendant ce
temps, l'interface affichait un état normal, et le seul canal d'alerte
(Telegram) avait un jeton vide — **l'alerte n'arrivait nulle part**
(`AUDIT-M1 §4.1 F3`, `AUDIT-M4 §D16`).

Comportement exigé après refonte, dans l'ordre :

1. **Le pull suivant** lit `statut = abandonnee` et `erreur =
   "#132001 — template non approuvé"` dans le cache serveur.
2. `services/sante.py` voit une publication `abandonnee` : l'état global n'est
   plus `ok`. Il écrit un événement
   `{domaine: "publication", gravite: "critique", code: "META-132001",
   cause: "modèle de message non approuvé", action: "Approuver le modèle dans
   Meta Business, puis rouvrir la publication", cible: "PUB-00xx",
   source: "serveur"}`.
3. **Emplacement 1** — le bandeau de santé passe en `panne`, avec la raison.
4. **Emplacement 2** — la file du jour, zone A, affiche : « Un modèle de message
   Meta est refusé — 1 publication abandonnée · Approuver le modèle dans Meta ».
5. **Emplacement 3** — la ligne de la publication, dans l'onglet Échecs, porte
   `#132001 — modèle non approuvé` sur 80 caractères et le bouton « Rouvrir ».
6. **Emplacement 5** — le Journal porte l'événement, filtrable par
   `domaine=publication`, `gravite=critique`.
7. `TELEGRAM_BOT_TOKEN` manquant est **aussi** une raison affichée, avec sa
   conséquence écrite : « aucune alerte ne peut être envoyée ». Le canal mort
   est visible avant d'être nécessaire.
8. **Aucun `<select>` de statut n'a été touché.** L'utilisateur n'a rien eu à
   deviner : l'outil a nommé la cause, l'objet et l'action.

Test de non-régression : `tests/test_sante.py::test_132001` — une fixture avec
une publication `abandonnee` sur erreur `#132001` doit produire
`etat != "ok"`, exactement un événement `META-132001`, et une raison dans
`/api/sante` dont l'`action` est non vide.

---

## 5. Routes cibles

Quatre tableaux, 89 routes existantes classées, plus les routes créées. Les
colonnes sont : méthode, entrée, sortie, appelant.

### 5.1 Conservées — 44 routes, contrat inchangé

Méthode, entrée et sortie **identiques** à l'existant. Ce qui change : elles
cessent d'être appelées depuis un `onclick` inline et le sont depuis un partiel
Jinja ou une action htmx.

| Route | Méthode | Entrée | Sortie | Appelant |
|---|---|---|---|---|
| `/api/state` | GET | — | état complet (prospects, stats, due_ids, taux, quota) | `aujourdhui.html`, `pipeline.html` |
| `/api/add` | POST | `{phone, nom?, page?, ville?, secteur?, site?}` | `{ok, id}` | panneau Nouveau prospect |
| `/api/import` | POST | `{items:[…]}` | `{ok, imported, doublons}` | onglet Sources, action « Importer la sélection » |
| `/api/update-phone` | POST | `{id, phone}` | `{ok}` | fiche prospect |
| `/api/qualify` | POST | `{id}` | `{ok, score, priorite, action, raisons, icp_fit}` | onglet Qualification (mis en cache) |
| `/api/generate-msg` | POST | `{id, seq}` | `{ok, variantes:[AIDA,PAS,BAB], analyse}` | onglet Messages |
| `/api/optimize-msg` | POST | `{msg}` | `{ok, suggestions, biais}` | onglet Messages, replié |
| `/api/offer-pricing` | GET | — | `{ok, offres, pricing}` | panneau `#/prix` |
| `/api/publications` | GET | `statut?`, `plateforme?`, `q?` | `{ok, count, publications}` | `table_publications.html` — **enfin appelée avec ses filtres** |
| `/api/social/articles` | GET | — | `{ok, articles:[{slug,titre,url,objectif,gabarit}]}` | Nouveau lot, mode « depuis un article » |
| `/api/social/generer` | POST | `{slug, plateforme?, pilier?}` | `{ok, publication}` | Nouveau lot, mode « depuis un article » |
| `/api/publications/<id>/schedule` | POST | `{date_prevue}` | `{ok, sync_warning?}` | onglet À valider, action « Programmer » |
| `/api/publications/<id>/delete` | POST | `{raison?}` | `{ok}` (écrit un tombstone) | menu de ligne, confirmation en deux temps |
| `/api/publications/<id>/edit` | POST | `{texte}` | `{ok}` | atelier, éditeur en place |
| `/api/publications/<id>/publier-maintenant` | POST | `{confirme:true}` | `{ok, statut, post_id?, erreur?}` | onglet Programmé, action « Publier maintenant » |
| `/api/publications/archive` | GET | `q?`, `limite?`, `offset?` | `{ok, total, stats, archive[…]}` | onglet Archives — **paginé, plus tronqué à 50** |
| `/api/publications/archive/clear` | POST | `{confirme:true}` | `{ok, supprimees}` | zone dangereuse de Préférences |
| `/api/agents` | GET | — | `{ok, agents:[…]}` | onglet Compétences — **enfin appelée** (`AUDIT-M5 §2.3`) |
| `/api/publications/stats` | GET | — | `{ok, total, par_statut, programmees_aujourd_hui}` | en-tête de Publications |
| `/api/ia-config` | GET | — | `{ok, provider, providers_disponibles, models}` | onglet Fournisseur, **alias de lecture** |
| `/api/ia-config` | POST | `{provider}` | `{ok, provider}` | onglet Fournisseur (écrit désormais le même registre que `llm-provider`) |
| `/api/config/llm-status` | GET | — | `{ok, provider, stats, teste_le}` | bandeau (badge fournisseur) |
| `/api/config/llm-provider` | POST | `{provider}` | `{ok, provider, teste_le}` | onglet Fournisseur, action « Choisir » — **registre unique** |
| `/api/config/llm-test` | POST | `{}` | `{ok, latence_ms, modele}` | ouverture de l'onglet Fournisseur |
| `/api/ia/status` | GET | — | `{ok, fournisseurs:[…]}` — **sans emoji** | onglet Journal, sous-onglet État des API |
| `/api/ia/history` | GET | `limite?` | `{ok, historique:[…]}` | onglet Journal, sous-onglet Historique |
| `/api/settings/templates` | GET | — | `{ok, templates, mapping}` | Apparence, sous-onglet Templates |
| `/api/settings/templates` | POST | `{pilier, template}` | `{ok}` | Apparence, sous-onglet Templates |
| `/api/settings/upload-icon` | POST | `multipart` (≤ 50 Ko) | `{ok, nom, grille}` | Apparence, sous-onglet Icônes |
| `/api/settings/colors` | GET | — | `{ok, colors}` | Apparence, sous-onglet Couleurs — **chargé à l'ouverture** |
| `/api/settings/colors` | POST | `{pilier, couleurs}` | `{ok}` | Apparence, sous-onglet Couleurs |
| `/api/settings/ab-preference` | POST | `{image_a, image_b, preference}` | `{ok}` | atelier, comparaison A/B — **alimente le hash de gabarit** |
| `/api/quick/export-zip` | GET | `mois?` | archive ZIP | onglet Archives, action « Exporter le mois » |
| `/api/etat/resume` | GET | — | `{taches_en_cours, brouillons, fichier}` | bandeau, au démarrage |
| `/api/etat/taches` | GET | — | `{en_cours:[…], recentes:[…]}` | tiroir de tâches |
| `/api/etat/tache` | POST | `{nom, etape?}` | `{id}` | `noyau/taches.py` (interne) |
| `/api/etat/tache/<tid>` | POST | `{etape?, pourcent?, resultat?, etat?}` | tâche | `noyau/taches.py` (interne) |
| `/api/etat/tache/<tid>/fin` | POST | `{resultat?, erreur?}` | tâche | `noyau/taches.py` (interne) |
| `/api/etat/brouillons` | GET | — | `{brouillons:[…]}` | tiroir de tâches, zone « brouillons » |
| `/api/etat/brouillon/<cle>` | GET | — | brouillon ou 404 | atelier, à l'ouverture |
| `/api/etat/brouillon/<cle>` | POST | `{texte, meta?}` | brouillon | `app.js:brouillon()` toutes les 2 s |
| `/api/etat/brouillon/<cle>` | DELETE | — | `{supprime}` | atelier, action « Jeter » |
| `/api/etat/vue/<nom>` | GET | — | `{etat}` | politique de filtre, à l'ouverture |
| `/api/etat/vue/<nom>` | POST | `{etat}` | `{nom, etat}` | `app.js`, à chaque changement de filtre |

**Note sur les onze routes `/api/etat/*`.** Elles restent la plomberie interne
du registre, inchangée et conservée (D7). Le contrat public de l'interface est
`/api/taches` (§5.4), qui lit le même fichier et expose en plus l'annulation, la
reprise et le journal borné. Les deux vivent, elles ne se remplacent pas : la
première est appelée par le code, la seconde par l'utilisateur.

### 5.2 Contrat changé — 12 routes, `202 {tache}`

**Le contrat, écrit une fois :** la route valide sa forme d'entrée, crée la
tâche, écrit l'événement `TACHE-CREEE`, et rend **en moins d'une seconde** :

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{"ok": true, "tache": "t_9f2a4c81d0e3", "nom": "Génération de 7 publications",
 "etat": "en_cours", "total": 7, "suivi": "/api/taches/t_9f2a4c81d0e3"}
```

L'interface ne bloque plus, ne montre plus de `spinner`, et le bandeau de tâches
affiche la ligne immédiatement. Le corps de la réponse précédente (qui portait le
résultat) est déplacé dans `GET /api/taches/<id>` → `resultat`.

| Route | Méthode | Entrée | Sortie | Durée mesurée avant |
|---|---|---|---|---|
| `/api/publications/generate-batch` | POST | `{nombre, plateformes, piliers, objectif}` | `202 {tache}` | 1 à 3 min (`AUDIT-M2 §4 D1`) |
| `/api/publications/weekly-calendar` | POST | `{date_base, mode:"planifier", incrément}` | `202 {tache}` | **5 min** pour 49 (`AUDIT-M2 §5 A1`) |
| `/api/publications/generate-all-images` | POST | `{ids:[…], force:bool}` | `202 {tache}` | ~20 s × N (`AUDIT-M3 §1.4`) |
| `/api/publications/<id>/image` | POST | `{force?}` | `202 {tache}` | moyenne **19,7 s**, max 56,4 s |
| `/api/quick/full-post` | POST | `{sujet?, pilier?, plateforme?}` | `202 {tache}` | texte + image, > 30 s |
| `/api/quick/weekly-batch` | POST | `{piliers?}` | `202 {tache}` | ~38 s (`AUDIT-M2 §5 A1`) |
| `/api/quick/batch-video` | POST | `{ids?}` | `202 {tache}` | ffmpeg × N, minute |
| `/api/quick/retry-failed` | POST | `{ids?}` | `202 {tache, fait, restants}` | N × 20 s |
| `/api/design/generate-image` | POST | `{texte, plateforme, pilier, objectif}` | `202 {tache}` | moyenne 19,7 s |
| `/api/design/generate-variants` | POST | `{texte, plateforme, pilier, n:3}` | `202 {tache}` | 3 × 20 s |
| `/api/design/image-to-video` | POST | `{image_path, animation}` | `202 {tache}` | ffmpeg, > 10 s |
| `/api/veille` | GET | `pays?` (défaut `CI,BF`) | `202 {tache}` | **48,7 s mesurées** (`AUDIT-M4 §5.2`) |

**Deux points de conception qui évitent des surprises :**

1. **Ce sont des `POST`.** `GET /api/veille` change de méthode : une route qui
   crée une tâche n'est pas idempotente et n'a rien à faire en `GET`. Le clic
   devient un `hx-post`.
2. **Le nom de la tâche est le libellé de l'action.** « Génération de 7
   publications », « Veille », « Conversion en vidéo » — jamais
   « generate-batch ». C'est ce nom que le bandeau affiche et que le journal
   conserve.

**Six routes suivent le même contrat à la session 6**, hors quota des douze
parce qu'elles sont déjà réécrites par ailleurs : `POST /api/publications/planifier`
(fusion `schedule-all` + `reprogrammer-echecs`), `POST /api/sync-serveur`
(fusion `sync-pubs` + `pubs-pull` + `/api/sync`), `POST /api/scrape/<source>`,
`POST /api/concurrents` (fusion `analyze-competitor`) et les deux routes de
diagnostic (`system-check` et le diagnostic visuel).

### 5.3 Disparues — 5 routes, chacune remplacée

| Route | Méthode | Entrée | Sortie | Ce qui la remplace | Justification |
|---|---|---|---|---|---|
| `/` | GET | — | **fichier `cockpit.html` lu sur le disque** | `GET /aujourdhui` + les 4 autres destinations, rendues par Jinja | `AUDIT-M5 §1.2` : la route lit le fichier à chaque requête, ce qui permet à deux instances de servir deux versions différentes |
| `/api/publications/generate` | POST | `{pilier, plateforme}` | `{ok, publication}` | `POST /api/publications/generate-batch` avec `{nombre: 1}` | `AUDIT-M5 §2.3` : vestige, l'UI passe déjà par `generate-batch` ; deux chemins pour le même acte |
| `/api/publications/delete-all` | POST | `{confirm:true, statut?}` | `{ok, deleted}` | `POST /api/publications/supprimer` (liste d'identifiants, tombstones, synchronisation bloquante) + la zone dangereuse de `#/systeme/preferences` | `AUDIT-M4 §8 D4` : dangereux **et** inefficace ; le serveur garde tout et le pull réimporte |
| `/api/ia/logs` | GET | — | `{ok, logs:[…]}` | `GET /api/journal` (événements réels, filtrables) | le docstring du code dit lui-même : « Retourne les logs récents (**simulé pour l'instant**) ». Une route qui fabrique ses données n'a pas à vivre |
| `/api/analytics/summary` | GET | — | `{ok, summary, by_pillar, by_agent, timeline, provider_stats}` | `GET /api/mesure` | `AUDIT-M4 §6.2` : trois des quatre blocs sont **structurellement à zéro** (coût `0.0`, timeline à 0, `by_agent` vide car indexé sur `"Agent:"`), et aucune des deux mesures utiles (métriques sociales, publications sorties) n'y figure |

### 5.4 Créées

**Pages (Jinja, HTML complet) :**

| Route | Méthode | Entrée | Sortie | Appelant |
|---|---|---|---|---|
| `/aujourdhui` | GET | — | la file du jour, en un paint | ouverture par défaut ; `#/` y redirige |
| `/produire/publications` | GET | `?onglet`, `?q`, `?statut`, `?plateforme` | page Publications | rail |
| `/produire/nouveau` | GET | `?mode`, `?article`, `?pilier` | formulaire de lot | bouton primaire de Publications |
| `/produire/atelier/<id>` | GET | — | l'atelier d'une publication | ligne de tableau, `Entrée` |
| `/produire/lot/<tache>` | GET | — | le suivi d'un lot | bandeau de tâches, « Voir » |
| `/acquerir/pipeline` | GET | `?filtre`, `?q`, `?tri` | la grille de prospects | rail |
| `/acquerir/sources` | GET | `?mode` | le formulaire d'import + résultats | bouton primaire de Pipeline |
| `/acquerir/messages` | GET | — | les 4 séquences, lisibles | onglet |
| `/veiller/concurrents` | GET | `?q`, `?slug` | liste + comparaison | rail |
| `/veiller/idees` | GET | — | veille persistée + articles du blog | onglet |
| `/veiller/performance` | GET | `?periode` | le tableau de mesure | onglet |
| `/systeme/fournisseur` | GET | — | le registre unique | rail |
| `/systeme/competences` | GET | — | agents et compétences, état réel | onglet |
| `/systeme/apparence` | GET | `?sous` | templates, couleurs, icônes, A/B | onglet |
| `/systeme/preferences` | GET | — | réglages + zone dangereuse | onglet |
| `/systeme/journal` | GET | `?domaine`, `?gravite` | état des API, événements, historique, tâches | onglet |
| `/systeme/diagnostic` | GET | — | les vérifications, avec cause et correctif | **tout** état d'erreur |
| `/prix` | GET | — | offres et pricing | panneau |
| `/partiel/*` | GET | selon le partiel | **un fragment HTML** | htmx (`hx-get`) |

**API :**

| Route | Méthode | Entrée | Sortie | Appelant |
|---|---|---|---|---|
| `/api/taches` | POST | `{nom, etape?, total?, cible?}` | `201 {id, …}` | service, et action nommée |
| `/api/taches` | GET | `?etat`, `?limite` | `{en_cours, recentes}` | `app.js:sondage()` |
| `/api/taches/<id>` | GET | — | tâche + `journal[20]` + `resultat` | tiroir de tâches, `#/produire/lot/<tache>` |
| `/api/taches/<id>/annuler` | POST | — | `{etat:"annulation_demandee"}` | bandeau de tâches |
| `/api/taches/<id>/reprendre` | POST | — | `{etat:"en_cours", sautees}` | file du jour, zone D |
| `/api/sante` | GET | — | `{etat, raisons[…]}` | bandeau, toutes les pages |
| `/api/secrets` | GET | — | `{secrets:[{nom, present, empreinte, teste_le, etat, consequence?}]}` | onglet Préférences, Diagnostic |
| `/api/secrets/<nom>/tester` | POST | — | `{nom, etat, latence_ms, teste_le}` | Diagnostic, onglet Préférences |
| `/api/journal` | GET | `?domaine`, `?gravite`, `?depuis`, `?limite` | `{evenements:[…]}` | onglet Journal |
| `/api/aujourdhui` | GET | — | `{titre, bloque[], echoue[], decision[], tourne[], pied}` | `/aujourdhui`, un seul appel |
| `/api/prospects/<id>/action` | POST | `{action, valeur?, canal?}` | `{ok, statut, action_due, echeance}` | fiche prospect, actions nommées |
| `/api/prospects/<id>/message` | POST | `{seq, variante?}` | `{ok, texte, lien_wa}` — **ne marque rien** | fiche prospect, « Aperçu » |
| `/api/prospects/<id>/fiche` | GET | — | fiche complète (qualification en cache, messages, journal d'envois) | panneau latéral |
| `/api/publications/planifier` | POST | `{ids:[…], date_base, mode:"increment", incrément}` | `202 {tache}` | barre de sélection |
| `/api/publications/supprimer` | POST | `{ids:[…], confirme:true}` | `{ok, tombstones}` | menu de lot, zone dangereuse |
| `/api/sync-serveur` | POST | `{sens:"monter"|"descendre"|"deux"}` | `202 {tache}` | bandeau, après toute écriture |
| `/api/scrape/<source>` | POST | `{source: "ads"|"maps"|"vcf", …}` | `202 {tache}` puis résultats paginés | onglet Sources |
| `/api/concurrents` | GET | `?q` | `{concurrents:[…]}` | `#/veiller/concurrents` |
| `/api/concurrents` | POST | `{nom, niche, url}` | `202 {tache, slug}` | « Analyser un concurrent » |
| `/api/concurrents/<slug>` | GET | — | la fiche : grille 7 dimensions, opportunités | fiche concurrent |
| `/api/mesure` | GET | `?periode`, `?plateforme`, `?pilier` | engagement par pilier, chronologie, coût réel en jetons, publications sorties | `#/veiller/performance` |
| `/api/blog/articles` | GET | `?fraicheur_max_h` | `{articles:[…], index_date, ecart_plan}` | `#/veiller/idees` |

**Les quatorze routes de `dashboard_app.py` : aucune n'est recréée.** Chacune
est un doublon strict, un doublon fonctionnel, ou une route morte
(`AUDIT-M5 §2.2`) — `/api/analytics/summary` est couvert par `/api/mesure`,
`/api/config/llm-status|llm-provider|llm-test` par les trois mêmes routes du
toolkit, `/api/ia/status` et `/api/quick/retry-failed` de même, et
`/api/analytics/history`, `/api/generate/narrative`, `/api/personas/list`,
`/api/quick/batch-images`, `/api/generate/text`, `/api/generate/image`,
`/api/quick/export-metrics`, `/api/analytics/summary` n'apportent aucune capacité
absente.

---

## 6. Plan de construction — 9 étapes, 13 sessions

**Règle de transition, valable pour les huit premières étapes.** L'application
tourne en permanence. `GET /` continue de servir `cockpit.html` jusqu'à la fin
de l'étape 7, et les nouveaux écrans sont atteignables à leur URL propre
(`/aujourdhui`, `/produire/publications`, …). Le jour où une destination est
terminée et vérifiée, elle devient l'entrée du rail ; `cockpit.html` reste
joignable à `GET /cockpit` comme filet. Il est supprimé à l'étape 9, quand plus
rien ne pointe vers lui. **Aucune session ne laisse l'outil inutilisable : à la
fin de chacune, on peut produire une publication, publier, et relancer une
campagne.**

| Étape | Sessions | Contenu | Ce qu'elle répare, mesurablement |
|---|---|---|---|
| **1 — Socle et service** | **1** | `app.py` + 9 blueprints ; Jinja + htmx vendorisé + waitress ; `statique/` avec les **12** `.woff2` (dont les 3 Outfit produites) ; `eperf-cockpit.css` avec les **douze** jetons N1 et `--gold2:#e2c07a` ; `base.html`, rail, bandeau ; `verifier.py` avec les 10 contrôles ; `requirements.txt` | **Les 7 `@font-face` cessent de renvoyer 404** (`AUDIT-M5 §6.5`) : mesuré 404 sur les deux ports, l'outil tourne **en police système**. Rectification : ce n'est pas un défaut subi « depuis des semaines » — avant le commit `8389309` du 19/09 03:25 le cockpit n'avait **aucun** `@font-face` (0 requête, 0 erreur en douze jours) et tournait en police système **par construction** ; les 7 règles et les **62 seuls 404 de l'historique** sont une **régression de la refonte elle-même** (`CONTRE-EXPERTISE §G0`). **Outfit existe** (`AUDIT-M5 §6.4` : 4 règles CSS l'invoquent, `find` ne trouve rien). **Les actifs sont versionnés** : plus jamais deux instances servant deux versions. |
| | | *Sortie vérifiable :* `verifier.py` vert sur C1, C2, C4, C8 ; `curl` de chaque `.woff2` en 200 ; une page qui affiche un titre en Cormorant. |
| **2 — Magasins, identifiants, migration** | **2** | **le pull serveur synchrone d'abord** (`GET lire_publications.php`, lecture) qui remplit `publication_cache_serveur` — la migration suit et **ne tourne pas sans lui** ; `noyau/db.py` (WAL, `busy_timeout`) ; `noyau/migrations.py` : schéma complet (§2.5) puis `migration_001` (**import des 234 entrées / 227 empreintes d'archive**) puis `migration_002` (amorçage + renumérotation) ; `noyau/identifiants.py` (format par séquence) ; tombstones ; `services/publications.py` en lecture ; les 3 tests T1-T3 et le test d'idempotence **sur le dispatcher** | **La collision d'identifiants est réparée** (`AUDIT-M4 §1.4`) : les 7 identifiants communs aux deux CSV portent 7 textes différents, dont 2 déjà `publie`. Après migration — séquence amorcée à `max(local, serveur, tombstones) + 1` — les 7 lignes locales reçoivent un identifiant **≥ `PUB-0050`**, `id_herite` garde la trace, et 7 événements `CONFLIT-IDENTITE` sont écrits. **Le contenu neuf ne peut plus hériter d'un statut `publie`.** **Et la mémoire anti-répétition survit** : les **234 entrées d'archive** (227 empreintes uniques) sont importées, sans quoi le générateur peut reproduire un texte **déjà publié** (`CONTRE-EXPERTISE §G3`, `content_engine.py:1327,1937`). |
| | | *Sortie vérifiable :* `pytest tests/test_identifiants.py tests/test_migration.py` vert (T1-T3 **corrigés**, T4-T6 ajoutés) ; le rapport de migration s'affiche dans le Journal avec `examinees` / `collisions_detectees` / `renumerotees` et **échoue si l'écart n'est pas nul** ; `archives_importees: 234` apparaît au rapport, et rejouer les 234 triplets renvoie 234 fois « déjà en archive », 0 génération ; **serveur injoignable ⇒ étape 2 bloquée en rouge avec sa raison (`MIGRATION-BLOQUEE`), jamais un « 0 renumérotée » vert** ; rejouer la migration renvoie `renumerotees: 0`. |
| **3 — Tâches longues** | **1** | `noyau/taches.py` (enveloppe de `etat_cockpit.py`, états D6, `annuler`, `detail`, journal borné) ; les deux files (texte 4 fils, visuel **1 worker**) ; les 5 routes `/api/taches` ; les 12 routes converties en `202 {tache}` ; `app.js:sondage()` ; bandeau de tâches | **Le toast de 4,2 s cesse d'être le seul retour** : `AUDIT-M2 §4 D1` mesure 5 minutes de calendrier sans progression ni annulation. **Les 11 routes `/api/etat/*` cessent d'être du code mort** : `AUDIT-M5 §3.2` prouve qu'aucune n'a jamais été appelée (le fichier `~/Documents/cockpit_etat.json` n'existe pas). **Un carrousel cesse de lancer 8 Chromium** (`AUDIT-M3 §F4`) : un navigateur par tâche. |
| | | *Sortie vérifiable :* lancer « Génération de 7 publications », fermer l'onglet, rouvrir : la tâche est là avec son étape et son pourcentage. `Ctrl+C` sur le serveur pendant la tâche, relancer : l'état passe à `interrompue` et « Reprendre » saute les unités faites. |
| **4 — Secrets** | **1** | **⚠️ Prérequis, à faire AVANT la purge** (condition B, §4.3) : inversion de l'ordre de résolution dans les **deux** copies de `unified-ia-backend/backend/core/llm_client.py` (environnement d'abord, fichier en dernier recours, deux `md5` identiques) ; puis `secrets.env` + `noyau/secrets.py` ; sortie des **11 emplacements** (§7.2) ; purge de `config_ia.json` et `config_api.json` ; `agent-ia-web/.env` en `0600` (fichier du **NOYAU** : `⚠️ DEMANDE` au journal) ; **rotation** des clés exposées ; `noyau/journal.py` avec `FiltreSecrets` ; `GET /api/secrets`, `POST /api/secrets/<nom>/tester` ; les 4 sondes | **Le jeton de production cesse d'être en clair** : `AUDIT-M4 §D10` en compte 11 dans le code et `AUDIT-M5 §4.1` 78 occurrences dans le dépôt sur 18 fichiers. **`TELEGRAM_BOT_TOKEN` vide devient visible** (`AUDIT-M4 §D16` : l'alerte n'arrivait nulle part). **Le jeton quitte les chaînes de requête** (`AUDIT-M4 §D11` : `?key=…`) : un secret dans une URL finit dans un journal d'accès. **Et la purge ne casse pas le backend chatbot** : sans le prérequis, `llm_client.py` (fichier lu avant l'environnement, repli seulement si le fichier est **absent**) perd sa clé **en silence** (`VALIDATION-CHATBOT §5.4`). |
| | | *Sortie vérifiable :* contrôle C7 vert (`grep` des 11 motifs) ; `ls -l ~/.config/eperformance/secrets.env` → `-rw-------` ; `POST /api/secrets/DEEPSEEK_API_KEY/tester` renvoie `ok` avec une latence ; `GET /api/secrets` ne contient aucune valeur ; **`md5sum` des deux copies de `llm_client.py` identique et `LLMClient().deepseek_key` non vide avec `config_ia.json` purgé**. |
| **5 — Objet publication unique** | **2** | `services/publications.py` complet (jointure, propriétaire par champ, provenance) ; `publication_cache_serveur` ; `services/machine_etats.py` ; le pull automatique aux 3 déclencheurs ; `services/sync_serveur.py` (montée/descente, transaction unique) ; les routes de lecture et d'action ; l'onglet Échecs | **Les trois registres de statut fusionnent en un** (`AUDIT-M4 §1.3`) : l'écran affichait `7 publications · 0 publiées` quand **3 étaient sorties** sur LinkedIn et Facebook. **Les métriques sociales cessent d'être invisibles** (`AUDIT-M4 §D6`) : `Vues`, `Likes`, `Commentaires`, `Partages` sont dans le CSV et lus nulle part. **Les programmations de lot cessent d'être non synchronisées** (`AUDIT-M4 §D3`) : 49 publications programmées localement, jamais reçues par le cron. |
| | | *Sortie vérifiable :* `GET /api/publications` renvoie `provenance` sur chaque champ ; `vu_le` est affiché dans le pied de page ; une publication programmée avec le serveur arrêté produit un `sync_warning` bloquant ; les 3 publications `publie` du serveur apparaissent dans l'onglet Publiées avec leur `Post_ID`. |
| **6 — Santé, événements, alerte** | **1** | `noyau/evenements.py` ; `services/sante.py` et ses 4 conditions ; `GET /api/sante` ; `GET /api/journal` ; `bandeau_sante.html` avec la liste des raisons ; les 5 emplacements d'affichage ; le cas d'acceptation `#132001` | **Le défaut le plus coûteux du projet est réparé** : `AUDIT-M1 §4.1 F3` — une erreur `#132001` a parqué la base entière pendant que l'interface affichait un état normal, et le seul canal d'alerte avait un jeton vide. **Un état normal n'est plus jamais affiché par défaut** : `ok` exige quatre conditions vérifiées, et l'absence d'information produit `inconnu`. |
| | | *Sortie vérifiable :* `pytest tests/test_sante.py` vert, dont `test_132001` ; débrancher le réseau et attendre 15 min → le bandeau passe en `degrade` avec sa raison ; vider `TELEGRAM_BOT_TOKEN` → une raison `critique` apparaît avec sa conséquence écrite. |
| **7 — Les cinq destinations** | **3** | Session 8 : `#/aujourdhui` (la file du jour, `/api/aujourdhui`) et `#/produire/publications` (4 onglets, barre de sélection, ligne dépliée) — la destination la plus volumineuse. Session 9 : `#/acquerir` (pipeline, panneau de fiche à 3 onglets, sources, messages) et `#/veiller` (concurrents, idées, performance). Session 10 : `#/systeme` (fournisseur, compétences, apparence, préférences, journal, diagnostic), `#/prix`, et **le clavier** (`ARCHITECTURE-ECRANS §8`) | **Les 15 modales disparaissent** (`ARCHITECTURE-ECRANS §1.2`), dont 3 en tant qu'écrans et 12 en tant que destinations adressables. **Les 32 `listes déroulantes` et les 98 `onclick` inline disparaissent** au profit de puces et d'actions nommées. **La file du jour cesse de ne pas exister** : le matin, l'utilisateur décidait dans un pipeline de 22 cartes qui n'est pas sa file. **Les adresses apparaissent** : `pushState` et `location.hash` valent 0 aujourd'hui, aucune vue n'a d'URL, aucun favori n'est possible. **Les brouillons survivent** : une seule clé `localStorage` existe aujourd'hui (`fb_token`). |
| | | *Sortie vérifiable :* `g p` puis `Entrée` ouvre l'atelier ; `Échap` ferme le panneau et rend le focus ; `Ctrl+Z` annule un statut dans les 8 s ; F5 sur un pipeline filtré restitue le filtre ; contrôle C9 vert (aucun `<select>` pauvre) ; `grep -c "onclick" gabarits/` → 0. |
| **8 — Chaînes uniques et blog** | **1** | Suppression de `design_pipeline.py`, `image_generator_v3.py`, `image_generator.py`, `variant_generator.py`, `video_generator.py`, `content_pipeline_v2.py` ; détection d'existence alignée sur les noms de `social_templates` ; **contrôle par slide** ; `image_optimizer` branché dans `ST/rendu.py` ; `metrics_tracker` rebranché sur des coûts mesurés ; `services/blog.py` et son contrôle de fraîcheur | **Le contrôle cesse de couvrir 32 % des images** (`AUDIT-M3 §F3`, mesuré : `fichiers[0]` passé au contrôleur, 68 % des images d'un lot non contrôlées). **« Toutes les images » cesse de refacturer des images existantes** (`AUDIT-M3 §F2` : `_image_exists_for_pub` renvoie `None` pour `PUB-0001` dont l'image existe). **Le temps annoncé cesse d'être faux d'un facteur 2** (`AUDIT-M3 §F8` : « ~10s » annoncé, 19,7 s mesurés, 56,4 s au maximum). **La chaîne éditoriale cesse d'être sans bouton** (`AUDIT-M2 §6.3` : `grep "api/social" cockpit.html` → 0). **La production sociale cesse d'être plafonnée à 8 sujets** (`AUDIT-M4 §D9` : 81 articles existent). |
| | | *Sortie vérifiable :* `ls` des 6 fichiers supprimés → absents ; un carrousel G4 produit **7 rapports** de contrôle, pas 1 ; `POST /api/publications/generate-all-images` sur un lot déjà illustré ne régénère rien ; `/api/blog/articles` signale l'écart plan/index. |
| **9 — Mise en service** | **1** | Suppression de `cockpit.html`, `dashboard.html`, `build_dashboard.py`, `agent-ia-web/dashboard_app.py` et `templates_dashboard/` ; `lancer-cockpit.sh` réécrit et **testé** ; `cockpit.desktop` corrigé **aux deux emplacements** ; unité systemd `--user` avec `Restart=on-failure` ; `~/.local/share/applications/cockpit.desktop` ; documentation de démarrage | **L'outil cesse d'avoir zéro lanceur fonctionnel** (`AUDIT-M5 §5.1`) : `lancer-cockpit.sh:5` fait `cd` vers `/home/ballo/OX6A/prospecting-toolkit`, qui **n'existe pas** ; le script sort en code 1 avant d'avoir rien fait ; `cockpit.desktop:5` pointe vers ce script ; et **la copie installée** dans `~/.local/share/applications/` porte le même `Exec=` mort. **Le redémarrage cesse d'être manuel** : aucun systemd, aucun `@reboot`. **Le jeton en clair dans `dashboard.html:142` disparaît du disque.** |
| | | *Sortie vérifiable :* double-clic sur l'entrée de menu → l'outil s'ouvre ; `systemctl --user restart cockpit` ; redémarrer la machine → l'outil revient seul ; `grep -rn` des 11 motifs de secret → 0 occurrence dans le dépôt. |

**Total : 1 + 2 + 1 + 1 + 2 + 1 + 3 + 1 + 1 = 13 sessions.**

**Ce qui peut être livré plus tôt, si l'ordre doit bouger.** Les étapes 1 à 4 ne
dépendent d'aucune autre et peuvent être menées d'abord : à la fin de l'étape 4,
l'outil est identique pour l'utilisateur, mais les polices s'affichent, les
tâches survivent aux onglets, et aucun jeton n'est en clair. **Ce sont les quatre
sessions au plus haut rendement, et aucune ne touche à un écran.** Les étapes 5
et 6 sont celles qui changent ce que l'utilisateur *croit* : elles doivent être
faites ensemble, parce qu'un objet publication unique sans santé affichée
laisserait encore un état normal par défaut. **L'ordre lui-même est réinterrogé
en §6.2** : ce que l'usage réel impose n'est pas ce que l'ordre 1→9 livre en
premier.

### 6.1 Retour arrière

**Ce que la version antérieure disait, et pourquoi c'était insuffisant.**
`§4.2` répondait « Impossible et assumé », et le filet décrit était
`GET /cockpit` qui continue de servir `cockpit.html`. **Ce filet n'est pas sûr
en données** : dès l'**étape 2**, `publications.csv` cesse d'être lu et écrit en
continu et devient un **export à la demande, généré et jetable**. Revenir à
`cockpit.html` après l'étape 2 affiche donc **l'ancien état**, sans voir tout ce
qui a été produit dans le nouvel outil — et rien n'indiquait comment ré-exporter
(`CONTRE-EXPERTISE §G4`).

**La procédure, en trois pièces, toutes testables :**

1. **Copies octet pour octet, avant toute écriture de `migration_002()`.** Le
   premier acte de la migration écrit `publications.csv.pre-002` et
   `prospects_tracking.csv.pre-002` (copie **octet pour octet**, pas un export) :
   l'original existe encore quand la règle de renumérotation s'applique.
2. **`scripts/revenir.sh`, documenté et testé** :
   ```
   1. eperf.db ──export──► publications.csv + prospects_tracking.csv
   2. arrêt du nouvel app.py (systemctl --user stop cockpit)
   3. reprise de l'ÉCRITURE EN CONTINU des deux CSV  ← le point qui manquait
   4. relance de prospect_app.py (l'ancien cockpit)
   ```
   **Le point 3 est le cœur de la correction** : sans lui, l'ancien cockpit lit
   un CSV figé au jour du repli et affiche un état périmé sans le dire. La
   reprise est un commutateur explicite (`EPERF_CSV_CONTINU=1`), pas un effet de
   bord : il remet l'export sur la même cadence qu'avant l'étape 2.
3. **L'invariant, écrit comme un test** : « après `revenir.sh`, l'ancien cockpit
   affiche **les mêmes 7 publications et les mêmes 22 prospects** que le nouvel
   écran » (`CONTRE-EXPERTISE §P4`). Un repli qu'on n'a pas exercé n'est pas un
   repli.

**Ce que le repli ne répare pas, et qui est assumé :** une donnée écrite en
clair *faux* par une migration (cas où `migration_002` renumérote selon une règle
erronée) n'est récupérable que par les copies `.pre-002` — d'où leur nom daté et
leur conservation **au moins 14 jours**, comme les sauvegardes `VACUUM INTO`.

### 6.2 Ce que l'usage réel impose

**La mesure, sur 83 journaux et douze jours (`CONTRE-EXPERTISE §0, §1.1 à §1.5`) :**

| Mesure | Valeur |
|---|---|
| requêtes HTTP | **8 322** |
| gestes réels (`POST`) | **302, soit 3,6 %** |
| dont « génère l'image » d'une publication | **138, soit 46 % des gestes** |
| part du trafic due au sondage automatique de 60 s (`GET /api/state`) | **83 %** |
| lancements de lot soldés par une erreur | **27 sur 53, soit 51 %** — dont **26 le 10/09** |
| dernier travail réel du propriétaire | **15/09** |
| routes d'acquisition appelées en douze jours | **0** — 15 routes |

**Trois conséquences de priorité, et elles changent l'ordre du plan :**

1. **Le réessai automatique sur échec fournisseur devient prioritaire.**
   La boucle d'atelier s'est arrêtée sur un taux d'échec de 51 %, et le plan ne
   prévoyait qu'une reprise **manuelle**. À écrire dans l'unité de travail :
   **3 tentatives, attente 2 s / 8 s / 30 s** sur erreur transitoire (réseau,
   `429`, `5xx`), tracées en événement `REPRISE` ; au-delà, l'unité passe
   `echouee` avec sa raison, et **une** action « Reprendre les échecs » relance
   tous les échecs d'une tâche. C'est du câblage sur `deja_faite()` et la reprise
   idempotente de §4.1, pas une architecture nouvelle. Test d'acceptation : un
   fournisseur simulé qui répond `503, 503, 200` ⇒ l'unité réussit, un événement
   `REPRISE` est écrit, la tâche se termine `terminee`.
2. **La boucle de contrôle visuel devient prioritaire, elle aussi.** Le geste le
   plus fréquent du produit est « génère l'image », fait **une par une**
   (19,7 s de moyenne, jusqu'à 56,4 s), puis suivi de `delete-all` **18 fois**.
   Le contrôle existe (`social_templates/controleur.py`, 8 postes, seuil 70), il
   est **calculé** et **jeté** : `grep -c "manques" cockpit.html` → **0**. Livrer
   tôt le contrôle **par slide** et **l'affichage du score** (D10, étape 8) est
   plus rentable que la grille de pipeline de l'étape 7.
3. **L'acquisition est à réduire, pas à refondre.** **15 routes, 0 appel en
   douze jours**, et 20 des 22 prospects sont périmés en local. Livrer **une**
   page « Importer » (les 3 sources + la revue avant import, déjà spécifiée dans
   `PARCOURS-ECRANS.md:101`), et reporter grille de pipeline, fiche à 3 onglets,
   qualification et messages derrière un **critère écrit dans le Journal** :
   « ≥ 20 imports et ≥ 10 actions nommées enregistrées ». La refonte y gagne une
   session, et cesse de reconstruire une surface morte.

**Ce que cela ne dit pas :** que l'ordre 1→9 est faux. Les étapes 1 à 4 restent
les fondations, et la correction des défauts vivants (D4) reste la première
chose. Ce que la mesure dit, c'est que **la première destination livrée doit être
l'atelier** — lot, images, jugement, score — et non `#/acquerir`.

### 6.3 Conditions par étape (consolidation)

| Avant | Condition | Source |
|---|---|---|
| **l'étape 1** | `--gold2:#e2c07a` ; **douze** jetons N1 énumérés ; **12** `.woff2` avec `C4` sur une **liste nommée** | `SUPERVISION` corrections 4 et 11 ; `VALIDATION-CHATBOT §A3` |
| **l'étape 1** | Le vocabulaire des jetons (`--police-*`, `--t0`…`--t8`) est **arbitré par le NOYAU** (`⚠️ CONTRAT`), pas décidé par le SITE — aucun renommage n'est fait ici | `AVIS-NOYAU §4.1`, `VALIDATION-CHATBOT §A5` |
| **l'étape 2** | Les **corrections 1 à 3** de la migration sont intégrées (§2.8) **avant** l'exécution | `SUPERVISION §7` ; `VALIDATION-CHATBOT §A2` ; D4 |
| **l'étape 4** | Ordre de résolution inversé dans les **deux** copies de `llm_client.py`, mesure de contrôle passée | `VALIDATION-CHATBOT §5.4`, §7 point 4 |
| **l'étape 5** | La table de correspondance des statuts est **écrite**, avec les **deux** cas d'erreur (`echouee` ↔ `echec` **et** `erreur`) | `VALIDATION-CHATBOT §D5` ; `SUPERVISION §7 point 10` |
| **l'étape 8** | `services/blog.py` écrit **sans** champ `published` (il n'existe pas dans l'index) ; contrôle de fraîcheur sur `genere_le` | `VALIDATION-CHATBOT §A4` ; §2.11 |
| **l'étape 9** | Accord écrit du **NOYAU** pour toute suppression dans `agent-ia-web/**` ; décision écrite sur `personas.py`, `narrative_engine.py`, `meta_agent.py` | `VALIDATION-CHATBOT §7 point 9` ; `AVIS-NOYAU §6.1` ; §2.3 |

**Et un point de contrôle à ajouter à l'étape 6 :** la santé de D9 est une santé
**métier** (quatre conditions). Elle n'a pas vu **104 réponses 5xx en douze
jours, dont 73 × `500 GET /api/state` pendant 68 minutes le 19/09** — un
décorateur déplacé entre une route et sa fonction. Un compteur de 5xx par route
et un `verifier.py` qui s'exécute **avant** le rechargement du processus
répondent à ce défaut-là, qui est un défaut de **conception du contrôle**
(`CONTRE-EXPERTISE §G6`, `§P7`).

---

## 7. Annexes

### 7.1 Conformité aux contraintes

| Contrainte | État mesuré (référence) | Cible | Contrôle |
|---|---|---|---|
| **Jetons N1 gelés** | `cockpit.html:136-158` : 14 jetons sur 16 déjà identiques au design system (`AUDIT-M5 §1.4`), 2 écarts connus — dont `--gold2` | les **douze** jetons N1 conformes, dans un seul fichier, `--gold2:#e2c07a` | **C2** : les **12 paires `(nom, valeur résolue)`** comparées à l'empreinte de la source canonique (`agent-ia-web/eperf_core/jetons.py`) — `b89dcba06940079e` (sombre) · `e6d40d572271fc7d` (clair) — **jamais un `md5` de fichier**, et **échec si la source est injoignable** (§1.7 bis) |
| **Aucun hex en dur dans le CSS** | `cockpit.html` 21 occ. / 17 distinctes (`AUDIT-M5 §6.2`) | **0** | **C2** |
| **Polices auto-hébergées** | 9 `.woff2` présents ; `Outfit` **absente du disque** et invoquée par 4 règles sans repli | **12** `.woff2` (9 + 3 Outfit), 3 familles, 0 CDN | **C4**, sur la **liste nommée** des 12 fichiers |
| **Zéro emoji** | `cockpit.html` 315 séquences, `prospect_app.py` 129, et **elles traversent l'API** (`/api/ia/status` renvoie un statut préfixé d'une séquence pictographique) | **0** dans `gabarits/`, `statique/`, `routes/` | **C3** |
| **WCAG AA** | non mesuré globalement ; `--border-strong` à 3,25:1 documenté conforme | 19 couples ≥ 4,5:1 (texte) ou ≥ 3:1 (UI) | **C6** |
| **Aucune dépendance externe au chargement** | `cockpit.html` conforme (0 CDN) ; `dashboard.html` et `templates_dashboard` non conformes (2 CDN chacun) | **0** sur le dashboard | **C1** |
| **Aucun secret en clair** | 11 emplacements dans le code (`AUDIT-M4 §D10`), 78 occurrences dans le dépôt (`AUDIT-M5 §4.1`), `.env` en `644` | 1 fichier, `0600`, hors dépôt | **C7** + `tests/test_secrets.py` |
| **Le vocabulaire parle du monde** | « Generate batch », « Statut : Froid », 2 `<select>` divergents pour le fournisseur | actions nommées, états nommés | revue + C9 |

### 7.2 Sort des 11 emplacements de jeton en clair

`AUDIT-M4 §D10` nomme **onze** emplacements de jeton d'API en clair dans le code.
Ils sont tous traités ; aucun n'est laissé « pour plus tard ».

| # | Emplacement | Nature | Destination | Remplacement exact |
|---|---|---|---|---|
| 1 | `content_engine.py:1986` | jeton bearer, **défaut en clair** du `os.environ.get` | `noyau/secrets.py` | `secrets.lire("EPERF_API_TOKEN")` — le défaut en clair disparaît, l'absence lève `ErreurConfig` |
| 2 | `content_engine.py:2602` | jeton bearer, **défaut d'un argument CLI** | `noyau/secrets.py` | `--token` devient optionnel ; sans argument, lecture dans `secrets.env` |
| 3 | `prospect_app.py:249` | jeton bearer, en clair dans `/api/stop` | `noyau/secrets.py` | `secrets.lire("EPERF_API_TOKEN")` |
| 4 | `prospect_app.py:771` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 5 | `prospect_app.py:800` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 6 | `prospect_app.py:830` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 7 | `prospect_app.py:862` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 8 | `prospect_app.py:1871` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 9 | `prospect_app.py:1914` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem |
| 10 | `prospect_app.py:1998` | jeton bearer, défaut en clair | `noyau/secrets.py` | idem, **et cesse d'être passé en `?key=`** (`AUDIT-M4 §D11`) : en-tête `Authorization` |
| 11 | `prospect_scraper.py:37` | jeton bearer, en clair | `noyau/secrets.py` | `secrets.lire("EPERF_API_TOKEN")` |

**Quatre emplacements voisins, traités au même moment** parce qu'ils portent le
même secret ou une clé d'un autre service :

| Emplacement | Nature | Destination |
|---|---|---|
| `build_dashboard.py:22` | jeton bearer en clair | **le fichier est supprimé** (D2) — rien à migrer |
| `dashboard.html:142` | jeton bearer **en clair dans un HTML ouvert au navigateur** | **le fichier est supprimé** (D2) — c'était le plus grave : quiconque ouvrait le fichier lisait un jeton d'écriture sur la production |
| `config_ia.json:4`, `config_api.json:4` | clé DeepSeek en clair, **versionnée volontairement** (`AUDIT-M5 §4.1`) | purgés : les deux fichiers ne gardent que `provider` et `model` — **mais seulement après** l'inversion de l'ordre de résolution dans les **deux** copies de `unified-ia-backend/backend/core/llm_client.py` (condition avant l'étape 4, §4.3). Sans cela, la purge supprime la source de la clé du backend chatbot **sans erreur ni repli**. **Et** la **rotation** des clés exposées (`config_api.json`, `config_ia.json`, historique git conservé) fait partie de l'étape : purger un fichier ne ferme pas une fuite quand l'historique porte la clé (`VALIDATION-CHATBOT §A1`, `SUPERVISION §6, point 3`). |
| `agent-ia-web/.env:9,17,22,…` | 16 secrets, permissions `-rw-r--r--` | migrés vers `~/.config/eperformance/secrets.env` ; le fichier passe en `0600` pour ce qui reste (les identifiants de développement) |
| `prospect_app.log` (18 occurrences d'un fragment de clé) | fuite dans un journal, code retiré du dépôt mais fichier resté | **supprimé**, et `FiltreSecrets` empêche la reproduction (§4.4) |
| `api/*.php` (13 fichiers), `webhook_*.php`, `n8n/*.json` | jeton en clair, en commentaire et en code | **hors dépôt** : ces fichiers sont déployés chez LWS. Le jeton y reste, **parce que le serveur est un système souverain** — mais il est lu depuis `SERVER/secrets.php` et **le local ne le duplique plus**. Une rotation devient possible sans toucher onze fichiers. |

**Ce que la sortie produit, en une phrase :** le jeton existe **une fois** sur le
poste, dans un fichier `0600` hors dépôt, et une rotation ne demande plus de
modifier onze fichiers et quatre flux n8n.

### 7.3 Ce qui n'est pas établi

Conformément à la règle « aucune spéculation », voici ce que les audits n'ont
pas pu prouver, et que ce document **ne tranche donc pas à leur place**. Chaque
point est traité soit par une mesure à faire, soit par une décision qui ne
dépend pas de la réponse.

| # | Non établi | D'où | Comment la refonte s'en accommode |
|---|---|---|---|
| 1 | La **cadence réelle du cron LWS** | `AUDIT-M4 §11` : le déclencheur est côté hébergeur, `crontab -l` ne le montre pas, et l'appeler serait une route modificatrice | `services/sante.py` mesure le **heartbeat** et exige `< 2 h` : la cadence exacte n'a pas besoin d'être connue pour que l'absence de battement soit détectée |
| 2 | La **cause exacte de l'échec Instagram** | `AUDIT-M4 §11` : l'API nomme 9004/2207052 (« contenu non récupérable depuis `assets_pubs/PUB-00xx.png` ») et un log évoque un HTTP 500 sur la même URL ; un défaut de permissions sur `assets_pubs/` est probable, non testé | l'échec devient un **événement** avec son code et son action. Instagram reste dans le calendrier jusqu'à ce que l'événement soit lu ; le retirer est une ligne (`ENGINE:1789-1798`) et une décision à prendre sur la foi du Journal, pas d'une supposition |
| 3 | L'**état réel des 3 publications `publie`** | `AUDIT-M4 §11` : confirmer que les postes sont toujours en ligne exigerait d'interroger les API des réseaux avec les jetons | le `Post_ID` est affiché comme un lien sortant : l'utilisateur vérifie d'un clic, sans que l'outil prétende savoir |
| 4 | La **fréquence et le coût réels des appels LLM** | `AUDIT-M4 §11` et `AUDIT-M2 §8` : `generation_metrics.json` est vide, aucun journal local ne comptabilise | `metrics_tracker` est rebranché sur la génération de publications **et** sur la `usage` renvoyée par le fournisseur : le coût devient mesuré, pas déclaré |
| 5 | Le **contenu de `SERVER/secrets.php`** | `AUDIT-M4 §11` : le fichier existe et expose `API_BEARER_TOKEN` et `TG_TOKEN`, sa valeur n'a pas été lue | rien à faire côté local : le jeton local vient de `secrets.env`, le serveur lit le sien. Les deux n'ont pas besoin d'être identiques pour que le pull fonctionne |
| 6 | Le **nombre d'utilisateurs** | `AUDIT-M4 §11` : « un seul » est cohérent avec le code (ni session, ni compte, ni trace d'accès) mais non vérifiable | l'absence d'authentification est **assumée** : l'écoute est bornée à `127.0.0.1` et waitress ne reçoit jamais `0.0.0.0`. C'est la seule barrière, et elle est écrite comme telle |
| 7 | **Pourquoi deux instances tournaient** sur 8787 et 8788 | `AUDIT-M5 §8` : les deux servent le même fichier depuis le même répertoire, aucun script ne les lance ensemble | `EPERF_HOME` rend l'intention explicite : deux instances = deux jeux de données, ou une seule instance. Le lanceur en démarre **une** |
| 8 | Ce que désigne l'import **`backend`** | `AUDIT-M5 §8` : le module apparaît dans l'extraction AST, aucun fichier correspondant n'a été trouvé | l'import est protégé par `try/except` côté appelant ; il est retiré à l'étape 8 avec les modules morts, et une erreur d'import cesse d'être silencieuse (contrôle au démarrage) |
| 9 | **Si le cockpit a déjà tourné en `file://`** | `AUDIT-M5 §8` : le chemin `../site-eperformance/` suggère que oui, sans preuve | sans objet après l'étape 1 : les polices sont servies par le serveur, à un chemin qui ne peut pas être faux |
| 10 | L'**état de publication du blog lui-même** | `AUDIT-M4 §11` : 81 dossiers existent, 8 sont marqués `published`, et l'état des pages datées du futur n'a pas été vérifié | `services/blog.py` lit **l'index généré** et signale l'écart avec le plan, sans prétendre savoir lesquels sont en ligne. La question appartient au module blog |
| 11 | Le **nombre exact de séquences emoji** | `AUDIT-M5 §6.3` : la demande disait 306, la mesure 315 séquences / 359 points de code — écart de méthode, pas de fichier | sans objet : la cible est **0**, et le contrôle C3 compte les deux |
| 12 | L'**écart `--gold2`** — **tranché le 19/09 par le NOYAU, contre son propre dépôt** | `AVIS-NOYAU §2.3` : `#cfb583` n'est porté que par `agent-ia-web/eperf_core/assets/css/10-primitives.css:90`, contre `#e2c07a` en cinq emplacements (site, blog, widget, cockpit, canon écrit). La phrase antérieure — « `--gold2` reste au canon du noyau » — invitait un implémenteur à écrire `#cfb583` dans le thème **sombre** et donc à **violer un jeton gelé** (`SUPERVISION NC-5`) | **La valeur gelée est `#e2c07a`.** C'est le noyau qui se corrige, en une ligne (`10-primitives.css:90`), par une entrée `⚠️ CONTRAT` ; la refonte écrit `--gold2:#e2c07a` dans `eperf-cockpit.css` et n'attend pas la correction du noyau pour le faire. `#cfb583` ne reste cité que comme valeur du thème **clair** du site, hors périmètre dark-only |

**Ce que ce document n'a pas fait, et qui n'était pas demandé :** aucune route
modificatrice n'a été appelée, aucun fichier du socle n'a été modifié, aucune
valeur de secret n'a été reproduite. Les mesures citées viennent des cinq audits,
qui les ont prises en lecture seule sur le disque et sur les deux instances de
`127.0.0.1:8787` et `:8788`.

---

*Document produit le 19 septembre 2026. Version 1.0. Il applique les décisions
D1 à D10 sans en rouvrir aucune. Les citations `AUDIT-Mx §y` renvoient aux cinq
audits du même répertoire ; les citations `fichier:ligne` renvoient au code
mesuré par ces audits.*

---

## Errata du 19 septembre 2026

Consolidation des trois revues indépendantes (`VALIDATION-CHATBOT.md`,
`AVIS-NOYAU.md`, `CONTRE-EXPERTISE.md`) et des corrections du superviseur
(`SUPERVISION.md`). **Aucun texte d'origine n'a été effacé** : chaque correction
est faite sur place, et les phrases réfutées sont citées puis rectifiées.
Le détail des statuts D1-D10, des conditions par étape et des six conflits de
contrat est dans `REGISTRE-DECISIONS.md`.

| # | Ce qui a changé | Pourquoi (mesure) |
|---|---|---|
| **A** | **D4 est REFUSÉE dans sa rédaction initiale et reformulée.** `§0` porte le statut ; `§2.8` est réécrit : `amorcer()` / `maximum_connu()` (séquence à `max(local, serveur, tombstones) + 1`), `allouer()` avec format en donnée, `migration_002()` avec `ORDER BY id`, **refus si `publication_cache_serveur` est vide** (`MIGRATION-BLOQUEE`), rapport `examinees`/`collisions_detectees`/`renumerotees` qui **échoue sur l'écart**, **pull synchrone explicite** avant la migration, T2 corrigé, T4-T6 ajoutés, idempotence testée sur le dispatcher. L'étape 2 du plan intègre le pull et les nouvelles sorties. | Le validateur a revérifié : séquence amorcée à `0` ⇒ `allouer()` rend `PUB-0001` ; `SELECT` sans `ORDER BY` ⇒ chaque ligne reçoit l'identifiant qu'elle portait ; cache vide ⇒ `continue` ⇒ **0 réparation, 0 événement**. La sortie de l'étape 2 était inatteignable (`NC-1`, `NC-2`). |
| **B** | `§4.3` ajoute une **condition bloquante avant l'étape 4** : inverser l'ordre de résolution de `unified-ia-backend/backend/core/llm_client.py` (environnement d'abord, fichier en dernier recours, un fichier vide ne court-circuite plus l'environnement) et l'appliquer **aux deux copies** (C12) ; mesure de contrôle jointe. Même note en `§7.2` et à l'étape 4. | `llm_client.py:113-141` lit `toolkit_eperformance/config_ia.json` **avant** l'environnement et n'y retombe que si le fichier est **absent** : une purge ⇒ clé perdue, **sans erreur ni repli** (`VALIDATION-CHATBOT §5.4`). |
| **C** | `--gold2` vaut **`#e2c07a`** partout (`§0.1`, `§7.3` point 12) ; `§0.1` énumère les **douze** jetons gelés au lieu de six ; les polices passent de **14 à 12** `.woff2` (`§0.1`, `§1.4`, `§6` étape 1, `§7.1`) et `C4` contrôle une **liste nommée**. | `SUPERVISION §4.1` et `NC-5` : la phrase « reste au canon du noyau » faisait écrire `#cfb583` dans le thème sombre, c'est-à-dire violer un jeton gelé. `SYSTEME-VISUEL §3.4` justifie 12 (Outfit 400/700/900), pas 14. |
| **D** | Nouvelle sous-section **`§1.7 bis` « La source canonique des jetons »** : `agent-ia-web/eperf_core/assets/css/` + `agent-ia-web/eperf_core/jetons.py` ; `C2` compare les **12 paires `(nom, valeur résolue)`**, jamais un `md5` de fichier ; empreintes `b89dcba06940079e` (sombre) et `e6d40d572271fc7d` (clair) ; échec si la source est injoignable ; copie **générée**. **Aucun jeton renommé** : le vocabulaire est un arbitrage du NOYAU. | Trois sources canoniques différentes étaient désignées par les documents, et l'une des douze valeurs divergait réellement (`AVIS-NOYAU §2.2`, `P2`, `P3`). |
| **E** | Note d'exploitation après les règles de couche (`§2.2`) et rappel en `M10` : **ne pas retirer le palier Claude** avant reprise de `auditeur.py:41`, `onboarding.py:71`, `blog_engine/generate_articles.py:69`, `onboard_legacy.py:71`. | L'unification à DeepSeek seul casse quatre modules du noyau, et **Claude est le seul secours fonctionnel** (DeepSeek `200`, Z.ai `429 code 1113` compte non approvisionné, Claude `200`) : `AVIS-NOYAU §3.2`, `§9` condition 3. |
| **F** | Le format prospect passe de `PROS-%04d` à **`PROS-%03d`** (`§2.5`), et le format devient une **donnée** de la séquence (`identifiants.format`), plus un `:04d` figé dans `allouer()`. | `prospect_scraper.py:199` et `api/ajout_prospects.php:146` allouent en `%03d`, et **le webhook de réponses identifie le prospect par cette chaîne** : en `%04d` les réponses cessent d'arriver, silencieusement (`CONTRE-EXPERTISE §G1`). |
| **G** | Nouvelle sous-section **`§6.1 Retour arrière`** : copies **octet pour octet** `*.csv.pre-002` avant toute renumérotation, `scripts/revenir.sh` documenté et testé, **reprise de l'écriture en continu des CSV**, invariant « 7 publications, 22 prospects, identiques ». `§4.2` renvoie à `§6.1` au lieu de « impossible et assumé ». La table **`archives`** est ajoutée au schéma et `migration_001` (**234 entrées, 227 empreintes**) entre dans l'étape 2. | Le filet `GET /cockpit` n'était pas sûr en données : dès l'étape 2 les CSV cessent d'être écrits en continu. Et les 234 archives sont **la seule mémoire anti-répétition** du générateur (`content_engine.py:1327,1937`) : `CONTRE-EXPERTISE §G3`, `§G4`, `§P6`. |
| **H** | La formulation « depuis des semaines » disparaît (`§6` étape 1, et `SYSTEME-VISUEL-SAAS.md`) : le fait mesuré est « **le cockpit tourne en police système** », la cause est **une régression du commit `8389309` du 19/09 03:25**, la correction est inchangée. | Avant ce commit, `cockpit.html` n'avait **aucun** `@font-face` : 0 requête, 0 erreur en douze jours, police système **par construction**. Les 7 règles et les **62 seuls 404** de l'historique viennent de ce commit, qui est celui de la refonte (`CONTRE-EXPERTISE §G0`). |
| **I** | `§2.3` gagne **trois lignes** : `personas.py`, `narrative_engine.py`, `meta_agent.py` sont **orphelins** de la suppression de `dashboard_app.py` et leur sort est **à trancher par le NOYAU** ; la ligne `agent-ia-web/**` porte « **⚠️ accord du NOYAU requis** » et la raison exacte de mort (`0.0.0.0:5000` + `debug=True`). | `dashboard_app.py:30-32,50-51` est leur **seul consommateur réel**. Trois modules sans consommateur et sans décision deviennent la prochaine copie périmée (`AVIS-NOYAU §6.1`). |
| **J** | Nouvelle sous-section **`§6.2 Ce que l'usage réel impose`** : réessai automatique **3 tentatives, 2 s / 8 s / 30 s** prioritaire, boucle de contrôle visuel prioritaire, **acquisition à réduire** (15 routes, 0 appel), avec les mesures qui l'imposent. | 83 journaux, 8 322 requêtes, **302 gestes (3,6 %)**, dont **138 (46 %) = « génère l'image »** ; 83 % du trafic = sondage de 60 s ; **27 des 53 lancements de lot (51 %) en échec**, 26 le 10/09 ; dernier travail réel le **15/09** (`CONTRE-EXPERTISE §0, §1.1-§1.5`). |
| **+** | Nouvelle sous-section **`§6.3 Conditions par étape`** : sept conditions consolidées (avant les étapes 1, 2, 4, 5, 8, 9) et le point de contrôle 5xx à ajouter à l'étape 6. | Consolidation des conditions `VALIDATION-CHATBOT §7` ; `CONTRE-EXPERTISE §G6` (104 erreurs serveur, 0 alerte). |
