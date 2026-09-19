# AUDIT M5 — LE SOCLE

**Objet :** le socle du dashboard unifié — les trois tableaux de bord concurrents,
la configuration et les secrets, la persistance, le lancement et l'empaquetage.

**Date :** 19 septembre 2026.
**Périmètre lu :** `/home/ballo/OX6A/toolkit_eperformance/` et `/home/ballo/OX6A/agent-ia-web/`.
**Aucun fichier n'a été modifié** hors ce document. Aucune route qui modifie l'état n'a été appelée.

---

## 0. Méthode et reproductibilité

Toute affirmation de ce document est traçable à un `fichier:ligne` ou à une commande
explicitement citée. Les mesures ont été prises sur le disque, pas sur des copies.

Ce qui suit est le vocabulaire employé, avec sa définition exacte :

| Terme | Définition opérationnelle utilisée ici |
|---|---|
| **route** | un décorateur `@app.route/@app.get/@app.post/@app.put/@app.delete/@app.patch` dans un fichier Flask |
| **route appelée** | le motif de chemin apparaît littéralement dans le code client (`cockpit.html`) après normalisation des `<var>` |
| **hex en dur** | motif `#RGB`/`#RRGGBB`/`#RRGGBBAA` dans un bloc `<style>` **hors** `:root` |
| **séquence emoji** | un point de code d'un bloc pictographique (`U+1F000–U+1FAFF`, `U+2600–U+27BF`, `U+2B00–U+2BFF`, `U+2190–U+21FF`) suivi ou non de `U+FE0F` |
| **non établi** | je n'ai pas pu le prouver ; ce document ne spécule pas à la place |

**État d'exécution au moment de l'audit** (mesuré, `ss -ltnp`) :

| Port | Processus | Répertoire de travail | PID |
|---|---|---|---|
| `127.0.0.1:8787` | `python3 prospect_app.py` | `/home/ballo/OX6A/toolkit_eperformance` | 1379878 |
| `127.0.0.1:8788` | `python3 prospect_app.py --port 8788 --no-browser` | `/home/ballo/OX6A/toolkit_eperformance` | 1370122 |
| `127.0.0.1:8777` | `python3 -m http.server` | `/home/ballo/Google ads projets` | 1352941 |

**Aucun processus n'écoute sur le port 5000.** `dashboard_app.py` n'est pas démarré.

---

## 1. Les trois tableaux de bord — inventaire comparé

### 1.1 Tableau de synthèse

| | **A. `cockpit.html`** | **B. `dashboard.html`** | **C. `templates_dashboard/dashboard.html`** |
|---|---|---|---|
| Chemin | `toolkit_eperformance/cockpit.html` | `toolkit_eperformance/dashboard.html` | `agent-ia-web/templates_dashboard/dashboard.html` |
| Octets | 145 387 | 220 960 | 35 215 |
| Lignes | 2 601 | 320 | 988 |
| Blocs `<style>` | 1 | 1 | 1 |
| Lignes de CSS | 271 | 72 | 481 |
| **CDN externes** | **0** | **2** | **2** |
| Nature | application (SPA dans un fichier) | artefact statique généré | gabarit Flask |
| Servi par | `prospect_app.py:2276-2278` | **rien** — ouvert en `file://` | `dashboard_app.py:147-149` (`render_template`) |
| Modifié le | 2026-09-19 04:09 | **2026-09-07 19:34** | 2026-09-10 00:44 |
| Commits git portant sur ce fichier | 5 (`f4022c0`, `8389309`, `c105d4b`, `e00e56a`, `42bdc2d`) | **1** (`f4022c0`) — jamais régénéré | hors dépôt `toolkit` |
| Fonctions JS | 104 | ~12 | 6 |
| Jetons `:root` déclarés | 25 | 12 | 15 |
| Jetons réellement consommés | 17 / 25 | 11 / 12 | 13 / 15 |
| **Hex en dur (hors `:root`)** | **21 occ. / 17 distinctes** | **13 occ. / 9 distinctes** | **4 occ. / 4 distinctes** |
| `rgba()` en dur (hors `:root`) | 62 | 27 | 8 |
| **Séquences emoji** | **315** (66 distinctes) | **358** (18 distinctes) | **37** (16 distinctes) |
| État | **vivant, servi, exercé** | **gelé, orphelin** | **démarrable : non** |

### 1.2 Ce que chacun fait, pour qui, et s'il est encore utilisé

#### A. `cockpit.html` — le seul dashboard vivant

**Ce qu'il fait.** C'est une application, pas une page. Le HTML statique est marginal :
tout est construit en JavaScript dans des chaînes de gabarit — 101 `innerHTML`, 484 backticks,
104 fonctions. Il expose **12 écrans**, chacun ouvert par une fonction `open*` :

`openPubs` · `openQuickActions` · `openSettings` · `openProviderConfig` · `openDesign` ·
`openIAStatus` · `openScraper` · `openMsgGen` · `openCompetitor` · `openQualify` ·
`openAdd` · `openSkillsPanel`

**Pour qui.** Un seul utilisateur : le propriétaire. Aucune authentification n'existe
dans `prospect_app.py` — l'écoute est bornée à `127.0.0.1` (`prospect_app.py:2294`),
c'est la seule barrière.

**Est-il utilisé ?** Oui, prouvé par trois faits :
1. il est servi en HTTP 200 sur `127.0.0.1:8787/` et `127.0.0.1:8788/` (`curl`) ;
2. deux instances tournent simultanément (`ss -ltnp`) ;
3. `prospect_app.py:2276-2278` le lit depuis le disque à chaque requête `GET /` :
   ```python
   @app.get("/")
   def index():
       return (Path(__file__).parent / "cockpit.html").read_text(encoding="utf-8")
   ```
   Conséquence directe : **le cockpit est modifiable sans redémarrer le serveur.** C'est
   aussi pourquoi deux instances peuvent servir deux versions différentes du même fichier
   si l'on édite entre deux démarrages — non établi si c'est arrivé.

#### B. `dashboard.html` — un artefact gelé, sans serveur

**Ce qu'il fait.** Une page autonome : 7 KPI, 4 graphiques Chart.js, un tableau filtrable
de prospects, des boutons WhatsApp. Les données sont **injectées à la génération** dans le
fichier : `dashboard.html:139` est une ligne unique de **197 128 caractères** contenant le
tableau `PROSPECTS` ; la ligne 140 contient `STATS`. C'est ce qui explique qu'un fichier de
220 Ko n'ait que 320 lignes : 90 % du poids est un vidage de données.

**Qui l'utilise encore ?** Aucun appelant, prouvé :
- aucun `@app.route` ne le sert — `prospect_app.py:2276` sert `cockpit.html` ;
- `grep -rn "dashboard\.html"` dans le dépôt ne remonte que des **mentions documentaires**
  (`PATCH_NOTES.md:149`, `docs/AUDIT-BRUT-FINDINGS.md:134,299,1020`, `api/README-API.md:224`)
  et la constante de sortie de son propre générateur (`build_dashboard.py:20`) ;
- la date de modification de `dashboard.html` et de `build_dashboard.py` est **identique au
  bit près** (2026-09-07 19:34:13), et un seul commit les porte (`f4022c0`).

`docs/AUDIT-BRUT-FINDINGS.md:299` le dit explicitement : « **artefact statique généré**
[…] Ouvert via `file://` ».

**Ce qu'il fait encore, en revanche, et qui est un problème actif.** Ses deux seuls appels
réseau visent la production, avec un secret en clair :
- `dashboard.html:141` : `const API_BASE = "https://api.eperformance.pro";`
- `dashboard.html:142` : `const API_TOKEN = "…";` — **jeton bearer en clair**
- `dashboard.html:175` : `fetch(.../update_status.php, {method:'POST', headers:{Authorization: Bearer ${API_TOKEN}}, …})`
- `dashboard.html:191` : `fetch(.../stop_prospect.php?key=${API_TOKEN}&id=…)`

Tant que ce fichier existe sur le disque, quiconque l'ouvre lit un jeton d'écriture sur
l'API de production. `docs/AUDIT-BRUT-FINDINGS.md` l'avait déjà relevé
(`PATCH_NOTES.md:149` : « `dashboard.html` / `build_dashboard.py` dupliquent le cockpit
(token en dur) »).

#### C. `templates_dashboard/dashboard.html` — une coque SaaS, non démarrable

**Ce qu'il fait.** C'est le seul des trois à avoir une **structure de produit** : barre
latérale de 280 px, 6 entrées de navigation, fond animé à trois dégradés radiaux,
glassmorphism (`backdrop-filter: blur(20px)`), en-tête avec titre de section. Il appelle
5 endpoints de `dashboard_app.py` :

`/api/analytics/summary` · `/api/generate/text` · `/api/generate/image` · `/api/ia/status` · `/api/quick/retry-failed`
plus `/api/quick/export-metrics` par redirection (`dashboard.html:967`).

**Est-il utilisé ?** Non, et il ne **peut pas** l'être dans l'état actuel :

```
$ cd /home/ballo/OX6A/agent-ia-web && python3 -c "import dashboard_app"
IMPORT ECHOUE : ModuleNotFoundError No module named 'flask_cors'
```

`dashboard_app.py:19` importe `from flask_cors import CORS` ; `flask_cors` est absent de
l'environnement (`python3 -c "import flask_cors"` → `ModuleNotFoundError`). Le fichier est
pourtant pinné dans `requirements_dashboard.txt:2` (`Flask-CORS==4.0.0`) — qui n'est jamais
appliqué. **La dépendance est déclarée, pas installée, et rien ne le vérifie.**

**Deux défauts prouvés par lecture, au-delà du point de démarrage :**

1. **L'onglet « Paramètres » plante.** `dashboard.html:520` déclenche `switchSection('settings')`.
   `switchSection` (`dashboard.html:747-752`) exécute
   `document.getElementById('section-' + section).classList.add('active')`. Or il n'existe
   que **cinq** sections dans le HTML (`dashboard.html:546,621,692,705,721` : `dashboard`,
   `generate`, `analytics`, `monitoring`, `actions`). Il n'y a **aucun** `id="section-settings"` :
   `getElementById` rend `null`, et `.classList` sur `null` lève un `TypeError`. Clic → rien
   ne se passe, console en erreur.

2. **Le sélecteur de fournisseur est un alerteur.** `dashboard.html:537` :
   `<div class="provider-badge" onclick="alert('Modal changement provider à venir')">`.
   Les routes `/api/config/llm-provider` et `/api/config/llm-test` sont écrites dans
   `dashboard_app.py` (l.171, l.188) mais **jamais appelées par le gabarit** : elles sont
   mortes côté client.

**Ce qu'il a que les autres n'ont pas :** la seule architecture de navigation (6 sections,
une seule visible à la fois), le seul état de chargement visuel par squelette de page, et
la seule recherche d'un langage visuel de produit (KPI en grille, cartes, badges d'état).
C'est de la **mise en page**, pas de la fonction — `switchSection` fait 25 lignes.

### 1.3 Matrice « qui a quoi »

| Capacité | A — cockpit | B — dashboard.html | C — templates |
|---|---|---|---|
| Servi par HTTP | **oui** | non | oui mais non démarrable |
| Données vivantes | **oui** (`/api/state`) | non (vidage à la génération) | oui (5 endpoints) |
| Écriture / actions | **oui** (tout le pipeline) | 2 appels distants | non (lecture + génération) |
| Génération de publications | **oui** (17 routes) | non | non |
| Génération d'images / design | **oui** (3 routes) | non | 1 route |
| Agents IA / skills | **oui** (`/api/agents`, panneau Skills) | non | non |
| Veille | **oui** (`/api/veille`) | non | non |
| Scraping (Ads / Maps / VCF) | **oui** (3 routes) | non | non |
| Programmation / publication | **oui** (6 routes) | non | non |
| Diagnostic système (`/api/system-check`) | **oui** | non | non |
| Navigation par sections | non (12 modales) | non | **oui** (6 sections, dont 1 cassée) |
| Graphiques Chart.js | non | **oui** (4) | non |
| Barre latérale | non | non | **oui** |
| Fonctionne hors ligne | **oui** (0 CDN) | non (2 CDN) | non (2 CDN) |
| Jetons conformes au design system | **oui** (voir §1.4) | non | non |

**Aucune des 12 capacités fonctionnelles de A n'existe dans B ou C.** L'inverse est faux :
B et C n'ont que de la présentation que A n'a pas.

### 1.4 La charte du cockpit est déjà celle du design system

C'est le constat le plus décisif de cet audit, et il se mesure.

En confrontant `cockpit.html:136-158` au tableau canonique de
`/home/ballo/OX6A/DESIGN-SYSTEM-UNIFIE.md` (colonnes « Sombre »), **14 jetons sur 16 sont
identiques au caractère près** :

| Jeton | `cockpit.html` | Valeur canonique (sombre) | Conforme |
|---|---|---|---|
| `--bg` | `#08080c` (l.137) | `#08080c` (`DSU.md:76`) | oui |
| `--bg2` | `#0c0c10` (l.138) | `#0c0c10` | oui |
| `--card` | `#101014` (l.139) | `#101014` | oui |
| `--card2` | `#14141a` (l.140) | `#14141a` | oui |
| `--text` | `#edeae3` (l.141) | `#edeae3` | oui |
| `--soft` | `#b0aaa0` (l.142) | `#b0aaa0` | oui |
| `--muted` | `#8b8b96` (l.143) | `#8b8b96` | oui |
| `--gold` | `#c9a96e` (l.144) | `#c9a96e` | oui |
| `--gold2` | `#e2c07a` (l.145) | `#e2c07a` (`SITE`) / `#cfb583` (`NOYAU`) | **écart connu** (`DSU.md:2.3`) |
| `--border` | `#1c1c22` (l.148) | `#1c1c22` (`DSU.md:89`) | oui |
| `--border2` | `#282830` (l.149) | `#282830` (`DSU.md:90`) | oui |
| `--border-strong` | `#646470` (l.150) | `#646470`, 3,25:1 (`DSU.md:91`) | oui |
| `--wa` | `#25D366` (l.151) | `#25D366` (`DSU.md:114`) | oui |
| `--wa-text` | `var(--wa)` (l.152) | `#25D366` sombre (`DSU.md:115`) | oui |
| `--red-text` | `#e07070` (l.153) | `#e07070` (`DSU.md:99`) | oui |

Les deux seuls écarts :

1. `--gold2` : `#e2c07a` (cockpit, = valeur `SITE`) contre `#cfb583` (noyau). L'écart est
   **déjà arbitré et documenté** dans `DESIGN-SYSTEM-UNIFIE.md` §2.3.
2. Les piles de repli typographiques : le cockpit écrit
   `'Cormorant Garamond', Georgia, serif` (l.154) et `'DM Sans', system-ui, …` (l.155),
   là où le canon est `'Cormorant Garamond', 'Cormorant Fallback', Georgia, serif` et
   `'DM Sans', 'DM Sans Fallback', system-ui, …` (`DSU.md:122-124`). Le nom `… Fallback`
   manque — c'est un correctif de deux noms.

**Conséquence.** Le cockpit n'a pas de problème de charte : sa couche de jetons est déjà
celle du site, et il l'a payée (commit `8389309`, « refonte(cockpit): aligne le tableau de
bord sur le design system du site »). Les deux autres dashboards, eux, partent d'ailleurs :

- **B** déclare sa propre palette (`dashboard.html:9`) : `--bg:#0A0B0F`, `--text:#E8E5DE`,
  `--muted:#8C8B85`, `--border:rgba(201,169,110,0.18)` + 4 états
  (`--success:#7FB069`, `--warning:#E6B85C`, `--danger:#D97757`, `--info:#6B8FB0`).
  **Aucun de ces 8 noms ne correspond au canon** : `#0A0B0F` ≠ `#08080c`, `#E8E5DE` ≠ `#edeae3`,
  `#8C8B85` ≠ `#8b8b96`. Les états `success/warning/danger/info` sont un **cinquième**
  vocabulaire d'état dans le projet (le canon en a quatre autres : `--succes`, `--alerte`,
  `--erreur`, `--info`, `DSU.md:99-106`).
- **C** déclare la palette **indigo Tailwind par défaut** (`dashboard.html:16-32`) :
  `--primary:#6366f1`, `--primary-light:#818cf8`, `--primary-dark:#4f46e5`,
  `--bg:#0f172a`, `--bg-secondary:#1e293b`, `--bg-tertiary:#334155`,
  `--text:#f1f5f9`, `--text-muted:#94a3b8`. C'est la palette de Tailwind `indigo-500` /
  `slate-900`, sans rapport avec ePerformance. **Ajouter C au dépôt reviendrait à
  introduire une quatrième charte**, l'or et l'encre disparaissant au profit de l'indigo.

---

## 2. Recouvrement des routes, mesuré

### 2.1 Les deux serveurs

| | `prospect_app.py` | `dashboard_app.py` |
|---|---|---|
| Chemin | `toolkit_eperformance/prospect_app.py` | `agent-ia-web/dashboard_app.py` |
| Lignes | 2 382 | 560 |
| Routes | **75** | **14** |
| Décorateurs | `@app.get/@app.post` | `@app.route(..., methods=[…])` |
| Écoute | `host="127.0.0.1"`, `port=8787` (défaut) — `prospect_app.py:2294` | `host="0.0.0.0"`, `port=5000`, **`debug=True`** — `dashboard_app.py:560` |
| Gabarit | lit `cockpit.html` sur disque | `template_folder='templates_dashboard'` — `dashboard_app.py:43` |
| Démarrable aujourd'hui | **oui** | **non** (`flask_cors` absent) |
| En cours d'exécution | **oui** (2 instances) | **non** |

### 2.2 Le recouvrement exact

Comparaison après normalisation des segments variables (`<tid>` ≡ `<cle>` ≡ `<nom>` ≡ `<pub_id>`) :

**Routes communes : 7 sur 14** (soit **50,0 %** du serveur de C, **9,3 %** de celui de A).

| Route | `prospect_app.py` | `dashboard_app.py` | Appelée par le cockpit ? |
|---|---|---|---|
| `/` | l.2276 | l.147 | oui (chargement de la page) |
| `/api/analytics/summary` | l.1271 | l.400 | oui |
| `/api/config/llm-status` | l.1027 | l.157 | oui |
| `/api/config/llm-provider` | l.1046 | l.171 | oui |
| `/api/config/llm-test` | l.1074 | l.188 | oui |
| `/api/ia/status` | l.1342 | l.498 | oui |
| `/api/quick/retry-failed` | l.1618 | l.479 | oui |

**Les 7 routes communes sont toutes déjà servies par le cockpit.** Elles ne sont pas
« recouvertes partiellement » au sens où C apporterait quelque chose : A les couvre
intégralement et l'interface les appelle déjà.

**Routes propres à `dashboard_app.py` : 7**

| Route | Ligne | Utilisée par C ? | Verdict |
|---|---|---|---|
| `/api/analytics/history` | l.426 | **non** | mort côté client |
| `/api/generate/text` | l.231 | oui | recouvre `/api/generate-msg` (l.394) et `/api/publications/generate` (l.499) de A |
| `/api/generate/narrative` | l.279 | **non** | mort côté client ; `narrative_engine` n'est appelé par personne |
| `/api/generate/image` | l.320 | oui | recouvre `/api/publications/<id>/image` (l.638) et `/api/design/generate-image` (l.1107) de A |
| `/api/personas/list` | l.528 | **non** | mort côté client ; `personas.py` non consommé par l'UI |
| `/api/quick/batch-images` | l.445 | **non** | recouvre `/api/publications/generate-all-images` (l.2068) de A |
| `/api/quick/export-metrics` | l.466 | oui (redirection, l.967) | recouvre `/api/quick/export-zip` (l.1558) de A |

**Bilan du recouvrement : 7/14 routes sont des doublons stricts, 4/14 sont des doublons
fonctionnels sous un autre nom, 3/14 ne sont appelées par personne.** Il n'existe **aucune
route de `dashboard_app.py` qui apporte une capacité absente de `prospect_app.py`.**

### 2.3 Sens inverse : ce que le cockpit n'appelle pas

Sur les 75 routes de `prospect_app.py`, le code du cockpit en référence **67** — soit
**89,3 %**. Les 8 restantes :

| Route | Ligne | Raison mesurée |
|---|---|---|
| `/` | 2276 | appelée par le navigateur, pas par le JS (compte comme couverte en pratique) |
| `/api/publications/generate` | 499 | vestige ; l'UI passe par `generate-batch` (l.550) |
| `/api/social/articles` | 703 | vestige |
| `/api/social/generer` | 713 | vestige |
| `/api/agents` | 944 | **vestige** — `openSkillsPanel` ne l'appelle pas ; le panneau skills construit son contenu localement |
| `/api/ia/config` | 1455 | doublon de `/api/ia-config` (l.998) |
| `/api/etat/taches` | 2310 | **code mort** — voir §3 |
| `/api/etat/brouillons` | 2346 | **code mort** — voir §3 |

**Conclusion sur le recouvrement.** Le recouvrement n'est pas un chevauchement de deux
moitiés complémentaires : c'est **un serveur complet (75 routes, vivant) et un serveur
partiel (14 routes, arrêté) dont les 7 routes communes sont un sous-ensemble du premier**.
Fusionner les deux dans l'autre sens — garder C et y verser A — demanderait de réécrire
61 routes et 12 écrans pour retrouver l'état actuel.

---

## 3. Persistance et état — l'état réel

### 3.1 `etat_cockpit.py` : le module est sain

`etat_cockpit.py` fait 176 lignes et fait ce qu'il annonce. Points vérifiés :

| Propriété annoncée | Vérification | Verdict |
|---|---|---|
| Fichier hors dépôt | `etat_cockpit.py:26-29` : `Path.home()/"Documents"/"cockpit_etat.json"`, surchargeable par `COCKPIT_ETAT` | conforme |
| Écriture atomique | `etat_cockpit.py:57-70` : `tempfile.mkstemp` dans le même répertoire, puis `os.replace` | conforme |
| Purge à 6 h | `etat_cockpit.py:35` `DUREE_TACHE_MAX = 6 * 3600` ; `_purger()` l.73-78 | conforme |
| Fichier corrompu non bloquant | `etat_cockpit.py:43-51` : sauvegarde en `.corrompu.json` et repart d'un état vide | conforme |
| Bornage du pourcentage | `etat_cockpit.py:96-106` : plafonné à 92 % tant que la tâche court, 100 % seulement si `etat == "termine"` | conforme, et la justification est écrite (l.96-98) |
| Aucun emoji | `etat_cockpit.py` : 0 séquence emoji sur 176 lignes | conforme au contrat |

**Ce module est le seul fichier du socle qui soit irréprochable.** Il n'est pas le problème.

### 3.2 Les 11 routes `/api/etat/*` ne sont jamais appelées — et la preuve est matérielle

`prospect_app.py:2304-2380` expose 11 routes. Elles sont intégralement écrites, et un
client complet les attend côté navigateur : l'objet `Etat` (`cockpit.html:2527-2597`),
qui déclare `suivre()`, `brouillon()`, `vue` et `resume()`, et référence littéralement
`/api/etat/tache`, `/api/etat/tache/<id>`, `/api/etat/tache/<id>/fin`,
`/api/etat/brouillon/<cle>`, `/api/etat/vue/<nom>`, `/api/etat/resume`.

**Le constat de l'audit antérieur est confirmé, et je le précise :**

```
$ grep -o 'UI\.'   cockpit.html | wc -l   →  1     (un commentaire, ligne 2403)
$ grep -o 'Etat\.' cockpit.html | wc -l   →  0
$ grep -c 'Etat\.suivre\|Etat\.brouillon\|Etat\.vue\|Etat\.resume' cockpit.html  →  0
$ grep -c 'UI\.btn\|UI\.carte\|UI\.stat\|UI\.champ\|UI\.tableau\|UI\.modale\|UI\.badge\|UI\.vide\|UI\.squelette\|UI\.progression' cockpit.html  →  1
```

Les deux nombres valent **0 usage réel** :
- `Etat` (déclaré `cockpit.html:2527`) n'est **jamais** appelé. L'unique occurrence de `Etat.`
  dans le fichier est la déclaration elle-même (`const Etat = (() => {`).
- `UI` (déclaré `cockpit.html:2405`) n'est **jamais** appelé. L'unique occurrence de `UI.`
  est le commentaire d'usage `cockpit.html:2403` :
  `Usage : UI.btn('Publier', { variante:'primaire', action:'publier()' })`.

**La preuve que rien n'a jamais été exercé** — et elle n'est pas dans le code, elle est sur
le disque :

```
$ ls -la ~/Documents/cockpit_etat.json
ls: impossible d'accéder à '.../cockpit_etat.json': Aucun fichier ou dossier de ce nom

$ curl -s http://127.0.0.1:8787/api/etat/resume
{"brouillons":0,"fichier":"/home/ballo/Documents/cockpit_etat.json","taches_en_cours":0}
```

Le fichier d'état **n'existe pas**. Or la première ligne de code qui appellerait
`tache_debut()`, `brouillon_ecrire()` ou `vue_ecrire()` le créerait
(`etat_cockpit.py:59` fait un `mkdir(parents=True, exist_ok=True)`). Sa seule lecture par
`resume()` ne l'écrit pas — `_lire()` retourne `VIDE` sans créer le fichier
(`etat_cockpit.py:38-40`).

**Le fichier absent est donc la preuve qu'aucune des 11 routes n'a jamais été appelée**,
depuis la pose du module (commit `e00e56a`, « persistance de l'état — phase C »).

**Conséquence pour la refonte :** la phase C existe, elle est correcte, elle est
**branchée à rien**. Ce n'est pas 11 routes à porter — c'est **11 routes à brancher**.
C'est une dette de câblage, pas de conception.

### 3.3 Le socle de composants : 0 % d'utilisation atteignable

Le bloc CSS `SOCLE DE COMPOSANTS — phase A` occupe `cockpit.html:170-276` (le commentaire
ouvre à la ligne 170, le `@media (prefers-reduced-motion)` ferme à la ligne 276, `</style>`
est à la ligne 277). Le module JS correspondant, `const UI = (() => {`, occupe
`cockpit.html:2405-2519`.

Mesure de chaque composant, sur trois zones distinctes : la définition CSS (`170-276`),
la fabrique JS (`2405-2519`), et **le reste du fichier** — c'est-à-dire tout endroit qui
produirait réellement la classe à l'écran.

| Composant | Occurrences dans la CSS | Occurrences dans `UI()` | **Occurrences ailleurs (atteignables)** |
|---|---:|---:|---:|
| `.btn2` | 14 | 1 | **0** |
| `.carte2` | 7 | 2 | **0** |
| `.champ2` | 9 | 2 | **0** |
| `.tableau2` | 6 | 1 | **0** |
| `.modale2` | 5 | 1 | **0** |
| `.badge2` | 8 | 1 | **0** |
| `.vide2` | 3 | 4 | **0** |
| `.squelette2` | 2 | 1 | **0** |
| `.progression2` | 6 | 1 | **0** |
| **Total** | **60** | **14** | **0** |

**Le socle de composants a un taux d'utilisation réel de 0 %.**

Les 9 classes n'apparaissent que (a) dans leur propre déclaration CSS et (b) dans la
fabrique `UI()` qui, n'étant jamais appelée, ne les émet jamais. Aucune ne peut atteindre
le DOM. Ce n'est pas un socle sous-utilisé : c'est **du code mort décoré comme un socle**,
et c'est le point le plus important à retenir pour la refonte — le tableau de bord unifié
ne pourra pas « réutiliser » ce socle, il devra le **brancher**.

Point connexe : `--gold-bg` (l.146), `--gold-border` (l.147), `--arrondi` (l.156) et
`--arrondi-sm` (l.157) sont déclarés dans `:root` et **consommés par personne**
(`grep -c "var(--gold-bg)"` → 0, idem pour les trois autres). Ce sont les 4 jetons que le
socle devait consommer.

---

## 4. Configuration et secrets

**Aucune valeur de secret n'apparaît dans ce document.** Chaque entrée est identifiée par
`fichier:ligne` et par nature.

### 4.1 Carte des secrets

| Fichier:ligne | Nature | État | Versionné ? | Droits |
|---|---|---|---|---|
| `toolkit_eperformance/config_ia.json:4` | clé API DeepSeek, **en clair** | renseignée (35 car.) | **oui** (`git ls-files`) | `rwxr-xr-x` |
| `toolkit_eperformance/config_api.json:4` | clé API DeepSeek (repli), **en clair** | renseignée (35 car.) | **oui** (`git ls-files`) | `rwxr-xr-x` |
| `toolkit_eperformance/prospect_scraper.py:37` | jeton bearer API PHP, **en clair** | renseigné | oui | — |
| `toolkit_eperformance/build_dashboard.py:22` | jeton bearer API PHP, **en clair** | renseigné | oui | — |
| `toolkit_eperformance/dashboard.html:142` | jeton bearer API PHP, **en clair** | renseigné | oui | — |
| `toolkit_eperformance/prospect_app.py:249` | jeton bearer API PHP, **en clair** | renseigné | oui | — |
| `toolkit_eperformance/content_engine.py:1986` | jeton bearer, défaut en clair du `os.environ.get` | renseigné | oui | — |
| `toolkit_eperformance/content_engine.py:2602` | jeton bearer, défaut d'un argument CLI | renseigné | oui | — |
| `toolkit_eperformance/prospect_app.py:771,800,830,862,1871,1914,1998` | jeton bearer, 7 défauts en clair | renseigné | oui | — |
| `toolkit_eperformance/api/*.php` (13 fichiers) | jeton bearer, **en clair** — c'est l'API de production | renseigné | oui | — |
| `toolkit_eperformance/webhook_reponse.php:23`, `webhook_wa.php:21` | jeton bearer, en clair | renseigné | oui | — |
| `toolkit_eperformance/n8n/*.json` (4 fichiers) | jeton bearer, en clair | renseigné | oui | — |
| `toolkit_eperformance/prospect_app.log:20,26,32,…` (18 occ.) | **fragment de clé API + URL de passerelle + modèle, dans un journal** | présent | non (`.gitignore:37 *.log`) | `rwxr-xr-x` |
| `agent-ia-web/.env:9` | clé API Anthropic, en clair | renseignée (67 car.) | non (`.gitignore:22`) | **`-rw-r--r--`** |
| `agent-ia-web/.env:17` | clé API Z.ai, en clair | renseignée (49 car.) | non | `-rw-r--r--` |
| `agent-ia-web/.env:22` | clé API DeepSeek, en clair | renseignée (35 car.) | non | `-rw-r--r--` |
| `agent-ia-web/.env:27` | clé API OpenAI | **vide** | non | `-rw-r--r--` |
| `agent-ia-web/.env:32,37` | clés Pexels, SerpAPI | renseignées | non | `-rw-r--r--` |
| `agent-ia-web/.env:55,57,58,60` | jetons GitHub, admin, Telegram, chatbot | renseignés | non | `-rw-r--r--` |
| `agent-ia-web/.env:50` | clé PageSpeed | **vide** | non | `-rw-r--r--` |

**Trois constats, dans l'ordre de gravité :**

**1. Le jeton de l'API de production est en clair 78 fois dans le dépôt.**
Mesure : `grep -rn` sur la valeur littérale, restreint à `toolkit_eperformance/` → **78
occurrences** réparties sur 18 fichiers (la valeur n'est pas reproduite ici ; elle commence
par `ep_perf_` et est listée en §4.1). Il apparaît
dans les 13 fichiers PHP qui **sont** l'API `api.eperformance.pro`, dans 4 flux n8n, dans
5 fichiers Python, dans `build_dashboard.py:22`, dans `dashboard.html:142`, et dans la
documentation (`DEPLOIEMENT-SERVEUR.md:38,41`, `api/README-API.md` 14 fois). Ce jeton
autorise l'écriture : `api/update_status.php:34`, `api/stop_prospect.php:40`,
`api/cron_publications.php:36,38`, `api/upload_publications.php:25`.

**2. `config_api.json` et `config_ia.json` sont versionnés sciemment.**
`git ls-files` les liste tous les deux. Le fichier `.gitignore:17-24` le documente lui-même :
« Les clés API vivent aussi en clair dans `config_api.json` et `config_ia.json` (constat
d'audit du 18/09/2026) : ces deux fichiers ne sont PAS ignorés pour que le toolkit reste
reproductible, mais ils ne doivent JAMAIS partir vers un dépôt distant avant rotation des
clés. » Le fichier `config_ia.json:10` porte le même avertissement en deuxième ligne de
défense. **La décision est assumée, et elle reste un risque** : elle transforme une
publication accidentelle en compromission immédiate.

**3. `.env` est lisible par tout le système.** `agent-ia-web/.env` est en `rw-r--r--`
(groupe et autres : lecture). Il contient 16 secrets renseignés, dont 4 jetons d'écriture
(GitHub, admin, Telegram, chatbot). Un `-rw-------` serait le minimum.

**4. Une fuite dans un journal.** `toolkit_eperformance/prospect_app.log` contient 18 fois
un fragment de clé API accompagné de l'URL et du modèle de la passerelle, sur le motif
`API Key (first 20)`. Le journal date du 2026-09-10 12:32 et n'est pas versionné
(`.gitignore:37`), mais il est en clair sur le disque. La chaîne qui l'imprimait **n'existe
plus dans le dépôt** (`git log -S 'API Key (first 20)'` → aucun résultat) : le code a été
retiré, le journal est resté.

### 4.2 Combien de fournisseurs déclarés, combien réellement utilisés

Le constat d'audit antérieur (« `openai`, `zai`, `zai_sdk` sont morts, clés vides ») est
**vrai pour le toolkit et faux pour le noyau**. Il y a **cinq registres**, pas deux :

| Registre | Fichier:ligne | Déclarés | Avec clé non vide | Repli effectif |
|---|---|---|---|---|
| Toolkit — génération | `config_ia.json:2,4,7` | **1** : `deepseek` | **1** | non |
| Toolkit — code de génération | `content_engine.py:1500-1505` | 4 branches : `zai_sdk`, `openai`, `deepseek`, `zai` | — | **inatteignables** |
| Toolkit — design | `config_api.json:2,4` | **1** : `deepseek` | **1** | non |
| Noyau — client IA | `agent-ia-web/.env:9,17,22,27` | **4** : `anthropic`, `zai`, `deepseek`, `openai` | **3** (`openai` vide) | **oui, 3 paliers** (`ai_client_v2.py:521-575`) |
| Noyau — dashboard | `dashboard_app.py:174` | **3** : `claude`, `deepseek`, `glm` | — | non |

**Preuves du caractère mort des branches, côté toolkit :**

`content_engine.py:1494` ferme l'accès :
```python
def _llm_available(provider):
    """Vérifie si une clé API est disponible pour le provider."""
    return bool(API_KEYS.get(provider))
```
et `API_KEYS` vient de `config_ia.json` (`content_engine.py:107`), qui ne contient que
`deepseek`. Donc `_generate_with_zai_sdk()` (`content_engine.py:1727`) et la branche
`openai` de `_generate_with_openai_compat()` (`content_engine.py:1502`, qui viserait
`https://api.openai.com/v1` d'après `content_engine.py:1597`) sont inatteignables :
`_llm_available` retourne `False` pour les trois. `openai` est par ailleurs vide **partout**
(`.env:27`), donc mort au niveau du projet entier.

**Ce qui est faux dans le constat antérieur :** `zai` et `zai_sdk` **ne sont pas morts au
niveau du noyau**. `agent-ia-web/.env:17` porte une clé Z.ai renseignée, et
`ai_client_v2.py:521-575` documente une **cascade à trois paliers**
DeepSeek → Z.ai GLM → Claude, avec les URL construites en `ai_client_v2.py:144-148`
(`GLM_URL` par défaut `https://api.z.ai/api/paas/v4`, `CLAUDE_URL` par défaut
`https://aiapiflow.com`). Le commentaire `ai_client_v2.py:533-537` indique même que le
troisième palier est **délibéré** : « Claude est donc conservé en troisième position […]
Le désactiver tient à une ligne : retirer `ANTHROPIC_API_KEY` de l'environnement. »

**Donc : le toolkit est monofournisseur (DeepSeek), le noyau est trifournisseur.** Ce ne
sont pas deux registres divergents, c'est **une divergence d'architecture entre les deux
moitiés du socle**. Et c'est le point où le tableau de bord unifié devra trancher, parce
qu'il est le seul consommateur des deux.

### 4.3 Les deux registres que la demande visait — tranché

La demande signalait `/api/config/llm-provider` (2 valeurs) contre `/api/ia-config`
(5 valeurs). Mesure à l'instant, sur le code **et** sur le serveur en marche :

| Registre | Fichier:ligne | Valeurs acceptées aujourd'hui | Mesure live |
|---|---|---|---|
| `/api/config/llm-provider` | `prospect_app.py:1055` | **1** : `deepseek` | `curl -d '{"provider":"zai_sdk"}'` → **400** |
| `/api/ia-config` | `prospect_app.py:1014` | **2** : `templates`, `deepseek` | `GET /api/ia-config` → `providers_disponibles: ['deepseek']`, `models: {'deepseek': 'deepseek-flash'}` |
| `<select id="iaProvider">` du cockpit | `cockpit.html:768-773` | **5** : `templates`, `openai`, `anthropic`, `deepseek`, `zai_sdk` | — |

**Il y a donc bien une divergence, mais elle est entre l'interface (5) et le serveur (2).**
Trois des cinq options du menu déroulant sont rejetées :

```
$ curl -d '{"provider":"openai"}'   .../api/ia-config  → 400 {"error":"provider invalide — seuls 'deepseek' et 'templates' subsistent"}
$ curl -d '{"provider":"anthropic"}' .../api/ia-config → 400
$ curl -d '{"provider":"zai_sdk"}'  .../api/config/llm-provider → 400
```

Le « 2 contre 5 » de la demande correspond à l'état des registres **avant** le commit
`711c521` (« refactor(llm)!: retire la passerelle Claude et le repli GLM — DeepSeek Flash
seul »). Mesure sur l'historique :

| Commit | `prospect_app.py` — registre `/api/ia-config` | `prospect_app.py` — registre `/api/config/llm-provider` |
|---|---|---|
| `f4022c0` (initial) | l.951 : `["templates","openai","anthropic","deepseek","zai","zai_sdk"]` — **6** | l.990 : `["deepseek","claude"]` — **2** |
| `8389309` et après | l.1014 : `["templates","deepseek"]` — **2** | l.1055 : `!= "deepseek"` — **1** |

**Tranché : il n'y a plus deux registres serveur divergents — il en reste un seul
crédible, `deepseek`, plus un mode sans modèle (`templates`). La divergence qui subsiste
est UI ↔ serveur, et elle est dans le menu du cockpit.**

**À corriger dans le dashboard unifié :** le `<select id="iaProvider">` (`cockpit.html:768-773`)
doit être alimenté par `GET /api/ia-config` (`prospect_app.py:998-1007` renvoie déjà
`providers_disponibles` et `models`) au lieu d'être écrit en dur. Aujourd'hui, trois
options sur cinq échouent en silence derrière un `toast` d'erreur
(`cockpit.html:1248-1254`).

---

## 5. Lancement et empaquetage

### 5.1 Les lanceurs existants

`find /home/ballo/OX6A -maxdepth 4 \( -name "*.desktop" -o -name "lancer*.sh" -o -name "start*.sh" \)` → **3 fichiers** :

| Fichier | Cible | Verdict |
|---|---|---|
| `toolkit_eperformance/lancer-cockpit.sh` | `cd /home/ballo/OX6A/prospecting-toolkit` (l.5) | **cassé** |
| `toolkit_eperformance/cockpit.desktop` | `Exec=/home/ballo/OX6A/prospecting-toolkit/lancer-cockpit.sh` (l.5) | **cassé** |
| `agent-ia-web/start_dashboard.sh` | `$PYTHON_CMD dashboard_app.py` (l.84) | **inopérant** (`flask_cors` absent) |

**Le diagnostic antérieur est confirmé, et je le précise par trois faits :**

```
$ ls -la /home/ballo/OX6A/prospecting-toolkit
ls: impossible d'accéder à '/home/ballo/OX6A/prospecting-toolkit': Aucun fichier ou dossier de ce nom
```

1. `lancer-cockpit.sh:5` fait `cd /home/ballo/OX6A/prospecting-toolkit || exit 1`.
   Le répertoire n'existe pas → le script sort en code 1 **avant d'avoir rien fait**.
   Les 20 lignes suivantes (kill du port 8787, purge de `__pycache__`, démarrage) ne
   s'exécutent jamais.
2. `cockpit.desktop:5` pointe vers ce script, c'est-à-dire vers un chemin qui n'existe pas.
   Le raccourci ne peut pas démarrer quoi que ce soit.
3. **La copie installée est identique.** `~/.local/share/applications/cockpit.desktop`
   (daté du 25 août) porte le même `Exec=` mort. Archiver ou corriger
   `toolkit_eperformance/cockpit.desktop` ne suffira donc pas : **le fichier installé dans
   `~/.local/share/applications/` doit être corrigé aussi**, sinon le menu d'applications
   continuera de proposer une entrée qui ne marche pas.

Deux des trois lanceurs sont donc morts, et le troisième mène à un serveur non démarrable.

### 5.2 Comment l'outil est réellement démarré aujourd'hui

Il est démarré **à la main, en ligne de commande, depuis le dépôt** :

```
$ readlink /proc/1379878/cwd
/home/ballo/OX6A/toolkit_eperformance
$ tr '\0' ' ' < /proc/1379878/cmdline
python3 prospect_app.py
$ readlink /proc/1370122/cwd
/home/ballo/OX6A/toolkit_eperformance
$ tr '\0' ' ' < /proc/1370122/cmdline
python3 prospect_app.py --port 8788 --no-browser
```

Trois observations :

1. **Deux instances tournent sur deux ports** (8787 et 8788), depuis le même répertoire,
   et les deux servent le **même fichier** `cockpit.html` lu à chaud. Elles partagent donc
   `prospects_tracking.csv`, `publications.csv` et l'état — non établi si c'est
   intentionnel. `lancer-cockpit.sh:8-16` tue explicitement l'ancien processus sur 8787
   précisément pour éviter ce genre de doublon.
2. **Aucune persistance de service.** `crontab -l` ne contient que six scripts de
   sauvegarde (`backup_postgres_local.sh`, `backup_lws_data.sh`, …) — **aucune ligne ne
   démarre le cockpit**. `systemctl --user list-units --type=service` filtré sur
   `cockpit|prospect|eperf|dashboard` → **aucun résultat**. Il n'existe ni unité systemd,
   ni entrée de crontab `@reboot`.
3. **Aucun redémarrage automatique.** Si la machine redémarre, le cockpit ne revient pas.
   Le seul chemin de retour est la ligne de commande manuelle.

**Ce qu'il faut retenir pour la refonte :** l'outil n'a **aucun lanceur fonctionnel**. Il
n'y a pas de lanceur cassé à réparer — il y a un lanceur à **écrire**, et à installer aux
deux endroits (`toolkit_eperformance/cockpit.desktop` **et**
`~/.local/share/applications/`).

### 5.3 Dépendances

**Il n'existe aucun `requirements*.txt` dans `/home/ballo/OX6A/toolkit_eperformance/`** :

```
$ ls /home/ballo/OX6A/toolkit_eperformance/requirements*
ls: impossible d'accéder à '.../requirements*': Aucun fichier ou dossier de ce nom
```

**Ce qui est implicitement requis.** Extraction AST des imports tiers sur les 15 modules
du socle : `PIL`, `bs4`, `flask`, `playwright`, `requests` — plus trois imports qui
**pointent vers des modules désactivés** : `branding_helper` (fichier présent sous
`branding_helper.py.disabled`), `logo_composition` (`logo_composition.py.disabled`) et
`backend`. Les trois sont déjà protégés par `try/except` côté appelant
(`content_engine.py:70-74` pour `branding_helper`), donc sans effet — mais leur présence
signifie qu'**aucun contrôle statique ne peut dire si le socle est complet**.

**L'environnement réel** (mesuré, `python3 -m pip freeze`) : `Flask==3.1.3`,
`requests==2.31.0`, `beautifulsoup4==4.12.3`, `Pillow==10.1.0`, `playwright==1.62.0`,
`lxml==5.2.1`, `python-dotenv==1.0.0` — installés dans
`/home/ballo/.local/lib/python3.12/site-packages`, **hors du dépôt**.

**Les trois `requirements` d'`agent-ia-web` ne décrivent pas cet environnement :**

| Fichier | Contenu | Verdict |
|---|---|---|
| `requirements_dashboard.txt` | `Flask==3.0.0`, `Flask-CORS==4.0.0`, `requests==2.31.0`, `Pillow==10.1.0`, `anthropic==0.7.0`, `openai==1.3.0` | **faux** : Flask-CORS pinné mais absent, `anthropic`/`openai` pour des fournisseurs retirés |
| `requirements-complet.txt` | 22 épingles (`pillow==12.3.0`, `playwright==1.61.0`, `requests==2.34.2`, `lxml==6.1.1`, `beautifulsoup4==4.15.0`, `certifi==2026.6.17`, …) | **résolvable** mais **ne correspond pas** à l'installé (Pillow 10.1.0, playwright 1.62.0, requests 2.31.0) |
| `requirements-detected.txt` | `os`, `Path`, `select`, `shutil`, `subprocess`, `sys`, `time` | **sans objet** — c'est du bruit généré, pas des dépendances |

Vérifications faites :
- les 22 épingles de `requirements-complet.txt` **existent sur PyPI** (HTTP 200 sur
  `https://pypi.org/pypi/<paquet>/<version>/json` pour `pillow/12.3.0`,
  `beautifulsoup4/4.15.0`, `playwright/1.61.0`, `requests/2.34.2`, `lxml/6.1.1`) et
  `pip install --dry-run --no-deps` les résout ;
- **l'installation est bloquée par défaut** : `pip install` sans option renvoie
  `error: externally-managed-environment` (PEP 668, Debian). Installer demande
  `--break-system-packages` ou un venv — et **il n'y a aucun venv dans le toolkit**
  (`ls toolkit_eperformance/venv` et `.venv` → absents). Le processus tourne sur
  `/usr/bin/python3.12` avec les paquets de `~/.local`.

**Verdict.** Les dépendances sont **déclarées nulle part pour le socle**, et les trois
fichiers qui existent décrivent des environnements qui ne sont pas celui qui exécute
l'outil. Rien n'est gardé par un contrôle : `agent-ia-web/scripts/verifier-noyau.py`
existe, mais aucun contrôle de dépendances n'est branché sur le lancement.
La reprise est pourtant simple — les cinq paquets réellement requis sont identifiés.

### 5.4 Local seulement, ou déployé ?

**Local seulement, pour la partie Python.** Trois preuves :

1. L'écoute est bornée à la boucle locale : `prospect_app.py:2294`
   (`app.run(host="127.0.0.1", …)`). Le commentaire du fichier et
   `DEPLOIEMENT-SERVEUR.md:9-11` confirment : « Le cockpit local est déjà corrigé, mais le
   **serveur** api.eperformance.pro exécute encore les anciennes versions. »
2. Les dépendances incluent `playwright` + Chromium (rendu d'images) et le rendu de
   gabarits — l'outil suppose une machine de travail, pas un hébergement.
3. `cockpit.html:161-163` porte son intention en commentaire : « Polices auto-hébergées —
   le cockpit tourne souvent hors ligne. »

**Ce qui est déployé, c'est l'autre moitié.** Les 13 fichiers PHP de
`toolkit_eperformance/api/` sont téléversés chez LWS par FTP
(`DEPLOIEMENT-SERVEUR.md:12-24`), et c'est `api.eperformance.pro` qui exécute les crons de
publication (`api/cron_publications.php:36-38`, `api/cron_sequences.php:41-43`).

**Nuance importante pour la refonte.** Le port 5000 de `dashboard_app.py` écoute sur
`host="0.0.0.0"` (`dashboard_app.py:560`), c'est-à-dire **toutes les interfaces**, et avec
`debug=True`. Si ce serveur était démarré, il exposerait la console de débogage Werkzeug
au réseau local, sans authentification, avec 14 routes dont des routes de génération
payante. C'est une raison supplémentaire de ne pas le réactiver tel quel.

**Réponse :** le tableau de bord unifié est un outil **local à un utilisateur**. Le
déploiement concerne l'API PHP et le site, jamais le cockpit.

---

## 6. Les dépendances interdites par le contrat

Le contrat du projet interdit quatre choses : (a) toute police par CDN, (b) toute
dépendance externe au chargement, (c) toute valeur hexadécimale en dur dans le CSS,
(d) tout emoji dans l'interface. Mesure des quatre, sur les trois dashboards.

### 6.1 (a) et (b) — polices par CDN et dépendances externes

| Dashboard | Ressources externes chargées | Verdict |
|---|---|---|
| **A — cockpit.html** | **aucune.** `grep -oE 'https?://[^"'"'"' ]+'` ne remonte que des URL de contenu (`facebook.com/longrich`, `developers.facebook.com/tools/explorer`, `wa.me/${tel}`) — **zéro `<script src>` externe, zéro `<link href>` externe** | **conforme** |
| **B — dashboard.html** | `dashboard.html:5` `fonts.googleapis.com` (Outfit + DM Sans) ; `dashboard.html:6` `cdn.jsdelivr.net/npm/chart.js@4.4.1` | **non conforme, ×2** |
| **C — templates** | `dashboard.html:7` `fonts.googleapis.com` (preconnect) ; `dashboard.html:8` `fonts.googleapis.com` (Inter 300-800) | **non conforme** |

Le cockpit est le seul à respecter la règle (b). C'est **le seul des trois à fonctionner
hors ligne**, et c'est un choix délibéré : `cockpit.html:161-163` déclare sept `@font-face`
auto-hébergés avec le commentaire « le cockpit tourne souvent hors ligne ».

### 6.2 (c) — valeurs hexadécimales en dur

Mesure : motifs hexadécimaux dans les blocs `<style>`, **après retrait intégral du bloc
`:root`** (retrait par équilibrage d'accolades, pas par expression non gloutonne).

| Dashboard | Hex hors `:root` | Distinctes | `rgba()` hors `:root` |
|---|---:|---:|---:|
| **A — cockpit.html** | **21** | 17 | 62 |
| **B — dashboard.html** | **13** | 9 | 27 |
| **C — templates** | **4** | 4 | 8 |

Valeurs hors `:root` du cockpit, avec ligne :
`#08080c` (l.184, `.btn2--primaire`), `#a5c4ff` (l.766), `#ffb08a` (l.767, l.1305, l.1311),
`#E6B85C` et `#7FB069` (l.1080), `#12131a` (l.1163), `#E8E6DF` (l.1309) — plus les 21 que
le comptage par bloc isole, dont `#000`, `#0f0`, `#06120a`, `#1fa855`, `#16171f`, les ors
dérivés `#7A6A3A`, et une série de couleurs de statut (`#93bbfd`, `#d9c48f`, `#f0b35b`,
`#7ce4f4`, `#a7f3c4`, `#c98a84`, `#aab4c3`).

**Aucun des trois n'est conforme.** Le classement est net et il est l'inverse de l'intuition :
- **C est le plus propre** (4 valeurs, 4 occurrences, toutes dans deux dégradés de fond
  — `dashboard.html:36` et `:83`), mais c'est aussi celui dont la palette entière est
  étrangère au projet ;
- **B est intermédiaire** ;
- **A est le plus bruité en valeur absolue** — mais c'est aussi celui qui a **le plus de
  jetons déclarés** (25, contre 12 et 15), donc celui dont la dette est la plus mécanique à
  résorber : 21 occurrences à ramener vers 4 jetons manquants (`--gold-bg`, `--gold-border`,
  un jeton d'avertissement, un jeton de texte dégradé). L'audit `docs/refonte-cockpit/AUDIT-ET-STRATEGIE.md:96-99`
  avait déjà chiffré ce reste et le qualifiait de « à trancher au cas par cas ».

### 6.3 (d) — emojis

Définition appliquée : séquence = point de code pictographique
(`U+1F000–U+1FAFF`, `U+2600–U+27BF`, `U+2B00–U+2BFF`, `U+2190–U+21FF`) suivi ou non de
`U+FE0F`.

| Fichier | Séquences | Distinctes |
|---|---:|---:|
| `toolkit_eperformance/cockpit.html` | **315** | 66 |
| `toolkit_eperformance/dashboard.html` | **358** | 18 |
| `toolkit_eperformance/prospect_app.py` | **129** | 32 |
| `toolkit_eperformance/build_dashboard.py` | **67** | 21 |
| `agent-ia-web/templates_dashboard/dashboard.html` | **37** | 16 |
| `agent-ia-web/dashboard_app.py` | **7** | 5 |
| `toolkit_eperformance/etat_cockpit.py` | **0** | 0 |

**Écart à signaler par honnêteté :** la demande faisait état de **306** emojis dans
`cockpit.html`. Je mesure **315 séquences / 359 points de code** sur ce fichier. L'écart
(306 vs 315) est un écart de **méthode de comptage**, pas de fichier : selon que l'on
compte ou non le sélecteur de variante `U+FE0F` comme un emoji distinct, et selon que l'on
inclue ou non la plage `U+2600–U+27BF` (`⚠`, `✅` sont dans les deux), le total varie.
Les trois nombres (306, 315, 359) désignent la même réalité. Le détail le plus fréquent
du cockpit : `✅` (43), `❌` (39), `🔄` (13), `🤖` (10).

**Le point que la mesure révèle et qui n'était pas dans la demande :** l'emoji n'est pas
seulement dans le HTML. **Il traverse l'API.** Deux réponses relevées à l'instant :

```
$ curl -s .../api/ia/status
{"deepseek":{"status":"✅ Opérationnel"},"illustrations":{"status":"✅ 74 illustrations procédurales"},…}

$ curl -s .../api/system-check
{"name":"Endpoint 📥 pull statuts (lire_publications.php)"}
```

Sources côté serveur : `prospect_app.py:1087` (`"status": "✅ Opérationnel"`), l.1093,
l.1360, l.1364 (`"⚠️ Clé API manquante"`), l.1366, l.1377, l.1389, l.1391, l.1445, l.1940.

**Conséquence pour la refonte, et elle est décisive : retirer les emojis de `cockpit.html`
ne suffira pas.** Le serveur en renvoie, et l'interface les affiche tels quels. Le nettoyage
doit porter sur les **deux côtés** : 315 séquences dans la page, 129 dans `prospect_app.py`.
Un composant de badge qui ne fait que retirer les emojis du HTML laissera passer ceux de
`/api/ia/status` et `/api/system-check`.

### 6.4 `Outfit` — confirmé non embarquée, et 4 règles l'invoquent

```
$ find / -iname "*outfit*" -not -path "/proc/*" 2>/dev/null
(aucun résultat)
```

**Aucun fichier `*outfit*` n'existe sur le disque.** Vérifié aussi : les 9 `woff2` réellement
présents dans `site-eperformance/assets/fonts/` sont Cormorant Garamond (5) et DM Sans (4).
`Outfit` n'est ni embarquée, ni déclarée dans un `@font-face` du cockpit.

Et pourtant **quatre règles CSS du cockpit l'utilisent** :

| Ligne | Règle | Ce qui l'affecte |
|---|---|---|
| `cockpit.html:24` | `.kpi .v{font-family:'Outfit'; font-size:30px; font-weight:900; …}` | **les 5 valeurs de KPI de l'écran d'accueil** |
| `cockpit.html:43` | `.c-nom{font-family:'Outfit'; font-weight:700; font-size:16px; …}` | **le nom de chaque prospect dans chaque carte** |
| `cockpit.html:50` | `.score{font-family:'Outfit'; font-weight:900; …}` | **les pastilles de score HOT/WARM/COLD** |
| `cockpit.html:61` | `.modal h3{font-family:'Outfit'; …}` | **tous les titres de modale** |

Aucune de ces quatre déclarations ne comporte de pile de repli (pas de `, sans-serif`). Le
navigateur résout donc `'Outfit'` à la police par défaut de l'agent utilisateur.
**Les chiffres les plus regardés de l'outil sont rendus dans une police qui n'a jamais
existé sur la machine.**

### 6.5 Le défaut voisin, plus grave, que la mesure a révélé

La demande supposait qu'`Outfit` était le seul défaut typographique. Il y en a un second,
**et il annule les deux polices du design system**.

Les sept `@font-face` du cockpit (`cockpit.html:162-168`) déclarent des sources relatives :

```
cockpit.html:162  src:url('../site-eperformance/assets/fonts/cormorant-garamond-500.woff2')
cockpit.html:165  src:url('../site-eperformance/assets/fonts/dm-sans-400.woff2')
```

Le chemin est **correct sur le disque** — depuis `/home/ballo/OX6A/toolkit_eperformance/`,
`../site-eperformance/assets/fonts/` résout vers `/home/ballo/OX6A/site-eperformance/assets/fonts/`,
qui contient bien les 9 fichiers. **Mais il est faux en HTTP**, parce que le cockpit n'est
pas ouvert en `file://` : il est servi à la racine d'un serveur Flask.

Résolution d'URL par la RFC 3986, pour une page à `http://127.0.0.1:8787/` :

```
urljoin('http://127.0.0.1:8787/', '../site-eperformance/assets/fonts/dm-sans-400.woff2')
  → 'http://127.0.0.1:8787/site-eperformance/assets/fonts/dm-sans-400.woff2'
```

`../` ne peut pas remonter au-dessus de la racine. Vérifié sur les deux instances :

```
$ curl -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/site-eperformance/assets/fonts/dm-sans-400.woff2
404
$ curl -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8788/site-eperformance/assets/fonts/dm-sans-400.woff2
404
$ curl -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8787/assets/fonts/dm-sans-400.woff2
404
```

`prospect_app.py:42` construit `Flask(__name__)` **sans `static_folder`** et aucun
`send_from_directory` n'existe dans le fichier (vérifié : `grep -n "send_from_directory\|send_file\|static"` → 1 seule occurrence, l.42, la ligne de construction de l'app).

**Conséquence : les 7 `@font-face` échouent tous les 7. Le cockpit tourne aujourd'hui en
police système.** `--police-titres` (l.154) et `--police-texte` (l.155) tombent sur
`Georgia, serif` et `system-ui, sans-serif` ; les quatre règles `Outfit` tombent sur la
police par défaut du navigateur. **Aucune des trois typographies déclarées n'est chargée.**

C'est le défaut le plus concret de tout cet audit, parce qu'il est invisible : la page
s'affiche, elle est lisible, elle paraît correcte — et elle n'est pas dans sa charte.
Une refonte qui reprendrait `cockpit.html` sans corriger cela recopierait un rendu
typographique faux dans la base du dashboard unifié.

**Correctifs possibles** (à trancher en conception, je ne prescris pas ici) : servir le
répertoire de polices par une route Flask dédiée ; copier les 9 `woff2` dans un dossier
statique du toolkit et pointer les `@font-face` en relatif simple ; ou passer le cockpit en
`static_folder`. Les trois corrigent le défaut ; seul le troisième laisse les polices
partagées avec le site.

---

## 7. Recommandation tranchée

### 7.1 La base doit être `toolkit_eperformance/cockpit.html`

**Quatre raisons, dans l'ordre de poids.**

**1 — C'est le seul dashboard qui existe en service.** Deux instances tournent
(`127.0.0.1:8787`, `:8788`), il est servi en HTTP 200, il parle à 67 routes sur 75, et il
est le seul à écrire dans le pipeline de production. B est gelé depuis douze jours et
ouvert par personne (`mtime 2026-09-07`, un seul commit). C est **non démarrable**
(`flask_cors` absent). Choisir B ou C, c'est choisir de reconstruire à partir de ce qui ne
tourne pas.

**2 — Sa couche de jetons est déjà celle du design system, au caractère près.**
14 des 16 jetons de `cockpit.html:136-158` sont **identiques** aux valeurs canoniques du
thème sombre de `DESIGN-SYSTEM-UNIFIE.md` (§1.4 ci-dessus, tableau complet). Les deux
écarts sont : `--gold2`, déjà arbitré et documenté (`DSU.md` §2.3), et deux noms de pile de
repli manquants (`'Cormorant Fallback'`, `'DM Sans Fallback'`) — un correctif de deux
chaînes de caractères. **Aucun autre fichier du socle n'a cette propriété.** B invente
8 jetons (`#0A0B0F`, `#E8E5DE`…) qui ne correspondent à rien ; C importe la palette
Tailwind indigo par défaut (`#6366f1`, `#0f172a`), sans or ni encre.

**3 — C'est le seul conforme au contrat d'absence de dépendance externe.**
Zéro CDN (`cockpit.html` : aucun `<script src>` ni `<link href>` externe), contre 2 pour B
et 2 pour C. C'est le seul à fonctionner hors ligne — et le contrat veut que l'outil tourne
hors ligne (`cockpit.html:161`, « le cockpit tourne souvent hors ligne »). B et C violent
la règle (a) par construction : leurs polices ne se chargent pas sans réseau.

**4 — Fusionner dans l'autre sens coûterait 61 routes et 12 écrans.**
Le recouvrement mesuré est de 7 routes sur 14 (§2.2), et **ces 7 routes sont déjà toutes
servies par A**. Aucune route de C n'apporte une capacité absente de A ; 3 des 14 ne sont
appelées par personne. Partir de C demanderait de réécrire 61 routes, 12 écrans, 104
fonctions JS et tout le câblage du pipeline pour retrouver l'état actuel.

### 7.2 Ce que la base A doit recevoir des deux autres

Le choix de A n'est pas un choix d'ignorer B et C. Trois choses méritent d'être reprises,
et **elles sont de la mise en page, pas de la fonction** :

| À reprendre | Source | Pourquoi |
|---|---|---|
| **Structure de navigation par sections** (barre latérale, 6 sections, une seule visible) | C, `dashboard.html:500-520` et `747-767` | A ouvre 12 modales par-dessus une page unique, sans onglet (`data-tab` : 0). C prouve qu'une navigation latérale est tenable. **Reprendre la structure, pas la charte** — et corriger le `switchSection('settings')` qui plante (`dashboard.html:752` sur un `id` inexistant) |
| **Graphiques** (4 Chart.js : statuts, scores, pays, secteur) | B, `dashboard.html:157-165` | A n'a aucune visualisation de répartition. Attention : Chart.js est un CDN (violation (b)) — **vendoriser la bibliothèque ou la remplacer** |
| **États de chargement visuels** (squelettes, badges d'état colorés) | C, et le socle `.badge2--{brouillon,attente,programme,publie,echoue,file}` (`cockpit.html:245-252`) | Le socle existe déjà pour cela. Il suffit de le brancher |

### 7.3 Ce qu'il faut faire du socle de composants — le point le plus rentable

**Le socle ne doit pas être réécrit. Il doit être branché.**

C'est la conclusion la plus actionable de cet audit. Le socle CSS (`cockpit.html:170-276`)
et le module `UI()` (`cockpit.html:2405-2519`) existent, sont cohérents, consomment les
jetons, et ont un **taux d'utilisation atteignable de 0 %** (§3.3 — les 9 classes
apparaissent uniquement dans leur déclaration et dans la fabrique qui ne les émet jamais).
`Etat` (`cockpit.html:2527-2597`) est dans le même état, et le fichier
`~/Documents/cockpit_etat.json` **n'existe pas**, ce qui prouve qu'aucune des 11 routes
n'a jamais été appelée (§3.2).

Donc : le travail de conception de la phase A et de la phase C est **fait et correct**. Ce
qui manque est le câblage — remplacer les 110 chaînes de gabarit écrites à la main par des
appels à `UI.*`, et appeler `Etat.*` là où une opération dure plus que quelques secondes.
C'est un travail mécanique, vérifiable écran par écran, et c'est là que se trouve le
rendement.

**Trois réserves à porter au chantier, dans l'ordre :**

1. **Corriger les polices avant tout le reste** (§6.5). Les 7 `@font-face` échouent en 404
   sur les deux ports : le cockpit tourne en police système. Reprendre ce fichier comme
   base sans corriger cela graverait un rendu typographique faux dans le dashboard unifié.
   Et `Outfit` (`cockpit.html:24,43,50,61`) doit céder la place à une police de la charte —
   elle n'existe pas sur le disque.
2. **Nettoyer les emojis des deux côtés** (§6.3). 315 séquences dans `cockpit.html`, 129
   dans `prospect_app.py`, et elles traversent l'API (`/api/ia/status` renvoie
   `"✅ Opérationnel"`). Un nettoyage limité au HTML laisserait passer celles du serveur.
3. **Alimenter le sélecteur de fournisseur depuis le serveur** (§4.3). Le menu
   `cockpit.html:768-773` offre 5 fournisseurs ; le serveur en accepte 2 ; 3 options sur 5
   échouent en 400. La donnée existe déjà : `GET /api/ia-config` renvoie
   `providers_disponibles` et `models`.

### 7.4 Ce qu'il faut faire des deux autres dashboards

**B — `toolkit_eperformance/dashboard.html` : à archiver, et son générateur avec lui.**
Ce n'est pas du code mort inerte : c'est un fichier de 220 Ko sur le disque qui contient un
**jeton d'écriture en clair sur l'API de production** (`dashboard.html:142`) et deux appels
qui écrivent réellement (`dashboard.html:175`, `:191`). Quiconque l'ouvre lit le jeton.
Si l'on conserve le fichier pour référence, il doit perdre ses deux premières lignes de
constantes. Si on l'archive, `build_dashboard.py` doit partir avec lui — mais **attention** :
il porte le même jeton (`build_dashboard.py:22`) et il est le seul producteur du fichier.

**C — `agent-ia-web/templates_dashboard/dashboard.html` : à garder comme référence de
mise en page, à ne pas réactiver en l'état.** Sa coque SaaS (barre latérale, 6 sections,
grille de KPI) est ce que le dashboard unifié doit viser visuellement. Mais trois défauts
interdisent sa réactivation : il n'est pas démarrable (`flask_cors` absent), son onglet
Paramètres plante (`dashboard.html:752` sur un `id` inexistant), et il écoute sur
`0.0.0.0:5000` avec `debug=True` (`dashboard_app.py:560`) — la console Werkzeug sans
authentification sur toutes les interfaces. Ses 7 routes propres sont par ailleurs des
doublons fonctionnels des routes de A (§2.2, tableau).

---

## 8. Ce qui n'est pas établi

Conformément à la règle « aucune spéculation », voici ce que je n'ai pas pu prouver :

1. **Pourquoi deux instances de `prospect_app.py` tournent** (8787 et 8788). Elles servent
   le même fichier depuis le même répertoire ; je n'ai pas trouvé de script qui les lance
   toutes les deux. Intentionnel ou résidu ?
2. **Ce que `backend` désigne** dans les imports. Le module apparaît dans l'extraction AST
   mais je n'ai pas trouvé de fichier `backend.py` dans le toolkit, ni de paquet `backend`
   importable — l'import est probablement dans un chemin protégé que je n'ai pas isolé.
3. **L'âge exact de l'écart `--gold2`** : le cockpit porte la valeur `SITE` (`#e2c07a`), le
   noyau porte `#cfb583`. Savoir si le cockpit a été aligné avant ou après l'arbitrage du
   design system demanderait de dater la décision du noyau, que je n'ai pas retrouvée.
4. **Si le cockpit a déjà tourné en `file://` un jour.** Le commentaire de
   `cockpit.html:161-163` et le chemin relatif `../site-eperformance/` suggèrent que oui,
   et que c'est de là que vient le bug de police (§6.5) : le chemin était juste en local et
   est devenu faux en HTTP. Je n'ai pas de preuve directe de l'antériorité.
5. **Ce que contient `~/Documents/`** : le fichier d'état n'y est pas, mais je n'ai pas
   cherché d'autres fichiers d'état sous un nom différent.
6. **L'usage réel du `EPERF_API_TOKEN` en production.** Le jeton est en clair 78 fois ;
   je n'ai pas testé s'il est encore accepté par `api.eperformance.pro` (le tester aurait
   constitué un appel sortant vers un système de production).

---

## 9. Synthèse en une table

| Question posée | Réponse mesurée |
|---|---|
| Combien de dashboards ? | **3**, dont 1 vivant, 1 gelé-orphelin, 1 non démarrable |
| Lequel est la base ? | **`toolkit_eperformance/cockpit.html`** — servi, exercé, jetons déjà conformes au design system, 0 CDN |
| Recouvrement des routes | **7 / 14** routes communes, toutes déjà servies par le cockpit ; **0 route de C n'apporte une capacité absente de A** |
| Couverture A → ses routes | **67 / 75 routes référencées (89,3 %)** |
| Registres de fournisseurs | **5**, pas 2 : toolkit = 1 (`deepseek`), noyau = 4 dont 3 avec clé (cascade 3 paliers). L'UI du cockpit offre **5** options dont **3 échouent en 400** |
| `openai` / `zai` / `zai_sdk` morts ? | `openai` : **mort partout** (clé vide `.env:27`). `zai`/`zai_sdk` : **morts dans le toolkit**, **vivants dans le noyau** (`.env:17` + `ai_client_v2.py:521-575`) |
| Secrets | jeton de production en clair **78 fois** ; 2 clés DeepSeek versionnées sciemment ; `.env` en `644` ; 18 fragments de clé dans un `.log` |
| Les 11 routes `/api/etat/*` sont-elles appelées ? | **Non, 0 fois.** Preuve : `~/Documents/cockpit_etat.json` **n'existe pas** |
| Usage de `UI.` / `Etat.` | **0 / 0** — confirmé. `UI.` n'apparaît qu'en commentaire (l.2403) |
| Taux d'utilisation du socle de composants | **0 %** — les 9 classes n'existent que dans leur CSS et dans la fabrique jamais appelée |
| Lanceurs | `lancer-cockpit.sh:5` et `cockpit.desktop:5` → `/home/ballo/OX6A/prospecting-toolkit` **inexistant**. Idem dans `~/.local/share/applications/`. Démarrage réel : **manuel**, en ligne de commande. Aucun systemd, aucun crontab |
| Dépendances | **aucun `requirements` dans le toolkit** ; les 3 d'`agent-ia-web` décrivent un autre environnement ; `pip` bloqué par PEP 668 ; pas de venv |
| Local ou déployé ? | **Local** (`127.0.0.1`). Ce qui est déployé, c'est l'API PHP (LWS), pas le cockpit |
| Polices par CDN | cockpit **conforme** (0) ; B et C **non conformes** (2 chacun) |
| Hex en dur hors `:root` | A **21**, B **13**, C **4** — aucun conforme |
| Emojis | `cockpit.html` **315 séquences** (la demande disait 306 — écart de méthode) ; surtout : **ils traversent l'API** (`prospect_app.py:1087,1364,1377…`, 129 séquences) |
| `Outfit` embarquée ? | **Non** — `find / -iname "*outfit*"` ne remonte rien, et **4 règles CSS l'invoquent** (`cockpit.html:24,43,50,61`) |
| **Défaut non demandé, le plus grave** | **Les 7 `@font-face` du cockpit renvoient 404 en HTTP** (`../site-eperformance/…` ne peut pas remonter au-dessus de la racine). `DM Sans` et `Cormorant Garamond` ne se chargent pas : **le cockpit tourne en police système** |

---

*Document produit le 19 septembre 2026. Aucun fichier du socle n'a été modifié.
Aucune route modifiant l'état n'a été appelée : seules des lectures (`GET`) et quatre
requêtes `POST` rejetées en 400 sans effet de bord ont été émises.*
