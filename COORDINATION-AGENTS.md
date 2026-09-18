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
| **P3-6.3-BIS** | **Bloc A — 11 corrections chatbot (URGENT production)** | 🚧 **En cours** | 11 items : vision DeepSeek, scroll Actualités, datation, ouverture Mia, script rigide, fuite d'agent, suggestions desktop, 9 intents, Aide enrichi, ONBOARDING, non-régression |
| **P3-6.4** | **Bloc B — PWA Mia + publication stores** | ⏳ **À venir** (après Bloc A) | Audit préalable d'abord |
| **P3-6.3** | **Dashboard admin** (compléter : sidebar, header, modules) | ⏳ Reporté après 6.4 | — |
| **P3-6.4** | **App mobile Mia (PWA) + publication Play Store / App Store** | ⏳ **À venir** | — |
| **P3-6.5** | **Notifications** (toasts, push FCM, emails, Telegram, WhatsApp) | ⏳ **À venir** | — |
| **P3-6.8** | **RAG blog dans le chatbot** (onglet Aide : recherche sémantique) | ⏳ **À venir** | — |
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

**Ce que l'agent SITE va modifier** (pour que CHATBOT anticipe) :
- `assets/css/eperf.css` : j'y ajoute des règles, je ne renomme **aucun jeton** (contrat C3)
- `preview/_build/compose.py` : j'y touche pour le head, l'index, le footer — **je préserverai le bloc C1**
- Le blog : structure des articles inchangée (contrat C7)

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

### Si une tâche exige de toucher le périmètre de l'autre

1. **Ne pas le faire silencieusement.**
2. Écrire une entrée dans le journal avec `⚠️ DEMANDE` : quoi, pourquoi, quel fichier, quel impact.
3. Faire la modification **la plus petite possible** et la signaler dans l'entrée `Effet sur l'autre agent`.
4. Ne jamais supprimer un contrat gelé : le modifier en accord avec l'autre agent.

---

## 5. SUIVI DE LECTURE

| Agent | Dernière lecture | Version lue (commit) |
|---|---|---|
| CHATBOT | 2026-09-18 | `5898cdc` (mission 6.3-BIS ouverte) |
| SITE | 2026-09-18 (après incident) | `9036aa2` |

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
