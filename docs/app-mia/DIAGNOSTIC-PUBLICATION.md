# DIAGNOSTIC PUBLICATION — app Mia

**Date** : 24 septembre 2026 · **Agent** : SITE · **Commandé par** : le constat de Ballo — « le bouton Installer sur mia.eperformance.pro ne déclenche rien ».

---

## 1. Pourquoi rien ne s'installait (chantier 1.1)

**L'app de gestion n'avait jamais été construite.** Tout le reste existait : le backend (B1-B4, puis le Lot Phase 4 E/F/G — 438 tests, déployé sur Railway), le contrat `API-CLIENT-V1.md` (20 routes client), la conception (`CONCEPTION-APP.md`, stack Preact tranchée), la maquette validée par Ballo. **La maquette est une démonstration statique — ce n'est pas l'application.** Aucun build n'existait, donc rien à déployer.

## 2. Le bouton Installer, mesuré en production (chantier 1.2)

La LP servie sur `mia.eperformance.pro` (déployée par CHATBOT le 24/09, commit `e934a20` — c'est bien ma dernière version, finitions du 20/09 incluses) :

| Mesure | Résultat |
|---|---|
| Manifeste PWA (`/manifest.json`, `/mia-manifest.webmanifest`…) | **404 — aucun** |
| Service worker | **aucun** (ni fichier, ni enregistrement) |
| `<link rel="manifest">` dans le HTML | **absent** |
| Les 5 boutons « Installer » / « Gérez-la » | `href="#app"` — ancre interne, par conception (`URL_APPLICATION = null`, transition documentée au §8) |

Le bouton ne déclenchait donc rien **parce qu'il n'y avait rien à installer** — ni app, ni manifeste, ni worker. C'était le comportement prévu de la transition, pas une panne.

## 3. Ce qui manquait (chantier 1.3) — et ce qui est livré

| Manque | Statut |
|---|---|
| **L'application elle-même** | ✅ **v1 construite et servie** (voir §4) |
| **Manifeste PWA dédié** (le manifeste du widget installe le produit visiteur — piège relevé par le reviseur adverse) | ✅ `/app/manifest.webmanifest` — `start_url: /app/`, standalone |
| **Service worker** (coquille pré-cachée, API jamais cachée) | ✅ `/app/sw.js` — enregistré, vérifié sur le domaine réel |
| **`URL_APPLICATION` renseignée** | ✅ `/app/` — tous les CTA d'installation et « Gérez-la » ouvrent l'app |

## 4. L'app v1 livrée — `/app/` sur mia.eperformance.pro

**Stack** : Preact 10 + hooks + htm **vendorisés** (15,6 Ko — zéro CDN au runtime), jetons N1 du noyau, zéro hexadécimal hors primitives, zéro emoji. Commits `4017f77` + `48019e3` + `6fa36ed` dans `eperformance-mia`.

**Écrans v1** : connexion (**login + branche 2FA `2fa_requise` + changement forcé du mot de passe temporaire**, contrat §2.3 dans l'ordre) · accueil (KPI 7 jours, dernières conversations) · conversations (filtres non lues/escaladées/avec lead) · détail + **répondre (prend la main)** + **prendre/rendre la main** · notifications (tout marquer lu, pastille) · compte (plan via `/plans`, **consentement RGPD aux statistiques d'usage**, déconnexion).

**Tracking local-first** : `event_id` UUID, file persistée, batch au retour réseau, le consentement est une porte (`consent` trace toujours le choix).

## 5. Preuves en production (chantier 4.1)

| Preuve | Résultat |
|---|---|
| `https://mia.eperformance.pro/app/` | **200** |
| `/app/manifest.webmanifest`, `/app/sw.js`, vendor | **200** |
| Service worker | **enregistré**, scope `/app/` |
| Garde-fou CI de CHATBOT | **PASS** (après correction SEO : canonical + og ajoutés — le contrôle exige le référencement du domaine) |
| API depuis l'origine (curl, `Origin: https://mia.eperformance.pro`) | **401 + `access-control-allow-origin`** — le contrat CORS est prouvé au niveau HTTP |
| **Écart non résolu** | `GET /me` depuis la page du navigateur de test échoue (`Failed to fetch`) **sur toutes les réponses 401** : elles portent `www-authenticate: Bearer` (vérifié par curl) — les WebView font échouer le `fetch` sur un défi d'authentification ; le vrai Chrome le résout. **À confirmer au premier provisionnement sur Chrome/Android réel.** Aucun compte client n'existe encore (base vierge) — le login complet reste à prouver sur un compte réel. |

## 6. La cohérence Lot Phase 4 (chantier 3) — l'honnêteté d'abord

| Chantier | État dans l'app v1 |
|---|---|
| C (bugs chatbot) | **sans objet côté app** — ce sont des défauts du widget visiteur |
| D (liens directs) | les liens apparaissent dans le `content` des messages (le backend les compose) — rendus tels quels en v1 |
| E (base = site) | le propriétaire voit les **sources** (« Pour aller plus loin » : pages site + articles blog) dans les messages — le champ `blog_sources` existe au contrat |
| F (Entraînement) | **NON EXPOSÉ : les routes `connaissances` sont ADMIN uniquement** — il manque des routes client au contrat (à CHATBOT). L'écran suivra dès que le contrat l'expose |
| G (instructions sectorielles) | **NON EXPOSÉ : même situation** — le secteur s'affiche (accueil), la gestion des instructions attend le contrat client |
| Premium/tracking/canaux | plan lu via `/plans` ; tracking câblé ; la matrice 3×5 reste à l'écran Réglages de la v1.1 |

**v1.1 documentée** : compétences (écran 8), horaires (écran 9), cache hors-ligne **chiffré**, Entraînement et instructions (dès routes client), matrice de notifications complète, upgrade premium (feuille + `/subscribe`).

## 7. Vérifications restantes (chantier 2.2-2.3) — non établies ici

- Installation réelle sur **Android Chrome / iOS Safari / desktop** : les critères PWA sont remplis (manifeste servi, SW enregistré, HTTPS) — le prompt apparaît à l'engagement ; **aucun appareil physique n'était disponible** pour la preuve.
- Connexion de bout en bout : **aucun compte client n'est provisionné** (base vierge, livrée ainsi) — le flux complet login → 2FA → changement forcé → données se prouvera au premier provisionnement réel.
