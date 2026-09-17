# Audit du tracking existant — ePerformance

Relevé fait le 17 septembre 2026 sur le dépôt `site-eperformance`, branche `main`
(commit `3121a5e`), vérifié contre la production `eperformance.pro`.

Ce document ne propose rien. Il constate. Les décisions sont dans
`infrastructure-mesure.md`.

---

## 1. Ce qui existe et fonctionne

### Consentement

`assets/js/consent.js` — mécanisme complet, et c'est le point fort de
l'installation actuelle.

| Élément | État |
|---|---|
| Trois catégories | `necessary` (thème, préférences) · `analytics` (GA4 + Clarity) · `ads` (Meta Pixel) |
| Chargement des traceurs | Uniquement après choix explicite. Aucun traceur n'est injecté avant. |
| Refus | État complet et légitime : rien ne se charge, le choix est mémorisé |
| Personnalisation | Panneau de détail, deux cases à cocher indépendantes |
| Mémorisation | `localStorage` clé `eperf-consent`, versionnée (`VERSION = 1`) |
| Réouverture | `window.eperfConsent.open()` — branché sur la page cookies |
| Accessibilité | Échap ferme le panneau, focus déplacé sur le premier contrôle |

Vérifié en production : la page d'accueil livrée ne contient ni `G-`, ni `gtag`,
ni `fbq`. Le code des traceurs n'est présent qu'après consentement. C'est le
comportement voulu, et il est correctement implémenté.

### Identifiants de mesure

| Outil | Identifiant | Emplacement |
|---|---|---|
| Google Analytics 4 | `G-Z7QW8BCYQ1` | `consent.js:32` |
| Microsoft Clarity | `w2e89n0biv` | `consent.js:33` |
| Meta Pixel | `1592627695615531` | `consent.js:34` |

GA4 est configuré avec `anonymize_ip: true`. Clarity enregistre les sessions
(heatmaps et replays) : c'est une donnée de comportement, pas une mesure
d'audience — à garder en tête pour la conformité.

### Formulaires

Trois pages portent un formulaire : `formation.html`, `site-web.html`,
`diagnostic_eperformance.html`.

Le diagnostic est le plus élaboré : **cinq étapes** (Identification, Chiffres
clés, Acquisition, Détails du secteur, Objectifs), une trentaine de champs, dont
le chiffre d'affaires, le panier moyen, la marge, le budget publicitaire et les
sources d'acquisition. Il poste en JSON vers un backend Railway :

```
POST https://web-production-4ab53.up.railway.app/api/diagnostic/submit
```

Backend vérifié opérationnel le 17 septembre 2026 : `ePerformance API Flow
v1.0.0`, statut `operational`, commit `d6d1d90799`.

C'est une pièce d'information commerciale de grande valeur — un diagnostic
qualifié, pas un simple formulaire de contact.

### Appels à l'action

| CTA | Occurrences dans le HTML |
|---|---|
| Liens WhatsApp (`api.whatsapp.com`, `wa.me`) | 115 |
| Liens vers le diagnostic | 121 |

---

## 2. Ce qui manque

### Aucun événement n'est mesuré

`assets/js/eperf.js` ne contient **aucun** appel à `gtag`, `fbq` ou `dataLayer`.
Recherche exhaustive : zéro occurrence.

Conséquence directe : les 115 clics WhatsApp et les 121 liens vers le diagnostic
ne produisent aucun signal. GA4 enregistre des pages vues, Clarity enregistre
des sessions, et rien d'autre. On sait combien de personnes sont venues, pas ce
qu'elles ont fait.

### Aucun Consent Mode v2

Aucun `gtag('consent', 'default', …)` nulle part. Les traceurs sont chargés ou
ne le sont pas, sans état intermédiaire.

Conséquence : un visiteur qui refuse le consentement est **totalement invisible**
pour Google. Pas de modélisation, pas de conversion estimée, rien. Sur un site
où le bandeau est affiché à chaque première visite, c'est une perte sèche qui
peut atteindre la moitié des visiteurs.

### Aucune conversion Google Ads

Aucun identifiant `AW-` dans le code. Aucune balise de conversion, aucun suivi
de conversion améliorée. Le compte Google Ads n'existe pas encore — c'est
attendu — mais rien n'est prêt à le recevoir.

### Aucune conversion côté serveur

Le Meta Pixel est chargé côté navigateur uniquement. Pas d'API de conversions
(CAPI). Le backend Railway reçoit les soumissions du diagnostic : il a donc
l'information, mais rien ne la transmet à Meta. En 2026, avec les restrictions
de suivi navigateur, un pixel seul perd une part importante des conversions.

### Aucun lien entre les outils

GA4, Clarity et le Pixel sont chargés par le même fichier mais ne se parlent
pas. Aucun événement GA4 n'est marqué comme conversion. Aucune audience n'est
construite. Le remarketing n'est pas possible aujourd'hui, faute de liste.

### Aucun suivi des campagnes

Aucun paramètre UTM n'est lu ni transmis. Impossible aujourd'hui de savoir d'où
vient une soumission de diagnostic.

---

## 3. Le problème de fond

**Le site ne peut pas alimenter une campagne publicitaire en l'état.**

Une campagne a besoin de deux choses : une cible à optimiser, et un retour sur
ce qu'elle a produit. Ici, les deux manquent.

- **Pas de cible** : sans événement de conversion, Google et Meta n'ont aucun
  signal à optimiser. Ils optimiseront vers ce qu'on leur donne — des clics ou
  des vues — sans jamais savoir si ces clics ont produit un diagnostic.
- **Pas de retour** : à la fin du mois, on saura combien on a dépensé et combien
  de visiteurs sont venus. On ne saura pas combien de diagnostics ont été
  remplis, ni lesquels venaient de la publicité.

C'est la raison pour laquelle la Phase 1 est un préalable, pas une formalité.
Dépenser 200 000 FCFA (350 USD) par mois sans mesure revient à acheter du trafic qu'on ne
peut ni juger ni améliorer.

---

## 4. Ce que la Phase 1 doit corriger, par ordre d'urgence

| Priorité | Chantier | Pourquoi d'abord |
|---|---|---|
| 1 | Événements GA4 sur les CTA (clic WhatsApp, clic diagnostic, soumission) | Sans eux, rien n'est mesurable |
| 2 | Conversion Google Ads sur la soumission du diagnostic + Enhanced Conversions | C'est la conversion qui compte pour l'objectif commercial |
| 3 | Consent Mode v2 | Récupère le signal des visiteurs qui refusent, sans les tracer |
| 4 | Meta CAPI depuis le backend Railway | Le diagnostic part du serveur : le signal est fiable |
| 5 | Audiences et remarketing | À construire dès maintenant pour être utilisable dans 30 jours |
| 6 | Liaison GA4 ↔ Google Ads et GA4 ↔ Search Console | Importe les conversions GA4 dans Ads et les requêtes dans GA4 |

L'ordre compte : les événements (1) avant les conversions (2), parce qu'on ne
marque pas comme conversion un événement qui n'existe pas. Les audiences (5)
avant le lancement des campagnes, parce qu'une audience se remplit à partir du
jour où elle est créée — commencer la collecte un mois avant l'achat de trafic
est gratuit et rend le remarketing possible dès la première semaine de campagne.

---

## 5. Ce qui est hors de portée de cet audit

Ces points demandent un accès aux interfaces, que je n'ai pas :

- **État réel de la propriété GA4** : depuis quand collecte-t-elle, quels
  événements automatiques sont actifs, quelle est la fenêtre de conservation des
  données (14 mois par défaut).
- **Search Console** : la propriété est-elle vérifiée, le sitemap du blog est-il
  soumis, quelles requêtes apparaissent. Les données du dossier projet indiquent
  un trafic de marque uniquement — à confirmer dans l'interface.
- **Meta Business Manager** : existe-t-il déjà, le Pixel est-il rattaché à un
  domaine vérifié, un jeu de données est-il configuré.
- **Le backend Railway** : quelles données stocke-t-il exactement, où, pendant
  combien de temps. Ce point compte pour la conformité (Phase 7).

Ces vérifications sont listées dans `infrastructure-mesure.md` comme des
préalables à cocher avant de commencer.
