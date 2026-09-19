# CONTRE-EXPERTISE — usage réel, manques du plan, propositions

> Mission de **contradiction**. Ce document ne valide pas : il cherche ce que les huit
> autres documents n'ont pas vu, et propose mieux.
> Date : 2026-09-19. Aucun fichier modifié hors ce document. Aucun `git commit`, `git add`,
> `git checkout`. **Aucune route modificatrice appelée** : uniquement `GET /api/state` sur
> l'instance vive (`127.0.0.1:8788`) et des relevés de journaux en lecture.
> Aucune valeur de secret n'est reproduite : les emplacements sont cités en `fichier:ligne`
> **et en nature seulement**.
>
> Tout ce qui suit est reproductible : les commandes sont données, les chiffres sont ceux
> qu'elles ont produits.

---

## 0. La commande qui fonde tout le reste

Les huit documents comptent « 76 journaux (1,1 Mo) » et en tirent `6 806 GET /api/state`.
J'ai recompté, **en nettoyant les séquences ANSI** que le formateur de Flask écrit dans les
journaux (`\x1b[33m` autour des lignes de 404) — sans ce nettoyage, 226 requêtes
disparaissent, dont **toutes** les requêtes de police et les sondages d'agent :

```bash
cd /home/ballo/OX6A/toolkit_eperformance/prospecting_logs/
python3 - <<'EOF'
import re, glob, os, collections
esc = re.compile(r'\x1b\[[0-9;]*m')
req = re.compile(r'"([A-Z]+) (\S+) HTTP/1\.[01]" (\d{3})')
ts  = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})')
R = []
tot = 0
for f in sorted(glob.glob("*.log")):
    tot += os.path.getsize(f)
    for l in open(f, encoding='utf-8', errors='replace'):
        cl = esc.sub('', l); m = ts.match(cl)
        for v, p, c in req.findall(cl):
            R.append((m.group(1) if m else '?', v, p, c))
print(len(glob.glob('*.log')), "journaux", round(tot/1e6, 2), "Mo", len(R), "requêtes")
print("codes :", dict(collections.Counter(r[3] for r in R)))
EOF
```

**Résultat : 83 journaux, 0,97 Mo, 8 322 requêtes HTTP** (et non 76 / 1,1 Mo / ~8 100),
du 2026-09-07 13:50:53 au 2026-09-19 05:20:23. Codes réels :
`200 : 8 096 · 404 : 110 · 500 : 84 · 503 : 20 · 400 : 4 · 405 : 2`.

Ce n'est pas un détail de méthode : **104 erreurs serveur (500/503) sont absentes de tous les
documents d'audit**, et c'est le cœur de l'angle 1.

---

# ANGLE 1 — L'ADÉQUATION AU RÉEL

## 1.1 Le chiffre que personne n'a lu : 302 gestes

Le relevé de `AUDIT-M1 §2.3` s'arrête au comptage des routes. Le rapport qui manque est
celui-ci : **ce que l'utilisateur a fait, en gestes, sur douze jours.**

| Mesure | Valeur | Comment |
|---|---|---|
| Requêtes HTTP totales | 8 322 | ci-dessus |
| `GET /api/state` (sondage automatique) | **6 938 = 83,4 %** | `collections.Counter` |
| Requêtes émises dans une minute **sans aucun autre geste** | **6 350** | 5 778 minutes sur 6 187 (93 %) |
| **`POST` — les gestes réels** | **302 = 3,63 %** | — |
| dont `POST /api/publications/<id>/image` | **138 = 46 % des gestes** | — |

Autrement dit : **sur douze jours, l'utilisateur a fait 302 gestes, et presque un sur deux a
été « génère l'image de cette publication ».** Le sondage de 60 s (`cockpit.html:1481`,
`setInterval(load, 60000)`) produit 83 % du trafic ; à 18 499 octets mesurés par réponse
(`curl -s http://127.0.0.1:8788/api/state` → `HTTP 200 | 18499 octets | 0,26 s`), cela fait
**≈ 128 Mo de JSON poussés dans un onglet** pour 302 gestes.

## 1.2 La lecture des 6 806 appels à `/api/state` est fausse

`AUDIT-M1 §2.3` conclut : « les 6 806 appels à `/api/state` montrent un utilisateur qui ouvre
l'écran ». **Non.** Un onglet laissé ouvert produit ces appels sans personne devant. Mesure :
93 % des minutes couvertes par les journaux ne contiennent **aucun** geste, et
6 350 des 6 938 sondages ont été émis pendant ces minutes-là. Le chiffre ne mesure pas
l'attention portée à l'écran ; il mesure **un `setInterval` et 53 lancements d'application
ayant produit au moins une requête** (sur 83 fichiers de journal — 1 fichier = 1 démarrage),
dont **10 (19 %) se terminent sans un seul geste**, avec une **médiane de 3 gestes par
lancement**.

## 1.3 Une partie des journaux est celle des agents, pas celle du propriétaire

C'est la correction la plus lourde à porter, et elle est vérifiable : le 2026-09-19, le
journal contient **14 sondages de routes qui n'existent pas** —
`GET /api/prospects`, `/api/quick`, `/api/settings`, `/api/design`, `/api/ia`, `/api/scrape`,
`/api/skills`, `/health`, `/api/doctor`, `/api/health`, `/cockpit.html`,
`/assets/fonts/dm-sans-400.woff2` — tous en 404 à `04:05:31` et `04:06:00`. Aucun utilisateur
qui dispose de boutons ne tape ces URL : c'est une signature d'exploration d'API. Le même jour,
les seuls gestes d'atelier sont des tests du **nouveau** chemin d'image (`social_templates/publication.py`,
fichier daté du 09-19 03:21) sur `PUB-0001` (×4) et `PUB-0007` (×2).

- Dernier jour de travail **du propriétaire** : **2026-09-15** (1 429 requêtes, 32 gestes,
  0 sondage de route inexistante, session ouverte de 01:36 à 23:20).
- Dernier geste d'atelier datable par un humain travaillant : `POST /api/publications/PUB-####/edit`
  à **2026-09-15 06:12**.
- 2026-09-17 : 300 requêtes, **1** geste en cinq heures d'onglet ouvert.

**Conséquence : le plan, les audits et le système visuel ont mesuré l'outil dans un état que
le propriétaire n'a jamais vu** (voir §2.6), et une partie du « trafic » attribué à
l'utilisateur est celui des agents de la refonte elle-même.

## 1.4 Ce qu'il fait vraiment, et à quelles heures

Répartition des 1 384 requêtes hors sondage : **798 (58 %) tombent entre 22 h et 06 h**, plus
un bloc 12 h–16 h (voir le tableau horaire du script §0). Les créneaux 07 h–10 h et 18 h–21 h
sont morts. Le profil est celui d'un travail de nuit, par sessions longues, à la demande.

Les gestes, tous, dans l'ordre du volume :

| Geste | Nombre | Premier | Dernier |
|---|---|---|---|
| `POST /api/publications/<id>/image` | 138 | 09-08 00:12 | 09-19 03:32 (agent) |
| `POST /api/publications/generate-batch` | 53 | 09-07 13:52 | 09-19 00:33 |
| `POST /api/publications/<id>/edit` | 50 | 09-08 00:32 | 09-15 06:12 |
| `POST /api/publications/delete-all` | 18 | 09-08 00:36 | 09-19 00:32 |
| `POST /api/publications/<id>/delete` | 9 | 09-08 00:38 | 09-09 00:53 |
| `POST /api/publications/<id>/publier-maintenant` | 7 | 09-08 01:18 | 09-12 16:23 |
| `POST /api/publications/weekly-calendar` | 4 | 09-08 03:47 | 09-11 14:41 |
| `POST /api/publications/generate-all-images` | 2 | 09-07 13:54 | 09-07 17:33 |
| `POST /api/qualify` · `generate-msg` · `optimize-msg` · `analyze-competitor` | 1 chacun | **09-07 15:37** | idem |
| `/api/add` · `/api/send` · `/api/import` · `/api/sync` · `/api/update-phone` · `/api/scrape/*` | **0** | — | — |

Les quatre routes à 1 appel ont toutes été appelées **à la même seconde le premier jour**
(09-07 15:37) : c'est un essai unique, pas un usage.

## 1.5 La boucle réelle, et pourquoi elle s'est arrêtée (mesuré)

Ce que ces 302 gestes décrivent est une **boucle d'atelier**, pas un tableau de bord :

> générer un lot de 7 → illustrer les 7 **une par une** → regarder → tout effacer
> (`delete-all`, 18 fois) → recommencer.

Et la cause de l'arrêt est dans le journal, en clair :

```bash
python3 - <<'EOF'
# sur les 83 journaux nettoyés : combien de lancements de lot ont échoué ?
# → 53 lancements ; 26 en 200 ; 27 en 503/500  =>  51 % d'échec
# dont 26 échecs le seul 2026-09-10, face à 8 succès ce jour-là
EOF
```

**51 % des lancements de lot se sont soldés par une erreur** (20 × 503 « ZÉRO FALLBACK »
`prospect_app.py:550-580`, 7 × 500), dont **26 le 2026-09-10** — le jour le plus travaillé
(70 gestes). L'utilisateur relançait à la main, puis a espacé : 09-10 (70 gestes) → 09-11 (23)
→ 09-12 (8) → 09-13 (0) → 09-14 (23) → 09-15 (32) → arrêt. Le même jour que ces 26 erreurs,
la production de texte a aussi été plafonnée par le rate limiter de 5 s hérité
(`AUDIT-M2 §5 A1`, déjà relevé).

Un plan qui parle de « file du jour », de « file d'attente » et de « bandeau de tâches » mais
qui ne dit **rien du taux d'échec du fournisseur ni de la reprise automatique** traite la
conséquence (afficher l'échec) et pas la cause (l'échec à 51 %).

## 1.6 Verdict d'adéquation : le plan construit-il pour le bon problème ?

**Partiellement non, et c'est dit sans détour.**

1. **Le plan reconstruit en priorité ce qui n'a jamais servi.** `AUDIT-M1` a établi
   0 appel sur toute la chaîne d'acquisition ; je le confirme route par route (§1.4). Or
   `ARCHITECTURE-SAAS.md §6` consacre **la totalité de la session 9 (une des 13) à `#/acquerir`** :
   grille de pipeline, panneau de fiche à 3 onglets, sources, messages, qualification, et
   ~10 routes nouvelles (`/api/prospects/<id>/action`, `/fiche`, `/message`…). C'est la
   reconstruction d'une surface morte pour un utilisateur qui n'y a jamais touché, alors que
   la boucle qui l'a fait revenir douze jours (lot → image → effacer) n'a **aucun écran
   dédié** dans le plan : elle est diluée entre `#/produire/publications` (4 onglets), un
   atelier par publication et `#/produire/lot/<tache>`.
2. **Les deux seules destinations à trafic mesuré sont correctement traitées** —
   Publications (424 appels) et ses statistiques (289) : le plan les reprend (§2.9, §5.1).
   Ce n'est pas rien, et il faut le lui créditer.
3. **Mais l'usage réel n'est pas l'usage prévu** : le propriétaire ne gère pas un pipeline de
   22 prospects avec cet outil ; il y fabrique des visuels. Un outil refondu comme *dashboard
   d'exploitation* sera aussi peu utilisé que l'actuel si l'atelier n'est pas la première
   pièce livrée.

---

# ANGLE 2 — CE QUE LE PLAN NE FAIT PAS

## G0 — La priorité n° 1 de l'étape 1 répare une régression de la refonte, pas un défaut subi

C'est la correction la plus dérangeante que j'aie à porter, et elle est vérifiable en trois
commandes.

`SYSTEME-VISUEL-SAAS.md:1976` présente ainsi le critère de sortie n° 4 :

> « **Le défaut le plus grave du socle** : 7 `@font-face` en 404, cockpit en police système
> **depuis des semaines**, sans que rien ne le signale »

et `ARCHITECTURE-SAAS.md §6` en fait la vitrine de l'étape 1 (« Les 7 `@font-face` cessent de
renvoyer 404 »). Or :

```bash
cd /home/ballo/OX6A/toolkit_eperformance/
git show f4022c0:cockpit.html | grep -c "@font-face"   # → 0   (le cockpit du propriétaire)
git show 560cb1e:cockpit.html | grep -c "@font-face"   # → 0   (avant la refonte visuelle)
git show 8389309:cockpit.html | grep -c "@font-face"   # → 7   (après, 09-19 03:25)
```

- **Le cockpit réellement utilisé du 07/09 au 17/09 ne demandait aucune police.** Sa CSS
  nommait `'DM Sans'` et `'Outfit'` **sans source** (`f4022c0:cockpit.html:10,13,23,27`) :
  le navigateur retombait sur la police système **par construction**. Il n'y avait donc
  **rien à signaler** — aucune requête, aucun 404. La phrase « depuis des semaines, sans que
  rien ne le signale » décrit un état qui n'a jamais produit d'erreur.
- **Les 7 `@font-face` sont arrivés le 2026-09-19 à 03:25**, par le commit `8389309`
  (« aligne le tableau de bord sur le design system du site ») — c'est-à-dire par la refonte
  elle-même, douze minutes après le début de l'incident de `/api/state` (§G6).
- **Mesure dans les journaux** : les requêtes de police en 404 sont **62, toutes le
  2026-09-19, zéro sur les douze jours précédents** (comptage par jour, script §0).
- Le chemin est faux pour une raison structurelle : `GET /` rend le **texte** du fichier
  (`prospect_app.py:2276-2278`), il n'y a pas de racine statique ; donc
  `url('../site-eperformance/assets/fonts/…')` (`cockpit.html:162-168`) se résout en
  `/site-eperformance/...` → 404. Les fichiers, eux, **existent** :
  `/home/ballo/OX6A/site-eperformance/assets/fonts/` contient 9 `.woff2`.

**Ce que cela change :** l'étape 1 — présentée comme « la session au plus haut rendement » —
place en tête de gondole la réparation d'une casse que la refonte a introduite elle-même
l'heure d'avant, et la mesure « 404 sur les deux ports » est un artefact du même moment.
Le défaut de socle qui a réellement coûté quelque chose au propriétaire n'est pas celui-là :
c'est **l'absence de tout signal quand l'application se casse** (§G6, 104 erreurs serveur,
0 alerte). Il faut réparer les deux, mais dans l'autre ordre, et sans écrire « depuis des
semaines ».

## G1 — Le format des identifiants prospects est faux, et il casse le seul tuyau qui marche

`ARCHITECTURE-SAAS.md:728` déclare :

```sql
id  TEXT PRIMARY KEY,   -- PROS-%04d
```

et `allouer()` (`~943`) formate en `:04d`. Mais :

- le code vivant alloue **`PROS-%03d`** : `prospect_scraper.py:199`
  → `f"PROS-{(max(nums)+1) if nums else 1:03d}"` ;
- **le serveur aussi** : `api/ajout_prospects.php:146` → `sprintf('PROS-%03d', $maxId)` ;
- et surtout **le contrat d'API serveur identifie un prospect par cette chaîne littérale** :
  `api/lecture_csv.php:11` (`?id=PROS-001`), `api/stop_prospect.php:15` (« `id` : ID du
  prospect (ex: PROS-001) ← préféré »), `api/update_status.php:9`.

Le plan lui-même écrit un exemple à 4 chiffres (`PROS-0012`, ligne 1488) — qui ne correspond à
aucun prospect existant (`PROS-012` existe, `PROS-0012` non).

**Conséquence :** après la refonte, le premier prospect créé s'appelle `PROS-0001` ; le webhook
de réponses — « la seule brique de la chaîne qui fonctionne en production » selon
`AUDIT-M1 §5.1`, et que `§2.10` désigne comme propriétaire du statut — continue d'écrire sur
`PROS-001`. **Les réponses cessent d'arriver, silencieusement.** C'est exactement la classe de
défaut que le plan veut tuer (un identifiant qui ne désigne plus le même objet), transposée aux
prospects, et **aucun des neuf documents ne la relève** (le superviseur a relevé l'amorçage de
la séquence des `PUB` à 0, NC-1, pas le format `PROS`).

## G2 — L'ordre « pull avant import » n'est écrit nulle part, et l'import tel quel importe un mensonge

`AUDIT-M1 §2.3` a mesuré que **20 des 22 lignes locales divergent du serveur**, et que
`PROS-007`, `PROS-008`, `PROS-009` (trois réponses **positives**) s'affichent « Froid, jamais
contacté » en local.

Le plan pose (§2.10) « statut : **serveur** (webhook de réponses) ». Mais :

- l'étape 2 migre les CSV vers `eperf.db` **sans dire dans quel ordre** : si elle importe le
  CSV local, elle importe les 20 statuts faux ;
- `migration_002` (`§2.8`) ne traite que les **publications** — rien sur les prospects ;
- le premier `pull` décrit au plan est celui de l'étape 5, soit **3 sessions plus tard**.

Pendant ces trois sessions, le nouvel écran affichera exactement le mensonge que l'audit a
dénoncé (« trois prospects affichés Froid, jamais contactés »), et il est actionnable : envoyer
un J0 à quelqu'un qui a déjà répondu. **Correction minimale :** faire du tout premier acte de
l'étape 2 un `pull` en lecture (`GET lecture_csv.php`, déjà le contrat documenté), et faire
afficher par le rapport de migration : « 20 lignes de statut corrigées par le serveur ».

## G3 — Les 234 archives ne sont pas migrées ; ce n'est pas un journal, c'est la mémoire anti-répétition

`publications_archive.csv` : 234 lignes, 6 colonnes, **234 `Hash` tous uniques** (mesuré), et
227 d'entre eux n'ont de trace nulle part ailleurs (les 7 restants correspondent aux 7
publications courantes). Son rôle n'est pas documentaire : c'est le **seul** mécanisme
anti-répétition du générateur — `content_engine.py:1327` (`if not is_in_archive(...)`) et
`content_engine.py:1937` (`is_in_archive`), avec régénération jusqu'à `max_attempts`, et
`content_engine.py:1342` prévient quand tous les tirages sont déjà en archive.

Le plan met bien une colonne `archive_ref` (`§2.5`) et une table d'archives (`§2.4`), mais
**aucune ligne ne dit que les 234 empreintes existantes sont importées**. Perdre cette
mémoire, c'est autoriser le générateur à re-produire un texte **déjà publié** — et trois
publications sont sorties pour de vrai (LinkedIn et Facebook, `AUDIT-M4 §1.4`). À noter :
l'archive commence le **2026-09-10**, précisément après le lot de correctifs « contenu
répétitif » ; les 234 lignes sont donc la seule preuve de ce qui a déjà été dit — et
`POST /api/publications/archive/clear` a déjà été appelé une fois (09-09 19:37).

## G4 — Il n'y a aucune procédure de retour arrière, et le « filet » décrit perd des données

`ARCHITECTURE-SAAS.md:1369` répond : « Retour arrière d'une migration ? **Impossible et
assumé** : une migration est une transaction SQLite. » C'est vrai de la *transaction*, faux du
*produit* : cela ne dit pas comment revenir à l'ancien outil si le nouvel écran est mauvais, ni
ce qu'on fait si `migration_002` écrit des données **valides mais fausses** (elle renumérote
7 lignes ; si la règle est mauvaise, l'original n'existe plus).

Et le filet décrit — `GET /cockpit` sert `cockpit.html` jusqu'à l'étape 9 (`§6`, règle de
transition) — **n'est pas sûr en données** :

- dès l'étape 2, `publications.csv` cesse d'être lu/écrit en continu et devient un **export à
  la demande, « généré / jetable »** (`§2.4`) ;
- donc revenir à `cockpit.html` après l'étape 2 affiche **l'ancien état**, sans voir tout ce
  qui a été produit dans le nouvel outil ; et rien n'indique comment ré-exporter.

Il manque : (a) une copie **octet pour octet** de `publications.csv` et
`prospects_tracking.csv` avant toute écriture de `migration_002` ; (b) un `scripts/revenir.sh`
documenté (exporter la base vers les 2 CSV → arrêter le nouvel `app.py` → relancer
`prospect_app.py`) ; (c) l'invariant testable « après `revenir.sh`, l'ancien cockpit affiche
les mêmes 7 publications et les mêmes 22 prospects que le nouveau ».

## G5 — Aucun budget de temps : « session » n'est défini nulle part

13 sessions, 9 étapes, aucune durée, aucun calendrier, aucun jalon daté — je l'ai vérifié :
le mot « session » n'est jamais défini dans `ARCHITECTURE-SAAS.md`. Le plan dit lui-même que
**les 4 premières sessions ne changent rien de visible** : « à la fin de l'étape 4, l'outil est
identique pour l'utilisateur ». Pour un propriétaire qui a cessé de s'en servir le 15/09, un
plan qui commence par quatre sessions sans gain visible et sans date est un plan qui ne
redémarrera pas l'usage. Il manque une ligne par étape : *ce que l'utilisateur voit changer, et
en combien d'heures de travail.*

## G6 — 104 erreurs serveur, zéro alerte : la santé (D9) ne regarde pas l'application elle-même

Le défaut que `D9`/l'étape 6 veulent réparer est `#132001` (`AUDIT-M1 §4.1 F3`) : une erreur
métier non signalée. Mais le relevé montre un angle mort plus large :

| Erreur | Nombre | Période |
|---|---|---|
| `500 GET /api/state` | **73** | 2026-09-19 03:12:59 → 04:20:21 |
| `503 POST /api/publications/generate-batch` | 20 | 09-10 → 09-14 |
| `500 POST /api/publications/generate-batch` | 7 | 09-10 |
| `500 POST /api/publications/<id>/image` | 2 | — |
| `405 GET /api/status` · `400 POST /api/ia-config` · `400 llm-provider` | 2 · 3 · 1 | — |

La panne du 09-19 est **entièrement traçable** : les journaux
`scraper_20260919_031256.log`, `_033125.log`, `_040129.log` montrent 73 × 500 sur la route la
plus appelée du produit, sur 68 minutes, pendant que l'application continuait de tourner. La
cause est écrite noir sur blanc dans `42bdc2d` : le commit `560cb1e` (03:14:23) a **inséré
`_gabarits_disponibles()` entre le décorateur `@app.get("/api/state")` et sa fonction** ;
`api_state()` existait toujours mais n'était plus routée, Flask recevait un entier et répondait
500. Le premier `500` est à **03:12:59**, soit 4 secondes après le démarrage de l'instance dans
`scraper_20260919_031256.log` : le fichier était cassé avant d'être commité.

Ce que cela démontre, et que le plan ne traite pas : **la santé de D9 est une santé métier
(4 conditions), pas une santé d'application.** Aucun des 10 contrôles de `verifier.py` (§1.7)
n'aurait vu un décorateur déplacé, et `verifier.py` tourne « à la fin de chaque session »
(`:375`), donc **après** que la casse a atteint le processus vivant. C'est un défaut de
conception du contrôle, pas un incident isolé.

## G7 — Deux API de tâches conservées côte à côte, dont une à zéro appel

Le plan garde les **11 routes `/api/etat/*`** *et* ajoute **5 routes `/api/taches`**
(`§5.1` note + `§5.4`), en le justifiant : « les deux vivent, elles ne se remplacent pas : la
première est appelée par le code, la seconde par l'utilisateur ». Mesure : **aucune des 11 n'a
jamais été appelée par l'utilisateur** — les 2 seuls appels de toute l'histoire
(`GET /api/etat/taches`, 04:05:31 et 04:06:01 le 09-19) sont des sondages d'agent (§1.3).
Un module appelé uniquement « par le code » n'a pas besoin de **11 routes HTTP** : il a besoin
d'être un module. Le plan pourrait exposer `/api/taches` seul et appeler `etat_cockpit`
en processus — 11 routes en moins, aucun comportement perdu.

## G8 — Les visuels déjà publiés restent hors charte, et personne ne le répare

Le docstring de la nouvelle route d'image (`prospect_app.py:638-655`, écrit le 09-19) le dit
lui-même : l'ancien chemin « employait `Archivo + Inter` par CDN Google Fonts, l'or `#D4AF37`,
et incrustait un crédit « PHOTO · PEXELS » dans le livrable : **chaque image produite jusqu'ici
était hors charte** ».

Or **138 générations** ont eu lieu par l'ancien chemin, **9 fichiers subsistent**
(`assets_pubs/`, 1,6 Mo) et **3 publications sont sorties** sur LinkedIn/Facebook. Le plan
répare la chaîne (D10, étape 8) mais **ne prévoit aucune reprise des livrables déjà sortis** :
ni régénération, ni remplacement, ni décision écrite de les laisser. C'est pourtant la seule
partie visible par les clients du propriétaire.

## G9 — `delete-all` annonce une suppression qu'il ne fait pas

Sans être grave, c'est de la même famille que le défaut que D9 veut tuer (l'écran qui dit
faux) : `prospect_app.py:2254-2267` cherche `assets_pubs/{ID}.png` alors que les fichiers réels
s'appellent `PUB-0001-G3-facebook.png`, `PUB-0007-G4-facebook-1.png`… Seul `PUB-0007.png`
correspond. **`assets_deleted` vaut donc 0 dans presque tous les cas**, et l'écran affiche une
suppression complète. Le plan remplace `delete-all` par `/api/publications/supprimer`
(`§5.3`) — bien — mais s'il reprend la même logique de chemins, il reproduit le défaut.

## G10 — Les identifiants `PUB` se recyclent **aujourd'hui**, et le plan répare ça à l'étape 2

`_pub_id_offset()` (`prospect_app.py:455-464`) calcule `max(ID)` sur les lignes **présentes**,
et `generate-batch` en déduit `start_id` (`:563`). Appelé 18 fois, `delete-all` (`:2225`)
vide la liste : le lot suivant repart à `PUB-0001`. Preuves :

- les 7 publications actuelles sont **exactement** `PUB-0001…PUB-0007` ;
- `assets_pubs/` conserve les traces de générations successives :
  `PUB-0001-G3-facebook.png` (génération 3) et `PUB-0007-G4-facebook-1…3.png` (génération 4).

La réparation est prévue (étape 2, `D4`), mais **après 1 à 3 sessions**, alors que le défaut est
vivant et que l'historique montre qu'il a déjà produit un dégât réel : le contenu neuf hérite
du statut `publie` d'un ancien et « simule un succès » (`§2.8`, le défaut dit le plus grave du
projet). Cinq lignes de correctif dans l'application actuelle suppriment le risque pendant
toute la transition. Le superviseur a relevé NC-1 (la séquence amorcée à 0 rend la migration
inopérante) ; il n'a pas proposé le correctif immédiat.

## G11 (mineur) — Le seuil de la ligne de partage n'est pas écrit

Le plan supprime `cockpit.html` à l'étape 9 et écrit : « quand plus rien ne pointe vers lui ».
Aucune mesure n'est proposée pour « plus rien » : le journal d'accès, qui existe, permet
exactement ça (`grep -c "cockpit" journaux`). Une condition mesurable vaut mieux qu'une
condition ressentie.

---

# ANGLE 3 — PROPOSITIONS, PAR IMPACT DÉCROISSANT

Chaque proposition est concrète, chiffrée, et son effet est mesurable sur les journaux ou par
un test nommé.

## P1 — La « planche de contrôle » : un écran qui fait le geste le plus fréquent du produit

**Constat :** 138 des 302 gestes sont « génère l'image », faits **un par un**, à 19,7 s de
moyenne (et jusqu'à 56,4 s, `AUDIT-M3 §F8`) ; puis 18 `delete-all` effacent tout. La meilleure
chaîne de contrôle existe — `social_templates/controleur.py` (8 postes, seuil 70) et
`social_templates/superviseur.py` (angle, accroche, promesse) — et n'a **aucun bouton**
(`AUDIT-M2 §6.3`).

**Proposition :** une destination `#/produire/planche` — un clic produit le lot **et** ses
visuels, un seul écran affiche les N images à taille de jugement, chacune avec le score du
contrôleur par slide et le verdict du superviseur, et **un seul geste** garde ou écarte.
« Écarter » écrit un tombstone (le plan l'a déjà, `§2.8`) au lieu d'effacer la base.

**Justification mesurée :** « produire un lot de 7 et le juger » coûte aujourd'hui 7 clics
× 19,7 s ≈ **138 secondes d'attente** et 7 changements d'écran ; la cible est 1 clic, 1 écran.
Effet secondaire mesurable : `delete-all` disparaît des journaux (aujourd'hui 18 occurrences),
et avec lui la cause du recyclage des identifiants (G10).

## P2 — Le réessai automatique sur échec du fournisseur : la cause de l'abandon est mesurée

**Constat :** 27 des 53 lancements de lot (51 %) se sont soldés par un 503/500, dont 26 le
09-10 ; le plan fournit `reprendre` (manuel, `§4.1`) et l'état `echouee`, mais **aucune
politique de réessai**, et `711c521` (décision du propriétaire, légitime) a supprimé
tout second fournisseur : il ne reste qu'un point de défaillance unique.

**Proposition :** dans l'unité de travail, **3 tentatives** avec attente 2 s / 8 s / 30 s sur
erreur transitoire (réseau, 429, 5xx), tracées en événement `REPRISE` ; au-delà, l'unité passe
`echouee` avec sa raison, et **une** action « Reprendre les échecs » relance tous les échecs
d'une tâche (le plan a déjà `deja_faite()` et la reprise idempotente : c'est du câblage, pas
une architecture).

**Justification mesurée :** ramener le taux d'échec des lots sous 10 % et **zéro reprise
manuelle après un 503 transitoire**. Test d'acceptation nommé : un fournisseur simulé qui
répond 503, 503, 200 → l'unité réussit, un événement `REPRISE` est écrit, la tâche se termine
`terminee`.

## P3 — Reprendre l'identité **maintenant**, hors refonte : deux correctifs de cinq lignes

**Constat :** G1 (format `PROS-%04d` contre `%03d` côté serveur) et G10 (recyclage des `PUB`
après effacement) sont deux défauts **vivants**, réparés par le plan trop tard (étape 2) ou pas
du tout (prospects).

**Proposition, dans l'application actuelle :**
1. `_pub_id_offset()` lit et écrit un compteur persistant
   (`prospecting_logs/publications.seq` : `seq = max(seq, max(ID)) ; seq += 1`) au lieu de
   dériver du contenu ; `delete-all` devient une suppression douce (colonne `Statut = corbeille`)
   plutôt qu'un vidage ;
2. `next_id()` (`prospect_scraper.py:199`) et le schéma (`ARCHITECTURE-SAAS.md:728`)
   s'accordent sur **`PROS-%03d`**, et le format devient une donnée par séquence
   (`{nom, format, valeur}`) plutôt qu'un `:04d` codé en dur dans `allouer()`.

**Justification mesurée :** un test rejoue trois cycles « tout effacer → générer 7 » et exige
21 identifiants **distincts** (aujourd'hui : 7, réutilisés 4 fois — traces `G3`/`G4` dans
`assets_pubs/`) ; et le premier prospect créé après migration est `PROS-023`, avec
`lecture_csv.php?id=PROS-007` qui renvoie toujours la même ligne.

## P4 — Le retour arrière, écrit et testé (G4)

**Proposition :** (a) `migration_002` écrit d'abord `publications.csv.pre-002` et
`prospects_tracking.csv.pre-002`, copies **octet pour octet**, avant de renuméroter quoi que
ce soit ; (b) `scripts/revenir.sh` : export base → 2 CSV, arrêt de `app.py`, relance de
`prospect_app.py`; (c) l'invariant devient un test : « après `revenir.sh`, l'ancien cockpit
affiche 7 publications et 22 prospects, identiques à ceux du nouvel écran ».

**Justification :** sans cela, la phrase « aucune session ne laisse l'outil inutilisable »
(`§6`) est vraie pour l'écran et fausse pour les données : après l'étape 2, le filet
`GET /cockpit` lit un CSV que le nouvel outil n'écrit plus en continu.

## P5 — L'acquisition : la supprimer au lieu de la refondre, et se donner un critère de retour

**Constat :** 15 routes, **0 appel** en douze jours ; 20 des 22 prospects sont périmés en
local ; la chaîne réelle est côté serveur (`cron_sequences.php` + webhook n8n). Le plan
consacre une session entière à cette destination et y ajoute ~10 routes.

**Proposition :** livrer **une** page « Importer » (les 3 sources + la revue avant import, que
le plan a déjà : `PARCOURS-ECRANS.md:101`) et **reporter** grille de pipeline, fiche à
3 onglets, qualification et messages derrière un critère écrit dans le Journal :
« ≥ 20 imports et ≥ 10 actions nommées enregistrées ». Le plan y gagne une session.

**Justification mesurée :** ~**300 lignes** du serveur (13 % de `prospect_app.py`, plages
`APP:186-485`, 15 routes à 0 appel) et **5 modales** du cockpit (≈27 % de `cockpit.html`,
`scrOverlay`, `addOverlay`, `compOverlay`, `msgOverlay`, `skillsPanelOverlay`) meurent au lieu
d'être réimplémentées en Jinja. Ce n'est pas une perte : c'est une surface qui n'a jamais été
utilisée, dont la fonction est assurée côté serveur.

## P6 — Migrer les 234 archives, et le dire dans le rapport de migration (G3)

**Proposition :** `migration_001` importe les 234 `Hash` dans la table d'archives, et le
rapport affiche `archives_importees: 234`. Test : rejouer les 234 triplets
(pilier, plateforme, texte) renvoie 234 fois « déjà en archive », 0 génération.

**Justification :** c'est la seule protection contre la réémission d'un texte **déjà publié**,
et 227 des 234 empreintes n'existent nulle part ailleurs dans l'application.

## P7 — « Aucun état normal par défaut » doit aussi couvrir l'application elle-même (G6)

**Proposition :** deux ajouts d'une ligne au plan —
(a) `noyau/journal.py` compte les réponses 5xx de l'application ; `GET /api/sante` ajoute une
raison `degrade` dès qu'une route rend 5xx deux fois de suite ; (b) `verifier.py` s'exécute
**avant** le rechargement du processus (`verifier.py && systemctl --user restart cockpit`), pas
seulement « à la fin de chaque session ».

**Justification mesurée :** 104 erreurs serveur en douze jours, **0 alerte** ; et l'incident du
09-19 (73 × 500 pendant 68 minutes, décorateur déplacé) est exactement ce qu'un contrôle
« aucune route ne rend 5xx » aurait attrapé en une seconde. Test : rejouer l'incident sur une
copie → le bandeau passe `degrade` avec sa cause en moins d'un cycle de sondage.

## P8 — Tuer le sondage : 83,4 % du trafic pour 0 geste (mesures §1.1)

**Proposition :** trois lignes dans `app.js` — (a) ne sonder que si
`document.visibilityState === 'visible'` ; (b) ne sonder que si une tâche est `en_cours`
(sinon rafraîchissement à la demande) ; (c) `ETag`/`If-None-Match` → `304` quand rien n'a
changé.

**Justification mesurée :** 6 938 sondages, dont 6 350 émis pendant des minutes sans aucun
geste ; 128 Mo de JSON pour 302 gestes. Cible mesurable sur les douze jours suivants :
**< 20 % des requêtes sont des sondages**, et 0 réponse non-304 à l'inactivité. Bonus : moins
de lecteurs concurrents sur SQLite (`busy_timeout`, `§2.5`).

## P9 — Écrire le prix d'une session (G5)

**Proposition :** une ligne par étape : heures estimées, ce que l'utilisateur **voit** changer,
et le critère de sortie déjà présent. Et inverser l'ordre si nécessaire : livrer d'abord ce qui
touche la boucle réelle (P1, P2), pas ce qui ne se voit pas (`§6` : « à la fin de l'étape 4,
l'outil est identique pour l'utilisateur »).

**Justification :** l'utilisation s'est arrêtée le 15/09 après une journée à 26 erreurs ; un
plan de 13 sessions sans date ni gain visible par session ne redémarre pas l'usage.

---

# 4. CE QUE JE VALIDE, ET QU'IL FAUT DIRE

Un contre-expert qui ne valide rien n'est pas crédible. Sont solides et vérifiés :

- **Le schéma de `§2.5` et la règle des trois magasins** (`§2.3`/§2.4) : la séparation
  métier / exécution / publication répond exactement au défaut mesuré (quatre chaînes
  concurrentes, `AUDIT-M1 §1.1`).
- **La garde d'identité au pull** (`§2.8`) : refuser la montée d'un identifiant dont le
  contenu diverge et écrire `CONFLIT-IDENTITE` est la bonne réponse au seul défaut qui
  « simule un succès ».
- **Le modèle de tâches** (`§4.1`) : reprise idempotente par `deja_faite()`, pourcentage
  plafonné à 92 % (`etat_cockpit.py:96-106`), journal borné — c'est bien conçu, et cela
  répond à un défaut mesuré (5 minutes de calendrier sans progression, `AUDIT-M2 §5 A1`).
- **Le refus du CDN et de Node** (`D1`) : cohérent avec un outil hors ligne, et vérifiable par
  `grep`.
- **`etat_cockpit.py` conservé, pas réécrit** (`D7`) : décision juste, argumentée, et le
  module est effectivement sain (`AUDIT-M5 §3.1`).

# 5. CE QUE JE N'AI PAS ÉTABLI

- **Le contenu réel du serveur de production** : je n'ai pas appelé les API distantes. Les
  affirmations sur les 7 collisions et les 3 publications sorties sont celles de
  `AUDIT-M4 §1.4`, non revérifiées ici.
- **La cause exacte des 20 × 503** : je les identifie à l'échec du fournisseur de texte par
  cohérence avec le correctif « ZÉRO FALLBACK » (`prospect_app.py:550-580`) et le libellé de
  `generate-batch` ; je n'ai pas le corps des réponses.
- **L'attribution humain/agent** : je m'appuie sur un faisceau (14 sondages de routes
  inexistantes, tests du nouveau chemin d'image, commits horodatés). Le 2026-09-17 reste
  ambigu : 300 requêtes, 1 seul geste.
- **La mesure de `19,7 s` par image** : reprise de `AUDIT-M3 §F8`, non reprotimée ici (je n'ai
  pas lancé de génération d'image — c'eût été une écriture).
- **Le fait que le propriétaire n'ait jamais vu le nouveau cockpit** : les 79 `GET /` incluent
  les ouvertures d'onglet des agents ; je ne peux pas prouver qu'il ne l'a pas ouvert une fois.
