# Infrastructure de mesure — Phase 1

Préalable au lancement des campagnes. Ce document conçoit la chaîne de mesure
complète : ce qu'on enregistre, comment on le transmet, et ce qu'on pourra en
faire. Il se termine sur ce que le budget permet réellement — et sur un point
qu'il faut regarder en face avant de dépenser le premier franc.

Suite de `audit-tracking.md`. Le constat est là-bas, les décisions sont ici.

---

## 1. Préalables — à vérifier dans les interfaces

Je n'ai pas accès aux interfaces. Ces sept points doivent être cochés avant
toute implémentation, parce qu'ils changent ce qu'il faut faire :

| # | Vérification | Où | Ce que ça change |
|---|---|---|---|
| 1 | Propriété GA4 existante ou nouvelle | admin GA4 | Une propriété qui collecte depuis des mois a un historique exploitable. Une propriété neuve part de zéro. |
| 2 | Conservation des données GA4 | admin GA4 > Conservation | 14 mois par défaut. À passer à 14 mois minimum, **avant** d'avoir besoin de comparer deux années. |
| 3 | Événements automatiques actifs | admin GA4 > Flux de données | Détermine ce qui est déjà mesuré sans code. |
| 4 | Sitemap du blog soumis | Search Console | Le blog publie 81 articles ; sans sitemap, l'indexation traîne. |
| 5 | Domaine vérifié dans Meta | Business Manager > Domaines | Sans domaine vérifié, pas d'optimisation d'événements ni d'attribution fiable. |
| 6 | Jeu de données Meta existant | Events Manager | Le Pixel `1592627695615531` est-il rattaché à un jeu de données, ou orphelin ? |
| 7 | Données stockées par le backend Railway | code du backend | Quoi, où, combien de temps. Détermine ce qu'on a le droit d'envoyer à Meta (Phase 7). |

Le point 7 conditionne directement le CAPI : on ne transmet à Meta que ce qu'on
a le droit de conserver.

---

## 2. GA4 — les événements

### Le principe

Quatre familles, dans l'ordre de la valeur commerciale.

| Événement | Nom GA4 | Déclencheur | Valeur |
|---|---|---|---|
| Soumission du diagnostic | `generate_lead` | Réponse `200` du backend Railway | **Conversion principale** |
| Début de diagnostic | `diagnostic_debut` | Premier champ de l'étape 1 rempli | Micro-conversion |
| Clic WhatsApp | `clic_whatsapp` | Clic sur un lien `wa.me` ou `api.whatsapp.com` | Intention forte |
| Clic e-mail / téléphone | `clic_contact` | Clic sur `mailto:` ou `tel:` | Intention moyenne |

Deux remarques sur les noms. `generate_lead` est un **événement recommandé** par
GA4 : l'utiliser plutôt qu'un nom maison permet une remontée native vers Google
Ads et un rapport « Génération de prospects » qui existe déjà. Les autres sont
des noms maison, ce qui est normal — ils n'ont pas d'équivalent standard.

### Le cas du diagnostic

Le formulaire compte cinq étapes. On ne mesure pas chaque étape : ce serait de
l'instrumentation pour l'instrumentation. On mesure **l'entrée** et **la
sortie**. L'écart entre les deux est le taux d'abandon, qui est l'information
utile.

Le déclencheur de `generate_lead` est la **réponse du serveur**, pas le clic sur
le bouton. Un clic sur « Envoyer » qui échoue n'est pas un prospect. C'est la
seule façon d'avoir un chiffre qui corresponde à la réalité commerciale.

### Le piège du clic WhatsApp

115 liens WhatsApp sur le site, dans le header, les articles, les pieds de page,
les blocs CTA. Ils ne se ressemblent pas tous et certains sont injectés après
chargement.

La méthode fiable n'est pas d'annoter les 115 liens un par un — le prochain
article en ajoutera sans prévenir. C'est **un écouteur délégué sur le document**
qui attrape tout clic sur un lien dont le `href` contient `wa.me` ou
`api.whatsapp.com`. Un seul écouteur, tous les liens présents et futurs.

### Consent Mode v2

**Ce qu'il faut changer dans l'architecture actuelle.** Aujourd'hui `consent.js`
charge `gtag.js` *après* le consentement. Le Consent Mode v2 exige l'inverse :
`gtag.js` doit être chargé **dès le départ**, avec tout en `denied`, puis mis à
jour après le choix.

```js
// Avant le chargement de gtag.js — état par défaut, tout refusé
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage:         'denied',
  ad_user_data:       'denied',
  ad_personalization: 'denied',
  analytics_storage:  'denied',
  wait_for_update:    500        // laisse 500 ms au bandeau pour répondre
});
```

```js
// Après le choix du visiteur
gtag('consent', 'update', {
  ad_storage:         consent.ads       ? 'granted' : 'denied',
  ad_user_data:       consent.ads       ? 'granted' : 'denied',
  ad_personalization: consent.ads       ? 'granted' : 'denied',
  analytics_storage:  consent.analytics ? 'granted' : 'denied'
});
```

**Ce que ça change concrètement.** Un visiteur qui refuse n'est plus invisible :
Google reçoit un signal anonyme, sans cookie et sans identifiant, qui alimente
la modélisation des conversions. Sur un site où le bandeau s'affiche à la
première visite, c'est la différence entre voir 100 % des conversions et n'en
voir que la moitié.

**Le point de conformité à trancher.** `gtag.js` serait alors chargé pour tous
les visiteurs, y compris ceux qui refusent. C'est le fonctionnement prévu par
Google et la pratique recommandée en Europe, mais cela reste une requête vers un
tiers avant consentement. Sur un site qui revendique « aucun traceur avant un
choix explicite », cette nuance doit être expliquée dans la page cookies, et la
décision vous revient. Deux options :

- **Consent Mode v2 activé** : plus de données, une requête tierce avant choix.
- **Statu quo** : zéro requête avant choix, perte estimée de 30 à 50 % du signal.

Je recommande la première, avec une page cookies qui dit exactement ce qui se
passe. Mais c'est votre décision, pas la mienne.

### Liaisons à activer

- GA4 ↔ **Google Ads** : importe les conversions GA4 dans Ads et permet le
  remarketing depuis les audiences GA4.
- GA4 ↔ **Search Console** : fait remonter les requêtes de recherche dans GA4.
  Sans ça, Search Console reste un outil séparé qu'on oublie d'ouvrir.
- GA4 ↔ **BigQuery** : inutile à ce stade. À rouvrir si le volume dépasse
  plusieurs milliers de sessions par mois.

### Audiences GA4 à créer

Elles se remplissent à partir du jour de leur création. Les créer maintenant,
c'est les avoir pleines au lancement.

| Audience | Définition | Usage |
|---|---|---|
| Tous les visiteurs | 90 jours | Remarketing de socle |
| Diagnostic sans envoi | Vu `/diagnostic_eperformance.html`, pas de `generate_lead` | **La plus rentable** : la personne a commencé, elle connaît l'offre |
| Clic WhatsApp sans diagnostic | `clic_whatsapp`, pas `generate_lead` | A contacté sans remplir |
| Soumissionneurs | `generate_lead` | À **exclure** des campagnes |
| Lecteurs du blog | 3 pages ou plus, 90 jours | Audience tiède, à nourrir avant de vendre |

La deuxième ligne est celle qui rapporte : une personne qui a ouvert le
diagnostic a manifesté une intention. Elle n'a pas terminé — c'est exactement ce
que le remarketing sait rattraper.

---

## 3. Google Ads

### Création du compte

Compte neuf, dédié, séparé du MCC existant. Trois paramètres à ne pas rater au
moment de la création parce qu'ils ne se corrigent pas après coup :

- **Devise** : XOF (franc CFA). Attention — la devise se fixe définitivement à
  la création. Vérifier que XOF est bien proposé pour le pays de facturation
  choisi, sinon le compte sera en euros et tous les seuils exprimés en FCFA
  devront être convertis à chaque lecture.
- **Fuseau horaire** : Abidjan (UTC+0). Détermine les frontières de journée dans
  les rapports.
- **Pays de facturation** : à choisir parmi ceux proposés. Il conditionne les
  moyens de paiement acceptés.

### Conversions

| Conversion | Source | Catégorie | Valeur |
|---|---|---|---|
| `generate_lead` | Import GA4 | Conversion | À définir — voir ci-dessous |
| `clic_whatsapp` | Import GA4 | Action | Sans valeur |
| `diagnostic_debut` | Import GA4 | Action | Sans valeur |

**L'ordre de priorité est important.** Créer d'abord `generate_lead` comme
conversion principale, la seule sur laquelle l'enchère s'appuiera. Les deux
autres servent à **observer**, pas à optimiser : elles indiquent d'où vient le
travail, elles ne pilotent rien.

**La valeur des conversions.** Laisser la valeur vide au départ. Attribuer une
valeur en FCFA à un diagnostic supposerait de connaître le taux de transformation
diagnostic → client et le panier moyen — deux chiffres qui ne sont pas encore
mesurés. Une valeur inventée fausse l'optimisation plus qu'elle ne l'aide. On la
posera au deuxième mois, avec des données réelles.

### Enhanced Conversions

À activer. Le diagnostic collecte nom, e-mail et téléphone : ce sont exactement
les données de correspondance attendues. Elles sont hachées en SHA-256 par la
balise avant l'envoi, jamais transmises en clair.

Utilité concrète : quand un visiteur refuse les cookies publicitaires ou quand
le cookie a expiré entre le clic et la conversion, l'e-mail haché permet encore
de rattacher la conversion à son clic. Sur un cycle de décision long — visiter,
réfléchir une semaine, revenir remplir le diagnostic — c'est une part
importante des conversions.

### Remarketing

Deux listes suffisent au départ :

- **Visiteurs du diagnostic sans envoi** (audience GA4 importée) : la cible du
  remarketing Search et Display.
- **Soumissionneurs** (à exclure) : sans cette exclusion, on paie pour remontrer
  une annonce à quelqu'un qui a déjà rempli le formulaire.

### Liaison GA4 ↔ Google Ads

Dans le même compte Google, l'activation des « Signaux » dans GA4 suffit.
Elle permet l'import des conversions et le partage des audiences, sans
transmettre d'identifiant personnel.

---

## 4. Meta

### Pixel et événements

Le Pixel `1592627695615531` est chargé, mais il n'émet que `PageView`. Quatre
événements à ajouter :

| Événement | Déclencheur | Type |
|---|---|---|
| `Lead` | Soumission réussie du diagnostic | Standard |
| `Contact` | Clic WhatsApp | Standard |
| `InitiateCheckout` | Entrée dans le diagnostic | Standard |
| `ViewContent` | Vue de `/site-web.html` | Standard |

Ce sont les quatre événements **standard** de Meta. Les utiliser plutôt que des
noms maison donne accès à l'optimisation par événement et à la mesure agrégée,
et cela évite de créer des événements personnalisés que Meta traite moins bien.

### Conversions API (CAPI)

Le backend Railway reçoit la soumission. C'est lui qui doit envoyer le `Lead` à
Meta — pas le navigateur.

```js
// Dans le backend, après enregistrement du diagnostic
const payload = {
  data: [{
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: diagnosticId,               // même id que côté navigateur
    action_source: 'website',
    user_data: {
      em: sha256(email.trim().toLowerCase()),
      ph: sha256(telephone.replace(/\D/g, '')),   // format international
      client_ip_address: req.ip,
      client_user_agent: req.get('user-agent')
    }
  }]
};
// POST https://graph.facebook.com/v21.0/<PIXEL_ID>/events?access_token=<TOKEN>
```

**L'`event_id` partagé est le point crucial.** Le navigateur et le serveur
émettent tous les deux le même événement, avec le même identifiant. Meta
déduplique. Sans lui, chaque conversion compte double et les chiffres deviennent
inutilisables.

**Le hachage n'est pas une option.** E-mail et téléphone partent en SHA-256, en
minuscules et sans espaces. Meta ne reçoit jamais la donnée en clair.

### Audiences personnalisées

| Audience | Source | Disponible quand |
|---|---|---|
| Visiteurs 30 / 90 / 180 jours | Pixel | Immédiatement, se remplit en quelques jours |
| Diagnostic sans envoi | Pixel, événement personnalisé | 1 à 2 semaines |
| Spectateurs vidéo 50 % | Pixel | Si vidéos (voir Phase 3) |
| Clients existants | Liste e-mail importée | Immédiat, si la liste existe |

### Lookalike — prématuré, et il faut le dire

Un lookalike a besoin d'une **source d'au moins 100 à 1 000 personnes** pour
produire quoi que ce soit d'exploitable. Aujourd'hui, avec un trafic organique
proche de zéro hors marque, la source n'existe pas.

Créer un lookalike à partir de 20 visiteurs produit une audience qui ressemble à
ces 20 personnes — c'est-à-dire à personne en particulier. **À ne pas faire
avant d'avoir plusieurs centaines de conversions ou visiteurs qualifiés**, soit
probablement deux à trois mois après le lancement.

---

## 5. Le point qu'il faut regarder en face

### Le budget, converti

100 000 FCFA = 152,45 € (parité fixe) ≈ **175 USD par mois** au taux BCE du
17 septembre 2026 (1 EUR = 1,1481 USD), soit **5,80 USD par jour** et par
plateforme. C'est le montant réel sur lequel les algorithmes vont travailler.

### Meta : l'optimisation par conversion ne peut pas fonctionner

Meta sort un ensemble de publicités de la phase d'apprentissage après environ
**50 conversions par semaine**. En dessous, la diffusion reste instable et le
coût par résultat élevé — ce n'est pas un avis, c'est le seuil documenté par
Meta.

Avec 5,80 USD/jour, cela fait 40,60 USD par semaine. Pour atteindre 50
conversions, il faudrait un coût par conversion de **0,81 USD**. Sur une offre
de création de site web, le coût par prospect qualifié se situe plutôt entre 5
et 20 USD selon les marchés. On est donc à **un ordre de grandeur en dessous du
seuil**.

**Conséquence pratique :** lancer une campagne Meta optimisée vers `Lead` avec
ce budget produira un coût par prospect élevé et instable, et l'algorithme
n'apprendra pas. Ce n'est pas une raison de ne pas faire de Meta — c'est une
raison de **choisir le bon objectif**.

Trois options, par ordre de préférence :

1. **Optimiser vers la conversation WhatsApp** (objectif « Messages »). L'action
   est plus fréquente qu'un diagnostic rempli : l'algorithme a plus de signal
   pour le même budget. C'est aussi le canal de conversion réel d'ePerformance.
2. **Optimiser vers le trafic** avec une audience très ciblée. Moins qualifié,
   mais l'algorithme ne dépend pas d'un seuil de conversions.
3. **Ne pas faire de Meta au départ**, concentrer les 200 000 FCFA sur Google
   Search. Contredit la décision actée — je le mentionne par honnêteté, pas pour
   la contester.

Avec objectif « Messages », le seuil tombe à environ 25 conversations par
semaine, ce qui demande un coût par conversation de 1,62 USD. C'est atteignable sur un
marché à faible concurrence. **C'est la seule configuration Meta qui a une
chance de sortir de l'apprentissage avec ce budget.**

### Google Search : le volume est le risque, pas le budget

Le Burkina Faso est le marché prioritaire. C'est un marché de 2,5 millions
d'habitants à Ouagadougou, avec une pénétration internet limitée et un tissu
d'entreprises formelles étroit. Les CPC y sont bas — c'est favorable — mais le
**nombre de recherches** sur des requêtes comme « création site web
Ouagadougou » est probablement faible, de l'ordre de quelques dizaines par mois.

Si le volume total disponible est de 500 recherches mensuelles sur les
mots-clés ciblés, le budget de 5,80 USD/jour **ne sera pas dépensé** : on ne
peut pas acheter des clics qui n'existent pas. Le compte affichera un budget
non dépensé, ce qui n'est pas un échec — c'est le marché qui parle.

Je n'ai pas d'outil de mots-clés pour trancher. **La première chose à faire une
fois le compte créé est de vérifier le volume avec le Planificateur de mots-clés
sur le Burkina Faso, puis sur la Côte d'Ivoire.** Si le volume burkinabè est
trop faible, l'extension à la Côte d'Ivoire n'est pas une phase 2 : c'est le
marché principal dès le départ.

### Ce que 200 000 FCFA/mois permettent réellement

| | Réaliste | Irréaliste |
|---|---|---|
| Volume de clics | 800 à 2 000 clics/mois sur Google si le volume existe | 10 000 clics |
| Coût par lead | 5 000 à 20 000 FCFA | 1 000 FCFA |
| Prospects/mois | 10 à 40 au total, deux plateformes | 200 |
| Sortir de l'apprentissage Meta sur `Lead` | Non | Oui |
| Sortir de l'apprentissage Meta sur « Messages » | Possible | — |
| Remarketing après 30 jours | Oui, sur les audiences constituées | Non, avant |
| Lookalike | Non avant 2-3 mois | — |

**Le chiffre à retenir : 10 à 40 prospects par mois.** Si les campagnes
produisent moins de 10, il y a un problème à corriger. Si elles en produisent
plus de 40 avec ce budget, la cible est trop large ou l'offre trop peu chère
pour le marché.

---

## 6. Calendrier — pourquoi on ne peut pas lancer tout de suite

La mesure doit précéder la dépense. Pas par principe : parce qu'une audience se
remplit à partir du jour où elle est créée.

| Semaine | Ce qui se passe | Dépense publicitaire |
|---|---|---|
| 1 | Implémentation : événements, Consent Mode, conversions, CAPI | 0 |
| 2 | Vérification des remontées, correction des écarts, audiences créées | 0 |
| 3 | Campagnes en préparation (créas, landing pages) — Phase 4 et 5 | 0 |
| 4 | Lancement à budget réduit, collecte | 25 % |
| 5-6 | Montée progressive, premières coupures | 60 % |
| 7+ | Régime normal | 100 % |

**Trois semaines sans dépense paraissent longues. Elles ne le sont pas :** au
bout de trois semaines, les audiences de remarketing contiennent déjà des
visiteurs réels, les conversions sont validées, et le premier euro dépensé peut
être attribué à un prospect. Dépenser à la semaine 1 aurait produit des chiffres
qu'on n'aurait pas su lire.

---

## 7. Décisions à valider avant de passer à la Phase 2

1. **Consent Mode v2** — activé (plus de données, une requête tierce avant le
   choix) ou statu quo (aucune requête, 30 à 50 % du signal perdu) ?
2. **Objectif Meta** — « Messages » vers WhatsApp (recommandé, seul objectif
   atteignable), trafic, ou conversion `Lead` en assumant l'échec de
   l'apprentissage ?
3. **Marché du compte Google** — Burkina seul au départ, ou Burkina + Côte
   d'Ivoire dès l'ouverture pour ne pas plafonner sur le volume ?
4. **Valeur des conversions** — laisser vide les deux premiers mois (recommandé)
   ou fixer une estimation dès maintenant ?
5. **Accès aux interfaces** — qui vérifie les sept préalables du §1, et comment
   les résultats me reviennent ?

Une fois ces cinq points tranchés, la Phase 2 (préparation des comptes) peut
être exécutée sans autre décision de votre part jusqu'à la Phase 3.
