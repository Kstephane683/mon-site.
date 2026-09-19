# AUDIT M2 — PRODUCTION DE TEXTE

**Module** : contenu éditorial généré par IA (le « texte » des publications)
**Périmètre audité** : `/home/ballo/OX6A/toolkit_eperformance/`
**Date** : 19/09/2026
**Méthode** : lecture de code, croisement des `.md` avec les mappings réels, comptage sur `publications.csv` (7 lignes) et `publications_archive.csv` (234 lignes), appels aux routes **en lecture seule** uniquement.

---

## 0. Comment lire ce document

Trois niveaux de preuve sont utilisés, toujours distingués :

| Marqueur | Signification |
|---|---|
| `fichier:ligne` | Constat établi par lecture directe du code |
| `[mesure]` | Constat établi par une commande exécutée, sortie reproduisible |
| `[non établi]` | Je n'ai pas pu prouver — je ne le devine pas |

**Toutes les routes qui génèrent du contenu ont été évitées** (coût + durée). Aucun CSV n'a été écrit. Les seules routes appelées sont `/api/agents`, `/api/ia-config`, `/api/publications/stats`, `/api/config/llm-status`, `/api/social/articles`, `/api/system-check`.

---

## 1. La chaîne de génération, de bout en bout

### 1.1 Vue d'ensemble

```
cockpit.html (navigateur)
  └─ fetch POST /api/publications/generate-batch          [prospect_app.py:550]
       └─ ce.generate_content(pilier, plateforme, use_llm=provider)
                                                          [content_engine.py:1284]
            ├─ _llm_available("deepseek")                 [content_engine.py:1492]
            └─ _generate_with_llm_strict(...)             [content_engine.py:1357]
                 └─ _generate_with_llm(...)  @rate_limited [content_engine.py:1497]
                      └─ _generate_with_openai_compat(...)  [content_engine.py:1582]
                           ├─ _build_skill_guidance(pilier, plateforme) [content_engine.py:595]
                           ├─ agents_engine.build_agent_enhanced_prompt(...)
                           │                              [content_engine.py:1605 → agents_engine.py:189]
                           │    └─ get_agent_for_pilier_platform() + get_agent_persona()
                           │                              [agents_engine.py:145, 109]
                           ├─ HTTPS POST api.deepseek.com/v1/chat/completions
                           │                              [content_engine.py:1621-1646]
                           ├─ _parse_llm_json()           [content_engine.py:1692]
                           └─ _build_hashtags(plateforme) [content_engine.py:1150]
            └─ is_in_archive() → boucle max_attempts=5    [content_engine.py:1339-1352]
            └─ add_to_archive()                           [content_engine.py:1344]
       └─ _genere_par_with_agent(content)                 [prospect_app.py:466]
       └─ ce.save_publications_csv(pubs, "publications.csv")  [prospect_app.py:612]
```

### 1.2 Modèle LLM

| Élément | Valeur | Preuve |
|---|---|---|
| Fournisseur unique | `deepseek` | `config_ia.json:2` — `"provider": "deepseek"` |
| Modèle demandé | `deepseek-flash` | `config_ia.json:6` |
| Modèle servi (mesuré) | `deepseek-flash` | `docs/lot-temoin-apres/deepseek-flash.json` → `"modele_servi": "deepseek-flash"` |
| Endpoint | `https://api.deepseek.com/v1/chat/completions` | `content_engine.py:1593` |
| Clé API | en clair dans `config_ia.json:4` et `config_api.json:6` | `config_ia.json:4`, `config_api.json:6` |
| Température / top_p | `0.95` / `0.9` | `content_engine.py:1625-1626` |
| Pénalités | `frequency_penalty 0.5`, `presence_penalty 0.5` | `content_engine.py:1627-1628` |
| Format de sortie | `response_format: json_object` | `content_engine.py:1624` |
| Timeout | 60 s | `content_engine.py:1643` |
| Rate limiter | 12 appels/min, **burst 0 → 5 s entre CHAQUE appel** | `content_engine.py:166` |
| Retries LLM | 3 tentatives, backoff 2 s puis 5 s | `content_engine.py:1357, 1368` |
| Boucle anti-doublon | 5 tentatives | `content_engine.py:1284` (`max_attempts=5`) |

**Le rate limiter est un héritage mort.** Le commentaire l'assume : `content_engine.py:118-119` — *« La limite d'origine venait de la passerelle Claude (~50 requêtes/minute), retirée le 18/09/2026. Le délai est CONSERVÉ tel quel : il n'a pas été recalibré sur DeepSeek »*, et `content_engine.py:164-165` — *« Hérité de la limite de groupe de la passerelle Claude, qui n'est plus là »*.

### 1.3 Prompts réellement envoyés

Il y a **deux** constructeurs de prompt, mais **un seul est vivant**.

| Constructeur | Ligne | Statut |
|---|---|---|
| `agents_engine.build_agent_enhanced_prompt()` | `agents_engine.py:189-321` | **Vivant** — appelé `content_engine.py:1605` et `1739` |
| `content_engine._build_llm_prompt()` | `content_engine.py:1508-1581` | **Repli quasi-mort** — exécuté seulement si `agents_engine` lève une exception ou renvoie `None` (`content_engine.py:1617-1618`). Or `build_agent_enhanced_prompt` ne renvoie `None` que si le `.md` du persona est introuvable (`agents_engine.py:213-214`). En l'état, le persona est toujours trouvé. |

Le prompt vivant est composé de **8 blocs** (`agents_engine.py:259-319`) :

1. **Identité d'agent** — `agent['name']` + `agent['emoji']` + `agent['description']` (`agents_engine.py:259-261`)
2. **Persona complet** — les **2 500 premiers caractères** du `.md` (`agents_engine.py:264`, `142`)
3. **Contexte varié** : angle pilier, type de hook, format, longueur cible, nb de hashtags (`agents_engine.py:272-278`)
4. **Structure éditoriale imposée** tirée parmi **12** (`agents_engine.py:280-282`, `_pick_structure` `content_engine.py:506`)
5. **Consigne de skills** — framework de persuasion + biais + modèle d'offre (`agents_engine.py:283`)
6. **Cas client du jour** tiré parmi **36** (`agents_engine.py:289-291`, pool `content_engine.py:186-406`)
7. **Services et prix** — site 75k, formation 50-100k, accompagnement 150-550k, ebook 3k (`agents_engine.py:296-298`)
8. **Contraintes anti-répétition** — 6 cas clients interdits, interdiction d'ouvrir sur « Il y a 16 mois » ou « 87% des entrepreneurs » (`agents_engine.py:300-309`)

Puis un `system` séparé : `content_engine.py:1622` — *« Tu incarnes un agent spécialisé et tu appliques rigoureusement le framework de persuasion et le biais cognitif fournis. »*

**Instruction contradictoire dans le prompt** : `agents_engine.py:316` demande *« Termine par les hashtags sur une ligne séparée »* **et** `agents_engine.py:278` impose *« {n} hashtags max »*. Le code rajoute ensuite **son propre bloc** de hashtags (voir §4.2).

### 1.4 Personas mobilisés par la génération

La sélection est déterministe à partir du couple (pilier, plateforme) (`agents_engine.py:145-162`), par ordre de priorité : format → pilier → plateforme.

- Format : `FORMAT_AGENTS` (`agents_engine.py:78-83`)
- Pilier : `PILIER_AGENTS` (`agents_engine.py:51-75`)
- Plateforme : `PLATFORM_AGENTS` (`agents_engine.py:39-44`)

**Le format n'est jamais transmis.** `content_engine.py:1605` et `1739` appellent `build_agent_enhanced_prompt(pillar, platform, topic, skill_guidance=guidance)` : le paramètre `fmt` reste à `None` (`agents_engine.py:189`). Conséquence mesurable : la publication `PUB-0001` a pour format `carousel-3` et a été confiée à ✍️ Content Creator au lieu de 🎠 Carousel Growth Engine (`publications.csv`, colonne `Genere_Par` ; mapping `agents_engine.py:79`).

### 1.5 Skills injectés dans chaque publication

`_build_skill_guidance(pillar, platform)` (`content_engine.py:595-655`) produit trois éléments :

| Élément | Source | Tirage |
|---|---|---|
| Framework de persuasion | `SKILL_FRAMEWORKS` **codé en dur** dans `content_engine.py:553-564` (8 frameworks) | 1 sur 8, les 3 derniers exclus (`_RECENT_FRAMEWORKS`, `content_engine.py:593`) |
| Biais cognitif | `skills_engine.PSYCHOLOGY_BIAS` (7 biais) | via `_PILIER_BIAS`, `content_engine.py:566-591` |
| Modèle d'offre + prix | `skills_engine.OFFER_TEMPLATES` (5) + `PSYCHOLOGICAL_PRICING` (5) | **uniquement** si `pillar in ["services", "formation"]` (`content_engine.py:643`) |

Le libellé `SKILL_FRAMEWORKS` **n'est pas lu depuis `skills_engine`** — c'est une copie manuelle. Vérifié : `[mesure]` `grep "SKILL_FRAMEWORKS" skills_engine.py` → 0 occurrence.

### 1.6 Nombre d'appels LLM par publication

| Cas | Appels HTTP |
|---|---|
| Nominal | **1** |
| Si le texte est déjà dans l'archive → nouvel essai complet | ×2, ×3, ×4, ×5 (`content_engine.py:1339-1352`) |
| Si l'appel échoue (429, timeout, JSON illisible) | ×3 par essai (`content_engine.py:1357`) |
| **Pire cas** | **5 × 3 = 15 appels pour une seule publication** |

Mesures disponibles :

- Lot témoin `docs/lot-temoin-apres/deepseek-flash.json` : 10 publications, **87,6 s**, **3 196 tokens/publication** en moyenne, 1 appel chacune (durées de 6,8 à 11,6 s).
- `publications.csv` (7 lignes, 19/09/2026) : horodatages `00:32:24 → 00:33:02` = **38 s pour 7 publications**, soit ≈ 5,4 s chacune — cohérent avec les 5 s du rate limiter + la latence du modèle.

**Coût du rate limiter mesuré** : sur 49 publications (calendrier hebdo), 5 s × 49 = **4 min 05 s d'attente pure**, sans compter le modèle.

### 1.7 Écriture dans le CSV

`save_publications_csv` (`content_engine.py:1886`) réécrit **l'intégralité** du fichier (20 colonnes, `CSV_HEADERS` `content_engine.py:1873-1877`).

- `/api/publications/generate` : 1 publication → 1 réécriture complète (`prospect_app.py:546-548`)
- `/api/publications/generate-batch` : N publications → **1 seule** réécriture en fin de lot (`prospect_app.py:612`) — sauf en cas d'erreur, où le partiel est sauvé (`prospect_app.py:604`)
- `/api/publications/weekly-calendar` : **49 publications → 1 réécriture** en fin de parcours (`prospect_app.py:633`)

**Sur erreur LLM, aucune ligne n'est écrite.** `prospect_app.py:538-540` renvoie un 503 et sort. Or la docstring de `generate_content` promet le contraire : `content_engine.py:1296` — *« remontée à l'UI + colonne Erreur du CSV »*. **La colonne `Erreur` n'est jamais renseignée pour un échec de texte** ; elle ne l'est que pour les images (`prospect_app.py:673`, `2116`).

### 1.8 Archive anti-répétition

- Empreinte = **les 200 premiers caractères** du texte, minusculisés (`content_engine.py:1916` — `normalized = " ".join(text.lower().split())[:200]`)
- Clé = `md5(pilier|plateforme|200 premiers caractères)` (`content_engine.py:1918`)
- Deux publications qui **commencent** pareil mais divergent ensuite sont déclarées identiques ; deux publications qui disent **la même chose autrement** ne le sont pas.
- L'archive comptait **234 entrées** au 19/09/2026, du 10/09 au 19/09 `[mesure]`.
- Le fichier est relu intégralement à chaque test (`is_in_archive`, `content_engine.py:1937-1941`) puis relu **et réécrit** à chaque ajout (`add_to_archive`, `content_engine.py:1943-1959`), soit **2 lectures complètes + 1 écriture** par publication.

---

## 2. Catalogue des personas et des skills

### 2.1 Personas — l'état réel

**29 fichiers `.md`** existent sur disque `[mesure]` (`find agents -name "*.md" | wc -l` → 29), répartis en 5 dossiers : `design/` (3), `marketing/` (14), `product/` (1), `research/` (2), `sales/` (9).

| Indicateur | Valeur | Preuve |
|---|---|---|
| Personas sur disque | **29** | `agents/**/*.md` |
| Personas cités dans `agents_engine` (toutes tables confondues) | **17** | union de `PLATFORM_AGENTS` + `PILIER_AGENTS` + `FORMAT_AGENTS` + `IMAGE_AGENTS` + `VEILLE_AGENTS` |
| **Personas effectivement sélectionnables pour du texte** | **12** | `PILIER_AGENTS` (11 valeurs non nulles distinctes) ∪ `PLATFORM_AGENTS` (1 nouvelle) |
| Personas ayant **réellement** servi, sur 234 générations archivées | **12** | `publications_archive.csv`, colonne `Genere_Par` `[mesure]` |
| **Personas jamais sélectionnés** | **17** | 29 − 12 |

**Les 12 personas réellement atteignables** (et effectivement utilisés) :

```
marketing-seo-specialist          🔍 SEO Specialist                      42 générations
marketing-content-creator         ✍️ Content Creator                     40
sales-outbound-strategist         🎯 Outbound Strategist                 38
marketing-instagram-curator       📸 Instagram Curator                   34
product-trend-researcher          🔭 Trend Researcher                    22
research-deep-agent               🔬 Deep Research Agent                 13
marketing-linkedin-content-creator💼 LinkedIn Content Creator             11
research-synthesist               🔍 Research Synthesist                  9
marketing-email-strategist        📧 Email Marketing Strategist           9
marketing-growth-hacker           🚀 Growth Hacker                        8
sales-discovery-coach             🔍 Discovery Coach                      5
sales-offer-lead-gen-strategist   🧲 Offer & Lead Gen Strategist          3
```

**Les 17 personas jamais sélectionnés**, classés par cause :

**(a) 11 orphelins purs** — zéro occurrence dans **n'importe quel** fichier `.py` du toolkit `[mesure]` :
```
marketing-multi-platform-publisher
marketing-pr-communications-manager
marketing-reddit-community-builder
marketing-twitter-engager
marketing-video-optimization-specialist
sales-account-strategist
sales-coach
sales-deal-strategist
sales-engineer
sales-pipeline-analyst
sales-proposal-strategist
```
→ **C'est ce que l'audit antérieur appelait « 11 personas inatteignables ». Le chiffre est exact, mais la formulation est trop flatteuse** : le vrai trou est de **17**, pas de 11.

**(b) 2 personas mappés sur un paramètre jamais passé** — `marketing-carousel-growth-engine` (`agents_engine.py:79`) et `marketing-short-video-editing-coach` (`agents_engine.py:80-82`) sont dans `FORMAT_AGENTS`, or `fmt` n'est jamais transmis (§1.4). **Mapping mort.**

**(c) 3 personas `design-*`** déclarés dans `IMAGE_AGENTS` (`agents_engine.py:86-90`) mais `get_image_agents()` (`agents_engine.py:164-166`) **n'est appelée nulle part** `[mesure]`. Ils ne servent que via `design_pipeline.py:101-122` (chaîne image, hors périmètre M2).

**(d) 1 persona utilisé seulement par la chaîne image** — `marketing-social-media-strategist`, référencé uniquement dans `design_pipeline.py:106-108`.

**Correction à apporter à la documentation** : le docstring `agents_engine.py:4` annonce « **17 agents spécialisés** » et le selfcheck affiche « 29 personas · 15 piliers routés » (`content_engine.py:2526-2527`). Aucun des deux ne dit combien sont **atteignables**. L'écran `/api/agents` (`prospect_app.py:944-962`) liste **les 29 sans distinction** : rien ne permet à l'utilisateur de savoir que 17 d'entre eux ne seront jamais choisis.

### 2.2 Skills — l'état réel

**Le chiffre « 36 skills » est faux et se propage dans 6 fichiers.**

L'origine est documentée : `PATCH_NOTES.md:143` — *« **36 fichiers skills .md vs 5 implémentés** dans `skills_engine.py` (12 documentés dans le README) : inventaire à harmoniser. »* Le « 36 » désigne les fichiers `.md` du dépôt externe `coreyhaines31/marketingskills`, **qui ne sont pas livrés avec le toolkit**.

Sans correction, le chiffre est repris comme un acquis :
```
content_pipeline_v2.py:27   « marketingskills (36 skills) »
content_engine.py:2511      print("🧠 skills_engine (36 skills) :")
docs/AUDIT-BRUT-FINDINGS.md:151, 997
docs/audit-toolkit-social.md:38, 60, 130
```

**Ce qui existe réellement** :

- **0 fichier `SKILL.md`** dans le toolkit `[mesure]` — `find . -name "SKILL.md"` ne renvoie que des fichiers dans `eperformance-widget/node_modules/`.
- **5 fonctions publiques** dans `skills_engine.py`, **toutes atteignables** :

| Fonction | Ligne | Route qui l'expose |
|---|---|---|
| `qualify_prospect` | `skills_engine.py:59` | `POST /api/qualify` (`prospect_app.py:382`) |
| `generate_msg_variants` | `skills_engine.py:148` | `POST /api/generate-msg` (`prospect_app.py:394`) |
| `analyze_competitor` | `skills_engine.py:306` | `POST /api/analyze-competitor` (`prospect_app.py:423`) |
| `optimize_with_psychology` | `skills_engine.py:437` | `POST /api/optimize-msg` (`prospect_app.py:413`) |
| `get_offer_recommendations` | `skills_engine.py:533` | `GET /api/offer-pricing` (`prospect_app.py:434`) |

  **Aucune de ces 5 fonctions ne produit de publication.** Elles servent la prospection WhatsApp et l'analyse concurrentielle — pas la production de texte.

- **3 structures de données** de `skills_engine` sont consommées par la génération de texte :
  `PSYCHOLOGY_BIAS` (7 biais, `skills_engine.py:392`), `OFFER_TEMPLATES` (5, `:492`), `PSYCHOLOGICAL_PRICING` (5, `:525`).

- **`score_offer` n'existe pas.** Le docstring `skills_engine.py:17` annonce `score_offer()` comme l'une des 5 compétences actives : `[mesure]` `grep "def score_offer"` → **0 occurrence**. C'est `get_offer_recommendations` qui existe.

- Les **8 frameworks de persuasion** utilisés dans chaque prompt (`content_engine.py:553-564`) **ne viennent pas de `skills_engine`** : c'est une recopie en dur.

### 2.3 Deux anomalies de câblage des biais

| Anomalie | Preuve |
|---|---|
| `_PILIER_BIAS` contient une clé **`promotion`** qui ne correspond à **aucun pilier** (le pilier a été renommé `services` en v7) | `content_engine.py:571` vs `content_engine.py:751+` `[mesure]` |
| Le pilier **`services`** n'a **aucun biais dédié** → repli sur les 7 biais au hasard | `[mesure]` `piliers_sans_biais == ['services']` |

Neutralité à noter : **tous** les couples (pilier, biais) pointent vers un biais existant — `[mesure]` la liste des couples invalides est vide.

---

## 3. Qualité du contenu produit

### 3.1 Corpus lu

| Source | N | Nature |
|---|---|---|
| `publications.csv` | **7** | Le lot en file d'attente, généré le 19/09/2026 à 00:32 |
| `docs/lot-temoin-apres/deepseek-flash.json` | **10** | Lot témoin du 18/09/2026, 5 piliers × 2 plateformes, **lu intégralement** |
| `publications_archive.csv` | **234** | Extraits (100 premiers caractères) |

J'ai lu **les 17 textes complets**. Jugement ci-dessous.

### 3.2 Ce qui marche

Le texte est **propre, lisible, sans faute**, et le modèle suit réellement les consignes structurelles. Deux exemples qui tiennent :

> **`cas-client/linkedin` (lot témoin, 1 193 car.)** — découpage `Acte 1 — Avant` / `Acte 2 — Le mur` / `Acte 3 — Le système` respecté, et surtout cette ligne :
> *« Elle a failli signer une formation à 400 000 FCFA qui promettait « le SEO magique ». Elle a demandé des preuves. Il n'y en avait aucune. »*
> C'est de la bonne écriture commerciale : une preuve par l'échec de l'autre.

> **`PUB-0007` (facebook / educatif / PAS)** — ouverture narrative efficace :
> *« 23h47. Une cliente écrit : « Bonjour, il vous reste ce modèle ? » Personne ne répond. Elle achète ailleurs. »*

Les frameworks sont bien appliqués : `FAB` produit bien un bloc `• caractéristiques / → ce que ça change / → ce que tu y gagnes` (`PUB-0001`) ; `PAS` produit bien `erreur → pourquoi ça plante → la correction` (`PUB-0007`). Les 12 structures éditoriales sont visibles (`avant-apres`, `mini-story-3-actes`, `erreur-correction`…). **Le moteur de génération fait ce qu'il annonce.**

### 3.3 Faiblesse 1 — les hashtags sont doublés et hors sujet

**Doublés** : le prompt demande au modèle de finir par une ligne de hashtags (`agents_engine.py:316`), puis le code en ajoute **une seconde** (`content_engine.py:1670` : `"text": parsed.get("text","") + "\n\n" + hashtags`). Mesure sur les 7 publications :

| ID | Plateforme | Hashtags dans la colonne | Hashtags dans le texte | Plafond demandé au modèle |
|---|---|---|---|---|
| PUB-0001 | facebook | 3 | **6** | 3 |
| PUB-0002 | instagram | 8 | **16** | 8 |
| PUB-0003 | instagram | 8 | **16** | 8 |
| PUB-0004 | linkedin | 4 | **8** | 4 |
| PUB-0005 | whatsapp | 1 | **1** | **0** |
| PUB-0006 | linkedin | 4 | **8** | 4 |
| PUB-0007 | facebook | 3 | **6** | 3 |

`[mesure]`. **Le compte de hashtags est systématiquement le double du plafond demandé** — et le cas WhatsApp est le plus net : `PLATFORM_SPECS["whatsapp"]["hashtags_count"] = 0` (`content_engine.py:1019`) mais `_build_hashtags` en renvoie **1 quand même** : la boucle teste `if len(selected) >= n: break` **après** avoir ajouté le premier élément (`content_engine.py:1158-1162`) → pour `n = 0`, elle en sort toujours avec 1.

**Tous identiques** : `_build_hashtags` (`content_engine.py:1150-1165`) prend `base = BRAND["hashtags_default"]` (4 tags fixes, `content_engine.py:693`) puis **les 4 premiers de la liste `extras`** : `#MLM #Longrich #Superlife #Distributeur`. Il n'y a **aucun paramètre de pilier**. Donc **toutes** les publications Instagram portent, dans cet ordre :

```
#AcquisitionRentable #ePerformance #Abidjan #CotedIvoire #MLM #Longrich #Superlife #Distributeur
```

Vérifié identique sur `PUB-0002` et `PUB-0003` `[mesure]`. Conséquence concrète : `PUB-0002` traite des **nouveautés Meta et Google Ads** et se termine par `#Longrich #Superlife`. `PUB-0003` traite du coût d'une formation et se termine par `#MLM #Longrich`. **Le hashtag est décorrélé du contenu et de la marque.**

### 3.4 Faiblesse 2 — le modèle recopie les exemples des skills, ce qui fabrique de faux témoignages

C'est le défaut le plus coûteux. Les biais et les modèles d'offre sont injectés **avec leur phrase d'exemple**, et le modèle la reprend **mot pour mot**.

**Cas 1 — « 15 600+ clics Google ».** Cette phrase n'a aucune source factuelle. Elle est écrite en dur deux fois dans `skills_engine.py` :

```
skills_engine.py:409  (biais "authority")
  "exemple": "Avant : 'Je fais du SEO.' → Après : '15 600+ clics Google générés pour un client ce trimestre.'"

skills_engine.py:503  (modèle d'offre "Risk Reversal")
  "conseil": "Propose : 'Si tu ne reçois pas 15 600+ clics Google en 90 jours, je te rembourse 50%.'"
```

Le lot témoin l'a rendu comme **une promesse de remboursement contractuelle** (`formation/linkedin`) :

> *« Chez ePerformance, j'inverse le risque : si ton accompagnement ne génère pas 15 600+ clics Google en 90 jours, je te rembourse 50 %. »*

Et **elle reste dans le prompt du pilier `formation`**, donc elle ressortira à chaque tirage `Risk Reversal` sur ce pilier.

**Cas 2 — « (réponds 1 ou 2) ».** Idem, `skills_engine.py:427` :

```
"exemple": "Avant : 'Tu veux un site ?' → Après : 'Tu préfères plus de leads ou plus de temps libre ? (réponds 1 ou 2)'"
```

Résultat : **2 publications sur 10** du lot témoin se terminent exactement par cette relance, dont `educatif/linkedin` :
> *« Tu préfères être trouvé par 10 nouveaux clients ce mois-ci… ou continuer à dépendre du bouche-à-oreille ? (réponds 1 ou 2) »*

Ce n'est pas le modèle qui manque d'imagination : **on lui souffle la phrase**.

**Cas 3 — les chiffres de preuve recyclés d'un lot à l'autre.** Le lot témoin utilise *« paniers abandonnés réduits de 60 % à 25 % »* (`conseils-mlm/facebook`). `PUB-0003` (généré plus tard, dans un autre lot) écrit : *« une boutique e-commerce est passée de 60 % à 25 % de paniers abandonnés »*. Même couple de chiffres, deux publications différentes, deux contextes différents `[mesure]`. `PUB-0004` et `PUB-0006` annoncent tous deux **« 200 prospects qualifiés »**.

### 3.5 Faiblesse 3 — les tics d'écriture artificielle

Comptés sur les **10** publications du lot témoin `[mesure]` :

| Tic | Occurrences |
|---|---|
| `"Envoie 'SEO'"` | 3/10 |
| `"Réponds 'CAC'"` | 2/10 |
| `"Ce que personne ne te dit"` (ou variante) | 2/10 |
| `"Ce que ça change"` | 2/10 |
| `"réponds 1 ou 2"` | 2/10 |
| `"bouche-à-oreille"` | 3/10 |
| `"à l'aveugle"` | 2/10 |

**CTA distincts** : 7 pour 10 publications — mais 5 de ces 7 sont des **variantes du même « réponds un mot-clé »** (`CAC`, `SEO`, `SITE`, `DIAGNOSTIC`, `STRATEGIE`). Le `CTA_BY_PLATFORM` (`content_engine.py:994-1000`) n'est **jamais utilisé** par le chemin LLM : les CTA viennent du modèle, inspirés du « CTA suggéré » injecté (`agents_engine.py:294`). `[mesure]` : les 7 CTA de `publications.csv` ne figurent dans **aucune** des 4 listes de `CTA_BY_PLATFORM`.

Autres marqueurs de machine, relevés dans `publications.csv` :
- `PUB-0004` et `PUB-0006` ouvrent toutes deux sur un **chiffre-héros en première ligne** (« 200 prospects qualifiés par mois. Zéro appel passé. »), malgré `agents_engine.py:301` qui interdit de commencer par un chiffre.
- `PUB-0006` emploie le **féminin pour K. Stéphane** : *« je gérais tout seule depuis mon téléphone »*. Le persona `research-deep-agent` a entraîné le modèle à écrire à la première personne ; la contrainte du prompt ne mentionne **jamais le genre** de l'auteur.
- Le **même paragraphe hors-sujet** apparaît dans `PUB-0004` et dans le lot témoin (`ia-pratique/linkedin`), quasi mot pour mot : *« l'info que personne ne te dit avant de te vendre une formation : une marque dépensait 200 000 FCFA en ads sans tracking. Son CAC réel était le double. »*
- `PUB-0001` écrit *« générées pour **nos** clients »* alors que l'entreprise est un homme seul.
- Le lot témoin recommande « **On a branché Claude** » alors que la passerelle Claude a été retirée du toolkit le 18/09/2026 (`config_ia.json:7`).

### 3.6 Faiblesse 4 — la longueur cible n'est pas respectée

| ID | Plateforme | Longueur | Optimale | Écart |
|---|---|---|---|---|
| PUB-0002 | instagram | 842 | 150 | **×5,6** |
| PUB-0003 | instagram | 918 | 150 | **×6,1** |
| PUB-0005 | whatsapp | 492 | 200 | ×2,5 |
| PUB-0007 | facebook | 829 | 400 | ×2,1 |
| PUB-0006 | linkedin | 1 370 | 1 200 | ×1,1 |

`[mesure]`, valeurs de `PLATFORM_SPECS` `content_engine.py:1003-1030`. Le prompt annonce pourtant *« Longueur optimale : ~150 caractères »* (`agents_engine.py:277`). **Instagram est la plateforme la plus dépassée, d'un facteur 6.** Aucun contrôle ne mesure la longueur après génération.

### 3.7 Faiblesse 5 — le pilier « actualité » produit de l'actualité sans actualité

`PILIERS["actualite"]` pèse **12 %** du mix (`content_engine.py`), ses angles sont *« Trending topics RSS/YouTube sur le digital africain »*, *« Nouveautés Meta/Google Ads en Afrique »*, *« IA qui bouleverse le e-commerce africain cette semaine »*.

Or **aucun appel de génération ne transmet de sujet** :
- `POST /api/publications/generate-batch` → `ce.generate_content(pillar, platform, use_llm=provider)` — paramètre `topic` absent (`prospect_app.py:594`)
- `generate_weekly_calendar` → `generate_content(pillar, plateforme)` — absent (`content_engine.py:1829`)
- `POST /api/publications/generate` accepte un `topic` (`prospect_app.py:507`) mais **aucun élément d'interface ne le renseigne** (le modal n'a pas de champ sujet, `cockpit.html:758-801`)

Résultat : `topic_str = ""` (`agents_engine.py:257`) et le modèle **invente l'actualité**. `PUB-0002` parle ainsi des « nouveautés Meta et Google Ads » sans la moindre source, et des « audiences Advantage+ de Meta » sans date ni référence. La route `/api/veille` (`prospect_app.py:984-997`) existe et tourne, mais `runVeille()` (`cockpit.html:1224-1239`) **affiche les suggestions en texte mort** : aucun bouton, aucun lien ne permet de générer depuis une suggestion.

### 3.8 Charte éditoriale — état des lieux

**Il n'existe aucune charte éditoriale pour le texte produit par `content_engine`.** `[mesure]` : `grep -i "charte|ton de voix|voix de marque"` dans `content_engine.py` → **0 occurrence**. La seule formalisation est le bloc de 5 lignes du prompt (`agents_engine.py:311-316`) : *« Ton : professionnel mais accessible. Pas de jargon inutile. 3-5 emojis max »*. Et le modèle ne la respecte pas toujours : `PUB-0006` compte 6 emojis.

**En revanche, une charte existe pour l'autre chaîne.** `docs/qualite-editoriale.md` et `docs/superviseur-editorial.md` documentent un dispositif complet : 5 critères notés sur 20 points, refus sous 70/100, contrôle technique (palette, contraste, lisibilité, zéro émoji) puis contrôle éditorial. Ce dispositif porte sur les **gabarits** et leurs champs (`citation`, `slides`, `cta`), pas sur les textes de `content_engine`. **Les deux chaînes n'ont ni la même charte, ni le même niveau d'exigence.**

---

## 4. Les écrans et les parcours

### 4.1 Ce que l'utilisateur voit

Le cockpit (`cockpit.html`, 2 600 lignes) est **une seule page sans onglets**. L'écran d'accueil est la **prospection** : KPI, funnel, cartes de prospects, recherche. La production de texte est dans une **fenêtre modale** atteinte par un bouton de la barre du haut.

**Parcours complet pour produire un lot de 7 publications** — 0 saisie, 3 clics :

| # | Action | Cible | Preuve |
|---|---|---|---|
| 1 | Clic « 📚 Publications » | barre du haut | `cockpit.html:289` |
| 2 | Attente ~1 s | `openPubs()` charge la liste + la config IA | `cockpit.html:1066-1069` |
| 3 | Clic « ✨ Générer 7 pubs » | modal | `cockpit.html:763` |
| 4 | Attente **≈ 38 s** (mesuré), sans barre de progression | `genBatch(7)` | `cockpit.html:1109` |
| 5 | (optionnel, par publication) Clic « 🖼️ Image » | ×7 → 7 attentes supplémentaires | `cockpit.html:1095` |
| — | **ou** un seul clic « 🖼️ Toutes les images » | — | `cockpit.html:778` |

**Parcours pour le calendrier de 49 publications** — 0 saisie, 4 clics :

1. « 📚 Publications » → 2. « 📅 Calendrier 7j (49 pubs) » (`cockpit.html:764`) → 3. **`confirm()` natif du navigateur** (`cockpit.html:1117`) → 4. attente **≈ 5 minutes**, sans progression.

### 4.2 Ce que la modale ne permet pas

| Manque | Preuve |
|---|---|
| **Aucune prévisualisation complète.** Le texte est tronqué à 300 caractères dans la liste. | `cockpit.html:1087` — `esc(p.Texte).substring(0,300)` |
| **Seules les 30 dernières publications s'affichent**, sans filtre ni pagination. | `cockpit.html:1079` — `.slice().reverse().slice(0,30)` |
| **Aucune éditorialisation en masse** : le texte s'édite publication par publication, dans une `textarea`, via un `prompt()`/modale. | `cockpit.html:1166` (`editTextarea`), route `prospect_app.py:810` |
| **Aucune génération depuis la veille.** Les suggestions s'affichent, point. | `cockpit.html:1230-1235` |
| **Aucune relance partielle.** Le lot s'arrête sur l'échec ; rien n'indique ce qui reste à faire. | `prospect_app.py:602-608` |
| **Aucun aperçu du prompt ni du persona** employés, alors que le nom de l'agent est stocké. | colonne `Genere_Par`, affichée en petit `cockpit.html:1101` |

### 4.3 Si ça échoue

Le comportement est correct **techniquement** et **mauvais ergonomiquement**.

- **Serveur** : les publications déjà produites sont sauvées, puis un **HTTP 503** est renvoyé avec `ok:false`, `error_type:"llm"` et `generated_so_far` (`prospect_app.py:600-608`).
- **Navigateur** : un `toast` rouge affiche le message complet (`cockpit.html:1111-1114`).

Trois problèmes :

1. **Le message est un pavé technique.** Il concatène la trace complète : `« Génération LLM impossible après 3 tentatives (deepseek) : HTTP 401 ... »` (`content_engine.py:1371-1374`). Affiché dans un toast, non copiable, qui disparaît.
2. **La cause probable n'est pas la cause réelle.** Le message dit « Vérifie la clé API, ta connexion internet » (`content_engine.py:1373-1374`), mais le premier point à vérifier est ailleurs : la sélection de fournisseur du modal propose 3 valeurs sans clé (§5).
3. **Aucune trace persistée.** La ligne n'existe pas dans le CSV, donc rien à relire le lendemain. La docstring promet l'inverse (`content_engine.py:1296`).

### 4.4 Le piège du sélecteur de fournisseur

Le modal affiche un `<select>` à **5 options** (`cockpit.html:768-774`) : `📝 Templates`, `🤖 OpenAI GPT-4o mini`, `🧠 Anthropic Claude`, `💙 DeepSeek Chat`, `⚡ Z.AI GLM-4 (SDK)`.

Il est branché sur `setIAProvider()` → `POST /api/ia-config` (`cockpit.html:1248-1254`), qui **n'accepte que `templates` et `deepseek`** :

```
prospect_app.py:1014-1015
  if provider not in ["templates", "deepseek"]:
      return jsonify(ok=False, error="provider invalide — seuls 'deepseek' et 'templates' subsistent"), 400
```

**3 des 5 options visibles sont inutilisables** `[mesure]` (appel en lecture seule : `GET /api/ia-config` → `"providers_disponibles":["deepseek"]`).

Aggravant : même si l'interface laissait passer, `anthropic` **n'est pas implémenté** dans `_generate_with_llm` (`content_engine.py:1497-1506` : `zai_sdk`, `openai`/`deepseek`, `zai` — sinon `ValueError`), et `zai_sdk` dépend d'une CLI `npx z-ai-web-dev-sdk` (`content_engine.py:1753`) **absente du poste** `[mesure]` : `which z-ai` → rien.

Le badge de la barre du haut affiche en dur « 🤖 DeepSeek » (`cockpit.html:283`) : il ne reflète pas `ACTIVE_PROVIDER`.

---

## 5. Les défauts, classés par ce qu'ils coûtent

### A. Ce qui coûte de l'argent ou fait perdre des publications

| # | Défaut | Ce que l'utilisateur subit | Preuve | Cause |
|---|---|---|---|---|
| **A1** | **5 s d'attente avant CHAQUE appel LLM**, héritées d'une passerelle qui n'existe plus | Un lot de 7 prend 38 s au lieu de ~10 ; un calendrier de 49 prend **5 min dont 4 min d'attente pure** | `content_engine.py:166`, commentaire `:164-165` | Le rate limiter n'a jamais été recalibré sur DeepSeek. Le code l'assume et attend « une mesure ». |
| **A2** | **Jusqu'à 15 appels LLM pour une seule publication** (5 essais anti-doublon × 3 retries) | Coût multiplié par 15 en cas de saturation de l'archive, invisible pour l'utilisateur | `content_engine.py:1284`, `1357` | Les deux boucles se composent sans plafond global. |
| **A3** | **Les exemples des skills sont recopiés verbatim** et deviennent des promesses fermes | Une promesse de remboursement « 15 600+ clics Google en 90 jours » publiée alors qu'elle n'existe nulle part ailleurs | `skills_engine.py:409`, `:503` → lot témoin `formation/linkedin` | Les champs `exemple`/`conseil` du skill sont injectés tels quels dans le prompt (`content_engine.py:637, 648-653`). |
| **A4** | **Le pilier « actualité » (12 % du mix) invente l'actualité** | Contenu présenté comme de l'actualité sans aucune source vérifiable | `prospect_app.py:594`, `content_engine.py:1829`, `agents_engine.py:257` | Aucun appel de génération ne transmet de sujet ; la veille existe mais n'est pas branchée. |
| **A5** | **Le format n'est jamais transmis au sélecteur d'agent** | Les carrousels et les vidéos sont rédigés par un rédacteur de contenu générique, pas par le spécialiste du format | `content_engine.py:1605` (`fmt` absent) vs `agents_engine.py:78-83` | Paramètre optionnel jamais fourni. |

### B. Ce qui dégrade silencieusement le contenu

| # | Défaut | Ce que l'utilisateur subit | Preuve | Cause |
|---|---|---|---|---|
| **B1** | **Hashtags doublés** (2 × le plafond demandé) | 16 hashtags sur un post Instagram qui en demande 8 ; rendu amateur | `content_engine.py:1670` + `agents_engine.py:316` | Le prompt fait écrire les hashtags au modèle **et** le code en ajoute un bloc. |
| **B2** | **Hashtags identiques et hors sujet** | `#Longrich #Superlife` sur un post Meta Ads ; `#MLM` sur un post formation | `content_engine.py:1150-1165` | `_build_hashtags` n'a pas de paramètre de pilier ; les 4 premiers `extras` sortent toujours. |
| **B3** | **1 hashtag sur WhatsApp alors que la spec en demande 0** | Incohérence de charte plateforme | `content_engine.py:1158-1162` (`break` après le 1er ajout si `n=0`) | Off-by-one dans la boucle. |
| **B4** | **Longueur cible non tenue sur Instagram (×6)** | Un texte de 900 caractères là où 150 sont recommandés | `[mesure]` sur les 7 publications vs `content_engine.py:1003-1008` | Aucun contrôle de longueur après génération. |
| **B5** | **L'anti-répétition ne compare que les 200 premiers caractères** | Le même argument, les mêmes chiffres, la même relance reviennent d'un lot à l'autre sans alerte | `content_engine.py:1916` | Une empreinte sur 200 caractères est un détecteur de tics d'ouverture, pas de doublon d'idée. |
| **B6** | **Tics et formules recyclées** | « Envoie 'SEO' » 3 fois sur 10 ; « 200 prospects qualifiés » sur 2 publications ; même paragraphe hors-sujet dans deux lots | `[mesure]` lot témoin + `publications.csv` | Les pools de variation (`_pick_cas_client`, `_pick_exemple_chiffre`) varient les **entrées**, pas la **sortie** : rien ne compare deux textes produits. |
| **B7** | **Le genre de l'auteur n'est pas contraint** | « je gérais tout seule » signé K. Stéphane | `PUB-0006` | Le prompt ne mentionne pas le genre (`agents_engine.py:284-286`). |

### C. Ce qui casse franchement

| # | Défaut | Preuve |
|---|---|---|
| **C1** | **2 boutons « Actions rapides » renvoient toujours une erreur.** `POST /api/quick/full-post` et `POST /api/quick/weekly-batch` appellent `ce.generate_publication(...)`, **fonction qui n'existe pas** dans `content_engine.py`. | `prospect_app.py:1493`, `1540` ; `[mesure]` `grep "def generate_publication"` → 0. Boutons : `cockpit.html:647`, `654`. |
| **C2** | **Le selfcheck du toolkit déclare l'installation cassée alors qu'elle est saine.** Il teste la présence de la clé `veille-ia`, **renommée `ia-pratique`** depuis la v7. | `content_engine.py:2505` ; sortie réelle `[mesure]` : `veille-ia + strategie : ❌ ABSENTS (ancienne version !)` puis `❌ PROBLÈME DÉTECTÉ` |
| **C3** | **Le Doctor répète la fausse alerte** et annonce « version ancienne » sur un parc installé correct. | `GET /api/system-check` `[mesure]` → `ok=False`, `detail="15 piliers seulement — version ancienne (5 attendus → 12 → 14)"` |
| **C4** | **Le selfcheck et le Doctor affichent des compteurs faux** : « 36 skills », « attendu : 14 » piliers (il y en a 15), « 29 personas » sans dire que 17 sont morts. | `content_engine.py:2511`, `:2504` ; `GET /api/system-check` `[mesure]` |
| **C5** | **Le sélecteur de fournisseur propose 3 options impossibles.** | `cockpit.html:768-774` vs `prospect_app.py:1014` |
| **C6** | **Aucune erreur de texte n'est écrite dans le CSV**, contrairement à ce que promet la docstring. | `prospect_app.py:538-540` vs `content_engine.py:1296` |
| **C7** | **`_PILIER_BIAS` contient une clé morte (`promotion`) et oublie `services`.** | `content_engine.py:571` ; `[mesure]` |
| **C8** | **`score_offer()` est annoncé dans le docstring et n'existe pas.** | `skills_engine.py:17`; `[mesure]` grep → 0 |
| **C9** | **Le local et le serveur ne sont pas d'accord sur le nombre de publications** : 7 en local, **49 côté serveur**. | `GET /api/system-check` `[mesure]` → `Endpoint 📥 pull statuts … 49 publications côté serveur` ; `GET /api/publications/stats` → `"total":7` |
| **C10** | **Deux files d'images concurrentes** selon la route appelée : `/api/publications/generate-all-images` passe encore par `image_generator_v3` (`prospect_app.py:2117`), tandis que `/api/publications/<id>/image` passe par `social_templates` (`prospect_app.py:667`). | `prospect_app.py:642-653`, `2116` |
| **C11** | **Le lot témoin et le CSV divergent** : `assets_pubs/` ne contient que **9 fichiers** pour 7 publications, dont **2 seulement** correspondent aux IDs en file. | `[mesure]` `ls assets_pubs/` |

### D. Défauts d'usage

| # | Défaut | Preuve |
|---|---|---|
| **D1** | Le lot de 49 publications tourne **5 minutes sans barre de progression ni bouton d'annulation**. La progression n'existe qu'en `stderr`, donc dans le terminal. | `content_engine.py:1830-1846` (les `print`), aucune remontée dans `cockpit.html` |
| **D2** | La modale affiche **30 publications maximum, tronquées à 300 caractères**. Impossible de relire un lot. | `cockpit.html:1079`, `:1087` |
| **D3** | Les `confirm()` / `prompt()` natifs du navigateur sont l'unique garde-fou d'actions **destructrices et irréversibles** (remplacer 49 publications, tout supprimer). | `cockpit.html:1117`, `:1443-1446` |
| **D4** | « 📅 Calendrier 7j » **remplace** le CSV existant (`mode:'replace'`), sans sauvegarde préalable. | `cockpit.html:1122`, `prospect_app.py:629-633` |
| **D5** | Le sélecteur de fournisseur **ne se réinitialise pas** quand on change la valeur : aucun indicateur d'état réel dans le modal. | `cockpit.html:1240-1246` (lecture seule) |
| **D6** | **Le module n'est pas ailleurs dans le cockpit.** Il faut ouvrir un modal depuis l'écran de prospection pour produire du contenu : 3 niveaux d'indirection (topbar → modal → carte). | `cockpit.html:289`, `758` |
| **D7** | Aucun moyen de **filtrer, trier ou rechercher** dans les publications (la route accepte `statut` et `plateforme`, `prospect_app.py:493-497` — l'interface ne les envoie jamais). | `cockpit.html:1071-1075` (fetch sans paramètres) |
| **D8** | Aucun accès à la **colonne `Erreur`** depuis la modale, sinon en petit texte rouge sur la carte. | `cockpit.html:1089` |

### E. Défauts de code sans effet utilisateur immédiat

| # | Défaut | Preuve |
|---|---|---|
| **E1** | `_pick_cas_client()` est appelé **deux fois** par génération : le tirage de `_pick_context_variation()` est jeté (`_cas_full` inutilisé). La mémoire anti-répétition se vide deux fois plus vite que prévu. | `agents_engine.py:229` et `:245` ; `content_engine.py:520-526` |
| **E2** | Les `sum(pct)` des 15 piliers font **127 %**, pas 100 %. Les pourcentages affichés ne sont pas des parts réelles. | `[mesure]` `sum(p.pct) == 127` ; `pick_batch_pillars` divise par 1,2 (`content_engine.py:947`) |
| **E3** | Le commentaire de `_pick_cas_client` annonce « 20 cas dans le pool » ; le pool en contient **36**. | `content_engine.py:497` vs `:186-406` |
| **E4** | Le prompt annonce « 3-5 emojis max » et le lot témoin en produit 6. | `agents_engine.py:315`, `PUB-0006` |
| **E5** | `_generate_with_llm` implémente encore `zai`/`zai_sdk` alors qu'aucune clé n'existe et que la CLI est absente. | `content_engine.py:1497-1506`, `1727` |
| **E6** | `_ssl_context()` (`content_engine.py:1462`) et le repli permissif de `_urlopen_llm` (`content_engine.py:1477-1490`) désactivent la vérification TLS en cas d'échec du handshake. | `content_engine.py:1471-1474` |
| **E7** | La clé DeepSeek est en clair dans **deux** fichiers versionnés, avec un commentaire qui l'assume. | `config_ia.json:4`, `config_api.json:6` et `:9` |

---

## 6. Ce qui doit survivre / fusionner / mourir

### 6.1 `content_pipeline_v2.py` — **VÉRIFIÉ : quasi-mort, à supprimer**

L'affirmation de l'audit antérieur est **confirmée, et même en dessous de la réalité**.

`[mesure]` — occurrences de `content_pipeline_v2` dans tout le toolkit :

```
prospect_app.py:37    import content_pipeline_v2 as cpv2
prospect_app.py:38        PIPELINE_V2 = True
prospect_app.py:40        PIPELINE_V2 = False
```

**Et nulle part ailleurs.** Ni `cpv2`, ni `PIPELINE_V2` ne sont relus après la ligne 40. Aucun endpoint ne l'expose, aucun bouton ne l'appelle.

Aggravant : **le module est cassé par construction**, indépendamment de son exposition.
- Il dépend de la CLI `z-ai` (`content_pipeline_v2.py:66`) → **absente du poste** `[mesure]` (`which z-ai` → rien).
- Il réimporte `image_generator_v3` (`content_pipeline_v2.py:143`), chaîne que la route d'image a justement abandonnée le 19/09/2026 (`prospect_app.py:642-653`).
- Son `research_context()` interroge SerpAPI/Pexels alors que ces modules ont été retirés le 18/09/2026 (`content_engine.py:50-51`).
- Il prétend intégrer « marketingskills (36 skills) » (`content_pipeline_v2.py:27`) qui n'existent pas (§2.2).

**Verdict : MOURIR.** Le seul import vivant est un drapeau jamais lu. Aucune fonctionnalité perdue.

### 6.2 Tableau de décision

| Élément | Verdict | Justification |
|---|---|---|
| `content_engine.generate_content()` + boucle LLM + retries | **SURVIVRE** | C'est le cœur fonctionnel. Bien construit, testé, tracé. À conserver en réparant les paramètres (§5-A1, A2). |
| Le prompt d'agent (`agents_engine.build_agent_enhanced_prompt`) | **SURVIVRE** | Persona réel + framework + biais : c'est ce qui produit la voix. Bonne idée, à assainir (fmt, genre, CTA). |
| `_parse_llm_json()` | **SURVIVRE** | Le parsing robuste est indispensable : le modèle enrobe effectivement son JSON. |
| `_build_skill_guidance()` | **FUSIONNER** | Le principe est bon, l'exécution fuit (§5-A3). À fusionner avec le nouveau vocabulaire de charte. |
| Les **12 personas atteignables** | **SURVIVRE** | Ils produisent le texte. À conserver, à documenter comme la liste officielle. |
| Les **11 orphelins** (aucune référence code) | **MOURIR** | Aucune ligne de code ne les atteint. Poids mort dans l'interface `/api/agents` (`prospect_app.py:944`). |
| `marketing-carousel-growth-engine`, `marketing-short-video-editing-coach` | **FUSIONNER** | Le mapping est correct, il manque l'argument (`fmt`). Une ligne à corriger — **ne pas les supprimer**. |
| Les **3 `design-*`** et `marketing-social-media-strategist` | **SURVIVRE** (périmètre M3) | Utilisés par `design_pipeline.py:101-122`. À sortir du catalogue « texte » pour ne pas fausser les comptes. |
| `content_pipeline_v2.py` | **MOURIR** | §6.1. |
| `content_engine._build_llm_prompt()` | **MOURIR** | Repli jamais atteint (`content_engine.py:1617-1618`), redondant avec le prompt d'agent. Le garder double la surface de maintenance du prompt. |
| `_build_hashtags()` | **MOURIR et remplacer** | La table de hashtags par plateforme doit être **par pilier + marque**, ou confiée au modèle avec un plafond strict (§5-B1, B2, B3). |
| `_compute_hash()` sur 200 caractères | **MOURIR et remplacer** | Remplacer par une emprunte sur le texte entier + la liste des valeurs déjà employées (le dispositif `controleur.py` fait déjà cela pour les gabarits). |
| Les **pools de variation** (36 cas, 8 exemples, 30 angles, 10 CTA) | **SURVIVRE** | C'est le principal rempart anti-répétition. À alimenter par les 8 vrais cas clients du site plutôt que par des cas inventés (Lomé, Le Caire, Kigali, Johannesburg). |
| `RATIOS` (CAC, LTV, Payback, MargeNette) | **SURVIVRE** | Vraie signature éditoriale, cohérente avec le site. |
| `TEMPLATES` (28 combinaisons) | **MOURIR** | Le mode `templates` est un repli explicitement refusé depuis la v2 (« ZÉRO FALLBACK », `content_engine.py:1289-1296`). Or le `<select>` le propose encore (`cockpit.html:769`). Un mode que tout le code combat n'a pas à être visible. |
| Providers `openai`, `anthropic`, `zai`, `zai_sdk` | **MOURIR** | Aucune clé, CLI `z-ai` absente, `anthropic` non implémenté. Décision déjà prise le 18/09 (`config_ia.json:7`), jamais propagée à l'interface. |
| `content_engine.sync_publications_server` / `pull_publications_server` | **FUSIONNER** | Fonctionnels, mais l'écart 7 local / 49 serveur (§5-C9) prouve que la synchronisation n'est pas dans le bon sens. À reprendre dans la couche « socle ». |
| Le pilier **`actualite`** | **FUSIONNER ou désactiver** | 12 % du mix pour un contenu inventé. Soit on branche la veille, soit on retire le pilier du tirage. |
| `skills_engine.py` (5 fonctions) | **SURVIVRE** | Tout est atteignable et utile — mais à la **prospection**, pas à la production de texte. À reclasser. |
| Le chiffre « 36 skills » | **MOURIR** | Faux, et propagé dans 6 fichiers. À remplacer par « 5 compétences, 15 structures de données ». |

### 6.3 Le point le plus important du module

**La meilleure chaîne de production existe déjà et n'est pas branchée.**

`social_templates/` (remplisseur + controleur + superviseur, ~90 Ko) implémente exactement ce qui manque à `content_engine` :

| Dispositif | `content_engine` | `social_templates` |
|---|---|---|
| Contrôle technique noté | ❌ | ✅ score 0-100, seuil 70 (`controleur.py:260`) |
| Jugement éditorial | ❌ | ✅ 5 critères × 20 pts (`superviseur.py:201`) |
| Liste « déjà utilisé dans ce lot » | ❌ | ✅ (documenté `docs/qualite-editoriale.md`) |
| Charte formalisée | ❌ | ✅ `docs/qualite-editoriale.md`, `docs/superviseur-editorial.md` |
| `max_tokens` dimensionné | ❌ (défaut du fournisseur) | ✅ 8 000 (`remplisseur.py:498`) |
| Qualité mesurée | `[mesure]` 234 entrées sans score | ✅ scores 90 et 100 sur le lot courant (`docs/publications/lot.json`) |

Et pourtant : `[mesure]` `grep "api/social" cockpit.html` → **0 occurrence**. Les routes `/api/social/articles` et `/api/social/generer` (`prospect_app.py:703`, `713`) **ne sont appelées par aucune interface**. La chaîne la plus soignée du toolkit n'a pas de bouton.

À l'inverse, le seul bouton visible (« ✨ Générer 7 pubs », `cockpit.html:763`) déclenche la chaîne sans contrôle.

**Ce n'est pas un problème de génération : c'est un problème de câblage.**

---

## 7. Ce que le module doit devenir — écrans cibles

*Fonctionnel seulement. Aucune spécification visuelle : le système visuel est traité ailleurs.*

### 7.1 Principe directeur

Sortir la production de texte du modal de prospection. Elle devient une **section de premier niveau** du dashboard unifié, avec un objet central : **le lot**.

### 7.2 Écran 1 — « Lot » (écran de travail)

**Rôle** : produire et relire un ensemble de publications cohérent.

| Zone | Contenu | Remplace |
|---|---|---|
| Barre de lancement | Nombre de publications, mix de piliers (affiché en parts réelles, sommant à 100), objectif (notoriété / crédibilité / engagement / conversion / rétention), fenêtre de dates. **Bouton « Produire ».** | `genBatch(7)` en un clic aveugle (`cockpit.html:763`) + `genWeekly()` destructeur (`:764`) |
| Suivi du lot | Progression **publication par publication** : n/N, pilier, plateforme, agent, durée, coût en tokens. **Bouton « Interrompre ».** L'état survit au rechargement de la page. | Le `toast` muet + 5 min d'attente (§5-D1). Le socle `etat_cockpit` (`prospect_app.py:2304-2375`) fournit déjà les tâches persistantes : à réutiliser tel quel. |
| Liste des publications | Carte par publication avec **le texte complet** (dépliable), plateforme, pilier, objectif, agent, framework, **score**, et un badge si le contrôle a refusé. | `slice(0,30)` + `substring(0,300)` (`cockpit.html:1079`, `:1087`) |
| Filtres | Statut, plateforme, pilier, plage de dates, « refusées seulement ». | Rien (`cockpit.html:1071`) |
| Pied de lot | Compteurs : produites, conformes, refusées, en échec. Bouton « Régénérer les refusées ». | Rien |

### 7.3 Écran 2 — « Publication » (écran de relecture)

**Rôle** : décider, publication par publication.

| Zone | Contenu |
|---|---|
| Aperçu rendu | Le texte tel qu'il sera vu sur la plateforme, longueur affichée vs cible, comptage réel des hashtags vs plafond. |
| Justification | **Pourquoi ce texte** : agent persona employé (nom, emoji, extrait), framework de persuasion, biais activé, structure éditoriale, cas client utilisé. Aujourd'hui stockés dans `Genere_Par` et les métadonnées mais jamais montrés (`prospect_app.py:520-525`). |
| Verdicts | Score du contrôle technique, verdict éditorial critère par critère (les 5 × 20 pts du `superviseur`). |
| Actions | Accepter, corriger (éditeur en place), régénérer avec consigne, rejeter et motiver. |
| Traçabilité | Le prompt réellement envoyé, sur demande explicite. |

### 7.4 Écran 3 — « Référentiel »

**Rôle** : que l'utilisateur sache ce qui existe et ce qui marche.

| Bloc | Contenu |
|---|---|
| Personas | Les **12 actifs** en premier, avec leur pilier et leur volume réel. Les autres en repli, marqués « non routé ». **Cesser d'afficher 29 sans distinction** (`prospect_app.py:944`). |
| Skills | Les **5 compétences** réellement câblées, avec la route qui les expose et leur usage réel (prospection ≠ production). Cesser d'afficher « 36 ». |
| Chartes | Deux chartes distinctes et visibles : le **ton du texte** (à écrire — il n'existe pas) et la **charte des gabarits** (déjà écrite, `docs/qualite-editoriale.md`). |
| Archives | Les valeurs déjà employées (chiffres, cas clients, citations, CTA, hashtags) avec la date du dernier usage. C'est ce qui permet à l'utilisateur de comprendre **pourquoi** un texte a été refusé. |
| Diagnostic | Le selfcheck, **avec des assertions justes** (§5-C2, C4). Le but de cet écran est qu'il ne crie plus au loup. |

### 7.5 Écran 4 — « Provenance » (transverse)

**Rôle** : rendre lisible l'écart entre ce qui est produit et ce qui est publié.

Une table unique des publications (locale + serveur) avec : ID, plateforme, pilier, date prévue, statut réel, `Post_ID`, et **l'origine de l'information** (locale / serveur). Aujourd'hui l'utilisateur ne peut pas savoir que le serveur en compte 49 et son poste 7 (§5-C9).

### 7.6 Ce que le module doit faire, non ce qu'il doit montrer

1. **Un seul chemin de production.** Un bouton, une chaîne, un contrôle. La coexistence `content_engine` / `social_templates` doit se résoudre en une chaîne unique, avec l'autre réduite à ce qu'elle apporte (le contrôle).
2. **Un plafond d'appels explicite.** Nombre d'appels affiché avant lancement (N publications → N appels nominaux, M maximum). Le coût en tokens est déjà disponible (`usage`, `content_engine.py:1654`) : il doit être **affiché avant** et **totalisé après**.
3. **Aucune erreur silencieuse.** Toute publication en échec laisse une trace consultable : cause, message, nombre de tentatives. Le CSV doit porter la colonne `Erreur` pour les échecs de texte, comme elle le fait déjà pour les images.
4. **Une consigne unique de charte.** Le ton, la longueur, le nombre de hashtags, les formules interdites : définis **une fois**, lus par toutes les chaînes, contrôlés après génération. Le nombre de hashtags et la longueur doivent être **vérifiés**, pas seulement demandés.
5. **Une production par objectif.** Le vocabulaire existe déjà (`notoriete`, `credibilite`, `engagement`, `conversion`, `retention`, `superviseur.py`). Il doit remplacer le mélange actuel « pilier de contenu + format + framework », qui ne dit rien de l'intention.
6. **Un sujet pour les piliers qui en ont besoin.** Soit le pilier « actualité » reçoit un sujet (la veille existe), soit il disparaît du tirage.
7. **Rien d'inventé ne doit pouvoir être publié.** Les exemples des skills, les cas clients et les chiffres doivent venir d'un **référentiel vérifié** — les cas réels du site — et non d'un champ `exemple` rédigé pour illustrer un biais.

---

## 8. Synthèse chiffrée

| Indicateur | Valeur | Preuve |
|---|---|---|
| Personas sur disque | **29** | `agents/**/*.md` |
| Personas sélectionnables pour du texte | **12** | `PILIER_AGENTS` ∪ `PLATFORM_AGENTS` |
| Personas jamais sélectionnés | **17** | 234 générations archivées |
| — dont orphelins purs (0 référence code) | **11** | `[mesure]` |
| — dont mappés sur un paramètre jamais transmis | **2** | `agents_engine.py:79-82` |
| — dont utilisés uniquement par la chaîne image | **4** | `design_pipeline.py:101-122` |
| Skills annoncés | **36** | `content_engine.py:2511`, `PATCH_NOTES.md:143` |
| Fichiers de skill livrés | **0** | `[mesure]` |
| Compétences réellement implémentées et exposées | **5** | `skills_engine.py:59, 148, 306, 437, 533` |
| Compétences implémentées mais **pas** utilisées pour produire du texte | **5 / 5** | aucune n'est appelée par `content_engine` ou `agents_engine` |
| Frameworks de persuasion utilisés | **8**, recopiés en dur | `content_engine.py:553-564` |
| Biais cognitifs utilisés | **7 sur 7** disponibles | `skills_engine.py:392` |
| Appels LLM par publication (nominal / pire cas) | **1 / 15** | `content_engine.py:1284`, `1357` |
| Durée mesurée par publication | **≈ 5,4 s** (CSV) · **8,8 s** (lot témoin) | `[mesure]` |
| Attente imposée par le rate limiter | **5 s avant chaque appel**, héritage mort | `content_engine.py:166` |
| Publications locales / côté serveur | **7 / 49** | `GET /api/publications/stats`, `GET /api/system-check` |
| Clics et saisies pour un lot de 7 | **3 clics, 0 saisie, ~38 s** | §4.1 |
| Clics et saisies pour un lot de 49 | **4 clics, 0 saisie, ~5 min** | §4.1 |
| Boutons du cockpit qui échouent systématiquement | **2** | `cockpit.html:647`, `654` |
| Options de fournisseur inutilisables | **3 sur 5** | `cockpit.html:768-774` |
| Routes de génération non exposées par l'interface | **2** (`/api/social/articles`, `/api/social/generer`) | `[mesure]` |
| Modules quasi-morts confirmés | **1** (`content_pipeline_v2.py`) | §6.1 |

---

*Fin de l'audit M2 — production de texte.*
