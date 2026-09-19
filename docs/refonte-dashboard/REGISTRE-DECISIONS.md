# REGISTRE DES DÉCISIONS — refonte du dashboard ePerformance

**Objet.** Registre final des décisions D1 à D10 après les trois revues
indépendantes (`VALIDATION-CHATBOT.md`, `AVIS-NOYAU.md`, `CONTRE-EXPERTISE.md`)
et les corrections du superviseur (`SUPERVISION.md`). Il est la pièce de
référence : les documents de conception portent les corrections, ce registre
porte les **statuts**, les **conditions** et l'**ordre**.

**Date :** 2026-09-19.
**Corrections appliquées dans :** `ARCHITECTURE-SAAS.md` (errata en fin de
document), `SYSTEME-VISUEL-SAAS.md` (errata en fin de document).
**Aucun autre fichier modifié** — ni le toolkit, ni le noyau, ni le site.
Aucune valeur de secret n'est reproduite.

---

## 1. Verdicts des trois revues

| Revue | Verdict | Ce qui bloque |
|---|---|---|
| **VALIDATION-CHATBOT** (validateur final) | **VALIDÉ AVEC AJUSTEMENTS** | D4 inopérante ; la purge de `config_ia.json` casse le backend chatbot en silence ; trois valeurs documentaires fausses qui tombent dans l'étape 1 |
| **AVIS-NOYAU** | **FAVORABLE SOUS CONDITION** | 4 conditions bloquantes, 6 conflits de contrat, dont une valeur gelée qui diverge réellement (`--gold2` sombre) |
| **SUPERVISION** | **CONFORME AVEC RÉSERVES** | D4 : 2 défauts de conception (NC-1, NC-2) ; critère de sortie de l'étape 9 inatteignable (NC-3) |
| **CONTRE-EXPERTISE** | Contradiction, non-validation | 3 manques graves : format `PROS-%04d`, aucun retour arrière, archives non migrées ; priorité n° 1 de l'étape 1 fausse |

---

## 2. Décisions D1 à D10 — statut final

| # | Décision | Statut final | Condition ou motif |
|---|---|---|---|
| **D1** | Flask 3.1 + Jinja + htmx vendorisé + waitress + SQLite WAL, Python 3.12, zéro Node, zéro CDN | **VALIDÉE** | Aucune. Les quatre contraintes qui la commandent sont mesurées et vraies. La règle est interne au toolkit : elle ne s'étend pas au backend FastAPI du chatbot. |
| **D2** | Base de départ `cockpit.html` (les jetons et la couverture survivent, le rendu meurt) | **VALIDÉE SOUS CONDITION** | (a) `templates_dashboard/` est un **emprunt structurel**, pas une filiation : sa charte indigo (`--primary:#6366f1` sur `#0f172a`, `fonts.googleapis.com`) est incompatible avec les jetons N1. (b) La suppression de `agent-ia-web/**` (étape 9) est **hors périmètre SITE** : `⚠️ DEMANDE` au journal + **accord écrit du NOYAU**. |
| **D3** | Trois magasins, trois cycles de vie (métier SQLite, exécution JSON, publication serveur) | **VALIDÉE** | Aucune. Le serveur LWS reste souverain pour les publications. |
| **D4** | `PUB-%04d` immuable, séquence persistante monotone, jamais réattribué, tombstone | **REFUSÉE PUIS REFORMULÉE** | Rédaction initiale **inopérante** : séquence amorcée à `0` ⇒ `allouer()` rend `PUB-0001` ; `SELECT` sans `ORDER BY` ⇒ chaque ligne reçoit son propre identifiant ; `publication_cache_serveur` vide (alimenté à l'étape 5) ⇒ `continue` ⇒ **0 réparation, 0 événement, silence**. La décision est **conservée dans son intention** et réécrite : amorçage à `max(local, serveur, tombstones) + 1`, `ORDER BY id`, **refus d'exécuter** sur cache vide (`MIGRATION-BLOQUEE`), rapport à trois compteurs qui **échoue sur l'écart**, pull synchrone explicite avant migration. |
| **D5** | Un seul objet publication, propriétaire par champ, provenance affichée, machine à états à cinq valeurs | **VALIDÉE SOUS CONDITION** | La **table de correspondance** avec les statuts du serveur (`programmee`/`publie`/`echec`/`erreur`, souverain, non modifié) doit être **écrite avant l'étape 5**, avec les **deux** cas d'erreur (`echouee` ↔ `echec` **et** `erreur`). Sans elle, deux systèmes se parlent sans dictionnaire au point exact de la publication. |
| **D6** | Toute opération de plus de 2 s est une tâche serveur nommée, suivie, annulable, reprenable, purgée | **VALIDÉE** | Aucune. La purge à trois durées et la reprise après plantage s'appuient sur `etat_cockpit.py` conservé (D7). |
| **D7** | `etat_cockpit.py` gardé et complété, pas réécrit | **VALIDÉE** | Aucune. `COCKPIT_ETAT` garde son nom. |
| **D8** | Un fichier de secrets `~/.config/eperformance/secrets.env` (`0600`, hors dépôt), l'interface ne reçoit que des métadonnées | **VALIDÉE SOUS CONDITION** | **Bloquante sur un point : la purge de `config_ia.json` casse le backend chatbot.** Conditions : (1) inverser l'ordre de résolution dans `unified-ia-backend/backend/core/llm_client.py` **dans les deux copies** (contrat C12) — environnement/secrets d'abord, fichier en dernier recours, un fichier présent mais vide ne court-circuite plus l'environnement — **ou** re-séquencer la purge après ; (2) `agent-ia-web/.env` est un fichier du **NOYAU** : `⚠️ DEMANDE` au journal ; (3) la **rotation** des clés exposées (`config_api.json`, `config_ia.json`, historique git conservé) doit être nommée dans le plan. |
| **D9** | Aucun état normal par défaut ; la santé est calculée et affichée avec ses raisons | **VALIDÉE** | Deux réserves, aucune ne la remet en cause : (a) elle répare l'**affichage**, pas la **cause** — la création du modèle Meta `j0_diagnostic` n'est portée par aucune étape, une action non-code doit être nommée et un porteur désigné ; (b) la formulation « aucune des 11 routes `/api/etat/*` n'a jamais été appelée » est réfutée par la mesure (2 routes exercées en lecture, 0 en écriture, 0 client d'interface, aucune persistance créée) : à réécrire. |
| **D10** | Une seule chaîne visuelle (`social_templates/`), une seule chaîne de contrôle éditorial, branchée sur un bouton | **VALIDÉE SOUS CONDITION** | (a) Le point de jonction est `chatbot-index.json` : **lecture seule**, jamais écrit, jamais modifié de schéma. (b) Le motif « plafond à 8 sujets alors que 81 existent » est **inexact** : 8 = le nombre d'articles `published:true` ; ce qui doit être branché est la **fraîcheur** (`genere_le`), pas un contournement du filtre. (c) Le **contrôle par slide** et **l'affichage du score** sont exigés : `grep -c "manques" cockpit.html` → 0, le score est calculé et jeté. |

**Synthèse : 6 VALIDÉES · 3 VALIDÉES SOUS CONDITION · 0 REFUSÉE en l'état · 1 REFUSÉE PUIS REFORMULÉE (D4).**

---

## 3. Conditions par étape

Sept conditions consolidées, chacune vérifiable. Aucune n'exige d'arrêter la
refonte ; toutes exigent d'être **écrites avant** l'étape qu'elles conditionnent.

| Avant | Condition | Critère de réussite | Source |
|---|---|---|---|
| **l'étape 1** | `--gold2:#e2c07a` ; **douze** jetons N1 énumérés ; **12** `.woff2` (Outfit 400/700/900) | `grep -c "cfb583"` dans les trois documents de conception → 0 hors justification du thème clair ; `grep -c "14 .woff2"` → 0 ; `C4` échoue sur un fichier **nommé** manquant | `SUPERVISION` corr. 4 et 11 ; `VALIDATION-CHATBOT §A3` |
| **l'étape 1** | Le vocabulaire des jetons (`--police-*`, `--t0`…`--t8`) est **arbitré par le NOYAU** par une entrée `⚠️ CONTRAT` | 0 renommage décidé par le SITE ; les 59 noms d'`eperf.css` restent un sur-ensemble, pas un dialecte | `AVIS-NOYAU §4.1` ; `VALIDATION-CHATBOT §A5` |
| **l'étape 2** | Les **corrections 1 à 3** du superviseur sont intégrées à `migration_002()` | sur la fixture réelle (7 lignes locales, 49 serveur), les 7 lignes reçoivent un identifiant **≥ `PUB-0050`**, aucun `UPDATE` ne touche une clé primaire existante ; serveur injoignable ⇒ étape en rouge **avec sa raison**, jamais un vert à zéro | `SUPERVISION §7` ; `VALIDATION-CHATBOT §A2` |
| **l'étape 4** | Ordre de résolution inversé dans les **deux** copies de `llm_client.py`, mesure de contrôle passée | `md5sum` des deux copies identique ; `LLMClient().deepseek_key` non vide **avec** `config_ia.json` purgé | `VALIDATION-CHATBOT §5.4`, §7 point 4 |
| **l'étape 5** | La table de correspondance des statuts est **écrite**, avec les **deux** cas d'erreur | `publiee` ↔ `publie` ; `echouee` ↔ `echec` **et** `erreur` ; aucune question reçoit de réponse improvisée en session | `VALIDATION-CHATBOT §D5` ; `SUPERVISION §7 point 10` |
| **l'étape 8** | `services/blog.py` écrit **sans** le champ `published` (il n'existe pas dans l'index) | le contrôle de fraîcheur porte sur `genere_le` et sur la comparaison page/index ; il annonce « index périmé : 2 entrées sur 8 » sur les fichiers du 19/09, et 0 après régénération | `VALIDATION-CHATBOT §A4` |
| **l'étape 9** | Accord écrit du **NOYAU** pour toute suppression dans `agent-ia-web/**` ; décision écrite sur les trois modules orphelins | entrée `⚠️ DEMANDE` au journal ; une phrase de décision par module, avant l'étape | `VALIDATION-CHATBOT §7 point 9` ; `AVIS-NOYAU §6.1` ; §2.3 de l'architecture |

### Conditions du NOYAU (les 4 bloquantes, reprises telles quelles)

1. **Désigner la source et l'écrire** : les 12 jetons N1 viennent de
   `agent-ia-web/eperf_core/assets/css/` + `jetons.py` ; le contrôle compare une
   **empreinte de paires résolues** (jamais un `md5`) et **échoue si la source
   est injoignable**.
2. **Arbitrer `--gold2` sombre avant la première copie** : le noyau passe à
   `#e2c07a` (`10-primitives.css:90`) par entrée `⚠️ CONTRAT` — sinon la copie
   grave une cinquième position divergente.
3. **Ne rien retirer de la cascade avant d'avoir repris les quatre modules**
   (`auditeur.py:41`, `onboarding.py:71`,
   `blog_engine/generate_articles.py:69`, `onboard_legacy.py:71`), et **ne pas
   migrer `.env` vers `secrets.env` sans que le noyau lise le nouveau chemin**
   (`utils.charger_env()` ne lit qu'un seul chemin aujourd'hui).
4. **Décider le sort des trois modules orphelins** (`personas.py`,
   `narrative_engine.py`, `meta_agent.py`) — une phrase dans la décision, pas une
   découverte. Recommandation du NOYAU : garder `narrative_engine` avec un
   consommateur nommé, retirer les deux autres.

### Point de contrôle à ajouter à l'étape 6

La santé de D9 est une santé **métier** (quatre conditions). Elle n'a pas vu
**104 réponses 5xx en douze jours**, dont **73 × `500 GET /api/state` pendant
68 minutes le 19/09** (décorateur déplacé entre une route et sa fonction). Un
compteur de 5xx par route et un `verifier.py` exécuté **avant** le rechargement
du processus répondent à ce défaut de **conception du contrôle**
(`CONTRE-EXPERTISE §G6`, `§P7`).

---

## 4. Les six conflits de contrat du NOYAU

| # | Conflit | Ce que le NOYAU a tranché |
|---|---|---|
| **1** | **N1 (noyau) contre C3 (site)** — deux propriétaires pour le même objet : `COORDINATION-AGENTS-NOYAU.md:44` gèle les noms et valeurs dans `eperf_core/`, `site-eperformance/COORDINATION-AGENTS.md:51` gèle les noms dans `eperf.css` | **Le noyau est la source ; `eperf.css` est un dérivé qui ne se génère pas aujourd'hui.** Un dérivé non généré est une copie, et une copie dérive : elle a dérivé sur `--gold2` sombre, sur l'écriture de `--erreur` clair, et `mockups/` en est une troisième, périmée. Conséquence pratique : le site garde la main sur **son fichier** (C3 reste vrai), le noyau garde la main sur **les valeurs** (N1), et le contrôle de la refonte cite le noyau. |
| **2** | **N1 — le nombre de jetons gelés diffère selon le document** : 6 (`ARCHITECTURE`), 10 (`SUPERVISION`), 12 (`SYSTEME-VISUEL`) | **C'est 12.** Les douze noms sont exactement ceux que le résolveur rend sans trou (`--bg2` et `--card2` se résolvent comme les dix autres). Le contrôle refuse une redéfinition de **ces douze**, pas de six. Corrigé dans `ARCHITECTURE-SAAS.md §0.1`. |
| **3** | **N7 — le validateur WCAG du noyau ne peut pas lire le CSS de la refonte** : `eperf_core/jetons.py:32` fixe `DOSSIER_CSS` sans paramètre | Tâche du **NOYAU**, prise par lui : exposer `DOSSIER_CSS` en paramètre de `charger_noyau()`/`theme_effectif()` (une signature à élargir, trois appelants à vérifier). Sans cela la refonte écrirait un **second** mesureur de contraste, et deux mesureurs finissent par ne plus être d'accord. |
| **4** | **N6 — la migration de `.env` vers `secrets.env` rompt le noyau en silence** : `ai_client_v2.py` lit l'environnement, 88 lectures d'`os.environ` sur ~22 fichiers, et seul `utils.charger_env()` (`utils.py:58-85`) le peuple — depuis **un seul chemin**, `<racine du dépôt>/.env` | **Condition** : `~/.config/eperformance/secrets.env` doit être lu par le noyau (`charger_env()` accepte une liste de chemins, ou un `noyau/secrets.py` exporte à l'import), **et** un contrôle du noyau doit échouer si une variable attendue est absente après chargement. Un contrôle côté dashboard ne suffit pas : il ne voit pas le noyau. |
| **5** | **N5 / C-2 — la refonte ne doit pas réarmer la collision de chemin** : `illustrations/` SVG dans `statique/`, écran `apparence`, et `assets/js/chatbot.js` | **Aucun conflit — vérifié plutôt que supposé** : `scripts/verifier-noyau.py` contrôle toujours « un seul écrivain » sur ce chemin (12 contrôles conformes). Le seul risque serait qu'une génération locale recopie une racine `assets/` entière : ce n'est prévu nulle part. |
| **6** | **Contradiction interne de l'`ARCHITECTURE` sur `--gold2`** : « reste au canon du noyau » ⇒ `#cfb583`, contre `#e2c07a` en `SYSTEME-VISUEL` | Confirmée **et complétée** : l'affirmation est fausse dans les deux sens — le « canon du noyau » n'est pas opposable ici, puisque c'est la valeur que **cinq emplacements sur six ont déjà cessé de suivre**. La réécriture de la phrase ne suffisait pas : il fallait **corriger le noyau** (proposition P1 du NOYAU). |

---

## 5. Ordre d'exécution consolidé

**Règle inchangée :** l'application tourne en permanence ; aucune session ne
laisse l'outil inutilisable ; on ne ferme pas une étape sur un rouge.

### 5.1 Avant la première session (conditions, hors code)

1. Les trois valeurs de l'étape 1 (`--gold2`, douze jetons, 12 polices) et le
   vocabulaire soumis au NOYAU — **§3, lignes 1 et 2**.
2. Les corrections 1 à 3 de la migration écrites dans le document — **fait**.
3. La décision sur les trois modules orphelins demandée au NOYAU — **demandée**.

### 5.2 Les neuf étapes, telles qu'amendées

| Étape | Sessions | Amendements dans cette consolidation |
|---|---|---|
| **1 — Socle et service** | 1 | 12 `.woff2` (et non 14) ; `--gold2:#e2c07a` ; `C2` compare les 12 paires résolues ; les 404 de police sont **une régression du commit `8389309`**, pas un défaut subi |
| **2 — Magasins, identifiants, migration** | 2 | **Pull serveur synchrone d'abord** (la migration ne tourne pas sans lui) ; `migration_001` importe les **234 entrées / 227 empreintes** d'archive ; `migration_002` avec séquence amorcée au-dessus du parc, `ORDER BY id`, refus sur cache vide, rapport à trois compteurs |
| **3 — Tâches longues** | 1 | inchangé |
| **4 — Secrets** | 1 | **Prérequis** : ordre de résolution inversé dans les **deux** copies de `llm_client.py`, mesure de contrôle passée |
| **5 — Objet publication unique** | 2 | Table de correspondance des statuts **écrite**, avec `echec` **et** `erreur` |
| **6 — Santé, événements, alerte** | 1 | Ajouter le compteur de 5xx par route et le `verifier.py` **avant** rechargement |
| **7 — Les cinq destinations** | 3 | **La première destination livrée est l'atelier** (lot → images → jugement → score), pas `#/acquerir` |
| **8 — Chaînes uniques et blog** | 1 | Le **contrôle par slide** et **l'affichage du score** (`manques`) sont dans cette étape et sont prioritaires ; `services/blog.py` sans `published` |
| **9 — Mise en service** | 1 | Suppressions dans `agent-ia-web/**` = **accord écrit du NOYAU** ; sort des trois modules orphelins décidé |

**Ce que l'usage réel change dans cet ordre (`ARCHITECTURE-SAAS.md §6.2`) :**

1. **Le réessai automatique sur échec fournisseur devient prioritaire** —
   3 tentatives, 2 s / 8 s / 30 s sur erreur transitoire, événement `REPRISE`,
   puis `echouee` avec sa raison et une action « Reprendre les échecs ». La cause
   de l'abandon est mesurée : **27 des 53 lancements de lot (51 %) en échec**,
   dont 26 le 10/09.
2. **La boucle de contrôle visuel devient prioritaire** — le geste le plus
   fréquent du produit est « génère l'image » (**138 des 302 gestes, 46 %**),
   fait une par une, puis suivi de 18 `delete-all`. Le contrôle existe, il est
   calculé et **jeté** (`grep -c "manques" cockpit.html` → 0).
3. **L'acquisition est à réduire, pas à refondre** — **15 routes, 0 appel en
   douze jours** ; livrer une page « Importer » et reporter le pipeline derrière
   un critère écrit : « ≥ 20 imports et ≥ 10 actions nommées enregistrées ».

**Les fondations ne bougent pas.** Les étapes 1 à 4 restent les quatre sessions
au plus haut rendement, et la réparation de D4 reste la première chose exécutée :
c'est l'étape dont la sortie était inatteignable, et une étape 2 fermée en rouge
bloquerait les huit suivantes.

---

## 6. Ce que ce registre ne tranche pas

- **La rotation des clés exposées** est nommée comme partie de l'étape 4, mais
  son exécution dépend de l'accès aux consoles des fournisseurs : décision et
  calendrier au propriétaire.
- **Le sort des trois modules orphelins**, **la validation du modèle Meta
  `j0_diagnostic`**, **le devenir de n8n** et **la file hors ligne du serveur
  LWS** sont des décisions ouvertes, nommées et attribuées, pas des oublis.
- **Le dépôt du toolkit n'est pas figé** : tout `fichier:ligne` cité par les
  audits est daté, et doit être re-mesuré au moment de l'étape qui le touche.

---

*Registre produit le 19 septembre 2026 après consolidation de trois revues
indépendantes et d'un rapport de supervision. Écriture limitée à
`docs/refonte-dashboard/` et au journal de coordination. Aucun `git add`,
`commit`, `checkout`. Aucune route modificatrice appelée. Aucune valeur de secret
reproduite.*
