# AUDIT FONCTIONNEL ET UX — M1 « ACQUISITION ET PIPELINE DE PROSPECTION »

> Périmètre : le module d'acquisition et de pipeline de prospection du toolkit ePerformance
> (`/home/ballo/OX6A/toolkit_eperformance/`), audité en vue de son absorption dans un dashboard
> SaaS unifié.
> Date de l'audit : 2026-09-19. Aucune spéculation : chaque affirmation est traçable à un
> `fichier:ligne` ou à une commande effectivement exécutée.

---

## 0. Méthode, et ce qui n'est PAS établi

### 0.1 Ce qui a été fait

| Moyen | Détail |
|---|---|
| Lecture du code | `prospect_app.py` (2382 l.), `prospect_scraper.py` (821 l.), `scraper_engine.py` (229 l.), `skills_engine.py`, `build_dashboard.py` (534 l.), `cockpit.html` (2600 l.), `dashboard.html`, `api/*.php`, `n8n/*.json` |
| Appel des routes en lecture | `GET /api/state` sur l'instance vive (`PID 1370122`, port 8788) |
| Lecture seule du serveur | `GET https://api.eperformance.pro/lecture_csv.php` avec `Authorization: Bearer …` (route GET, aucune écriture) |
| Lecture seule de n8n | `sqlite3 file:…?mode=ro` sur `/home/ballo/n8n-compose/n8n_data/database.sqlite` |
| Mesure des données | 26 colonnes × 22 lignes comptées ; 76 logs (1,1 Mo) scannés ; 1327 lignes de `cron_debug.log` catégorisées |
| Test des sources externes | `nominatim.openstreetmap.org` et `overpass-api.de` interrogés en lecture (GET/POST de requête, sans effet de bord) |

**Aucune route modifiant l'état n'a été appelée. Aucun scraping n'a été lancé. Aucun fichier n'a
été modifié hors le présent document.**

### 0.2 Non établi

- **Si `/api/scrape/ads` fonctionne en production** : non établi. La route exige un token Meta
  (`prospect_app.py:304`) qui n'est pas présent sur la machine. Impossible de vérifier sans token.
- **Si `cron_sequences.php` est actuellement planifié sur l'hébergement LWS** : non établi. Le seul
  journal disponible est un miroir local arrêté au 2026-09-09
  (`Eperformance/data/cron_debug.log`, dernière ligne `2026-09-09 22:20:04`).
- **Si les 47 envois loggés « ENVOYÉ » ont réellement atteint Meta** : non établi. Le journal
  n'enregistre que le statut HTTP côté script. Le seul échec explicite du journal est l'erreur
  `#132001` du 2026-09-07 ; on ne peut pas prouver que les envois du 2026-09-04 ont réussi.
- **Le contenu réel du template WhatsApp `j0_diagnostic`** : non établi. Il vit du côté de Meta
  Business Manager, hors dépôt ; le dépôt n'en contient qu'un mode opératoire
  (`templates_whatsapp_meta.md:21-55`).

---

## 1. Ce que le module fait réellement

### 1.1 Vue d'ensemble : quatre chaînes concurrentes, pas une

Le module n'est pas une chaîne, c'est **quatre chaînes parallèles** qui écrivent le même fichier
`prospects_tracking.csv` et se contredisent :

| # | Chaîne | Où elle tourne | Qui écrit quoi | État mesuré |
|---|---|---|---|---|
| A | **Cron serveur PHP** `api/cron_sequences.php` | LWS, toutes les 10 min (`cron_sequences.php:9`) | `Statut`, `Date_Contact`, `Date_Relance_J3/J7`, `Nombre_Contacts` | **Cassée** (erreur Meta 132001), 0 envoi depuis le 2026-09-07 |
| B | **n8n** (4 workflows) | `n8n-compose-n8n-1`, port 5678 | réponses via `webhook_reponse.php` | Seul le webhook de réponses est `active=True` ; tous les envois sont `active=False` |
| C | **Cockpit web local** `prospect_app.py` + `cockpit.html` | `127.0.0.1:8788` | `Statut`, dates, `Nombre_Contacts` sur le CSV **local** | Vivent, mais ne lisent qu'un CSV local périmé |
| D | **Artefact gelé** `build_dashboard.py` → `dashboard.html` | `file://` | `Statut` via `update_status.php` (AJAX) | Fichier figé, généré le 2026-09-05 23:47 |

Preuve de l'existence simultanée : `prospect_app.py:250` appelle `stop_prospect.php` ;
`prospect_scraper.py:581,615` appelle `lecture_csv.php` ; `prospect_scraper.py:602` appelle
`ajout_prospects.php` ; `build_dashboard.py:373` (dans le HTML généré) appelle
`update_status.php` ; `content_engine.py:2214` appelle `upload_publications.php`.

### 1.2 La chaîne nominale, telle que le code la décrit

**Étape 1 — Acquisition.** Trois entrées seulement, toutes exposées dans le même panneau
« 🎯 Scraper » (`cockpit.html:348-405`) :

1. **Meta Ads Library** — `POST /api/scrape/ads` (`prospect_app.py:300-310`) →
   `scraper_engine.search_ads_library()` (`scraper_engine.py:61-143`), qui interroge
   `graph.facebook.com/v23.0/ads_archive` (`scraper_engine.py:78`) avec les champs
   `page_name, page_id, ad_creative_bodies, ad_creative_link_titles` (`scraper_engine.py:84`).
   **Ces champs ne contiennent aucun numéro de téléphone** : un prospect issu d'Ads Library n'a
   jamais de téléphone par construction.
2. **OpenStreetMap / Overpass** — `POST /api/scrape/maps` (`prospect_app.py:312-322`) →
   `search_osm()` (`scraper_engine.py:154-193`), géocodage Nominatim
   (`scraper_engine.py:147`) puis requête Overpass (`scraper_engine.py:168`), maximum 60 résultats
   (`scraper_engine.py:154`). Le téléphone vient des tags `phone`, `contact:phone`,
   `contact:whatsapp`, `contact:mobile` (`scraper_engine.py:176-178`).
3. **Contacts .vcf** — `POST /api/scrape/vcf` (`prospect_app.py:324-337`) →
   `parse_vcf()` (`scraper_engine.py:196-222`).
4. **Saisie manuelle** — `POST /api/add` (`prospect_app.py:186-200`), modal
   `cockpit.html:311-337`.

Enrichissement automatique, au moment de l'insertion uniquement
(`prospect_scraper.append_prospect`, `prospect_scraper.py:201-233`) :
- `infer_secteur(nom, niche)` sur une liste de mots-clés, défaut `"vitrine"`
  (`prospect_scraper.py:308-325`) ;
- `detect_pays(clean_num)` par préfixe international sur 11 pays
  (`prospect_scraper.py:252-261`) ;
- `calculate_score(row)` (`prospect_scraper.py:132-151`) ;
- `Variation_Message` tiré au hasard entre `"A"` et `"B"` (`prospect_scraper.py:228`).

**Il n'y a aucun enrichissement externe.** `real_research.py`, cité comme brique
d'enrichissement, **n'existe plus en source** : seul subsiste
`__pycache__/real_research.cpython-312.pyc`. Il n'est importé par aucun fichier vivant
(`grep -rn "import real_research"` : 0 résultat). Les documents qui le décrivent
(`ENRICHISSEMENT_FORMATION_IA.md:496`, `AMELIORATION_REPETITION.md:86`) portent sur l'enrichissement
*éditorial* via SerpAPI/Pexels — deux dépendances retirées par le commit
`a4de048 refactor(deps)!: retire SerpAPI et Pexels — plus aucune dépendance externe`.

**Étape 2 — Scoring.** `calculate_score()` (`prospect_scraper.py:132-151`), barème additif :

| Critère | Points | Condition exacte |
|---|---|---|
| `A_Site_Web ∈ {non, 0, "", false}` | **+20** | `prospect_scraper.py:135` |
| `A_Site_Web` = oui | **−20** | `prospect_scraper.py:136` |
| `Nombre_Followers > 10000` / `> 1000` / `> 100` | +20 / +15 / +10 | `prospect_scraper.py:137-140` |
| `Pub_Active ∈ {oui, 1, true, ads library}` | +15 | `prospect_scraper.py:141-142` |
| `Numero_WhatsApp` non vide et ≠ « récupérer » | +10 | `prospect_scraper.py:143-144` |
| `Niche_Secteur` non vide | +5 | `prospect_scraper.py:145-146` |
| `Pays` **et** `Ville` non vides | +5 | `prospect_scraper.py:147-148` |
| `Email` contient `@` | +5 | `prospect_scraper.py:149-150` |

Résultat borné à `[0, 100]` (`prospect_scraper.py:151`). Libellés : `≥70` HOT, `≥40` WARM, sinon
COLD (`prospect_scraper.py:153-156`).

**Le score est calculé une seule fois, à la création** (`prospect_scraper.py:222`). Il n'est
recalculé que par `/api/update-phone` (`prospect_app.py:375`) ou par la commande CLI
`mode_score` (`prospect_scraper.py:343-358`) — jamais par `GET /api/state`.

**Étape 3 — Contact.** Deux chemins divergent, dans la même page :

- **Chemin carte** — `cardHtml()` rend un bouton `📱 Envoyer J0` (`cockpit.html:855`) dont le
  `onclick` appelle `send()` (`cockpit.html:887-896`) : `window.open(link)` **puis** `POST /api/send`
  (`cockpit.html:891-892`). Le message est construit par `build_message()`
  (`prospect_app.py:92-101`) → `ps.get_j0_message()` (`prospect_scraper.py:65-78`).
- **Chemin générateur** — le bouton `✨ Msg` (`cockpit.html:878`) ouvre 3 variantes AIDA /
  Storytelling / Direct (`skills_engine.py:148-200`), et chaque variante offre un lien
  `📱 WhatsApp` construit par `waLinkFor()` (`cockpit.html:983-988`, rendu lignes 949, 956, 963).
  **Ce lien n'appelle ni `/api/send` ni `/api/status`** : envoyer depuis le générateur
  n'avance pas le pipeline.

Garde-fou anti-ban : compteur `10 messages/heure`, fichier local
`prospecting_logs/rate_limit.json` (`prospect_app.py:45-46`, `103-116`), vérifié deux fois
(côté navigateur `cockpit.html:890`, côté serveur `prospect_app.py:208-210`).

**Étape 4 — Relance.** Calculée à l'affichage par `next_seq_for()` (`prospect_app.py:67-90`) :

| Statut courant | Action proposée | Délai exigé | Ligne |
|---|---|---|---|
| `Nouveau` | `j0` | immédiat | `prospect_app.py:72-73` |
| `Contacté_J0` | `j3` | `delta ≥ 3` jours depuis `Date_Contact` | `prospect_app.py:77` |
| `Relancé_J3` | `j7` | `delta ≥ 4` jours depuis `Date_Relance_J3` | `prospect_app.py:82` |
| `Froid` | `reactivate` | `delta ≥ 30` jours | `prospect_app.py:88` |
| tout autre (`Répondu_*`, `En_Conversation`, `Converti`, `Refusé`) | **aucune** | — | `prospect_app.py:90` |

La cadence est **codée en dur** (3 / 4 / 30) et n'est modifiable nulle part dans l'interface.

**Étape 5 — Réponses.** Captées par `webhook_reponse.php` (« 60+ patterns »,
`README.md:235`) déclenché par le workflow n8n `Meta Webhook — Réponses & Statuts`, seul workflow
`active=True` de l'instance (`/home/ballo/n8n-compose/n8n_data/database.sqlite`,
table `workflow_entity`).

### 1.3 Quels fichiers sont réellement vivants

| Fichier | Importé par | Verdict mesuré |
|---|---|---|
| `prospect_scraper.py` | `prospect_app.py:24` | **Vivant** — cœur du module |
| `scraper_engine.py` | `prospect_app.py:284` | **Vivant** — sert les 3 routes `/api/scrape/*` |
| `skills_engine.py` | `prospect_app.py:25` | Vivant mais `/api/qualify` est un no-op (§4.2.6) |
| `real_research.py` | **aucun** | **Source supprimée**, seul le `.pyc` subsiste |
| **`prospect_scraper_v4.py`** | `whatsapp_integration_j0.py:34`, `whatsapp_meta_templates_sender.py:39` — **deux fichiers que `prospect_app.py` n'importe jamais** | **Mort côté outil** |
| **`prospect_scraper_v5_authentique.py`** | **aucun** | **Mort** |
| **`build_dashboard.py`** | **aucun** | **Mort** (voir §5.2) |
| `api/*.php` | 5 fichiers `.php` encore appelés depuis du code vivant | **Partiellement vivant** (voir §1.4) |

**Preuve que v4 et v5 sont morts côté outil :** le message J0 réellement produit par le cockpit est
`prospect_scraper.get_j0_message()` (`prospect_scraper.py:65-78`), dont le texte dit
`"c'est Stéphane"` (l. 70) et `"t'envoie les leads sur Telegram"` (l. 73).
Or l'en-tête de `prospect_scraper_v4.py:12-13` revendique précisément :
« ✅ "Ballo" remplace "Stéphane" » et « ✅ Plus de mention Telegram au prospect (confusant) ».
Vérification directe sur un appel réel :

```
GET /api/state → PROS-006.action.link =
"https://wa.me/2250768461464?text=Salut+Test%2C+c%27est+St%C3%A9phane.…
 …et+t%27envoie+les+leads+sur+Telegram+%3F"
```

Le correctif de v4 **n'est pas appliqué**. `prospect_scraper.py` ne charge aucun des fichiers
`templates_whatsapp_*.json` (grep `TEMPLATES` dans `prospect_scraper.py` : 0 occurrence), alors que
v4 (`prospect_scraper_v4.py:20-27`) et v5 (`prospect_scraper_v5_authentique.py:24-32`) en
dépendent.

### 1.4 Le PHP est-il encore appelé ? Oui, mais pour trois choses seulement

| Endpoint PHP | Appelé depuis | Vivant ? |
|---|---|---|
| `lecture_csv.php` | `prospect_scraper.py:581,615` (`mode_sync`) | **Oui** — testé : réponse `{"status":"success","count":22}` |
| `ajout_prospects.php` | `prospect_scraper.py:602` (`mode_sync`, push) | **Oui** |
| `stop_prospect.php` | `prospect_app.py:250` (`/api/stop`) | **Oui** |
| `update_status.php` | `build_dashboard.py:373` (HTML généré uniquement) | Uniquement depuis l'artefact gelé |
| `update_csv.php` | `prospect_scraper.py:557` (`mode_upload`, CLI) | Oui en CLI |
| `cron_sequences.php` | cron LWS (hors dépôt) | Cassé (§4.1.4) |
| `webhook_reponse.php` | n8n `active=True` | **Oui** |
| `lire_publications.php`, `upload_publications.php`, `upload_asset.php`, `cron_publications.php` | `content_engine.py`, `prospect_app.py:867` | Oui — mais **hors module M1** (publications) |

> ⚠️ `templates_whatsapp_meta.md:213` : « **NE PLUS lancer `prospect_scraper.py upload`** tant que
> n8n tourne : l'upload écrase TOUT le CSV serveur et efface les statuts mis à jour par n8n. »
> Une capacité destructive (écrasement complet du CSV serveur) reste exposée en CLI.

---

## 2. Le modèle de données

### 2.1 `prospects_tracking.csv` — 22 lignes, 26 colonnes

`CSV_HEADERS` est déclaré en `prospect_scraper.py:163-171`, réécrit par `save_csv()`
(`prospect_scraper.py:187-190`) qui **écrase tout le fichier à chaque modification**.

Fichier : 6 279 octets, BOM UTF-8, 22 lignes de données (dont **4 lignes de test**).

Taux de remplissage mesurés (valeurs vides = chaîne vide après `strip()`) :

| # | Colonne | Vides | % vide | Valeurs distinctes | Commentaire |
|---|---|---|---|---|---|
| 0 | `ID` | 0/22 | 0 % | 22 | `PROS-001` → `PROS-024` (trou : `PROS-004`, `PROS-005` absents) |
| 1 | `Date_Decouverte` | 0/22 | 0 % | 2 | 2 dates seulement |
| 2 | `Date_Contact` | 20/22 | **91 %** | 2 | |
| 3 | `Date_Relance_J3` | 20/22 | **91 %** | 2 | |
| 4 | `Date_Relance_J7` | 21/22 | **95 %** | 1 | |
| 5 | `Nom_Prospect` | 0/22 | 0 % | 22 | |
| 6 | `Page_Facebook` | 18/22 | **82 %** | 4 | **100 % vide sur les 18 prospects réels** |
| 7 | `URL_Facebook` | 4/22 | 18 % | 18 | |
| 8 | `URL_Website` | 22/22 | **100 %** | 0 | **jamais remplie** |
| 9 | `Numero_WhatsApp` | 0/22 | 0 % | 22 | |
| 10 | `Email` | 22/22 | **100 %** | 0 | **jamais remplie** |
| 11 | `Pays` | 0/22 | 0 % | 3 | |
| 12 | `Ville` | 1/22 | 4,5 % | 6 | |
| 13 | `Niche_Secteur` | 0/22 | 0 % | 3 | `mlm` ×18, `MLM` ×2, `vitrine` ×2 — **casse de casse non normalisée** |
| 14 | `Produit_Interet` | 22/22 | **100 %** | 0 | **jamais remplie** |
| 15 | `Canal_Prospection` | 0/22 | 0 % | 2 | `Cockpit` ×18, `Direct` ×4 |
| 16 | `Statut` | 0/22 | 0 % | 2 | `Froid` ×20, `Nouveau` ×2 |
| 17 | `Score_Priorite` | 0/22 | 0 % | 4 | 35, 55, 65, 70 |
| 18 | `Score_Detail` | 0/22 | 0 % | 16 | journal textuel du barème |
| 19 | `Nombre_Contacts` | 0/22 | 0 % | 3 | `0` ×20, `2`, `5` |
| 20 | `Variation_Message` | 0/22 | 0 % | 2 | `A` ×10, `B` ×12 — **jamais lue** |
| 21 | `A_Site_Web` | 0/22 | 0 % | **1** | **`Non` ×22 — constante** |
| 22 | `Nombre_Followers` | 0/22 | 0 % | 18 | |
| 23 | `Pub_Active` | 2/22 | 9 % | 1 | `Oui` ×2 seulement |
| 24 | `Source_Acquisition` | 0/22 | 0 % | 2 | `cockpit` ×18, `add` ×4 |
| 25 | `Notes` | 22/22 | **100 %** | 0 | **jamais remplie** |

**Aucune ligne ne provient d'un scraper.** `Source_Acquisition` vaut `cockpit` (18 lignes,
écrit par `prospect_app.py:195`) ou `add` (4 lignes). Les valeurs produites par les scrapers
(`"OpenStreetMap"` en `scraper_engine.py:185`, `"Contacts VCF"` en `prospect_app.py:336`,
l'URL de page en `prospect_scraper.py:712`) sont **absentes du fichier** : les 3 routes de scraping
et la route d'import n'ont **jamais produit une seule ligne de données**.

### 2.2 Colonnes mortes et colonnes ambiguës

**Colonnes jamais remplies (3)** — mesuré à 100 % de vides, et aucune ligne de code ne peut les
remplir depuis l'interface :

- `URL_Website` — écrite nulle part. `append_prospect` ne l'affecte jamais
  (`prospect_scraper.py:224-230` n'inclut pas la clé, elle reste `""` par la ligne 223).
- `Email` — lue par le score (`prospect_scraper.py:149-150`, +5 pts) mais
  **le modal d'ajout n'a pas de champ email** (`cockpit.html:311-337`) : `submitAdd()` envoie
  `{phone, nom, url_fb, ville, secteur, followers, pub, notes}` (`cockpit.html:1467-1469`).
  Les +5 points sont structurellement inatteignables depuis l'interface.
- `Produit_Interet` — **lue** par `build_message` (`prospect_app.py:98`), `/api/generate-msg`
  (`prospect_app.py:408`) et `build_dashboard.py:100,147` ; **écrite par personne**. Le champ
  `{produit_str}` de chaque message est donc toujours vide.

**Colonne constante (1)** — `A_Site_Web` vaut `"Non"` sur 22/22 lignes. Valeur par défaut à
l'insertion : `"A_Site_Web": a_site_web or "Non"` (`prospect_scraper.py:229`). Le modal d'ajout
n'expose aucun champ « a un site » ; le seul chemin qui peut écrire `"Oui"` est `/api/import`
alimenté par OSM (`prospect_app.py:351`, `scraper_engine.py:184`) — or `/api/import` n'a jamais
tourné.
→ **Conséquence : `+20 « pas de site » s'ajoute mécaniquement à 100 % des prospects.** C'est le
plus gros poste du barème, et il ne discrimine rien. Le plancher réel du score est donc 35
(`+20` site + `+10` WhatsApp + `+5` secteur), ce que confirment PROS-002 et PROS-003 à 35/100.

**Colonne écrite mais jamais lue (1)** — `Variation_Message`. Écrite aléatoirement à l'insertion
(`prospect_scraper.py:228`), jamais consultée : `build_message` (`prospect_app.py:92-101`) et
`get_j0_message` (`prospect_scraper.py:65-78`) ne la lisent pas. Seuls
`whatsapp_integration_j0.py:274` et `whatsapp_meta_templates_sender.py:357` la manipulent — deux
fichiers jamais importés par le cockpit. **La colonne enregistre un tirage au sort qui ne
détermine rien.** Elle ne contient d'ailleurs que `A` et `B` alors que v4 spécifie 3 variantes
A/B/C à 40/30/30 (`prospect_scraper_v4.py:8`).

**Sens ambigu (2)** — `Canal_Prospection` et `Source_Acquisition` se recouvrent : `/api/add` écrit
`Canal_Prospection="Cockpit"` **et** `Source_Acquisition="cockpit"`
(`prospect_app.py:195`), tandis que `/api/import` écrit `Canal_Prospection=it["source"]` **et**
`Source_Acquisition=it["url_fb"] or it["source"]` (`prospect_app.py:349-350`) — l'un porte un
canal, l'autre une URL. Deux colonnes, pas de règle unique.

**Autres incohérences de données mesurées :**

- `PROS-010` stocke `22674005963` (sans `+`) là où 21 autres lignes stockent `+226…` :
  `/api/add` et `append_prospect` **n'appellent pas `normalize_whatsapp()`** — ils enregistrent la
  saisie brute (`prospect_scraper.py:225`). `normalize_whatsapp` existe
  (`prospect_scraper.py:263-274`) et n'est utilisée que par `mode_add` (l. 658) et
  `/api/update-phone` (`prospect_app.py:363`).
- `PROS-006` a `Page_Facebook = "+2250768461464"` — un numéro de téléphone dans un champ de nom de
  page. Le message J0 résultant dit littéralement *« je suis tombé sur ta page +2250768461464 »*.
- 2 lignes sur 22 (`PROS-011`, `PROS-013`) portent des noms en **Unicode mathématique**
  (16 et 21 caractères hors BMP, plage U+1D400+) : `𝐕𝐢𝐭𝐚𝐥𝐢𝐭é 𝐍𝐚𝐭𝐮𝐫𝐞𝐥𝐥𝐞`,
  `𝐋𝐨𝐧𝐠𝐫𝐢𝐜𝐡 𝐒𝐨𝐥𝐮𝐭𝐢𝐨𝐧 𝐒𝐚𝐧𝐭𝐞`. `infer_secteur` et `has_prenom` comparent des mots-clés ASCII
  (`prospect_scraper.py:311-322`, `335-338`) : ces noms ne matchent aucun mot-clé.
- `Nombre_Contacts > 0` avec `Date_Contact` vide : `PROS-003` (5 contacts) et `PROS-006`
  (2 contacts) — état incohérent produit par des écritures concurrentes.

### 2.3 Le fichier local ne décrit pas la réalité : 20 lignes sur 22 divergent

Comparaison directe entre `prospects_tracking.csv` (ce que lit le cockpit) et
`lecture_csv.php` (le serveur, désigné « source de vérité » par `prospect_scraper.py:577`) :

```
statuts LOCAUX  : {'Froid': 20, 'Nouveau': 2}
statuts SERVEUR : {'Relancé_J3': 11, 'Froid': 6, 'Répondu_Positif': 3, 'Répondu_Négatif': 2}
=> 20/22 lignes divergent sur au moins un champ
```

| Prospect | Champ | Local | Serveur |
|---|---|---|---|
| `PROS-007` Longrich World | `Statut` | `Froid` | **`Répondu_Positif`** |
| | `Date_Contact` | *(vide)* | `2026-09-04` |
| | `Nombre_Contacts` | `0` | `2` |
| `PROS-008` Vitalité Naturelle | `Statut` | `Froid` | **`Répondu_Positif`** |
| `PROS-009` BIEN ÊTRE ET SANTÉ | `Statut` | `Froid` | **`Répondu_Positif`** |
| `PROS-012` Longrich Santé & Mindset | `Statut` | `Froid` | **`Répondu_Négatif`** |
| `PROS-023` Longrich santé et opportunités | `Statut` | `Froid` | **`Répondu_Négatif`** |
| `PROS-011/013/014/015/016/017/018/019/020/021/024` | `Statut` | `Froid` | `Relancé_J3` |
| | `Date_Contact` | *(vide)* | `2026-09-04` |
| | `Date_Relance_J3` | *(vide)* | `2026-09-07` |

**Trois prospects ont répondu positivement et le cockpit les affiche « Froid, jamais contacté ».**
Deux ont répondu négativement. Onze sont en relance J+3.

**Cause identifiée :** le seul mécanisme de réconciliation est `mode_sync()`
(`prospect_scraper.py:574-620`), exposé par `POST /api/sync` (`prospect_app.py:267-275`) et
déclenché par le bouton `🔄 Sync serveur` (`cockpit.html:294` → `doSync()`, `cockpit.html:1457`).
**Il n'a jamais été appelé** : sur les 76 fichiers de `prospecting_logs/` (1,1 Mo), le comptage des
routes réellement atteintes donne `POST /api/sync : 0`.

Relevé complet des routes atteintes sur toute l'histoire de l'application :

```
6806  GET  /api/state
 422  GET  /api/publications
 287  GET  /api/publications/stats
  74  GET  /
  67  GET  /api/config/llm-status
  57  GET  /api/ia-config
  26  POST /api/publications/generate-batch
  18  POST /api/publications/delete-all
  ...  (routes publications)
   2  POST /api/status
   1  POST /api/qualify
   0  POST /api/add
   0  POST /api/import
   0  POST /api/send
   0  POST /api/stop
   0  POST /api/update-phone
   0  POST /api/sync
   0  POST /api/scrape/ads
   0  POST /api/scrape/maps
   0  POST /api/scrape/vcf
```

Confirmation indépendante : `prospecting_logs/rate_limit.json` (le compteur anti-ban incrémenté
par `/api/send`, `prospect_app.py:113-116`) **n'existe pas**, et aucun des 76 logs ne contient les
mots `ADS LIBRARY`, `OVERPASS` ou `VCF` (recherche insensible à la casse).

**En une phrase : la moitié acquisition du cockpit n'a jamais servi. Les 6 806 appels à
`/api/state` montrent un utilisateur qui ouvre l'écran ; les 0 appels aux routes d'acquisition
montrent qu'il n'y fait rien.**

---

## 3. Les écrans et les parcours

### 3.1 Ce que l'utilisateur voit au lancement

`GET /` renvoie `cockpit.html` (`prospect_app.py:2276-2278`). Une seule page, pas d'onglets de
navigation. De haut en bas :

1. **Topbar** (11 boutons) — `cockpit.html:281-295` : badge provider LLM, compteur anti-ban,
   `🎨 Design`, `🤖 Status IA`, `⚡ Actions`, `⚙️ Paramètres`, `📚 Publications`, `🧠 Skills IA`,
   `⚔️ Concurrence`, `🎯 Scraper`, `➕ Prospect`, `🔄 Sync serveur`. **9 des 11 boutons ne
   concernent pas l'acquisition** : le pipeline occupe la page, mais ses outils sont noyés dans une
   barre d'actions orientée production de contenu.
2. **6 KPI** (`cockpit.html:828-831`) : Prospects, Nouveaux, À relancer aujourd'hui, Hot leads,
   % réponse, % conversion.
3. **Funnel « Pipeline »** (`cockpit.html:301-303`, rendu `833-836`) : barres par statut, filtrées
   sur les statuts non nuls.
4. **Chips de filtre** (`cockpit.html:305`, `837-844`) : Tous, À relancer, Nouveaux, Contactés,
   Réponses, Froids, Conclus.
5. **Recherche** nom/téléphone (`cockpit.html:306`).
6. **Grille de cartes** (`cockpit.html:308`, `cardHtml` l. 849-886) : score coloré, nom, badge de
   statut, téléphone/ville/niche, lien page FB, méta (contacté le, nb d'envois, pub), puis les
   actions : bouton d'envoi **ou** texte d'attente, `🛑 Stopper` (seulement si statut ∈
   {Nouveau, Contacté_J0, Relancé_J3}, l. 860-861), `✨ Msg`, `🎯 ICP`, `✏️ Numéro ?` (seulement si
   téléphone invalide, l. 880), et un `<select>` de statut (l. 881-883).
7. **Rafraîchissement** : `setInterval(load, 60000)` (`cockpit.html:1481`) — `GET /api/state`
   toutes les 60 s. C'est ce qui explique les 6 806 appels.

**État réel de cet écran aujourd'hui** (`GET /api/state`, mesuré) :

```
total: 22   due_count: 2   hot: 5
stats: {Froid: 20, Nouveau: 2, tout le reste: 0}
taux_reponse: 0.0    taux_conversion: None
cartes SANS action possible: 20 / 22
répartition des actions: {AUCUNE: 20, j0: 2}
```

Les 2 seules cartes actionnables sont `PROS-003` et `PROS-006`, c'est-à-dire les deux lignes de
test. **Le tableau de bord présente 20 cartes mortes et 2 cartes de test.**

### 3.2 Les parcours, en clics et en saisies

**A. Ajouter un prospect à la main** — `#addOverlay`, `cockpit.html:311-337`
- 1 clic sur `➕ Prospect` (`cockpit.html:293`) ;
- 1 à 8 saisies (seul *Téléphone* est requis, `cockpit.html:1470` ; le reste est optionnel) ;
- 1 clic sur `Ajouter (score auto)` (`cockpit.html:334`).
- **Total : 2 clics + 1 à 8 saisies.** Le score et le pays sont déduits ; l'email et le site web
  sont hors de portée (§2.2).

**B. Scraper puis importer (Ads Library)** — `#scrOverlay`, `cockpit.html:348-405`
1. clic `🎯 Scraper` ; onglet `📢 Ads Library` déjà actif (`cockpit.html:352`) ;
2. coller le token Meta dans un champ texte (`cockpit.html:360-361`) — **1 saisie opaque**, avec
   pour seule aide un lien vers l'explorateur Graph et la mention « permission `ads_read` »
   (`cockpit.html:358-359`) ;
3. choisir le pays (`cockpit.html:363-368`) ;
4. relire/éditer le textarea pré-rempli de 4 requêtes (`cockpit.html:371-374`) ;
5. clic `🔎 Chercher` (`cockpit.html:375`) → `runAds()` (`cockpit.html:1523-1531`) ;
6. les résultats s'affichent avec **toutes les cases déjà cochées** (`cockpit.html:1506`) ;
7. clic `📥 Importer la sélection (N)` (`cockpit.html:1521`).
- **Total : 4 clics + 3 saisies.** Mais **aucun téléphone ne peut arriver** : les champs demandés à
  Meta (`scraper_engine.py:84`) n'en contiennent pas. Pour chaque prospect importé, il faut donc
  cliquer `✏️ Numéro ?` (`cockpit.html:880`) → **`prompt()` natif du navigateur**
  (`cockpit.html:1559`) → saisir → `OK`. Soit **2 clics + 1 saisie par prospect**, plus le temps
  de trouver le numéro soi-même. Pour 60 résultats OSM, cela fait 120 clics et 60 saisies.
- Le commentaire du CLI l'assume : `prospect_scraper.py:716` — « 💡 Téléphones à compléter :
  cockpit → carte prospect → ✏️ ».

**C. Envoyer le J0** — 1 clic (`cockpit.html:855`). Pas d'aperçu, pas de confirmation :
`send()` ouvre `wa.me` puis marque immédiatement (§4.1.5).

**D. Relancer** — 1 clic, **mais seulement quand le délai codé en dur est écoulé**. Avant, la carte
n'affiche qu'un texte inerte « J+3 dans 2j » (`cockpit.html:856`). L'utilisateur ne peut pas
décider de relancer plus tôt ni plus tard.

**E. Qualifier (ICP)** — 1 clic sur `🎯 ICP` (`cockpit.html:879`) → aller-retour réseau → affiche
un verdict qui **reformule le score déjà affiché sur la carte** (§4.2.6).

**F. Générer un message** — 1 clic sur `✨ Msg` → 2 requêtes (`/api/generate-msg` puis
`/api/optimize-msg`, `cockpit.html:940` et `968`) → 3 variantes avec copie et lien WhatsApp.
**Envoyer depuis ce panneau ne met pas à jour le pipeline.**

### 3.3 L'écran concurrent : `dashboard.html`

`build_dashboard.py` est un script CLI (`argparse`, `build_dashboard.py:518-527`) qui écrit
`dashboard.html` (`build_dashboard.py:20`). L'artefact présent date du **2026-09-05 23:47**
(mention « Généré le 2026-09-05 23:47 » gravée dans le HTML) et contient une copie figée des
**22 mêmes prospects**, avec les mêmes statuts que le CSV local
(`Froid ×20, Nouveau ×2` — comptage sur `dashboard.html`).

Il n'est pas importé par un seul fichier Python (`grep "import build_dashboard"` : 0 résultat) et
n'est pas servi par Flask. Il duplique integralement la vue du cockpit
(`gen_html()`, `build_dashboard.py:140-337`) **et** une seconde copie de la logique métier :
`infer_secteur` (`build_dashboard.py:38`), `has_prenom` (`:57`), 4 générateurs de messages
(`:66-94`), `compute_stats` (`:126`), et une seconde liste `SECTOR_HOOKS` (`:24-36`).

**La duplication a déjà divergé.** Test sur 6 noms (`prospect_scraper.infer_secteur` vs
`build_dashboard.infer_secteur`) :

```
Longrich World   -> mlm        | mlm
Ma Santé         -> sante      | sante
Pizza Napoli     -> restauration | vitrine    DIFFÉRENT
Salon Beauté     -> beaute     | beaute
Ecole des cadres -> education  | vitrine      DIFFÉRENT
```

Un même prospect obtient donc un secteur différent selon l'outil — et le secteur détermine à la
fois l'accroche du message (`SECTOR_HOOKS`) et +5 points de score.

**Exposition** : le HTML généré appelle `update_status.php` sur `https://api.eperformance.pro` avec
le token en clair (`build_dashboard.py:21-22`, injecté dans le HTML en `:339-340`), et le PHP
autorise `Access-Control-Allow-Origin: *` (`api/update_status.php:41`). Depuis un `file://`, le
navigateur peut donc **écrire** dans le CSV serveur sans aucune lecture de contrôle : c'est un
écrivain aveugle supplémentaire.

---

## 4. Les défauts, classés par ce qu'ils coûtent à l'usage

### 4.1 Défauts fonctionnels (ça ne marche pas)

---

**F1 — GRAVITÉ 1 — Le cockpit affiche le contraire de la réalité : 3 leads chauds invisibles**

- *Ce que l'utilisateur subit* : il ouvre son cockpit, lit `0.0 % réponse`, voit 20 cartes
  « Froid » et 2 cartes « À relancer » qui sont ses propres tests. Il en conclut que sa
  prospection n'a rien donné. En réalité, **trois prospects ont répondu positivement** et deux ont
  répondu non, onze sont en séquence de relance.
- *Preuve* : §2.3 — 20/22 lignes divergent ; local `{Froid:20, Nouveau:2}` contre serveur
  `{Relancé_J3:11, Froid:6, Répondu_Positif:3, Répondu_Négatif:2}`.
  `GET /api/state` → `taux_reponse: 0.0`, `taux_conversion: None`, `hot: 5`.
- *Cause* : le cockpit lit le CSV **local** (`prospect_app.py:43`, `CSV_PATH = "prospects_tracking.csv"`),
  que le cron serveur ne met pas à jour ; la réconciliation `mode_sync()`
  (`prospect_scraper.py:574-620`) n'a jamais été exécutée (0 appel de `/api/sync`).
- *Aggravant* : le calcul du taux de réponse est faux par construction :
  `contacted` inclut le statut `Froid` (`prospect_app.py:159`), donc les prospects jamais
  contactés gonflent le dénominateur, et l'affichage `0.0 %` masque le fait que le dénominateur
  est faux. Sur les données serveur, le taux réel serait `5/18 = 27,8 %`.

---

**F2 — GRAVITÉ 1 — « Froid » est un état terminal : 20 cartes sur 22 n'offrent aucune action**

- *Ce que l'utilisateur subit* : il ne peut rien faire de ces prospects. Aucun bouton d'envoi,
  aucune relance, aucun redémarrage de séquence.
- *Preuve* : `next_seq_for()` retourne `None` pour `Froid` si aucune date n'est renseignée
  (`prospect_app.py:84-89`) ; `cardHtml` ne rend le bouton d'envoi que si `a && a.link`
  (`cockpit.html:853`). `GET /api/state` : `action: null` sur 20 cartes.
- *Cause* : `Froid` est **à la fois** un état « a échoué 3 fois » (posé par le cron,
  `cron_sequences.php:278` et `:428`) **et** un état « à réactiver à J+30 » (attendu par
  `prospect_app.py:84-89`). Les deux sémantiques partagent la même valeur de statut, et la seule
  sortie prévue exige une date que le parking n'écrit jamais.
- *Sortie de secours réelle* : le `<select>` de statut (`cockpit.html:881`). Rebasculer à la main
  sur `Contacté_J0` fait poser `Date_Contact` (`prospect_app.py:123`), mais l'action suivante
  (`J+3`) n'apparaît alors qu'au bout de 3 jours (`prospect_app.py:77`).

---

**F3 — GRAVITÉ 1 — La chaîne d'envoi automatique est cassée et a parqué toute la base**

- *Ce que l'utilisateur subit* : il croit avoir une séquence J0/J+3/J+7 automatique. Elle a envoyé
  47 messages entre le 1er et le 7 septembre, puis s'est arrêtée et a garé tous les prospects.
- *Preuve* (`Eperformance/data/cron_debug.log`, 1327 lignes, du 2026-08-31 16:23 au 2026-09-09 22:20) :

```
47 lignes « ENVOYÉ »  (J0:31, J+3:14, J+7:2)
  destinataires : PROS-003(9), PROS-006(6), puis PROS-007 à PROS-024
  dates : 2026-09-01 (10), 2026-09-04 (26), 2026-09-07 (11)
1226 lignes « Rien à envoyer (aucun prospect éligible) »
15 lignes « ERREUR lecture … HTTP 0 … Operation timed out » (2026-09-03, 09-07, 09-09)
```

et l'échec explicite :

```
2026-09-07 02:50:03 — ÉCHEC J0 → PROS-003 : (#132001) Template name does not exist in the translation (code 132001)
2026-09-07 03:10:05 — PARKING PROS-003 → Froid : (#132001) …
2026-09-07 03:40:04 — PARKING PROS-006 → Froid : (#132001) …
```

`Eperformance/data/cron_state.json` : `{"sent_today":0,"failures":[],"last_send":[]}`.

- *Cause* : le template WhatsApp `j0_diagnostic` n'existe pas (ou pas dans la langue attendue)
  côté Meta. Le mode opératoire `templates_whatsapp_meta.md:21-55` le déclare en
  `Language | French (fr)` — or l'erreur 132001 est précisément l'erreur de traduction/langue.
  Le template doit être **créé à la main dans Meta Business Manager** ; rien dans le dépôt ne peut
  le vérifier ni le déployer.
- *Conséquence* : `cron_sequences.php:20` — « 3 échecs consécutifs sur un numéro → prospect parké
  en Froid ». La totalité de la base contactée a été garée, ce qui produit F2.
- *Aggravant* : dans le miroir du 2026-09-18, **les séquences J+3 et J+7 sont commentées**
  (`api/cron_sequences.php:72-73`) — seule J0 est armée, et c'est celle dont le template est cassé.

---

**F4 — GRAVITÉ 1 — « Envoyer J0 » marque le prospect contacté même si rien n'est parti**

- *Ce que l'utilisateur subit* : son pipeline affiche « Contacté, 1 envoi » pour des prospects à qui
  il n'a rien envoyé (fenêtre WhatsApp fermée, `wa.me` bloqué, mauvais numéro, envoi abandonné), et
  le statut saute à `Contacté_J0` pour 3 jours avant de proposer J+3.
- *Preuve* : `send()` (`cockpit.html:887-896`) fait `window.open(link)` (l. 891) **puis**
  `POST /api/send` (l. 892) sans aucun retour de l'utilisateur ni vérification. Côté serveur,
  `/api/send` applique le nouveau statut et incrémente le compteur **avant** tout accusé :
  `apply_status(rows, pid, new_st, inc=True)` puis `ps.save_csv(...)` puis `rate_inc()`
  (`prospect_app.py:217-219`).
- *Cause* : l'action « ouvrir un lien WhatsApp » et l'action « enregistrer un contact » sont
  fusionnées en un seul geste, sans confirmation. Le seul chemin qui ne marque pas est le lien
  `📱 WhatsApp` du générateur (`cockpit.html:949,956,963`) — c'est l'inverse exact du besoin :
  c'est le chemin « je veux relire avant d'envoyer » qui ne trace pas.

---

**F5 — GRAVITÉ 1 — La base de production contient 4 lignes de test, et ce sont les seules actives**

- *Ce que l'utilisateur subit* : « À relancer aujourd'hui : 2 » désigne `PROS-003 Test Stéphane`
  et `PROS-006 Test Ami`. Le compteur anti-ban, les 6 806 rafraîchissements, les KPI, tout porte
  sur une base dont 18 % des lignes sont des tests.
- *Preuve* : comptage des lignes dont `Nom_Prospect` contient `test` → 4/22 :
  `PROS-001 Test Dashboard`, `PROS-002 Test Nouveau`, `PROS-003 Test Stéphane`,
  `PROS-006 Test Ami`. Ce sont exactement les lignes `Source_Acquisition = "add"` et
  `Canal_Prospection = "Direct"`. Elles sont aussi les seules à avoir `Nombre_Contacts > 0`.
  `GET /api/state` → `due_ids: ['PROS-003','PROS-006']`.
- *Cause* : aucune séparation environnement de test / données réelles ; `append_prospect` n'a aucun
  garde-fou (`prospect_scraper.py:201-233`). Ces lignes ont aussi été poussées au serveur et
  **réellement contactées par le cron** (`cron_debug.log`, J0 répétés les 09-01 et 09-04) et
  inclues dans les envois Meta. Elles ne peuvent pas être supprimées par l'interface :
  aucune route de suppression de prospect n'existe.

---

### 4.2 Défauts d'usage (ça marche mal)

---

**U1 — GRAVITÉ 2 — Un message sur deux s'adresse à un faux prénom**

- *Ce que l'utilisateur subit* : le prospect reçoit `Salut Longrich,` ou `Salut Ma,`. Sur une
  page professionnelle, c'est immédiatement perçu comme du spam automatique.
- *Preuve* : test de `has_prenom()` (`prospect_scraper.py:332-339`) sur les 22 lignes réelles,
  chaîné avec `build_message` (`prospect_app.py:92-101`) :

```
PROS-009 'BIEN ÊTRE ET SANTÉ'          -> « Salut BIEN, »
PROS-010 'Longrich Burkina Officiel'   -> « Salut Longrich, »
PROS-012 'Longrich Santé & Mindset'    -> « Salut Longrich, »
PROS-013 '𝐋𝐨𝐧𝐠𝐫𝐢𝐜𝐡 𝐒𝐨𝐥𝐮𝐭𝐢𝐨𝐧 𝐒𝐚𝐧𝐭𝐞'   -> « Salut 𝐋𝐨𝐧𝐠𝐫𝐢𝐜𝐡, »
PROS-018 'Santé et bien-être par du Bio' -> « Salut Santé, »
PROS-019 'HOME Business Center'        -> « Salut HOME, »
PROS-021 "Ma Santé D'abord"            -> « Salut Ma, »
PROS-022 'Santé Business Longrich Center' -> « Salut Santé, »
PROS-023 'Longrich santé et opportunités' -> « Salut Longrich, »
=> 9 faux positifs sur les 18 prospects réels (50 %)
```

- *Cause* : `has_prenom` ne rejette un nom que s'il contient un mot générique **et** fait au plus
  2 mots (`prospect_scraper.py:338` : `if g in n and len(nom.split()) <= 2`). Tout nom de page de
  3 mots ou plus passe, et `get_j0_message` prend alors le premier mot
  (`prospect_scraper.py:69`).

---

**U2 — GRAVITÉ 2 — Le scraper OSM promet des téléphones qui n'existent pas (4 %)**

- *Ce que l'utilisateur subit* : il lit « Numéros souvent présents pour Ouaga/Abidjan »
  (`cockpit.html:379`), lance la recherche, importe 60 commerces et doit chercher 58 numéros
  lui-même.
- *Preuve* : requête Overpass identique à `scraper_engine.py:166-168`, restaurants/maquis dans
  8 km autour de Ouagadougou :

```
elements retournés        : 60
avec un nom               : 52
avec un TÉLÉPHONE         : 2   (4 %)
avec un SITE WEB          : 3   (6 %)
```

- *Cause* : la couverture téléphonique d'OSM en Afrique de l'Ouest est très faible ; l'interface
  affirme le contraire sans mesure. Le vrai gisement OSM ici est le **site web** (qui vaut −20
  points, cf. §2.2), pas le téléphone.

---

**U3 — GRAVITÉ 2 — Ads Library impose 100 % de saisie manuelle des numéros, un par un, via un `prompt()`**

- *Ce que l'utilisateur subit* : chaque prospect importé depuis Ads Library est inutilisable
  jusqu'à saisie manuelle du numéro, dans une boîte de dialogue native du navigateur, sans le nom
  du prospect rappelé à l'écran, sans possibilité de corriger ensuite (le `prompt` est la seule
  voie).
- *Preuve* : les champs demandés à Meta sont `page_name, page_id, ad_creative_bodies,
  ad_creative_link_titles` (`scraper_engine.py:84`) — aucun téléphone. Le remplissage passe par
  `fixPhone()` (`cockpit.html:1558-1563`), qui ouvre `prompt("Numéro WhatsApp de ce prospect :")`
  (l. 1559) et poste sur `/api/update-phone`.
- *Aggravant* : `/api/update-phone` recalcule le score (`prospect_app.py:375-376`), ce qui fait
  **changer le score d'un prospect après coup** — sans que `Score_Detail` soit montré à
  l'utilisateur au moment du changement.
- *Bon point à conserver* : `/api/update-phone` refuse un doublon en nommant le prospect
  conflictuel (`prospect_app.py:369-370`) — c'est le meilleur message d'erreur du module.

---

**U4 — GRAVITÉ 2 — Deux chemins d'envoi incohérents dans la même page**

- *Ce que l'utilisateur subit* : il relit un message dans le générateur, l'envoie depuis là — et le
  pipeline ne bouge pas. Il croit avoir relancé ; la carte affiche toujours « Nouveau ».
- *Preuve* : `send()` marque (`cockpit.html:892`) ; les liens du générateur
  (`cockpit.html:949,956,963`, construits par `waLinkFor` l. 983-988) n'appellent aucune route.
- *Cause* : deux implémentations de « contacter un prospect » selon le point d'entrée, sans
  fonction commune.

---

**U5 — GRAVITÉ 2 — Le score est figé à la création et ne reflète plus rien**

- *Ce que l'utilisateur subit* : le classement des cartes est faux. Un prospect dont les followers
  changent, qui lance une pub, ou dont la ville est renseignée après coup, garde son score d'origine.
- *Preuve* : le score n'est calculé qu'à `append_prospect` (`prospect_scraper.py:222`) et par
  `/api/update-phone` (`prospect_app.py:375`). `GET /api/state` le relit tel quel
  (`prospect_app.py:155`) sans recalcul. Le CLI `mode_score` existe
  (`prospect_scraper.py:343-358`) mais n'est ni appelé par l'application ni exposé en route.

---

**U6 — GRAVITÉ 2 — `/api/qualify` ne produit aucune information : c'est un aller-retour réseau pour relire le score**

- *Ce que l'utilisateur subit* : il clique `🎯 ICP`, attend, et lit « Warm · Score 65/100 ·
  Priorité 2/3 · ICP fit ✓ » alors que sa carte affiche déjà « 65 WARM ».
- *Preuve* : `qualify_prospect` (`skills_engine.py:59-121`) commence par
  `score = _try_int(row.get("Score_Priorite", 0))` (l. 63) et retourne ce score inchangé (l. 116).
  Les seuils de verdict (l. 101-112 : ≥70 Qualified, ≥40 Warm, sinon Cold) sont **les mêmes** que
  ceux de `score_label` (`prospect_scraper.py:153-156` : ≥70 HOT, ≥40 WARM, sinon COLD).
  `icp_fit` vaut `score >= 40` (l. 120), c'est-à-dire « pas COLD ».
  Le commentaire du code annonce pourtant « Calculer le score de qualification (ajoute au score
  existant) » (l. 88) — ce n'est pas ce que fait le code.
- *Sur les données réelles* : `icp_score` est identique au `Score_Priorite` du CSV sur 22/22 lignes.
- *Cause* : la « qualification ICP » est un habillage de vocabulaire posé sur le score technique.

---

**U7 — GRAVITÉ 2 — La cadence de relance est non négociable**

- *Ce que l'utilisateur subit* : il vient de parler à un prospect et veut relancer demain. Le bouton
  n'existe pas. Il attend 3 jours, puis 4, puis 30.
- *Preuve* : seuils en dur `delta >= 3` (`prospect_app.py:77`), `delta >= 4` (l. 82),
  `delta >= 30` (l. 88). Aucune route, aucun réglage, aucun champ ne les expose.
- *Effet secondaire* : la seule action possible est un texte d'attente passif
  (`cockpit.html:856`) — information, pas contrôle.

---

**U8 — GRAVITÉ 2 — Le lanceur du cockpit est cassé sur les deux points d'entrée**

- *Ce que l'utilisateur subit* : il double-clique sur l'icône « Cockpit ePerformance » et rien ne
  se passe.
- *Preuve* :
  - `~/.local/share/applications/cockpit.desktop` → `Exec=/home/ballo/OX6A/prospecting-toolkit/lancer-cockpit.sh` ;
  - `/home/ballo/OX6A/prospecting-toolkit/` **n'existe pas** (`ls` : « Aucun fichier ou dossier de ce nom ») ;
  - le script réel est `lancer-cockpit.sh:5` : `cd /home/ballo/OX6A/prospecting-toolkit || exit 1` —
    il sort en code 1 immédiatement ;
  - le même chemin mort est gravé dans `cockpit.desktop:5` (copie dans le toolkit).
- *Ce qui marche encore* : lancer `python3 prospect_app.py --port 8788 --no-browser` à la main.
- *Note* : le script tue aussi tout `prospect_app.py` et vide `__pycache__`
  (`lancer-cockpit.sh:14-23`) — un lanceur qui tue les processus voisins est un risque si un
  deuxième port est utilisé.

---

**U9 — GRAVITÉ 2 — `build_dashboard.py` a divergé et écrit dans la production sans contrôle**

- *Ce que l'utilisateur subit* : s'il ouvre l'ancien `dashboard.html` et change un statut, la
  modification part sur le serveur sans vérification, alors que son cockpit lit un CSV local
  différent. Les deux écrans peuvent afficher deux vérités.
- *Preuve* : divergence de `infer_secteur` (§3.3) ; écriture via `update_status.php`
  (`build_dashboard.py:373`) avec token en clair (`:21-22`, `:339-340`) ; l'artefact est figé au
  2026-09-05 23:47 et n'est régénérable que par un CLI.
- *Aggravant* : le dossier `n8n/` contient 4 exports dont un workflow d'envoi marqué
  `"active": true` (`WhatsApp Sequences J0-J3-J7 (ePerformance).json`), **alors que l'instance n8n
  live a tous ces workflows à `active=False`**. Un ré-import de ces fichiers remettrait en route
  des envois concurrents du cron — exactement le « DOUBLE ENVOI » contre lequel
  `cron_sequences.php:33-34` met en garde.

---

### 4.3 Défauts mineurs (cosmétique, hygiène)

**m1 — `GET /` sert un HTML brut et la page accumule 98 erreurs 404.**
`prospect_app.py:2276-2278` renvoie le contenu de `cockpit.html` sans `send_from_directory` ;
98 lignes `404` dans les logs, majoritairement `/favicon.ico` et
`/site-eperformance/assets/fonts/*.woff2` (5 polices appelées, jamais servies) — donc
l'identité typographique du site ne s'applique pas au cockpit.

**m2 — Les logs de Flask et ceux du scraper partagent le même fichier.**
`LOG_FILE` est créé à l'import (`prospect_scraper.py:45`) et `logging.basicConfig` y branche la
racine (`:46-47`). Résultat : 76 fichiers `scraper_*.log` ne contenant que des lignes d'accès
HTTP. Aucun fichier n'est un journal d'acquisition exploitable.

**m3 — Le token API est en clair dans des fichiers client et versionné.**
`prospect_scraper.py:37`, `prospect_app.py:249`, `build_dashboard.py:22`, `content_engine.py`,
`api/*.php`. Il est injecté dans le `dashboard.html` livré (`build_dashboard.py:339-340`), ce qui
donne un droit d'écriture sur le CSV de production à quiconque possède le fichier. Aucune rotation,
aucune portée.

**m4 — Métriques affichées sans garde-fou de sens.**
`taux_reponse` divise par `contacted` qui additionne `Froid` (`prospect_app.py:159-160`) ;
`taux_conversion` peut valoir `None` et s'affiche `—` (`cockpit.html:830`) ; le KPI
« À relancer aujourd'hui » compte les tests (F5).

**m5 — Boîtes de dialogue natives mêlées aux composants maison.**
`prompt()` (`cockpit.html:1559`), `confirm()` (`cockpit.html:906`) à côté de modales `.overlay`
et de `toast()` (`cockpit.html:1475-1479`). Le `toast()` d'erreur ne s'affiche que 4,2 s et ne
laisse aucune trace consultable.

**m6 — Pas d'aperçu du message avant envoi, et pas de trace de ce qui a été envoyé.**
Aucune route ne retourne le message réellement associé à un envoi passé. `Score_Detail` est conservé
comme journal textuel (`prospect_scraper.py:151`) mais rien n'équivalent n'existe pour les messages.

---

## 5. Ce qui doit survivre, être fusionné, ou mourir

### 5.1 Doit survivre

| Brique | Preuve | Pourquoi elle survit |
|---|---|---|
| **`scraper_engine.search_osm`** (`scraper_engine.py:154-193`) | Testé en direct : Overpass et Nominatim répondent en < 3 s ; 60 éléments retournés | Seule source d'acquisition **réellement fonctionnelle** et sans clé ni quota. À garder, mais en corrigeant la promesse (U2) et en exploitant `site_web` (`scraper_engine.py:184`) au lieu du téléphone. |
| **`scraper_engine.parse_vcf`** (`scraper_engine.py:196-222`) | Lecture du code : gère `FN`/`N`, priorise `cell`/`mobile`/`whatsapp`/`voice` (l. 215), multi-numéros (`END:VCARD`, l. 218-221) | Import de contacts réel, sans dépendance externe, avec détection de doublons en aval. C'est l'entrée la plus probable de vrais prospects chauds (son propre réseau WhatsApp). |
| **`calculate_score`** (`prospect_scraper.py:132-151`) | Barème lisible et explicite ; `Score_Detail` documente chaque point | Le principe est bon et la traçabilité est excellente. À garder **en rendant `A_Site_Web` et `Email` saisissables**, sinon le barème reste décoratif (§2.2). |
| **`normalize_whatsapp` + `detect_pays`** (`prospect_scraper.py:252-274`) | 21/22 lignes déjà en forme normalisée ; `detect_pays` a correctement classé 22/22 | Fonctionne. À appliquer **systématiquement à l'écriture** (voir M1), ce qui n'est pas le cas aujourd'hui (`prospect_scraper.py:225`). |
| **Le garde-fou anti-ban** (`prospect_app.py:45-46,103-116`) | L'intention est juste ; la limite 10/h est cohérente avec `cron_sequences.php:10` (~6/h) | À conserver comme contrainte de conception, mais à **porter côté serveur** (voir M4). |
| **Le refus de doublon avec le nom du conflit** (`prospect_app.py:369-370`) | Message auto-explicatif : « Doublon : déjà utilisé par PROS-0xx — Nom » | Modèle à généraliser à toutes les écritures. |
| **Le webhook de réponses** (`webhook_reponse.php` piloté par n8n) | n8n live : ce workflow est `active=True` | C'est la **seule** brique de la chaîne qui fonctionne en production et qui a produit les 5 réponses. Elle doit devenir la source de vérité des statuts. |
| **L'anatomie de la carte prospect** (`cockpit.html:849-886`) | Score coloré + nom + badge + coordonnées + méta + actions | La densité d'information est bonne et lisible. À reprendre comme composant du design system unifié. |

### 5.2 Doit être fusionné

| À fusionner | Vers | Justification |
|---|---|---|
| **`build_dashboard.py` + `dashboard.html`** | **Le cockpit** (puis le dashboard unifié) | Doublon intégral : il recopie la vue (`build_dashboard.py:140-337`) et la logique (`infer_secteur:38`, `has_prenom:57`, 4 générateurs de messages `:66-94`, `SECTOR_HOOKS:24-36`, `compute_stats:126`). Il a **déjà divergé** (2 secteurs faux sur 6 testés, §3.3). Il n'est importé par personne et son artefact date du 2026-09-05. **C'est le seul verdict « mourir » du module : l'artefact `dashboard.html` et son générateur ne servent plus à rien.** |
| Les **7 copies de `SECTOR_HOOKS`** (`prospect_scraper.py:51`, `skills_engine.py:127`, `build_dashboard.py:24`, `prospect_scraper_v4.py`, `prospect_scraper_v5_authentique.py`, `whatsapp_integration_j0.py`, `whatsapp_meta_templates_sender.py`) | **Un seul registre d'accroches sectorielles** | Vérifié identiques entre les 3 copies vivantes. Toute modification doit être faite 7 fois aujourd'hui. |
| Les **3 générateurs de messages J0** (`prospect_scraper.get_j0_message:65`, `skills_engine._j0_variants:167`, `build_dashboard.get_j0:66`) | **Un générateur unique** | Vérifié : `prospect_scraper.get_j0_message(...) == skills_engine…variant_A.message` → `True`. Deux copies strictement identiques, une troisième divergente. |
| Les **4 systèmes de templates** (v3 codé en dur, `templates_whatsapp_j0_optimises.json`, `templates_whatsapp_j0_v5_authentiques.json`, variantes `skills_engine`) + le template Meta `j0_diagnostic` (`templates_whatsapp_meta.md:21`) | **Une bibliothèque de messages avec l'identifiant Meta sur chaque entrée** | Le seul template qui atteint le prospect est celui de Meta, et c'est le seul qui n'est pas dans le dépôt. Les 3 autres sont du travail mort (le J0 réel dit encore « Stéphane » et « Telegram », §1.3). |
| **`prospect_scraper_v4.py`** + **`prospect_scraper_v5_authentique.py`** | **Rien. À supprimer.** | v4 : lu seulement par deux fichiers jamais importés par l'application. v5 : importé par **personne**. Leurs corrections (Ballo, retrait de Telegram, offres réelles à 100 000 FCFA) doivent être **reprises dans le générateur unique**, puis les fichiers supprimés. |

### 5.3 Doit mourir

| À faire mourir | Preuve | Motif |
|---|---|---|
| **`dashboard.html`** (artefact gelé, 2026-09-05 23:47) et **`build_dashboard.py`** | §5.2 | Doublon divergé, écrit dans la production sans lecture de contrôle, régénérable seulement par CLI, n'écrit plus depuis 14 jours. |
| **`prospect_scraper_v5_authentique.py`** | 0 import | Mort-né. |
| **`prospect_scraper_v4.py`** | Importé seulement par 2 fichiers non branchés sur l'application | Mort côté outil ; sa valeur est à extraire avant suppression. |
| **`real_research.py`** | Source absente ; seul `__pycache__/real_research.cpython-312.pyc` subsiste ; 0 import | Ses dépendances (SerpAPI, Pexels) ont été retirées par `a4de048`. À retirer du `.pyc` et de la documentation. |
| **`Variation_Message`** (colonne) | Écrite aléatoirement (`prospect_scraper.py:228`), **lue par aucun chemin vivant** | Faux test A/B : la colonne enregistre un tirage au sort qui ne change aucun message. À remplacer par un identifiant de message réellement utilisé, ou supprimer. |
| **`/api/qualify`** | `skills_engine.py:63,116` — retourne le score d'entrée inchangé ; seuils identiques à `score_label` (`prospect_scraper.py:153-156`) | Zéro information produite pour 1 clic et 1 aller-retour. À supprimer, ou à transformer en vraie qualification (voir §6). |
| **Le `<select>` de statut libre sur la carte** (`cockpit.html:881-883`) | 10 statuts dont 4 produisent un état sans action (`prospect_app.py:90`) ; `Froid` est ambigu (`:84`) | Exposer 10 statuts bruts à l'utilisateur, c'est lui demander de piloter une machine à états qui n'est pas documentée et dont 2 valeurs se contredisent. À remplacer par des actions nommées. |
| **La réconciliation manuelle** `🔄 Sync serveur` | 0 appel sur 76 logs ; l'utilisateur n'a jamais cliqué | Un mécanisme correctif que personne n'utilise est une dette : la synchronisation doit être automatique et invisible, ou disparaître. |
| **`profile.d` du token en dur** (5 fichiers) + `?key=` en query string | `prospect_app.py:249`, `prospect_scraper.py:37`, `build_dashboard.py:22` | Secret partagé en clair, présent dans un HTML client, sans rotation. |

---

## 6. Ce que le module doit devenir dans un dashboard SaaS unifié

Niveau fonctionnel uniquement. Chaque écran est justifié par un défaut mesuré.

### 6.1 Écran « Pipeline » (écran d'entrée du module)

**Fonction** : une seule liste, un seul état par prospect, lu depuis **une** source.
**Corrige** : F1, F2, F5, U6, m4.

- **Un bandeau de vérité** en tête : nombre de prospects, dont contactés, dont réponses reçues,
  dont réponses positives, temps médian depuis le dernier contact. Chaque chiffre doit afficher sa
  base de calcul (« 3 / 18 contactés ») et non un pourcentage seul.
- **Deux colonnes de travail**, pas dix statuts : *À faire* (une action nommée, avec son échéance) et
  *En attente* (avec la raison de l'attente, pas seulement le délai). Tout état doit produire soit
  une action, soit une explication — plus jamais une carte inerte comme les 20 d'aujourd'hui.
- **La carte doit afficher le message tel qu'il sera envoyé**, adressé correctement : le faux prénom
  (`Salut Longrich,`) doit être impossible, soit en corrigeant la détection, soit en n'utilisant
  jamais le nom de page comme prénom. La salutation est un choix explicite de l'utilisateur, pas une
  déduction.
- **Un état « à recontacter » distinct de « échec d'envoi »** : « Froid » mélange aujourd'hui deux
  situations opposées (§4.1 F2) — un prospect jamais joignable et un prospect à réactiver dans
  30 jours. Le dashboard SaaS doit les séparer, sinon la même impasse se reproduira.
- **Le statut n'est pas un menu** : remplacer les 10 valeurs brutes par des actions nommées
  (« J'ai envoyé le 1er message », « Il a répondu oui », « Il a refusé », « Ne plus contacter »).
  La machine à états reste interne.

### 6.2 Écran « Trouver des prospects »

**Fonction** : les trois entrées, dans l'ordre de rendement réel.
**Corrige** : F4, U2, U3.

- **Ordre imposé par la mesure** : (1) Contacts .vcf — la seule entrée qui apporte un téléphone ;
  (2) OpenStreetMap — 4 % de téléphones mais des sites web exploitables, à vendre autrement ;
  (3) Ads Library — aucun téléphone par construction, à traiter comme une **liste de pages à
  qualifier**, pas comme un pipeline.
- **Un écran de revue avant import**, pas des cases pré-cochées (`cockpit.html:1506`). Chaque
  candidat doit être vu, éditable, et son numéro saisissable **dans le tableau** — pas dans un
  `prompt()` un par un (`cockpit.html:1559`). L'import d'un candidat sans téléphone doit être
  présenté comme « à compléter », avec un compteur de complétion visible, au lieu d'injecter
  60 lignes inutilisables.
- **Ne jamais afficher une promesse non mesurée.** Le texte « Numéros souvent présents pour
  Ouaga/Abidjan » doit devenir un taux réel calculé après la recherche (« 2 numéros sur 52 »).
- **La saisie manuelle reste une entrée de plein droit** : c'est aujourd'hui 100 % de la base
  réelle (18/18 lignes `Source_Acquisition = cockpit`). Elle doit permettre de saisir **tous** les
  champs qui comptent dans le score — site web et email compris (§2.2) — faute de quoi le score
  restera un barème décoratif.

### 6.3 Écran « Conduite de la séquence »

**Fonction** : savoir quoi envoyer, quand, et l'avoir envoyé.
**Corrige** : F3, F4, U4, U7, m6.

- **Un seul chemin d'envoi**, et il produit une trace : aperçu du message exact → envoi →
  enregistrement. Deux boutons distincts (« Aperçu » / « Marquer comme envoyé ») rendent
  impossible l'état actuel où l'on marque un envoi qui n'a pas eu lieu.
- **L'envoi automatique doit être piloté depuis l'application**, pas depuis un template créé à la
  main dans Meta. L'écran doit montrer, pour chaque modèle de message, **son statut d'approbation
  Meta** — le module est tombé en panne pour une erreur `#132001` invisible depuis le cockpit
  (§4.1 F3). Un template non approuvé doit bloquer la séquence **avec un message clair**, et non
  parquer silencieusement la base entière en « Froid ».
- **Cadence paramétrable par l'utilisateur** (délais par défaut proposés, modifiables), au lieu de
  3 / 4 / 30 jours en dur (`prospect_app.py:77,82,88`). Le bouton doit être disponible quand
  l'utilisateur décide d'agir, avec un avertissement — pas caché pendant 30 jours.
- **Un journal par prospect** : quel message, quand, par quel canal, avec quel résultat. Aujourd'hui
  aucune route ne restitue ce qui a été envoyé (§4.3 m6) ; `Nombre_Contacts` et `Date_Contact` sont
  la seule trace, et ils sont faux localement.

### 6.4 Écran « Réponses »

**Fonction** : transformer une réponse en suite.
**Corrige** : F1, F5.

- **Mise en avant absolue.** Trois prospects ont répondu favorablement et l'interface actuelle les
  affiche « Froid ». Dans le dashboard unifié, une réponse positive doit remonter en tête, avec le
  message reçu, l'historique de la séquence et un bouton de passage en conversation.
- **Une entrée unique de vérité pour les statuts** : le webhook de réponses
  (`webhook_reponse.php`, seul élément de la chaîne qui fonctionne aujourd'hui) doit écrire dans la
  même source que l'interface lit. La divergence de 20 lignes sur 22 (§2.3) doit devenir
  structurellement impossible : une seule base, un seul écrivain par champ.

### 6.5 Écran « Hygiène du pipeline »

**Fonction** : voir ce qui pourrit.
**Corrige** : F5, U5, §2.2.

- **Colonnes jamais remplies** : le dashboard doit les signaler comme telles au lieu de les afficher
  vides en silence. Une colonne qui n'est jamais remplie et qui rapporte des points (`Email` → +5)
  ou des points par défaut (`A_Site_Web` → +20 sur 100 % des lignes) fausse tout le classement.
- **Lignes de test** : un marqueur explicite, un filtre par défaut qui les exclut des KPI, et une
  suppression possible. Aujourd'hui 4 lignes sur 22 sont des tests, elles ont été contactées par le
  cron, et aucune route ne permet de les supprimer (§4.1 F5).
- **Un rapport de cohérence** en une vue : numéros non normalisés, noms en Unicode exotique,
  `Nombre_Contacts > 0` sans `Date_Contact`, statuts sans action possible. Tous ces cas existent
  dans les 22 lignes actuelles et sont aujourd'hui invisibles.

### 6.6 Ce que le module ne doit plus jamais faire

1. **Faire diverger ce qui est affiché de ce qui est vrai.** Le défaut le plus coûteux du module
   n'est pas technique : c'est un tableau de bord qui annonce `0 % de réponse` et `Froid` quand il y
   a 3 réponses positives. C'est reproductible tant que deux copies des données coexistent.
2. **Confondre « j'ai ouvert WhatsApp » et « j'ai contacté ».** Marquer un contact est une action de
   l'utilisateur, pas un effet de bord d'un `window.open`.
3. **Dépendre d'un artefact créé à la main hors du dépôt** (template Meta, feuille de calcul,
   `prompt()` de navigateur) sans le surveiller et sans alerter quand il disparaît.
4. **Empiler des couches parallèles** au lieu de remplacer. Ce module compte aujourd'hui :
   4 chaînes d'envoi/écriture, 3 générateurs de message identiques, 7 copies des accroches
   sectorielles, 4 systèmes de templates, 2 interfaces complètes. Chaque ajout a coûté sans en
   retirer aucun.

---

## Annexe A — Commandes de vérification

Toutes exécutées en lecture seule le 2026-09-19.

```bash
# Remplissage des 26 colonnes
python3 -c "import csv;rows=list(csv.reader(open('prospects_tracking.csv',encoding='utf-8-sig')))…"

# État réel du cockpit (instance vive)
curl -s http://127.0.0.1:8788/api/state

# Écart local / serveur (source de vérité)
curl -s -H "Authorization: Bearer ep_perf_secret_token_2026" \
     https://api.eperformance.pro/lecture_csv.php

# Routes réellement atteintes, sur 76 logs
grep -rhoE '"(GET|POST) /[^ ]*' prospecting_logs/*.log | sort | uniq -c | sort -rn

# Envois du cron serveur et parking en Froid
grep -c "ENVOYÉ"   Eperformance/data/cron_debug.log   # 47
grep -c "PARKING"  Eperformance/data/cron_debug.log
cat Eperformance/data/cron_state.json

# Workflows n8n réellement actifs (instance live)
python3 -c "import sqlite3;c=sqlite3.connect('file:/home/ballo/n8n-compose/n8n_data/database.sqlite?mode=ro',uri=True);…"

# Téléphones réellement présents dans OSM (Ouagadougou, restaurants)
curl -s --data-urlencode 'data=[out:json][timeout:60];(nwr["amenity"~"^(restaurant|fast_food|cafe)$"](around:8000,12.3681873,-1.5270944););out center tags 60;' \
     https://overpass-api.de/api/interpreter

# Faux prénoms sur les données réelles
python3 -c "import prospect_scraper as ps; … ps.has_prenom(r['Nom_Prospect']) …"
```

## Annexe B — Fichiers du module et leur statut

| Fichier | Taille | Dernière modif. | Statut |
|---|---|---|---|
| `prospect_app.py` | 101 Ko / 2382 l. | 2026-09-19 04:06 | **Vivant** — backend du cockpit |
| `cockpit.html` | 147 Ko / 2600 l. | 2026-09-19 04:09 | **Vivant** — interface servie sur `/` |
| `prospect_scraper.py` | 41 Ko / 821 l. | 2026-09-10 17:23 | **Vivant** — cœur métier |
| `scraper_engine.py` | 10 Ko / 229 l. | 2026-09-07 19:34 | **Vivant** — 3 sources |
| `skills_engine.py` | — | — | Vivant, mais `/api/qualify` sans effet |
| `prospects_tracking.csv` | 6,3 Ko / 22 l. | 2026-09-07 19:34 | **Périmé** (20/22 lignes fausses) |
| `prospect_scraper_v4.py` | 12 Ko / 310 l. | 2026-09-10 18:54 | Mort côté outils — corrections à extraire |
| `prospect_scraper_v5_authentique.py` | 12 Ko / 312 l. | 2026-09-10 19:36 | **Mort** — 0 import |
| `real_research.py` | — | — | **Source supprimée** (seul le `.pyc`) |
| `build_dashboard.py` | 36 Ko / 534 l. | 2026-09-07 19:34 | **Mort** — 0 import, doublon divergé |
| `dashboard.html` | 226 Ko | 2026-09-07 19:34 | **Gelé** — généré le 2026-09-05 23:47 |
| `api/*.php` (13 fichiers) | 180 Ko | 2026-09-07 19:34 | Partiellement vivant — 3 endpoints encore appelés |
| `n8n/*.json` (4 fichiers) | 49 Ko | 2026-09-07 19:34 | Exports périmés — 1 seul workflow actif en live |
| `agents/sales/` (9 `.md`), `agents/research/` (2 `.md`) | 176 Ko | 2026-09-07 19:34 | **Prompts en prose, aucun lien avec le code** : `grep "agents/sales\|agents/research"` sur `.py`/`.html`/`.json` → 0 résultat. Ce ne sont pas des compétences exécutables ; le module ne les lit jamais. (Le dossier `agents/` complet compte 29 `.md` sur 5 sous-dossiers.) |
| `publications_archive.csv` | 54 Ko / 234 l. x 6 c. | 2026-09-19 00:33 | **Hors périmètre M1** — archive de déduplication éditoriale (Hash, Pilier, Plateforme, Texte_Extrait). 100 % remplie, mais ne contient **aucune donnée de prospect**. À traiter avec le module Publications. |
