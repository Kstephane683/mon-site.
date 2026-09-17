# Préparation des comptes — Phase 2

Objectif : **être prêt à lancer**, pas lancer. Le déclenchement dépend d'une
réécriture des prix et d'offres spéciales, prévue dans deux à trois mois.

Ce document est une procédure. Chaque section dit quoi faire, dans quel ordre,
et ce qui peut attendre. Rien ici n'est urgent ; tout ici évite de perdre une
semaine au moment où ça le deviendra.

Les décisions de conception sont dans `infrastructure-mesure.md`. Ce document
les met en œuvre.

**Deux conventions de lecture :**
- 🔴 = bloquant pour le lancement, à ne pas oublier
- ⏳ = peut attendre le mois du lancement

---

## A. Google Analytics 4

### A.1 Les sept vérifications à faire

Je n'ai pas d'accès à l'interface : pas de captures possibles. Voici les chemins
exacts, à parcourir dans l'ordre.

| # | Où | Quoi regarder | Décision |
|---|---|---|---|
| 1 | Admin > Propriété > **Informations sur la propriété** | L'ID de mesure est-il bien `G-Z7QW8BCYQ1` ? | Si différent, corriger `consent.js:32` |
| 2 | Admin > Propriété > **Conservation des données** | Réglage actuel : 2 ou 14 mois ? | Passer à **14 mois**. Irréversible pour les données déjà expirées. |
| 3 | Admin > Flux de données > **Événements** | Les événements automatiques (scroll, clic sortant, recherche interne) sont-ils actifs ? | Les laisser actifs, ils ne coûtent rien |
| 4 | Rapports > Engagement > **Événements** | Y a-t-il des événements autres que `page_view`, `scroll`, `session_start` ? | Note ce qui existe déjà pour ne pas créer de doublon |
| 5 | Admin > Propriété > **Attribution** | Modèle et fenêtre de conversion | Laisser par défaut au départ |
| 6 | Admin > **Liaisons de produits** > Search Console | La propriété Search Console est-elle liée ? | Si non, lier — voir A.4 |
| 7 | Admin > **Liaisons de produits** > Google Ads | Aucune liaison attendue à ce stade | À faire en B.5, après création du compte Ads |

**La vérification 2 est la seule qui soit véritablement urgente.** La
conservation à 14 mois se compte à partir du jour du réglage : les données
collectées avant restent soumises à l'ancien réglage. Chaque semaine d'attente
est une semaine de données qu'on ne pourra plus comparer d'une année sur
l'autre.

### A.2 Les quatre événements

| Nom GA4 | Type | Déclencheur | Paramètres |
|---|---|---|---|
| `generate_lead` | Recommandé | Réponse HTTP correcte du backend Railway | `value`, `currency`, `form_id` |
| `diagnostic_debut` | Personnalisé | Premier champ touché à l'étape 1 | `form_id` |
| `clic_whatsapp` | Personnalisé | Clic sur `wa.me` ou `api.whatsapp.com` | `lien_origine`, `page` |
| `clic_contact` | Personnalisé | Clic sur `mailto:` ou `tel:` | `type` |

**Marquer `generate_lead` comme conversion** : Admin > Événements > basculer
« Marquer comme conversion ». Les trois autres restent des événements
d'observation — ils informent, ils n'optimisent pas.

Le code est en section E.1.

### A.3 Les cinq audiences

À créer dans Admin > Audiences. **Créer une audience ne collecte rien
rétroactivement** : elle se remplit à partir du jour de sa création. C'est le
seul argument pour les créer tôt, et il est bon.

| Nom | Condition | Durée | Usage |
|---|---|---|---|
| `Tous visiteurs 90j` | Tous les utilisateurs | 90 j | Socle de remarketing |
| `Diagnostic sans envoi` | Vu `/diagnostic_eperformance.html` ET pas `generate_lead` | 90 j | **La plus rentable** |
| `WhatsApp sans diagnostic` | `clic_whatsapp` ET pas `generate_lead` | 90 j | A contacté sans remplir |
| `Soumissionneurs` | `generate_lead` | 540 j | À exclure des campagnes |
| `Lecteurs blog` | 3 pages vues ou plus ET page commençant par `/articles/` | 90 j | Audience tiède |

Deux points d'attention. La condition « ET pas » se construit avec « Exclure »
dans l'interface GA4, pas dans une seule condition — c'est le piège classique
qui produit une audience vide. Et la durée « 540 j » pour les soumissionneurs
est volontairement longue : on veut exclure un ancien prospect des campagnes
pendant longtemps, pas l'oublier au bout de trois mois.

### A.4 Liaisons

**GA4 ↔ Search Console** (à faire maintenant, sans dépendance)
Admin > Liaisons de produits > Search Console > Lier. Nécessite un accès
propriétaire sur les deux. Fait remonter les requêtes de recherche dans GA4 :
on cesse d'ouvrir deux outils séparés.

**GA4 ↔ Google Ads** (après création du compte Ads)
Admin > Liaisons de produits > Google Ads > Lier > activer
« Personnalisation des annonces ». Permet l'import des conversions et le
partage des audiences. Voir B.5.

### A.5 Consent Mode v2 — configuration prête

Déjà conçu en Phase 1. Rappel de la décision : **activé**, avec une page cookies
qui explique qu'une requête anonyme part vers Google avant le choix.

Ce que ça implique techniquement : `gtag.js` se charge pour tous les visiteurs,
avec les quatre signaux en `denied`. Le code est en E.3.

⏳ **L'exécution peut attendre.** Le Consent Mode n'a d'intérêt que si Google
Ads existe pour recevoir la modélisation. L'implémenter avant la création du
compte Ads ne perd rien, mais ne gagne rien non plus — sauf l'historique de
modélisation, qui s'améliore avec le temps. À faire dans le même chantier que
les événements, c'est le même fichier.

---

## B. Google Ads

### B.1 Création du compte — trois réglages irréversibles

🔴 Ces trois paramètres se fixent à la création et **ne se modifient plus
jamais**. Une erreur impose de recréer le compte et de perdre l'historique.

| Réglage | Valeur | Pourquoi |
|---|---|---|
| **Devise** | **USD** (dollar américain) | La devise est définitive et ne se corrige jamais. Les publicités sont payées en dollars : le compte doit être en dollars, sinon chaque montant affiché doit être reconverti mentalement. |
| **Fuseau horaire** | (UTC+00:00) Abidjan | Détermine les frontières de journée. Un fuseau décalé coupe les journées en deux. |
| **Pays de facturation** | À choisir dans la liste proposée | Conditionne les moyens de paiement acceptés. |

**Procédure :** `ads.google.com` > Créer un compte > **Mode expert**, pas le mode
simplifié. Le mode simplifié crée une campagne automatique qu'il faut ensuite
démanteler.

⚠️ **Réserve sur la devise USD.** Google Ads ne propose pas toutes les devises
pour tous les pays de facturation. Si le pays de facturation choisi ne propose
pas l'USD, l'alternative est de choisir un pays de facturation qui le propose —
mais cela change les moyens de paiement acceptés. **À vérifier à l'écran avant
de valider**, puisque la devise est irréversible : une erreur impose de
recréer le compte et de perdre l'historique.

Si l'USD n'est finalement pas disponible, prendre EUR et convertir :
100 000 FCFA = 152,45 €. Les seuils de ce document restent exprimés en USD
comme référence de travail.

À la question « Quel est votre objectif principal ? », choisir **« Créer un
compte sans campagne »** (l'option est proposée en bas de la liste). On veut le
compte nu, pas une campagne pré-remplie.

⏳ **La création peut attendre.** Elle ne coûte rien et n'engage à rien, mais
elle sert à débloquer le Planificateur de mots-clés — c'est son intérêt
immédiat, voir B.6.

### B.2 Conversions

| Conversion | Source | Catégorie | Valeur | Comptage |
|---|---|---|---|---|
| `generate_lead` | Import GA4 (B.4) | Conversion | Vide | Une par clic |
| `clic_whatsapp` | Import GA4 | Action | Vide | Une par clic |
| `diagnostic_debut` | Import GA4 | Action | Vide | Une par clic |

**Valeur vide, et c'est un choix.** Attribuer une valeur à un diagnostic
— en USD puisque c'est la devise du compte — suppose de connaître le taux
diagnostic → client et le panier moyen.
Ces deux chiffres ne sont pas mesurés. Une valeur inventée fausse l'optimisation
plus qu'elle ne l'aide : l'algorithme chasserait les conversions faciles qu'on
aurait surévaluées. On posera la valeur au deuxième mois, avec des données
réelles.

**Catégorie « Action » pour les deux secondaires** : elles apparaissent dans les
rapports sans peser sur l'enchère.

### B.3 Enhanced Conversions

Configuration prête, à activer quand `generate_lead` remonte.

Le diagnostic collecte nom, e-mail et téléphone — exactement les données de
correspondance attendues. Elles sont hachées en SHA-256 **par la balise**, avant
l'envoi : rien ne part en clair.

Deux méthodes possibles :
- **Automatique** (recommandée) : Google lit les données des formulaires de la
  page. Aucun code à écrire. Paramétrage dans
  Conversions > `generate_lead` > Mesure améliorée.
- **Manuelle** : on transmet explicitement les valeurs hachées dans un objet
  `user_data`. Plus de contrôle, plus de travail.

Commencer par l'automatique. Le diagnostic est un formulaire multi-étapes :
vérifier après activation que le taux de correspondance remonte bien (indicateur
« Qualité de la correspondance » dans l'interface). S'il reste bas, passer en
manuel.

**Pourquoi ça compte ici :** le cycle de décision est long — visiter, réfléchir
une semaine, revenir remplir le diagnostic. Entre-temps, le cookie a souvent
expiré. Sans Enhanced Conversions, ces conversions sont attribuées à « direct »
et la campagne paraît moins bonne qu'elle n'est.

### B.4 Import des conversions depuis GA4

Conversions > Nouvelle action de conversion > **Importer** > GA4 > sélectionner
`generate_lead`.

Prérequis : la liaison GA4 ↔ Ads (B.5) doit être faite d'abord.

**Délai à connaître :** après l'import, compter **24 à 72 heures** avant que les
conversions apparaissent. Et l'algorithme a besoin de quelques jours de recul
avant d'optimiser dessus. À anticiper dans le calendrier de lancement : on ne
lance pas une campagne le jour où on active une conversion.

### B.5 Remarketing et liaison GA4

1. Admin GA4 > Liaisons de produits > Google Ads > Lier > activer
   « Personnalisation des annonces ».
2. Dans Google Ads : Audiences > importer `Diagnostic sans envoi` et
   `Soumissionneurs`.
3. Sur `Soumissionneurs`, appliquer une **exclusion** au niveau du compte.

**La liste d'exclusion est le geste qui rapporte le plus vite.** Sans elle, on
paie pour remontrer une annonce à quelqu'un qui a déjà rempli le formulaire.

Prérequis de volume : Google exige **100 utilisateurs minimum** dans une
audience de remarketing pour qu'elle soit diffusable, et **1 000** pour une
audience similaire. Avec le trafic actuel, aucune audience n'est diffusable
aujourd'hui. C'est une raison de plus de les créer tôt.

### B.6 Vérification du volume — le point le plus important de cette phase

🔴 **À faire dès la création du compte, avant toute autre chose.**

Outil > **Planificateur de mots-clés** > Découvrir de nouveaux mots-clés >
localisation : **Burkina Faso** puis **Côte d'Ivoire** > langue : français.

Requêtes à examiner :

```
création site web ouagadougou        création site internet burkina faso
site web professionnel ouagadougou   agence web ouagadougou
création site web abidjan            site internet abidjan
site web professionnel abidjan       agence web abidjan
création site e-commerce côte d'ivoire
```

**Ce qu'on cherche :** le volume de recherche mensuel cumulé.

- Si le total burkinabè dépasse ~1 000 recherches/mois → le budget de 5,80 USD/jour
  sera dépensé, le Burkina peut être le marché principal.
- S'il est inférieur à ~200 → **le budget ne sera pas dépensé**, et la Côte
  d'Ivoire devient le marché principal dès l'ouverture.

C'est ce chiffre qui tranche la décision n°3 laissée en suspens. Il n'est
consultable qu'avec un compte Ads : la création du compte est ce qui débloque la
seule donnée qui manque.

Noter aussi le **CPC estimé** par mot-clé. Comme le compte est en USD, le
Planificateur affichera **tous les CPC et tous les volumes de budget en
dollars** :

```
Budget mensuel   : 175 USD   (100 000 FCFA)
Budget quotidien : 5,80 USD  (3 333 FCFA)
CPC attendu BF   : 0,05 à 0,30 USD
CPC attendu CI   : 0,10 à 0,60 USD
```

Au Burkina comme en Côte d'Ivoire, attendre des CPC de quelques centimes à
quelques dizaines de centimes de dollar. Un CPC supérieur à 1 USD sur un
marché africain signalerait une concurrence inattendue — à investiguer avant
de lancer, pas après.

---

## C. Meta Business Manager

### C.1 Création

🔴 **Créer le Business Manager avant de créer quoi que ce soit d'autre.** Un
Pixel créé depuis un compte personnel reste rattaché à ce compte personnel, et
le transférer ensuite est pénible.

`business.facebook.com` > Créer un compte > nom : « ePerformance » > nom et
adresse e-mail.

Puis, dans l'ordre :
1. Business Manager > Paramètres > **Comptes** > Pages > ajouter la page
   Facebook ePerformance (ou en créer une si elle n'existe pas).
2. Paramètres > **Comptes** > Comptes publicitaires > en créer un, devise
   **USD**, fuseau Abidjan. Facturation plus tard.
   Meta propose une liste de devises plus courte que Google : si USD n'est pas
   disponible pour le pays de facturation choisi, prendre EUR et le signaler —
   les seuils de ce document resteront exprimés en USD comme référence.
3. Paramètres > **Sources de données** > Jeux de données > vérifier que le Pixel
   `1592627695615531` est bien rattaché. **S'il est orphelin** (créé hors BM),
   le réclamer depuis ce même écran.

### C.2 Vérification du domaine

Paramètres > **Sécurité de la marque** > Domaines > Ajouter
`eperformance.pro`.

Trois méthodes possibles. La plus simple pour un site statique :

**Balise méta** — Meta fournit une balise `<meta name="facebook-domain-verification" …>`.
À insérer dans le `<head>`. Attention : le site est composé, la balise doit aller
dans le composeur et pas seulement dans le fichier généré, sinon la prochaine
composition l'efface.

**Fichier HTML** — Meta fournit un fichier à déposer à la racine du domaine.
À faire si vous préférez ne pas toucher au composeur : le fichier est statique
et ne sera jamais écrasé.

⏳ Non bloquant avant le lancement, mais **bloquant pour l'optimisation** : sans
domaine vérifié, Meta limite le suivi et l'attribution. À faire dans le mois qui
précède le lancement.

### C.3 WhatsApp Business

Le canal de conversion réel d'ePerformance, et la cible recommandée pour
l'objectif Meta.

**Deux niveaux à ne pas confondre :**

- **L'application WhatsApp Business** (gratuite, sur téléphone) — déjà utilisée
  si le numéro `+225 01 51 17 06 66` tourne dessus. Suffit pour répondre.
- **L'API WhatsApp Business** (payante, via un fournisseur) — nécessaire
  uniquement pour automatiser, envoyer des modèles de messages, ou connecter un
  catalogue. **Pas nécessaire pour faire de la publicité.**

**Pour la publicité, ce qu'il faut :** un numéro WhatsApp Business actif, un
profil complet (nom, catégorie, description, horaires, photo), et le compte
publicitaire rattaché au Business Manager.

La création d'une campagne « Messages » proposera de connecter le numéro :
accepter la connexion, elle passe par le Business Manager.

⏳ **À préparer dans le mois précédant le lancement** : vérifier que le profil
WhatsApp Business est complet et que les réponses rapides sont configurées. Une
campagne qui envoie 30 conversations vers un numéro qui répond en 24 heures
gaspille le budget.

### C.4 CAPI — spécification prête

Détaillée en section D. L'implémentation touche le backend Railway, pas le site.

⏳ **Peut attendre le lancement.** Sans trafic payant, le CAPI n'améliore que la
mesure organique, qui est faible. En revanche, l'implémenter **avant** le
premier euro dépensé est préférable : une conversion non transmise au lancement
est une conversion perdue pour l'apprentissage.

### C.5 Audiences personnalisées à créer

| Nom | Source | Condition | Diffusable quand |
|---|---|---|---|
| `Visiteurs site 30j` | Pixel | Toutes visites | ~100 personnes |
| `Visiteurs site 90j` | Pixel | Toutes visites | ~100 personnes |
| `Diagnostic sans Lead` | Pixel | Événement personnalisé | 1-2 semaines |
| `Clients existants` | Liste e-mail | Import CSV | Immédiat si la liste existe |
| `Vidéo 50 %` | Pixel | Si vidéos (Phase 4) | Après lancement |

**Le cas de la liste clients.** Si vous avez une liste d'e-mails de clients ou
de prospects passés, l'importer crée l'audience la plus qualifiée de toutes — et
la seule source possible pour une audience similaire avant plusieurs mois. Meta
hache les e-mails à l'import : rien ne part en clair.

⏳ À créer dans le mois précédant le lancement, sauf la liste clients qui peut
être importée dès maintenant (sans dépendance au Pixel).

### C.6 Audience similaire — prématurée

Rappel de la Phase 1 : une audience similaire a besoin d'une source d'au moins
**100 à 1 000 personnes**. Créer une source à partir de 20 visiteurs produit une
audience qui ne ressemble à personne.

À ne pas tenter avant plusieurs mois de collecte.

---

## D. Backend Railway — spécification CAPI

Le backend reçoit la soumission du diagnostic. C'est lui qui doit émettre le
`Lead` vers Meta.

**Pourquoi côté serveur :** le pixel navigateur perd une part croissante des
conversions (bloqueurs, restrictions de cookies, Safari). L'événement serveur
part d'une adresse IP fixe et ne dépend pas du navigateur. Le diagnostic est
précisément le moment où l'information est la plus fiable : elle vient d'être
validée par le formulaire.

### D.1 Ce qu'il faut envoyer

```json
POST https://graph.facebook.com/v21.0/1592627695615531/events?access_token=<TOKEN>
{
  "data": [{
    "event_name": "Lead",
    "event_time": 1789000000,
    "event_id": "<même identifiant que côté navigateur>",
    "event_source_url": "https://eperformance.pro/diagnostic_eperformance.html",
    "action_source": "website",
    "user_data": {
      "em": ["<sha256 de l'e-mail, minuscules, sans espaces>"],
      "ph": ["<sha256 du téléphone, format international, sans + ni espaces>"],
      "fn": ["<sha256 du prénom>"],
      "client_ip_address": "<IP du visiteur>",
      "client_user_agent": "<user-agent du visiteur>",
      "fbc": "<_fbc du cookie si présent>",
      "fbp": "<_fbp du cookie si présent>"
    }
  }]
}
```

### D.2 Les quatre règles à ne pas enfreindre

**1. Hachage SHA-256 systématique.** E-mail en minuscules et sans espaces avant
hachage. Téléphone en format international, sans `+` ni espaces. Prénom en
minuscules. **Rien ne part en clair** — c'est une exigence de Meta, pas une
recommandation.

**2. `event_id` partagé.** Le navigateur et le serveur émettent le même
événement avec le même identifiant. Meta déduplique sur cet identifiant. Sans
lui, chaque conversion compte double et les chiffres deviennent inutilisables.
L'identifiant doit être **généré à la soumission** et transmis aux deux.

**3. `action_source: "website"`.** Signale que l'événement vient d'une action
web réelle et non d'un import hors ligne.

**4. Ne pas bloquer la réponse au visiteur.** L'appel à Meta se fait **après**
avoir répondu au formulaire, ou en tâche de fond. Un appel Meta lent ne doit
jamais retarder la confirmation affichée au visiteur.

### D.3 Ce qu'il faut prévoir dès maintenant dans le backend

Sans implémenter le CAPI, trois choses à faire pour ne pas avoir à reprendre le
code plus tard :

1. **Générer un `diagnosticId` unique** à chaque soumission et le **renvoyer
   dans la réponse**. Le navigateur en a besoin pour l'`event_id` partagé.
2. **Stocker l'IP et le user-agent** de la requête. Ils sont nécessaires au
   matching et ne peuvent pas être reconstitués après coup.
3. **Vérifier où sont stockés les diagnostics, combien de temps, et qui y a
   accès.** C'est le point 7 des préalables : on ne transmet à Meta que ce qu'on
   a le droit de conserver.

Le token d'accès CAPI se génère dans Events Manager > Paramètres > Conversions
API > Générer un token. **À conserver comme variable d'environnement Railway**,
jamais dans le code.

---

## E. Code prêt à déployer

**Rien ici n'est déployé.** Le code est prêt, testé dans sa logique, et attend
votre validation. Chaque bloc indique où il va et ce qu'il remplace.

### E.1 Événements — nouveau fichier `assets/js/tracking.js`

Le tracking est isolé du comportement : `eperf.js` gère le thème et les
animations, `tracking.js` gère la mesure. À inclure **après** `consent.js` dans
le composeur.

```js
/* ==========================================================================
   ePerformance — événements de mesure
   assets/js/tracking.js

   Écouteurs d'événements GA4 et Meta. Ne fait rien tant que le consentement
   n'a pas été donné : window.gtag et window.fbq n'existent qu'après.

   Un seul écouteur délégué sur le document attrape tous les liens WhatsApp,
   présents et futurs — le site en compte 115 aujourd'hui, chaque nouvel
   article en ajoute.
   ========================================================================== */

(function () {
  'use strict';

  function consentement() {
    return (window.eperfConsent && window.eperfConsent.get()) || null;
  }

  /* Envoie un événement aux outils chargés. Chaque outil est vérifié :
     si le consentement est refusé, gtag n'existe pas et l'appel est ignoré. */
  function envoyer(nom, params, metaEvenement) {
    var c = consentement();
    if (!c) return false;

    if (c.analytics && typeof window.gtag === 'function') {
      window.gtag('event', nom, params || {});
    }
    if (c.ads && typeof window.fbq === 'function' && metaEvenement) {
      window.fbq('track', metaEvenement, params || {});
    }
    return true;
  }

  window.eperfTrack = envoyer;

  /* --- Clics sortants : WhatsApp, e-mail, téléphone ---------------------- */
  document.addEventListener('click', function (event) {
    var lien = event.target.closest('a[href]');
    if (!lien) return;

    var href = lien.getAttribute('href') || '';

    if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      envoyer('clic_whatsapp', {
        lien_origine: lien.getAttribute('data-cta') || 'lien',
        page: window.location.pathname
      }, 'Contact');
      return;
    }

    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
      envoyer('clic_contact', {
        type: href.indexOf('mailto:') === 0 ? 'email' : 'telephone',
        page: window.location.pathname
      });
    }
  }, true);

  /* --- Début de diagnostic ---------------------------------------------- */
  /* Déclenché une seule fois, au premier champ touché. Mesure l'entrée dans
     le formulaire, pas son avancement : l'écart avec generate_lead donne le
     taux d'abandon, c'est l'information utile. */
  (function () {
    var form = document.getElementById('diagForm');
    if (!form) return;
    var declenche = false;
    form.addEventListener('input', function () {
      if (declenche) return;
      declenche = true;
      envoyer('diagnostic_debut', { form_id: 'diagnostic' }, 'InitiateCheckout');
    }, { once: false });
  })();

  /* --- Vue de la page d'offre ------------------------------------------- */
  if (window.location.pathname.indexOf('site-web') !== -1) {
    envoyer('contenu_offre_vu', { page: window.location.pathname }, 'ViewContent');
  }
})();
```

### E.2 `generate_lead` — dans `diagnostic_eperformance.html`

Le formulaire utilise une chaîne `.then()`, pas `async/await`. Le bon point
d'insertion est le second `.then()`, celui qui traite la réponse déjà convertie
en JSON (ligne 1236) :

```js
      .then(function (res) {
        if (res && res.score != null) console.info('Diagnostic enregistre — score', res.score);

        // Conversion principale : c'est la réponse du serveur qui compte,
        // pas le clic sur le bouton. Un envoi qui échoue n'est pas un prospect.
        if (typeof window.eperfTrack === 'function') {
          window.eperfTrack('generate_lead', {
            value: 0,
            currency: 'USD',
            form_id: 'diagnostic',
            // Identifiant partagé avec le CAPI pour la déduplication.
            // Nécessite que le backend le renvoie — point 10 de la checklist.
            event_id: (res && res.diagnosticId) || undefined
          }, 'Lead');
        }
      })
```

Trois points de méthode :

- **L'événement part dans le second `.then()`, pas le premier.** Le premier
  convertit la réponse en JSON et journalise un échec sans l'interrompre : à ce
  stade, on ne sait pas encore si le backend a accepté. Le second ne s'exécute
  que si la chaîne est allée au bout.
- **Le repli sur `undefined` pour `event_id`.** Tant que le backend ne renvoie
  pas d'identifiant, Meta reçoit un `Lead` sans déduplication : l'événement
  remonte quand même, il est seulement moins précis. Ce n'est pas bloquant pour
  un premier déploiement.
- **Aucun `await`, aucun `try`.** La chaîne `.then()` gère déjà les erreurs par
  son propre `.catch()` s'il existe. Ajouter un `async` ici changerait la
  structure de la fonction pour rien.

### E.3 Consent Mode v2 — modifications dans `consent.js`

**Trois changements précis.**

**1. En tête de fichier, avant tout le reste** — l'état par défaut doit être posé
avant que `gtag.js` ne soit chargé :

```js
  /* Consent Mode v2 — état par défaut, tout refusé.
     gtag.js se charge pour tous les visiteurs ; tant qu'aucun choix n'est
     exprimé, Google ne reçoit qu'un signal anonyme, sans cookie. */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage:         'denied',
    ad_user_data:       'denied',
    ad_personalization: 'denied',
    analytics_storage:  'denied',
    wait_for_update:    500
  });
  window.gtag('js', new Date());
```

**2. Dans `loadAnalytics()`** — remplacer le bloc qui crée le script et
initialise `gtag` par le seul chargement du script, puisque `gtag` existe
désormais en amont :

```js
  function loadAnalytics() {
    if (window.__eperfAnalyticsLoaded) return;
    window.__eperfAnalyticsLoaded = true;

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(ga);

    window.gtag('config', GA4_ID, { anonymize_ip: true });
    // ... Clarity inchangé : il ne dépend pas du Consent Mode
  }
```

**3. Dans `applyConsent()`** — propager le choix :

```js
  function applyConsent(consent) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage:         consent.ads       ? 'granted' : 'denied',
        ad_user_data:       consent.ads       ? 'granted' : 'denied',
        ad_personalization: consent.ads       ? 'granted' : 'denied',
        analytics_storage:  consent.analytics ? 'granted' : 'denied'
      });
    }
    if (consent.analytics) loadAnalytics();
    if (consent.ads) loadAds();
  }
```

**4. Incrémenter `VERSION`** de 1 à 2. Le bandeau sera réaffiché aux visiteurs
ayant déjà répondu — c'est voulu : la portée du consentement change, l'ancien
choix ne couvre pas le nouveau fonctionnement.

🔴 **La page cookies doit être mise à jour** pour expliquer qu'une requête
anonyme part vers Google avant le choix. Sans cette phrase, le site cesse d'être
exact sur ce qu'il fait.

---

## F. Checklist de préparation

### Avant tout — cette semaine

| # | Tâche | Qui | Bloquant ? |
|---|---|---|---|
| 1 | GA4 : passer la conservation à 14 mois | Vous | 🔴 |
| 2 | GA4 : lier Search Console | Vous | Non |
| 3 | Créer le compte Google Ads (devise **USD**, fuseau Abidjan, mode expert) | Vous | 🔴 |
| 4 | **Planificateur : mesurer le volume BF et CI** | Vous, je vous guide | 🔴 |
| 5 | Créer le Business Manager et rattacher le Pixel | Vous | 🔴 |

### Mois 1 — fondations

| # | Tâche | Qui |
|---|---|---|
| 6 | Déployer `tracking.js` + Consent Mode + `generate_lead` | Moi, sur votre validation |
| 7 | Créer les 5 audiences GA4 | Vous, je vous guide |
| 8 | Créer les audiences Meta (dont la liste clients) | Vous |
| 9 | Vérifier que `generate_lead` remonte dans GA4 | Moi |
| 10 | Ajouter le `diagnosticId` dans la réponse du backend | Moi, sur votre validation |

### Mois 2 — contenus

| # | Tâche | Qui |
|---|---|---|
| 11 | Phase 3 — stratégie par plateforme | Moi, **arrêt validation** |
| 12 | Phase 4 — créas (RSA, statiques, copywriting BF/CI) | Moi |
| 13 | Vérification du domaine Meta | Vous |
| 14 | Implémenter le CAPI dans le backend | Moi, sur votre validation |

### Mois 3 — pré-lancement

| # | Tâche | Qui |
|---|---|---|
| 15 | Phase 5 — landing pages | Moi, **arrêt validation** |
| 16 | Enhanced Conversions activées et vérifiées | Vous |
| 17 | Import des conversions dans Google Ads | Vous |
| 18 | Profil WhatsApp Business complet, réponses rapides | Vous |
| 19 | Campagnes créées **en pause**, tracking vérifié à blanc | Moi |
| 20 | Phase 8 — décisions finales et lancement | Ensemble |

---

## G. Calendrier de préparation

**Aucune date fixe.** Le déclenchement dépend de la réécriture des prix. Ce qui
suit est un ordre, pas un planning — il tient sur deux à trois mois à votre
rythme.

### Principe directeur

Trois choses seulement **gagnent** à être faites tôt, parce qu'elles
s'accumulent avec le temps :

1. **La conservation GA4 à 14 mois** — se compte à partir du réglage.
2. **Les audiences** — se remplissent à partir de leur création.
3. **L'instrumentation** (événements) — plus elle tourne longtemps avant le
   lancement, plus on connaît le taux de conversion naturel du site.

Tout le reste peut attendre sans rien perdre.

### Les trois points de décision avant lancement

| # | Décision | Quand | Ce qui la débloque |
|---|---|---|---|
| 1 | Marché Google : BF seul ou BF + CI | Après la vérification du volume | Le Planificateur |
| 2 | Objectif Meta : Messages ou autre | Au lancement | Le premier test de campagne |
| 3 | Valeur des conversions | Après 1 mois de données | Le taux diagnostic → client observé |

### Ce qu'on ne saura pas avant de dépenser

- Le **coût par prospect réel** sur chaque plateforme.
- Si l'objectif « Messages » sort effectivement de l'apprentissage.
- Le **taux de conversion de la landing page**, qui dépend de sa qualité et pas
  du canal.

Ces trois chiffres ne s'obtiennent qu'en dépensant. Le budget des deux premières
semaines de campagne doit être considéré comme un coût d'apprentissage, pas
comme un investissement rentable.

---

## Mes recommandations sur les quatre questions

### 1. Implémenter maintenant le Consent Mode, les événements, l'écouteur ?

**Oui, dans un seul chantier, dès que possible — mais après les vérifications
d'accès.**

Trois raisons, dans l'ordre d'importance :

- **Les événements produisent de la donnée dès le premier jour, même sans
  trafic payant.** Le site reçoit du trafic direct et de marque aujourd'hui. Dans
  trois mois, on saura combien de visiteurs cliquent sur WhatsApp, combien
  ouvrent le diagnostic, combien le terminent. Ces taux de conversion naturels
  sont exactement ce qui permet de fixer les seuils de coupe et de scaling en
  Phase 3. Sans historique, on les inventerait.
- **Le Consent Mode v2 s'améliore avec l'historique.** Le modèle de Google
  apprend des visiteurs consentants pour estimer les autres. Plus il a de recul
  au lancement, plus l'estimation est juste.
- **C'est un seul chantier technique.** Les trois modifications touchent deux
  fichiers. Les faire séparément coûterait trois déploiements et trois
  vérifications pour le même travail.

**Une réserve :** ne pas déployer avant d'avoir vérifié les accès (section A.1).
Implémenter `generate_lead` dans un GA4 dont on ne sait rien, c'est risquer de
le poser au mauvais endroit.

### 2. Créer les audiences maintenant ?

**Oui, dès que les événements sont en place — pas avant, pas après.**

Pas avant, parce que `Diagnostic sans envoi` et `WhatsApp sans diagnostic`
dépendent d'événements qui n'existent pas encore : les créer maintenant
produirait des audiences vides qui ne se rempliraient jamais.

Pas après, parce qu'une audience ne collecte rien rétroactivement. Une audience
créée trois mois avant le lancement contient trois mois de visiteurs ; créée la
veille, elle contient une journée.

**Une exception qui peut se faire dès aujourd'hui :** la liste clients Meta,
si elle existe. Elle ne dépend d'aucun événement ni d'aucun tracking — juste
d'un import CSV. C'est l'audience la plus qualifiée de toutes et la seule source
possible d'audience similaire avant plusieurs mois.

### 3. Préparer les landing pages maintenant ?

**Non pour les pages finales. Oui pour une page pilote.**

Les pages finales dépendent de deux choses qui n'existent pas encore : les prix
réécrits et les offres spéciales. Les produire maintenant, c'est les refaire dans
deux mois.

Mais **une page pilote** (`/lp/site-web-bf/`) vaut le détour maintenant, pour
une raison précise : elle valide le **pattern technique** — structure HTML, UTM,
événements GA4, cohérence avec le design system. Si ce pattern est faux, il est
faux sur les cinq pages. Le découvrir au lancement coûte une semaine ; le
découvrir maintenant coûte une après-midi.

Une page pilote sans prix, avec l'argumentaire et le formulaire, suffit à
valider le pattern. Le contenu commercial se posera dessus au lancement.

Cette page relève de la Phase 5, qui est un arrêt de validation. Je ne la
produirai donc pas sans votre accord — c'est une recommandation, pas une
initiative.

### 4. La séquence sur deux à trois mois

**Mois 1 — les accès et la mesure.** Vérifier les sept préalables, créer les
comptes, mesurer le volume au Planificateur, déployer l'instrumentation, créer
les audiences. À la fin du mois, on saura si le Burkina a assez de volume, et le
site mesurera ses conversions.

**Mois 2 — la stratégie et les contenus.** Phase 3 (stratégie, arrêt
validation), Phase 4 (créas), CAPI, vérification du domaine. À la fin du mois,
tout sera écrit et prêt, sauf les pages.

**Mois 3 — les pages et le test à blanc.** Phase 5 (landing pages, arrêt
validation), Enhanced Conversions, import des conversions, campagnes créées **en
pause** avec le tracking vérifié à blanc.

**Le test à blanc du mois 3 est l'étape qu'on est tenté de sauter, et c'est
l'erreur la plus coûteuse.** Créer les campagnes sans les activer, vérifier que
les événements remontent bien dans GA4, dans Google Ads et dans Meta, puis
seulement allumer. Un tracking cassé découvert après trois jours de campagne
coûte trois jours de budget sans données exploitables.

### Ce que je ne recommande pas

**Attendre le lancement pour tout faire.** L'argument serait « ne pas perdre de
temps sur un projet qui peut glisser ». Il se retourne : les trois choses qui
s'accumulent avec le temps — conservation, audiences, historique de conversion —
sont précisément celles qu'on ne peut pas rattraper. Les faire au lancement,
c'est démarrer avec zéro historique et attendre six semaines avant de pouvoir
juger une campagne.

**Implémenter le CAPI maintenant.** Il touche le backend, il dépend de la
connaissance du stockage des données (point 7 des préalables), et sans trafic
payant il n'apporte presque rien. À faire au mois 2, avant le premier euro.

**Créer les campagnes maintenant.** Une campagne créée et laissée en pause
pendant deux mois voit ses audiences se périmer et ses réglages vieillir. À
faire au mois 3.
