# EVOLUTIVITÉ UI — app Mia

**Date** : 19 septembre 2026 · **Agent** : SITE · **Statut** : note de référence, aucune implémentation prématurée.

**Base validée par Ballo** : la maquette exécutable (`maquettes/app-mia.html` — identité, hiérarchie, wow moment, clair/sombre). **Tout ce qui suit étend ce socle sans le casser.**

Le principe unique qui gouverne les trois extensions (premium, canaux, tracking) :

> **L'interface ne connaît aucune liste.** Elle rend ce que le backend lui dit : `/me` pour les plans, `/settings` + `/me` pour les canaux, le tuple backend pour les types d'événements. Ajouter une fonctionnalité, un canal ou un événement côté serveur = zéro changement de rendu côté app.

La maquette démontre déjà ce principe : ses verrous premium, sa matrice 3×5 et son flux d'upgrade sont **générés depuis un objet de données** (`REPONSE_ME`) qui simule la réponse `/me` — le jour où l'app réelle consomme l'API, seul cet objet change.

---

## 1. Ajouter un écran premium quand un nouveau flag apparaît dans `/me`

**Source de vérité** : `GET /api/client/v1/me` → `plan`, `fonctionnalites_actives[]`, `fonctionnalites_verrouillees[]` (chacune avec `plan_requis` et `raison`). **`GET /plans`** pour le catalogue et les avantages.

Le rendu est déclaratif, trois règles :

1. **Actif** → la fonctionnalité apparaît à sa place fonctionnelle (écran dédié, ou action dans un écran existant). **Verrouillée** → la ligne apparaît à la place qu'elle occuperait, avec l'icône cadenas et le badge `plan_requis` — **visible mais inactive**, jamais masquée ni grisée à l'excès (le contraste reste AA).
2. **Au tap d'un verrou** → la feuille d'upgrade (`modale-upgrade` de la maquette) : titre = plan requis, raison = champ `raison` du backend, avantages = liste du plan dans `/plans`. **Aucun texte d'upgrade écrit en dur** : tout vient des données.
3. **`POST /subscribe`** → la branche affichée suit **la réponse** : `non_configure` → message honnête « Disponible prochainement, intérêt enregistré » (état actuel, prouvé en capture) ; `en_attente_paiement` → flux de paiement avec `reference_fournisseur`. `502` → intention enregistrée côté serveur, l'app le dit sans dramatiser.

**Points d'extension** (dans la future app Preact) : `lib/gating.ts` expose un seul hook `useFonctionnalites()` alimenté par `/me` ; un composant `<LigneFonctionnalite f={…} onVerrou={…}>` unique rend actif et verrouillé ; la feuille d'upgrade est un composant unique alimenté par `/plans`. **Aucun écran ne teste le plan lui-même** — il teste l'appartenance à `fonctionnalites_actives`, et c'est tout.

**Interdits** : écrire « Free/Premium/Pro » dans un composant de rendu ; décider côté app de ce que le plan autorise ; afficher un flux de paiement quand le backend répond `non_configure` (règle C2 : ne jamais vendre ce qui n'est pas branché).

---

## 2. Ajouter un canal dans la matrice de notifications

La matrice est **déclarative sur deux axes** : les types (`nouveau_lead`, `escalade`, `nouveau_visiteur` — le backend refuse un type inconnu en 422) et les canaux (`push`, `email`, `telegram`, `whatsapp`, `rcs`).

**Le rendu lit deux objets** : `notification_settings` (réglages par type × canal, depuis `GET /settings`) et `etat_canaux` (depuis `/me` ou `/settings` — l'état réel de configuration de chaque canal). Un canal vaut `actif` ou `non configuré`.

**Pour ajouter un canal** (exemple : `sms`) :

1. le backend déclare son état dans `etat_canaux` — **c'est le seul changement** ;
2. la matrice ajoute automatiquement la colonne : si l'état vaut `non configuré`, la cellule affiche cadenas + « bientôt » et **l'app n'émet aucun appel réseau pour ce canal** (comportement prouvé dans la maquette pour WhatsApp et RCS) ;
3. si l'état passe à `actif`, les interrupteurs de la colonne deviennent opérants et écrivent dans `notification_settings` via `PUT /settings` — les réglages que l'utilisateur avait pu imaginer sont conservés (la maquette affiche cette promesse sous la matrice).

**Points d'extension** : `lib/canaux.ts` décrit la **présentation** de chaque canal (icône, libellé, accessibilité — jamais l'état) ; la matrice est un composant `<MatriceNotifications settings etatCanaux />` qui n'a aucune colonne en dur ; l'infobulle « Disponible prochainement » est la représentation de `etat_canaux[canal] !== 'actif'`, pas une décision d'écran.

**Interdits** : coder la liste des canaux dans la matrice ; émettre un appel vers un canal non `actif` ; masquer une colonne (elle se voit inactive, c'est une information).

---

## 3. Ajouter un événement de tracking côté app

**Contrat backend** (`API-CLIENT-V1.md` §17) : `POST /api/client/v1/analytics/event`, batch de 1 à 500, chaque événement porte un `event_id` UUID **produit par l'app** (déduplication serveur — un rejeu après retour du réseau est ignoré en silence), `date_evenement` horodatée **côté client**, `metadata` bornée à 4 Ko **sans aucune donnée personnelle du visiteur final**. Type inconnu → 422 en nommant la liste acceptée : l'app sait immédiatement qu'elle est en avance sur le backend, et dégrade sans perdre l'événement.

**Le client de tracking est un module unique** (`lib/tracking.ts` dans la future app), avec quatre fonctions et aucune dépendance d'écran :

| Fonction | Rôle |
|---|---|
| `suivi(type, metadata?)` | pousser un événement dans la file locale (IndexedDB) avec son `event_id` |
| `envoyerBatch()` | vider la file vers `/analytics/event` — 1 à 500 ; sur échec, **rien n'est perdu**, la file rejoue |
| `definirConsentement(bool)` | écrire le choix (persistance locale) ; `false` bloque l'envoi **sauf** `consent` lui-même |
| `genererInstallation()` | `installation_id` stable, créé au premier lancement, envoyé avec l'événement `install` |

**Les 9 types du contrat** sont déjà câblés dans la maquette pour la démonstration (`install`, `app_open`, `session_start/end`, `screen_view`, `feature_use`, `notification_open`, `upgrade_intent`, `consent`). **Pour en ajouter un** : le backend l'ajoute à son tuple (une ligne, cf. `EXTENSIBILITE.md §3`), l'app appelle `suivi('nouveau_type', …)` — le module ne valide pas la liste des types (c'est le serveur qui répond 422 et nomme les siens).

**Le consentement est une porte, pas un filtre dispersé** : sans accord, `suivi()` n'enrichit même pas la file (sauf `consent`, qui trace le choix) ; avec accord, la file part en batch au retour du réseau. L'interrupteur « Statistiques d'usage » (Réglages → Compte) est le seul point d'entrée du choix, et il affiche l'état réel de la file.

**Interdits** : envoyer du contenu de conversation (le tracking décrit l'usage de l'app, jamais les visiteurs) ; valider côté client la liste des types ; envoyer sans consentement autre chose que l'événement `consent`.

---

## 4. Carte des points d'extension de l'app

```
app/
├── lib/
│   ├── jetons.css            ← import du noyau (N1). JAMAIS de valeur en dur.
│   ├── api.ts                ← client HTTP unique : base, jeton, 404-isolation,
│   │                            403-verrou (corps plat → déclenche la feuille
│   │                            d'upgrade), 429 (relance temporisée)
│   ├── gating.ts             ← useFonctionnalites() : /me → actifs, verrous, plan
│   ├── canaux.ts             ← présentation déclarative des canaux (icône,
│   │                            libellé). L'ÉTAT vient du serveur, pas d'ici.
│   ├── tracking.ts           ← suivi / envoyerBatch / consentement / installation
│   └── i18n.ts               ← chaînes externalisées dès la v1 (report i18n EN)
├── composants/
│   ├── LigneFonctionnalite   ← rend actif OU verrouillé, depuis les données
│   ├── FeuilleUpgrade        ← unique, alimentée par /plans + réponse /subscribe
│   ├── MatriceNotifications  ← types × canaux, zéro colonne en dur
│   └── EtatVide/Squelette/…  ← les quatre états obligatoires, transverses
└── ecrans/                   ← 14 écrans ; aucun ne connaît le plan ni les
                                canaux : il consomme les lib ci-dessus
```

**La règle qui tient tout** : un écran répond à « qu'est-ce que j'affiche avec ces données ? » ; les lib répondent à « quelles sont les données ? » ; le serveur répond à « ce qui est permis et branché ». Quand une question change de niveau, c'est un défaut d'architecture — à signaler au journal, pas à contourner.
