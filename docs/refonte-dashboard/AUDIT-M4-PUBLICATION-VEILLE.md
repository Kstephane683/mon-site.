# AUDIT M4 — PUBLICATION, CALENDRIER, VEILLE ET MESURE

**Module audité** : publication sociale (file d'attente, calendrier, programmation,
synchronisation serveur, archive anti-répétition), veille concurrentielle, mesure.
**Date de l'audit** : 19 septembre 2026.
**Version du code en cours d'exécution** : `TOOLKIT_VERSION = "5.0.6"`
(`TOOLKIT/content_engine.py:59`), confirmé par `/api/system-check`.
**Nature** : audit fonctionnel et UX, lecture seule. Aucune route modificatrice n'a été
appelée. Aucun fichier du toolkit n'a été modifié.

## Conventions de lecture

| Jeton | Chemin absolu |
|---|---|
| `TOOLKIT/` | `/home/ballo/OX6A/toolkit_eperformance/` |
| `SERVER/` | `/home/ballo/OX6A/toolkit_eperformance/Eperformance/` |
| `BLOG/` | `/home/ballo/OX6A/blog-eperformance/` |
| `APP` | `TOOLKIT/prospect_app.py` — l'application Flask (serveur local, port 8788) |
| `ENGINE` | `TOOLKIT/content_engine.py` — moteur de contenu + sync serveur |
| `COCKPIT` | `TOOLKIT/cockpit.html` — l'unique écran (2 600 lignes) |

Toutes les citations `fichier:ligne` renvoient à ces fichiers. Les commandes exécutées sont
citées entre backticks. Les valeurs de jetons et de clés ne sont **jamais** reproduites :
seuls le fichier, la ligne et la nature sont signalés.

**Note de vocabulaire** : le présent audit distingue « **générer** » (produire un texte, coût
LLM, aucun effet externe) de « **publier** » (effet externe irréversible sur Facebook,
Instagram, LinkedIn, WhatsApp). Le module confond les deux dans son vocabulaire d'interface.

---

## 1. Le cycle de vie d'une publication

### 1.1 Les états réels, prouvés par le code

Le statut vit dans la colonne `Statut` d'un CSV. Les valeurs réellement écrites par le code
sont au nombre de **cinq**, et pas une de plus :

| Valeur | Qui l'écrit | Preuve |
|---|---|---|
| `brouillon` | génération à l'unité et en lot | `APP:539`, `APP:604`, `ENGINE:2660`, `ENGINE:2700` |
| `programmee` | programmation unitaire, calendrier hebdo, `programmer-tout`, `reprogrammer-echecs`, `publier-maintenant` | `APP:754`, `APP:857`, `APP:934`, `APP:2205`, `ENGINE:1860` |
| `publie` | le cron serveur, après succès de l'API du réseau | `SERVER/cron_publications.php:522` |
| `echec` | le cron serveur, après échec d'un envoi | `SERVER/cron_publications.php:546` |
| `erreur` | le cron serveur, **parking** après 3 échecs consécutifs | `SERVER/cron_publications.php:447` |

L'interface connaît exactement ces cinq valeurs — et les colore
(`COCKPIT:1080`) :

```js
const stColor={'brouillon':'var(--muted)','programmee':'#E6B85C','publie':'#7FB069',
               'echec':'var(--red-text)','erreur':'var(--red-text)'}[p.Statut]||'var(--muted)';
```

### 1.2 Les transitions

```
                   ┌──────────── /api/publications/generate[-batch] ───────────┐
                   ▼                                                           │
             ┌───────────┐  /schedule  ou  /schedule-all                        │
             │ brouillon │ ──────────────────────────────► ┌────────────┐        │
             └───────────┘                               │ programmee │◄───────┘
                   ▲                                     └─────┬──────┘
                   │  /publier-maintenant accepte                 │ cron : Statut
                   │  brouillon | echec | programmee (APP:854)     │ == "programmee"
                   │                                              │ et Date_Prevue <= now
                   │              ┌───────────────────────────────┤ (cron:422-431)
                   │              ▼                               ▼
                   │        ┌──────────┐                    ┌──────────┐
                   │        │  echec   │◄───────────────────│  publie  │
                   │        └────┬─────┘   échec API réseau └──────────┘
                   │             │ 3 échecs consécutifs
                   │             ▼
                   │        ┌──────────┐
                   └────────│  erreur  │  (parking — le cron ne réessaie plus)
                            └──────────┘
```

Deux transitions sont notables et contre-intuitives :

- **`erreur` n'est pas terminal côté application.** Le cron seul sort de `erreur` : jamais
  (`cron:425` n'accepte que `programmee`). Il faut un geste manuel
  « 🔄 Reprogrammer échecs » (`APP:913-942`) ou « 📅 Programmer tout » (`APP:2150-2223`),
  qui remettent le statut à `programmee` sans condition de date.
- **`publier-maintenant` réécrit `Date_Prevue` à « maintenant − 1 minute »** (`APP:858`)
  avant de réveiller le cron avec `force_id`. Ce n'est pas une publication directe : c'est
  une programmation antidatée plus un appel forcé.

### 1.3 Les trois registres de statut — et lequel fait foi

L'audit antérieur annonçait « **3 registres de statut** pour une publication »
(`/home/ballo/OX6A/site-eperformance/docs/refonte-cockpit/CONCEPTION.md:27`). Le compte est
exact. Les voici, nommés précisément.

**Registre 1 — `TOOLKIT/publications.csv`, colonne `Statut`.**
C'est le registre **local**, celui que l'écran lit et affiche. Écrit uniquement par
l'application Flask (`APP:539,604,754,857,934,2205`) et le calendrier (`ENGINE:1860`).
Lu par `/api/publications` (`APP:486-497`) et `/api/publications/stats`
(`APP:964-982`). État mesuré ce jour : **7 lignes, 7 × `brouillon`**, aucune date prévue.

**Registre 2 — `SERVER/data/publications.csv`, colonne `Statut`.**
C'est le registre **réel** : c'est le seul fichier lu par le cron qui publie
(`SERVER/cron_publications.php:425` : `if ($id === '' || $statut !== 'programmee') continue;`).
Il porte aussi `Post_ID`, `Erreur` et les métriques que le cron met à jour via
`maj_publication()` (`SERVER/cron_publications.php:342-376`). État mesuré ce jour :
**48 lignes — 45 `programmee`, 3 `publie`**, avec trois identifiants de poste réels :

| ID | Plateforme | `Post_ID` | Preuve |
|---|---|---|---|
| PUB-0004 | LinkedIn | `urn:li:share:7502533761818058752` | `SERVER/data/publications.csv` |
| PUB-0006 | Facebook | `1003455406186579_122121673881254181` | idem |
| PUB-0013 | LinkedIn | `urn:li:share:7502786433146052608` | idem |

**Registre 3 — `SERVER/data/publications_state.json`.**
Registre **d'exécution** du cron, par publication : compteurs d'échecs (`failures`),
horodatage du dernier envoi (`last_send`), plafonds du jour (`sent_today`,
`platforms_today`, `day`). Défini en `SERVER/cron_publications.php:53`, écrit en
`SERVER/cron_publications.php:226-227`. État mesuré :

```json
{"last_attempt_ts":1788823110,"day":"2026-09-09","sent_today":0,
 "failures":{"PUB-0013":0,"PUB-0020":1},"last_send":{"PUB-0013":1788803680},
 "platforms_today":[]}
```

Ce registre est **invisible depuis l'interface** : aucune ligne du code **Python** de
l'application ne le lit (vérifié : `grep -rn "publications_state" TOOLKIT/` ne renvoie que le
script serveur lui-même — `TOOLKIT/api/cron_publications.php:52` — et une mention dans
`PLAN_UNIFICATION_EPERFORMANCE.md:752`). Il porte pourtant l'information la plus décisive pour l'utilisateur — « cette
publication a déjà échoué 2 fois sur 3 avant d'être parquée ».

**Correction d'une erreur de l'audit antérieur.** Le document `CONCEPTION.md:9` cite
`publications_states.json` (avec un « s ») comme une donnée du toolkit. **Ce fichier
n'existe pas** : `find` sur les deux arborescences ne trouve que
`SERVER/data/publications_state.json` (sans « s »), et aucune ligne de code du toolkit n'y
fait référence. Le troisième registre est **côté serveur**, pas côté toolkit.

**Lequel fait foi ?** Le code tranche explicitement, et la réponse n'est pas celle que
l'écran laisse croire :

- **Le registre 2 fait foi** pour tout ce qui a un effet externe. Deux mécanismes le
  verrouillent :
  1. à la montée, `SERVER/upload_publications.php:237` : si le statut serveur est déjà
     `publie`, `echec` ou `erreur`, le serveur **réécrit** ses huit champs (`Statut`,
     `Post_ID`, `Erreur`, `Vues`, `Likes`, `Commentaires`, `Partages` — liste en
     `SERVER/upload_publications.php:95`) et ignore ce que le local propose ;
  2. à la descente, `ENGINE:2436` déclare la même liste `SERVER_OWNED_FIELDS`, et
     `pull_publications_server()` (`ENGINE:2397-2490`) écrase le local par le serveur pour
     ces champs.
- **Le registre 1 fait foi** pour le contenu (`Texte`, `Hashtags`, `CTA`, `Image_Path`) :
  c'est écrit en clair, « Le local fait foi pour : le contenu (Texte, etc.) »
  (`ENGINE:2401`).
- **Le registre 3 fait foi** pour une seule question : « le cron va-t-il réessayer ? »
  (`SERVER/cron_publications.php:444-453`).

**Conséquence opérationnelle** : l'écran du cockpit n'affiche **jamais** la vérité sur ce qui
est publié, sauf si l'utilisateur a cliqué manuellement sur « 📥 Récupérer statuts serveur »
(`APP:1903`) — action qui n'est déclenchée par aucun automatisme, ni à l'ouverture du
panneau, ni par le cron. Tant que ce bouton n'est pas cliqué, l'utilisateur voit
`7 publications · 0 publiées` (`/api/publications/stats`, mesuré) alors que **3 publications
sont sorties sur LinkedIn et Facebook**. C'est exactement la « peur de publier deux fois »
que l'audit antérieur qualifiait de rationnelle : elle l'est, parce que l'outil entretient
l'ignorance.

### 1.4 Le défaut de statut le plus grave : la collision d'identifiants

`_next_pub_id()` (`APP:441-453`) a été corrigé en septembre pour éviter les collisions
d'ID après suppression. Mais la correction ne couvre **que** cette fonction. Deux autres
chemins **réattribuent les mêmes identifiants à du contenu neuf** :

- `generate_weekly_calendar()` numérote **à partir de 1** à chaque appel
  (`ENGINE:1810` `pid_counter = 1` ; `ENGINE:1849` `"ID": f"PUB-{pid_counter:04d}"`).
  Régénérer le calendrier réécrit `PUB-0001`…`PUB-0049` avec d'autres textes.
- Le mode `append` de `/api/publications/weekly-calendar` recalcule les IDs en
  `f"PUB-{i:04d}"` à partir de `len(existing)+1` (`APP:629-630`) — soit exactement le bug
  que `_next_pub_id` avait corrigé ailleurs.

Ce n'est pas théorique : **c'est arrivé**. Les sept publications locales ont été régénérées
le 19/09 à 00h32, et leurs identifiants recouvrent ceux du serveur :

| ID | Contenu local (19/09 00h32) | Contenu serveur (même ID) | Statut serveur |
|---|---|---|---|
| PUB-0004 | « 200 prospects qualifiés par mois… » (LinkedIn) | « Mythe : "Pour être visible sur Google…" » | `publie` |
| PUB-0006 | « J'ai dépensé 1000 FCFA… » (LinkedIn) | « Votre agence n'apparaît pas sur Google Maps ? » | `publie` |
| PUB-0001 | « Apprendre l'acquisition seul… » | « La question que personne ne pose… » | `programmee` |

Preuve : comparaison des premières lignes des deux CSV
(`TOOLKIT/publications.csv` et `SERVER/data/publications.csv`), sept identifiants communs,
sept textes différents.

**Effet chaîné, démontrable par lecture du code** : à la prochaine synchronisation,
`SERVER/upload_publications.php:237` voit le statut serveur `publie` pour `PUB-0004` et
réécrit `Statut='publie'` + `Post_ID` + métriques sur la **nouvelle** publication. Le
contenu inédit du 19/09 sera donc :
1. marqué publié alors qu'il ne l'est pas ;
2. jamais publié (le cron ne prend que `programmee`, `cron:425`) ;
3. remonté comme « publié » au prochain pull, ce qui **confirme à l'utilisateur une
   publication qui n'a pas eu lieu**.

C'est le défaut le plus grave du module : il inverse le sens de la garde anti-double-
publication (voir §4.4).

---

## 2. Calendrier et programmation

### 2.1 Comment on programme un lot — le parcours réel

Trois chemins existent, et un seul est correct.

**Chemin A — unitaire : `/api/publications/<id>/schedule`** (`APP:741-782`).
Interface : `schedulePub()` (`COCKPIT:1135-1143`), **1 `prompt()` natif** avec un défaut
calculé (maintenant + 1 h). Vérifie que `date_prevue` est non vide (`APP:748`), écrit
`Statut='programmee'`, `Date_Prevue`, efface `Erreur`, sauve, **puis synchronise le serveur
automatiquement** (`APP:766-778`). L'échec de la synchro est rapporté sans annuler la
programmation locale (`sync_warning`, `APP:778`). Ce chemin est cohérent.

**Chemin B — calendrier hebdomadaire : `/api/publications/weekly-calendar`**
(`APP:616-636`). Interface : `genWeekly()` (`COCKPIT:1118-1126`), 1 clic + 1 `confirm()`.
Le serveur appelle `generate_weekly_calendar()` (`ENGINE:1800-1876`), qui produit
**7 jours × 7 créneaux = 49 publications** (`ENGINE:1789-1798`, 7 créneaux horaires fixes),
puis **remplace intégralement le CSV** (`mode="replace"` par défaut, `APP:625,632`) — sans
sauvegarde, sans fusion, sans archivage des lignes détruites, et **sans synchronisation du
serveur**. Le bouton prévient (« cela remplacera les publications existantes »,
`COCKPIT:1119`), mais l'opération est irréversible : aucun `backup` n'est fait, contrairement
à `pull_publications_server()` qui écrit un `.csv.bak` (`ENGINE:2478-2480`).

**Chemin C — lot : `/api/publications/schedule-all`** (`APP:2150-2223`).
Interface : `scheduleAllModal()` (`COCKPIT:1416-1440`).

### 2.2 Vérification du constat « 3 `prompt()` natifs »

**Le constat de l'audit antérieur est exact**, et il est même incomplet sur les
conséquences. Relevé :

```js
COCKPIT:1419  const dateBase=prompt('Date de base (YYYY-MM-DD HH:MM:SS) :', defaultDate);
COCKPIT:1421  const mode=prompt('Mode de programmation : …\n\n1. single …\n2. custom …\n3. increment …\n\nTape 1, 2 ou 3 :', '3');
COCKPIT:1426  const inc=prompt('Incrément en minutes entre chaque publication … :', '30');
```

Détail des trois boîtes :

1. **Date de base** — format `YYYY-MM-DD HH:MM:SS` à saisir, prérempli à « aujourd'hui
   08:00:00 ». L'utilisateur corrige à la main ; aucune saisie guidée, aucun calendrier.
2. **Mode** — l'utilisateur doit **taper `1`, `2` ou `3`** dans une boîte de texte, avec un
   libellé qui explique trois modes… dont deux sont identiques côté serveur (voir ci-dessous).
   Le défaut est `3`.
3. **Incrément en minutes** — posée **uniquement** si le mode vaut `3` ou `increment`
   (`COCKPIT:1424`).

**Parcours réel, compté.** Pour programmer un lot avec les défauts :

| Étape | Action | Clics | Saisies |
|---|---|---|---|
| 1 | Ouvrir le panneau Publications (`COCKPIT:289`) | 1 | 0 |
| 2 | « 📅 Programmer tout » (`COCKPIT:781`) | 1 | 0 |
| 3 | `prompt` date — accepter le défaut ou corriger | 1 | 0 ou 1 |
| 4 | `prompt` mode — taper `3` puis valider | 1 | 1 |
| 5 | `prompt` incrément — accepter `30` | 1 | 0 ou 1 |
| 6 | **Puis** « 📤 Sync serveur » (`COCKPIT:765`) + `confirm` (`COCKPIT:1258`) | 2 | 0 |
| | **Total minimum** | **7** | **1** |
| | **Total si l'utilisateur refuse les défauts** | 7 | 3 |

**Le point décisif** : l'étape 6 est **obligatoire et non signalée**. `schedule-all` écrit le
CSV local et **rien d'autre** — vérifié : la fonction ne contient aucun appel à
`sync_publications_server` (`APP:2150-2223`). L'utilisateur qui programme 49 publications et
ferme l'onglet n'a rien programmé côté serveur : le cron ne verra jamais ces lignes. Le
même défaut affecte « 🔄 Reprogrammer échecs » (`APP:913-942`, aucun appel de sync) et
« 🗑️ Tout supprimer » (`APP:2225-2273`, aucun appel de sync — le serveur garde donc les
publications supprimées, et le prochain `pull` les **réimporte** explicitement,
`ENGINE:2468-2469`).

### 2.3 Ce qui se passe réellement côté serveur

Le cron (`SERVER/cron_publications.php`) est documenté « toutes les 30 min » et publie
**une publication au maximum par exécution** (`START-HERE.txt:11`,
`SERVER/cron_publications.php:8-10`). Ses garde-fous, tous lus au même endroit :

| Garde-fou | Valeur | Ligne |
|---|---|---|
| Verrou anti-parallélisme | `cron.lock` | `cron:79-95` |
| Délai minimum entre deux publications | **1 800 s (30 min)** | `cron:50` |
| Plafond journalier | **7 / jour** | `cron:51` |
| Plafond par plateforme | **2 / jour** | `cron:52` |
| Échecs consécutifs avant parking | **3** | `cron:53` |

**Conséquence directe du mode `single`/`custom` de `schedule-all`** : quand le mode n'est pas
`increment`, **toutes** les publications reçoivent la **même** `Date_Prevue`
(`APP:2197-2198`). Quarante-neuf publications deviennent simultanément éligibles, et le cron
n'en sortira que 7 par jour, 2 par plateforme, une toutes les 30 minutes. La file d'attente
résiduelle est invisible : aucun écran n'affiche « il reste 42 publications en retard ».
Le mode `custom` est par ailleurs un **doublon strict** de `single` : même branche de code
(`APP:2197`), même comportement. Le `prompt` propose donc trois choix pour deux
comportements — et la docstring de la route l'assume (`APP:2155` : « mode 'custom' : toutes
à une date personnalisée (date_base) »).

### 2.4 Ce qui se passe en cas d'échec

- **Échec de génération** (LLM indisponible) : `generate-batch` sauvegarde ce qui est déjà
  généré et retourne 503 avec `generated_so_far` (`APP:580-588`) ; `generate_content` lève
  `ContentGenerationError` après 3 tentatives LLM et **aucun repli silencieux** sur les
  gabarits (`ENGINE:1304-1322`). C'est un bon comportement, obtenu par correctif explicite.
- **Échec de programmation locale** : impossible à échouer silencieusement, la route valide
  la date (`APP:749`) et l'existence de la publication (`APP:759-760`).
- **Échec de synchronisation** : détecté et rapporté pour le chemin unitaire
  (`APP:773-778`), **totalement absent** pour les chemins de lot (§2.2).
- **Échec de publication sur le réseau** : le cron incrémente `failures[id]`
  (`cron:544`), écrit `Statut='echec'` avec le message d'erreur tronqué à 300 caractères
  (`cron:546-547`), envoie un message Telegram (`cron:551`), et **parke** en `erreur` au
  troisième échec (`cron:444-453`). Le log serveur en porte la trace :

```
2026-09-07 15:31:42 — ÉCHEC PUB-0005 → instagram : IG container HTTP 400: {"error":{"message":
  "Only photo or video can be accepted as media type.", … "Impossible de récupérer le contenu
  multimédia à partir de cette URI : https://api.eperformance.pro/assets_pubs/PUB-0005.png" …}}
2026-09-08 01:18:32 — ÉCHEC PUB-0020 → instagram : (même erreur)
```

**Instagram est cassé en production, de façon reproductible**, et la cause est nommée par
l'API elle-même : l'URL d'image servie par `api.eperformance.pro/assets_pubs/…` ne répond pas
aux exigences du récupérateur Meta (voir aussi
`2026-09-06 16:00:23 — ÉCHEC PUB-0006 → instagram : image non accessible publiquement (HTTP 500)`).
Deux publications ont été parquées pour cette raison. Aucun écran du cockpit ne le dit : il
faudrait ouvrir `SERVER/data/publications_state.json` à la main.

---

## 3. Synchronisation avec le serveur distant

### 3.1 Ce que fait `sync_publications_server()`

Définie en `ENGINE:2156-2393`. Elle pousse le contenu local vers `api.eperformance.pro` en
deux temps, et elle est **strictement montante**.

**Étape 0 — test de vie** (`ENGINE:1988-2017`, appelé en `ENGINE:2181`) : une requête `GET`
sur la racine de l'API. Un code HTTP d'erreur (401, 404, 500) compte comme « vivant » et
laisse passer la synchronisation (`ENGINE:2004-2006`) ; seule une panne réseau déclenche le
retour immédiat avec un message actionnable (`ENGINE:2182-2188`).

**Étape 1 — le CSV** (sauf `only_assets`) :
- `POST {api_base}/upload_publications.php`, multipart, champ `csv_file`, type `text/csv`,
  timeout 90 s, jusqu'à 5 tentatives (`ENGINE:2205-2223`, `ENGINE:2047-2050`).
- Succès exigé : `status == "success"` dans la réponse JSON (`ENGINE:2224`).
- Ce que fait le serveur : sauvegarde l'ancien fichier en
  `SERVER/data/publications_backup_<date>.csv` (`SERVER/upload_publications.php:133-140`),
  puis **fusionne** — le mode par défaut est `merge` (`SERVER/upload_publications.php:92`).
  Les champs serveur sont préservés pour les publications terminées
  (`SERVER/upload_publications.php:237`).

**Étape 2 — les images** (sauf `only_csv`) : pour chaque fichier de `assets_pubs/`
(`*.png *.jpg *.jpeg *.webp *.gif *.mp4 *.mov *.webm`, récursif) :
- d'abord un test d'existence distante `GET …?nocache=<horodatage>` avec `Range: bytes=0-0`
  (`ENGINE:2018-2045`) — l'anti-cache est un contournement du cache LWS qui sert des 500
  « absent » périmés ;
- upload seulement si absent, sauf `reupload_all=True` (`ENGINE:2283-2296`) ;
- `POST {api_base}/upload_asset.php`, timeout 180 s, 5 tentatives (`ENGINE:2320-2333`) ;
- vérification publique après upload avec URL anti-cache (`ENGINE:2335-2365`).

**Ce que la synchronisation NE fait pas** : elle ne tire rien. C'est
`pull_publications_server()` (`ENGINE:2397-2490`), déclenchée uniquement par le bouton
« 📥 Récupérer statuts serveur » (`APP:1903-1919`), qui ramène les statuts. Deux boutons,
deux gestes, aucun automatisme : c'est la cause racine de l'ignorance décrite au §1.3.

### 3.2 Authentification — nature, jamais valeur

| Élément | Emplacement | Nature |
|---|---|---|
| Jeton d'API, valeur par défaut **en clair dans le code** | `ENGINE:1986` (`API_TOKEN_SYNC`), `APP:249, 771, 800, 830, 862, 1871, 1914, 1998` | jeton partagé statique, identique en local et en production |
| Même jeton, valeur par défaut | `TOOLKIT/prospect_scraper.py:37`, `TOOLKIT/build_dashboard.py:22` | idem |
| Même jeton, inséré **dans un commentaire en clair** | `SERVER/cron_publications.php:4` et `:27`, `TOOLKIT/api/cron_sequences.php:4` et `:29` | idem |
| Même jeton | `TOOLKIT/webhook_reponse.php:19,23`, `TOOLKIT/webhook_wa.php:21`, `TOOLKIT/api/webhook_reponse.php:19,23` | idem |
| Constante serveur | `SERVER/secrets.php` (existe, 4 251 octets) — exposée en `API_BEARER_TOKEN`, `TG_TOKEN` | source unique côté serveur |
| Clé LLM | `TOOLKIT/config_ia.json`, clé `api_keys.deepseek` (35 caractères, non vide) | clé fournisseur |
| Clés de réseaux sociaux | `SERVER/data/config_reseaux.json` — `page_access_token` (208 car.), `access_token` Instagram (208), WhatsApp (204), LinkedIn (350) | jetons OAuth longue durée |

**Deux mécanismes d'authentification coexistent**, et c'est un défaut en soi :

- les **téléversements** (`upload_publications.php`, `upload_asset.php`) utilisent l'en-tête
  `Authorization: Bearer <jeton>` (`ENGINE:2113`) ;
- le **cron** accepte le jeton **en paramètre d'URL** :
  `{api_base}/cron_publications.php?key=<jeton>&force_id=<id>` (`APP:867`), vérifié en
  `SERVER/cron_publications.php:79-84` (`$_GET['key']` **ou** `Authorization: Bearer`) ;
  `lire_publications.php` fait de même (`SERVER/lire_publications.php:29-31`).

Un jeton dans une chaîne de requête se retrouve dans les journaux d'accès du serveur, dans
l'historique du navigateur et dans tout intermédiaire. À cela s'ajoute
`ENGINE:2102-2104` : le contexte TLS des téléversements désactive la vérification du
certificat (`check_hostname = False`, `verify_mode = ssl.CERT_NONE`), et
`ENGINE:1477-1490` prévoit le même repli permissif pour les appels LLM. Ces deux points
exposent les jetons à une interception par un intermédiaire.

### 3.3 Ce qu'il advient si elle échoue

Le comportement est **inégal**, et c'est le défaut central de cette section.

| Chemin | Si le serveur ne répond pas | Preuve |
|---|---|---|
| `/schedule` (unitaire) | Programmation locale conservée ; `synced: false` + `sync_warning` renvoyés ; l'interface l'affiche | `APP:765-779` |
| `/delete` | Idem | `APP:795-808` |
| `/edit` | Idem | `APP:825-839` |
| `/publier-maintenant` | Échec **bloquant** : 500 et rien n'est publié | `APP:865-866` |
| `/sync-pubs` | Réponse structurée garantie, y compris sur exception, avec `csv_uploaded`, `errors`, `error` | `APP:1885-1901` |
| `/pubs-pull` | Idem | `APP:1917-1919` |
| **`/schedule-all`** | **Aucun message, aucune tentative** — la route ne synchronise pas | `APP:2150-2223` |
| **`/reprogrammer-echecs`** | **Aucun message, aucune tentative** | `APP:913-942` |
| **`/delete-all`** | **Aucun message, aucune tentative** — et le pull suivant réimporte | `APP:2225-2273`, `ENGINE:2468-2469` |
| `/weekly-calendar` | **Aucun message, aucune tentative** | `APP:616-636` |

Autrement dit : la promesse de l'interface (« ✅ 49 publication(s) programmée(s) »,
`COCKPIT:1436`) est locale. Le serveur n'en sait rien. Et l'interface ne le dit pas, parce
que la réponse de `schedule-all` ne contient aucun champ de synchronisation à afficher.

---

## 4. L'archive et la garde anti-double-publication

### 4.1 Le mécanisme, tel qu'il est codé

`TOOLKIT/publications_archive.csv` — en-tête
`Hash,Date_Creation,Pilier,Plateforme,Texte_Extrait,Genere_Par`
(`ENGINE:1912`). Le hash est calculé ainsi (`ENGINE:1914-1919`) :

```python
normalized = " ".join(text.lower().split())[:200]  # 200 PREMIERS caractères
key = f"{pilier}|{plateforme}|{normalized}"
return hashlib.md5(key.encode("utf-8")).hexdigest()
```

L'archive complète ne conserve qu'un extrait de **100 caractères** (`ENGINE:1955`,
`"Texte_Extrait": text[:100]`). Le hash, lui, porte sur **200** caractères : la clé de
détection n'est donc **pas recalculable** à partir du fichier archivé.

La garde est appliquée en un seul endroit : la boucle de génération
(`ENGINE:1301-1351`). Si le hash est déjà présent, elle retire un autre tirage, jusqu'à
`max_attempts = 5` ; au-delà, elle retourne le doublon en le marquant
`metadata["duplicate"] = True` (`ENGINE:1343-1349`) — information qui **n'est écrite nulle
part** dans le CSV des publications : les colonnes sont figées (`ENGINE:1879-1884`) et
`metadata` n'y figure pas.

### 4.2 La garde fonctionne-t-elle, par le code ?

**Elle fonctionne pour ce qu'elle fait, et ce qu'elle fait ne protège pas de ce qui compte.**

- Elle empêche la **répétition stricte** d'un texte dont les 200 premiers caractères,
  normalisés en minuscules et espaces, sont identiques, **pour le même couple
  (pilier, plateforme)**.
- Elle ne voit pas une variation : deux textes qui ne diffèrent qu'à partir du 201ᵉ
  caractère sont considérés comme neufs.
- Elle ne voit pas la recopie entre piliers ou entre plateformes : le couple fait partie de
  la clé, donc le **même texte** publié sur `instagram/cas-client` puis sur
  `facebook/cas-client` est « neuf » deux fois.
- Elle ne protège **pas** de la double publication : elle garde la génération, pas l'envoi.
  Rien dans l'archive n'est consulté au moment de publier (le cron ne lit que
  `SERVER/data/publications.csv`, `cron:395`).

### 4.3 La garde fonctionne-t-elle, par les données ?

Mesures faites sur `TOOLKIT/publications_archive.csv` (lecture `csv.DictReader`) :

| Mesure | Valeur |
|---|---|
| Enregistrements | **234** (et non 227 ; le fichier fait 623 lignes physiques à cause des retours à la ligne dans les extraits) |
| Hashes distincts | 234 — **0 collision** |
| Extraits tous de longueur 100 | oui (min = max = 100) |
| Période couverte | 2026-09-10 03:58 → 2026-09-19 00:33 |
| Piliers | 15 valeurs ; `cas-client` 55, `educatif` 42, `conseils-mlm` 38 |
| Plateformes | instagram 79, facebook 57, linkedin 52, whatsapp 46 |
| Producteurs | `anthropic · …`, `deepseek · …` |

Le test décisif — la **quasi-répétition** : en comparant les 234 extraits deux à deux
(`difflib`), on trouve **84 paires dont les attaques sont identiques sur ≥ 30 caractères**,
et la paire la plus proche partage **81 caractères d'ouverture** pour le même couple
(pilier `lecons-echecs`, plateforme `facebook`) :

```
A (2026-09-11 14:36:08) : "J'ai failli tout arrêter. 😔\n\n…"
B (2026-09-11 14:40:31) : "J'ai failli tout arrêter. 😔\n\n…"   ← 81 premiers caractères identiques
```

Quatre minutes d'écart entre les deux. Elles diffèrent plus loin, donc le hash diffère, donc
la garde les déclare neuves. En revanche, **aucune paire n'atteint 90 % de similarité** sur
l'extrait de 100 caractères : la garde n'a donc jamais eu à s'exercer sur ces cas.

**Conclusion de §4.3** : la garde anti-répétition est un **détecteur de copie exacte**, pas un
détecteur de répétition. Elle est conçue pour des gabarits déterministes (mode `templates`,
qui tire au sort dans une liste fixe, `ENGINE:1323` et le commentaire `ENGINE:1334-1335`) et
elle perd son sens avec un LLM, qui ne produit jamais deux fois la même chaîne. Mesure
directe : depuis que le fournisseur est `deepseek` (`TOOLKIT/config_ia.json` → `"provider":
"deepseek"`), 234 contenus sont entrés dans l'archive et **0** y a été refusé.

### 4.4 La vraie garde anti-double-publication

Elle existe, mais ailleurs, et elle est double :

1. **Côté serveur, à la montée** : `SERVER/upload_publications.php:233-245` — si le statut
   serveur d'un ID est `publie`, `echec` ou `erreur`, les huit champs serveur sont restaurés
   et le local ne peut pas écraser.
2. **Côté serveur, à l'exécution** : le cron ne prend qu'un `Statut === 'programmee'`
   (`cron:425`) et un seul envoi par exécution, sous verrou (`cron:79-95`).

Ces deux mécanismes protègent bien contre la **republication d'un même identifiant**.
Mais ils sont bâtis sur l'**identifiant**, et l'identifiant est réattribué à du contenu neuf
(§1.4). La garde protège donc le mauvais objet : elle empêche la republication d'un *ID* en
sacrifiant la publication d'un *texte*. C'est exactement l'inverse du besoin.

Et le pull réimporte ce qui a été supprimé : `gone = [pid for pid in local_by_id if pid not
in server_ids]` (`ENGINE:2468`) est **signalé** (`result["removed_server_side"]`) mais le
local est intégralement réécrit à partir de la fusion (`ENGINE:2484-2486`), et l'interface
affiche « ℹ️ N pub(s) locale(s) absentes du serveur » (`COCKPIT:1289-1290`) — sans proposer
de les supprimer.

---

## 5. La veille concurrentielle

### 5.1 Ce que `veille_engine.py` fait vraiment

`TOOLKIT/veille_engine.py` (v2.0, 21 705 octets, dernière modification 7 septembre 2026).
Il interroge **quatre sources publiques, sans aucune clé d'API** :

| Source | Endpoint | Nombre d'appels | Preuve |
|---|---|---|---|
| Google News RSS | `news.google.com/rss/search` | **20 requêtes** (`NEWS_QUERIES`) × le pays demandé | `veille_engine.py:90-115`, `:161-197` |
| Reddit | `reddit.com/search.json` | **8 requêtes** (`REDDIT_QUERIES`) | `:125-134`, `:212-252` |
| Medium RSS | flux par tag | **6 tags** (`MEDIUM_TAGS`) | `:137-140`, `:255-296` |
| Hacker News | `hacker-news.firebaseio.com/v0` | 20 histoires + 1 appel par item, **filtré** sur les mots-clés de la niche | `:298-335` |

Chaque élément reçoit un **score de niche** : 10 points par mot-clé reconnu parmi les ~90 de
`NICHE_KEYWORDS`, plafonné à 100 (`:146-157`). Les résultats sont dédoublonnés par titre,
triés par score, et les **20 premiers** forment `top_topics` (`:372-386`).

**Deux restrictions non documentées dans l'interface :**
- `fetch_full_veille()` accepte `countries`, et l'interface **force `["BF"]`** :
  `APP:992` `ve.fetch_full_veille(countries=["BF"])`. Le Burkina Faso seulement, alors que la
  fonction accepte `["BF","CI","SN","ML"]` par défaut (`:344`) — et qu'Abidjan est le marché
  de l'agence. Les requêtes Google News sont interrogées sur `gl=BF`.
- Les requêtes Reddit sont **globales** (recherche sur tout Reddit, `:212-215`) ; les 9
  subreddits listés en `:118-122` (`REDDIT_SUBREDDITS`) ne sont **jamais utilisés** — vérifié :
  la constante n'apparaît qu'à sa définition.

### 5.2 Ce que l'utilisateur en reçoit

Le parcours est un clic (`COCKPIT:764` « 🔎 Veille » → `runVeille()`, `COCKPIT:1224-1239`).
L'écran affiche **7 suggestions** — titre, pilier deviné par mots-clés, source, et une ligne
« Score niche: NN/100 · Mots-clés: … ». Rien de plus : pas de résumé, pas d'angle, pas
d'action. Les champs `analyse` et `url` existent dans la réponse
(`veille_engine.py:417-425`) et **ne sont pas affichés** ; le lien `url` n'est même pas un
lien cliquable.

Mesuré en direct (`curl -s http://127.0.0.1:8788/api/veille`, lecture seule) :

```
http=200  size=11 268 octets  temps=48,7 s   ok: true   7 suggestions   5 top_topics
1. [actualite] VivaTech 2026 : Startups ivoiriennes à Paris, postulez — Digital Business Africa
   Source: Google News BF — Digital Business Africa · Score niche: 90/100
2. [educatif]  E-commerce : L'IFC investit 25 M$ dans Jumia … · Score niche: 80/100
3. [actualite] Femmes et digital à Cotonou : African Woman 2.0 … · Score niche: 70/100
4. [educatif]  365 Digital nommé représentant commercial agréé de Google Ads … · Score niche: 60/100
```

**Fréquence : aucune.** La veille est **strictement à la demande**. Vérifié :
`crontab -l` ne contient aucune entrée de veille (sept tâches de sauvegarde et de supervision
uniquement) ; aucun fichier du toolkit n'importe `veille_engine` en dehors de
`prospect_app.py:33` et de son propre CLI ; aucun cron PHP ne l'appelle.
L'audit antérieur classait la veille en cadence « 1×/semaine »
(`CONCEPTION.md:65`) : c'est un **souhait de conception**, pas un état du code — rien ne
rappelle à l'utilisateur de la lancer, rien ne conserve le résultat d'une veille à l'autre.
Chaque clic repart de zéro et **coûte 49 secondes d'attente bloquante**, sans barre de
progression : le seul retour est le texte « ⏳ Veille en cours... » (`COCKPIT:1225`).

### 5.3 Ce que la veille n'est pas

Malgré son nom et malgré la route `/api/analyze-competitor` listée dans le périmètre, il
n'y a **pas d'analyse concurrentielle**. `/api/analyze-competitor` (`APP:423-432`) appelle
`se.analyze_competitor(name, url, niche)` (`TOOLKIT/skills_engine.py`) : c'est un
**générateur de grille d'analyse à partir d'un nom saisi** — de la mise en forme
méthodologique, pas de l'observation. Aucun concurrent n'est surveillé en continu, aucun
site n'est comparé, aucune donnée n'est collectée sur un tiers.

---

## 6. La mesure

### 6.1 `metrics/` — un compteur débranché

Contenu du répertoire : **un seul fichier**, `TOOLKIT/metrics/generation_metrics.json`
(396 octets, dernière modification 9 septembre 2026). Mesuré :

```json
{"generations": [],
 "summary": {"total_generations": 0, "total_cost_usd": 0.0, "avg_duration_seconds": 0.0,
   "by_provider": {"deepseek":{"count":0,…},"claude":{"count":0,…},"templates":{"count":0,…}},
   "by_agent": {}, "by_pillar": {}}}
```

**Le constat de l'audit antérieur est exact : `total_generations: 0`.** Mais la cause n'est
pas l'absence d'activité — c'est un **débranchement**. Le module `metrics_tracker.py` expose
`track_generation()` (`metrics_tracker.py:110-169`), et cette fonction n'est appelée que
depuis **deux routes qui ne font pas partie de ce module** :

| Appelant | Ce qu'il mesure | Ligne |
|---|---|---|
| `/api/design/quick-gen` | génération d'**image** | `APP:1152` |
| `/api/design/generate-variants` | variantes A/B d'**image** | `APP:1207` |

Aucune route de génération de **publications** n'appelle `track_generation` :
`/api/publications/generate` (`APP:499-548`), `/generate-batch` (`APP:550-614`) et
`weekly-calendar` (`APP:616-636`) n'importent même pas `metrics_tracker`. **234 publications
ont été générées et archivées depuis le 10 septembre ; zéro ligne de métrique.** Le coût réel
en appels LLM du module est donc inconnu.

Détail supplémentaire : `METRICS_FILE = Path("metrics/generation_metrics.json")`
(`metrics_tracker.py:15`) est un **chemin relatif** au répertoire courant du processus. Lancé
depuis un autre répertoire, le compteur écrirait ailleurs — silencieusement.

### 6.2 `/api/analytics/summary` — un écran qui compile deux sources dont une vide

Route : `APP:1271-1336`. Elle agrège trois choses :

1. `metrics_tracker.get_summary()` et `get_history(limit=200)` → **vides** (§6.1) ;
2. `publications.csv` → `by_pillar` (comptage réel, 7 publications) ;
3. `Genere_Par` → `by_agent`, en cherchant la sous-chaîne **`"Agent:"`**
   (`APP:1296-1298`).

Ce troisième point est **mort par construction**. Le format canonique actuel de `Genere_Par`
est « `deepseek · 📸 Instagram Curator · FAB` » (`ENGINE:657-675`, et l'en-tête
`APP:466-475`). La chaîne `"Agent:"` n'y figure jamais. Le partage de code a été remplacé
sans mettre à jour son lecteur : `by_agent` restera `{}` pour toujours.

Mesuré en direct (`curl -s http://127.0.0.1:8788/api/analytics/summary`) :

```json
{"ok":true,
 "summary":{"total_generations":0,"total_cost_usd":0.0,"avg_duration_seconds":0.0},
 "by_pillar":{"actualite":1,"cas-client":1,"educatif":3,"ia-pratique":2},
 "by_agent":{},
 "timeline":{"2026-09-13":0,"2026-09-14":0,"2026-09-15":0,"2026-09-16":0,
             "2026-09-17":0,"2026-09-18":0,"2026-09-19":0},
 "top_agents":{},
 "provider_stats":{"deepseek":{"count":0,…},"claude":{"count":0,…},"templates":{"count":0,…}}}
```

**Trois des quatre blocs de l'écran Analytics sont donc structurellement à zéro** : le coût,
la chronologie et les agents. Seul `by_pillar` porte une donnée — celle du CSV des
publications, pas celle de la mesure. Or **aucun des deux chiffres les plus utiles n'existe
dans ce module** : ni les vues, likes, commentaires et partages — présents dans le CSV
(`Vues`, `Likes`, `Commentaires`, `Partages`, `ENGINE:1882`) et alimentés par le cron, mais
**affichés nulle part** (`COCKPIT:1082-1103` ne les lit pas) — ni le nombre de publications
réellement sorties. L'écran « 📊 Analytics » d'un outil de publication sociale ne montre
aucune performance sociale.

---

## 7. Les écrans et les parcours

### 7.1 L'écran unique

Tout le module tient dans **un seul panneau modal** (`COCKPIT:757-800`), ouvert par un bouton
de la barre d'outils (`COCKPIT:289`). Il contient :

| Zone | Contenu | Référence |
|---|---|---|
| Barre d'actions | **7 boutons** : Générer 7 pubs · Calendrier 7j (49) · Veille · Sync serveur · Récupérer statuts serveur · Doctor · Fermer | `COCKPIT:762-775` |
| Sélecteur de fournisseur | 5 options (`templates`, `openai`, `anthropic`, `deepseek`, `zai_sdk`) | `COCKPIT:768-774` |
| Actions de lot | **6 boutons** : Toutes les images · Recréer images · Programmer tout · Reprogrammer échecs · Archive · Tout supprimer | `COCKPIT:779-784` |
| Compteur | « 📊 7 publications · 0 publiées · 0 programmées · 7 brouillons » | `COCKPIT:1077` |
| Analytics | **1 bouton** « Actualiser » ; état initial « Cliquez sur "Actualiser" pour charger les analytics » | `COCKPIT:791-795` |
| Liste | **30 publications au maximum** (`slice().reverse().slice(0,30)`) | `COCKPIT:1079` |
| Zone de résultats | `#veilleResult` — **partagée** entre la veille et l'archive | `COCKPIT:799`, `1225`, `1399` |

**14 boutons de commande** dans le panneau (hors les 5 options du sélecteur de fournisseur) et
**6 boutons par publication** (Image · Modifier · Programmer · Maintenant · Copier texte ·
Supprimer, `COCKPIT:1093-1099`), soit jusqu'à **180 boutons** affichables simultanément, tous
en attributs `onclick` inline (`COCKPIT` en compte 98 au total).

**Trois défauts d'écran constatés par lecture :**
1. **Le fournisseur affiché n'est pas celui qui est utilisé.** `loadIAConfig()` (`COCKPIT:1240`)
   remplit le sélecteur depuis `/api/ia-config` (`APP:998-1007`) ; le `<select>` propose
   **5 valeurs** (`COCKPIT:769-773`) alors que la route d'écriture n'en accepte que **2** —
   `deepseek` et `templates` (`APP:1014-1015`). Choisir « OpenAI GPT-4o mini » ou
   « Anthropic Claude » renvoie une erreur 400. L'interface propose ce que le serveur refuse.
2. **La veille et l'archive se partagent le même conteneur** (`#veilleResult`) : demander
   l'archive après une veille **efface** l'affichage de la veille, et réciproquement
   (`COCKPIT:1225` vs `COCKPIT:1399`).
3. **L'archive s'annonce complète mais est tronquée.** La route retourne `archive[-50:]`
   (`APP:897`) et l'écran affiche « 📚 Archive anti-répétition — **234** publication(s) »
   (`COCKPIT:1382`) tout en ne listant que 50 entrées : l'en-tête compte, la liste ne montre
   pas — sans le dire.

### 7.2 Comptage des parcours

| Parcours | Clics | Saisies | Attente | Retour à l'écran |
|---|---|---|---|---|
| Voir la file de publications | 2 (bouton + panneau) | 0 | — | compteur local, **jamais** l'état serveur |
| Générer 7 publications | 2 | 0 | 1–3 min (LLM) | toast détruit après 4,2 s (`COCKPIT:1478`) |
| Générer 49 publications | 3 (dont `confirm`) | 0 | plusieurs minutes | idem, **et écrase le CSV** |
| Programmer **une** publication | 2 (bouton + `prompt` accepté) | 0 ou 1 | sync bloquante | toast + sync serveur automatique |
| Programmer **un lot** | **7** (dont 3 `prompt` + 1 `confirm`) | **1 à 3** | sync **absente** | toast « ✅ N programmée(s) » — **mensonger pour le serveur** |
| Récupérer les statuts serveur | 3 (bouton + `confirm` + rechargement) | 0 | requête réseau | seul moyen de connaître l'état réel |
| Publier maintenant | 3 (bouton + `confirm` + `loadPubs`) | 0 | sync + cron jusqu'à 60 s × 3 essais | réponse détaillée (`publie`/`echec`) — **le meilleur retour du module** |
| Voir l'archive | 1 | 0 | — | 50 lignes sur 234, dans le conteneur de la veille |
| Lancer la veille | 1 | 0 | **49 s** sans progression | 7 titres, sans lien ni analyse |
| Vider l'archive | 4 (bouton + 2 `confirm` + rechargement) | 0 | — | irréversible : 234 hashes perdus |
| Tout supprimer | 4 (bouton + 3 `confirm`) | 0 | — | **le serveur garde tout** ; le pull suivant réimporte |

**Le contraste le plus parlant** : « ⚡ Publier maintenant » — l'action la plus dangereuse —
est le parcours le mieux informé (confirmation explicite listant les deux effets,
`COCKPIT:1205`, puis réponse distinguant succès, échec et cas inattendu,
`COCKPIT:1211-1217`). Les actions de lot — les plus lourdes — sont les plus muettes.

---

## 8. Défauts classés par gravité

### Critiques (production cassée ou perte de données)

**D1 — Collision d'identifiants : du contenu neuf hérite du statut `publie` d'un ancien.**
Cause : `generate_weekly_calendar()` renumérote à partir de `PUB-0001`
(`ENGINE:1810, 1849`) ; le mode `append` recalcule `f"PUB-{i:04d}"` (`APP:629-630`) ; la
garde serveur est indexée sur l'ID (`SERVER/upload_publications.php:237`).
Preuve : sept identifiants communs entre `TOOLKIT/publications.csv` et
`SERVER/data/publications.csv` portent sept textes différents, dont deux déjà `publie`.
Conséquence : contenu jamais publié, marqué publié, et remonté comme tel.
**C'est le défaut le plus grave : il simule un succès.**

**D2 — Instagram échoue de façon reproductible et silencieuse.**
Preuve : `SERVER/data/publications.log`, `2026-09-07 15:31:42` (PUB-0005) et
`2026-09-08 01:18:32` (PUB-0020), erreur Meta 9004/2207052 « Only photo or video can be
accepted as media type », URL `https://api.eperformance.pro/assets_pubs/PUB-00xx.png`.
Également `2026-09-06 16:00:23` : « image non accessible publiquement (HTTP 500) ».
Conséquence : la plateforme est dans le calendrier 7 créneaux sur 7 (`ENGINE:1791,1794,1796`),
soit **3 des 7 publications quotidiennes** ne peuvent pas sortir ; deux sont parquées en
`erreur` (`SERVER/data/publications_state.json`), et rien ne le montre à l'écran.

**D3 — Programmation de lot non synchronisée, annoncée comme réussie.**
Preuve : `schedule-all` (`APP:2150-2223`) et `reprogrammer-echecs` (`APP:913-942`) n'appellent
jamais `sync_publications_server` ; l'interface affiche `✅ N publication(s) programmée(s)`
(`COCKPIT:1436`).
Conséquence : l'utilisateur croit avoir programmé un lot ; le cron n'a rien reçu.

**D4 — `delete-all` ne supprime que le local, et le pull réimporte.**
Preuve : `APP:2225-2273` (aucun appel réseau) ; `ENGINE:2468-2469` réimporte les publications
absentes du serveur ; l'interface n'affiche qu'un compteur (`COCKPIT:1451`).
Conséquence : la suppression est un aller-retour. Le nettoyage des images est en outre
**inopérant** : le code cherche `assets_pubs/<ID>.png` (`APP:2255`) alors que les fichiers
réels sont nommés `PUB-0001-G3-facebook.png`, `PUB-0007-G4-facebook-1.png`
(`ls TOOLKIT/assets_pubs/` : 9 fichiers, aucun `<ID>.png` sauf `PUB-0007.png`).

### Graves (fonction perdue ou décision faussée)

**D5 — La mesure ne mesure rien.** `track_generation` n'est appelé que par deux routes
d'image (`APP:1152, 1207`) ; `total_generations: 0` alors que 234 publications ont été
générées. `by_agent` cherche `"Agent:"`, format disparu (`APP:1296`). Trois blocs de
l'écran Analytics sont structurellement à zéro. Preuve : §6, mesure en direct.

**D6 — Les métriques sociales existent et ne sont pas affichées.** Les colonnes `Vues`,
`Likes`, `Commentaires`, `Partages` sont écrites par le cron et présentes dans le CSV
(`ENGINE:1882`), et l'affichage des cartes ne les lit pas (`COCKPIT:1082-1103`).

**D7 — Deux sources de vérité pour le fournisseur IA.** Le `<select>` propose 5 options
(`COCKPIT:769-773`), l'API n'en accepte que 2 (`APP:1014`). Deux options sur cinq échouent
en 400.

**D8 — L'archive ne protège pas de la répétition.** Détecteur de copie exacte sur 200
caractères (`ENGINE:1917`), quand 84 paires d'entrées partagent ≥ 30 caractères d'attaque et
la pire 81 (§4.3). Le signal `metadata["duplicate"]` n'est jamais persisté ni affiché.

**D9 — Le blog n'est branché que par un fichier d'index figé.** La chaîne sociale
`social_templates/remplisseur.py:47` lit `BLOG/chatbot-index.json`, qui est **généré le
18/09 à 10h40** et ne contient que **8 articles**, alors que `BLOG/_schedule.json` planifie
**81 articles** et que **81 dossiers d'articles existent sur le disque**
(`ls BLOG/articles/ | wc -l` → 81). Le drapeau `published` de `_schedule.json` n'est vrai que
pour 8 entrées, alors que le rythme annoncé est de 5 par jour depuis le 18/09. Conséquence :
**la production sociale est plafonnée à 8 sujets** alors que 81 existent, et la source de
vérité du blog est un fichier d'index rafraîchi à la main.

### Notables (fiabilité, sécurité, coût d'usage)

**D10 — Jeton d'API en clair dans le code, à onze endroits.** `ENGINE:1986` ;
`APP:249, 771, 800, 830, 862, 1871, 1914, 1998` ; `prospect_scraper.py:37` ;
`build_dashboard.py:22` ; et **en commentaire** `SERVER/cron_publications.php:4, 27`,
`api/cron_sequences.php:4, 29`, `webhook_reponse.php:19, 23`, `webhook_wa.php:21`.
Le même secret sert d'authentification pour la lecture, l'écriture, le déclenchement du cron
et les webhooks. Aucune rotation possible sans toucher onze fichiers.

**D11 — Jeton en paramètre d'URL.** `APP:867` (`?key=…&force_id=…`), `APP:2002`,
`SERVER/cron_publications.php:79-84`, `SERVER/lire_publications.php:29-31`. Un secret dans
une chaîne de requête finit dans les journaux d'accès.

**D12 — Vérification TLS désactivée sur les téléversements.**
`ENGINE:2102-2104` (`check_hostname = False`, `verify_mode = ssl.CERT_NONE`), et repli
permissif en `ENGINE:1483-1488` pour les appels LLM. Les jetons et le contenu transitent par
un canal non vérifié.

**D13 — Aucune confirmation de publication persistante.** Le seul retour est un toast détruit
après 4,2 s (`COCKPIT:1478`), y compris pour une publication réelle sur un réseau social.
L'audit antérieur le relevait déjà (`CONCEPTION.md:25`) ; c'est confirmé, et c'est aggravé par
le fait que le journal serveur (`SERVER/data/publications.log`, 13 lignes `PUBLIÉ`) n'est
affiché nulle part.

**D14 — Mode `custom` identique à `single`.** `APP:2197` traite les deux dans la même branche,
alors que le `prompt` les présente comme distincts (`COCKPIT:1421`).

**D15 — Veille mono-pays et sans mémoire.** `countries=["BF"]` en dur (`APP:992`) pour une
agence ivoirienne ; `REDDIT_SUBREDDITS` (`veille_engine.py:118-122`) jamais utilisé ;
`url` et `analyse` calculés (`:417-425`) mais non affichés (`COCKPIT:1230-1234`) ; aucun
résultat conservé entre deux veilles ; 49 s d'attente sans progression.

**D16 — Trois échecs par publication, puis abandon définitif.** Le parking en `erreur`
(`cron:444-453`) n'est annoncé que par Telegram (dont le jeton est vide :
`SERVER/data/config_reseaux.json`, `telegram.bot_token` et `chat_id` vides). Autrement dit :
**l'alerte n'arrive nulle part.** L'utilisateur ne sait jamais qu'une publication a été
abandonnée.

### Mineurs (cohérence, ergonomie)

- **D17** : `#veilleResult` partagé entre veille et archive (`COCKPIT:799, 1225, 1399`).
- **D18** : liste tronquée à 30 publications (`COCKPIT:1079`) et archive à 50
  (`APP:897`) sans pagination ni mention « 30 sur 234 ».
- **D19** : `weekly-calendar` remplace le CSV sans sauvegarde (`APP:625,632`), alors que le
  pull en écrit un (`ENGINE:2478`).
- **D20** : le champ `Erreur` n'est pas vidé par `schedule-all` (`APP:2205-2207`), contrairement
  aux autres chemins de programmation (`APP:756`, `APP:936`).
- **D21** : `/api/publications/archive/clear` (`APP:901-911`) ne protège que par un booléen
  dans le corps de la requête ; le double `confirm` est purement côté client
  (`COCKPIT:1406-1407`).

---

## 9. Ce qui doit survivre, fusionner, mourir

### Doit survivre — la valeur réelle du module

| Élément | Pourquoi | Preuve de la valeur |
|---|---|---|
| **Le cron serveur comme unique exécutant** | il est le seul composant qui connaît l'état réel : verrou, plafonds, 1 envoi par passe, journal | `SERVER/cron_publications.php:79-95, 379-463` |
| **La fusion serveur à la montée** | c'est la seule garde anti-republication qui fonctionne — à condition de la réindexer (voir fusion) | `SERVER/upload_publications.php:233-245` |
| **Le pull des statuts** | seule source de vérité sur ce qui est sorti, avec `Post_ID` et métriques | `ENGINE:2397-2490` |
| **« Publier maintenant », tel quel** | le seul parcours du module qui dit la vérité sur son effet, y compris en échec | `APP:844-889`, `COCKPIT:1204-1223` |
| **Le test de vie avant sync** | évite des minutes de blocage avant un échec inexploitable | `ENGINE:1988-2017` |
| **Le contrôle d'existence distante avant upload** | fait passer la sync de ~29 Mo à quelques fichiers | `ENGINE:2018-2045` |
| **L'archive comme journal de production** | 234 lignes datées, avec pilier, plateforme, producteur : c'est déjà un historique éditorial | `TOOLKIT/publications_archive.csv` |
| **Le score de niche de la veille** | 90/80/70/60 sur des titres réels : le filtrage fonctionne | `veille_engine.py:146-157`, mesure §5.2 |
| **Le garde-fou « zéro repli silencieux »** | un échec LLM remonte au lieu de produire un gabarit dégradé | `ENGINE:1304-1322`, `APP:580-588` |

### Doit fusionner

| Élément | Fusionne avec | Ce qui change |
|---|---|---|
| **Registre 1 et registre 2** | **un seul état de publication, côté serveur** | le CSV local devient un cache ; l'écran lit l'API, jamais un fichier local |
| **Registre 3** | **le même objet** | `failures`/`last_send` deviennent des champs de la publication rendus visibles (« 2 échecs sur 3 ») |
| **`schedule-all` + `reprogrammer-echecs` + `weekly-calendar`** | **un seul « planifier »** | une action, un calendrier lisible, un incrément explicite, une synchronisation incluse |
| **`sync-pubs` + `pubs-pull`** | **une synchronisation bidirectionnelle** | un bouton, deux sens, exécuté automatiquement après toute écriture |
| **`/api/analytics/summary` + métriques de publication** | **un seul tableau de mesure** | `track_generation` appelé par la génération de publications ; `Vues`/`Likes`/`Commentaires`/`Partages` affichés |
| **`_schedule.json` du blog** | **la source du module** | lire le blog **par son index généré automatiquement**, pas par un drapeau saisi |
| **Les 5 options du sélecteur IA** | **les 2 fournisseurs réels** | ou bien implémenter les 3 autres — mais pas proposer ce que l'API refuse |

### Doit mourir

| Élément | Raison |
|---|---|
| **`prompt()` / `confirm()` natifs** (le module en compte **17** : 4 `prompt()` et 13 `confirm()`, relevés en `COCKPIT:1136, 1419, 1421, 1426` et `1119, 1145, 1205, 1258, 1283, 1331, 1349, 1366, 1406, 1407, 1444, 1445, 1446` ; 22 au total dans le fichier) | non stylables, non annulables, non historisés, non testables |
| **La numérotation `PUB-%04d` par compteur local** | cause directe de D1. Un identifiant doit être unique à vie, jamais réattribué |
| **Le hash d'archive sur 200 caractères** | inopérant avec un LLM (§4.3). À remplacer par une empreinte sémantique, ou à supprimer en assumant que la répétition se juge à la lecture |
| **La renumérotation dans le mode `append`** (`APP:629-630`) | réintroduit le bug corrigé ailleurs |
| **Le mode `custom`** | doublon strict de `single` (`APP:2197`) |
| **Le jeton d'API statique partagé** | un secret par usage, révocable, hors du code |
| **`ssl.CERT_NONE`** (`ENGINE:2102-2104`) | le contournement d'un certificat LWS incomplet ne justifie pas de désactiver la vérification pour des jetons OAuth |
| **`delete-all` tel quel** | dangereux et inefficace. À remplacer par une suppression unitaire ou par un archivage côté serveur |
| **Le mode « remplacer le CSV » du calendrier hebdo** | perte de données sans sauvegarde |
| **`by_agent` indexé sur `"Agent:"`** (`APP:1296`) | code mort |

---

## 10. Ce que le module doit devenir dans un dashboard SaaS unifié

### 10.1 Le principe : un état, une vérité, un journal

Le module souffre d'un mal unique dont tous les défauts découlent : **il y a trois endroits
où l'on peut savoir si une publication est sortie, et l'écran consulte le mauvais.** Une
refonte SaaS doit poser une règle non négociable : **la publication est un objet serveur, et
son état est lu, jamais déduit.** Le CSV local devient un cache jetable ; l'écran lit l'état
réel.

Trois conséquences de conception :

1. **Un identifiant immuable.** `PUB-0004` désigne un texte pour toujours. Toute
   régénération crée un identifiant neuf. Le prix est faible (quelques octets) ; le coût de
   l'erreur actuelle est un faux succès.
2. **Aucune écriture sans synchronisation.** Toute mutation (programmer, modifier, supprimer)
   est une transaction : locale **et** serveur, ou rien. Le motif du `sync_warning`
   (`APP:778`) est bon : il faut le généraliser et le rendre bloquant pour les lots.
3. **Un journal, pas des toasts.** Chaque tentative — programmée, envoyée, échouée, parquée —
   est une ligne horodatée dans une liste que l'utilisateur peut relire. Le log serveur
   existe déjà (`SERVER/data/publications.log`) : il doit devenir un écran, pas un fichier.

### 10.2 Le modèle d'objet

Une publication, dans un dashboard SaaS, se décrit par cinq blocs et non vingt colonnes :

| Bloc | Contenu | Aujourd'hui |
|---|---|---|
| **Identité** | ID immuable, texte, hashtags, CTA, visuel, pilier, format | CSV, 20 colonnes à plat |
| **Cible** | plateforme, compte (« client »), heure prévue dans le fuseau du compte | plateforme seule, aucune colonne client |
| **État** | `brouillon → programmée → en cours → publiée / échouée / abandonnée`, avec **un seul** propriétaire : le serveur | trois registres (§1.3) |
| **Preuve** | `Post_ID`, URL du poste, horodatage réel, message d'erreur exact | présent dans le CSV, affiché nulle part |
| **Trace** | tentatives, échecs consécutifs, coût LLM, agent, référence d'archive | `failures` invisible, coût à zéro |

### 10.3 L'écran : quatre onglets qui remplacent quatorze boutons

La structure proposée par la conception d'ensemble — une famille « Produire », une
destination « Publications », des onglets à l'intérieur — donne exactement ce qu'il faut :

```
PUBLICATIONS
├── À valider      (brouillon)   → texte, visuel, pilier, agent · [Programmer] [Publier maintenant]
├── Programmées    (programmée)  → calendrier + file, avec « 42 en retard sur 49 » visible
├── Publiées       (publiée)     → Post_ID, lien, Vues/Likes/Commentaires/Partages, et l'écart prévu/réel
└── Échecs         (échec, erreur) → message exact, nb de tentatives, [Réessayer] [Abandonner]
```

Trois écrans transversaux, qui n'existent pas aujourd'hui :

- **Le calendrier** — une vue semaine, glisser-déposer, un créneau par publication, les
  plafonds du serveur affichés (7/jour, 2/plateforme, 30 min entre deux envois). Programmer
  un lot devient : sélectionner, choisir un rythme (« toutes les 30 min à partir de 8h00 »),
  valider. **Zéro `prompt`.**
- **Le journal** — la liste horodatée des tentatives, filtrable par plateforme et par statut,
  alimentée par le log serveur et par le pull.
- **La mesure** — remonter les quatre compteurs sociaux dans la carte de la publication
  publiée, et brancher `track_generation` sur la génération pour que le coût cesse d'être
  un zéro menteur.

### 10.4 Le blog : brancher, oui — mais pas par le drapeau `published`

`BLOG/_schedule.json` (81 articles, 5 par jour du 18/09 au 03/10) et
`BLOG/chatbot-index.json` (8 articles, généré le 18/09) **ne disent pas la même chose**, et
le module social dépend du second (`social_templates/remplisseur.py:47`). Le bon branchement
est celui que le code social a déjà choisi pour de bonnes raisons — ne produire du social que
sur des pages réellement en ligne (commentaire `social_templates/lot.py:12-17`) — mais il
faut que l'index **soit régénéré** au lieu d'être lu figé. L'action appartient au module
blog, pas à celui-ci ; le contrat à poser est :

- `_schedule.json` = **le plan** (heures, jours, slugs, drapeau `published`) ;
- l'index généré = **l'état de fait** (ce que le site sert) ;
- le module social lit **l'écart entre les deux** et signale les articles publiés sur le site
  mais absents de l'index — c'est précisément l'angle mort actuel.

Cela ne justifie pas de fusionner les deux modules : le blog planifie des articles, la
publication planifie des postes. Le point de jonction est **un seul contrat** —
`slug → {titre, url, publié_le, illustration}` — pas un fichier partagé.

### 10.5 Ce qu'il faut décider avant d'écrire une ligne

1. **Qui possède l'état de publication ?** Si la réponse est « le serveur », alors le CSV
   local doit perdre son autorité en écriture, et l'application doit lire l'état à
   l'ouverture. C'est la décision qui commande les dix autres.
2. **Les identifiants deviennent-ils immuables ?** Sans cela, D1 reviendra dès la première
   régénération de calendrier.
3. **Instagram est-il réparé ou retiré du calendrier ?** Aujourd'hui 3 créneaux sur 7 pointent
   vers une plateforme qui échoue de façon reproductible. Retirer Instagram du calendrier est
   un correctif d'une ligne (`ENGINE:1789-1798`) et supprime deux défauts sur trois de la
   prod.
4. **Que devient la veille ?** Trois options cohérentes : la programmer (une passe
   hebdomadaire, résultat conservé, notification), la fusionner dans un écran
   « Veiller » avec les concurrents et la performance, ou l'assumer comme un bouton manuel —
   mais alors corriger le pays (`BF` → `CI`) et afficher les liens.

### 10.6 Estimation

| Phase | Contenu | Volume |
|---|---|---|
| **1 — vérité d'état** | lecture de l'état serveur à l'ouverture ; suppression de la lecture locale en écriture ; identifiants immuables | 1 session |
| **2 — l'écran Publications** | quatre onglets, cartes, remplacement des 3 `prompt()` par un formulaire de planification | 1–2 sessions |
| **3 — le journal et les échecs** | log serveur exposé, échecs parqués visibles, « réessayer » unitaire | 1 session |
| **4 — la mesure** | `track_generation` branché sur la génération de publications ; métriques sociales affichées | 1 session |
| **5 — dette** | retrait d'Instagram du calendrier ou réparation ; suppression de `ssl.CERT_NONE` ; jeton hors du code | 1 session |

---

## 11. Non établi

Points qui n'ont pas pu être prouvés par lecture, par mesure ou par commande — et qui ne sont
donc pas affirmés :

- **La cadence réelle du cron LWS.** Le code annonce « toutes les 30 min »
  (`START-HERE.txt:11`, `SERVER/cron_publications.php:8-10`). La crontab locale
  (`crontab -l`) ne contient **aucune** entrée de publication : le déclencheur est côté
  hébergeur et n'est pas visible d'ici. Je n'ai pas appelé `cron_publications.php` (route
  modificatrice).
- **L'état de publication du blog lui-même.** 81 dossiers d'articles existent sur le disque et
  8 seulement sont marqués `published`. Je n'ai pas vérifié si les pages datées du futur sont
  réellement servies par le site — cela relève du module blog.
- **Le contenu du fichier `SERVER/secrets.php`.** Il existe (4 251 octets) et expose
  `API_BEARER_TOKEN` et `TG_TOKEN` ; sa valeur n'a pas été lue.
- **La ou les valeurs de `SERVER/data/config_reseaux.json`.** Seuls la structure et le fait que
  les jetons sont renseignés (sauf TikTok et Telegram) ont été relevés.
- **L'état réel des trois publications `publie`.** Les `Post_ID` sont présents dans le CSV
  serveur, mais je n'ai pas interrogé les API des réseaux pour confirmer que les postes sont
  toujours en ligne (cela aurait exigé d'utiliser les jetons).
- **La cause exacte de l'échec Instagram.** L'API Meta la nomme (9004/2207052, contenu non
  récupérable depuis `assets_pubs/PUB-00xx.png`), et un autre log évoque un HTTP 500 sur la
  même URL (`2026-09-06 16:00:23`). Un défaut de permissions sur `assets_pubs/` côté
  hébergeur est probable ; il n'a pas été testé (un `GET` sur cette URL serait une requête
  externe de lecture, mais son résultat dépend du cache LWS — non concluant sans le test
  d'upload correspondant).
- **La fréquence des appels LLM et leur coût.** Aucune de ces deux informations n'existe :
  `generation_metrics.json` est vide (§6.1) et aucun journal local ne les comptabilise.
- **Le nombre d'utilisateurs.** L'audit indique « un seul utilisateur : le propriétaire » ; le
  code ne comporte ni session, ni compte, ni trace d'accès. Cohérent, mais non vérifiable
  par le code.

---

## Annexe — commandes exécutées (lecture seule)

```
curl -s http://127.0.0.1:8788/api/publications/stats
curl -s http://127.0.0.1:8788/api/publications/archive
curl -s http://127.0.0.1:8788/api/analytics/summary
curl -s -m 180 http://127.0.0.1:8788/api/veille            # 200, 11 268 o, 48,7 s
ss -ltnp | grep 878                                          # 8787 et 8788 en écoute
ls -l /proc/1370122/cwd                                      # → TOOLKIT
crontab -l
python3 - <<'PY'  (csv.DictReader sur publications.csv et publications_archive.csv,
                   difflib.SequenceMatcher sur les 234 extraits)
PY
grep -rn "…" TOOLKIT/ SERVER/                                # statuts, sync, secrets, veille
```

Aucune route `POST` n'a été appelée. Aucun fichier du toolkit n'a été modifié.
