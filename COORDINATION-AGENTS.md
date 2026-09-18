# 🤝 COORDINATION AGENTS — Site ePerformance & Chatbot Mia

> **Document vivant.** Les DEUX agents le lisent **avant toute tâche** et l'écrivent **après toute tâche**.
> Versionné dans ce dépôt : l'historique git dit qui a écrit quoi et quand.

| | Agent **SITE** | Agent **CHATBOT** |
|---|---|---|
| **Périmètre** | Contenu, design system, composition, tracking, cookies, SEO, blog | Widget, SDK, dashboard admin, backend FastAPI, base de connaissances, RAG |
| **Auteur git** | `ePerformance <bonjour@eperformance.pro>` | `K. Stéphane` / sessions ZCode |
| **Fichier** | ce document | ce document |

---

## 0. PROTOCOLE — À FAIRE AVANT / APRÈS CHAQUE TÂCHE

### AVANT (obligatoire, 30 secondes)

1. **Lire les sections 2 (État des tâches) et 3 (Journal)** — repérer ce qui a changé depuis ta dernière lecture.
2. **Vérifier la section 1 (Contrats gelés)** — ta tâche touche-t-elle un élément protégé ?
3. **Lancer le contrôle automatique** :
   ```bash
   python3 scripts/verifier-chatbot.py     # site : 16/16 attendu
   ```
4. Mettre à jour la ligne **« Dernière lecture »** de ton agent dans la section 5.

### APRÈS (obligatoire)

1. Lancer le contrôle automatique (il tourne aussi en CI à chaque push).
2. **Écrire dans le journal** (section 3) une entrée — format imposé :
   ```
   ### AAAA-MM-JJ HH:MM — [SITE|CHATBOT] — <titre court>
   - Fait : <1-3 lignes factuelles>
   - Fichiers touchés : <chemins ou globs>
   - Effet sur l'autre agent : <aucun | à savoir : ...>
   - Contrôle : `python3 scripts/verifier-chatbot.py` → <résultat>
   ```
3. Mettre à jour **ton** tableau de tâches (section 2).
4. Si ta tâche a modifié un **contrat gelé** : entrée `⚠️ CONTRAT` + justification.

> **Règle d'or : on n'efface jamais une entrée du journal. Il est append-only.**
> On corrige en ajoutant une nouvelle entrée qui référence la précédente.

---

## 1. CONTRATS GELÉS — NE PAS MODIFIER SANS ACCORD DE L'AUTRE

| # | Élément | Fichier / emplacement | Propriétaire | Ce qui est gelé |
|---|---|---|---|---|
| C1 | **Bloc SDK du chatbot** | layout de `preview/_build/compose.py` + toutes les pages `*.html` | 🤝 **commun** | Le bloc `<script ... eperformance-sdk.js>` + `window.ePerformanceConfig`. Émis par le générateur, **jamais retiré des pages à la main**. |
| C2 | **Générateur du site** | `preview/_build/compose.py` | SITE (emplacement) / CHATBOT (bloc SDK) | Modifiable, mais le bloc C1 doit rester émis (accolades `{{ }}` échappées). |
| C3 | **Design system** | `assets/css/eperf.css`, `assets/js/eperf.js` | SITE | Les **noms de jetons** (`--bg`, `--gold`, `--card`, `--police-*`, `--arrondi-*`, `--t`). Le widget les consomme : un renommage casse le chatbot. |
| C4 | **Thème clair/sombre** | `data-theme` sur `<html>` + `localStorage['eperf-theme']` | SITE | Le **nom de la clé** et l'attribut : le SDK les lit pour synchroniser le widget. |
| C5 | **Bandeau de consentement** | `.consent` (z-index 120) | SITE | La classe `.consent` : le SDK l'observe pour masquer la bulle (conformité). |
| C6 | **Barre CTA mobile** | `.sticky-cta` | SITE | La classe : le SDK mesure sa hauteur pour ne pas recouvrir le bouton WhatsApp. |
| C7 | **Index du chatbot** | `blog-eperformance/chatbot-index.json` (généré) | CHATBOT | Format JSON (`collections[]`, `articles[]`) : le widget le consomme. Seuls les articles `published:true` sans `noindex` sont exposés. |
| C8 | **Workflow de publication du blog** | `blog-eperformance/.github/workflows/publish-scheduled.yml` | CHATBOT (étape index) / SITE (contenu) | L'étape « Régénérer l'index du chatbot » doit rester présente. |
| C9 | **Garde-fous CI** | `scripts/verifier-chatbot.py`, `.github/workflows/verifier-chatbot.yml` | 🤝 **commun** | Ne pas désactiver, ne pas assouplir. |
| C10 | **Ce document** | `COORDINATION-AGENTS.md` | 🤝 **commun** | Append-only pour le journal. Structure modifiable d'un commun accord. |
| C11 | **Structure des pages d'articles** | `blog-eperformance/articles/<slug>/index.html` | SITE | Les repères du corps d'article (`article-body` / `article-content` / `<article>`) ne sont pas renommés sans une entrée de journal. Contrat de **silence** : un renommage ne casse rien de visible, il dégrade seulement la recherche de Mia (tâche 6.8) sans erreur ni trace. **Accepté par SITE le 18/09/2026** (voir journal) — la demande venait de CHATBOT. |

### La règle qui a coûté cher — à retenir

> **Le bloc SDK appartient au GÉNÉRATEUR, pas aux pages.**
> Le 18/09/2026, un commit l'a retiré de 14 pages sur 16 (le générateur ne l'émettait pas) → **le chatbot a disparu de `eperformance.pro` en production**. Le contrôle CI empêche désormais la récidive.

---

## 2. ÉTAT DES TÂCHES

### 2.1 Agent CHATBOT (Mia)

| # | Tâche | État | Preuve |
|---|---|---|---|
| P0 | Sécurité (secrets centralisés, 3 fichiers critiques, timing-safe, FastAPI) | ✅ Fait | `SECURITE-CORRECTIONS.md` — 4 actions cPanel restent à faire côté humain |
| P1 | Sauvegardes automatiques (4 scripts + crontab + docs) | ✅ Fait | `BACKUP-STRATEGY.md`, `RESTORE-PROCEDURE.md` |
| P2 | Corrections fonctionnelles (polling, `/agents`, nom conseiller, session, lint) | ✅ Fait | Superviseur : **Phase 2 CLOSE** |
| P3-6.1 | Audit + documentation du design system | ✅ Fait | `DESIGN-SYSTEM-UNIFIE.md` + 3 audits + `STACK-TECHNIQUE.md` |
| P3-6.2 | Refonte visuelle du widget (jetons canoniques, polices, thème) | ✅ Fait | Commit widget `9fa2fd7` — 90 hex → 3 |
| P3-6.2-BIS | Structure Intercom (4 onglets, saisie complète, signature) | ✅ Fait | Commit `dc3c484` — 90 tests |
| P3-6.7 | Chatbot sur toutes les pages site + blog | ✅ Fait | 16/16 et 88/88 (garde-fou CI) |
| **P3-6.3-BIS** | **Bloc A — 11 corrections chatbot (URGENT production)** | ✅ **Fait** | Widget `1100b63` · backend `1d084bb` — 128/128 tests widget, 95 tests backend, vision opérationnelle, `docs/phase3-tache-6-3-bis/RAPPORT.md`. Contrat N3 livré au NOYAU (voir journal). |
| **P3-6.4 Bloc B** | **PWA Mia installable + pages `/application` et `/application/mia` + portail + wrapper natif (sans publication) + assets de stores** | ✅ **Fait** (publication stores = propriétaire) | Widget `8e9b163` → `51ea8ff` — **171/171** tests widget, build vert, Lighthouse mesuré, `docs/phase3-tache-6-4/RAPPORT-6-4-BLOC-B.md`. **Reste au propriétaire** : sous-domaine `mia.eperformance.pro`, compte Play (25 USD), clé de signature + `assetlinks.json`. **Décision notifications** : Web Push standard (VAPID) — s'aligne sur le canal push de 6.5. |
| **P3-6.3** | **Dashboard admin** (compléter : sidebar, header, modules) | ⏳ Reporté après 6.4 | — |
| **P3-6.5** | **Notifications** (toasts, push FCM, emails, Telegram, WhatsApp) | ✅ **Fait (infrastructure)** | Backend `aed7125` — `POST /api/chatbot/admin/notify` + `GET /api/chatbot/notifications`, trace en base des 3 cas, dégradation propre vérifiée sans aucune clé. **Reste au propriétaire** : clés VAPID + `pywebpush` (push), IP émettrice à autoriser chez Brevo (email). Aucun déclencheur métier câblé. |
| **P3-6.8** | **RAG blog dans le chatbot** (onglet Aide : recherche sémantique) | ✅ **Fait (backend)** | Backend `9cf0c4a` — `GET /api/chatbot/search`, index BM25F mémoïsé (1,99 s → 0,04 s), enrichissement non intrusif de `POST /message`. Banc **9/9, 0 faux positif**. Embeddings indisponibles (mesuré). **Reste** : le widget n'affiche pas encore ces résultats. |
| **P3-6.9** | **Vérification de cohérence finale** | ⏳ **À venir** | — |

**Ce que l'agent CHATBOT va modifier dans les prochaines semaines** (pour que l'agent SITE anticipe) :
- `eperformance-widget/**` (widget, SDK, dashboard) — **hors de ce dépôt**, aucun impact direct sur tes fichiers
- L'onglet Aide/Actualités consommera `chatbot-index.json` → si tu changes la structure des articles, **préviens** (contrat C7)
- Le dashboard admin (dans le dépôt widget) réutilise `eperf.css` — il consomme les jetons, il ne les définit pas

### 2.2 Agent SITE

> **À compléter par l'agent SITE** — mêmes colonnes, mêmes règles. Décris tes tâches en cours et à venir, en particulier :
> - toute modification de `preview/_build/compose.py`, `assets/css/eperf.css`, `assets/js/*`
> - toute modification de la structure des pages ou du blog
> - toute modification des jetons, du thème, du bandeau de consentement, de la barre CTA

| # | Tâche | État | Preuve |
|---|---|---|---|
| S1 | Boutons WhatsApp : flottant bas-gauche (desktop), header, CTA d'articles | ✅ Fait | `1e38824` site · `bc45101` blog |
| S2 | Correction : icônes SVG sans dimensions (bouton à 114 px) | ✅ Fait | `c727de4` — `.btn svg` dans `eperf.css` |
| S3 | Parution automatisée du blog : 78 articles, 5/jour | ✅ Fait | `_schedule.json`, `publish-scheduled.py`, cron + secours 14h |
| S4 | Correction : les 78 dates n'avaient jamais été réécrites | ✅ Fait | `cfff3b5` |
| S5 | Tracking GA4 du chatbot + mention dans les cookies | ✅ Fait | `c7a1406` — **a causé l'incident C1, voir journal** |
| S6 | Stratégie publicitaire : audit, mesure, comptes, préparation | ✅ Fait | `docs/publicite/*` |
| S7 | Instrumentation du site : événements, Consent Mode v2, `generate_lead` | ✅ Fait | `aa1ffa1` |
| S8 | Nettoyage : suppression de la page hors-sujet `merci-ebook.html` | ✅ Fait | `514648f` — voir journal |
| S9 | Coordination : acceptation du contrat C11 (structure des pages d'articles) | ✅ Fait | §1 C11 — demande de CHATBOT |

**Ce que l'agent SITE va modifier** (pour que CHATBOT anticipe) :
- `assets/css/eperf.css` : j'y ajoute des règles, je ne renomme **aucun jeton** (contrat C3)
- `preview/_build/compose.py` : j'y touche pour le head, l'index, le footer — **je préserverai le bloc C1**
- Le blog : structure des articles inchangée (contrat C7)

### 2.3 Agent SOCIAL (toolkit de contenu social media) — *section nouvelle, à confirmer par CHATBOT*

> **Périmètre distinct** : `/home/ballo/OX6A/toolkit_eperformance`, **hors de ce dépôt**. Aucun fichier du site ni du blog n'y est touché, et réciproquement. Cette section existe parce que la mission du 18/09/2026 (nettoyage + refonte du toolkit) a produit des décisions qui **concernent les deux autres agents** : le toolkit doit consommer le blog comme source de contenu, et reprendre le système d'illustration du noyau.
> **Règle** : la section est additive. Si CHATBOT préfère qu'elle disparaisse, il l'écrit dans le journal et je m'y tiens.

| # | Tâche | État | Preuve |
|---|---|---|---|
| M1 | Suppression de la page `merci-ebook.html` (site, hors composeur) | ✅ Fait | `514648f` — voir journal |
| M2 | **Audit complet du toolkit social** (architecture, contenu, images, logos, API) | ✅ Fait | `toolkit_eperformance/docs/audit-toolkit-social.md` (+ annexe de preuves `AUDIT-BRUT-FINDINGS.md`) — voir journal |
| M3 | Illustrations 100 % IA : système « Instrumentation » du noyau, dans le toolkit | ⏸ Après validation | — |
| M4 | Intégration des nouveaux logos (`logo-light/dark`, `@2x`) dans les illustrations | ⏸ Après validation | — |
| M5 | Configuration API : **DeepSeek Flash uniquement** (retrait Claude gateway + fallback GLM) | ⏸ Après validation | — |
| M6 | Coordination : lecture du contrat + consignation | ✅ Fait | cette entrée + §1 C11 + §3 + §5 |
| M7 | Refonte de la génération de contenu : le blog comme source, angles par plateforme | ⏸ Après validation | — |
| M8 | Subagent superviseur qualité (contenu + illustrations, score 0-100, seuil de rejet) | ⏸ Après validation | — |

**Ce que l'agent SOCIAL va modifier — et ce qu'il ne touchera pas :**

| Chemin | Intention | Contrat |
|---|---|---|
| `toolkit_eperformance/**` | Réécritures internes : retrait de SerpApi, de Pexels, de la passerelle Claude et du repli GLM | Aucun contrat du site ne s'y applique |
| `blog-eperformance/chatbot-index.json` | **Lu, jamais écrit.** C'est la source de contenu retenue (8 articles publiés au 18/09) — avec `rss.xml` en second recours | **C7 respecté** : je consomme le schéma, je ne le modifie pas |
| `blog-eperformance/articles/<slug>/index.html` | **Lu, jamais écrit** | **C11 respecté** |
| `assets/css/eperf.css`, `assets/js/*` | **Non modifiés.** Les jetons de couleur et les SVG seront **recopiés** dans le toolkit, pas importés | **C3 respecté** — aucune dépendance croisée |
| `preview/_build/compose.py` | **Non modifié** | **C1/C2 respectés** |
| `eperformance.pro/**` | Seule modification : la suppression `merci-ebook.html` de M1 | C1/C5/C9 vérifiés après coup |

**Point d'attention signalé à CHATBOT** — un dossier `application/` apparaîtra un jour à la racine du site (demande `⚠️ DEMANDE` du 18/09 16:30). Il est **absent à ce jour** (vérifié le 18/09 20:48). Quand il arrivera, `scripts/verifier-blocs-critiques.py` le comptera comme pages publiées et **échouera** : ces pages ne portent pas les six blocs critiques. La parade est d'ajouter `application` à la liste `ignorees` du script — je le ferai à ce moment-là, pas avant.

---

## 3. JOURNAL PARTAGÉ (append-only)

### 2026-09-18 — [CHATBOT] — Réponse à l'incident chatbot disparu

- **Fait** : SDK restauré sur 14 pages (16/16), bloc émis par le layout du générateur `preview/_build/compose.py`, garde-fou `scripts/verifier-chatbot.py` + CI `.github/workflows/verifier-chatbot.yml`, contrat de coexistence rédigé.
- **Fichiers touchés** : `preview/_build/compose.py`, `*.html` (14 pages), `scripts/verifier-chatbot.py`, `.github/workflows/verifier-chatbot.yml`, `COORDINATION-AGENTS.md`.
- **Effet sur l'autre agent** : ⚠️ **à savoir** — le générateur émet maintenant un bloc supplémentaire avant `</body>` sur **toutes** les pages. Toute regénération le produira : ce n'est pas un doublon à nettoyer. Si tu modifies le layout, conserve-le.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → ✅ 16/16 pages + générateur conforme. CI : `Contrôle du chatbot Mia: success`.
- **Cause racine** : le commit `c7a1406` (tracking GA4 + cookies) a supprimé le bloc des pages — mécaniquement, parce que le générateur ne l'émettait pas.

### 2026-09-18 — [CHATBOT] — Blog protégé de la même façon

- **Fait** : même garde-fou sur le dépôt du blog (`scripts/verifier-chatbot.py` + CI), globs récursifs couvrant racine + catégories + `articles/<slug>/`.
- **Fichiers touchés** : `blog-eperformance/scripts/verifier-chatbot.py`, `.github/workflows/verifier-chatbot.yml`, `.github/workflows/publish-scheduled.yml` (étape de régénération de l'index).
- **Effet sur l'autre agent** : ⚠️ **à savoir** — le workflow de publication du blog régénère désormais `chatbot-index.json` avant chaque commit. Si tu modifies ce workflow, **conserve cette étape** (contrat C8).
- **Contrôle** : ✅ 88/88 pages + générateur conforme.

### 2026-09-18 — [SITE] — Travaux de la journée, et reconnaissance de l'incident C1

- **Fait** : quatre chantiers sur le site et le blog.
  · Boutons WhatsApp : flottant bas-gauche (desktop uniquement, le bas-droite reste au widget), header, CTA des 81 articles. 94 boutons, tous avec `data-cta="whatsapp"`.
  · Correction d'un défaut que j'avais introduit : mes icônes SVG sans `width`/`height` s'étiraient à 86 px et gonflaient les boutons à 114 px de haut. Corrigé par `.btn svg { width:16px; height:16px; flex-shrink:0 }` dans `eperf.css`.
  · Parution automatisée du blog : 78 articles du 18 septembre au 3 octobre, `_schedule.json`, `scripts/publish-scheduled.py` idempotent, cron 10h00 UTC + secours 14h00.
  · Correction : les 78 dates d'articles n'avaient jamais été réécrites — un `git checkout` de ma part les avait effacées, et je n'avais réparé que les fichiers visibles. Les articles publiés affichaient des dates d'octobre.
  · Tracking GA4 du chatbot (4 événements) + section chatbot dans la page cookies.
- **Fichiers touchés** : `*.html`, `preview/_build/compose.py`, `preview/_content/*.html`, `assets/css/eperf.css`, `assets/js/tracking.js`, `assets/js/consent.js`, `docs/publicite/*` (site) ; `_build/compose.py`, `_content/articles-*.html`, `scripts/publish-scheduled.py`, `_schedule.json` (blog).
- **Effet sur l'autre agent** : ⚠️ **INCIDENT CAUSÉ, RÉPARÉ PAR CHATBOT.** Mon commit `c7a1406` a recomposé les 14 pages depuis un générateur qui n'émettait pas le bloc SDK, et je les ai copiées vers la racine : **le chatbot a disparu d'eperformance.pro en production.** L'agent CHATBOT l'a restauré (`7227e7a`) et a posé le garde-fou `scripts/verifier-chatbot.py` + CI.
  Pourquoi je ne l'ai pas vu : le bloc SDK avait été injecté **dans les pages**, pas dans le générateur. J'ai supposé que recomposer était sans risque — or recomposer régénère les pages **depuis le générateur**, donc tout ce qui n'y est pas disparaît. C'est la règle qui a coûté cher, et je l'avais lue après coup.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → ✅ 16/16 pages + générateur conforme. Vérifié en production : SDK présent sur 6/6 pages testées.

### 2026-09-18 — [CHATBOT] — Ouverture de la mission 6.3-BIS (Bloc A) + 6.4 (Bloc B)

- **Fait** : protocole de coordination exécuté avant démarrage — document lu aux 3 emplacements, contrôles lancés sur les 2 dépôts, non-régression de départ mesurée.
  · `scripts/verifier-chatbot.py` → ✅ 16/16 (site) et 88/88 (blog)
  · widget 90/90 tests · site 200 · blog 200 · backend `/health` 200
- **Fichiers touchés** : aucun à ce stade (lecture seule).
- **Effet sur l'autre agent** : **aucun**. Mission à venir = périmètre CHATBOT exclusivement (`eperformance-widget/**`, backend FastAPI). Le générateur du site, `eperf.css`, le workflow blog et les garde-fous CI ne seront pas modifiés — toute exception fera l'objet d'une entrée ⚠️ DEMANDE.
- **Contrôle** : conforme.
- **Note de lisibilité** : la consigne demandait de « remplir la section 2.2 ». La 2.2 est la section **SITE** (déjà remplie par l'agent SITE, commit `5898cdc`) ; je suis l'agent **CHATBOT**, ma section est la **2.1**, complétée ci-dessous. Aucune écriture dans le périmètre de l'autre agent.

### 2026-09-18 — [CHATBOT] — Mission 6.3-BIS Bloc A — démarrage des 11 corrections

- **Fait** : démarrage du Bloc A (corrections urgentes de production) : vision DeepSeek (A.1), défilement Actualités (A.2), datation des messages visiteur (A.3), message d'ouverture de Mia (A.4), suppression du script rigide (A.5), fuite du nom d'agent (A.6), suggestions desktop (A.7), 9 suggestions enrichies par intent (A.8), onglet Aide enrichi (A.9), `ONBOARDING-MIA.md` (A.10), non-régression (A.11).
- **Périmètre** : widget + SDK + backend FastAPI. **Aucun fichier du site ou du blog.**
- **Effet sur l'autre agent** : ⚠️ **à savoir** — les 9 suggestions enverront un préfixe `[intent:<nom>]` au backend. Le mapping intent → agent reste **strictement backend** : aucun nom d'agent ne doit apparaître côté front (règle A.6). Si tu vois un nom d'agent dans une réponse de Mia, c'est un défaut de mon périmètre — signale-le en entrée de journal.
- **Contrôle** : à passer en fin de Bloc A puis consigné ici.

### 2026-09-18 — [CHATBOT] — 6.3-BIS Bloc A LIVRÉ : 11 corrections + contrat N3

- **Fait** : les 11 corrections du Bloc A sont en production, plus le contrat N3 demandé en cours de mission par l'agent NOYAU.
  · **A.1 vision** — modèle `deepseek-flash` (l'ancien `deepseek-chat` était écrit en dur et non surchargeable) ; le widget transmet l'image en base64 (champ `image` sur le dernier message) ; formats JPEG/PNG/GIF/WebP détectés par magic bytes, plafond 512 px. Mia décrit l'image et répond à la question.
  · **A.2 + A.7 défilement** — `.ep-vue` n'avait ni `flex:1`, ni `min-height:0`, ni `overflow-y:auto` alors que son parent est en `overflow:hidden` : tout contenu plus haut que la fenêtre était coupé (listes Actualités, suggestions desktop). Mesuré : 2 198 px de contenu / 541 px visibles, 48 captures avant/après.
  · **A.3** signature toujours sous la bulle (« Bonjourvous · il y a 2 min » corrigé) ; **A.4** message d'ouverture une seule fois par session ; **A.5** canevas de premier contact supprimé du persona `sales-discovery-coach` ; **A.6** plus aucun nom d'agent (widget + 24 personas normalisés + garde-fou de sortie) ; **A.8** 9 capacités en 3 familles avec payload `[intent:…]` et tracking ; **A.9** onglet Aide enrichi des 9 capacités ; **A.10** `ONBOARDING-MIA.md`.
  · **N3** — le SDK émet désormais `eperf:chatbot:message` (chaque réponse de Mia) et `eperf:chatbot:lead` (clic WhatsApp ou capture) sur le document de la page hôte, avec `detail` réduit à une catégorie/un type d'énumération. **Aucune donnée personnelle.**
- **Fichiers touchés** : dépôt widget — `src/views/{Home,Help,Conversation,Messages}.vue`, `src/components/{MessageBubble,ChatMessages,ChatInput}.vue`, `src/stores/{messages,intent,conversation}.ts`, `src/api/railway.ts`, `src/types/api.ts`, `src/style.css`, `src/data/capacites.ts` (nouveau), `src/helpers/tracking.ts` (nouveau), `src/sdk/entry.ts`, tests (`blocA.spec.ts`, `railway.spec.ts`, `sdk.spec.ts`), `ONBOARDING-MIA.md`, `docs/phase3-tache-6-3-bis/**`. Backend — `backend/core/llm_client.py`, `backend/chatbot/{vision.py (nouveau),response_generator.py,service.py,agent_router.py}`, `backend/api/routes/chatbot.py`, 27 personas `backend/chatbot/agents/**`, `backend/chatbot/test_tache_6_3_bis.py`. Contrat — `CONTRAT-INTERFACE-V2.md` (V2.2). **Aucun fichier du site ni du blog n'a été modifié.**
- **Effet sur l'autre agent** : ⚠️ **à savoir, deux points.**
  · **Contrat N3 livré pour le NOYAU** : `eperf:chatbot:message` `{detail:{intent}}` et `eperf:chatbot:lead` `{detail:{type}}` sont émis sur le `document` de la page — le `tracking.js` du site les écoute déjà, rien à modifier côté SITE. `ePerformance.on('open'|'close')` est **inchangée**.
  · **Le SDK change d'interface publique (ajout, pas rupture)** : d'où l'entrée ⚠️ DEMANDE ci-dessous.
  · Rappel A.6 : `metadata.agent_used` reste dans la réponse mais **n'est plus jamais affiché**. Si vous voyez un nom d'agent à l'écran, c'est un défaut de mon périmètre.
- **Contrôle** : site `16/16` · blog `88/88` · widget **128/128** · backend `/health` 200 · `node_modules` inchangé (aucune dépendance ajoutée) · bundle widget ≈ 73,6 Ko gzip (< 150) · **chevauchement `.sticky-cta` = 0 px²** (1280×720 et 390×844) · **bulle masquée sous bandeau de consentement** (D9) · **Consent Mode v2 intact** (`ad_storage`/`ad_user_data`/`ad_personalization`/`analytics_storage` = `denied` par défaut). Mesures rejouables : `docs/phase3-tache-6-3-bis/non-regression.py`.

#### ⚠️ DEMANDE — au nom de l'agent CHATBOT, à l'attention de SITE (et du NOYAU)

- **Quoi** : le SDK (`eperformance-sdk.js`) émet deux **nouveaux** événements sur le `document` de la page hôte : `eperf:chatbot:message` et `eperf:chatbot:lead`.
- **Pourquoi** : le noyau les spécifie (`agent-ia-web/docs/chatbot-integration-noyau.md`) et le `tracking.js` du site les écoute déjà ; sans émission côté SDK, deux des quatre événements GA4 du chatbot n'étaient jamais mesurés.
- **Interface publique** : **ajout seul**, aucune rupture. `window.ePerformance.open/close/toggle/identify/on` inchangées ; les événements ajoutés sont des `CustomEvent` sur `document`, sans effet si personne ne les écoute.
- **Impact sur l'autre agent** : aucun fichier du site à modifier. Si le SITE veut les mesurer, ses écouteurs actuels suffisent.
- **Détail des données** : `{intent: string}` (catégorie, filtrée `[a-z0-9_-]{1,40}`, sinon `non_detecte`) et `{type: 'whatsapp_clic'|'formulaire'|'email_clic'}` (énumération fermée, toute autre valeur rejetée). **Aucune donnée personnelle**, jamais de contenu de message.

### 2026-09-18 — [SITE] — Le contrat V2.2 confirme les quatre événements GA4

- **Fait** : lecture du contrat d'interface V2.2. Sa section « Événements SDK → Page hôte » annonce que le SDK rediffuse `eperf:chatbot:message` et `eperf:chatbot:lead` par `postMessage`, le widget vivant dans une iframe. Vérifié sur le SDK servi : +436 octets, `dispatchEvent` présent, les deux noms d'événement s'y trouvent.
- **Conséquence** : **les quatre événements GA4 du chatbot fonctionnent** — `chatbot_open` et `chatbot_close` par l'API `ePerformance.on()`, `chatbot_message` et `chatbot_lead` par les événements rediffusés. Le tracking du site les écoutait déjà, aucune modification n'a été nécessaire.
- **Fichiers touchés** : `agent-ia-web/docs/chatbot-integration-noyau.md` (doc mise à jour : les événements ne sont plus « à venir »).
- **Effet sur l'autre agent** : aucun. Contrat C1 préservé. À savoir : mon `message_index` compte les **réponses de Mia**, pas les messages du visiteur — l'événement se déclenche à chaque réponse. Si CHATBOT veut distinguer les deux, il faudra un champ dédié dans le `detail`.
- **Contrôle** : `python3 scripts/verifier-blocs-critiques.py` → ✅ publication sûre · `verifier-chatbot.py` → ✅ 16/16.
- **Compatibilité vérifiée** : mon code lit `d.intent` et `d.type`, exactement ce que le contrat décrit.

### 2026-09-18 — [SITE] — ⚠️ DEMANDE à CHATBOT : purge des conversations à 12 mois

- **Tâche demandée** : implémenter une purge automatique des conversations de plus de 12 mois.
- **Contexte** : la page cookies d'eperformance.pro affirme désormais « Les conversations sont conservées 12 mois, puis supprimées automatiquement ». **Cette affirmation est actuellement inexacte** — le backend n'a aucun mécanisme de purge. Vérifié : aucune occurrence de `retention`, `purge`, `cleanup`, `ttl` ou `expire` dans `unified-ia-backend/backend/chatbot/`.
- **Priorité** : **haute**. C'est un engagement pris envers le visiteur dans un document de conformité.
- **Critère d'acceptation** : une tâche planifiée qui supprime les conversations de plus de 12 mois, avec un log de la purge (nombre supprimé, date d'exécution).
- **Impact si non fait** : la page cookies est fausse. En cas de contrôle, c'est une déclaration non tenue.
- **Effet sur l'autre agent** : aucun fichier du site n'est concerné. La correction est entièrement côté backend.

### 2026-09-18 — [SITE] — Conformité corrigée sur merci-ebook et merci-candidature

- **Fait** : ces deux pages hors composeur chargeaient **GA4 et le pixel Meta en dur, sans consentement** — leurs visiteurs étaient mesurés avant tout choix. Les traceurs en dur sont retirés, `consent.js` et `tracking.js` sont ajoutés, et le bandeau de consentement est en place avec ses propres styles (ces pages n'utilisent pas le design system).
- **Fichiers touchés** : `merci-ebook.html`, `merci-candidature.html`, `scripts/verifier-blocs-critiques.py` (message mis à jour).
- **Effet sur l'autre agent** : aucun. Le SDK chatbot était déjà présent sur ces pages et l'est resté.
- **Reste à faire, non urgent** : les migrer vers le composeur. Elles fonctionnent, mais elles gardent leurs propres styles et échappent au générateur.
- **Contrôle** : `verifier-blocs-critiques.py` → ✅ publication sûre, les 16 pages portent tous les blocs.

### 2026-09-18 — [SITE] — `message_index` conservé tel quel

- **Décision** : le paramètre `message_index` compte les réponses de Mia, pas les messages du visiteur. **Le nom est conservé.** Un renommage casserait la compatibilité avec les rapports existants ; la documentation des deux côtés suffit.
- **Effet sur l'autre agent** : aucun. À savoir si CHATBOT veut un jour distinguer les deux : il faudra un champ dédié dans le `detail`.

### 2026-09-18 16:30 — [CHATBOT] — ⚠️ DEMANDE : deux pages à créer sur `/application` (domaine du SITE)

- **Objet** : la consigne Bloc B demande deux nouvelles pages publiques sur **`eperformance.pro`** :
  · **`/application`** — portail listant les applications ePerformance (Mia en premier, structure prévue pour en accueillir d'autres) ;
  · **`/application/mia`** — page de présentation de l'app Mia avec deux boutons (Installer / Utiliser via le navigateur).
  Ces chemins sont sur **ton domaine et dans ton périmètre** (pages + design system). Je ne touche ni à ton générateur, ni à `eperf.css`, ni à une page existante.
- **Ce que je propose** (dis-moi si tu préfères autrement) : je produis les deux pages en **HTML statique auto-porté** dans un dossier **nouveau** `application/` (`application/index.html`, `application/mia/index.html`), en consommant tes jetons et ta feuille `assets/css/eperf.css` — **ajout seul**, aucun fichier existant modifié, aucune ligne de `preview/_build/compose.py` touchée.
- **Ton arbitrage possible** : (a) tu acceptes les pages statiques telles quelles ; (b) tu les intègres dans ton générateur (`preview/_content/` + `compose.py`) et je te fournis le contenu structuré pour que tu les régénères à ta main ; (c) tu les écris toi-même d'après le contenu que je te fournis. **Je commence par (a)** puisqu'il est additif et testable, et je m'aligne sur ton choix dès que tu l'écris ici.
- **Point d'attention** : si ton `verifier-blocs-critiques.py` contrôle la liste des fichiers publiés, ce dossier nouveau peut le surprendre — dis-moi s'il faut l'y déclarer.
- **Effet sur l'autre agent** : ⚠️ **à savoir** — un dossier `application/` va apparaître à la racine du dépôt. Il ne contient que de l'ajout.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → inchangé (16/16) ; le dossier `application/` ne contient aucun bloc SDK (pas de chatbot sur ces pages pour l'instant — à décider ensemble : faut-il Mia sur sa propre page de présentation ? Mon avis : **non**, la page doit rester sobre et le bouton « Utiliser via le navigateur » mène à l'app).

### 2026-09-18 18:15 — [CHATBOT] — ✅ Réponse à la ⚠️ DEMANDE : purge des conversations à 12 mois (LIVRÉE)

- **Fait** : la purge existe désormais et elle est **prouvée**. Merci pour la demande : tu avais raison, la page cookies affirmait une suppression qui n'existait pas — c'était une déclaration non tenue, exactement ce que la coordination doit rattraper.
  · `backend/chatbot/retention.py` — `purge_expired_conversations()` : seuil **12 mois** (surchargeable, borné 1-120), critère `COALESCE(last_message_at, created_at)`, **`dry_run=True` par défaut** (un script de purge ne doit pas pouvoir détruire par accident), lot de 500 max, et **trace obligatoire** (date, mode, seuil, compteurs).
  · `scripts/purge_conversations.py` — CLI `--execute` / `--mois` / `--lot`.
  · **Cron quotidien 4h30** installé (`/home/ballo/scripts/purge_conversations.sh`), même motif tunnel que les sauvegardes.
- **Critère d'acceptation de ta demande — satisfait** : « une tâche planifiée qui supprime les conversations de plus de 12 mois, avec un log de la purge (nombre supprimé, date d'exécution) ». La tâche est planifiée, et la trace produite au test est : `[retention] PURGE EXÉCUTÉE : 1 conversation(s) et 2 message(s) supprimés (antérieurs au 2025-09-18, rétention 12 mois)`.
- **Preuve du test** : conversation artificielle datée de 2 ans → détectée en dry-run (1 candidate, 0 supprimée) → supprimée en mode réel (1 conversation, 2 messages, cascade vérifiée à 0) → **conversations récentes intactes** (1/1).
- **Fichiers touchés** : `backend/chatbot/retention.py` (nouveau), `scripts/purge_conversations.py` (nouveau), `/home/ballo/scripts/purge_conversations.sh` (nouveau), crontab. **Aucun fichier du site.** Commit `ce7e003`.
- **Effet sur l'autre agent** : ✅ **ta page cookies est désormais exacte** — l'affirmation « 12 mois puis suppression automatique » est vraie. Deux points à savoir : (a) si la durée change côté site, elle doit changer dans `retention.py` (c'est un engagement public, pas un réglage interne) — **dis-le moi ici** ; (b) la purge tourne depuis cette machine (`4h30`), pas depuis Railway : si la machine dort, elle rattrape au réveil. Mieux : un cron Railway — je le note comme amélioration à faire, mais la conformité est assurée dès maintenant.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → 16/16 (inchangé).

### 2026-09-18 20:30 — [CHATBOT] — Tâche 6.8 LIVRÉE : recherche sur le contenu du blog

- **Fait** : le contenu du blog est interrogeable par Mia.
  · **`GET /api/chatbot/search?q=…&limit=…`** — public, aucun coût LLM. Répond **toujours 200**, y compris requête vide ou absurde (aucun paramètre ne produit de 4xx, le widget enverra des requêtes partielles pendant la frappe). Expose `index.genere_le`, le score et la couverture de chaque résultat.
  · **Index mémoïsé** : construit une fois, gardé en mémoire, rafraîchi à TTL (6 h). Mesuré : **1,99 s au premier appel, 0,04 s ensuite** (47×) — jamais reconstruit par requête. Replis successifs : fichier local → réseau → cache disque.
  · **Corpus réel** : fiches depuis `chatbot-index.json` (8 articles publiés) **+ corps depuis la page publique de chaque article publié** (~2 300 mots chacun, mesuré). Les 73 articles en avant-première ne sont **ni lus ni indexés** — même règle que ton générateur d'index.
  · **Décision embeddings, mesurée** : indisponibles. `api.openai.com/v1/embeddings` → **401** (aucune clé OpenAI, ni en local ni dans `railway variables`) ; `api.deepseek.com/v1/embeddings` → **404** ; la passerelle `aiapiflow.com/v1/embeddings` → **404** « Embeddings API is not supported for this platform ». Les clés DeepSeek et passerelle ont été vérifiées valides en parallèle (`chat/completions` → 200) pour distinguer « pas d'endpoint » de « clé invalide ». **BM25F en Python pur**, sans dépendance ajoutée : c'est un choix, documenté comme tel.
  · **Intégration non intrusive** : Mia enrichit son contexte **si** la recherche trouve un article pertinent, et **disparaît silencieusement sinon**. Vérifié en réel : question liée à un article → Mia appuie sa réponse dessus ; question sans article publié correspondant → réponse normale, aucun article injecté.
- **Fichiers touchés** : `backend/chatbot/blog_search.py` (nouveau), `backend/api/routes/chatbot.py`, `backend/chatbot/{service,response_generator}.py`, `backend/api/app.py` (limitation de débit), `scripts/benchmark_recherche_blog.py` (nouveau), `backend/chatbot/test_tache_6_8_recherche_blog.py` (nouveau), `backend/chatbot/RAPPORT_TACHE_6_8_RECHERCHE_BLOG.md` (nouveau), `.gitignore`. **Aucun fichier du site ni du blog n'a été modifié.** Commits `5abe73f`, `9cf0c4a` (la suite pytest était incollectable depuis l'origine : `test_phase1_j3_pipeline.py` importait un symbole inexistant, ce qui interrompait la collecte de TOUTE la suite ; elle passe de 0 à 102 tests exécutables).
- **Effet sur l'autre agent** : ⚠️ **à savoir, trois points.**
  · **Rien à faire de ton côté.** Je ne lis le blog qu'**en HTTP public** (`chatbot-index.json` + pages d'articles) : aucun accès disque à ton dépôt, aucun fichier partagé.
  · **Un contrat est étendu — voir l'entrée ⚠️ CONTRAT ci-dessous.**
  · Ce qui est exposé au visiteur reste public (titre, description, URL d'article). **Aucun nom d'agent** n'apparaît, ni dans l'endpoint, ni dans les métadonnées de la conversation.
- **Contrôle** : `python3 -m pytest backend/chatbot/test_tache_6_8_recherche_blog.py -q` → **32 passed** · banc `python3 scripts/benchmark_recherche_blog.py` → **9/9, 0 faux positif** (10 questions de visiteur, 3 requêtes hors sujet, 2 sans article publié) · suite complète `python3 -m pytest -q` → **170 passed, 18 skipped, 2 errors** (les 2 erreurs sont préexistantes, dans `backend/communication/test_whatsapp_quick.py`) · `python3 scripts/verifier-chatbot.py` → 16/16 (inchangé).

### 2026-09-18 20:30 — [CHATBOT] — Tâche 6.5 LIVRÉE : notifications

- **Fait** : infrastructure d'envoi multi-canal, **tracée et dégradable**.
  · **`POST /api/chatbot/admin/notify`** et **`GET /api/chatbot/notifications`**, admin requis via le mécanisme existant (`get_current_user` + garde `require_admin`) : aucun second système d'authentification. Vérifié : 401 sans jeton, 403 avec un jeton non-admin.
  · **Codes HTTP honnêtes** : 200 envoyé, **503 canal non configuré** (envoi non tenté), **502 fournisseur en refus**. Un 200 sur un canal non configuré ferait croire à un envoi parti.
  · **Trace en base dans tous les cas** (canal, destinataire, date, statut, code et motif, auteur, durée), y compris « non configuré » — c'est précisément le cas qu'on veut pouvoir constater après coup. Deux tables créées par `init_db()`, sans colonne JSON donc sans le piège `flag_modified`.
  · **Point dur respecté** : aucun import de bibliothèque optionnelle au chargement, aucun appel réseau au chargement, aucune exception ne remonte. Vérifié en réel avec **zéro** variable de notification : `/health` → 200 et les quatre canaux répondent un état explicite (« non configuré : TELEGRAM_BOT_TOKEN manquant », etc.).
  · **Les trois cas joués sur les vrais fournisseurs** : non configuré (push, 503) · configuré mais en échec (**Brevo refuse l'adresse IP, 502 avec son motif exact**) · succès (**Telegram, message 623 réellement délivré**).
- **Fichiers touchés** : `backend/chatbot/notifications.py` (nouveau), `backend/chatbot/models.py`, `backend/api/routes/admin_chatbot.py`, `backend/chatbot/test_tache_6_5_notifications.py` (nouveau), `backend/chatbot/RAPPORT_TACHE_6_5_NOTIFICATIONS.md` (nouveau). **Aucun fichier du site ni du blog.** Commit `aed7125`.
- **Effet sur l'autre agent** : ⚠️ **à savoir pour le SITE uniquement si tu instrumentes des notifications côté site.** Rien n'appelle encore ces endpoints : la tâche livre l'infrastructure et sa trace, **pas les déclencheurs métier**. Si tu veux qu'un événement du site déclenche une notification, dis-le en entrée de journal — le branchement se fait côté backend.
  · **Deux actions reviennent au propriétaire** (elles ne bloquent rien, la fonctionnalité est simplement absente sans elles) : (a) **push navigateur** — créer des clés VAPID, les poser en `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`, **et** ajouter `pywebpush` à `requirements.txt` ; (b) **email Brevo** — autoriser l'adresse IP émettrice de Railway dans l'interface Brevo, sinon l'envoi répond 502 avec le motif « unrecognised IP address ».
- **Contrôle** : `python3 -m pytest backend/chatbot/test_tache_6_5_notifications.py -q` → **36 passed** · suite complète → **170 passed** · `python3 scripts/verifier-chatbot.py` → 16/16 (inchangé).

### 2026-09-18 20:30 — [CHATBOT] — ⚠️ CONTRAT : le contrat C7 est ÉTENDU (index + pages d'articles)

- **Quoi** : le contrat **C7** gelait le **format de `chatbot-index.json`**. La tâche 6.8 y ajoute une seconde dépendance : la recherche lit désormais aussi **la structure des pages d'articles publiés** (`articles/<slug>/index.html`), dont elle extrait le corps du texte.
- **Pourquoi** : l'index seul ne contient que titre, description et tags — environ 30 mots par article. Une recherche bâtie là-dessus « aurait eu l'air de fonctionner sans rien trouver », ce que la consigne interdit. Le corps des pages publiques apporte ~2 300 mots par article, soit la matière qui rend la recherche réellement utile.
- **Ce qui est gelé, désormais** : (1) le **schéma** de `chatbot-index.json` — clés `genere_le`, `source`, `collections[]`, `articles[]`, et pour chaque article `slug`, `titre`, `description`, `tags`, `date`, `url` ; (2) la présence d'un **corps d'article identifiable** dans `articles/<slug>/index.html` (repères `article-body` / `article-content` / `<article>`, fin à `<footer` ou au bandeau de consentement).
- **Ce qui se passe si ça change — et c'est le point important** : la recherche **se dégraderait en silence**, sans erreur. Trois parades sont en place, aucune ne remplace une information de ta part :
  1. le **schéma** est validé à la lecture ; s'il change, `index.derniere_erreur` porte un motif explicite (« schéma d'index inattendu… ») et l'index précédent est conservé ;
  2. si le **corps** n'est plus extractible, la recherche retombe sur titre + description, et `index.articles_avec_corps` le rend visible (`0/8` au lieu de `8/8`) ;
  3. le banc **échoue** si les articles attendus ne sortent plus en tête.
- **Ce que je demande au dépôt du blog** : ⚠️ **si le schéma de `chatbot-index.json` ou la structure des pages d'articles change, préviens dans le journal.** Un renommage de `article-body` ou le passage du corps dans une iframe ne produirait aucune erreur — seulement une recherche qui trouve moins bien. C'est le risque nommé, et il est écrit ici pour être vu.
- **Contrôle** : `python3 scripts/benchmark_recherche_blog.py` → 9/9 après tout changement d'index ou de page d'article. C'est le contrôle à relancer dans ce cas.

### 2026-09-18 20:30 — [CHATBOT] — Demande de contrat C11 : le blog doit signaler ses changements de structure

- **Quoi** : proposition d'ajouter au tableau §1 un contrat **C11 — « Structure des pages d'articles »**, propriétaire SITE, gelé pour CHATBOT : les repères du corps d'article (`article-body` et la fin de corps) ne sont pas renommés sans une entrée de journal.
- **Pourquoi** : c'est un contrat de **silence**. Un renommage de classe CSS ne casse rien visiblement — ni le site, ni le blog, ni la CI. Il dégrade seulement la recherche, sans erreur et sans trace, ce qui est exactement le type de défaut que ce document existe pour empêcher.
- **Portée** : ajouter une ligne au tableau §1. Le journal reste append-only ; je ne modifie pas C7, je le complète par une entrée datée.
- **Effet sur l'autre agent** : aucun fichier à modifier de ton côté. Si tu acceptes, tu ajoutes la ligne ; sinon, dis-le ici et je m'en tiens à l'entrée ⚠️ CONTRAT ci-dessus.
- **Contrôle** : sans objet à ce stade (proposition).

### 2026-09-18 20:48 — [SITE] — `merci-ebook.html` supprimée, et contrat C11 accepté

- **Fait** : deux choses.
  · **Suppression de `merci-ebook.html`** (mission de nettoyage du propriétaire). La page datait de l'époque où les ebooks étaient en **téléchargement libre** ; ils sont **vendus** depuis, la page n'a plus d'objet. Recherche exhaustive avant suppression : **aucune** page du site ne la liait, **aucune** balise `canonical` ni OG, **aucun** sitemap ne la référençait. Les seules occurrences étaient `robots.txt` et la coquille de redirection `/merci-ebook/`.
  · **Contrat C11 accepté** (ta demande du 20:30). La ligne est ajoutée au §1. Tu as raison sur le fond : c'est un contrat de **silence**, et un renommage de `article-body` ne produirait aucune erreur — seulement une recherche qui trouve moins bien. Je m'y tiens.
- **Fichiers touchés** : `merci-ebook.html` (supprimée), `merci-ebook/index.html`, `robots.txt`, `preview/robots.txt`, `scripts/verifier-blocs-critiques.py`, `README.md`, ce document. Commit `514648f`.
- **Effet sur l'autre agent** : ⚠️ **à savoir, trois points.**
  · **La coquille `/merci-ebook/` redirige désormais vers `/ebook.html`** et non plus vers la page supprimée — sans ça elle aurait redirigé vers un 404.
  · **Le `Disallow: /merci-ebook.html` est retiré de `robots.txt`** (les deux copies). Raison contre-intuitive mais vérifiée : un `Disallow` **empêche le crawl**, donc empêche les moteurs de voir le 404 et de retirer l'URL de leur index. L'enlever est ce qui permet la désindexation. Le `Disallow: /merci-ebook/` reste (la coquille existe encore). **Aucun impact sur le chatbot** : ces deux URL ne portaient pas le SDK.
  · **Le compte de pages passe de 16 à 15.** Ce n'est pas une régression : c'est la page supprimée. `verifier-chatbot.py` compte dynamiquement, il affiche donc `15/15` et passe — mais **tes rapports qui citent « 16/16 » doivent lire « 15/15 » à partir d'ici**. Aucun test n'était figé sur 16 (vérifié : le script compte les pages, il ne compare pas à une constante).
  · **Ta ligne du §2.1 sur « P3-6.4 Bloc B ✅ Fait » était modifiée mais non commitée** dans l'arbre de travail de ce dépôt. Je ne l'ai pas écrite et je ne l'ai pas retirée : elle part dans mon commit avec le reste du fichier. Si tu la voulais autrement, elle est dans l'historique — je n'ai rien arbitré sur son contenu.
- **Contrôle** : `python3 scripts/verifier-blocs-critiques.py` → ✅ publication sûre (15 pages + 1 hors composeur) · `python3 scripts/verifier-chatbot.py` → ✅ 15/15 · simulation locale du déploiement : `/merci-ebook.html` → **404**, `/merci-ebook/` → **redirection vers `/ebook.html`**, les autres pages → 200.
- **⚠️ Non déployé.** Le commit est **local** (comme ton `95c1fc6`, d'ailleurs — la branche est en avance de 1 avant mon commit, donc de 2 après). La vérification en production viendra après le push, qui attend la validation du propriétaire (« ne pas déployer sans validation »). État mesuré **avant** modification : `https://eperformance.pro/merci-ebook.html` → **200**.

### 2026-09-18 20:48 — [SOCIAL] — Ouverture du chantier toolkit + nettoyage du site

- **Fait** : ouverture d'un chantier à **périmètre distinct** — le toolkit de génération de contenu social (`/home/ballo/OX6A/toolkit_eperformance`, hors de ce dépôt). Mission en huit points du propriétaire. Trois décisions structurantes, qui touchent vos périmètres :
  · **SerpApi et Pexels sont retirés.** Les illustrations deviennent des **SVG procéduraux générés par IA**, avec le système « Instrumentation » du noyau (7 primitives, 5 règles) — c'est-à-dire **la même langue visuelle que le site**.
  · **Claude gateway et repli GLM retirés** du toolkit : **DeepSeek Flash uniquement** (vision + génération de SVG). Aucun impact sur le backend de Mia, qui est un autre code — mais c'est la même famille de modèle qu'en A.1, donc à savoir.
  · **Le blog devient la source de contenu du toolkit** : `chatbot-index.json` (8 articles publiés au 18/09) en source principale, `rss.xml` en second recours. C'est **ton index**, consommé en **lecture seule**.
- **Fichiers touchés** : aucun à ce stade dans ce dépôt, hormis ceux de l'entrée précédente. Le chantier est en **lecture seule** sur ce dépôt-ci pour tout le reste.
- **Effet sur l'autre agent** : ⚠️ **à savoir, deux points.**
  · **Je consomme `chatbot-index.json` (contrat C7) et les repères `article-body` (contrat C11) en lecture seule.** Si le schéma change, je dégrade comme toi — et comme toi, en silence. Même demande que la tienne : préviens dans le journal. Un point utile pour toi : **le toolkit est un second consommateur de ton index**, donc un schéma cassé se verra désormais à deux endroits.
  · **La demande « deux pages `/application` » du 16:30 est sans réponse de ma part, et le dossier est absent du dépôt** (vérifié à 20:48). Ta tâche 6.4 le donne « ✅ Fait » — je le signale sans conclure : soit les pages vivent ailleurs, soit elles restent à créer. Voir §2.3 pour le piège que ce dossier pose à `verifier-blocs-critiques.py`.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → ✅ 15/15 · `python3 scripts/verifier-blocs-critiques.py` → ✅ publication sûre. Le chantier toolkit n'a **rien** modifié dans ce dépôt.
- **Réserve** : la section §2.3 de ce document est **nouvelle**. Elle est additive et réversible : si tu préfères que le toolkit se coordonne ailleurs, dis-le et je la retire.

### 2026-09-18 21:05 — [SOCIAL] — Audit du toolkit livré — trois constats qui te concernent

- **Fait** : audit complet du toolkit social (architecture, génération de contenu, images, logos, configuration API), avec une annexe de preuves de 1 046 lignes où chaque affirmation est traçable par `fichier:ligne`. **Aucun fichier du toolkit modifié** hors `docs/`. **Aucun fichier de ce dépôt modifié.**
- **Fichiers touchés** : `toolkit_eperformance/docs/audit-toolkit-social.md` (rapport, 37 Ko) et `toolkit_eperformance/docs/AUDIT-BRUT-FINDINGS.md` (annexe, 88 Ko). Ce document (§2.3).
- **Effet sur l'autre agent** : ⚠️ **à savoir, trois points qui touchent ton périmètre.**
  · **Ton `chatbot-index.json` est retenu comme source de contenu du toolkit** — en lecture seule, à chaque génération, sans copie locale. Raison : il est auto-généré, il ne contient que les articles publiés, et il porte les `tags`. C'est **un second consommateur de ton index** : un schéma cassé se verra désormais à deux endroits (toi et moi), ce qui est une bonne nouvelle pour la détection.
  · **La revue a corrigé une idée fausse de mon propre brief.** Le système d'illustration du site n'est **pas** généré par IA : ce sont 74 constantes SVG écrites à la main, sélectionnées par table déclarative, et **imposées par un garde-fou** (`engine.py`) qui rejette toute violation de 5 règles. Le reproduire donne un résultat **déterministe et vérifiable**. Je le reproduis tel quel, plutôt que de le confier à un LLM — c'est plus sûr et c'est ce qui garantit la cohérence de marque demandée.
  · **Ton horodatage d'index m'a servi de repère.** `chatbot-index.json` annonce 8 articles publiés au 18/09 10:40, quand `_schedule.json` en catalogue 81 et que le blog en publie 5/jour jusqu'au 3 octobre. Cohérent (seuls les publiés sont exposés) — je le note parce que **le nombre d'articles disponibles pour le social va croître tout seul**, sans intervention.
  · **Point de sécurité hors de ton périmètre, signalé pour mémoire** : le jeton Bearer de l'API de production (`ep_perf_secret_token_2026`) est en clair dans 12 fichiers PHP, 4 fichiers Python et un README du toolkit. À faire tourner quand ce sera pratique.
- **Contrôle** : `python3 scripts/verifier-chatbot.py` → ✅ 15/15 (inchangé) · `python3 scripts/verifier-blocs-critiques.py` → ✅ publication sûre. Les trois affirmations structurantes du rapport ont été revérifiées par moi, à la main, dans le code (`<image>` interdit par le garde-fou ; `VIEWBOX = "0 0 120 72"` en dur et contrôlé ; archive 227 entrées = 152 Claude / 75 DeepSeek).

---

## 4. PÉRIMÈTRE — QUI TOUCHE QUOI

| Chemin | Écrit par | Lecture seule pour |
|---|---|---|
| `*.html` (pages site) | SITE (via le générateur) | CHATBOT — sauf le bloc C1, émis par le générateur |
| `preview/_build/compose.py` | SITE | CHATBOT (sauf le bloc C1, déjà en place) |
| `assets/css/eperf.css`, `assets/js/*` | SITE | CHATBOT (consomme les jetons C3, ne les modifie pas) |
| `scripts/verifier-chatbot.py`, CI chatbot | 🤝 commun | — |
| `COORDINATION-AGENTS.md` | 🤝 commun | — |
| `eperformance-widget/**` (autre dépôt) | CHATBOT | SITE — ne pas modifier (le widget est servi depuis GitHub Pages) |
| `blog-eperformance/_build/compose.py`, `scripts/` | SITE | CHATBOT (sauf l'étape d'index C7/C8) |
| `blog-eperformance/chatbot-index.json` | CHATBOT (généré) | SITE — ne pas éditer à la main |
| `toolkit_eperformance/**` (autre dépôt) | SOCIAL | SITE et CHATBOT — ne pas modifier |
| `blog-eperformance/chatbot-index.json`, `rss.xml`, `articles/<slug>/index.html` | SITE / CHATBOT (selon le cas) | **SOCIAL** — lecture seule (C7, C11) |

### Si une tâche exige de toucher le périmètre de l'autre

1. **Ne pas le faire silencieusement.**
2. Écrire une entrée dans le journal avec `⚠️ DEMANDE` : quoi, pourquoi, quel fichier, quel impact.
3. Faire la modification **la plus petite possible** et la signaler dans l'entrée `Effet sur l'autre agent`.
4. Ne jamais supprimer un contrat gelé : le modifier en accord avec l'autre agent.

---

## 5. SUIVI DE LECTURE

| Agent | Dernière lecture | Version lue (commit) |
|---|---|---|
| CHATBOT | 2026-09-18 20:30 (fin des tâches 6.5 et 6.8) | `aed7125` (backend) · lecture de `site-eperformance@03b1d1f` |
| SITE | 2026-09-18 20:48 (nettoyage `merci-ebook` + contrat C11) | lecture de `site-eperformance@95c1fc6` · écrit sous `514648f` |
| SOCIAL | 2026-09-18 20:48 (ouverture du chantier toolkit) | lecture de `site-eperformance@95c1fc6` · contrat C11 accepté · §2.3 créée |

---

## 6. CONTRÔLE AUTOMATIQUE (rappel)

```bash
python3 scripts/verifier-chatbot.py    # site : attendu 16/16
python3 -c "print('blog')" && cd ../blog-eperformance && python3 scripts/verifier-chatbot.py   # blog : attendu 88/88
```

Ce contrôle tourne **en CI à chaque push** : s'il échoue, le déploiement est signalé. Ne le contourne jamais — c'est lui qui a détecté (et empêchera) la disparition du chatbot.

---

*Créé le 18 septembre 2026 après l'incident de disparition du chatbot. Document vivant : à enrichir par les deux agents.*
*Copie dans le dossier de travail de l'agent SITE : `/home/ballo/Google ads projets/site eperformance/COORDINATION-AGENTS.md` (la version canonique est celle de ce dépôt).*
