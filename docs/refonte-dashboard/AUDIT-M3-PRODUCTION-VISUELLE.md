# AUDIT M3 — PRODUCTION VISUELLE (images et gabarits sociaux)

**Module audité** : production des visuels de publication — génération d'image,
gabarits sociaux, illustrations, polices, contrôle qualité du rendu, conversion vidéo.
**Date de l'audit** : 19 septembre 2026.
**Raccourci de version** : `/api/system-check` répond « v5.0.6 » (`ALL_OK: false`,
un contrôle en échec — voir §6, défaut F13).
**Nature** : audit fonctionnel et UX, **lecture seule**. Aucune route génératrice
d'image n'a été appelée. Aucun fichier du toolkit n'a été modifié **par cet audit**. Les
mesures d'image ont été faites par `PIL` en lecture, sans réécriture.

> **Réserve d'intégrité.** Une **autre session** a lancé, pendant cet audit,
> `rm -rf docs/publications && python3 social_templates/lot.py --nombre 6` (processus
> `1409831`, 04:43). Le journal `docs/publications/lot.json` a donc été réécrit sous
> l'audit, et une partie des images de `docs/publications/` avec lui. L'audit rapporte
> **les deux lectures** quand elles diffèrent (§1.4) et signale la fenêtre de mesure de
> chaque chiffre. `assets_pubs/`, `docs/gabarits/` et le code du module n'ont pas été
> touchés.

## Conventions de lecture

| Jeton | Chemin absolu |
|---|---|
| `TOOLKIT/` | `/home/ballo/OX6A/toolkit_eperformance/` |
| `APP` | `TOOLKIT/prospect_app.py` — l'application Flask (2 382 lignes), sert `cockpit.html` |
| `COCKPIT` | `TOOLKIT/cockpit.html` — l'unique écran (2 600 lignes) |
| `V3` | `TOOLKIT/image_generator_v3.py` (319 lignes) |
| `DP` | `TOOLKIT/design_pipeline.py` (545 lignes) |
| `V2` | `TOOLKIT/image_generator.py` (611 lignes) |
| `ST/` | `TOOLKIT/social_templates/` |
| `SI/` | `TOOLKIT/social_illustrations/` |
| `BLOG/` | `/home/ballo/OX6A/blog-eperformance/` |
| `IMAGES` | `TOOLKIT/assets_pubs/` |

Deux instances tournent en parallèle : `python3 prospect_app.py` sur le port **8787**
(pid 1379878) et `python3 prospect_app.py --port 8788 --no-browser` sur le port **8788**
(pid 1370122). L'audit a interrogé **8788** (lecture). `APP:2285` déclare 8787 par défaut ;
`APP:2278` sert `COCKPIT` — vérifié : `GET /` renvoie 147 103 octets, taille exacte du
fichier `cockpit.html` (147 103).

Les commandes exécutées sont citées entre backticks. Les clés d'API ne sont **jamais**
reproduites : seuls le fichier, la ligne et la nature sont signalés.

---

## 0. Synthèse — les trois découvertes

**1. Il existe bien deux chaînes, et ce n'est pas « ancienne / nouvelle » : c'est
« morte par décision / vivante par bouton ».** La chaîne HTML-par-LLM est déclarée
dépréciée dans son propre en-tête (`DP:2` : « ⚠️ LEGACY — DÉPRÉCIÉ le 19/09/2026.
NE PLUS UTILISER POUR LES NOUVELLES IMAGES »). Mais `V3:194` l'appelle toujours, et
`V3` est toujours branché à **cinq routes** de `APP` (six avec les variantes). La dépréciation est un texte, pas
un garde-fou. Mesure : les images issues de cette chaîne contiennent **33,4 % de noir
pur `#000000` et 0 pixel d'or `#c9a96e`** — hors charte — là où celles de
`social_templates` sont à 52–96 % de `#08080c` **avec l'or de marque**.

**2. Le lot est produit par la chaîne du bouton unitaire et celui du bouton de lot, et
ce sont deux chaînes différentes.** `COCKPIT:1094` (« 🖼️ Image », par publication) appelle
`/api/publications/<id>/image` → `ST/publication.py` (chaîne gabarits).
`COCKPIT:781-782` (« Toutes les images », « Recréer images ») appelle
`/api/publications/generate-all-images` → `V3` → `DP` (chaîne HTML-par-LLM).
Deux boutons de la même barre d'actions, deux chartes, deux coûts. L'utilisateur n'a
aucun moyen de le savoir.

**3. Le temps réel est deux fois celui annoncé par l'interface, et 17 % des publications
sont refusées — c'est mesuré, pas estimé.** `docs/publications/lot.json` contient les
durées horodatées des publications : **premier échantillon, 10 durées, moyenne 23,0 s
(minimum 9,3 s, maximum 56,4 s) ; second échantillon, 6 durées, moyenne 14,1 s.** Réunis :
**16 durées, moyenne 19,7 s, minimum 5,9 s, maximum 56,4 s.** `COCKPIT:1332` et
`COCKPIT:1346` annoncent « ~10s/image ». Sur le premier échantillon, **2 publications sur
12 (16,7 %) sont rejetées** après 5 tentatives, motif « *trop générique — aucun chiffre,
aucune question, aucun contraste* ». Le journal a été écrasé par une autre session
pendant l'audit : les deux lectures sont rapportées en §1.4.

**Redondance des deux chaînes — tranché : ni redondantes, ni complémentaires, ni l'une
morte.** La chaîne `V3`+`DP` est **redondante avec elle-même** (elle porte deux tables de
thèmes concurrentes, 5 entrées contre 15), **déclarée morte par son auteur**, et
**toujours exécutée par cinq routes** (six avec les variantes). Elle doit mourir pour de bon. `social_templates/`
n'est pas son concurrent : c'est son remplaçant, déjà écrit, déjà mesuré, déjà branché —
sur un seul bouton sur six.

---

## 1. La chaîne de production d'image, de bout en bout

### 1.1 Les deux chaînes, et qui les appelle

| Route | Ligne | Chaîne réellement exécutée | Preuve |
|---|---|---|---|
| `POST /api/publications/<id>/image` | `APP:638` | **ST** (gabarits) | `APP:659` `pub_module.illustrer(...)` |
| `GET /api/social/articles` | `APP:703` | **ST** | `APP:706` `pub_module.articles_disponibles()` |
| `POST /api/social/generer` | `APP:713` | **ST** | `APP:726` `pub_module.generer_depuis_article(...)` |
| `POST /api/publications/generate-all-images` | `APP:2068` | **V3 → DP** | `APP:2114-2127` `ig.gen_*` |
| `POST /api/design/generate-image` | `APP:1107` | **V3 → DP** | `APP:1135-1143` `ig.gen_*` |
| `POST /api/design/generate-variants` | `APP:1177` | **V3 → DP** | `APP:1188` `vg.generate_variants` → `variant_generator.py:46` `import image_generator_v3 as img_gen` |
| `POST /api/quick/full-post` | `APP:1481` | **V3 → DP** | `APP:1504` `ig.gen_citation` |
| `POST /api/quick/retry-failed` | `APP:1618` | **V3 → DP** | `APP:1642` `ig.gen_citation` |
| `POST /api/quick/weekly-batch` | `APP:1524` | **aucune image** — texte seul | `APP:1526-1552` : n'appelle que `ce.generate_publication`, jamais `ig.*` |
| `POST /api/design/image-to-video` | `APP:1230` | vidéo (`video_micro_generator`) | `APP:1234` |
| `POST /api/quick/batch-video` | `APP:1583` | vidéo (`video_micro_generator`) | `APP:1587` |
| `GET /api/system-check` | `APP:1921` | diagnostic seul (ne produit rien) | `APP:1932` `ig.get_diagnostics()` |

**Cinq routes sur onze** produisent leurs images par la chaîne déclarée dépréciée, et
`/api/design/generate-variants` y accède indirectement par `variant_generator.py:46`.
Sur les routes qui produisent un visuel, **la chaîne morte en dessert cinq et la chaîne
gabarits une seule**. Le choix de la chaîne ne dépend pas de ce que l'utilisateur
demande : il dépend de **quel bouton** il clique.

**Note** : `/api/quick/weekly-batch` est nommé « batch » et ne produit **que du texte** —
les 7 publications créées sont ensuite illustrées par un autre bouton, donc par une
chaîne choisie ailleurs. C'est le même défaut de nommage que §5.

### 1.2 Chaîne A — `V3` → `DP` → DeepSeek HTML → Chromium (cinq routes)

**Qui décide du visuel.** Un modèle de langage, à qui l'on demande d'**inventer du HTML**.
L'appelant est `V3:187-206` :

- `V3:194` — `html = design_pipeline.enrich_design_prompt(text, platform, pilier, w, h)`
- `V3:192` — **3 tentatives**, backoff `2 + 3 × essai` secondes (`V3:202`)
- `V3:203-206` — échec définitif = `ImageGenerationError`, jamais de repli (décision
  documentée `V3:16-29`, « ZÉRO FALLBACK »)

**Le prompt.** `DP:356-519` construit un prompt unique (`master_prompt`, `DP:439-473`) :

| Ce que le prompt impose | Ligne | Nature |
|---|---|---|
| 5 personas d'agents, chargées depuis `agents/*.md` | `DP:396-406` | chaque persona est **tronquée à 800 caractères** (`DP:399`), après extraction des 1 500 premiers (`DP:97`) |
| Un « TEMPLATE SIGNATURE » parmi 3 | `DP:415-421`, `DP:128-171` | `signature-gold` · `signature-neon` · `signature-edu` |
| Un « STYLE DE MISE EN PAGE IMPOSÉ » parmi **8** | `DP:450-452`, `DP:184-193` | tirage évitant les 3 derniers (`DP:196-203`, `deque(maxlen=3)`) |
| Un fond sombre parmi **8** | `DP:455` | `FONDS_SOMBRES`, `DP:206` |
| Une position de logo parmi **4** | `DP:209` | `LOGO_POSITIONS` — **sans effet, voir F5** |
| Une icône SVG du pilier | `DP:429-437` | `PILLAR_ICONS`, `DP:212-223` |
| La température `1.15` | `DP:482` | `max_tokens=4000`, même ligne |

L'appel LLM : `V3` → `DP:479-482` `_call_llm` → `DP:308-354` → `DP:269-305` `_call_deepseek`,
`POST https://api.deepseek.com/v1/chat/completions` (`DP:285`), **modèle `deepseek-chat`
écrit en dur** (`DP:278`), délai 180 s (`DP:290`). Le HTML est extrait entre `<!DOCTYPE`
et `</html>` (`DP:492-507`).

**Le moteur de rendu.** `V3:133-183` `_render` : Playwright/Chromium en mode
`headless` (`V3:142`), `viewport = {w, h}` avec **`device_scale_factor=2`** (`V3:144`),
`set_content(html, wait_until="networkidle")` puis **attente fixe de 2 000 ms**
(`V3:146-147`), capture (`V3:148`). Contrôle de sortie : fichier présent et
**≥ 5 000 octets** (`V3:153-157`), sinon `ImageGenerationError`.

**Post-traitement.** `V3:161-179` : `image_optimizer.optimize_image(..., quality=85,
target_format='webp'|'auto')` — WebP pour tout sauf WhatsApp (`V3:166`). C'est **le seul
appelant d'`image_optimizer` dans tout le dépôt** (`grep image_optimizer` : `V3:162`,
`V3:168`, et son propre docstring).

**Formats de sortie.** `V3:126-129` `SIZES` : instagram `1080×1080`, facebook
`1200×630`, linkedin `1200×627`, whatsapp `1080×1920` — multipliés par le facteur 2.
Sortie : **PNG puis WebP** (sauf WhatsApp).

**Dit par la chaîne elle-même, et faux.** `V3:32-35` affirme que les templates
« utilisent automatiquement les nouveaux logos depuis
`/home/ballo/OX6A/branding/logos/generated/` ». Trois faits contraires, tous vérifiés :

1. `design_pipeline.py:34-35` importe `branding_helper` et `logo_composition` :
   **ces deux fichiers n'existent pas** (`ls` : « Aucun fichier ou dossier de ce nom »).
   Seules leurs versions désactivées subsistent (`branding_helper.py.disabled`,
   `logo_composition.py.disabled`). L'import lève donc `ImportError`, et `DP:39-40` met
   `BRANDING_AVAILABLE = LOGO_COMPOSITION_AVAILABLE = False`.
2. `DP:426` et `DP:469` interdisent le logo dans le HTML généré : « ⚠️ PAS DE LOGO dans
   le HTML : le logo sera ajouté automatiquement après génération (composition
   graphique) ».
3. Or `get_last_logo_position()` (`DP:525-527`), qui porte la position à composer, n'est
   appelé **que par un script de test** (`test_integration_pipeline_llm.py:137`). Aucun
   appelant de production.

**Conséquence prouvée : les images de la chaîne A ne portent aucun logo.** Et
`branding/logos/generated/` ne contient que trois favicons (`favicon-16x16.png`,
`favicon-128x128.png`, `favicon-256x256.png`) — pas les `logo-main-professional.png`
que `branding_config.json.disabled` nomme.

**Deux tables de thèmes concurrentes dans la même chaîne.** `V3:116-122` `THEMES`
déclare **5** entrées (`cas-client`, `educatif`, `conseils-mlm`, `actualite`,
`promotion`) ; `DP:249-265` `THEME_COLORS` en déclare **15**. Mesuré par comptage sur
les deux fichiers. `V3.get_theme()` (`V3:124`) retombe sur `cas-client` pour les dix
piliers absents de sa table.

### 1.3 Chaîne B — `social_templates/` → DeepSeek JSON → gabarit HTML statique → Chromium

**Qui décide du visuel.** Le **code**, pas le modèle. Le modèle ne produit plus de HTML :
il produit un **JSON de champs**, validé, puis rendu dans un gabarit figé.

- `ST/publication.py:91-117` `illustrer(pilier, plateforme, texte, titre, dossier)` —
  entrée « la publication existe déjà, je veux son image ».
- `ST/publication.py:138-152` `generer_depuis_article(slug, ...)` — entrée « rien
  n'existe, je pars d'un article publié du blog ».

**Le choix du gabarit est déterministe.** `ST/publication.py:65-76` `_gabarit_pour` :
candidats par pilier (`GABARITS_PAR_PILIER`, `:40-60`), filtrés par plateforme, puis
tranchés par `sha256(gravé)[:4] % len(candidats)` (`:75`). **Une publication garde donc
toujours le même gabarit** — rejouer le lot redonne les mêmes images.

**Le prompt.** `ST/publication.py:159-195` `_prompt_depuis_texte` : le schéma du gabarit
(champs, bornes `max`, descriptions) + six règles explicites, dont « *Tout doit venir du
texte ci-dessus. Si une information n'y figure pas, n'invente RIEN* » (`:183-185`) et
« *Zéro émoji. Pas d'entité HTML. Pas de tiret cadratin en début de phrase* » (`:188`).
Le modèle ne reçoit **jamais** la consigne d'écrire du HTML.

**La boucle de reprise.** `ST/publication.py:198-215` `_remplir_avec_reprises`,
`tentatives=3` : chaque refus est **renvoyé au modèle** (« *Ta réponse a été REFUSÉE
pour : … Corrige ces points* », `:213-214`). Le lot utilise 5 tentatives
(`ST/remplisseur.py:897` `tentatives: int = 5`).

**Le rendu.** `ST/rendu.py:106-131` `rendre_publication` → `ST/rendu.py:40-65`
`rendre_html` → `_capturer` (`ST/rendu.py:29-37`) : Chromium, `viewport = {largeur,
hauteur}`, **`device_scale_factor=2`** (`ST/rendu.py:26` `FACTEUR = 2`),
`wait_until="networkidle"` puis **250 ms** (`ST/rendu.py:35` — contre 2 000 ms en
chaîne A), capture. Le HTML est écrit dans un fichier temporaire puis **ouvert par
`file://`** (`ST/rendu.py:34`), et supprimé après capture (`ST/rendu.py:64`).

**Les dimensions.** `ST/coque/jetons.py:184-191` `CANVAS` — 6 combinaisons :

| Plateforme | Formats disponibles | Résolution |
|---|---|---|
| linkedin | carre | 1200×1200 |
| instagram | carre, portrait | 1080×1080 · 1080×1350 |
| facebook | carre, paysage | 1200×1200 · 1200×630 |
| whatsapp | story | 1080×1920 |

Multipliées par `FACTEUR = 2` → **2 400×2 400**, **2 160×2 700**, **2 400×1 260**,
**2 160×3 840**. Vérifié sur les fichiers (§4).

**Les polices.** `ST/coque/composeur.py:35-45` `polices_css()` émet 9 blocs `@font-face`
avec `src:url('file://{chemin}')` vers `ST/polices/*.woff2` — **Fichiers locaux, aucun
réseau**. La correspondance famille/graisse/fichier est déclarée une seule fois,
`ST/coque/jetons.py:343-353` `FICHIERS_POLICES`.

**Le contrôle qualité.** `ST/controleur.py:260-…` `controler(chemin_png, resultat)` note
le **rendu réel** (mesuré dans Chromium, pas dans le code source), 8 contrôles pondérés
(`ST/controleur.py:46-49` `POIDS`) : palette 20, contraste 20, tailles 15, logo 10,
occupation 10, émoji 10, pouce 10, chevauchement 5. Seuil d'acceptation `SEUIL = 70`
(`ST/controleur.py:42`).

**Le jugement éditorial.** `ST/superviseur.py:201-242` `juger(publication, article,
autres, tentatives=2)` — un **second appel LLM**, qui juge l'angle, l'accroche, la
promesse et la répétition à l'échelle du lot (`ST/superviseur.py:12-30`).

**Ce que le modèle ne peut pas faire, par construction.** La liste des offres est
**fermée** (`ST/remplisseur.py:96-99` `OFFRES_AUTORISEES`, 5 entrées), comme celle des
repères de réassurance (`ST/remplisseur.py:106-113` `REPERES_AUTORISES`, 6 entrées). Une
offre hors catalogue fait **rejeter** la publication (`ST/remplisseur.py:90-93`). Les
tournures d'invention sont filtrées par liste noire (`INTERDITS_INVENTION`,
`ST/remplisseur.py:115-119`).

### 1.4 Combien de temps — mesuré, pas estimé

`TOOLKIT/docs/publications/lot.json` contient les publications produites par la chaîne B
via `ST/lot.py`, avec `duree_s` (posé en `ST/lot.py:69`).

> **Note de mesure — importante.** Ce journal a été **écrasé pendant l'audit** par une
> autre session qui a lancé `rm -rf docs/publications && python3 social_templates/lot.py
> --nombre 6` à 04:43 (processus `1409831`, visible dans `ps`). L'audit a donc lu **deux
> états successifs** du même fichier, et les rapporte tous les deux : c'est une
> **seconde mesure indépendante**, pas une contradiction. Aucune image n'a été générée
> par l'audit lui-même.

**Échantillon 1** — lu à 04:39, 12 publications (dont 10 avec durée) :

| Mesure | Valeur |
|---|---|
| Durées disponibles | 10 sur 12 — les 2 refusées n'ont pas de durée |
| **Total** | **230,1 s** |
| **Moyenne** | **23,0 s** |
| Minimum / maximum | 9,3 s / 56,4 s |
| Publications acceptées | **10 / 12 = 83,3 %** |
| Score de contrôle | 8 × **100**, 2 × **90** |
| Jetons (`total_tokens`) | 4 618 – 10 786, moyenne ≈ 6 700 |

Durées exactes : `19,0 · 34,9 · 12,3 · 25,6 · 9,3 · 56,4 · 28,4 · 11,5 · 9,4 · 23,3` (s).

**Échantillon 2** — lu à 04:45, 6 publications :

| Mesure | Valeur |
|---|---|
| Durées | 6 sur 6 |
| **Total** | **84,3 s** |
| **Moyenne** | **14,1 s** |
| Minimum / maximum | 5,9 s / 20,6 s |

Durées exactes : `6,7 · 19,2 · 20,6 · 13,0 · 18,9 · 5,9` (s).

**Les deux échantillons réunis** : 16 durées, **total 314,4 s, moyenne 19,7 s**,
minimum **5,9 s**, maximum **56,4 s**.

**Jetons consommés** (échantillon 1, `usage`) : `prompt_tokens` 3 642–4 226,
`completion_tokens` 745–7 061. Les 2 refusées ont consommé 7 549 et 5 260 jetons **pour
rien** — les 5 tentatives sont facturées.

**Comparaison annoncé / mesuré** : `COCKPIT:1332` et `COCKPIT:1346` annoncent
« ~10s/image » pendant la génération en lot. La moyenne mesurée est **19,7 s** sur 16
publications, **23,0 s** sur le premier échantillon, avec un **maximum de 56,4 s**. Le
message sous-estime le temps d'attente d'un facteur **≈ 2**, et jusqu'à **5,6×** sur la
publication la plus lente. **Cette sous-estimation est confirmée deux fois, par deux
exécutions distinctes.**

**Le coût en dollars n'est pas établi.** Aucun tarif n'est présent dans le dépôt ;
`COCKPIT:502` affiche « 💰 Économique (0.002$/image) » et `COCKPIT:511`
« 💰 Plus cher (0.005$/image) » ; `APP:1150` écrit
`cost = 0.002 if provider == "deepseek" else 0.005` et `APP:1204` la même constante
par variante — des constantes d'interface, sans source. Les jetons mesurés ci-dessus
sont la seule base chiffrée disponible.

---

## 2. Deux chaînes concurrentes ? — tranché

**Verdict : ni redondantes, ni complémentaires, ni « l'une est morte ». La chaîne A est
morte par décision et vivante par code ; la chaîne B est son remplaçant, branché sur un
bouton sur huit.**

### 2.1 La chaîne A se déclare elle-même morte

`DP:1-25` — l'en-tête du fichier, écrit par son auteur :

> « ⚠️ **LEGACY — DÉPRÉCIÉ le 19/09/2026. NE PLUS UTILISER POUR LES NOUVELLES IMAGES.** »
> « **Ce qui le remplace** : `social_templates/` — gabarits HTML statiques, JSON de
> champs, polices embarquées, contrôle qualité 0-100. Le point d'entrée de production est
> `social_templates/publication.py`. »
> « **Ce qui reste appelé** : plus rien dans le chemin image. »

Les trois raisons que `DP:4-13` donne, et qui sont **toutes vérifiables** :

1. « **Rendu non reproductible** — deux appels produisaient deux mises en page, à
   `temperature=1.15` » → confirmé : `DP:482` `temperature=1.15`, et le layout est tiré
   au sort (`DP:198-203`).
2. « **Hors charte** — le prompt demandait `Archivo + Inter` par le CDN de Google Fonts
   et l'or `#D4AF37`. Le site emploie Cormorant Garamond + DM Sans et `#8a6f38` » →
   confirmé : `DP:467` (voir §3), et `ST/coque/jetons.py:340-341` pour les polices
   réelles.
3. « **Crédit tiers incrusté** — “PHOTO · PEXELS” était écrit dans le livrable » →
   supprimé depuis (`DP:408-412`), voir §3.

### 2.2 …et pourtant elle tourne

**Trois preuves indépendantes, aucune ne dépend d'un commentaire.**

**Preuve 1 — le graphe d'appel.** `V3:194` appelle `design_pipeline.enrich_design_prompt`
depuis `V3:187-206` `_generate_html_via_deepseek`, lui-même appelé par `V3:208-214`
`_generate_image`, lui-même appelé par les six routes listées en §1.1. Aucune de ces
routes n'est commentée ni conditionnée.

**Preuve 2 — le fichier `.webp`.** `IMAGES/PUB-0007.webp` existe (81 Ko). Le seul code du
dépôt qui produit un WebP depuis un PNG est `V3:161-179` (`image_optimizer`, appelé
nulle part ailleurs — `grep` : `V3:162`, `V3:168`). `ST/rendu.py` **n'appelle pas**
`image_optimizer`. La présence de ce `.webp` est donc une signature de la chaîne A.

**Preuve 3 — la couleur.** Mesure plein résolution de `IMAGES/PUB-0007.png`
(3 024 000 pixels, comptage exact à tolérance ±3 par canal) :

| Couleur | Pixels | Part |
|---|---|---|
| `#08080c` — le fond du jeton sombre | 153 285 | 5,07 % |
| **`#000000` — noir pur, absent de la charte** | **1 008 698** | **33,36 %** |
| `#c9a96e` — l'or de la charte | **0** | **0,00 %** |
| `#d4af37` — l'or de la chaîne A | 0 | 0,00 % |

À comparer avec `IMAGES/07-G3-linkedin.png` (chaîne B, même méthode) : `#08080c`
**52,33 %**, `#000000` **0 pixel**, `#c9a96e` **0,213 %**, `#8a6f38` 0,041 %.

**Le noir pur n'appartient à aucun jeu de jetons** — ni `ST/coque/jetons.py:20-60`
(clair), ni `:61-87` (sombre), ni la liste d'autorisation du contrôleur
(`ST/controleur.py:58-83` `COULEURS_AUTORISEES`, qui ne contient que les valeurs de la
charte). Une image produite par la chaîne A **échouerait au contrôle de palette**
(20 points sur 100) et **perdrait aussi les 10 points de logo** (aucun logo, §1.2). Elle
ne perd rien en pratique : la chaîne A n'appelle pas le contrôleur.

### 2.3 Ce qui a réellement changé de camp

| Élément | Chaîne A | Chaîne B |
|---|---|---|
| Décideur du visuel | le LLM (`DP:460`) | le code (`ST/publication.py:65-76`) |
| Reproductible | non — layout tiré au sort (`DP:198-203`) + `temperature=1.15` | oui — hash du texte (`ST/publication.py:75`) et cycle de fonds (`ST/coque/jetons.py:156-163`) |
| Polices | « depuis Google Fonts » dans le prompt (`DP:467`) | 9 `.woff2` locaux en `file://` (`ST/coque/composeur.py:43`) |
| Or de marque | `#D4AF37` (`DP:112`, `DP:250`) | `#c9a96e` sombre / `#8a6f38` clair (`ST/coque/jetons.py:43,69`) |
| Logo | jamais composé (import mort, `DP:34-40`) | SVG procédural, `ST/coque/logo.py:34-48`, 10 pts au contrôle |
| Contrôle qualité | **aucun** | 8 contrôles pondérés, seuil 70 (`ST/controleur.py:46-49`) |
| Validation anti-invention | aucune | catalogue fermé (`ST/remplisseur.py:96-119`) |
| Illustrations | non | 74 SVG, sélection par hash (`SI/selection.py`) |
| Attente de rendu | 2 000 ms fixes (`V3:147`) | 250 ms (`ST/rendu.py:35`) |

### 2.4 La chaîne B n'est pas « moins riche » : trois capacités de la chaîne A ont été perdues sans remplacement

1. **WebP / optimisation de poids.** `image_optimizer.py` (322 lignes) n'est appelé que
   par la chaîne A. Les images de la chaîne B sont **PNG uniquement**.
2. **Variantes A/B.** `/api/design/generate-variants` (`APP:1177`) repose entièrement sur
   `variant_generator.py`, qui tire les 8 layouts / 3 templates / 8 fonds —
   c'est-à-dire **les variables aléatoires de la chaîne A** (`variant_generator.py:48-63`).
   Ces variables n'existent pas dans la chaîne B. Le bouton « variantes » est donc
   l'interface d'une chaîne que l'on veut supprimer.
3. **Trois formats de rendu supplémentaires.** `V3:126-129` gère `facebook 1200×630` et
   `linkedin 1200×627` ; `ST/coque/jetons.py:184-191` ne connaît que `linkedin carre`,
   `facebook carre | paysage`. Les formats sont **compatibles** mais pas identiques
   (627 vs 630).

---

## 3. Les dépendances externes interdites

**Méthode** : `grep -rnoE "https?://…"` sur les 13 fichiers du module + `coque.css` ;
`grep -i "googleapis|fonts.gstatic|@import"` ; `grep -i pexels` sur `.py`/`.css`/`.json`/`.md`.

### 3.1 URLs externes réellement présentes dans le code

Quatre occurrences, **une seule adresse** :

| Fichier:ligne | URL |
|---|---|
| `DP:285` | `https://api.deepseek.com/v1/chat/completions` |
| `ST/remplisseur.py:53` | idem |
| `ST/superviseur.py:226` | idem |
| `ST/vision.py:137` | idem |

Aucune autre URL externe. **Aucun `@import`, aucun `fonts.googleapis.com`, aucun
`fonts.gstatic.com`** dans les fichiers du module.

### 3.2 Pexels — retiré, et vérifié retiré

`grep -i pexels` ne renvoie **aucune occurrence dans du code exécutable**. Les seules
occurrences sont :

- des commentaires d'historique : `DP:12` (l'ancien défaut), `DP:49`, `DP:53` (« Pexels
  RÉACTIVÉ » — note **périmée**), `DP:366`, `DP:408-412` (« PEXELS RETIRÉ ») ;
- la documentation (`PATCH_NOTES.md`, `CORRECTIONS-V6.md`, `AMELIORATION_REPETITION.md`,
  `README.md`, `FIX_PROVIDER_IMAGES.md`) — **dont cinq fichiers qui décrivent encore
  Pexels comme actif** ;
- `config_api.json` (`_comment`) : « Les clés SerpAPI et Pexels ont été retirées le
  18/09/2026 avec leurs modules ».

**Verdict : la dépendance Pexels est supprimée du code. Zéro clé Pexels dans
`config_ia.json` ni `config_api.json`** (`config_api.json` ne contient plus que
`_comment`, `_securite`, `deepseek_key`). Le risque résiduel est **documentaire** : cinq
`.md` décrivent un comportement qui n'existe plus.

### 3.3 Google Fonts — pas d'URL, mais une **instruction** qui en demande

Le code ne contient aucun lien Google Fonts. Mais le prompt de la chaîne A **demande au
modèle** de les employer :

- `DP:467` — « `5. Fonts: Archivo (700,900) + Inter (400,600) depuis Google Fonts` »
- `DP:112` — la tâche du Brand Guardian : « couleurs (#08080A fond, #D4AF37 or, #25D366
  CTA), **polices (Archivo+Inter)**, logo 'eP', frame doré »
- `DP:468` — « Palette : {accent} comme couleur dominante … fond {fond} », sur la table
  des 15 thèmes `#D4AF37`.

**C'est une violation ouverte de la règle « aucune police par CDN »** : chaque image de
la chaîne A est produite à partir d'une consigne qui nomme le CDN. Que le modèle émette
ou non un `<link>` n'est pas établi image par image — **mais la consigne, elle, est
certaine**. Un artefact du dépôt montre que cette consigne a produit du code réel :
`TOOLKIT/test_output_logo.html:7-9` contient

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Inter:wght@400;600&display=swap" rel="stylesheet">
```

— exactement les deux familles et les quatre graisses de `DP:467`/`DP:112`. Ce fichier
n'est pas dans le chemin de production, mais il prouve la sortie effective de la consigne.

**Sortie hors périmètre (signalée pour mémoire, non comptée dans le verdict)** : quatre
pages d'**interface** chargent aussi Google Fonts — `dashboard.html:5` (1 lien),
`build_dashboard.py:203` (1), `wa_send_ready.html:3` (1), `wa_j0_ready.html:3` (1),
et `prospect_scraper.py:471` qui **génère** les deux précédentes (comptage par
`grep -c fonts.googleapis`). Ce ne sont pas des visuels de publication, mais ce sont des
dépendances réseau au rendu, et la refonte SaaS devra trancher.
**`cockpit.html` n'en charge aucune** (`grep -c` → **0**) : il consomme `'DM Sans'` et
`'Outfit'` par nom (`COCKPIT:9,24,34`), c'est-à-dire en s'en remettant aux polices du
poste. C'est un autre sujet — mais il doit être su.

### 3.4 Les deux chaînes face à la règle

| Critère | Chaîne A | Chaîne B |
|---|---|---|
| Police par CDN | **consigne affirmative** (`DP:467`, `DP:112`) | local `file://` (`ST/coque/composeur.py:43`) |
| `@import` / `url(http…)` dans la feuille | s.o. (pas de feuille) | **aucun** — `grep "@import\|url(" ST/coque/coque.css` : 0 résultat |
| Banque d'images tierce | retirée (Pexels) | jamais eu besoin |
| Crédit tiers dans le livrable | retiré | s.o. |
| Logo | fichier absent → jamais composé | SVG procédural, aucun fichier image (`ST/coque/logo.py:20-23`) |
| Illustrations | aucune | 74 SVG locaux (`SI/library.py`) |
| Dépendance réseau au rendu | DeepSeek (génération) | DeepSeek (champs) + **rien au rendu** |

**Le rendu de la chaîne B ne touche pas le réseau : le HTML référence les polices en
`file://`, les illustrations et le logo sont des SVG inline produits par le code.** La
chaîne B respecte la règle. La chaîne A l'enfreint par sa consigne de police.

---

## 4. Les images réellement produites

### 4.1 Inventaire mesuré

`ls IMAGES | wc -l` → **9 fichiers**, `du -sh` → **1,6 Mo** (1 585 Ko).
Dimensions et poids relevés par `PIL`, en lecture.

| Fichier | Format | Dimensions | Poids | Chaîne (prouvée par) |
|---|---|---|---|---|
| `02-G3-facebook.png` | PNG | 2400×2400 | 146 Ko | B — nom `{rang}-{gabarit}-{plateforme}` (`ST/rendu.py:121-123`) |
| `07-G3-linkedin.png` | PNG | 2400×2400 | 159 Ko | B |
| `PUB-0001-G3-facebook.png` | PNG | 2400×2400 | 147 Ko | B |
| `publication-G3-facebook.png` | PNG | 2400×2400 | 131 Ko | B — préfixe `titre or "publication"` (`ST/rendu.py:121-122`) |
| `PUB-0007-G4-facebook-1.png` | PNG | 2400×1260 | 93 Ko | B |
| `PUB-0007-G4-facebook-2.png` | PNG | 2400×1260 | 93 Ko | B |
| `PUB-0007-G4-facebook-3.png` | PNG | 2400×1260 | 108 Ko | B |
| `PUB-0007.png` | PNG | 2400×1260 | **627 Ko** | **A** — noir pur + pas d'or (§2.2) |
| `PUB-0007.webp` | WEBP | 2400×1260 | 81 Ko | **A** — seul `image_optimizer` produit du WebP |

Toutes les dimensions sont **exactement 2× les valeurs de `ST/coque/jetons.py:184-191`** :
2400×2400 = `("facebook","carre")` 1200×1200 × 2 ; 2400×1260 = `("facebook","paysage")`
1200×630 × 2 ; 2160×2700 = `("instagram","portrait")` 1080×1350 × 2 (vu dans
`docs/publications/`). **La chaîne B respecte son contrat de dimensions sur 100 % des
fichiers mesurés.**

### 4.2 Conformité à la charte — mesurée au pixel

Charte déclarée : or `#c9a96e` (`ST/coque/jetons.py:69`) sur fond sombre `#08080c`
(`ST/coque/jetons.py:62`). Comptage exact à tolérance ±3 par canal, pleine résolution.

| Fichier | `#08080c` | `#000000` | `#c9a96e` | `#d4af37` | Verdict |
|---|---|---|---|---|---|
| `07-G3-linkedin.png` | **52,33 %** (3 013 992 px) | **0 px** | **0,213 %** (12 249 px) | 0 px | **conforme** |
| `PUB-0007-G4-facebook-3.png` | **96,52 %** (2 918 795 px) | **0 px** | **1,100 %** (33 255 px) | 0 px | **conforme** |
| `PUB-0007.png` | 5,07 % | **33,36 %** (1 008 698 px) | **0 px** | 0 px | **hors charte** |
| `PUB-0007.webp` | 4,13 % | **33,03 %** | **0 px** | 1 px | **hors charte** |

Trois constats mesurés :

1. **L'or de marque est présent dans les images de la chaîne B, absent de celles de la
   chaîne A.** 12 249 et 33 255 pixels d'or exact contre **zéro**.
2. **Le noir pur `#000000` n'existe que dans les images de la chaîne A** : 0 pixel dans
   les images de la chaîne B, 1 008 698 pixels dans `PUB-0007.png`.
3. **L'or est un accent, pas un aplat** : 0,21 % à 1,10 % des pixels. C'est cohérent avec
   la charte (« or sur fond sombre » décoratif : filets, étiquettes, chiffres), mais cela
   signifie que **la marque ne pèse quasiment rien en surface** — à trancher en refonte.

Mesuré aussi, sur les images de `docs/publications/` : 24 PNG, 3 471 Ko, de
81 Ko (`08-G4-facebook-1.png`) à 228 Ko (`05-G1-whatsapp.png`) ; et 29 PNG dans
`docs/gabarits/` (1 986 Ko) — la planche de contrôle `ST/planche.py`.

> **Fenêtre de mesure.** Ces deux derniers chiffres ont été relevés à **04:40**, avant que
> la session concurrente ne fasse `rm -rf docs/publications` à 04:43 (§1.4). L'état actuel
> du dossier diffère : 20 fichiers, un lot de 6. `assets_pubs/` (§4.1) et
> `docs/gabarits/` n'ont **pas** été touchés et restent valides. Les dimensions et la
> conformité de couleur documentées ici ne dépendent pas du nombre de fichiers : elles
> portent sur des fichiers nommés et cités nommément.

**Toutes les images de la chaîne B passent le contrôle de palette du contrôleur** — ce
n'est pas une hypothèse : le contrôleur refuse toute couleur hors de
`COULEURS_AUTORISEES` (`ST/controleur.py:58-83`), qui ne contient que les jetons, et le
score `palette` vaut **20/20** dans les 10 rapports de `lot.json`.

### 4.3 Un défaut mesuré dans les rapports de contrôle eux-mêmes

`docs/publications/lot.json`, rapport de `00-G1-linkedin.png` (score **90**, accepté) :

```json
"manques": {"occupation": ["le texte occupe 40.4 % de l'image (max 30 %)"]},
"detail": {"palette": 20, "contraste": 20, "tailles": 15, "logo": 10,
           "occupation": 0, "emoji": 10, "pouce": 10, "chevauchement": 5}
```

Le texte occupe **40,4 %** pour un maximum déclaré de **30 %** : le contrôle le détecte,
retire 10 points — et **accepte quand même** la publication, parce que 90 ≥ 70. Le seuil
global ne peut pas rattraper un dépassement franc d'un critère individuel. **Un visuel
trop chargé passe.** Deux publications sur douze sont dans ce cas (les deux à 90).

---

## 5. Les écrans et les parcours

### 5.1 Les écrans qui produisent des visuels

| Écran | Élément | Ligne `COCKPIT` | Route appelée | Chaîne |
|---|---|---|---|---|
| Overlay Publications | « 🖼️ Image » (par ligne) | `:1094` → `genImage()` `:1127` | `POST /api/publications/<id>/image` | **B** |
| Overlay Publications | « 🖼️ Toutes les images » | `:781` → `genAllImages()` `:1331` | `POST /api/publications/generate-all-images` | **A** |
| Overlay Publications | « 🖼️ Recréer images » | `:782` → `genAllImagesForce()` `:1347` | idem, `{force:true}` | **A** |
| Modale « Quick Design » | génération à la volée | `:1697` | `POST /api/design/generate-image` | **A** |
| Modale « Quick Design » | « 3 variantes A/B » | `:1741` | `POST /api/design/generate-variants` | **A** |
| Modale « Quick Design » | « 🎬 Convertir en vidéo » | `:1713` | `POST /api/design/image-to-video` | vidéo |
| Actions rapides | « batch vidéo » | `:2136` | `POST /api/quick/batch-video` | vidéo |

**`grep -n "api/social" COCKPIT` ne renvoie aucun résultat.** Les deux routes de la
chaîne B les plus intéressantes pour un lot — `/api/social/articles` et
`/api/social/generer` (`APP:703`, `APP:713`) — **n'ont aucun bouton**. Elles répondent
(interrogées en lecture sur 8788 : l'API renvoie les articles publiés avec leur gabarit
et leur objectif proposés), mais l'utilisateur ne peut pas les atteindre depuis
l'interface.

### 5.2 Le parcours réel pour produire les visuels d'un lot de 7 publications

L'unité de travail n'est pas « un lot » : c'est **une publication** ou **toutes**.
`publications.csv` contient **7 lignes** (vérifié : `GET /api/publications` →
`count: 7`), et l'interface n'offre aucune sélection « les 7 d'un lot ».

**Chemin unitaire — 7 clics, 7 attentes bloquantes, chaîne B.**

1. Ouvrir l'overlay Publications (1 clic).
2. Cliquer « 🖼️ Image » sur la ligne `PUB-0001` → `genImage` (`COCKPIT:1127-1136`) émet
   un `fetch` **bloquant** vers `APP:638`. Toast « ⏳ Génération image… » — **sans
   progression, sans pourcentage, sans annulation**.
3. Attendre. `publication.py` enchaîne : appel DeepSeek (jusqu'à 3 tentatives), jusqu'à
   8 lancements de Chromium (§6, F4), puis appel au superviseur éditorial.
4. Recommencer pour `PUB-0002` … `PUB-0007` → **7 clics + 7 attentes**.

**Chemin de lot — 2 clics, chaîne A.**
« 🖼️ Toutes les images » → `confirm()` (`COCKPIT:1332`) → un `fetch` unique. Le serveur
boucle **en série** sur les 7 publications (`APP:2085-2143`). Un seul toast à la fin.
**Aucune progression pendant toute la durée du lot.** Le message annonce « ~10s/image »
(temps réel mesuré : 23,0 s ; §1.4) — et sur **la mauvaise chaîne**.

**Un troisième chemin, le seul qui soit pensé pour un lot, n'est pas dans l'interface.**
`ST/lot.py` produit 20 publications d'affilée avec un registre, un anti-doublon, une
réutilisation de navigateur et un journal (`docs/publications/lot.json`). Il s'utilise en
ligne de commande : `python3 social_templates/lot.py --nombre 20` (`ST/lot.py:26`).

### 5.3 Ce qui se passe en cas d'échec

| Chemin | Comportement | Où c'est visible | Durabilité |
|---|---|---|---|
| Chaîne B, unitaire | HTTP 500 avec `error`, et `Erreur = "Image : …"` écrit dans le CSV | toast (`COCKPIT:1134`) **+** colonne `Erreur` | CSV |
| Chaîne A, lot | comptage `generated` / `skipped` / `failed` ; `Erreur` par publication (`APP:2140-2143`) | toast, **mais `COCKPIT:1337` n'affiche que `.slice(0,2)`** — au plus **2** échecs détaillés | CSV |
| Chaîne A, `retry-failed` | relance générique en `gen_citation` | toast | CSV |
| Batch vidéo | **`except: continue`** (`APP:1607`) puis `ok=True` inconditionnel (`APP:1612`) | **rien** | aucune |

Trois défauts d'usage majeurs, tous prouvés :

1. **Le détail des échecs est tronqué à 2.** Un lot qui échoue sur 5 publications en
   montre 2. L'utilisateur doit ouvrir le CSV.
2. **`/api/quick/batch-video` ne signale jamais un échec.** Le `except:` nu avale
   l'exception, et la réponse est `ok=True` quel que soit le nombre de conversions
   réussies — y compris **zéro**.
3. **Aucun moyen de réessayer ce qui a échoué, par la chaîne qui a échoué.**
   `/api/quick/retry-failed` (`APP:1618`) relance **en `gen_citation`** (chaîne A) une
   publication qui a échoué en chaîne B — donc avec l'autre charte.

### 5.4 Deux contradictions visibles à l'écran

**L'interface propose un fournisseur qui n'existe plus.** `COCKPIT:502-512` affiche deux
choix radio : « 🤖 DeepSeek — RECOMMANDÉ » et « 🧠 **Claude Sonnet 5** — PREMIUM », avec
« 0.005$/image ». Or `APP:1046-1057` rejette toute valeur autre que `deepseek` :

> « Provider doit être 'deepseek' — la passerelle Claude a été retirée » (HTTP 400)

et `DP:62-65` le confirme : « la passerelle Claude a été RETIRÉE (décision
propriétaire) ». `selectProvider('claude')` (`COCKPIT:1598-1605`) met bien à jour le
style du bouton ; l'enregistrement, lui, échoue. **L'utilisateur peut sélectionner une
option que le serveur refusera, et rien ne l'en empêche.**

**Les deux boutons de la même barre produisent deux chartes.** `COCKPIT:781-782` : deux
boutons voisins, libellés de la même famille (« Toutes les images », « Recréer
images »), l'un à côté de l'autre. Le premier passe par `V3`+`DP`, le second aussi. La
publication voisine, à un clic dans la même liste, passe par `ST`. **Rien dans
l'interface ne distingue les deux résultats, alors que la mesure les distingue
totalement** (§4.2).

---

## 6. Les défauts, classés par ce qu'ils coûtent

Classement par coût décroissant : ce que le défaut fait perdre en argent, en temps, ou en
confiance dans le résultat. « Fonctionnel » = le résultat est faux. « Usage » = le
résultat est bon mais l'utilisateur ne peut pas le savoir ou l'obtenir.

Les treize défauts, dans l'ordre de lecture. Les identifiants sont **stables** et ne se
suivent pas : ils sont groupés par coût, pas par gravité d'affichage.

| # | Défaut | Nature | Coût principal |
|---|---|---|---|
| **F1** | Six routes produisent par une chaîne déclarée morte | Fonctionnel | Argent — images hors charte, génération HTML refacturée |
| **F2** | Les images de la chaîne gabarits ne sont pas vues comme existantes | Fonctionnel | Argent — régénération et refacturation |
| **F3** | Un carrousel n'est contrôlé que sur sa 1ʳᵉ slide | Fonctionnel | Qualité — 68 % des images d'un lot non contrôlées |
| **F4** | Zéro réutilisation du navigateur dans le chemin du cockpit | Fonctionnel | Temps — jusqu'à 8 lancements de Chromium par carrousel |
| **F10** | Reprises vidéo et d'image qui avalent leurs erreurs | Usage | Confiance — succès annoncé sans conversion |
| **F8** | Temps annoncé 2,3× inférieur au temps mesuré | Usage | Confiance — « ~10s/image » contre 23,0 s mesurées |
| **F11** | Coûts affichés sans source | Usage | Confiance — compteur de dépense non adossé |
| **F5** | Compteur d'essais perdu sur le chemin du cockpit | Usage | Diagnostic — 1 ou 3 appels, indistinguables |
| **F6** | Documentation du contrôleur fausse | Usage | Correction — `TypeError` pour qui suit le docstring |
| **F12** | Claude proposé dans l'interface, refusé par le serveur | Usage | Confiance — option sélectionnable qui échoue |
| **F9** | Vert WhatsApp employé hors WhatsApp | Décision | À conserver explicitement, pas à corriger |
| **F13** | Code en exécution ≠ version annoncée ; 5 thèmes contre 15 | Fonctionnel | Repli silencieux de couleur par défaut |
| **F7** | La chaîne A produit sans logo et croit le contraire | Fonctionnel | Marque absente de l'image |

### Coût 1 — de l'argent dépensé pour des images hors charte, à chaque lot

**F1 — Six routes produisent par une chaîne que son auteur déclare morte.**
*Preuve* : `DP:2` (« NE PLUS UTILISER »), `V3:194` (l'appelle), `APP:2114-2127`,
`APP:1135-1143`, `APP:1504`, `APP:1642`, `variant_generator.py:46`.
*Cause* : la dépréciation est un texte dans un docstring. Aucun `raise`, aucun drapeau,
aucun avertissement. Rien n'empêche un appelant de continuer.
*Coût mesuré* : chaque image de lot est **hors charte** (33,4 % de noir pur, 0 px d'or,
aucun logo) et consomme une génération HTML jusqu'à `max_tokens=4000` × 3 tentatives.
**Fonctionnel.**

**F2 — Les images de la nouvelle chaîne ne sont pas reconnues comme existantes : elles
sont payées deux fois.**
*Preuve* : `APP:2048-2066` `_image_exists_for_pub` teste `{id}.png`,
`{id}_slide_*.png`, `{id}/slide_*.png` — les conventions de nommage de la **chaîne A**.
La chaîne B nomme `{id}-{gabarit}-{plateforme}.png` (`ST/rendu.py:121-123`).
*Vérification exécutée* : pour `PUB-0001`, dont l'image `PUB-0001-G3-facebook.png`
existe, la fonction renvoie **`None`** (direct `False`, slides `0`, sous-dossier `0`).
*Coût* : le bouton « Toutes les images » régénère et refacture des visuels déjà produits.
**Fonctionnel.**

### Coût 2 — le contrôle qualité ne couvre pas la majorité des images d'un lot

**F3 — Un carrousel n'est contrôlé que sur sa première slide.**
*Preuve* : `ST/publication.py:232` et `ST/lot.py:68` passent tous deux **`fichiers[0]`**.
Or `controleur.controler` reconstruit le document mesuré par
`documents(resultat, theme)[0]` (`ST/controleur.py:275-281`) : la mesure **est** celle de
la première slide. Un carrousel G4 produit **7 documents** sur Instagram et LinkedIn, 3
sur Facebook (`ST/gabarits/g4_carrousel.py:100-109`).
*Coût* : les slides 2 à 7 ne sont jamais notées. L'auteur du module le sait et l'écrit :
« les six carrousels produisent **30 des 44 images** » (`ST/gabarits/g4_carrousel.py:93`)
— **68 % des images d'un lot échappent au contrôle**, et le score publié décrit la
couverture. Les 2 refus observés dans `lot.json` sont tous deux des **G3** (image unique) :
le point aveugle n'a pas encore été exercé. **Fonctionnel.**

### Coût 3 — du temps d'attente, sur le chemin que l'utilisateur emprunte

**F4 — Zéro réutilisation du navigateur dans le chemin du cockpit.**
*Preuve* : `ST/publication.py:222-228` `_rendre` appelle
`rendu.rendre_publication(resultat, dossier)` **sans `navigateur`** ; `ST/rendu.py:58-62`
lance alors un Chromium **par fichier** ; puis `ST/publication.py:232` appelle
`controleur.controler(fichiers[0], resultat)` **sans `navigateur`**, et
`ST/controleur.py:294-299` en lance un **de plus**.
*Coût* : un carrousel de 7 slides = **8 lancements de Chromium** pour une publication.
Le chemin de lot fait l'inverse et le documente : un seul navigateur ouvert
(`ST/lot.py:97-99`) et réutilisé (`ST/lot.py:66,68,71`), précisément parce que
« Playwright refuse deux contextes `sync_playwright()` imbriqués »
(`ST/rendu.py:44-48`). **Fonctionnel (temps).**

**F10 — Les reprises vidéo et les reprises d'image avalent leurs erreurs.**
*Preuve* : `APP:1604-1608` — `/api/quick/batch-video` : `try: vmg.animate_image(...) …
except: continue`, puis `APP:1612` — `return jsonify(ok=True, converted=…,
count=len(converted))` **sans test de `count`**. Même motif en `APP:1651-1653` —
`/api/quick/retry-failed` : `except: continue` par publication, et la réponse ne compte
que les réussites (`retried`) sans nommer les échecs.
*Coût* : l'utilisateur peut lire « 0 vidéos créées » avec un voyant vert, ou croire à un
succès complet quand 6 conversions sur 8 ont échoué. **Usage.**

### Coût 4 — la confiance dans les chiffres affichés

**F8 — Le temps annoncé est ~2× inférieur au temps mesuré.**
*Preuve* : `COCKPIT:1332` et `COCKPIT:1346` — « (DeepSeek + 5 agents, ~10s/image) ».
Mesure : **19,7 s de moyenne sur 16 publications** (deux échantillons, §1.4),
**23,0 s** sur le premier, maximum **56,4 s**.
*Coût* : l'utilisateur croit lancer ~70 s d'attente pour 7 publications et en subit
**138 s** en moyenne, jusqu'à **395 s** si les sept tombent sur le cas le plus lent.
**Usage.**

**F11 — Les rapports d'interface affichent des coûts sans source.**
*Preuve* : `APP:1150` — `cost = 0.002 if provider == "deepseek" else 0.005`, et
`APP:1204` pour les variantes ; `COCKPIT:502` — « 💰 Économique (0.002$/image) »,
`COCKPIT:511` — « 💰 Plus cher (0.005$/image) ». Aucun tarif n'existe dans le dépôt
(`grep` : aucune table de prix).
*Coût* : un compteur de dépense qui n'est adossé à rien. **Usage.**

**F5 — Le compteur d'essais est perdu sur le chemin du cockpit.**
*Preuve* : `ST/publication.py:113` —
`resultat["champs"], resultat["erreurs"], resultat["essais"] = champs, erreurs, resultat["essais"]` :
la variable s'auto-affecte la valeur initialisée à `0` (`ST/publication.py:107`).
`_remplir_avec_reprises` (`:198-215`) exécute pourtant jusqu'à **3 tentatives** et ne
renvoie jamais ce nombre.
*Coût* : impossible de savoir depuis le cockpit si une image a demandé 1 ou 3 appels.
Dans `lot.json`, le vrai compteur atteint **5** — et c'est le signal qui distingue une
publication difficile d'une publication refusée. **Usage.**

### Coût 5 — petits, mais à corriger en refonte

**F6 — La documentation du contrôleur est fausse.**
`ST/controleur.py:24` documente `controler(chemin_png, largeur, hauteur, resultat)` ;
la signature réelle est `controler(chemin_png, resultat, theme=None, navigateur=None)`
(`ST/controleur.py:260`). Un appelant qui suit le docstring obtient un `TypeError`.
**Usage.**

**F12 — L'interface propose Claude comme fournisseur alors que le serveur le refuse.**
`COCKPIT:502-512` contre `APP:1046-1057` (`HTTP 400`) et `DP:62-65`. **Usage.**

**F9 — Le vert WhatsApp `#25D366` est employé partout, y compris hors WhatsApp.**
`ST/coque/jetons.py:53-57` et `:76-80` : le jeton existe « UNIQUEMENT là où l'on propose
WhatsApp », mais le commentaire du module note que « **Les affiches l'emploient partout,
y compris sur Instagram — c'est une décision que je ne reprends pas** ». Ce n'est donc
pas un défaut à corriger : c'est **une décision à conserver explicitement** dans la
refonte, faute de quoi elle sera perdue. **Usage / décision.**

**F13 — Le code en exécution n'est pas la version annoncée.**
`GET /api/system-check` renvoie `all_ok: false` avec
« Piliers éditoriaux : 15 (dont veille-ia, strategie) — *15 piliers seulement — version
ancienne (5 attendus → 12 → 14)*, `fix: remplace content_engine.py par la version 5.0.6` ».
*Effet sur ce module* : `DP:249-265` `THEME_COLORS` déclare **15** piliers, `V3:116-122`
`THEMES` en déclare **5** (compté sur les deux fichiers). Si `content_engine` en produit
un 16ᵉ ou un 15ᵉ hors table, `V3.get_theme` (`V3:124`) retombe silencieusement sur
`cas-client`. **C'est une table de couleurs par défaut qui ne dit pas son nom.**
**Fonctionnel, dépendance inter-modules.**

**F7 — La chaîne A produit des images sans logo, et croit le contraire.**
`V3:32-35` affirme que les logos de `branding/logos/generated/` sont utilisés ;
`DP:34-35` importe `branding_helper` et `logo_composition`, **fichiers absents**
(seules existent leurs versions `.disabled`) → `DP:39-40` positionne les deux drapeaux à
`False` ; `DP:426`/`DP:469` interdisent le logo dans le HTML ; `get_last_logo_position()`
(`DP:525-527`) n'est appelé que par un test. Et `branding/logos/generated/` ne contient
que trois favicons. **Fonctionnel.**
*Note* : la chaîne B, elle, porte le logo — mesuré : `logo: 10/10` dans les 10 rapports
acceptés de `lot.json`, produit par `ST/coque/logo.py:34-48` (SVG procédural).

---

## 7. Ce qui doit survivre, fusionner, mourir

### 7.1 SURVIVRE — sans modification de fond

| Élément | Preuve de sa valeur |
|---|---|
| `ST/coque/jetons.py` (353 l.) | source unique des couleurs, polices, canvas, échelle typographique ; **toutes les valeurs viennent de `assets/css/eperf.css` du site** (`ST/coque/jetons.py:2-6`) — c'est le lien qui empêche la dérive de charte |
| `ST/coque/composeur.py` + `coque.css` | `@font-face` en `file://` (`:43`), zéro valeur littérale (`:12-17`), zéro `url(http…)` vérifié |
| `ST/coque/logo.py` | logo SVG procédural, **aucun fichier image**, suit le thème par les jetons (`:20-23`) |
| `ST/gabarits/g1…g5` | 5 gabarits, 15 déclinaisons plates-formes vérifiées, champs bornés, décision documentée (`ST/gabarits/__init__.py:11-15`) |
| `ST/remplisseur.py` | catalogue d'offres **fermé** (`:96-99`), repères **fermés** (`:106-113`), liste noire d'invention (`:115-119`), cycle d'objectifs déterministe (`:70-84`) |
| `ST/controleur.py` | 8 contrôles pondérés sur le **rendu réel** mesuré dans Chromium (`:2-6`), seuil 70 |
| `ST/superviseur.py` | le seul juge de ce qui ne se mesure pas — angle, accroche, promesse, répétition de lot (`:12-30`) |
| `ST/rendu.py` | un moteur, un contrat : `device_scale_factor=2`, `file://`, navigateur réutilisable |
| `ST/publication.py` | le pont : deux entrées réelles, gabarit déterministe par hash |
| `ST/lot.py` | le seul chemin pensé pour un lot : un navigateur, un registre, un journal, un anti-doublon |
| `SI/` (5 modules) | **74 illustrations SVG**, 20 planches dont 12 sectorielles, moteur de contrôle (`SI/engine.py`), sélection stable par hash (`SI/selection.py`) — la brief annonçait 26 SVG ; **le mesuré est 74** |
| `ST/polices/` (9 `.woff2`, 460 Ko) | embarquées, aucun CDN |
| `video_micro_generator.py` | **le seul moteur vidéo réellement branché** (`APP:1234`, `APP:1587`) et le seul qui fonctionne — `ffmpeg` et `ffprobe` sont présents (`/usr/bin/ffmpeg`, `/usr/bin/ffprobe`) |

### 7.2 FUSIONNER — matière à récupérer avant suppression

| Élément | Ce qu'on en garde | Où |
|---|---|---|
| `image_optimizer.py` (322 l.) | l'optimisation de poids (WebP, `quality=85`) ; **la chaîne B ne l'appelle jamais** | à brancher dans `ST/rendu.py` |
| `V3._render` (`V3:133-183`) | rien — déjà recopié, et `ST/rendu.py:4-7` le dit : « Le moteur de rendu est celui qui existait déjà (`image_generator_v3._render`) » | — |
| `V3:126-129` `SIZES` | les 2 formats que `jetons.CANVAS` ne couvre pas : `facebook 1200×630` (présent) et `linkedin 1200×627` (≠ 1200×1200 en B) — **à réconcilier, pas à supprimer** | `ST/coque/jetons.py:184-191` |
| Les 5 personas `agents/design|marketing|research/*.md` (`DP:101-122`) | leur contenu **de charte** (couleurs, polices, hiérarchie) — mais ce contenu appartient désormais aux jetons, pas à un prompt. Les personas sont tronquées à 800 caractères (`DP:399`) : elles n'ont plus de pouvoir prescriptif | jeter après extraction |
| `DP:184-193` les 8 layouts | rien : les 5 gabarits les remplacent par des structures **testables** | — |
| `DP:128-171` les 3 templates signature | les **noms** et l'intention (gold / neon / edu) comme vocabulaire de thème, si la refonte veut plusieurs habillages | `ST/coque/jetons.py` |
| `variant_generator.py` | l'**intention** A/B (comparer deux visuels) ; la mécanique (tirer layout/template/fond) n'a plus d'objet | à repenser sur les gabarits |
| `metrics_tracker.py` | le suivi de génération (`duration`, `cost`, `success`, `pillar`, `platform`, `layout`) est appelé par `APP:1152-1162` et `APP:1207-1217` — à conserver en le rebranchant sur des coûts **mesurés** | — |
| Les 5 `.md` qui décrivent Pexels/Google Fonts comme actifs | rien : à marquer périmés | `PATCH_NOTES.md`, `CORRECTIONS-V6.md`, `AMELIORATION_REPETITION.md`, `README.md`, `FIX_PROVIDER_IMAGES.md` |

### 7.3 MOURIR — et pourquoi

| Élément | Lignes | Raison de la mort | Preuve |
|---|---|---|---|
| `design_pipeline.py` | 545 | **se déclare mort lui-même** ; sa seule action restante est un prompt HTML qui demande des polices par CDN et un or hors charte | `DP:2-25`, `DP:467`, `DP:112` |
| `image_generator_v3.py` | 319 | coquille dont le seul travail est d'appeler `DP:194` ; son moteur de rendu a déjà été recopié dans `ST/rendu.py` | `V3:194`, `ST/rendu.py:4-7` |
| `image_generator.py` (v2 Pillow) | 611 | joignable seulement en `except ImportError` (`APP:31`) et par du code mort ; **contredit la décision « zéro fallback »** : si l'import de `V3` échoue, l'application bascule en silence sur des gabarits Pillow | `V3:16-29` contre `APP:28-32` |
| `variant_generator.py` | — | ne sait produire que les variables aléatoires de la chaîne A (8 layouts, 3 templates, 8 fonds) et importe `V3` | `variant_generator.py:46,48-63` |
| `video_generator.py` | 271 | **importé par personne** (`grep` : 0 appelant) et **cassé** : `video_generator.py:80,110` appellent `ig.gen_reel_cover(..., gradient=…)` alors que `image_generator.gen_reel_cover` (`:506`) n'a pas ce paramètre (seul `gen_citation` l'a, `:259`) | `grep`, `image_generator.py:506` |
| `branding_helper.py`, `logo_composition.py`, `branding_config.json` | — | **n'existent plus** ; seules leurs versions `.disabled` subsistent, et `DP:34-35` les importe encore | `ls` |
| `test_output_logo.html` | — | artefact contenant de vrais liens Google Fonts, preuve d'une sortie hors charte | `:7-9` |
| Les boutons « variantes A/B » et « Claude Sonnet 5 » | — | interfaces d'un monde qui n'existe plus | `COCKPIT:502-512`, `:1741` |

---

## 8. Ce que le module doit devenir dans le dashboard SaaS unifié

Périmètre : **fonctionnel seulement**. Les écrans cibles sont décrits par ce qu'ils font.

### 8.1 Le principe qui doit structurer l'écran

**Aujourd'hui, la chaîne dépend du bouton.** Demain, **la chaîne est unique** : le
gabarit. Ce que l'utilisateur choisit, c'est un **objectif** et une **plateforme** — le
gabarit en découle (`ST/gabarits/__init__.py:31-43` `pour_objectif`), et le champ
`Format` du CSV n'a plus à piloter le rendu.

### 8.2 Écran 1 — « Visuels » (file de production)

**Rôle** : voir l'état visuel de toutes les publications, et produire ce qui manque.

- Une **liste** avec, par publication : vignette, plateforme, gabarit, **score de
  contrôle** et **état** (produite / refusée / absente). L'état vient du disque, pas
  d'une supposition — et la détection doit connaître les noms de la chaîne gabarits
  (`{id}-{gabarit}-{plateforme}.png`), ce que ne fait pas `APP:2048-2066` (F2).
- **Un bouton unique « Produire »** : fonctionne par sélection (1..n) et par lot. Une
  seule chaîne. L'option « tout » ne doit plus exister séparément (F1, F8).
- **Une progression réelle** : publication en cours, n/N, et **temps écoulé contre temps
  estimé** — l'estimation doit venir du journal mesuré (§1.4, 23,0 s de moyenne), pas
  d'un « ~10s » écrit à la main (F8).
- **Les échecs en clair, tous, avec leur motif.** Le contrôle éditorial refuse pour une
  raison précise (« *trop générique — aucun chiffre, aucune question, aucun
  contraste* », `lot.json`) : cette phrase doit être **lisible et actionnable** dans
  l'écran, pas tronquée à 2 lignes (F, §5.3).
- **Un bouton « Reprendre »** qui relance **la publication et le champ** refusés, sur la
  même chaîne — jamais un `gen_citation` générique (§5.3, défaut 3).

### 8.3 Écran 2 — « Fiche visuel » (une publication)

**Rôle** : voir, juger, régénérer, approuver une image.

- **L'image en grand** + sa **vignette « test du pouce »** — le module sait déjà la
  produire (`ST/rendu.py:134-162` `miniature`, échelle 12 %) et le contrôleur la note
  (`pouce: 10`).
- **Le rapport de contrôle déplié** : les 8 postes et leurs points, avec les manques
  écrits (`ST/controleur.py:46-49`). En particulier **le dépassement d'occupation** :
  mesuré 40,4 % pour un maximum de 30 % et accepté — le rapport doit rendre ce conflit
  visible, et le seuil doit **refuser** un dépassement de critère au lieu de le diluer
  dans une note globale (§4.3).
- **Toutes les slides, contrôlées une par une.** La fiche doit afficher 7 rapports pour
  un carrousel, pas un seul (F3). C'est la correction qui rapporte le plus : **68 % des
  images d'un lot sont des slides de carrousel** (`ST/gabarits/g4_carrousel.py:93`).
- **Le verdict éditorial** (angle, accroche, promesse) séparé du verdict technique, tel
  que le module le produit déjà (`ST/superviseur.py:201-242`) — et les deux doivent
  passer pour qu'une publication soit publiable (`ST/publication.py:246`
  `resultat["publie"]`).
- **Le nombre d'essais réellement consommés.** Le module le calcule déjà
  (`ST/remplisseur.py:938-939` `resultat["essais"] = essai`) ; il est perdu au passage
  (`ST/publication.py:113`, F5).

### 8.4 Écran 3 — « Gabarits & charte » (lecture, réglage)

**Rôle** : un seul endroit où la charte existe.

- **Les jetons** : les couleurs, les 9 polices, les 6 canvas, l'échelle typographique —
  affichés depuis `ST/coque/jetons.py`, la source unique. Toute modification se fait
  **là**, jamais dans un gabarit (`ST/coque/jetons.py:12-13` : « un gabarit ne réécrit
  pas une couleur »).
- **La matrice gabarit × plateforme × format** — les 15 déclinaisons existantes, et les
  **absences assumées** (`ST/gabarits/__init__.py:11-15` : « une combinaison absente n'est
  pas un oubli, c'est une décision »). L'écran doit montrer la décision, sinon elle sera
  lue comme un trou.
- **La bibliothèque d'illustrations** : les 74 SVG, groupés par planche (20 planches,
  12 sectorielles), avec la règle de sélection par hash affichée (`SI/selection.py`).
- **Les décisions de marque à ne pas perdre** : le vert WhatsApp réservé aux offres
  WhatsApp, sauf décision explicite contraire (`ST/coque/jetons.py:53-57`, F9) ; l'or
  comme accent et non comme aplat (mesuré 0,2–1,1 % des pixels, §4.2).

### 8.5 Écran 4 — « Diagnostic visuel »

**Rôle** : savoir en un coup d'œil si la production peut tourner, avant de cliquer.

- **Playwright/Chromium**, **clé DeepSeek**, **`social_templates`**, **`ffmpeg`** pour la
  vidéo — les quatre dépendances réelles. `V3:279-288` `get_diagnostics()` et
  `APP:1921-…` `/api/system-check` en fournissent déjà la matière ; il faut les
  **fusionner en un seul écran** au lieu de deux diagnostics partiels.
- **Un contrôle de version inter-modules.** `system-check` signale déjà que le
  `content_engine` en exécution est une version ancienne (« 15 piliers seulement »,
  F13) : une publication produite avec un pilier absent de `V3:116-122` tombe
  silencieusement sur `cas-client`. L'écran doit le dire **avant** la génération.
- **Un coût réel, pas un tarif en dur.** Les jetons par publication sont mesurés et
  journalisés (`lot.json` : 4 618–10 786 `total_tokens`). C'est la seule base honnête
  pour un compteur de dépense (F11).

### 8.6 Ce que la refonte doit supprimer de l'interface

| À retirer | Preuve |
|---|---|
| Le bouton « Recréer images » distingué de « Toutes les images » | les deux appellent la même route, seul `force` change (`COCKPIT:1331` vs `:1347`) ; avec une chaîne unique, « recréer » est une case à cocher sur « Produire » |
| Le sélecteur de fournisseur, ou sa réduction à un affichage | `APP:1046-1057` n'accepte que `deepseek` ; `DP:62-65` documente le retrait (F12) |
| Le bouton « variantes A/B » tel quel | il ne sait produire que les variables de la chaîne morte (`variant_generator.py:48-63`) |
| Les libellés « DeepSeek + 5 agents » | les 5 personas sont tronquées à 800 caractères (`DP:399`) et n'ont plus de pouvoir ; la chaîne B a 2 rôles réels : extracteur (`ST/remplisseur.py`) et juge (`ST/superviseur.py`) |
| Le format `Format` du CSV comme pilote du rendu | mesuré : `PUB-0001` est déclarée `carousel-3` et reçoit un **G3** (§5.1) ; le gabarit découle désormais de l'objectif et de la plateforme |

---

## 9. Ce qui n'a pas pu être établi

Par honnêteté de méthode, ces points restent **non établis** — ils demandent soit une
génération (interdite pour cet audit), soit une source absente du dépôt.

1. **Le coût en dollars d'une image.** Aucun tarif DeepSeek n'est présent dans le dépôt.
   Les 0,002 $ et 0,005 $ affichés (`APP:1150` et `APP:1204`, `COCKPIT:502` et `:511`) sont des
   constantes d'interface sans source. Seuls les **jetons** sont mesurés.
2. **Le temps d'une image sur la chaîne A.** Aucune durée n'est journalisée pour `V3`.
   Les 23,0 s mesurées portent sur la chaîne B via `ST/lot.py` (`lot.json`). Les deux
   chaînes ne sont donc **pas** comparées en temps.
3. **Le nombre exact de lancements de Chromium par image.** Déduit du code (`ST/rendu.py:58-62`
   par fichier, `ST/controleur.py:294-299` pour le contrôle) et de la structure de
   `ST/publication.py:222-232`. Non mesuré à l'exécution.
4. **Le contenu HTML réellement produit par DeepSeek pour chaque image de la chaîne A.**
   Les fichiers HTML temporaires sont supprimés (`ST/rendu.py:64`) ou jamais conservés en
   chaîne A. Seul `test_output_logo.html` subsiste, comme artefact.
5. **Le comportement de la chaîne A sur un pilier absent de sa table de 5 thèmes.**
   `V3:124` `get_theme` retombe sur `cas-client` — le repli est lu dans le code, mais son
   effet visuel n'a pas été observé.
6. **L'état du module au moment de la refonte.** `assets_pubs/` ne contient que
   **9 fichiers pour 7 publications**, dont 2 publications illustrées (`PUB-0001`,
   `PUB-0007`) et 5 sans aucune image. L'état réel de la production est donc très
   partiel — ce qui est un constat en soi, mais ne dit rien de la qualité du module.
7. **Le taux de refus en régime stable.** Les 16,7 % de refus sont mesurés sur **un seul
   échantillon de 12** (le premier, §1.4) ; l'échantillon de 6 publié ensuite n'a **pas**
   été lu assez longtemps après sa fin pour que son taux soit exploitable — et son
   `lot.json` a été réécrit pendant l'audit. **Un taux de refus n'est pas établi ; il est
   observé une fois.**
8. **L'identité de la session concurrente.** Le processus `1409831`
   (`rm -rf docs/publications && python3 social_templates/lot.py --nombre 6`, lancé à
   04:43) appartient à une autre session d'agent
   (`sess_6be89155-201a-462d-a8dc-0210c352f2b7`) : l'audit voit son effet, pas son
   intention. Il n'a **pas** été interrompu — l'audit n'a tué aucun processus.
