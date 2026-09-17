# Rapport de phase 2 — Refonte eperformance.pro

**Date :** 17 septembre 2026
**Branche :** `refonte-phase2` (commit `ecdc533`) — **`main` non touchée**, aucun déploiement
**Preview :** `preview/` — 14 pages, testable en local
**Précédent :** `RAPPORT_REFONTE_EPERFORMANCE.md` (phase 1, commit `a788551`)

---

## 0. En une ligne

Les sept priorités du rapport de phase 1 sont traitées. Le preview complet est livré et vérifié dans un navigateur réel : **200/200 paires texte/fond conformes WCAG AA**, LCP entre 312 et 436 ms, aucun traceur chargé avant consentement. **Rien n'est déployé** — la validation locale reste à faire.

---

## 1. Décision d'architecture — ADR-0002

Le brief demandait de reconsidérer librement le choix d'ADR-0001. **Décision : je conserve HTML/CSS statique, sans framework.** Le raisonnement complet est en `docs/adr/ADR-0002-socle-technique-phase2.md`.

Ce qui a changé par rapport à ADR-0001 : j'y laissais une faiblesse non résolue — « pas de composants, en-tête et pied de page dupliqués ». **Le brief a raison de la pointer, et je la corrige maintenant par composition côté génération** (`preview/_build/compose.py`), sans introduire de dépendance à l'exécution ni de workflow de build.

Les quatre faiblesses listées dans le brief, traitées :

| Faiblesse | Traitement |
|---|---|
| 231 Ko de CSS inline à factoriser | Feuille externe unique de 41 Ko — **déjà fait en phase 1** |
| Faible réutilisation entre pages | Composition depuis un layout unique |
| Pas de composants | `compose.py` joue ce rôle, comme `artisan.py` côté générateur |
| Pas d'optimisation d'images | Script ponctuel — **−87 % sur 15 images** |

**Les trois arguments du brief en faveur d'Astro, examinés :**

- *Composants réutilisables* → obtenus par composition, sans framework. L'en-tête passe de 7 variantes divergentes à 1 définition.
- *Build optimisé (tree-shaking, assets, images)* → ne s'applique pas ici. `eperf.css` fait 41 Ko dont 100 % des classes sont utilisées ; il n'y a rien à élaguer. Quatre images à convertir une fois ne justifient pas un pipeline. Le JS total est de 16 Ko en deux fichiers, sans graphe de dépendances à regrouper.
- *Skills Textura pleinement exploitables* → **cet argument s'inverse à la lecture.** `motion-system` impose des animations à ressort via `stack.json → bindings.motion`, bannit les `@keyframes`, et exige un ticker `requestAnimationFrame` partagé plus quatre primitives : 20 à 30 Ko de JavaScript pour animer des révélations. Cela contredit l'objectif « LCP < 1 s, pas de JS inutile » du brief. Et le kit n'est pas câblé sur ce projet : l'inventaire a confirmé l'absence de tout `.claude/stack.json` sous `/home/ballo`, dont l'ensemble des skills et agents Textura dépendent.

**Condition de réexamen** (documentée dans l'ADR) : si `agent-ia-web` migre lui-même vers un framework, ou si le site dépasse ~30 pages, ou s'il a besoin d'interactivité riche côté client — ce qui n'est pas le cas, l'espace client vivant sur `api.eperformance.pro`.

---

## 2. Chantier 1 — Design system sur les 14 pages

**Le plus grand écart entre ce qui était livré et ce qui est visible. Il est comblé.**

| | Avant (phase 1) | Après |
|---|---|---|
| Feuille de style | 231 Ko de CSS inline sur 7 pages, 0,2 % de réutilisation | `eperf.css`, 41 Ko, une seule requête mise en cache |
| En-tête | 7 variantes divergentes | 1 définition dans `compose.py` |
| Pied de page | 4 variantes, un `#050507` en dur | 1 définition |
| Pages | 13 | **14** (2 créées, 1 supprimée : `cookies.html` conservée, `formation/` etc. redirigés) |
| Thème | aucun | clair par défaut, sombre persistant, sans FOUC |
| Polices | 12 fichiers Google, 5 sous-ensembles | **9 fichiers auto-hébergés, latin seul** |

### Vérifications effectuées dans un navigateur réel

**Contrastes — 200/200 paires conformes WCAG AA.** Mesurés sur les couleurs effectivement rendues, sur 14 pages × 2 thèmes, avec la bonne règle de seuil (4,5 pour le texte normal, 3 pour le grand texte). Les trois échecs réels de production sont corrigés par construction : `--muted` sur carte (4,32 → 5,23), blanc sur vert WhatsApp (1,98 → 9,96), bordure de champ de formulaire (1,35 → 3,44).

> *Note de méthode :* une première mesure avait produit un faux positif de 3,37 sur l'accueil. Elle attrapait une transition de thème de 300 ms en cours. La mesure a été refaite sur des pages fraîchement chargées, thème posé avant le premier rendu — c'est la condition réelle d'un visiteur.

**Structure — 12/14 pages sans anomalie**, puis 14/14 après correction de deux titres trop longs. Sur chaque page : exactement 1 `<h1>`, 1 `<header>`, 1 `<nav>`, 1 `<main>`, 1 `<footer>`, 1 bouton de thème. Zéro Font Awesome, zéro image sans `alt`, zéro image sans dimensions.

**Thème — bascule et persistance vérifiées.** `data-theme` change, `aria-pressed` et le libellé suivent, `theme-color` et `color-scheme` aussi, `localStorage` persiste après rechargement, et le logo bascule par thème.

---

## 3. Chantier 2 — Les pages manquantes du positionnement

**`automatisation.html`** — le pilier 03, qui était **absent de tout le contenu** (zéro occurrence de `n8n`, `workflow`, `make.com` dans les deux codebases). Contenu : définition citable, le problème concret, quatre cas d'usage, pourquoi n8n nommément, articulation avec les trois autres piliers, FAQ balisée.

**`ia.html`** — le pilier 02 comme capacité métier, et non plus seulement comme agent conversationnel de vente. Quatre cas d'usage, une section « ce que l'IA ne fera pas » qui renforce la crédibilité, une FAQ balisée.

Les deux pages sont en `Service` + `FAQPage` dont les questions/réponses sont **strictement identiques au texte visible** — Google exige que le contenu balisé soit présent sur la page.

**Aucun prix inventé, aucun résultat promis, aucun témoignage fabriqué.**

---

## 4. Chantier 3 — Conformité

### Consentement cookies — le point le plus grave, vérifié dans les deux sens

| Scénario | Résultat mesuré |
|---|---|
| Aucun choix exprimé | Bandeau visible · **GA4 absent, `fbq` undefined, `clarity` undefined, pas de `dataLayer`** |
| « Tout refuser » | Choix `{analytics:false, ads:false}` persisté · **aucun traceur chargé** |
| « Tout accepter » | Choix persisté · GA4 `G-Z7QW8BCYQ1`, Meta Pixel et Clarity chargés |

Le paramétrage granulaire (nécessaires / mesure / publicité) est accessible via « Paramétrer », et `window.eperfConsent.open()` permet de rouvrir le bandeau — ce que la page cookies et la politique de confidentialité utilisent.

### Documents légaux

| Document | État |
|---|---|
| `mentions-legales.html` | Réécrit — éditeur, directeur de publication, **hébergeur corrigé : GitHub Pages, et non Hostinger** |
| `politique-confidentialite.html` | Réécrit — **Loi ivoirienne n° 2013-450 et ARTCI cités**, RGPD en complément, **9 sous-traitants réels** listés avec leur rôle et leur localisation, durées de conservation chiffrées, section consentement |
| `cookies.html` | Réécrit — les 3 catégories, qui les pose, combien de temps, ce qui est soumis à consentement, et le bouton « Gérer mes cookies » |
| `cgv.html` | **Créé** — commande, prix FCFA, paiement, délais, rétractation cadrée, propriété intellectuelle, responsabilité, droit applicable |

**Formspree retiré** : il était cité comme sous-traitant alors qu'il n'est utilisé nulle part. **Railway, Brevo, Anthropic, Telegram, Clarity, le chatbot, GitHub Pages, Google Analytics et Meta** sont désormais déclarés.

**Marqueurs `[À COMPLÉTER]`** insérés pour les données que je ne peux pas inventer : RCCM, raison sociale, adresse physique, identifiant fiscal, déclaration ARTCI, DPO, lien « Gérer mes cookies ». Chaque page porte un encadré d'avertissement visible. **Un faux numéro RCCM serait pire que pas de numéro.**

### Formulations à risque publicitaire

| Avant | Après |
|---|---|
| « délai garanti de livraison » | « délai indicatif de sept jours ouvrés » |
| « Une IA qui vend à votre place » | « une IA qui répond, qualifie et capte les contacts » |
| « ★★★★★ 4,9/5 basé sur 50+ sites livrés » | **retiré** — aucune source vérifiable, 3 clients seulement sont nommés |
| « 50+ sites livrés » | remplacé par des chiffres vérifiables (9 ans, 7 jours, 3 formules) |
| « remboursement intégral, sans question » | cadré : 7 jours, demande écrite, conditions renvoyées aux CGV |
| « aucun abonnement caché… pour toujours » | « aucun abonnement sur la formule Découverte » |
| « 7 places restantes ce mois-ci » | **retiré** — urgence non vérifiable |
| 3 témoignages anonymes (ebook) | **retirés** — non attribuables |

---

## 5. Chantier 4 — AEO et données structurées

**`llms.txt` créé** (4,4 Ko) — il manquait aux deux codebases. Il décrit l'activité, la méthode des 4 ratios, les pages principales, le blog et les documents légaux, avec une section « notes pour les moteurs de réponse » qui précise que la marque ne publie aucune note agrégée et que les seuls résultats chiffrés sont ceux du cas client Longrich.

**Graphe de données structurées sur chaque page**, entités reliées par `@id` :

```
Organization ──┬── founder → Person (K. Stéphane)
               ├── parentOrganization ← ProfessionalService (address Abidjan, priceRange, paymentAccepted)
               └── publisher ← WebSite ── isPartOf ← WebPage
                                                    └── BreadcrumbList (pages internes)
```

- **`LocalBusiness` → `ProfessionalService`** ajouté sur toutes les pages. Il manquait totalement, malgré un ciblage Abidjan explicite depuis le début.
- **`BreadcrumbList`** ajouté sur toutes les pages internes (absent partout auparavant).
- **`cas-client-mlm.html`** : schema, image OG et Twitter card ajoutés — c'était l'actif de preuve le plus fort du site et le moins bien exploité.
- **`FAQPage`** alignées sur le texte visible sur les 6 pages qui en ont une.
- **La note « 4,9/5 » a été retirée** plutôt que balisée : un `Review` sans source vérifiable est un risque de conformité, pas un argument.

---

## 6. Chantier 5 — Performance des images

| | Avant | Après | Gain |
|---|---|---|---|
| Total des 15 images | 6 600 Ko | **880 Ko** | **−87 %** |
| `longrich-accueil-screenshot` | 1 995 Ko (PNG) | **106 Ko** (WebP) | −95 % |
| `emvie-accueil-screenshot` | 1 667 Ko (PNG) | **72 Ko** (WebP) | −96 % |
| `sw_realisations` | 1 171 Ko (PNG) | 58 Ko | −95 % |
| `IMG_2806` (portrait) | 615 Ko (JPEG) | 102 Ko | −83 % |

**Objectif du brief : gagner ~3,5 Mo. Réalisé : 5,7 Mo.**

Toutes les images portent désormais `width`/`height` explicites (absents sur 100 % des images auparavant — première source de CLS) et `loading="lazy"` hors du premier écran.

---

## 7. Chantier 6 — Sécurité durable

La fermeture de la phase 1 reposait sur un `.gitignore`. Deux mécanismes la rendent structurelle :

**`.githooks/pre-commit`** — refuse `*.pdf`, `*.backup`, `node_modules/`, le code serveur et les secrets. Testé : PDF bloqué, `.backup` bloqué, `server.js` bloqué, fichiers légitimes autorisés. Il a d'ailleurs bloqué un de mes propres commits à cause d'un `__pycache__` oublié.

**`.github/workflows/check-no-leaks.yml`** — scanne les fichiers versionnés à chaque push, et vérifie qu'aucune URL du sitemap ne pointe vers un fichier absent. C'est le vrai filet : le hook local ne protège que la machine sur laquelle il est configuré, alors qu'un commit peut arriver par l'interface web de GitHub.

**Le garde-fou `.nojekyll` a été corrigé.** Ma première version testait si `node_modules` existait *sur le disque* — or il n'y existe plus, donc le test ne déclenchait jamais. Il vérifie maintenant si le dossier serait *versionnable*, ce qui est le vrai risque.

---

## 8. Performance — mesures

| Indicateur | Mesuré | Cible |
|---|---|---|
| **LCP** | **312 à 436 ms** sur 7 pages | < 1 500 ms |
| **CLS** | 0 à 0,011 sur 5 pages · **0,13 sur `ia.html` et `site-web.html`** | < 0,1 |
| Poids de transfert | 880 Ko d'images + 460 Ko de polices + 41 Ko de CSS | — |

### Le CLS dépassait la cible sur deux pages — cause identifiée et corrigée

Mesure des largeurs de texte dans le navigateur, à 64 px :

```
Georgia  1733,78 px  vs  Cormorant Garamond 1306,95 px   →  +32,66 %
Arial    1603,69 px  vs  DM Sans            1480,33 px   →   +8,33 %
```

**Le titre passait de 3 à 4 lignes pendant le swap de police, puis revenait à 3.** Le cache chaud masquait le problème : la mesure repassait à 0 dès la seconde visite. C'est un défaut de **première visite** — celle de chaque nouveau visiteur.

J'ai d'abord tenté un `size-adjust` sur le repli local. **Ça n'a pas fonctionné** : le repli réellement résolu par le navigateur n'était pas Georgia mais Liberation Serif, donc l'ajustement calculé était faux. Le contrôle l'a montré — l'écart passait de 32,66 % à 8,56 % au lieu de 0.

**Correction retenue : l'auto-hébergement des polices.** 9 fichiers woff2 (431 Ko) dans `assets/fonts/`, **sous-ensemble latin uniquement** — il couvre tout le français, accents compris ; les sous-ensembles cyrillique et vietnamien étaient téléchargés pour rien à chaque visite. Les deux graisses du premier écran sont préchargées.

Trois bénéfices : le CLS de swap disparaît (les polices arrivent avec le CSS), le LCP ne dépend plus d'une connexion tierce, et **le navigateur du visiteur ne contacte plus Google** pour afficher la page.

> **À valider sur votre machine :** le CLS et le LCP après purge du cache. Je ne peux pas reproduire une première visite dans cet environnement une fois les polices en cache. C'est le seul point de ce rapport que je n'ai pas pu mesurer à froid de façon fiable.

---

## 9. Ce qui n'est pas fait

| # | Point | Pourquoi |
|---|---|---|
| 1 | **Le pied de page ne renvoie pas vers `/automatisation.html`** depuis la colonne « Services » | Il y figure ; à vérifier visuellement |
| 2 | **Migrer le blog sur la même feuille** | Le brief phase 2 ne le demandait pas dans ce lot ; le blog a déjà une feuille externe propre (19,6 Ko) |
| 3 | **Traduire le pack de formation en CGV définitive** | Dépend de la décision commerciale ci-dessous |
| 4 | **`/acquisition.html`** | Le pilier 01 renvoie vers l'ancre `#programmes` de l'accueil. Une page dédiée serait cohérente avec les trois autres piliers |
| 5 | **Identifiant Google Ads (`AW-`)** | Absent des deux codebases. Le brief ne le demandait pas, mais le projet s'appelle « Google ads » |

---

## 10. Décisions qui vous appartiennent

1. **Le prix du pack de formation.** J'ai fixé 25 000 FCFA, la somme des deux formations (10 000 + 15 000), en remplaçant « Économisez 50 000 FCFA » par la décomposition honnête du prix. L'ancien affichage — 150 000 « au lieu de 200 000 » — facturait le pack **six fois la somme de ses parties**. Si une remise est voulue, il faut la fixer : je n'ai volontairement inventé aucun tarif.

2. **La note « 4,9/5 ».** Retirée faute de source vérifiable. Si vous la rétablissez, il faut publier le nombre d'avis et leur origine.

3. **Le domaine `.ci`.** `cas-client-mlm.html` proposait un choix `.ci` ou `.com` alors que `site-web.html` s'engage sur `.com`. J'ai harmonisé sur `.com`. À confirmer.

4. **Les `[À COMPLÉTER]` légaux.** Six informations manquent dans les mentions légales, la politique de confidentialité et les CGV. **Ne pas mettre ces pages en ligne avant de les avoir renseignées.**

5. **« 9 ans » ou « depuis 2017 ».** Le site affichait « depuis 2017 » et « 8 ans » côte à côte. J'ai harmonisé sur 9 ans (2026 − 2017). Arbitraire si votre activité a démarré fin 2017.

---

## 11. Comment tester le preview

```bash
cd /home/ballo/OX6A/site-eperformance
python3 -m http.server 8010
```

> Le port 8000 est occupé chez vous par l'API « ePerformance API Flow ». D'où 8010.

**URLs à visiter :**

| Page | URL |
|---|---|
| Accueil | http://localhost:8010/preview/ |
| Automatisation (nouveau) | http://localhost:8010/preview/automatisation.html |
| IA générative (nouveau) | http://localhost:8010/preview/ia.html |
| Création de site web | http://localhost:8010/preview/site-web.html |
| Diagnostic | http://localhost:8010/preview/diagnostic_eperformance.html |
| CGV (nouveau) | http://localhost:8010/preview/cgv.html |
| Politique de confidentialité | http://localhost:8010/preview/politique-confidentialite.html |
| Cookies | http://localhost:8010/preview/cookies.html |
| Cas client | http://localhost:8010/preview/cas-client-mlm.html |
| 404 | http://localhost:8010/preview/nimportequoi |

### Checklist de validation

**Thème**
- [ ] Cliquer le bouton soleil/lune en haut à droite — le thème bascule
- [ ] Le logo change de couleur en même temps (foncé en clair, clair en sombre)
- [ ] Recharger la page — le thème est conservé
- [ ] Ouvrir une autre page — le thème suit
- [ ] Aucun flash blanc ou noir au chargement

**Consentement cookies**
- [ ] À la première visite, le bandeau apparaît en bas
- [ ] Cliquer « Paramétrer » — le panneau détaillé s'ouvre, « Nécessaires » est verrouillé
- [ ] Cliquer « Tout refuser » — le bandeau se ferme, aucune erreur
- [ ] Vider le stockage du site (DevTools → Application → Clear site data), recharger
- [ ] Cliquer « Tout accepter », puis vérifier dans DevTools → Réseau : les requêtes vers `googletagmanager.com`, `connect.facebook.net` et `clarity.ms` partent bien
- [ ] Refaire le test avec « Tout refuser » : **ces mêmes requêtes ne doivent PAS apparaître**

**Navigation clavier** (sur l'accueil et le diagnostic)
- [ ] Appuyer sur Tab dès le chargement — un lien « Aller au contenu » apparaît
- [ ] Tabuler dans le menu : chaque lien a un contour visible
- [ ] Le bouton de thème est atteignable et activable avec Entrée ou Espace
- [ ] Réduire la fenêtre sous 960 px, ouvrir le menu au clavier, appuyer sur Échap — il se ferme et le focus revient au bouton
- [ ] Sur le diagnostic : tabuler dans les questions à choix, vérifier qu'on entend la question et la réponse

**Contenus**
- [ ] L'accueil présente bien les 4 piliers, dont Automatisation
- [ ] Aucune mention de « 4,9/5 », « 50+ sites livrés », « pas cher », « délai garanti »
- [ ] Les prix partout : 100 000 / 250 000 / 350 000 FCFA pour les sites ; 10 000 / 15 000 / 25 000 pour les formations ; 9 900 / 14 900 / 15 000 pour les ebooks
- [ ] Les mentions légales affichent bien les marqueurs rouges `[À COMPLÉTER]`
- [ ] L'hébergeur cité est GitHub Pages, pas Hostinger

**Mobile** (DevTools → mode responsive, iPhone SE 375 px)
- [ ] Aucun débordement horizontal
- [ ] Le CTA collant « Diagnostic gratuit / WhatsApp » reste lisible
- [ ] Le bandeau cookies ne masque pas le CTA collant
- [ ] Les cartes s'empilent proprement

**Performance** (DevTools → Lighthouse, mode mobile, cache désactivé)
- [ ] LCP < 1,5 s
- [ ] CLS < 0,1
- [ ] Les polices servies depuis `localhost:8010/preview/assets/fonts/`, aucune requête vers Google

### Après validation

```bash
cd /home/ballo/OX6A/site-eperformance
git checkout main
git merge refonte-phase2
```

Puis suivre la section « Déployer la refonte » du `README.md` — elle copie `preview/` vers la racine et vérifie qu'aucune ressource ne manque avant de committer.

**Retour arrière :** `main` est intacte au commit `a788551`. Le travail est isolé sur `refonte-phase2`. Un `git checkout main` suffit à revenir à l'état de la phase 1.

---

## 12. Annexe — méthode de vérification

| Contrôle | Outil | Résultat |
|---|---|---|
| Contrastes | Calcul WCAG 2.x + re-mesure navigateur sur couleurs rendues | 200/200 conformes |
| Structure HTML | `html.parser` sur 14 pages | 0 balise non fermée |
| JSON-LD | `json.loads` sur tous les blocs | tous valides |
| JavaScript | `node --check` sur les blocs inline | valide |
| Thème, consentement, logo | Navigateur réel (IAB) | bascule, persistance, ARIA, blocage des traceurs |
| Titres et descriptions | Mesure après décodage des entités HTML | 14/14 sous les limites |
| LCP, CLS | `PerformanceObserver` | LCP conforme ; CLS corrigé, à revalider à froid |
| Hook pre-commit | 5 cas de test | 4 bloqués, 1 autorisé avec avertissement |
| Sécurité du push | `git fetch` + inspection du diff distant | branche isolée, `main` intacte |

**Trois erreurs commises et corrigées en cours de route**, documentées parce qu'elles sont instructives :

1. **Un faux positif de contraste** (3,37 sur l'accueil) dû à une mesure prise pendant une transition de thème.
2. **Un `size-adjust` calculé sur la mauvaise police de repli** — le navigateur résolvait Liberation Serif et non Georgia, donc l'ajustement était faux. Détecté parce que j'ai vérifié l'effet au lieu de supposer qu'il fonctionnait.
3. **Un garde-fou `.nojekyll` qui ne testait pas la bonne condition** — la présence sur disque au lieu de la versionnabilité.
