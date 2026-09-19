# REVISEUR ADVERSE — app Mia (14 écrans) + landing sectorielle

**Date** : 2026-09-19 · **Rôle** : réviseur adverse (trouver ce qui ne marchera pas AVANT la construction)
**Méthode** : lecture seule de quatre dépôts (`eperformance-widget`, `eperformance-mia`, `unified-ia-backend`, `agent-ia-web`), aucun build, aucune route appelée, aucun secret affiché. Chaque fait porte son `fichier:ligne`. Ce qui n'a pas pu être prouvé est écrit « non établi ».

---

## 1. L'état réel du dépôt d'accueil — mesuré

| Mesure | Constat | Source |
|---|---|---|
| Vite | `^8.3.0` | `package.json:28` |
| Vue | `^3.5.42`, Pinia `^4.0.3`, vue-router `^4.6.4` | `package.json:15-19` |
| TypeScript | `~6.0.2`, vitest `^5.0.0` | `package.json:28-30` |
| Entrées Vite | **4** (`main`, `admin`, `application`, `applicationMia`) + build SDK IIFE séparé | `vite.config.ts:28-34`, `vite.sdk.config.ts:19-26` |
| Build complet | `vue-tsc -b && vite build && vite build --config vite.sdk.config.ts` — tout ajout passe par le typecheck Vue du dépôt entier | `package.json:8` |
| Service worker | UN SEUL `public/sw.js`, `VERSION = 'mia-v1'` | `sw.js:35` |
| Coquille pré-cachée | `./index.html` du **widget visiteur** + manifeste + favicon + icônes | `sw.js:43-49` |
| Enregistrement du SW | widget (`src/main.ts:39`), pages publiques (`src/application/commun.ts:106`), push (`src/helpers/push.ts:327`) ; jamais en dev ni iframe | `src/helpers/pwa.ts:41-47` |
| Manifeste PWA | `id: "./index.html"`, `start_url: "./index.html?app=1"`, nom **« Mia — assistante ePerformance »**, raccourcis « Poser une question / Mes conversations / Aide » | `public/mia-manifest.webmanifest:2-9,56-78` |
| TWA Android | `host: mia.eperformance.pro`, `webManifestUrl: https://mia.eperformance.pro/mia-manifest.webmanifest`, `startUrl: "/"`, raccourcis `/index.html?app=1#/…` | `twa-manifest.json:3,8-9,29-48` |
| Déploiement | Actions `deploy-pages.yml` : build + test + publish `dist/` vers GitHub Pages (`kstephane683.github.io/eperformance-widget`) ; `dist` non versionnée | `.github/workflows/deploy-pages.yml`, `.gitignore:2` |
| Portail | `/application` lie `./mia/` et `../index.html?app=1` | `application/index.html:154-155` |
| Hors-ligne actuel | coquille widget + page de secours statique ; `/api/…` et hors-origine jamais mis en cache ; rien pour une app authentifiée (pas de cache chiffré) | `sw.js:43-49,63-66,235-266` |

### Confrontation à la consigne

- **« L'infrastructure PWA existe, réutilisée telle quelle » (PLAN-COMPLET §3.4) : FAUX en tant que tel.** L'infrastructure existe (SW, manifeste, invite, hors-ligne, TWA posée), mais son **contenu décrit le produit VISITEUR** : le manifeste installe le chatbot visiteur (nom, id, start_url, raccourcis ci-dessus), la coquille hors-ligne pré-cachée est l'index du widget, la page d'installation (`application/mia/index.html:50`) pointe ce manifeste. Réutiliser « tel quel » = publier une app de gestion sous l'identité installée du chatbot visiteur.
- **Le hors-ligne « chiffré, purgé à la déconnexion » (CONSIGNE §2 transverses) n'existe nulle part** : le SW actuel ne cache jamais l'API (`sw.js:63-66`) et ne chiffre rien. C'est une construction à faire, pas une réutilisation.
- La consigne annonce « 7 captures + README » de références visuelles ; le dépôt contient **6 captures** (`jeko-01…jeko-06`, dont une variante) + README. Mineur.

---

## 2. La cohabitation — scénarios de collision précis

**Un seul SW sert déjà tout le monde.** Il est enregistré au chemin racine (`sw.js`) avec une portée qui couvre widget, portail, page `/application/mia` et toute future entrée (`pwa.ts:47`, URL relative à `document.baseURI`).

1. **Coquille hors-ligne (le mauvais produit s'ouvre).** Hors ligne, toute navigation tombe dans `repondreNavigation` → `cache.match(…, { ignoreSearch: true })` sur la coquille → renvoie l'index du **widget visiteur** (`sw.js:104-120,113`). Un propriétaire qui ouvre la nouvelle app sans réseau verrait le chatbot visiteur. Parade : coquille par entrée (clés distinctes dans `COQUILLE`, `VERSION` bumpée à chaque publication) ou service worker séparé pour l'app de gestion ; l'écran hors-ligne de l'app doit être le sien, pas `PAGE_HORS_LIGNE` du widget (`sw.js:235-266`).
2. **Identité PWA (même id, deux produits).** Si la nouvelle app réutilise `mia-manifest.webmanifest` ou l'id `./index.html`, les installations existantes changent d'identité sans le savoir. Parade : manifeste dédié (id, nom, `start_url`, raccourcis propres) — la règle produit « l'app actuelle reste en ligne jusqu'au basculement » l'exige.
3. **L'emplacement de la LP : la consigne se contredit elle-même.** §3 : « la landing remplace l'actuelle `/application/mia` (dépôt du widget, entrée Vite dédiée sans Vue…) ». §6 et README d'eperformance-mia : la LP vit dans le **dépôt dédié** servi sur `mia.eperformance.pro`. Les deux ne peuvent pas être vrais. Si SITE suit §3 littéralement, il **écrase la page de présentation/installation de l'app actuelle** (canonical `kstephane683.github.io/eperformance-widget/application/mia/`, lien manifeste `application/mia/index.html:16-19,50`) pendant que « l'app actuelle reste en ligne ». Parade : arbitrage écrit au journal avant toute maquette (recommandation : LP = `eperformance-mia/index.html`, `/application/mia` intouchée jusqu'au basculement), puis correction de la consigne.
4. **TWA orpheline.** L'Android TWA posée pointe `mia.eperformance.pro` (`twa-manifest.json:3`) où `mia-manifest.webmanifest` **n'existe pas** (inventaire eperformance-mia : aucun manifeste, aucun `sw.js`) → 404 silencieux, WebView en custom tabs. Ses raccourcis (`/index.html?app=1#/messages`) visent des routes du widget servies aujourd'hui par la page d'attente ; après remplacement par la LP, la TWA ouvrira la LP, pas l'app de gestion. La republication TWA est côté propriétaire (Play). Parade : décider dès la conception où l'app de gestion est servie ; si `mia.eperformance.pro`, prévoir le build de l'app dans `eperformance-mia` (ou un routage), sinon mettre à jour `host`, `webManifestUrl`, `startUrl`, raccourcis et republier.
5. **Cache statique sans invalidation.** Le SW met en cache-first toute ressource same-origin (style, script, image, font, manifeste — `sw.js:52,162-165`) ; les anciennes empreintes ne sont purgées qu'au bump de `VERSION` (`sw.js:86-97`) que rien n'automatise. Parade : règle « publication = bump VERSION » écrite dans la définition de done.

---

## 3. Le contrat API-CLIENT-V1.md contre le code — vérifications

| # | Point du contrat | Constat code | Verdict |
|---|---|---|---|
| 1 | « 31 endpoints » (CONSIGNE §6, B3) | `client.py` porte **20 routes** (`client.py:64,208-1138`) ; + 3 admin (`admin_chatbot.py:539,619,653`) + 2 auth = **25 documentés** | Chiffre 31 faux ; les 20 routes listées existent toutes |
| 2 | Rate limits §11 | Identiques : login 10/300, password 5/300, 2fa 10/10/5, message 12/60 — mécanisme in-memory par instance | Conforme (`app.py:68-81,86-105`) |
| 3 | Ordre des vérifications §2.4 (404 isolation avant rôle/2FA) | `require_site_owner` : non provisioné 403 → **404** isolation → rôle 403 → 2FA 403 | Conforme (`core/auth.py:433-459`) |
| 4 | Colonnes migrées §12 (`horaires`, `notification_settings`, `role_client`, `totp_*`, `must_change_password`) | `users` : `core/models.py:59-74` ; `chatbot_sites` : `chatbot/models.py:58-66` ; migration au boot idempotente `core/migrations_boot.py:46-56` ; SQL manuel `migrations/postgresql/005_refonte_app_mia.sql` présent | Conforme |
| 5 | Dépendance 2FA §13 | `pyotp==2.9.0` | Conforme (`requirements.txt:30`) |
| 6 | `/orders` état explicite §4.7 | 200 `disponible: False` + raison | Conforme (`client.py:733-752`) |
| 7 | PUT settings §5.2 (`system_prompt` 400, types de notification 422, `horaires` 422 non-objet) | Refus explicites | Conforme (`client.py:794-880`) |
| 8 | CORS pour la LP/l'app | `DEFAULT_ORIGINS` (`app.py:22-34`) ne contient **pas** `https://mia.eperformance.pro` (ni kstephane… qu'il contient) | **Non établi côté Railway** (env `CORS_ORIGINS` non lisible ici). Si l'env ne l'ajoute pas : la démo S4 (exigée en dur dans `landing.js` par `verifier-structure.py:190`) et toute app hébergée sur mia.eperformance.pro échouent en préflight. À vérifier AVANT de concevoir S4. |

Tests de garantie présents : `backend/api/test_refonte_app_mia.py`, `backend/chatbot/test_refonte_declencheurs.py`. Snapshot noyau : `backend/chatbot/competences_noyau.py` porte les **14** secteurs du noyau (dont `blog`, `email`) ; la route filtre par `SECTEURS_CORE.get(sector)` (`client.py:915-970`) — un site réglé sur un secteur hors périmètre client recevrait des compétences hors des 12 attendues. Mineur, à confiner côté app.

---

## 4. La LP et ses garde-fous — ce qu'ils contrôlent réellement

Dépôt `eperformance-mia` (public, Pages sur `mia.eperformance.pro`, CNAME + HTTPS enforced, page d'attente en place).

- **Hook pre-push** (`.git/hooks/pre-push`) : enchaîne les 3 scripts. **Il n'est pas versionné** — un clone neuf, une autre machine ou la CI n'ont pas ce garde-fou local.
- **Actions CI** (`.github/workflows/controles.yml:3-25`) : les 3 contrôles tournent **après** le push. Le déploiement Pages (`pages-build-deployment`) part indépendamment du verdict : **un commit fautif poussé sur main est publié sur mia.eperformance.pro avant toute détection** — les checks constatent, ils ne bloquent pas. Aucune protection de branche établie (non établi, aucun réglage visible ici).
- **Empreinte eperf.css** (`scripts/verifier-empreinte.py:44-53`) : sha256 des octets sous le marqueur de NOTE, comparés à `eperf.css.sha256`, plus comparaison à la source si fournie. Solide.
- **Contrôles structurels** (`scripts/verifier-structure.py`) : retarget automatique sur `index.html` dès que « en préparation » disparaît (`l.40-56`) — la promesse de la consigne est vraie **pour la cible**. Mais le **contenu** des contrôles est écrit contre le DOM de la LP v1 archivée :
  - ids exacts `haut/capacites/fonctionnement/demo/application/preuves/faq/demarrer` (`l.67-76`) ;
  - 12 `data-panneau` + 12 `data-questions` exacts (`l.129-134`) et **exactement 3** `questions_demo` par secteur (`l.125-126`) ;
  - classes imposées `panel-secteur`, `liste-repond`, `liste-execute`, `badge-bientot` pour le contrôle C2 (`l.139-146`) ;
  - `restaurant_chez_amina`, `LIMITE_QUESTIONS = 5` et l'URL de production **en dur dans `landing.js`** (`l.184-191`) ;
  - durées vidéo bornées (`l.204-209`), motifs SEO précis (`l.212-225`).

**Risque bloquant légitime** : un `index.html` qui applique la liberté de conception explicitement accordée (« référence de contenu, pas un modèle de conception ») échouera aux contrôles s'il n'imite pas le DOM archivé. **Parade** : réécrire `verifier-structure.py` en contrôles d'INTENTION (8 sections sémantiques repérées autrement que par ces ids, 12 secteurs, C2 par structure de liste, zéro hex/emoji/Google Fonts, vidéos, SEO) **avant** de figer la maquette, et versionner un installeur de hook (`scripts/installer-hooks.sh`).

**Risque laisser-passer** : publication Pages non gated (voir Actions) — un secret poussé sur main est public aussitôt. Parade : pousser sur branche + PR tant que la LP n'est pas prête, ou branch protection avec checks requis ; le hook local n'y suffit pas.

**Faux positifs possibles** : `verifier-secrets.py:48-55` bloque toute valeur alphanumérique ≥ 20 caractères affectée à une clé `token|password|secret|…` dans un fichier versionné (doc d'API, exemple JSON) sans marqueur GABARIT (`l.67-70`). Parade : suffixer les exemples (`EXAMPLE`, `XXXX`).

**La démo S4 frappe la production** : site `restaurant_chez_amina`, limite 5 questions, API prod. Chaque démo crée des conversations et une notification in-app **toujours écrite** (contrat §7.3) → bruit et pollution analytics du site de démo ; le rate limit `POST /message` 12/60 s **par IP** (`app.py:69`) est partagé (IP d'entreprise, mobile NAT) → 429 à traiter dans l'UI (contrat §11). Parade : site de démo dédié + purge programmée, état 429 conçu.

---

## 5. Le design system — mesuré

Trois surfaces de jetons coexistent et se recopient à la main :
1. canonique noyau : `agent-ia-web/eperf_core/assets/css/` (10-primitives … 50-utilities) ;
2. copie de déploiement : `site-eperformance/assets/css/eperf.css`, épinglée par sha256 dans eperformance-mia ;
3. copie widget : `src/styles/jetons.css` — copie **manuelle** documentée (`jetons.css:1-22`), **sans mécanisme d'empreinte**.

Valeurs vérifiées identiques ce jour (`--gold: #856b37`, `--bg: #fdfcfa` : `jetons.css:49,60` = `site-eperformance/assets/css/eperf.css:157,168`). Le risque est la divergence silencieuse côté widget, précisément le défaut que l'empreinte empêche ailleurs. Parade : étendre le contrôle empreinte à `jetons.css`. Noter aussi : `unified-ia-backend/agent-ia-web` n'existe pas — le noyau est un dépôt **sibling** (`/home/ballo/OX6A/agent-ia-web`) ; les générateurs le résolvent (`scripts/generer_competences_noyau.py:30`, `_build/generer-contenu.py:31-34`), les chemins relatifs des documents sont ambigus à la lecture.

---

## 6. Les risques classés

| # | Gravité | Risque | Parade à intégrer à la conception |
|---|---|---|---|
| R1 | **Bloquant** | Contradiction d'emplacement de la LP (CONSIGNE §3 vs §6) — suivre §3 détruit la page d'installation de l'app actuelle | Arbitrage écrit au journal avant toute maquette ; consigne corrigée ; LP = `eperformance-mia`, `/application/mia` intouchée |
| R2 | **Bloquant** | Garde-fou structurel prescriptif du DOM archivé : tout nouveau design échoue à la CI/pre-push | Réécrire `verifier-structure.py` en contrôles d'intention AVANT le design ; versionner le hook |
| R3 | Majeur | « PWA réutilisée telle quelle » : manifeste et coquille SW appartiennent au produit visiteur ; hors-ligne chiffré inexistant | Manifeste dédié (id/nom/start_url), coquille SW par app + bump VERSION, conception du cache chiffré purgé à la déconnexion |
| R4 | Majeur | TWA pointe `mia.eperformance.pro` : webManifestUrl 404, raccourcis du widget, LP derrière ; republication = propriétaire | Décision précoce du domaine de service de l'app de gestion ; mise à jour + republication TWA planifiée (canal propriétaire) |
| R5 | Majeur | CORS : `mia.eperformance.pro` absent des origines par défaut ; non établi côté Railway | Vérifier/poser `CORS_ORIGINS` AVANT S4 ; sinon démo et app inutilisables depuis la LP |
| R6 | Moyen | Pages publiée sans gate (hook local non versionné, Actions post-publication) | Branche + PR tant que la LP n'est pas prête ; branch protection avec checks requis |
| R7 | Moyen | Démo S4 sur la prod : notifications in-app systématiques, analytics pollués, 429 partagé 12/60 s par IP | Site de démo dédié + purge ; gestion du 429 conçue dans la LP et l'app |
| R8 | Mineur | « 31 endpoints » faux (20 réels) ; compétences hors périmètre si `sector` hors des 12 ; `jetons.css` sans empreinte ; « 7 captures » (6 réelles) | Corriger les chiffres dans la consigne ; filtrer les secteurs côté app ; étendre l'empreinte aux jetons widget |

---

## 7. Verdict de faisabilité

Faisable, sous trois conditions non négociables avant toute maquette : (1) arbitrage écrit de l'emplacement LP (R1) ; (2) refonte des contrôles structurels en contrôles d'intention (R2) — sinon la CI bloque le design légitime ; (3) décision du domaine de service de l'app de gestion + manifeste/coquille dédiés (R3, R4), avec vérification CORS (R5). Le contrat de données est, lui, vérifié conforme sur 7 points sur 8 — il peut être consommé tel quel.
