# SUPERVISION INDÉPENDANTE — REFONTE DU DASHBOARD ePERFORMANCE

> Superviseur : mission de **falsification**, pas de confirmation. Chaque affirmation a été
> rejouée sur le code, les données et l'application vive (`127.0.0.1:8788`). Aucune route
> modificatrice n'a été appelée : uniquement des `GET` et deux lectures d'API distantes
> (`lecture_csv.php`, `lire_publications.php`) via leur contrat `GET` documenté.
> Aucun fichier n'a été modifié hors le présent rapport. Aucune valeur de secret n'est
> reproduite : les emplacements sont cités en `fichier:ligne` et en nature seulement.
> Date : 2026-09-19.

---

## 1. VERDICT GLOBAL

# **CONFORME AVEC RÉSERVES**

**Ce qui est solide, et vérifié indépendamment — c'est l'essentiel du corpus :**

- **Les 15 affirmations factuelles structurantes sont exactes ou exactes à la réserve près.**
  10 sont confirmées sans réserve, 3 confirmées avec une réserve de source, 2 sont réfutées
  dans leur formulation (jamais dans leur intention). Aucune affirmation inventée, aucun
  chiffre sorti de nulle part : les `fichier:ligne` vérifiés au hasard (7 emplacements de
  secret sur 11, `APP:1135-1143`, `ST/publication.py:232`, `ENGINE:1810,1849`) sont **tous
  exacts à la ligne**.
- **La table WCAG AA de `SYSTEME-VISUEL-SAAS.md §2.7` est intégralement reproductible.** J'ai
  recalculé les 48 cellules (12 jetons × 4 surfaces) plus 4 paires texte/aplat : **52/52
  valeurs exactes au centième**. Le document corrige en outre deux valeurs fausses d'un
  document antérieur (`DSU` annonce `17,71:1`, le calcul donne `16,64:1` — le document a
  raison). C'est rare et cela mérite d'être dit.
- **Les comptages d'emojis, réputés contradictoires (306 / 315 / 351), sont réconciliés par
  la mesure.** J'ai recompté : `cockpit.html` = 306 pictogrammes, 351 avec les blocs
  techniques, 8 flèches, 1 `ℹ` → **351 est le bon chiffre de travail**, et le « 315 » de M5
  = 306 + 8 flèches + 1 hors-définition. Les totaux annoncés (493 / 539 / 345) sont exacts.
- **74 SVG** vérifiés (`social_illustrations.ILLUSTRATIONS` → 74 entrées, 20 planches dont
  12 sectorielles) : le brief annonçait 26, l'audit a raison.

**Pourquoi ce n'est pas CONFORME :** le plan de construction contient **deux défauts de
conception qui empêchent la refonte d'atteindre son objectif affiché**, et l'un d'eux est
celui que tout le monde désigne comme « le défaut le plus grave du projet ».

1. **La migration de la collision d'identifiants est inopérante telle qu'elle est spécifiée**
   (§2.8). La séquence est amorcée à `0` (`ARCHITECTURE-SAAS.md:671`) et `allouer()` renvoie
   donc `PUB-0001` ; les 7 lignes renumérotées reçoivent **le même identifiant qu'avant** — ou
   lèvent une violation de clé primaire. Le rapport de migration dira `renumerotees: 7` alors
   que **zéro** collision aura été réparée. Détail en §5.1.
2. **Cette même migration dépend d'un magasin qui n'existe qu'à l'étape 5** — le plan la place
   à l'étape 2. Au premier démarrage, `publication_cache_serveur` est vide, la boucle fait
   `continue`, et la réparation — comme l'événement `CONFLIT-IDENTITE` promis comme « sortie
   vérifiable » de l'étape 2 — **n'a pas lieu, silencieusement**. Détail en §5.2.

S'y ajoutent une **contradiction sur un jeton gelé** (`--gold2`, §4.1) qui peut conduire un
implémenteur à violer N1, et un **critère de sortie de l'étape 9 qui ne peut pas passer** dans
l'état du dépôt (§3, NC-3).

En une phrase : **les huit documents d'audit et de conception sont fiables et mesurés ; c'est
le chaînon « migration » qui n'est pas encore exécutable, et il porte la promesse la plus
forte du projet.**

---

## 2. TABLEAU DES 15 VÉRIFICATIONS FACTUELLES

| # | Affirmation | Verdict | Commande lancée | Résultat |
|---|---|---|---|---|
| **1** | Le CSV local et le CSV serveur divergent sur **20 lignes sur 22** ; le serveur détient 3 `Répondu_Positif` que le cockpit affiche en `Froid` | **CONFIRMÉE** | `python3` (comparaison `prospects_tracking.csv` ↔ `GET api.eperformance.pro/lecture_csv.php`), puis `curl -s 127.0.0.1:8788/api/state` | Local `{Froid:20, Nouveau:2}` ; serveur `{Relancé_J3:11, Froid:6, Répondu_Positif:3, Répondu_Négatif:2}` ; **20/22 lignes divergentes** sur ≥ 1 champ. `GET /api/state` (qui lit le CSV local, `prospect_app.py:153`) affiche `PROS-007/008/009 → Froid`. Le taux de réponse du cockpit est donc `0.0` alors que 3 prospects ont répondu positivement |
| **2** | Sur 1,1 Mo de logs, `/api/send`, `/api/add`, `/api/import`, `/api/scrape/*`, `/api/sync` totalisent **0 appel** | **CONFIRMÉE** | `find . -name "*.log" -printf "%s\n" \| awk` puis `grep -rhoE '"(GET\|POST) /api/(send\|add\|import\|scrape/…\|sync)' prospecting_logs/ prospect_app.log \| wc -l` | **1 110 065 octets** tous `.log` du projet (1,06 MiB) — `prospecting_logs/` seul : 964 620 o / **83 fichiers** (l'audit en comptait 76 ; le dossier a grossi pendant la nuit). Les 6 routes cibles : **0, 0, 0, 0, 0, 0**. Indépendamment : `rate_limit.json` est absent, et `/api/state` = **6 840** appels. Les deux moitiés de la phrase sont donc vraies |
| **3** | L'erreur Meta `#132001` a parqué la base, **puis 1 226 exécutions « Rien à envoyer »** | **RÉFUTÉE** (chiffres exacts, causalité et ampleur fausses) | `grep -c "Rien à envoyer"`, `grep -n "132001"`, comptage par date sur `Eperformance/data/cron_debug.log` | 1327 lignes, **1 226 « Rien à envoyer »** ✓ et **6 lignes `#132001`** ✓. Mais : la **1ʳᵉ** ligne « Rien à envoyer » est du **2026-09-01 01:40** — soit 6 jours **avant** l'erreur — et **820 des 1 226 la précèdent**. Le parking (`cron_sequences.php:20`, 3 échecs → Froid) n'a parqué que **2 prospects** (`PROS-003`, `PROS-006`), pas « toute la base contactée » : les 20 autres avaient reçu leur message et portent `Relancé_J3` côté serveur. La phrase « a parqué toute la base » est **inexacte** ; « un défaut invisible pendant 6 jours » est exact |
| **4** | `skills_engine.py` contient « 15 600+ clics Google », dont une **promesse de remboursement**, et ce chiffre **n'apparaît dans aucune publication produite** | **CONFIRMÉE AVEC RÉSERVE** | `grep -n "15 600\|rembours" skills_engine.py` ; `grep -c "15 600" publications.csv publications_archive.csv` ; `grep -rn "15 600" --include="*.json" .` | Le chiffre : `skills_engine.py:252-288`, `:409`. La promesse : `:503` (« je te rembourse 50 %… ») et `:545` (« Remboursé 50 % si < 15 600 clics en 90j ») ✓. **0 occurrence** dans `publications.csv` (**7 enregistrements** répartis sur 128 lignes physiques — les textes contiennent des retours à la ligne cités) et dans `publications_archive.csv` (234 enregistrements / 623 lignes physiques) ✓. **Réserve** : le chiffre existe bien dans des artefacts produits — `docs/lot-temoin-apres/deepseek-flash.json:242` (la promesse de remboursement **verbatim**, le cas que M2 cite lui-même), `docs/lot-temoin-avant/deepseek-chat.json:43`, et 3 gabarits JSON (`template_whatsapp_j0.json:10`, `hooks_sectoriels_v4.json:47`, `templates_whatsapp_j0_v5_authentiques.json:218`). L'affirmation n'est vraie que pour « publication au sens de `publications.csv` » ; elle est fausse pour « artefact produit » |
| **5** | `social_templates/` (contrôle /100 + superviseur éditorial) n'est exposé par **aucun bouton** — `grep "api/social" cockpit.html` → 0 | **CONFIRMÉE** | `grep -c "api/social" cockpit.html` ; `grep -n "social" cockpit.html` ; `curl -s 127.0.0.1:8788/api/social/articles` | `api/social` : **0**. Le mot `social` n'apparaît **nulle part** dans `cockpit.html`. Les deux routes existent pourtant (`prospect_app.py:703`, `:713`) et répondent (`HTTP 200`, 2 456 o). Précisé par la mesure : le **contrôle technique /100 est bien calculé** sur le chemin `/api/publications/<id>/image` (`prospect_app.py:638` → `social_templates/publication.py:232` → `controleur.controler`) mais `grep -c "manques" cockpit.html` → **0** : **le score n'est jamais affiché**. La chaîne article → publication (`/api/social/generer`) et le **superviseur éditorial** n'ont, eux, aucun point d'entrée. M3 a donc raison, et la mesure ajoute que même le score calculé est jeté |
| **6** | Sur 29 personas, **12 seulement** sont atteignables et utilisés | **CONFIRMÉE** | `find agents -name "*.md" \| wc -l` ; `python3` (décompte de `Genere_Par`) ; `grep -rn "get_agent_for_pilier_platform\|get_image_agents"` | **29 fichiers** `.md` (design 3, marketing 14, product 1, research 2, sales 9) ✓. `publications_archive.csv` (234 lignes) contient **exactement 12** personas distincts, avec les effectifs publiés par M2 au chiffre près (42 / 40 / 38 / 34 / 22 / 13 / 11 / 9 / 9 / 8 / 5 / 3) ✓. Les 11 orphelins : **0 occurrence** dans tout `.py` ✓. `fmt` n'est transmis par aucun des 3 appels (`content_engine.py:1607, 1741, 2529`) donc les 2 personas de `FORMAT_AGENTS` sont morts ✓ ; `get_image_agents()` et `get_veille_agents()` : **0 appel** ✓ |
| **7** | `design_pipeline.py` se déclare DÉPRÉCIÉ mais `image_generator_v3.py` l'appelle encore, et **5 routes sur 11** produisent par ce chemin | **CONFIRMÉE** | `sed -n '1,25p' design_pipeline.py` ; `grep -n "design_pipeline" image_generator_v3.py` ; `python3 -c "import prospect_app"` ; `grep -n "ig\.gen_\|img_gen\."` | `DP:2` : « ⚠️ LEGACY — DÉPRÉCIÉ le 19/09/2026 » ✓ ; `V3:46` `import design_pipeline`, `V3:194` `enrich_design_prompt(...)` ✓. **À l'exécution** : `IMAGE_VERSION = v3 (Playwright)`, `_DESIGN_PIPELINE_AVAILABLE = True`, Playwright `OK`. Les routes qui passent encore par `ig.gen_*` : `generate-all-images` (`APP:2114-2127`), `generate-image` (`:1135-1143`), `full-post` (`:1504`), `retry-failed` (`:1642`) et `generate-variants` (via `variant_generator.py:46,141`) — **5**. La 6ᵉ (`/api/publications/<id>/image`) a été rebasculée sur `social_templates`. **L'en-tête de `DP` est donc faux quand il écrit « plus rien dans le chemin image »** |
| **8** | `PUB-0007.png` : **33,4 % de noir pur, 0 pixel d'or** — contre **52,3 % de `#08080c` et 12 249 px d'or** pour la chaîne gabarits | **CONFIRMÉE** | `python3` + PIL `getcolors()` sur `assets_pubs/PUB-0007.png` et `assets_pubs/07-G3-linkedin.png` | Avec la méthode déclarée (tolérance ±3 par canal) : noir quasi pur = **1 008 698 px = 33,36 %** ✓, or `#c9a96e` = **0 px** (0 même à ±3) ✓. `07-G3-linkedin.png` : `#08080c` = **3 013 992 px = 52,33 %** ✓ (valeur **exacte**), `#c9a96e` = **12 249 px** ✓ (valeur **exacte**). Nuance honnête : en égalité stricte le noir pur de PUB-0007 est 987 249 px = 32,65 % — l'audit écrit « comptage exact à tolérance ±3 », formulation contradictoire qui ne change pas le verdict |
| **9** | Le contrôle qualité ne note que **le premier slide** d'un carrousel (32 % de couverture) | **CONFIRMÉE** | `sed -n '218,248p' social_templates/publication.py` ; `sed -n '60,75p' social_templates/lot.py` ; `sed -n '265,285p' social_templates/controleur.py` | `publication.py:232` → `controleur.controler(fichiers[0], resultat)` ✓ et `lot.py:68` → `fichiers[0]` ✓ ; `controleur.py:275-281` reconstruit `documents(resultat, theme)[0]` : la mesure **est** celle de la 1ʳᵉ slide ✓. Le nombre de documents par carrousel est confirmé par lecture (`g4_carrousel.py:100-109` : `slides[:5]` + couverture + CTA = **7** ; Facebook `slides[:1]`+2 = **3**). Nuance : « 68 % des images non contrôlées » compte la 1ʳᵉ slide comme non contrôlée ; l'énoncé rigoureux est « **les slides 2 à n ne sont jamais notées, et le score publié décrit la couverture** » |
| **10** | `generate_weekly_calendar()` renumérote à partir de `PUB-0001` → **collision d'identifiants** avec le serveur, dont `PUB-0004` et `PUB-0006` déjà `publie` | **CONFIRMÉE AVEC RÉSERVE** | `sed -n '1800,1880p' content_engine.py` ; `python3` (comparaison `publications.csv` ↔ `GET lire_publications.php`) | `ENGINE:1810` `pid_counter = 1`, `ENGINE:1849` `f"PUB-{pid_counter:04d}"` ✓. Local : **7 lignes** `PUB-0001…PUB-0007`, **toutes `brouillon`**, textes de la nuit (00:32). Serveur **vif** : **49 lignes**, `par_statut {publie: 4, brouillon: 45}` — `PUB-0001`, `PUB-0004`, `PUB-0006`, `PUB-0007` sont `publie` avec `Post_ID` et **des textes différents** ✓. **Réserve de source** : la colonne « contenu serveur » de M4 (§1.4) correspond en réalité au **miroir local** `Eperformance/data/publications.csv` (48 lignes, 45 `programmee` / 3 `publie`, figé au **2026-09-09 13:51**), pas au serveur vif (`file_mtime` 2026-09-15, 4 `publie`). La conclusion tient — la collision est réelle et un `publie` est bien recouvert — mais la table de preuve est périmée de 10 jours |
| **11** | Trois registres de statut concurrents existent, et **le serveur fait foi** | **CONFIRMÉE AVEC RÉSERVE** | `grep -n "SERVER_OWNED" content_engine.py api/upload_publications.php` ; `sed -n '80,100p;228,248p' api/upload_publications.php` ; `ls Eperformance/data/` | Les trois registres existent ✓ (1 : `publications.csv` local ; 2 : `data/publications.csv` lu par le cron ; 3 : `publications_state.json`). L'autorité serveur est **dans le code** : `upload_publications.php:95` `SERVER_OWNED` et `:233-245` (préserve `publie/echec/erreur` + 8 champs), `content_engine.py:2436` `SERVER_OWNED_FIELDS` à la descente ✓. **Même réserve que #10** : le « registre 2 » mesuré par M4 (48 lignes / 45 `programmee` / 3 `publie`) est le miroir local du 2026-09-09, pas le serveur vif (49 / 45 / **4**) |
| **12** | `track_generation` n'est appelé que par **2 routes d'image**, `total_generations: 0` | **CONFIRMÉE** | `grep -rn "track_generation" --include="*.py" .` ; `curl -s 127.0.0.1:8788/api/analytics/summary` ; `cat metrics/generation_metrics.json` | **2 appels** : `prospect_app.py:1152` (route `:1107`) et `:1207` (route `:1177`) ✓. `metrics/generation_metrics.json` : `generations: []`, `total_generations: 0` ✓. Route vive : `summary.total_generations = 0`, `provider_stats` tous à 0, `timeline` 7 jours à 0 — **alors que `by_pillar` affiche 7 entrées** : l'agrégat est incohérent avec lui-même, ce que M4 documente |
| **13** | Les **7 `@font-face`** de `cockpit.html` renvoient **404 en HTTP** — le cockpit tourne en police système | **CONFIRMÉE** | `grep -n "@font-face" cockpit.html` puis `for f in …; do curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8788/site-eperformance/assets/fonts/$f.woff2"; done` | **7 `@font-face`** (`cockpit.html:162-168`) → **7 × 404** sur l'instance vive. Les 9 fichiers existent pourtant sur le disque (`/home/ballo/OX6A/site-eperformance/assets/fonts/`) : c'est le chemin relatif `../site-eperformance/…` qui ne se résout pas en HTTP. Aggravant mesuré : `'Outfit'` est invoquée par 4+ règles et n'est **déclarée nulle part** (ni fichier, ni `@font-face`) → second repli silencieux |
| **14** | `UI.` et `Etat.` ont **0 usage** réel, et `~/Documents/cockpit_etat.json` **n'existe pas** (donc les 11 routes `/api/etat/*` n'ont jamais été appelées) | **RÉFUTÉE** (sur la dernière proposition) | `grep -c "UI\." cockpit.html` ; `grep -c "Etat\." cockpit.html` ; `ls ~/Documents/cockpit_etat.json` ; `grep -rhoE '"(GET\|POST\|DELETE) /api/etat[^"]*"' prospecting_logs/ prospect_app.log` | `UI.` : **1** occurrence — dans un commentaire de mode d'emploi (`cockpit.html:2403`, « Usage : UI.btn(…) ») → 0 usage réel ✓. `Etat.` : **0** ✓. `~/Documents/cockpit_etat.json` : **absent** ✓ (le module a été écrit à 03:53 ce matin). **Mais** l'historique contient **3 appels** : `GET /api/etat/taches` ×2 (04:05:31, 04:06:01) et `GET /api/etat/resume` ×1 (04:43:13), tous en `200`. Le décompte exact est donc : **11 routes, 2 exercées en lecture, 0 en écriture, 0 appel d'interface** (le client `Etat.` est mort). La conclusion opérationnelle est la même ; l'affirmation « jamais appelées » est fausse telle qu'écrite |
| **15** | Il existe **trois dashboards** avec trois chartes distinctes, dont `agent-ia-web/templates_dashboard/dashboard.html` en indigo Tailwind (`--primary:#6366f1`) | **CONFIRMÉE** | `find . -iname "*dashboard*" -name "*.html"` ; `grep -n -- "--bg:\|--gold:\|--primary:"` sur les trois ; `grep -no "https\?://"` | Trois fichiers, trois chartes : `cockpit.html` (`--bg:#08080c`, `--gold:#c9a96e`) ; `toolkit/dashboard.html` (`--bg:#0A0B0F`, `--text:#E8E5DE`, `--muted:#8C8B85`, `--gold:#C9A96E` — **proche mais pas N1**) ; `agent-ia-web/templates_dashboard/dashboard.html` (`--primary:#6366f1`, `--bg:#0f172a`, police `Inter` par `fonts.googleapis.com`) ✓. **Nuance** : « Tailwind » est impropre — `grep -ci tailwind` → **0** ; c'est une palette indigo écrite à la main. Aggravant mesuré et non relevé : `toolkit/dashboard.html:5-6` charge **Google Fonts + `cdn.jsdelivr.net/npm/chart.js@4.4.1`** |

**Bilan : 10 confirmées · 3 confirmées avec réserve de source · 2 réfutées dans leur formulation · 0 non vérifiable.**

---

## 3. NON-CONFORMITÉS, CLASSÉES PAR GRAVITÉ

### GRAVITÉ 1 — bloquant avant validation humaine

**NC-1 — La réparation de la collision d'identifiants est inopérante telle que spécifiée.**
`ARCHITECTURE-SAAS.md:671` amorce la séquence à `0` ; `allouer()` (`:946-953`) incrémente
puis lit, donc **la première allocation est `PUB-0001`** — l'identifiant même du serveur.
`migration_002()` (`:1014-1038`) parcourt les 7 lignes locales dans leur ordre naturel
(`SELECT … FROM publications`, **sans `ORDER BY`**) et leur attribue `PUB-0001`, `PUB-0002`…
soit **exactement les identifiants qu'elles portent déjà** : `UPDATE publications SET
id='PUB-0001' WHERE id='PUB-0001'`. Le rapport conclura `renumerotees: 7` alors que **la
collision est intacte** ; si l'ordre d'itération diffère, le `UPDATE` viole la clé primaire et
la transaction échoue. Dans les deux cas, l'étape 2 — dont la « sortie vérifiable » est
« les 7 lignes locales portent un identifiant neuf » — **ne peut pas produire son résultat**.
Le test `T2` (`:1056`) grave le défaut : il attend que la **première** génération de calendrier
produise `PUB-0001…PUB-0049`, c'est-à-dire précisément les 49 identifiants que le serveur
détient déjà.

**NC-2 — La migration dépend d'un magasin construit trois étapes plus loin.** `migration_002()`
compare chaque ligne locale à `publication_cache_serveur` ; si la ligne serveur est absente,
elle fait `continue` — c'est-à-dire **ne détecte rien et ne répare rien**. Or ce magasin est
alimenté par `services/publications.py` / `services/sync_serveur.py`, livrés à **l'étape 5**,
alors que la migration est à **l'étape 2**. Au premier démarrage après l'étape 2, la table est
vide : **0 collision détectée, 0 événement `CONFLIT-IDENTITE`**, et le défaut que D4 existe
pour tuer survit au passage censé le tuer. Aucune étape ne prévoit l'amorçage préalable
(un pull serveur obligatoire avant migration, ou un garde-fou « cache vide ⇒ migration
refusée »). C'est la réponse à la question posée : **serveur LWS injoignable pendant la
migration ⇒ les 7 collisions restent en place, sans alerte.**

**NC-3 — Un critère de sortie de l'étape 9 ne peut pas passer.** L'étape 9 exige
« `grep -rn` des 11 motifs de secret → 0 occurrence **dans le dépôt** » (`:1816`), alors que
`§7.2` (`:1879`) décide explicitement que dans `api/*.php` « le jeton y reste », et que ces
fichiers **sont dans le dépôt** : `git -C toolkit_eperformance ls-files` → **11 fichiers
`api/*.php` suivis**, plus `config_api.json` et `config_ia.json` (clé DeepSeek en clair,
`fichier:ligne` connu). L'affirmation « ces fichiers sont déployés chez LWS » **donc hors
dépôt** est **fausse dans cet atelier**. Le critère est donc irréalisable en l'état, et la
contrainte 7 (« aucun jeton en clair… dans le dépôt », `:107`) contredit la décision `§7.2`.

**NC-4 — Aucune étape ne possède la cause racine de `#132001`.** Le plan conserve le cron LWS
comme exécutant (`:632`) et l'étape 6 livre le **diagnostic** du cas `#132001` (`:1561-1596`),
mais **aucune des 9 étapes ne crée ou ne valide le modèle WhatsApp `j0_diagnostic` côté Meta
Business Manager** — que `AUDIT-M1 §0.2` déclare hors de portée du dépôt et à créer à la main.
Après 13 sessions, la chaîne d'envoi peut donc être **toujours morte**, mais désormais
**correctement affichée comme morte**. C'est un progrès de vérité, pas une réparation :
le document doit le dire, et une action non-code doit être nommée.

### GRAVITÉ 2 — défaut réel, à corriger avant le début des travaux

**NC-5 — `--gold2` : une justification qui invite à violer les jetons gelés.**
`ARCHITECTURE-SAAS.md:1905` tranche : « `--gold2` reste **au canon du noyau** », et le canon
noyau vaut `#cfb583` (`agent-ia-web/eperf_core/assets/css/10-primitives.css:90`,
`--p-accent-appuye-sombre`). Or les jetons N1 gelés imposent **`--gold2:#e2c07a`**, valeur que
`SYSTEME-VISUEL-SAAS.md:245` applique correctement et que `DESIGN-SYSTEM-UNIFIE.md` conserve en
thème sombre (`:337`). Un implémenteur qui suit `ARCHITECTURE` à la lettre écrit `#cfb583`
dans le thème **sombre** — violation d'un jeton gelé. De plus, `§0.1` (`:49`) écrit
« **Six** valeurs sont gelées » et n'énumère que `--bg`, `--card`, `--text`, `--gold`, `--wa`,
`--erreur` : **les quatre autres** (`--soft`, `--muted`, `--gold2`, `--border-strong`) ne sont
pas déclarés gelés dans le document qui fait autorité, alors qu'ils le sont dans le mandat.
C'est le point d'entrée exact de NC-5.

**NC-6 — Le contrôle qualité affiché est jeté.** `POST /api/publications/<id>/image` renvoie
`score` et `manques` (`prospect_app.py:695-699`) et `cockpit.html:1130` ne lit que le chemin de
l'image (`grep -c "manques" cockpit.html` → **0**). Le score /100 n'atteint donc **jamais**
l'écran. `AUDIT-M3 §F3` et `D10` demandent « contrôle par slide » ; la refonte doit aussi
livrer **l'affichage** du score, sinon le contrôle reste une propriété interne.

**NC-7 — Le plan ne comporte aucune tâche côté serveur, alors que le contrat serveur change.**
`L5` (`:585`) prévoit d'« étendre à six champs » la liste `SERVER_OWNED` de
`api/upload_publications.php`. Aucun des 9 postes du plan (`:1799-1835`) ne mentionne la
modification ni le déploiement d'un fichier PHP. Soit la modification est inutile (et `L5` est
à corriger), soit elle est nécessaire (et une étape manque). Les deux ne peuvent pas être vrais.

**NC-8 — Le plan tient 6 suppressions, 1 refonte de routes et 3 rebranchements dans une seule
session (étape 8).** Supprimer `design_pipeline.py` **et** `image_generator_v3.py` **et**
`image_generator.py` **et** `variant_generator.py` **et** `video_generator.py` **et**
`content_pipeline_v2.py`, tout en réécrivant les 5 routes qui les importent, en passant le
contrôle au niveau slide, en branchant `image_optimizer` dans `ST/rendu.py`, en rebranchant
`metrics_tracker` et en écrivant `services/blog.py` — c'est un poste de 1 session. Le risque
n'est pas théorique : `prospect_app.py:28-32` importe `image_generator_v3` **avec repli sur
`image_generator`** ; supprimer les deux sans avoir fini la réécriture lève un `ImportError`
**au chargement**, donc une application qui ne démarre plus — exactement ce que la règle
« aucune session ne laisse l'outil inutilisable » interdit.

### GRAVITÉ 3 — précision documentaire (ne bloque pas, doit être écrite)

**NC-9 — Le nombre de fichiers de police diffère d'un document à l'autre : 14 contre 12.**
(voir §4.2.)

**NC-10 — « comptage exact à tolérance ±3 »** (`AUDIT-M3 §2.2`) est contradictoire ; la valeur
exacte de `PUB-0007.png` est 32,65 %, et 33,36 % **avec** tolérance. Idem pour l'écart
`1,67:1` calculé contre `1,68:1` annoncé (`SYSTEME-VISUEL-SAAS.md:60`) : arrondi, mais à
nommer.

**NC-11 — « les 11 routes `/api/etat/*` n'ont jamais été appelées »** est faux : 3 `GET` ont
été servis (2 × `taches`, 1 × `resume`) le 2026-09-19 entre 04:05 et 04:43. Reformuler en
« 0 appel d'interface, 0 écriture, aucune persistance créée ».

---

## 4. CONTRADICTIONS ENTRE DOCUMENTS

### 4.1 `--gold2` : `ARCHITECTURE` contre `SYSTEME-VISUEL` (et contre le mandat)

| Source | Valeur de `--gold2` en thème sombre |
|---|---|
| Mandat N1 (gelé) | **`#e2c07a`** |
| `SYSTEME-VISUEL-SAAS.md:245` | `#e2c07a` ✔ |
| `DESIGN-SYSTEM-UNIFIE.md:337` (thème `dark`) | `#e2c07a` ✔ |
| `cockpit.html:145` | `#e2c07a` ✔ |
| `DESIGN-SYSTEM-UNIFIE.md:70` (valeur NOYAU listée) | `#cfb583` — arbitrage motivé pour le **thème clair** du site |
| `ARCHITECTURE-SAAS.md:1905` | « reste au canon du noyau » ⇒ **`#cfb583`** ✘ |

Le thème **clair** n'est pas concerné : `SYSTEME-VISUEL-SAAS.md:625-637` a explicitement tranché
**dark-only** pour la console, avec la recommandation de `DSU §8.5` citée. La seule lecture
conforme est donc : `--gold2: #e2c07a`, et la phrase de `ARCHITECTURE:1905` est à réécrire.

### 4.2 Nombre de fichiers de police : 14 contre 12

| Source | Total annoncé |
|---|---|
| `ARCHITECTURE-SAAS.md:268` (« 14 .woff2 (9 site + **5** Outfit) »), `:471`, `:1803`, `:1843` | **14** (aux 4 endroits) |
| `SYSTEME-VISUEL-SAAS.md:565` (« **Trois** fichiers, environ 66 Ko, ajoutés aux 9 existants → **12** ») | **12** |

`SYSTEME-VISUEL` justifie ses trois fichiers par un tableau à trois lignes (400 / 700 / 900) et
un critère de vérification (chasse tabulaire) ; `ARCHITECTURE` n'en justifie que cinq. Les 9
existants sont réels (`ls site-eperformance/assets/fonts/` → 9, dont 2 italiques). **Le chiffre
justifié est 12** ; « 5 Outfit » est un reliquat. Deux documents de conception qui décrivent le
même livrable avec deux nombres différents, c'est une correction à faire avant le premier
commit — et `C4` (contrôle « polices présentes ») doit viser la liste **nommée**, pas un
nombre.

### 4.3 Emojis (306 / 315 / 351) — **la contradiction est résolue, et par la mesure**

Ce n'est pas une contradiction : c'est un **écart de définition**, documenté et reproductible.
J'ai recompté les quatre fichiers avec les quatre définitions :

| Définition | `cockpit.html` | `prospect_app.py` | `dashboard.html` | `templates_dashboard` | Total |
|---|---:|---:|---:|---:|---:|
| Pictogrammes seuls (`1F000-1FAFF`, `2600-27BF`, `2B00-2BFF`) | **306** | 89 | 65 | 33 | **493** |
| + blocs techniques (`2300-23FF`, `2139`) | **351** | 89 | 65 | 34 | **539** |
| + flèches (`2190-21FF`) | 314 | 129 | 358 | 37 | 838 |
| + `U+FE0F` comptés séparément | — | — | — | — | « 359 » |

Les totaux de `SYSTEME-VISUEL-SAAS.md §6.1` (493 / 539 / 345 flèches) sont **exacts**. Le
« 315 » de `M5` = 306 + 8 flèches + 1 `ℹ` (`U+2139`, que M5 ne cite pas dans sa définition) :
à **une unité près**, et sans conséquence. **Le chiffre de travail est bien 351**, et la raison
donnée est la bonne : `⏳` (`U+23F3`) est hors bloc pictographique et compte **43 occurrences**
— je l'ai vérifié, `⏳` 43, `✅` 43, `❌` 39. Seule imprécision : `SYSTEME-VISUEL` annonce
`⏱ ×2`, la mesure donne **1**.

### 4.4 SVG : 26 contre 74 — **le mesuré est 74**, et personne ne défend 26

`social_illustrations.ILLUSTRATIONS` → **74** entrées contenant `<svg>`, 20 planches dont 12
sectorielles. `ARCHITECTURE-SAAS.md:606` retient 74. Aucun document de conception ne reprend
le « 26 » du brief : la contradiction est un **écart brief ↔ mesure**, correctement tranché.

### 4.5 Une contradiction de source, non vue par les documents : le « serveur » de M4 est un miroir

`AUDIT-M4 §1.3` et `§1.4` désignent « `SERVER/data/publications.csv` » et en donnent l'état
« 48 lignes, 45 `programmee`, 3 `publie` », avec trois textes et trois `Post_ID`. Ces valeurs
correspondent **exactement** à `toolkit_eperformance/Eperformance/data/publications.csv`
(mtime **2026-09-09 13:51**). Le serveur **vif** interrogé ce jour (`GET lire_publications.php`,
`file_mtime` **2026-09-15 06:12**) rend **49 lignes**, `{publie: 4, brouillon: 45}`, et
**d'autres textes** : `PUB-0001`, `PUB-0004`, `PUB-0006`, `PUB-0007` sont publiés. Un audit
qui conclut « le serveur fait foi » puis mesure une copie figée de 10 jours doit le signaler :
le nombre de publications réellement sorties est **4**, pas 3.

### 4.6 `MODULE → destination` contre `§2.3 Sort de chaque module` : cohérent

Vérifié ligne à ligne : les six modules supprimés par `§2.3` sont bien les cinq que M4 déclare
morts (`design_pipeline`, `image_generator_v3`, `image_generator`, `variant_generator`,
`video_generator`) plus `content_pipeline_v2` ; `cockpit.html`, `dashboard.html`,
`agent-ia-web/dashboard_app.py` et `templates_dashboard/` suivent la même décision au §3.1 et
à l'étape 9. Pas de divergence trouvée sur ce point.

---

## 5. COHÉRENCE ET FAISABILITÉ DU PLAN (PARTIE 3)

### 5.1 Les étapes laissent-elles l'outil fonctionnel ?

**Non, à deux endroits.**

1. **Étape 2** (voir NC-1, NC-2) : sa « sortie vérifiable » — 7 identifiants neufs, 7 événements
   `CONFLIT-IDENTITE` — **ne peut pas être atteinte** ni avec la séquence à `0`, ni avec un
   cache serveur vide. Une session qui se termine sur un critère inatteignable finit en rouge,
   et la règle du plan (« on ne ferme pas une étape sur un rouge ») bloque tout le reste.
2. **Étape 8** (voir NC-8) : la suppression des modules que les routes importent encore peut
   rendre l'application **non démarrable** (`ImportError` au chargement), ce qui contredit
   frontalement « aucune session ne laisse l'outil inutilisable ».

**Dépendance cachée supplémentaire, non listée dans le plan :** l'étape 3 convertit
**12 routes** en `202 {tache}` — parmi lesquelles des routes de publication dont la sémantique
change à l'étape 5 (« propriétaire par champ », `provenance`, `sync_warning` bloquant) : ces
routes seront **réécrites deux fois**. Ce n'est pas fatal (le plan autorise explicitement les
étapes 1 à 4 en premier, `:1824-1830`), mais il faut le dire : l'ordre 1-2-3-4 « au plus haut
rendement » **reprend du travail** à l'étape 5.

**Ordre impossible :** aucun. Les étapes 1→9 sont monotones en dépendances **sauf** la
migration ↔ cache serveur (§5.2), qui est un vrai cycle : la migration (étape 2) exige une
donnée que seul le service de l'étape 5 sait remplir.

### 5.2 Carte module → destination : couverture complète, aucune route sans remplacement

- Les **11 modules** sont décrits, chacun avec son service, ses routes et ses écrans
  (`§3.1`). Les 11 lignes ont un service nommé et au moins un écran cible : **pas de module
  orphelin**.
- **Comptes de routes vérifiés** : `grep -cE "^@app\." prospect_app.py` → **75** ✓ (le
  document annonce 75) ; `agent-ia-web/dashboard_app.py` → **14** ✓. Total **89** ✓.
- `§5.3` nomme **5 routes disparues** et donne, pour chacune, son remplacement, sa méthode et
  sa justification. Vérifié sur trois : `/api/ia/logs` porte bien le docstring « simulé pour
  l'instant » (`prospect_app.py:1402`) ✓ ; `/api/analytics/summary` a bien trois blocs
  structurellement à zéro (mesuré en direct) ✓ ; `/api/publications/generate` n'est plus
  appelée par `cockpit.html` (0 occurrence, `generate-batch` : 1) ✓.
- **Réserves** : `§3.1` annonce `POST /api/social/articles` alors que la route est un `GET`
  (`prospect_app.py:703`) — coquille de méthode, à corriger car elle sert de contrat. Et
  `M9 — Tâches` déclare « les 11 routes `/api/etat/*`… branchées », ce qui suppose qu'un
  client existe : `Etat.` est **mort** (0 usage, mesure #14). La refonte doit livrer le client,
  pas seulement sa plomberie.

### 5.3 D1 à D10 : mutuellement cohérentes, sauf un point

| Paire | Verdict |
|---|---|
| D1 (zéro Node, zéro CDN) ↔ D2 (base = `cockpit.html`) | cohérent — le cockpit est déjà sans dépendance distante |
| D3 (trois magasins) ↔ D5 (un objet publication) | cohérent — trois cycles de vie, un objet assemblé en lecture |
| D4 (ID immuable) ↔ D2/D5 | **incohérent à l'implémentation** : la séquence n'est jamais amorcée au-dessus du serveur (NC-1), donc « jamais réattribué » n'est pas tenu |
| D6 (tâches) ↔ D7 (garder `etat_cockpit.py`) | cohérent — D7 fournit l'enveloppe de D6 |
| D8 (secrets) ↔ contrainte 7 (« dans le dépôt ») | **contradiction interne** (NC-3) |
| D9 (aucun état normal par défaut) ↔ D10 (chaîne visuelle unique) | cohérents ; D9 est le seul à traiter `#132001`, et il le traite en **affichage** (NC-4) |
| D2 ↔ `§3.1 M11` (« cockpit.html pour les jetons, `templates_dashboard` pour la mise en page ») | cohérent : les deux dashboards meurent, deux de leurs qualités survivent séparément |

**Verdict : 9 décisions sur 10 sont utilisables telles quelles ; D4 doit être complétée par une
règle d'amorçage de séquence.**

---

## 6. ANGLES MORTS (PARTIE 4)

Ce que les huit documents **n'ont pas** traité, et qui devrait l'être.

1. **La cause racine de `#132001` n'est attribuée à personne.** Le modèle Meta
   `j0_diagnostic` doit être créé/validé dans Business Manager ; `AUDIT-M1 §0.2` le dit hors
   dépôt, aucune étape ne le porte. Sans cette action non-code, la refonte rend la panne
   **visible** mais pas **réparée**. À écrire noir sur blanc, avec sa condition de sortie.
2. **La migration des données au-delà des publications.** L'étape 2 ne parle que de
   `publications`, `identifiants`, `tombstones`. Restent sans plan : les **22 prospects**
   (dont 4 lignes de test), les **234 enregistrements** de `publications_archive.csv` (le
   document affirme 234 enregistrements pour 623 lignes physiques — la clé de dédoublonnage
   est la colonne `Hash`, jamais citée dans le plan), et les **7 modèles de messages** de
   `skills_engine`. Aucun test de migration ne les couvre.
3. **La rotation des secrets exposés.** `config_api.json` et `config_ia.json` sont **suivis par
   git** et leur historique conserve les clés ; `config_api.json` porte lui-même la mention
   « ces clés ont été exposées dans un zip ». Le plan purge les fichiers (`§7.2`) mais ne
   prescrit **ni rotation, ni réécriture d'historique**. C'est la seule action qui ferme la
   fuite.
4. **Le devenir de n8n.** Quatre workflows existent, dont trois envois `active=False` ; le
   webhook de réponses est « la seule brique qui fonctionne en production » (`:1121`). Le plan
   ne dit pas qui les maintient, ni comment ils survivent à D1 (« aucun Node ») alors que n8n
   **est** un runtime Node écoutant sur `:5678`. Soit n8n reste une dépendance assumée, soit
   il doit mourir — ce n'est pas tranché.
5. **Le chemin hors ligne du serveur LWS.** `PARCOURS-ECRANS.md` promet des actions mises en
   file et rejouées « à la reconnexion » ; `ARCHITECTURE` ne décrit **nulle part** la file
   d'attente pour les écritures distantes (le `sync_warning` bloquant est décrit, la reprise
   ne l'est pas). À trancher : file persistée, ou échec immédiat assumé.
6. **La validation externe du nouvel état de publication.** `§5` remplace cinq statuts par cinq
   autres (`brouillon`, `programmee`, `publiee`, `echouee`, `abandonnee`) alors que le
   **serveur** (non modifié, souverain) écrit `programmee`**/**`publie`**/**`echec`**/**`erreur`.
   Aucune table de correspondance n'est donnée : `publiee` ↔ `publie`, `echouee` ↔ `echec`
   **et** `erreur`. C'est une omission de contrat au point exact où les deux systèmes se
   parlent.
7. **Le sort des 4 lignes de test du pipeline.** Les 2 seules cartes actionnables du cockpit
   sont `PROS-003` et `PROS-006`, deux lignes de test (`/api/state` : `hot:5`, `due_count:2`).
   Aucune étape ne purge ni ne réalimente ce fichier : les écrans neufs seront validés sur une
   base dont 20 lignes sur 22 sont mortes.
8. **La supervision du cron LWS après refonte.** Le plan garde le cron comme exécutant et
   ajoute un heartbeat `< 2 h`, mais **la cadence réelle n'est pas connue** (`§7.3`, point 1) et
   aucun document ne dit **qui modifie le cron** si `cron_sequences.php` doit changer.
9. **Le test d'idempotence de §2.8 ne teste pas ce qu'il annonce.** `test_idempotence` appelle
   `migration_002()` deux fois et attend `renumerotees: 0` ; or la fonction n'a **aucun garde
   interne** (`:1014-1038`) — la seconde exécution reparcourt les mêmes lignes et renumérote.
   L'idempotence réelle vient de la table `migrations(version)`, pas de la fonction : le test
   doit être écrit sur le **dispatcher**, sinon il échouera sur un code correct.

---

## 7. CORRECTIONS EXIGÉES AVANT VALIDATION HUMAINE

Numérotées, actionnables, chacune avec son critère de réussite.

1. **Amorcer la séquence `PUB` au-dessus du parc existant.** Dans `migration_002()`, avant
   toute allocation : lire l'identifiant maximal du serveur (`PUB-%04d`), et faire
   `UPDATE identifiants SET valeur = <max> WHERE nom='PUB'`. Ajouter un test : « après
   migration, aucun identifiant alloué n'appartient à l'ensemble des identifiants serveur
   connus ». **Réussi si** : sur une fixture reproduisant l'état réel (7 lignes locales,
   49 lignes serveur), les 7 lignes reçoivent des identifiants ≥ `PUB-0050` et **aucun**
   `UPDATE` ne touche une clé primaire existante.
2. **Rendre la migration inopérante impossible à silencier.** Trois ajouts : (a) `ORDER BY id`
   sur le `SELECT` de `migration_002()` ; (b) si `publication_cache_serveur` est vide, la
   migration **refuse de s'exécuter** et écrit un événement `MIGRATION-BLOQUEE` explicite
   (« cache serveur vide : lancer un pull d'abord ») ; (c) le rapport distingue `examinees`,
   `collisions_detectees`, `renumerotees`, et **échoue** si `collisions_detectees !=
   renumerotees`. **Réussi si** : serveur injoignable ⇒ étape 2 bloquée en rouge avec sa
   raison, jamais un « 0 renumérotée » vert.
3. **Déplacer l'étape « migration » après le premier pull serveur, ou livrer le pull dans la
   même étape.** Le plan doit dire où vit le cache serveur avant la migration. **Réussi si**
   l'ordre des 9 étapes ne contient plus aucun cycle de dépendance et que chaque « sortie
   vérifiable » est atteignable avec les seuls livrables des étapes déjà passées.
4. **Corriger `--gold2`.** Réécrire `ARCHITECTURE-SAAS.md:1905` : « `--gold2` reste à
   `#e2c07a` (N1) ; la valeur `#cfb583` du noyau concerne le thème clair du site, hors
   périmètre dark-only ». **Et** compléter `§0.1` : **dix** jetons gelés, pas six — ajouter
   `--soft`, `--muted`, `--gold2`, `--border-strong` avec leurs valeurs du mandat. **Réussi
   si** `grep -c "cfb583"` dans les trois documents de conception = 0 hors justification
   explicite et si `C2` refuse toute redéfinition de ces dix noms.
5. **Rendre le score de contrôle visible.** `cockpit.html` (puis les gabarits Jinja) doit
   afficher `score` et `manques` renvoyés par `POST /api/publications/<id>/image`, et le
   contrôle par slide doit produire **n rapports** (test : un carrousel G4 produit 7 rapports).
   **Réussi si** une image refusée (score < 70) est signalée à l'écran avec son manque.
6. **Statuer sur `SERVER_OWNED` :** soit `L5` est retiré (le serveur reste tel quel et le
   contrat d'écriture ne bouge pas), soit une étape de modification + déploiement du PHP est
   ajoutée, avec sa procédure de retour arrière. **Réussi si** le plan ne contient plus
   d'affirmation « on l'étend » sans poste de travail correspondant.
7. **Passer l'étape 8 à 2 sessions, ou la découper.** Ordre imposé : (a) réécrire les 5 routes
   sur `social_templates` **et vérifier qu'aucune ne produit plus par `V3`** ; (b) supprimer
   les 6 modules ; (c) contrôle par slide ; (d) `image_optimizer`, `metrics_tracker`,
   `services/blog.py`. **Réussi si** après chaque sous-étape, `python3 -c "import app"`
   réussit et une image se produit par le bouton du cockpit.
8. **Résoudre NC-3 : contrainte 7 contre `§7.2`.** Décider, pour `api/*.php` (11 fichiers
   suivis) : soit ils sortent du suivi git (`git rm --cached` + `.gitignore`) et la contrainte 7
   devient tenable, soit la contrainte 7 est explicitement restreinte et l'écrit. Ajouter, dans
   tous les cas, la **rotation** des clés de `config_api.json` / `config_ia.json` (exposées,
   versionnées, historique git conservé). **Réussi si** `C7` a une portée écrite et si l'étape 9
   peut passer.
9. **Nommer l'action Meta.** Ajouter au plan, hors code, la création/validation du modèle
   `j0_diagnostic` côté Business Manager, avec sa preuve (identifiant de modèle, langue `fr`,
   catégorie utilitaire) et un test de bout en bout : un envoi réel J0 qui revient `200` et non
   `#132001`. **Réussi si** `test_132001` peut être complété par un cas « envoi réel accepté ».
10. **Trancher n8n, la file hors ligne et la table de correspondance des statuts.** Trois
    décisions à écrire dans `ARCHITECTURE` : (a) le sort des 4 workflows n8n ; (b) le mécanisme
    de reprise des écritures différées ; (c) la table `brouillon/programmee/publiee/echouee/
    abandonnee` ↔ `brouillon/programmee/publie/echec/erreur` **avec les deux cas d'erreur**.
    **Réussi si** aucune des trois questions ne reçoit de réponse improvisée pendant la session.
11. **Réparer le nombre de polices : 12, pas 14.** Aligner `ARCHITECTURE-SAAS.md` sur le
    tableau justifié de `SYSTEME-VISUEL-SAAS.md §3.4` (Outfit 400/700/900), et faire porter à
    `C4` la **liste nommée** des 12 fichiers. **Réussi si** `grep -c "14 \.woff2"` = 0 et si
    `C4` échoue sur un fichier manquant de la liste.
12. **Corriger les trois imprécisions de mesure** : `AUDIT-M3 §2.2` (« tolérance ±3 » — écrire
    la valeur exacte **33,36 % avec tolérance**, 32,65 % en égalité stricte) ; `AUDIT-M3 §F3`
    (« 68 % non contrôlées » → « les slides 2 à n, jamais notées ; le score décrit la
    couverture ») ; `AUDIT-M5 §3.2` (« les 11 routes n'ont jamais été appelées » → « 2 routes
    exercées en lecture, 0 écriture, aucune persistance créée »). **Et** corriger la source de
    `AUDIT-M4 §1.3/§1.4` : nommer le miroir local daté (2026-09-09) au lieu du serveur vif
    (2026-09-15, 4 `publie`, 49 lignes). **Réussi si** chaque chiffre du tableau ci-dessus (2)
    reste reproductible par une commande citée dans le document.
13. **Réparer l'affirmation réfutée sur `#132001`.** Remplacer « l'erreur a parqué la base
    entière, puis 1 226 exécutions » par : « 1 226 exécutions « rien à envoyer » sur la période,
    dont **820 avant** l'erreur du 2026-09-07 ; l'erreur a parqué **2** prospects et laissé 20
    lignes dans un état que l'interface n'a jamais montré ». **Réussi si** le document permet de
    distinguer la cause (défaut de réconciliation) de l'épisode (132001).

---

### Ce qu'un superviseur doit dire en plus, et qui compte

Ce corpus n'est pas du texte généré pour faire volume. Les `fichier:ligne` sont exacts, les
tables WCAG sont recalculables au centième, les comptages d'emojis sont réconciliés au lieu
d'être arbitrés, la correction d'un document antérieur est faite **contre son propre camp**
(`DSU` 17,71 → 16,64), et les non-établis sont déclarés comme tels. Deux affirmations ont été
trouvées **fausses dans leur formulation** (#3, #14) et **deux sources de mesure périmées**
(#10, #11) : c'est peu sur 15 affirmations qui commandent une refonte, et c'est réparable par
les corrections ci-dessus.

Le point d'arrêt est ailleurs, et il est unique : **la refonte promet de réparer « le défaut le
plus grave du projet » par une migration qui, écrite telle quelle, ne répare rien et ne le dira
pas.** Tant que les corrections 1 à 3 ne sont pas intégrées, la validation humaine porterait sur
un plan dont l'étape la plus importante ne peut pas tenir sa promesse.
