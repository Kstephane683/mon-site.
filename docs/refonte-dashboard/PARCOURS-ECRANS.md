# ePerformance — Parcours et écrans du dashboard unifié

Suite de `AUDIT-M1` à `AUDIT-M5` (les cinq modules) et de
`docs/refonte-cockpit/ARCHITECTURE-ECRANS.md` (l'architecture en cinq destinations du
cockpit, 962 lignes). Ce document **reprend cette architecture comme base, la corrige là
où les cinq audits l'ont contredite, et l'étend au périmètre SaaS complet** : le rail,
les 33 adresses, l'écran d'accueil, chaque écran bloc par bloc avec ses six états, les
cinq parcours mesurés avant et après, les tâches longues, le clavier, les points de
rupture.

**Décisions pures.** Rien n'est implémenté ici, aucun fichier de l'outil n'est touché,
aucun code n'est écrit. Aucun « à définir » : quand les audits divergeaient ou
laissaient un choix ouvert, ce document tranche et dit pourquoi.

---

## 0. Ce que ce document corrige dans `ARCHITECTURE-ECRANS.md`

| # | Ce que disait la base | Correction | Pourquoi |
|---|---|---|---|
| **C1** | Cinq destinations, 18 adresses | Cinq destinations conservées, **33 adresses** | Les cinq audits ont trouvé quatre classes d'information qui n'avaient ni écran ni URL : la **santé des chaînes**, la **provenance/fraîcheur**, les **alertes**, la **fiche visuel** |
| **C2** | Acquérir = 3 onglets (Pipeline · Sources · Messages) | **5 onglets** : Pipeline · Réponses · Séquence · Sources · Hygiène | M1 §6.4 : trois réponses positives s'affichaient « Froid ». Un état qui décide d'une suite mérite un onglet et un compteur |
| **C3** | Système = 5 onglets | **6 onglets** + 2 pages hors onglets (Diagnostic, Alertes) | M1 F3, M4 D16 : une chaîne morte pendant 12 jours sans alerte. Il faut un écran où vit l'état de chaque chaîne |
| **C4** | Produire = 4 onglets, l'atelier fait tout le visuel | **5 onglets** + écran `Visuels` + `Fiche visuel` + `Planifier` + `Journal` | M3 §5.2 : deux chaînes visuelles selon le bouton. M4 §2.2 : 3 `prompt()` pour programmer un lot. M3 F3 : un carrousel contrôlé à 32 % |
| **C5** | Le panneau `#/prix` | **Supprimé** ; le catalogue d'offres devient `Système › Compétences › Référentiel` | M2 §7.6 : « rien d'inventé ne doit pouvoir être publié ». Un catalogue fermé qui alimente les prompts est un référentiel, pas un panneau |
| **C6** | La file du jour : 12 lignes, 4 zones | **Conservée, étendue** : zones A à D + 10 règles d'alerte + détecteur de divergence | M1 F1/F3, M4 D1/D16 : les deux pannes les plus coûteuses ne produisaient aucune ligne |
| **C7** | « Toute route de plus de 2 s rend un identifiant de tâche » | Conservé, **étendu** : annulation coopérative, reprise après interruption, estimation mesurée | M3 F8 : « ~10 s/image » pour 23,0 s mesurées. Une estimation doit venir du journal, pas d'un texte écrit à la main |
| **C8** | `Ctrl+Entrée` = action primaire du formulaire (« Lancer, Ajouter, **Envoyer** ») | `Ctrl+Entrée` **ne couvre plus les actions à effet externe** : publier, envoyer | Une frappe accidentelle ne doit pas envoyer un message WhatsApp. Les deux actions externes exigent un clic sur un bouton |
| **C9** | Le compte client « quand `client` existera » | **Décidé maintenant** : sélecteur présent, une seule valeur aujourd'hui, `?client=` dans l'URL dès la deuxième | Un sélecteur qui apparaît un jour sans que les URL le portent casse tous les favoris. La forme est posée avant le contenu |
| **C10** | Rien sur la provenance | **Composant transverse obligatoire** : bandeau de provenance + état périmé | M1 §2.3 : 20 lignes sur 22 divergentes, « l'écran ne dit jamais d'où vient ce qu'il montre ni quand il a été rafraîchi » |

---

## 1. La navigation

### 1.1 Les cinq destinations

Un rail de 240 px à gauche, cinq destinations, **un seul élément actif à la fois**. Le
rail ne porte aucun bouton d'action : il porte des destinations, leur compteur, et le
bandeau de tâches en bas.

| Destination | Question à laquelle elle répond | Moment d'usage | Compteur du rail |
|---|---|---|---|
| **Aujourd'hui** | Qu'est-ce que je finis aujourd'hui ? | chaque matin, 15-20 min | le nombre d'éléments à décider |
| **Produire** | Qu'est-ce qui doit sortir ? | 2-3×/semaine, 45-90 min | brouillons à valider + échecs |
| **Acquérir** | Qui relancer, qui a répondu ? | 1×/semaine, 1-2 h | relances dues + réponses non traitées |
| **Veiller** | Que font les autres, qu'est-ce qui marche ? | 1×/semaine, 30 min | suggestions non écartées, fiches périmées |
| **Système** | Qu'est-ce qui est cassé ? | rare, bloquant | alertes non acquittées |

**Deux règles de compteur.** Un compteur à zéro s'affiche en `--muted` **et sans
pastille** — un zéro n'est pas une alerte. Un compteur qui additionne deux choses
hétérogènes est interdit : « Produire 7 » ne peut pas valoir « 7 brouillons + 2 échecs »,
il vaut le nombre d'objets qui attendent un geste dans la destination.

### 1.2 Sous-navigation — les onglets, et pourquoi

Un onglet est un **ensemble homogène d'objets du même type** (test 2 de la base). Le
nombre d'onglets d'une destination est celui de ses ensembles réels, pas un plafond
arbitraire.

| Destination | Onglets | Écrans annexes (hors barre d'onglets) |
|---|---|---|
| **Aujourd'hui** | aucun — une seule vue, c'est la règle | — |
| **Produire** | À valider · Programmées · Publiées · Échecs · Archives | Nouveau lot · Atelier · Visuels · Fiche visuel · Planifier · Journal des sorties · Détail de lot |
| **Acquérir** | Pipeline · Réponses · Séquence · Sources · Hygiène | Panneau prospect · Panneau nouveau · Revue d'import |
| **Veiller** | Concurrents · Idées · Performance | Fiche concurrent |
| **Système** | Fournisseur · Chaînes · Compétences · Apparence · Préférences · Journal | Diagnostic · Alertes |

**Un onglet porte un compteur** quand il existe un état qui attend un geste : `À valider 7`,
`Échecs 2`, `Réponses 3`, `Sources`, `Chaînes 1`. Le compteur est un **nombre**, jamais
une pastille rouge seule : la couleur ne porte jamais un état seule (règle C du système
visuel).

### 1.3 Toutes les adresses

Le routage est en **fragment** (`#/…`) : l'application est servie par Flask à la racine,
un fragment ne touche jamais le serveur, il fonctionne hors ligne, et un favori
reproduit exactement l'écran.

| # | Adresse | Écran |
|---|---|---|
| 1 | `#/aujourdhui` | La file du jour (`#/` redirige ici en `replaceState`) |
| 2 | `#/produire/publications?a-valider` | Publications, onglet brouillons (défaut de la destination) |
| 3 | `#/produire/publications?programmees` | Programmées, groupées par jour |
| 4 | `#/produire/publications?publiees` | Publiées, avec `Post_ID` et métriques |
| 5 | `#/produire/publications?echecs` | Échecs et parquées |
| 6 | `#/produire/publications?archives` | Archives (2 sous-onglets : anti-répétition, sorties) |
| 7 | `#/produire/nouveau` (+ `?nombre=7&pilier=&plateforme=&depart=&objectif=&sujet=`) | Nouveau lot, formulaire préempli |
| 8 | `#/produire/atelier/<ID>` (+ `?texte`\|`?visuel`\|`?verdict`\|`?sortie`) | L'atelier d'une publication |
| 9 | `#/produire/visuels` (+ `?manquants`\|`?refuses`\|`?tous`) | File des visuels |
| 10 | `#/produire/visuels/<ID>` (+ `?slide=3`) | Fiche visuel, une slide à l'écran |
| 11 | `#/produire/planifier?ids=PUB-0001,PUB-0002` | Programmation d'un lot |
| 12 | `#/produire/journal?statut=&plateforme=&depuis=` | Journal des sorties |
| 13 | `#/produire/lot/<tache>` | Détail d'un lot (tâche d'origine) |
| 14 | `#/acquerir/pipeline?statut=&recherche=&tri=` | Pipeline filtré |
| 15 | `#/acquerir/pipeline/nouveau` | Panneau de création |
| 16 | `#/acquerir/pipeline/<ID>` (+ `?fiche`\|`?qualification`\|`?messages`\|`?journal`) | Fiche prospect (panneau) |
| 17 | `#/acquerir/reponses` | Réponses à traiter |
| 18 | `#/acquerir/sequence` | Le moteur de séquence : étapes, cadence, modèles Meta |
| 19 | `#/acquerir/sources` (+ `?vcf`\|`?cartes`\|`?ads`) | Les trois entrées d'acquisition |
| 20 | `#/acquerir/sources/revue` | Revue avant import |
| 21 | `#/acquerir/hygiene` | Rapport de cohérence |
| 22 | `#/veiller/concurrents` (+ `?comparer=<slug>,<slug>`) | Liste et comparaison |
| 23 | `#/veiller/concurrents/<slug>` | Fiche concurrent |
| 24 | `#/veiller/idees` (+ `?depuis=&ecartees`) | Veille de contenu |
| 25 | `#/veiller/performance?periode=&plateforme=` | Mesure |
| 26 | `#/systeme/fournisseur` | Matrice usage × fournisseur |
| 27 | `#/systeme/chaines` (+ `?whatsapp`\|`?publication`\|`?instagram`\|`?assets`\|`?blog`) | Santé des chaînes |
| 28 | `#/systeme/competences` (+ `?agents`\|`?competences`\|`?referentiel`) | Banc d'essai et référentiel |
| 29 | `#/systeme/apparence` (+ `?gabarits`\|`?couleurs`\|`?icones`\|`?templates`) | Charte et gabarits |
| 30 | `#/systeme/preferences` | Densité, seuils, zone dangereuse |
| 31 | `#/systeme/journal` (+ `?taches`\|`?api`\|`?generations`\|`?historique`) | Journal |
| 32 | `#/systeme/diagnostic` | Diagnostic (atteignable depuis toute erreur) |
| 33 | `#/systeme/alertes` | Centre d'alertes (ouvertes et acquittées) |

**Deux règles d'URL.**
1. **L'URL fait foi quand elle porte un paramètre explicite** ; sinon l'état serveur de
   la vue est appliqué (`/api/etat/vue/<nom>`, routes déjà écrites). C'est ce qui permet
   à un favori de reproduire un écran, et à un onglet rouvert de reprendre le dernier
   filtre.
2. **Chaque paramètre est lisible.** Aucune valeur technique à l'écran : `?statut=Repondu_Positif`
   existe dans l'URL (contrat Flask inchangé) mais la puce affiche « A répondu · positif ».
   La table de correspondance de `SYSTEME-VISUEL.md` §2 est la seule source.

### 1.4 Fil d'Ariane

Le fil d'Ariane apparaît **au troisième niveau seulement**, c'est-à-dire quand on regarde
un objet : `Produire › Publications › PUB-0004`. Aux niveaux 1 et 2, la barre d'onglets
dit déjà où l'on est, et un fil d'Ariane y serait un doublon.

Le premier maillon revient à la liste **avec les filtres conservés**. Il ne revient jamais
à la destination nue : perdre le filtre en remontant est la façon la plus rapide de faire
détester une navigation.

### 1.5 Retour arrière, favoris, liens

- **Retour arrière** : chaque ouverture d'objet (panneau latéral, atelier) empile une
  entrée. `Retour` ferme l'objet et rend la liste telle qu'elle était. `Retour` ne
  traverse jamais deux états de la même vue.
- **Aucun `beforeunload`.** Fermer l'onglet ne demande rien : tout ce qui compte est
  écrit côté serveur. C'est la conséquence directe du principe « aucun état ne vit dans
  le seul navigateur ».
- **Un favori reproduit un écran**, filtres compris. Les vues nommées (jusqu'à 12)
  s'enregistrent via `/api/etat/vue/<nom>` et s'épinglent en tête de la barre d'onglets
  de la destination : « À relancer aujourd'hui », « Instagram en échec ».
- **Le lien est copiable partout** : toute ligne d'objet a « Copier le lien » dans son
  menu `⋯`, et le lien est l'URL du panneau ou de l'écran, jamais un identifiant nu.
- **`#/` redirige** vers `#/aujourdhui` en `replaceState` (sinon le retour arrière boucle).

### 1.6 Le bandeau haut — 56 px, quatre zones

| Zone | Contenu | Largeur |
|---|---|---|
| 1 — Identité | marque + **sélecteur de compte** (voir §1.7) | fixe |
| 2 — Recherche | recherche globale (prospects, publications, concurrents, tâches, journal) | élastique, max 480 px |
| 3 — État | quota anti-ban (chiffre + barre 4 px, **jamais un bouton**), badge fournisseur actif, horloge de dernière synchro avec sa provenance | fixe |
| 4 — Alertes et travail | pastille **Alertes** (nombre d'ouvertes, la plus grave en teinte), pastille **Tâches**, bouton `?` (raccourcis) | fixe |

**Interdits dans le bandeau** : toute navigation (c'est la cause du débordement de 305 px
mesuré), toute action d'écran, un second bouton plein.

### 1.7 Le compte client — tranché

Le sélecteur existe dans la zone 1 dès la première version, avec **une seule valeur
aujourd'hui : `ePerformance`**. Il ne se cache pas tant que `client` n'existe pas dans
les CSV, parce qu'un niveau de navigation qui apparaît après coup invalide tous les
favoris et toutes les captures.

Le jour où la colonne `client` existe, le même sélecteur liste les comptes et **chaque
adresse de la table §1.3 accepte `?client=<slug>`** ; le choix est écrit côté serveur et
lu à l'ouverture. Aucun écran ne change de forme : c'est un paramètre, pas un niveau.

**Règle d'affichage** : le compte courant est rappelé en `T7` dans le bandeau de
provenance de chaque écran (§1.8). Un écran qui montre des données sans dire de quel
compte elles viennent est un écran qui mentira dès le deuxième client.

### 1.8 La provenance et la fraîcheur — composant transverse (nouveau)

C'est la réponse au défaut le plus coûteux de l'audit M1 : « l'écran ne dit jamais d'où
vient ce qu'il montre ni quand il a été rafraîchi ».

**Le bandeau de provenance** est une ligne unique, sous le titre de l'écran, en `T8` :

```
Source · serveur api.eperformance.pro · lu à 14 h 12 (il y a 3 min)
Source · cache local · dernière synchro il y a 12 min
Source · dernier test exécuté il y a 4 min · 320 ms
Source · mesure du 18/09 à 04 h 45 · 16 publications
```

Quatre provenances possibles, nommées exactement ainsi : **serveur** (l'API de
production), **cache local** (le CSV du poste), **mémoire** (le dernier résultat connu),
**mesuré** (un test ou une mesure exécutée, avec son horodatage).

**Règle de construction** : tout bloc qui agrège deux provenances différentes affiche sa
propre ligne. Un bloc incapable de dire d'où vient sa donnée ne se construit pas.

**L'état périmé** — seuils, par source :

| Source | Rafraîchissement | Seuil de péremption |
|---|---|---|
| `aujourdhui` | auto, 60 s, onglet visible | 5 min |
| prospects (serveur) | à l'ouverture + après chaque écriture | 1 h |
| publications (serveur) | à l'ouverture + après chaque écriture | 15 min |
| chaînes et alertes | auto, 15 s, onglet visible | 5 min |
| mesure | 1 h | 24 h |
| concurrents | à la demande | contenu 90 j · dimension vérifiée 30 j |
| veille | à la demande | 7 j |
| fournisseur | à l'ouverture de l'écran | 24 h |

**Rendu de l'état périmé** : le bloc **garde son contenu** (il ne redevient jamais un
squelette), prend une bordure gauche de 3 px `--avertissement`, une icône triangulaire et
le mot **« Périmé »** suivi de la phrase de provenance, et une action « Rafraîchir ».
Jamais un fond ambre plein (règle B : l'ambre n'existe qu'en bordure, icône et texte).

**L'état périmé n'est pas une erreur.** Il dit « ceci est vrai, à telle date ». Un écran
qui remplace une donnée ancienne par un vide fait perdre l'information deux fois.

### 1.9 Les six états obligatoires, et la taxonomie des erreurs

Chaque écran de ce document porte la mention de ses états. Les six rendus sont définis
**une fois** ici ; les sections écran ne donnent que ce qui leur est propre.

| État | Rendu | Règle |
|---|---|---|
| **Vide** | les quatre cas du socle : `rien` (aucune donnée), `recherche` (aucun résultat), `horsligne` (données locales seulement), `echec` (le service n'a pas répondu). Icône 32 px `--border-strong` (**jamais or** : il n'y a rien à faire ici) + une phrase vraie construite sur les données + **une** action | Une phrase inventée (« Aucune publication ») quand il y en a sept est interdite |
| **Chargement** | squelettes **à la forme du contenu**, jamais un spinner seul. Les blocs lents **nomment l'étape** (« Extraction des champs — slide 3 sur 7 »), pas « Chargement… » | L'en-tête est peint immédiatement avec les compteurs précédents, jamais un écran blanc |
| **Erreur** | la cause exacte, en clair, **jamais reformulée** : « Template name does not exist in the translation (code 132001) ». Puis trois actions au plus : Réessayer · Voir le journal · Diagnostic | « Une erreur est survenue » est interdit |
| **Partiel** | bandeau ambre : ce qui est arrivé, ce qui manque, et à quand remonte le dernier essai : « 3 sources sur 4 · Facebook n'a pas répondu · dernière tentative 14 h 12 » + « Resynchroniser ». **Ce qui est présenté reste utilisable** | Un bloc manquant ne fait jamais une page blanche |
| **Périmé** | §1.8 | Ne se confond jamais avec l'erreur |
| **Hors ligne** | bandeau neutre `--attente` : « Hors ligne — données locales du 19/09 à 14 h 02. Les actions qui écrivent sont mises en file et partiront à la reconnexion. » | L'outil tourne souvent hors ligne (les polices sont auto-hébergées pour ça) : ce n'est pas une panne |

**Taxonomie des erreurs — quatre cas, quatre phrases, quatre actions.** C'est la leçon
de l'audit UX §2.1 : « Serveur injoignable » s'affichait alors que le serveur répondait
parfaitement, en 500.

| Cas | Phrase | Action |
|---|---|---|
| **Injoignable** | « Le serveur local ne répond pas. » | Réessayer |
| **Erreur serveur** (5xx, ou `ok:false`) | « Le serveur a répondu une erreur : *<cause renvoyée>* » | Réessayer · Journal · Diagnostic |
| **Réponse illisible** (200, champ attendu absent) | « La réponse du serveur n'a pas la forme attendue : *<champ>* manquant. » | Diagnostic |
| **Vide** (200, `ok:true`, zéro ligne) | l'état vide de la ligne 1 du tableau ci-dessus | l'action du cas vide |

Une erreur technique ne se traduit **jamais** en une phrase qui envoie l'utilisateur
chercher au mauvais endroit.

### 1.10 L'alerte — objet de premier ordre (nouveau)

Une alerte n'est pas une notification, ni une tâche, ni une erreur d'écran. C'est **une
chose cassée dans le monde, qui reste cassée jusqu'à ce qu'on la répare**. Elle existe
parce que la chaîne d'envoi WhatsApp est morte douze jours sans que rien ne le dise.

| Champ | Contenu | Règle |
|---|---|---|
| Identité | `(source, cause)` — **dédupliquée** | 1 226 exécutions « Rien à envoyer » produisent **une** alerte, avec un compteur, pas 1 226 lignes |
| Gravité | `bloquant` (rouge) ou `dégradé` (ambre) | Deux niveaux, pas quatre. Le reste est du bruit |
| Source | WhatsApp · Publication · Instagram · Assets · Fournisseur · Divergence · Blog · Diagnostic | La même liste que les cartes de `Système › Chaînes` |
| Cause | **la phrase exacte du système**, jamais reformulée | « (#132001) Template name does not exist in the translation » |
| Diagnostic | ce que ça empêche, en une phrase | « aucun message ne peut partir ; 22 prospects ont été parqués » |
| Compteur | première vue · dernière vue · occurrences | « depuis le 07/09 · 1 226 fois » |
| Action | **une** action primaire, vers l'écran qui répare | « Ouvrir la chaîne » |
| Acquittement | par qui, quand, motif facultatif | « Acquitter » ne répare pas : il range |
| Cycle | ouverte → acquittée → **refermée automatiquement si la cause disparaît** → **réouverte si elle revient** | Une cause qui revient rouvre la même alerte ; elle n'en crée pas une neuve |

**Quatre règles non négociables.**

1. **Une alerte ne s'efface jamais seule.** Aucune durée de vie, aucun `setTimeout`.
2. **Une alerte n'est jamais un toast.** Le toast de 4 200 ms est réservé aux actions
   immédiates et réversibles, et il porte « Annuler » dans ce cas.
3. **Le moteur d'alertes vit côté serveur**, pas dans l'écran — c'est le cron PHP qui
   écrit l'état d'exécution, donc c'est lui qui dérive les alertes. Le dashboard les lit.
   Une alerte qui n'existerait que si l'écran est ouvert serait un mensonge de plus.
4. **Un canal de secours quand un jeton existe** : Telegram, uniquement si
   `bot_token` et `chat_id` sont renseignés (aujourd'hui vides — l'alerte actuelle
   n'arrive nulle part). Le canal principal reste l'écran d'accueil, consulté chaque
   matin.

**Les dix règles de déclenchement.** C'est ce qu'un développeur doit coder, sans en
inventer.

| # | Déclencheur | Gravité | Source | Condition exacte |
|---|---|---|---|---|
| A1 | La chaîne d'envoi ne sort rien alors qu'il y a des éligibles | bloquant | WhatsApp | 3 exécutions consécutives sans envoi **ET** au moins une relance due côté application |
| A2 | Le modèle Meta est refusé | bloquant | WhatsApp | le dernier test du modèle `j0_diagnostic` échoue, quel que soit le code |
| A3 | Parquage | dégradé | WhatsApp · Publication | au moins un prospect ou une publication parqué dans les dernières 24 h |
| A4 | Échec reproductible sur une plateforme | bloquant pour cette plateforme | Instagram | même code d'erreur sur au moins 2 objets **ou** 3 exécutions |
| A5 | Ressource non récupérable par le réseau social | bloquant pour cette plateforme | Assets | le serveur renvoie 5xx sur une URL d'image d'une publication programmée |
| A6 | Divergence local / serveur | dégradé | Divergence | au moins 1 champ **appartenant au serveur** diffère entre les deux lectures |
| A7 | Fournisseur non testé ou en échec | dégradé | Fournisseur | dernier test de plus de 24 h, ou en échec |
| A8 | Index du blog décalé | dégradé | Blog | au moins un article publié sur le site absent de l'index qui alimente la production sociale |
| A9 | Diagnostic en échec | dégradé (bloquant si Playwright ou clé LLM) | Diagnostic | un des quatre contrôles de `#/systeme/diagnostic` échoue |
| A10 | Quota anti-ban atteint avec du travail en attente | dégradé | WhatsApp | quota de l'heure épuisé **et** au moins une relance due |

**A1 est la règle qui aurait sauvé les douze jours.** Elle compare deux vérités — « le
serveur dit qu'il n'y a rien à envoyer » et « l'application dit qu'il y a des relances
dues » — et alerte quand elles se contredisent. C'est un **détecteur de divergence**, et
c'est la règle la plus rentable de tout ce document.

### 1.11 Un champ, un écrivain

La divergence de 20 lignes sur 22 (M1 §2.3) vient de quatre chaînes qui écrivent le même
fichier. Elle devient **structurellement impossible** par la règle suivante, affichée
telle quelle dans `Système › Chaînes` :

| Champ | Écrivain unique | Lecteurs |
|---|---|---|
| `Statut`, `Date_Contact`, `Date_Relance_J3/J7`, `Nombre_Contacts` | Moteur de séquence PHP (serveur) | application, dashboard, cron |
| `Post_ID`, `Erreur`, `Vues`, `Likes`, `Commentaires`, `Partages` | Cron de publication (serveur) | application, dashboard |
| `Statut` (réponses) | Webhook de réponses (n8n) | idem |
| `Texte`, `Hashtags`, `CTA`, `Image_Path` | Application locale, poussée par la synchronisation | serveur |
| `ID` | Le serveur, à la création. **Immuable à vie, jamais réattribué** | tous |

Trois conséquences de conception, écrites dans ce document pour qu'elles ne se perdent pas :

1. **Le CSV local est un cache jetable.** Il ne fait plus jamais autorité sur un champ
   serveur. L'écran lit le serveur à l'ouverture ; la synchronisation (montée et
   descente) est une **transaction** : locale et serveur, ou rien.
2. **Aucun identifiant n'est réattribué.** M4 D1 : `PUB-0004` désignait un texte publié
   et un autre texte jamais publié ; la garde anti-double-publication a protégé
   l'identifiant en sacrifiant la publication. Une régénération crée toujours un
   identifiant neuf.
3. **`Sync serveur` et `Récupérer les statuts` ne sont plus des boutons.** Elles
   deviennent des tâches automatiques, visibles dans le bandeau des tâches quand elles
   tournent, et un bouton « Synchroniser » reste dans le menu de page pour forcer.
   M1 : « un mécanisme correctif que personne n'utilise est une dette ».

---

## 2. L'écran d'accueil — la file du jour

### 2.1 La question, et la règle des dix secondes

Une seule question : **« Qu'est-ce que je finis aujourd'hui ? »**. Une ligne = une
décision, jamais une mesure. Un chiffre n'entre dans la file que s'il demande un geste.

**La règle des dix secondes tient en trois obligations.**

1. **Le titre du jour est peint avant tout réseau** et porte le compte :
   `vendredi 19 septembre — 6 à traiter, dont 2 bloquants`. Le compte est le **chiffre de
   tête `T0` de la vue, et il est unique** (le système visuel réserve le 40 px à ce
   nombre : deux chiffres à 40 px, et aucun n'est le chiffre du jour).
2. **La première ligne est toujours la plus coûteuse à ne pas faire.** Elle se lit avant
   tout défilement, sans survol, sans clic.
3. **Aucun graphique, aucun KPI, aucun entonnoir au-dessus de la ligne 1.** La file
   n'affiche pas le monde : elle affiche ce qu'il faut y faire.

**Peuplement en un seul appel** : `GET /api/aujourdhui` agrège `state`,
`publications/stats`, `etat/taches`, le pull serveur et les alertes. Un seul état de
chargement, un seul bandeau de provenance, pas huit `fetch` en cascade.

### 2.2 Anatomie d'une ligne

| Colonne | Contenu | Règle |
|---|---|---|
| 1 | liseré de gravité, 4 px | rouge = bloquant ou échec · or = décision · neutre = en cours |
| 2 | nature, icône 16 px | publication · prospect · tâche · système |
| 3 | titre, une ligne, tronqué | **le nom de la chose**, pas le nom de l'action |
| 4 | preuve, une ligne `T6` `--soft` | le fait mesuré : « brouillon depuis 4 j, sans visuel », « dû depuis 5 j », « échec 2 sur 3 » |
| 5 | âge ou échéance, `T7` | « aujourd'hui 8 h », « il y a 2 h », « J+3 » |
| 6 | provenance, `T8`, discret | « serveur · lu à 14 h 12 » — **toute ligne dit d'où elle vient** |
| 7 | actions | une primaire (or), une secondaire, un menu `⋯` (Reporter à demain · Ignorer · Copier le lien) |

**Trois résolutions possibles, toutes écrites côté serveur** (`POST /api/etat/vue/aujourdhui`) :

- **Fait** — la ligne disparaît, le compte du titre décrémente, le fond s'éclaircit en
  200 ms. Pas de sortie animée : une décision prise ne se célèbre pas.
- **Reporté** — la ligne disparaît jusqu'à demain 8 h, avec une trace datée consultable
  dans le tiroir de tâches.
- **Ignoré** — la ligne disparaît pour la journée. Le pied de zone affiche « 1 ignoré » :
  la file ne ment pas, elle range.
- **Résolu ailleurs** — la ligne disparaît sans geste parce que la cause a été traitée
  dans un autre écran ; la file se lit à nouveau et la ligne s'en va seule. Aucune
  animation.

**Cap à douze lignes.** Au-delà, chaque zone affiche « et N autres » qui ouvre l'écran
concerné, filtré.

### 2.3 Zone A — Ce qui bloque (liseré rouge, ne se reporte pas)

Une ligne de cette zone **ne se reporte pas** : elle se résout ou elle reste.

| # | Ligne | Source | Condition | Action primaire |
|---|---|---|---|---|
| A1 | Alerte bloquante non acquittée | `/api/alertes?gravite=bloquant` | existe | « Ouvrir la chaîne » |
| A2 | Divergence avec le serveur | comparaison des deux lectures | au moins 1 champ serveur diverge | « Voir la divergence » |
| A3 | Le fournisseur ne répond pas | dernier test | échec, ou non testé depuis 24 h | « Tester » |
| A4 | Quota anti-ban atteint | `S.rate.remaining = 0` | au moins une relance due | « Voir les relances » |
| A5 | Diagnostic en échec | `/api/system-check` | `all_ok = false`, moins de 24 h | « Diagnostic » |

Exemple d'A1, tel qu'il aurait dû s'afficher le 7 septembre :

```
│ La chaîne d'envoi WhatsApp est arrêtée depuis 12 jours              │
│ 22 prospects parqués · 1 226 exécutions sans destinataire · code 132001│
│ depuis le 07/09 · 1 226 fois                    serveur · lu à 8 h 02 │
│ [Ouvrir la chaîne]      [Acquitter]                            ⋯     │
```

### 2.4 Zone B — Ce qui a échoué (liseré rouge atténué)

Tri : **le plus ancien d'abord**. La preuve affichée est **la raison**, jamais « une
erreur est survenue ».

| # | Ligne | Source | Condition | Actions |
|---|---|---|---|---|
| B1 | Publication en échec | `publications` (serveur) | `Statut = echec` | « Réessayer » · « Voir le journal » |
| B2 | Publication abandonnée | `publications_state` (serveur) | parquée après 3 échecs | « Réparer la cause » · « Réessayer » |
| B3 | Visuel refusé par le contrôle | rapport de contrôle | verdict refusé | « Reprendre au champ refusé » |
| B4 | Visuel manquant | disque + contrôle | image absente | « Produire les visuels (n) » |
| B5 | Tâche en échec | `/api/etat/taches` | `etat = echoue`, moins de 24 h | « Voir la tâche » |
| B6 | Prospect parqué par erreur d'envoi | moteur de séquence | parqué dans les 24 h | « Ouvrir la fiche » · « Déparquer » |

La ligne B2 porte le message exact : `Only photo or video can be accepted as media type
(9004/2207052) — image non récupérable depuis api.eperformance.pro/assets_pubs/PUB-0005.png`.
C'est la phrase que l'API a donnée ; elle n'est pas traduite, elle est **expliquée** par
la ligne B3 de la zone A quand elle est reproductible.

### 2.5 Zone C — Ce qui attend une décision (liseré or)

Tri : échéance la plus proche, puis score décroissant, puis ancienneté. **C1 est la
première ligne de tout l'écran** : c'est le défaut le plus grave de l'audit M1 (trois
réponses positives affichées « Froid »).

| # | Ligne | Source | Condition | Actions |
|---|---|---|---|---|
| C1 | **Réponse à traiter** | statut serveur | `Répondu_Positif`, `En_Conversation` | « Ouvrir la fiche » · « Marquer traité » |
| C2 | Relance due | `due_ids` | le prospect est dû | « Ouvrir WhatsApp » · « Reporter à demain » · ⋯ Stopper |
| C3 | Publication à valider | `publications.csv` | `Statut = brouillon` | « Relire » (la plus ancienne) · ⋯ Tout valider |
| C4 | Programmée dans les 3 h | programmees | créneau à moins de 3 h | « Voir » · « Publier maintenant » · « Décaler » |
| C5 | Veille ou fiches périmées | veille / concurrents | veille > 7 j, ou fiche > 90 j | « Lancer la veille » · « Ouvrir la fiche » |
| C6 | Index du blog décalé | plan vs index | au moins 1 article absent | « Régénérer l'index » |

**« Tout valider » n'est jamais armé par défaut.** C3 propose « Relire » : valider sept
publications qu'on n'a pas lues est exactement le geste que l'audit M2 a mesuré (aucun
moyen de relire : 300 caractères, 30 lignes maximum).

### 2.6 Zone D — Ce qui tourne déjà (liseré neutre)

| # | Ligne | Source | Condition | Actions |
|---|---|---|---|---|
| D1 | Tâche en cours | `/api/etat/taches` | toujours | « Reprendre » (ouvre l'écran d'origine) · « Arrêter » |
| D2 | Tâche terminée non acquittée | `/api/etat/taches` | terminée, non vue | « Voir » · « Acquitter » |
| D3 | Brouillon de travail en attente | `/api/etat/brouillons` | écrit depuis plus de 10 min | « Reprendre » · « Jeter » |

Une tâche en cours s'affiche avec **son étape et son temps** : « Génération des
publications — 3 sur 7 · 47 % · 1 min 20 écoulées, 2 min 18 estimées ». L'estimation vient
du journal mesuré (§5.4), jamais d'un texte écrit à la main. Une tâche terminée **reste
affichée jusqu'à acquittement** : c'est là que meurt le toast de 4,2 s.

### 2.7 Pied — État du système (lecture seule, une ligne)

Fournisseur actif et horodatage de son dernier test · quota IA de l'heure · dernière
synchro serveur **avec sa provenance** · volumes (« 22 prospects · 7 publications ·
3 sorties ») · version du moteur et cohérence inter-modules · compte courant.

Aucune action, aucune couleur d'alerte, aucune pastille : ce pied est un état des lieux,
pas une invitation. S'il portait un bouton, il deviendrait une zone A déguisée.

### 2.8 Les six états de la file

| État | Rendu exact |
|---|---|
| **Chargement** | 6 lignes de squelette de hauteur fixe (pas de décalage de mise en page), titre du jour et compte déjà peints |
| **Vide** | « Rien à décider. » puis une phrase **vraie, construite sur les données** : « 7 publications sont programmées, la première demain à 8 h 00. Dernière veille il y a 3 jours. » + une action : « Préparer la semaine » (→ `#/produire/nouveau`) |
| **Erreur** | selon la taxonomie §1.9. Si une seule source interne a échoué, **sa zone** porte l'erreur et les autres s'affichent. Jamais une page blanche pour un bloc manquant |
| **Partiel** | bandeau ambre : « 5 sources sur 6 · la mesure n'a pas répondu · dernière tentative 14 h 12 » + « Resynchroniser ». La file reste utilisable |
| **Périmé** | le pied affiche « Données locales — dernière synchro il y a 12 min » et la zone concernée prend sa bordure ambre + « Rafraîchir » |
| **Hors ligne** | bandeau `--attente` : « Hors ligne — les décisions se prennent, les envois attendent la reconnexion. » Et c'est vrai : les résolutions Fait/Reporté/Ignoré s'écrivent en file d'attente locale et partent à la reconnexion |

### 2.9 Ce qui n'entre jamais dans la file

Un taux de réponse, un taux de conversion, un nombre de followers, un graphique de
performance, un compteur de générations, le coût en dollars. **Ce sont des mesures du
monde, pas des décisions.** Elles vivent dans `Veiller › Performance`. La seule exception
admise est un seuil franchi assorti d'un geste : un quota épuisé, une relance due.

---

## 3. Écran par écran

### 3.1 AUJOURD'HUI — `#/aujourdhui`

Voir §2. C'est la destination par défaut, la seule sans onglets. Aucune autre section ne
la décrit : elle est spécifiée en entier ci-dessus.

---

### 3.2 PRODUIRE — `#/produire/publications`

**Onglets** : `À valider · Programmées · Publiées · Échecs · Archives`.
**Écrans annexes** : Nouveau lot · Atelier · Visuels · Fiche visuel · Planifier · Journal
des sorties · Détail de lot.

#### 3.2.1 En arrivant (onglet À valider)

Le titre `Publications`, à sa droite la ligne de provenance, puis **un seul** bouton
primaire `Nouveau lot`, le compteur en clair (« 7 brouillons · 3 programmées · 3 sorties ·
0 échec »), un menu `⋯`, la barre de sélection (vide tant que rien n'est coché), le
tableau. **Quatre boutons colorés ne reviennent pas** : un primaire, le reste en
secondaire, les icônes portent la catégorie.

**Blocs**

| # | Bloc | Contenu |
|---|---|---|
| 1 | En-tête | titre · provenance · compteur · « Nouveau lot » · menu `⋯` (groupes *Lot* · *Serveur* · *Archive*) |
| 2 | Barre de sélection | apparaît dès une ligne cochée : « 7 sélectionnées · Valider · Programmer · Produire les visuels · Exporter · ⋯ ». **Jamais armée par défaut** |
| 3 | Tableau | `Sélection · ID · Aperçu (vignette 40 px ou carré vide) · Objectif · Pilier · Plateforme · Statut (badge) · Contrôle (score 0-100) · Créneau · Sortie` |
| 4 | Ligne dépliée | le texte complet (jamais tronqué), les hashtags avec leur compte réel / le plafond, le CTA, le visuel, le verdict, et 4 actions : *Ouvrir l'atelier · Éditer · Programmer · Publier maintenant* |
| 5 | Pied de tableau | « 30 sur 214 » quand la liste dépasse — **on ne coupe plus à 30 sans le dire** |

**Ce que la ligne dépliée affiche en plus, et qui n'existait nulle part** : le **contrôle**
(nombre de hashtags réels contre le plafond de la plateforme, longueur réelle contre la
cible, score de contrôle technique, verdict éditorial), parce que M2 a mesuré 16 hashtags
là où 8 sont demandés, une longueur Instagram à 5,6× la cible, et un contrôle qui
n'existait pas du tout sur la chaîne du bouton.

**Par onglet**

- **À valider** — `brouillon`. L'onglet du travail. Une ligne sans visuel porte le badge
  `sans visuel` et l'action primaire devient « Produire le visuel ». Une ligne refusée par
  le contrôle porte `refusée` avec le motif exact en clair et « Reprendre au champ refusé ».
- **Programmées** — groupées par jour, la première surlignée si elle tombe dans l'heure.
  Actions : *Programmer · Décaler · Publier maintenant · Annuler la programmation*.
  **Un bandeau affiche les plafonds réels du serveur et la file résiduelle** : « 7 / jour ·
  2 par plateforme · 30 min entre deux envois — 42 publications en retard sur 49 ». C'est
  la ligne qui manquait : M4 §2.3 montre que 49 publications à la même date deviennent
  invisibles.
- **Publiées** — `Post_ID` en lien sortant, date réelle, **et les quatre compteurs
  sociaux** (Vues, Likes, Commentaires, Partages) qui existent dans le CSV et n'étaient
  affichés nulle part. C'est ici qu'on répond à « est-ce que c'est bien sorti ? ».
- **Échecs** — `echec` et parquées, avec le message exact, le nombre de tentatives, la
  plateforme, et deux actions : « Réessayer » (uniquement les unités en échec) ·
  « Réparer la cause » (mène à `#/systeme/chaines?<plateforme>`). **Jamais de troncature
  à 2 échecs détaillés.**
- **Archives** — deux sous-onglets : *Anti-répétition* (ce qui a déjà été écrit, avec
  les valeurs déjà employées) et *Sorties*. Actions : parcourir, exporter le mois, et
  **vider l'archive** (zone dangereuse de `Préférences`, saisie du nombre).

**Actions de page** (menu `⋯`) : Synchroniser (forcé) · Récupérer les statuts · Voir le
journal · Diagnostic. **« Sync serveur » et « Récupérer les statuts » ne sont plus des
boutons permanents** : ce sont des tâches automatiques (§1.11).

**États**
- *Vide (À valider)* : « Aucune publication en attente. 3 sont programmées, la première
  demain à 8 h 00. » + « Nouveau lot ».
- *Vide (Publiées)* : « Rien n'est encore sorti. » + « Voir les programmées ».
- *Chargement* : 6 lignes squelettes, en-tête déjà peint avec les compteurs précédents.
- *Erreur* : taxonomie §1.9 ; la liste précédente reste affichée si un chargement a réussi.
- *Partiel* : le compteur vient du serveur et la liste du cache local → l'en-tête est
  chiffré, le tableau porte « Dernière liste connue, 14 h 12 ».
- *Périmé* : pull serveur de plus de 15 min → bandeau ambre + « Récupérer les statuts ».
- *Hors ligne* : la liste s'affiche, les actions d'écriture se mettent en file.

#### 3.2.2 `#/produire/nouveau` — Nouveau lot

Un formulaire à cinq champs, préremplis. **Il remplace « Générer 7 pubs », « Calendrier
7j », « Générer post complet » et « Calendrier hebdomadaire »** — quatre boutons pour un
seul geste.

| Champ | Valeurs | Défaut |
|---|---|---|
| Combien | 1 · 7 · 49 | 7 |
| Objectif | notoriété · crédibilité · engagement · conversion · rétention | variés |
| Piliers | variés · un seul, au choix (parts réelles affichées, **sommant à 100**) | variés |
| Plateformes | Instagram · Facebook · LinkedIn · WhatsApp (cases ; **une plateforme dont le dernier test échoue est décochable mais grisée avec sa raison**) | celles dont le test est vert |
| Quand | maintenant · ce soir 18 h · demain 8 h · à partir du… | demain 8 h |

Puis **un aperçu de ce qui va être produit**, en une phrase construite :
« 7 publications, 1 par jour à 8 h 00, piliers variés, 2 par plateforme —
**7 appels LLM au nominal, 15 au maximum**, durée estimée 1 min 22 (mesure du 18/09 :
19,7 s par publication) ». Le coût et la durée sont **affichés avant**, depuis le journal
mesuré.

**Une action** : « Lancer ». Elle crée une tâche et renvoie à la liste ; **le bouton ne
bloque jamais** (M2 : 38 s de `fetch` synchrone, 5 min pour 49 sans progression).

**États** : *vide* impossible (formulaire prérempli) · *chargement* : les plateformes
vertes arrivent en un appel ; le reste est utilisable · *erreur* : le test des plateformes
échoue → toutes les cases restent cochables avec la mention « état non vérifié » ·
*partiel* : 3 plateformes testées sur 4 → la quatrième porte « test indisponible » ·
*périmé* : dernier test de plateforme > 24 h → mention « testé il y a 2 j » sur la case.

#### 3.2.3 `#/produire/atelier/<ID>` — l'atelier d'une publication

Deux colonnes : le texte à gauche, le visuel et les verdicts à droite. Quatre onglets
dans l'URL : `?texte` (défaut) · `?visuel` · `?verdict` · `?sortie` (si publiée).

**Colonne gauche** : le texte en édition en place, **brouillon écrit à la frappe** côté
serveur (pas de bouton Enregistrer, pas de perte au rafraîchissement), les hashtags avec
leur compte réel et le plafond de la plateforme, le CTA, la longueur réelle contre la
cible.

**Colonne droite** : le visuel, la **bande de slides** (un carrousel en a jusqu'à 7) avec
le score de chaque slide, le bouton `Produire le visuel` / `Reprendre au champ refusé`, et
le bouton `Vidéo` avec son sélecteur d'animation à vignettes.

**Onglet Verdict** — c'est l'écran qui n'existait pas : le **contrôle technique** (8
postes pondérés, score sur 100, seuil 70) et le **verdict éditorial** (5 critères sur 20),
côte à côte, avec les manques écrits en clair (« le texte occupe 40,4 % de l'image,
maximum 30 % ») et **un verdict par slide**, pas un seul pour le carrousel. Règle de
décision : un dépassement franc d'un critère individuel **refuse** la publication, il ne
se dilue pas dans une note globale (M3 §4.3 : 40,4 % pour un maximum de 30 % accepté avec
90/100). Les deux verdicts doivent passer pour que la publication soit publiable.

**Onglet Sortie** — pour une publication publiée : `Post_ID`, l'URL, l'horodatage réel,
les quatre compteurs sociaux, l'écart entre l'heure prévue et l'heure réelle, et le
nombre d'essais réellement consommés.

**Actions** : Valider · Programmer · Publier maintenant · Régénérer avec consigne ·
Rejeter et motiver · Copier le lien. Le raccourci `Échap` ferme l'atelier sans rien
perdre : **le brouillon est écrit à la frappe**.

**États** : *vide* — une publication sans visuel affiche « Aucun visuel. Le gabarit
choisi sera G3 (citation) — décision du moteur, pas de l'écran. » · *chargement* —
l'étape nommée (« Extraction des champs — slide 3 sur 7 »), jamais « Chargement… » ·
*erreur* — la cause exacte du refus, reprise du verdict · *partiel* — un carrousel dont 5
slides sur 7 sont rendues → les 2 manquantes apparaissent en emplacement vide avec
« Relancer cette slide » · *périmé* — un verdict de plus de 90 jours porte « verdict du
12/06, le visuel a changé depuis » et propose de rejouer le contrôle.

#### 3.2.4 `#/produire/visuels` — la file des visuels (nouveau)

**Ce que l'utilisateur voit en arrivant** : une liste, une vignette par publication, et
pour chacune : plateforme, gabarit, **score de contrôle**, **état** (produite · refusée ·
absente · périmée), et le nombre de slides contrôlées sur le total.

**Pourquoi cet écran existe** : le même lot produisait deux chartes selon le bouton
cliqué. Ici il n'y a **qu'un bouton**, « Produire », et une seule chaîne : le gabarit
décidé par l'objectif et la plateforme. Le contrôle est double — technique et éditorial —
et il porte sur **chaque slide**.

**Blocs**

| # | Bloc | Contenu |
|---|---|---|
| 1 | Filtres en puces | Tous · Absents · Refusés · À revoir (verdict > 90 j) |
| 2 | Tableau | vignette · ID · plateforme · gabarit · slides contrôlées / total · score · état · `⋯` |
| 3 | Barre de sélection | « 12 sélectionnées · Produire · Reproduire (case « recréer ») · Exporter » |
| 4 | Pied | temps écoulé contre temps estimé, depuis la mesure : « 12 visuels · 4 min 02 écoulées · 4 min 12 estimées » |

**Deux détails qui corrigent des défauts mesurés.**
- **La détection d'existence connaît les noms de la chaîne gabarits**
  (`{id}-{gabarit}-{plateforme}.png`) : M3 F2 montre qu'un visuel existant n'était pas
  reconnu et était repayé.
- **Le récapitulatif des échecs est complet.** Le bouton `Produire` annonce avant de
  partir : « 12 visuels · 8 publications × 7 slides = 56 images · les 56 seront notées ».
  Et l'échec liste **tous** les objets concernés, jamais les deux premiers.

**États** : *vide* — « Aucune publication à illustrer. » + « Voir À valider » · *chargement*
— lignes squelettes avec vignette grise · *erreur* — le disque ou le contrôleur ne répond
pas → cause + « Diagnostic » · *partiel* — 8 scores sur 12 → les 4 autres portent
« contrôle non exécuté » et la sélection reste possible · *périmé* — un visuel plus vieux
que son texte porte « le texte a changé après le visuel » + « Reproduire ».

#### 3.2.5 `#/produire/visuels/<ID>` — fiche visuel (nouveau)

**Ce que l'utilisateur voit en arrivant** : l'image en grand, sa vignette « test du
pouce », et **le rapport de contrôle déplié**.

**Blocs**

1. **L'image**, à sa résolution réelle, avec sa taille et son poids.
2. **La bande de slides** — une vignette par slide, **avec son score individuel**.
   Sélectionner une slide change le rapport affiché (l'adresse prend `?slide=n`, donc la
   slide est partageable). C'est la correction de M3 F3 : 68 % des images d'un lot sont
   des slides de carrousel et n'étaient jamais notées.
3. **Le rapport technique** : les 8 postes et leurs points (palette 20, contraste 20,
   tailles 15, logo 10, occupation 10, émoji 10, pouce 10, chevauchement 5), chaque
   manque écrit en clair. Un dépassement de critère est **affiché comme un refus**, pas
   comme 10 points perdus.
4. **Le verdict éditorial** : angle · accroche · promesse · répétition à l'échelle du lot
   · utilité, chacun sur 20, avec la phrase du juge.
5. **Les faits de production** : nombre d'essais réellement consommés, jetons consommés
   (la seule base de coût honnête — aucun tarif en dollars n'est adossé à une source),
   durée mesurée, gabarit employé et **pourquoi ce gabarit** (décision déterministe par
   empreinte du texte, donc reproductible : rejouer le lot redonne les mêmes images).

**Actions** : Reproduire · Reprendre au champ refusé · Télécharger · Épingler au lot ·
Copier le lien.

**États** : *vide* — publication sans visuel → « Produire » · *chargement* — l'image
arrive en dernier, le rapport avant, avec l'étape nommée · *erreur* — « Le rendu a refusé
la publication après 5 essais : *trop générique — aucun chiffre, aucune question, aucun
contraste* » + « Reprendre avec consigne » · *partiel* — 5 rapports sur 7 → les 2 slides
manquantes sont marquées et relançables individuellement · *périmé* — rapport antérieur à
la dernière modification du gabarit → « rapport du 12/06, gabarit modifié depuis » +
« Rejouer le contrôle ».

#### 3.2.6 `#/produire/planifier?ids=…` — Programmation d'un lot (nouveau)

**Ce que l'utilisateur voit en arrivant** : la liste des publications sélectionnées, une
ligne par publication, et **un créneau par ligne** — plus un seul `prompt()`.

**Blocs**

1. **Le rythme**, en puces : *Toutes les 30 min à partir de…* · *1 par jour à…* ·
   *Une date unique*. Un **curseur d'écart** (5 à 120 min) remplace le « tapez 1, 2 ou
   3 ».
2. **Les contraintes du serveur, affichées** : 7 envois par jour, 2 par plateforme,
   30 min entre deux envois. Quand la sélection dépasse les plafonds, l'écran le dit et
   propose : « 49 publications, plafond 7 par jour → la dernière sortirait le 26/09.
   Réduire à 14 ou étaler sur 7 jours ? »
3. **La liste** : une ligne par publication, son créneau prérempli et modifiable, sa
   plateforme, et une colonne « test » qui grise une plateforme dont le dernier essai a
   échoué (Instagram, tant qu'un test n'est pas vert).
4. **Le récapitulatif** : « 7 publications · 3 Instagram · 2 Facebook · 2 LinkedIn ·
   demain 8 h 00 → demain 11 h 00 · **le serveur recevra les 7 dans le même geste** ».

**Une action** : « Confirmer ». Elle écrit local **et** serveur dans la même transaction,
puis lance la synchronisation en tâche. Le bouton devient « Confirmer » en deux temps
pour un remplacement destructeur (le mode « 49 publications remplacent les 7 actuelles »),
**et la sauvegarde est prise automatiquement avant**.

**États** : *vide* — aucune sélection → « Choisissez des publications dans la liste » ·
*chargement* — les créneaux se calculent, le reste est utilisable · *erreur* — le serveur
refuse une date → la ligne fautive passe en rouge avec la raison et **la transaction
n'est pas partielle** : rien n'est écrit · *partiel* — Instagram non testée → grisée avec
« test requis » · *périmé* — les plafonds affichés viennent d'un cache de plus de 24 h →
mention « plafonds non relus depuis 24 h ».

#### 3.2.7 `#/produire/journal` — Journal des sorties (nouveau)

**Ce que l'utilisateur voit en arrivant** : la liste horodatée des tentatives, la plus
récente en haut, filtrable par plateforme, par statut et par période. Chaque ligne :
horodatage · publication · plateforme · tentative · résultat · cause exacte.

**Pourquoi cet écran existe** : le journal serveur existait (`publications.log`) et
n'était affiché nulle part. C'est le seul endroit où une panne se lit.
**Une action en pied de chaque ligne** : « Ouvrir la chaîne » quand la cause est
reproductible, « Ouvrir la fiche » quand c'est une erreur de contenu.

**États** : *vide* — « Aucune tentative enregistrée. » + « Voir les programmées » ·
*chargement* — 20 lignes squelettes · *erreur* — le journal est côté serveur, un échec de
lecture dit lequel · *partiel* — « 18 entrées sur 20, la dernière page n'a pas répondu » ·
*périmé* — plus de 15 min sans relecture → bandeau ambre + « Relire ».

#### 3.2.8 `#/produire/lot/<tache>` — Détail d'un lot

Le lot comme objet : ses publications, son avancement unité par unité (publié, pilier,
plateforme, agent, durée, jetons), son journal lignes par lignes, et ses actions
« Interrompre » / « Reprendre les unités restantes ». C'est ici que s'affiche le résultat
partiel — « 4 publications générées avant l'échec » — au lieu d'un toast.

**États** : voir §5.5.

#### 3.2.9 Le sort des 17 `prompt()` et `confirm()` du module Publication

M4 compte **4 `prompt()` et 13 `confirm()`** dans le seul module Publication (17), sur 22
dans tout le fichier. Aucun ne survit.

| Dialogue | Nombre | Destination |
|---|---|---|
| `prompt()` date unitaire | 1 | Panneau de programmation, champ date avec trois créneaux proposés |
| `prompt()` date de base, mode (« tape 1, 2 ou 3 »), incrément | 3 | `#/produire/planifier` : rythme en puces, curseur d'écart, inventaire des plafonds |
| `confirm()` calendrier 7 jours (remplace tout) | 1 | Écran de programmation, mode « remplacer » en deux temps **avec sauvegarde automatique** |
| `confirm()` « toutes les images » / « recréer images » | 2 | Un seul bouton « Produire » ; « recréer » devient une case |
| `confirm()` publier maintenant | 1 | Confirmation en deux temps sur place, puis **le verdict** (succès, échec, cas inattendu) affiché durablement |
| `confirm()` sync serveur · récupérer les statuts | 2 | Disparaissent : les deux opérations sont automatiques et deviennent des tâches |
| `confirm()` reprogrammer les échecs · archiver · vidage d'archive ×2 | 4 | Confirmation en deux temps ; les deux vidages partent en **zone dangereuse** de `Préférences`, avec saisie du nombre |
| `confirm()` supprimer une publication · tout supprimer | 2 | Suppression unitaire : deux temps sur la ligne. Suppression totale : zone dangereuse, avec saisie du nombre |

**Règle générale** : un `prompt()` de navigateur est toujours remplacé par **un champ
dans un écran**, jamais par une boîte maison. Une **confirmation en deux temps** (le
bouton devient « Confirmer », mode destructif, 6 s) remplace un `confirm()`. Un `confirm()`
qui demande de choisir entre « OK » et « Annuler » pour supprimer des images est
exactement le dialogue qu'on supprime.

---

### 3.3 ACQUÉRIR — `#/acquerir/pipeline`

**Onglets** : `Pipeline · Réponses · Séquence · Sources · Hygiène`.
**Panneau latéral** : la fiche prospect (trois onglets).

#### 3.3.1 En arrivant (Pipeline)

La barre de filtres en puces avec compteurs (Tous · À relancer · Nouveaux · Contactés ·
Réponses · À recontacter · Ne plus contacter), un champ de recherche, un tri (Score ·
Ancienneté · Dernier contact), la grille de cartes, et **un seul** bouton primaire
« Nouveau prospect ». Ni KPI, ni entonnoir en haut : l'entonnoir monte dans le bandeau de
l'onglet, sous forme d'une **barre de répartition unique et cliquable** (cliquer un
segment filtre la liste).

**Ce que la conception corrige, et c'est le cœur du problème d'acquisition.**

1. **« Froid » disparaît comme valeur unique.** M1 F2 : « Froid » était à la fois « a
   échoué trois fois » et « à réactiver dans 30 jours », et comme aucun des deux n'ouvre
   d'action, 20 cartes sur 22 n'offraient rien. Deux états distincts les remplacent :
   **« à recontacter »** (avec sa date due) et **« échec d'envoi »** (avec sa cause).
2. **Le statut n'est pas un menu.** Dix valeurs brutes exposées à l'utilisateur, dont
   quatre produisent un état sans action, disparaissent des cartes au profit d'**actions
   nommées** : « J'ai envoyé le premier message » · « Il a répondu oui » · « Il a répondu
   non » · « Ne plus contacter » · « Reporter ». La machine à états reste interne.
3. **Une carte sans action est impossible.** Tout état produit soit une action, soit une
   explication (« en attente : J+3 dans 2 jours »). C'est une contrainte de construction,
   vérifiable : si une carte n'a ni action ni texte d'attente, elle ne se construit pas.
4. **La salutation est un choix explicite.** M1 U1 : un message sur deux partait avec un
   faux prénom (« Salut Longrich, », « Salut BIEN, » — 9 sur 18). Le nom de page n'est
   jamais employé comme prénom ; la fiche propose « Bonjour » par défaut et le prénom
   **seulement s'il est saisi ou déduit d'un contact `.vcf`**.

**La carte prospect** (hauteur fixe 168 px, trois zones) :

```
┌─────────────────────────────────────────┐
│ 78  Fatou Ouedraogo      ● Aujourd'hui  │   pastille or + le mot
│ ─────────────────────────────────────── │
│ +226 70 12 34 56 · Ouagadougou · Beauté │
│ Relancé J+3 il y a 4 jours · 2 envois   │
│ ─────────────────────────────────────── │
│ [Relancer sur WhatsApp]     [Fiche]     │
└─────────────────────────────────────────┘
```

La carte à relancer porte **l'or**, plus trois indices non chromatiques : bordure 2 px,
pastille d'échéance, mot. Le vert reste réservé à « confirmé par WhatsApp ».

**La fiche prospect** — panneau latéral de 380 px, la liste reste visible et utilisable
derrière. Trois onglets, chacun son adresse :

| Onglet | Contenu | Ce qu'il remplace |
|---|---|---|
| **Fiche** (`?fiche`) | champs éditables en place (nom, ville, secteur, followers, pub active, site web, email, notes), statut, historique des envois (séquences et dates), **le journal des messages réellement envoyés** (quel message, quand, par quel canal, avec quel résultat), lien de page, et **« Salutation »** | l'édition du numéro par `prompt()` et la carte muette |
| **Qualification** (`?qualification`) | le verdict : score, priorité, raisons **détaillées par critère**, ICP fit, et la date du verdict. Lancé une fois, **mis en cache** (aujourd'hui chaque clic rappelait la route et renvoyait le score déjà affiché : 0 information) | `qualOverlay` |
| **Messages** (`?messages`) | les variantes, **le texte exact affiché avant toute action**, l'analyse psychologique repliée, le choix d'une variante, et la séquence en puces (J0 · J+3 · J+7 · Réactivation) | `msgOverlay` |

**Pied du panneau** : `Envoyer sur WhatsApp` (primaire) · `Reporter` · `Stopper les
relances`. Le menu `⋯` porte **« Marquer comme envoyé sans ouvrir WhatsApp »** — le cas
où il a écrit depuis son téléphone.

> **Correction assumée de la proposition de l'audit M1.** L'audit demandait deux boutons
> distincts, « Aperçu » et « Marquer comme envoyé ». La conception tranche autrement :
> l'aperçu **n'est pas un bouton, c'est l'état par défaut de l'onglet Messages** — le
> texte exact est à l'écran avant que le bouton existe. Ce qui répond au défaut mesuré
> (F4 : marquer un contact qu'on n'a pas eu) sans ajouter un clic qui serait cliqué à
> l'aveugle. Et l'envoi est **réversible 8 s** (`Ctrl+Z`), avec la ligne d'annonce
> « Envoyé — annuler ».

**États du Pipeline**
- *Vide* : « Aucun prospect. » + « Importer » (mène aux Sources).
- *Recherche sans résultat* : « Aucun prospect pour "…" » + « Effacer la recherche », et
  **le filtre actif est rappelé** en clair.
- *Chargement* : 6 cartes squelettes de hauteur fixe.
- *Erreur* : taxonomie §1.9 ; la grille précédente reste affichée.
- *Partiel* : les cartes viennent du serveur, les qualifications du cache → l'onglet
  Qualification porte « verdict du 12/06 » et les autres fonctionnent.
- *Périmé* : la dernière lecture serveur a plus d'une heure → bandeau ambre « lu il y a
  1 h 12 » + « Relire ». Et **le bandeau de divergence** s'affiche si un champ serveur
  diffère du cache : « 5 lignes diffèrent du serveur · la version serveur fait foi ·
  Comparer · Appliquer ».
- *Hors ligne* : les cartes s'affichent depuis le cache, l'envoi se met en file.

#### 3.3.2 `#/acquerir/reponses` — Réponses (nouveau)

**Ce que l'utilisateur voit en arrivant** : les prospects qui ont répondu, **réponse
positive en tête**, avec le message reçu, l'historique de la séquence, l'ancienneté de la
réponse, et **le décompte en tête d'onglet**.

**Pourquoi cet écran existe** : trois prospects ont répondu favorablement et l'interface
les affichait « Froid, jamais contacté ». Le taux de réponse affiché était de 0,0 % quand
le taux réel était de 5 sur 18, soit 27,8 %. Un écran dont la raison d'être est de ne
plus jamais perdre une réponse positive mérite son onglet, son compteur et son URL.

**Blocs** : (1) le bandeau de vérité — « 5 réponses sur 18 contactés » avec **la base de
calcul affichée**, jamais un pourcentage seul ; (2) la liste, groupée *Positives* ·
*En conversation* · *Négatives* ; (3) chaque ligne : nom, score, date de réponse, extrait
du message reçu, et le lien vers la fiche.

**Actions** : Ouvrir la fiche · Marquer traité · Snooze 3 jours · Ne plus contacter.

**États** : *vide* — « Aucune réponse enregistrée. 18 prospects contactés, la première
relance part demain. » (une phrase vraie, pas « Aucun élément ») · *chargement* —
lignes squelettes · *erreur* — le webhook n'a rien écrit depuis X → **c'est une alerte**,
pas seulement une erreur d'écran · *partiel* — le compteur vient du serveur et la liste
du cache → les deux chiffres affichés côte à côte · *périmé* — plus d'une heure.

#### 3.3.3 `#/acquerir/sequence` — Séquence (nouveau)

**Ce que l'utilisateur voit en arrivant** : les quatre étapes du moteur (J0 · J+3 · J+7 ·
Réactivation), et pour chacune : le texte type, ses variables, **le nombre de prospects
qui la recevront cette semaine**, et une prévisualisation avec un prospect réel.

**Les trois blocs qui n'existaient pas**

1. **L'état d'approbation Meta, par modèle.** C'est le bloc qui aurait évité douze jours
   d'arrêt : pour chaque modèle, son nom exact, la langue déclarée, et son état
   (**approuvé · refusé · introuvable**), le dernier test et son code d'erreur. Un modèle
   non approuvé **bloque la séquence avec un message clair**, au lieu de parquer la base
   entière en silence. Cette information vit dans Meta Business Manager et rien dans le
   dépôt ne peut la créer : l'écran **teste** et **dit**, il ne prétend pas déployer.
2. **La cadence, réglable.** Les délais 3 / 4 / 30 jours étaient codés en dur et
   inaccessibles. Ils deviennent trois champs avec leurs valeurs par défaut, un avertissement
   quand on descend sous 48 h, et une trace de la modification.
3. **Le journal par prospect.** Quel message, quand, par quel canal, avec quel résultat.
   Aujourd'hui `Nombre_Contacts` et `Date_Contact` sont la seule trace, et elle est fausse
   localement.

**Actions** : Tester le modèle · Modifier la cadence · Voir le journal filtré · Arrêter
les relances pour un prospect (depuis sa fiche).

**États** : *vide* — « Aucune séquence armée » + « Activer J0 » · *chargement* — le test
Meta tourne, l'étape nommée (« Test du modèle j0_diagnostic… ») · *erreur* — la cause Meta
exacte, jamais un « échec du test » · *partiel* — 2 modèles testés sur 4 · *périmé* —
dernier test de plus de 24 h → « testé il y a 2 j » avec le bouton de test.

#### 3.3.4 `#/acquerir/sources` — Sources (les trois entrées)

**Ce que l'utilisateur voit en arrivant** : trois puces, **dans l'ordre du rendement
mesuré**, et un seul formulaire affiché à la fois.

| Ordre | Entrée | Rendement mesuré | Ce que l'écran en dit |
|---|---|---|---|
| 1 | **Contacts `.vcf`** | la seule source qui apporte un téléphone par construction | « Importez votre répertoire : c'est la seule entrée qui apporte un numéro utilisable. » |
| 2 | **Cartes et commerces (OSM)** | 60 éléments, **2 téléphones (4 %), 3 sites web (6 %)** | « Après la recherche, l'écran affiche le taux réel : *2 numéros sur 52* — jamais une promesse non mesurée. » |
| 3 | **Pages qui diffusent des publicités (Ads Library)** | **aucun téléphone par construction** | « Ces pages n'ont jamais de numéro dans l'API. Traitez-les comme une liste de pages à qualifier, pas comme un pipeline. » |

**Le formulaire et les résultats coexistent** : on ne perd pas les résultats en changeant
de mode. Sous le formulaire, **la revue avant import** — qui remplace les cases
pré-cochées :

| Sélection | Nom | Téléphone | Ville | Secteur | Indice (pub active, followers) | Doublon |
|---|---|---|---|---|---|---|
| ☐ | … | **champ éditable sur la ligne** | … | … | … | oui/non |

**Trois règles de cet écran.**

1. **Le numéro se saisit dans le tableau**, jamais dans un `prompt()` un par un. M1 U3 :
   60 résultats OSM = 120 clics et 60 saisies par boîte de dialogue native.
2. **Un compteur de complétion visible** : « 12 candidats · 3 exploitables · 9 sans
   numéro ». Un import de lignes inutilisables est annoncé comme tel, pas découvert après.
3. **Une seule action par état** : « Importer les 3 exploitables » quand il y a des
   doublons et des incomplets, « Importer la sélection » sinon. L'import se fait en tâche.

**États** : *vide* — « Aucun candidat. Choisissez une source et lancez la recherche. » ·
*chargement* — le nom de la source et le nombre attendu (« Carte et commerces —
60 résultats maximum ») · *erreur* — la source externe ne répond pas (Overpass, Nominatim,
Meta) → cause réseau exacte + « Réessayer », et **les résultats déjà là restent** ·
*partiel* — 52 sur 60 éléments → « 8 éléments sans nom, écartés » · *périmé* — un jeu de
résultats de plus de 24 h porte « recherche du 18/09 » + « Relancer ».

#### 3.3.5 `#/acquerir/hygiene` — Hygiène du pipeline (nouveau)

**Ce que l'utilisateur voit en arrivant** : un rapport, en une vue, de ce qui pourrit.

| Bloc | Contenu mesuré |
|---|---|
| Colonnes mortes | celles jamais remplies, avec les points qu'elles rapportent ou qu'elles font perdre : `Email` valait +5 points et n'était atteignable par aucun champ ; `A_Site_Web` valait « Non » sur 22 lignes sur 22, donc **+20 points mécaniques sur 100 %** et le plancher réel du score était 35 |
| Lignes de test | marquées explicitement, **exclues des compteurs par défaut**, et supprimables (4 lignes sur 22 portaient « test » et c'étaient les seules actionnables) |
| Numéros non normalisés | `22674005963` contre `+226…` — la normalisation est appliquée **à l'écriture**, pas proposée |
| Noms non exploitables | Unicode mathématique, numéro de téléphone dans un champ de nom de page |
| Incohérences | `Nombre_Contacts > 0` sans `Date_Contact`, statut sans action possible, doublons |
| Score | le barème affiché en clair, et **le score recalculé** quand une donnée qui le nourrit change (aujourd'hui il est figé à la création) |

**Actions** : Normaliser les numéros · Corriger les noms illisibles · Supprimer les
lignes de test (deux temps) · Recalculer les scores.

**États** : *vide* — « Aucun défaut de cohérence. » avec la date du dernier contrôle ·
*chargement* — lignes squelettes · *erreur* — le calcul échoue, la cause est dite ·
*partiel* — « 5 contrôles sur 6 exécutés » · *périmé* — plus de 7 jours.

---

### 3.4 VEILLER — `#/veiller/concurrents`

**Onglets** : `Concurrents · Idées · Performance`.

#### 3.4.1 En arrivant (Concurrents)

La liste des concurrents analysés — **persistée**, ce qui n'était pas le cas : le résultat
vivait dans un `<div>` et mourait au rechargement, et aucun concurrent n'était suivi.
Chaque ligne : nom, niche, date d'analyse, dimensions renseignées sur 7, et un état
(**à compléter · analysé · périmé de plus de 90 jours**).

**Ce que la conception ajoute, et pourquoi.** `/api/analyze-competitor` est un
**générateur de grille à partir d'un nom saisi**, pas une observation : il ne collecte
rien sur un tiers. La fiche distingue donc deux couches, nommées à l'écran :

- **Déclaré** — les 7 dimensions saisies, chacune avec trois états par dimension :
  `vide` · `hypothèse` · `vérifié`, et la date de la vérification.
- **Vérifié** — ce que l'outil peut réellement contrôler sans toucher au tiers : la page
  existe-t-elle, publie-t-elle, et **est-elle dans la bibliothèque publicitaire Meta**
  (la route existe déjà et n'était branchée nulle part). Chaque dimension vérifiable
  porte un bouton « Vérifier » qui lance une tâche courte et écrit `vérifié` **ou**
  « non vérifiable depuis cet outil ». Une dimension non vérifiable reste `hypothèse` :
  c'est dit, pas maquillé.

**Blocs** : (1) en-tête — « Analyser un concurrent » (nom, niche préremplie, URL : les
trois champs sobres qui fonctionnaient déjà) et « Comparer deux fiches » ; (2) la liste ;
(3) la comparaison à deux, dimension par dimension ; (4) **Opportunités ePerformance**,
conservées avec la fiche, avec « En faire une publication » qui ouvre `#/produire/nouveau`
prérempli du pilier et du sujet.

**Actions** : Analyser · Vérifier une dimension · Comparer · En faire une publication ·
Rejouer l'analyse · Copier le lien de la fiche.

**États** : *vide* — « Aucun concurrent analysé. » + « Analyser un concurrent » ·
*chargement* — squelettes de barres · *erreur* — cause + « Réessayer » · *partiel* — les 7
dimensions sont arrivées, les opportunités non → « Opportunités indisponibles, réessayer » ·
*périmé* — plus de 90 jours : la fiche reste lisible, marquée « périmé », avec « Rejouer
l'analyse ».

#### 3.4.2 `#/veiller/idees` — Idées

**Ce que l'utilisateur voit en arrivant** : les suggestions de la veille — titre, pilier,
source, score de niche, **le résumé et le lien** (calculés et jamais affichés jusqu'ici),
et deux actions par ligne : « Utiliser » (ouvre `#/produire/nouveau` prérempli du sujet)
et « Écarter » (mémorisé, l'idée ne revient pas).

**Trois corrections mesurées**
1. **Le pays** : la veille était forcée sur le Burkina Faso alors que l'agence est à
   Abidjan. Elle interroge `CI` et `BF` par défaut, et le pays est affiché.
2. **La mémoire** : aucun résultat n'était conservé entre deux veilles. Chaque passe est
   datée, conservée, et l'écran dit « dernière veille il y a 9 jours » avec son bouton.
3. **La durée** : 49 secondes bloquantes sans progression. Elle devient une tâche, avec
   l'étape nommée (source interrogeable, nombre de requêtes), et **elle ne bloque rien**.

**États** : *vide* — « Aucune suggestion. Dernière veille il y a 9 jours. » + « Lancer la
veille » · *chargement* — nom de la source et compteur de requêtes · *erreur* — quelle
source a échoué (Google News, Reddit, Medium, Hacker News) et les autres résultats
restent · *partiel* — « 3 sources sur 4 » · *périmé* — plus de 7 jours.

#### 3.4.3 `#/veiller/performance` — Mesure

**Ce que l'utilisateur voit en arrivant** : le tableau de mesure **chargé à l'ouverture**,
sans bouton « Actualiser ».

**Les quatre blocs, dans cet ordre**
1. **Ce qui est sorti** : le nombre de publications réellement publiées, la période, et
   **par plateforme** — la donnée qui manquait le plus (le module ne montrait aucune
   performance sociale alors que les quatre compteurs étaient dans le CSV).
2. **L'engagement par publication publiée** : Vues · Likes · Commentaires · Partages, avec
   leur date de relevé et **leur provenance** (le cron serveur, pas le cache local).
3. **Par pilier et par agent** : les volumes réels. L'indexation sur la chaîne
   `"Agent:"` disparaît : elle ne correspondait plus au format réel
   (`deepseek · Instagram Curator · FAB`) et rendait le bloc structurellement vide.
4. **Coût et durée** : **jetons mesurés**, jamais des tarifs écrits à la main. Le suivi de
   génération est branché sur la génération de publications (il ne l'était que sur deux
   routes d'image, d'où un compteur à zéro alors que 234 publications avaient été
   produites). Durée moyenne **mesurée** (19,7 s sur 16 publications) et non annoncée.

**États** : *vide* — « Aucune publication sortie sur la période. 3 sont programmées. » ·
*chargement* — squelettes de barres · *erreur* — cause + « Réessayer » · *partiel* — « les
métriques sociales de LinkedIn n'ont pas été relevées depuis 3 jours », les autres blocs
s'affichent · *périmé* — mesure de plus de 24 h → « mesure du 18/09 à 04 h 45 ».

---

### 3.5 SYSTÈME — `#/systeme/fournisseur`

**Onglets** : `Fournisseur · Chaînes · Compétences · Apparence · Préférences · Journal`.
**Pages hors onglets** : `Diagnostic`, `Alertes`.

#### 3.5.1 Fournisseur — matrice usage × fournisseur

**Ce que l'utilisateur voit en arrivant** : un tableau, pas une liste de cartes.

| Usage | Fournisseur servi | État testé | Dernier appel | Modèle |
|---|---|---|---|---|
| Texte des publications | DeepSeek | testé il y a 4 min · 320 ms | il y a 12 min | `deepseek-flash` |
| Champs des visuels | DeepSeek | testé il y a 4 min · 298 ms | il y a 1 h | `deepseek-chat` |
| Prospection (compétences locales) | moteur local, sans appel | — | il y a 3 j | — |
| Conversation (noyau) | cascade : DeepSeek → GLM → Claude | palier 1 seul disponible | — | — |

**Pourquoi une matrice et non un registre unique.** M5 §4.2 a montré que le toolkit est
mono-fournisseur et que le noyau en a trois, avec une cascade délibérée. Un « registre
unique » écraserait cette différence au lieu de la dire. La matrice tranche : **un écran,
quatre usages, et pour chacun le fournisseur réellement servi avec son état testé.** Un
fournisseur non disponible n'est pas caché : sa ligne affiche **la raison** (« clé absente
dans `config_ia.json` »), parce qu'une absence est une information.

**Les trois options mortes disparaissent.** Le sélecteur offrait cinq fournisseurs, le
serveur en acceptait deux, trois échouaient en 400 — dont « Claude Sonnet 5 », retiré par
décision. La liste est **lue depuis le serveur**, jamais écrite dans l'écran.

**L'historique** : fournisseur actif par jour sur 30 jours (les générations enregistrent
déjà leur producteur).

**Actions** : Tester cette ligne · Choisir ce fournisseur (écrit, teste et met à jour le
badge du bandeau **dans le même geste** : il n'y a plus d'« Enregistrer » séparé d'un
« Tester »).

**États** : *vide* — aucun fournisseur déclaré → « Aucune clé renseignée » + le chemin du
fichier de configuration, jamais un écran blanc · *chargement* — les tests se lancent
seuls, la ligne affiche « test en cours » · *erreur* — « Le fournisseur ne répond pas :
*401 — clé refusée* » + « Tester » + « Diagnostic » · *partiel* — 2 lignes sur 4 testées ·
*périmé* — dernier test de plus de 24 h → la ligne porte sa date et « Tester ».

#### 3.5.2 `#/systeme/chaines` — Santé des chaînes (nouveau)

**Ce que l'utilisateur voit en arrivant** : cinq cartes, une par chaîne, chacune avec son
état en clair, sa dernière exécution, son compteur d'échecs, et **un seul bouton
d'action**.

| Carte | Ce qu'elle montre | Action principale |
|---|---|---|
| **WhatsApp — envoi** | dernier envoi réel, nombre d'exécutions sans destinataire, **les modèles Meta et leur état**, les prospects parqués, le dernier code d'erreur complet | « Tester le modèle » |
| **Publication** | dernière sortie, prochaine échéance, file résiduelle face aux plafonds (7/jour, 2/plateforme, 30 min), verrou, publications parquées | « Voir les échecs » |
| **Instagram** | le nombre d'échecs, le code exact, la cause nommée par l'API, le nombre de créneaux touchés dans le calendrier | « Publier un test » |
| **Assets** | la joignabilité publique des images publiées, la dernière vérification | « Vérifier les images » |
| **Blog** | l'écart entre le plan et l'index généré, article par article | « Régénérer l'index » |

**Le bloc qui répond à la question du brief** — « comment une erreur de production
devient-elle visible ? » — est ici, en quatre temps :

1. le cron écrit son état d'exécution (ce qu'il fait déjà : compteurs d'échecs, dernier
   envoi, plafonds du jour) ;
2. le serveur en dérive les alertes selon les **dix règles** de §1.10 ;
3. l'alerte s'affiche **dans la file du jour le matin** (zone A), dans la pastille du
   bandeau, et dans cette carte ;
4. elle **reste jusqu'à acquittement**, et elle ne se referme que quand la cause a
   disparu — si elle revient, la même alerte se rouvre.

**Et le bloc « qui écrit quoi »**, repris de §1.11, affiché tel quel : le tableau des
champs et de leur écrivain unique. C'est la carte qui rend la divergence de 20 lignes sur
22 impossible plutôt que corrigée.

**Actions par carte** : Tester · Voir le journal · Déparquer (deux temps) · Retirer du
calendrier (pour une plateforme dont le test échoue en boucle) · Régénérer l'index.

**États** : *vide* — une chaîne jamais exécutée affiche « jamais exécutée » et non un
zéro trompeur · *chargement* — chaque carte se charge seule, l'état global est peint
immédiatement · *erreur* — la carte concernée porte la cause, les autres restent · *partiel*
— 4 cartes sur 5 répondent · *périmé* — plus de 5 min sans relecture (l'écran se
rafraîchit tout seul toutes les 15 s quand l'onglet est visible, donc cet état est rare et
signale lui-même quelque chose).

#### 3.5.3 `#/systeme/competences` — Banc d'essai et référentiel

**Sous-onglets** : `Agents · Compétences · Référentiel`.

- **Agents** : les **12 réellement atteignables en premier**, avec leur volume réel et
  leur pilier ; les autres en repli, marqués **« non routé »** et **pourquoi** (orphelin,
  paramètre jamais transmis, réservé à la chaîne image, réservé au texte). Un écran qui
  liste 29 agents sans dire que 17 ne seront jamais choisis est un mensonge par omission.
  Chaque ligne : ce que l'agent fait en une phrase, son état (active, absente, en erreur),
  sa dernière exécution, son taux de réussite, et « Tester sur un exemple ».
- **Compétences** : les **5 compétences réellement câblées**, avec la route qui les expose
  et leur usage réel — elles servent la prospection, pas la production de texte. Le
  chiffre « 36 skills » disparaît partout : il est faux et se propageait dans 6 fichiers.
- **Référentiel** : **le catalogue fermé**, celui qui rend impossible la publication
  d'une invention. Les offres autorisées, les repères de réassurance autorisés, les cas
  clients réels du site, les chiffres déjà employés avec leur date de dernier usage, les
  CTA, les hashtags par pilier et par plateforme, et les **tournures interdites**.
  C'est là que se règle le défaut le plus coûteux mesuré en M2 : les exemples des
  compétences étaient recopiés mot pour mot et devenaient des promesses fermes
  (« 15 600+ clics Google en 90 jours, je te rembourse 50 % »), et deux publications sur
  dix se terminaient par « (réponds 1 ou 2) ».

**États** : *vide* — « Aucun agent détecté » + « Diagnostic » · *chargement* — lignes
squelettes · *erreur* — cause + « Diagnostic » · *partiel* — « 10 agents sur 12 lisibles » ·
*périmé* — le référentiel affiche la date de sa dernière modification, et un chiffre
utilisé depuis moins de 30 jours porte une marque « déjà employé récemment ».

#### 3.5.4 `#/systeme/apparence` — Charte, gabarits, icônes

**Sous-onglets** : `Gabarits · Couleurs · Icônes · Templates`.

- **Gabarits** : la **matrice gabarit × plateforme × format** — les 15 déclinaisons
  existantes **et les absences assumées**, montrées comme des décisions (« cette
  combinaison n'existe pas : décision, pas oubli »). La source unique des jetons est
  affichée : couleurs, 9 polices, 6 formats de rendu, échelle typographique. **Un gabarit
  ne réécrit jamais une couleur** ; toute modification se fait ici.
- **La bibliothèque d'illustrations** : les SVG locaux, groupés par planche, avec la règle
  de sélection affichée (stable par empreinte du texte). Le brief annonçait 26
  illustrations ; la mesure en a trouvé 74 — c'est 74 qui s'affichent.
- **Les deux décisions de marque à ne pas perdre**, écrites à l'écran : l'or est un
  **accent** et non un aplat (mesuré entre 0,2 % et 1,1 % des pixels d'une image) ; le vert
  WhatsApp est réservé à ce qui propose WhatsApp.
- **Couleurs** : la palette par pilier, **chargée à l'ouverture** (« Cliquez sur
  Actualiser pour charger les couleurs » disparaît).
- **Icônes** : la bibliothèque et l'upload, l'upload ramenant à la grille.
- **Templates** : les habillages signature, en aperçu miniature — le vocabulaire de
  thème est conservé, la mécanique aléatoire ne l'est pas.

**États** : *vide* — « Aucun gabarit disponible » + le chemin attendu · *chargement* —
grille de vignettes squelettes · *erreur* — cause + « Diagnostic » · *partiel* — « 12
gabarits sur 15 rendus, 3 ont échoué » · *périmé* — un aperçu généré avant la dernière
modification des jetons porte « aperçu antérieur à la charte actuelle ».

#### 3.5.5 `#/systeme/preferences`

**Blocs** : (1) destination d'ouverture ; (2) densité (compacte 36 px · confortable
44 px) ; (3) seuils de la file du jour — âge des brouillons, horizon des relances, âge
d'une tâche terminée avant qu'elle s'efface du tiroir ; (4) **cadence de relance rappelée
avec un lien vers `#/acquerir/sequence`**, parce que le réglage vit là où il sert ;
(5) la **zone dangereuse**.

**La zone dangereuse**, avec la règle qui la gouverne : la confirmation en deux temps ne
suffit pas pour une perte irréversible — **il faut saisir le nombre d'objets**. Vider
l'archive anti-répétition, supprimer toutes les publications, supprimer les images
locales. Et pour la suppression des publications : le contrat est écrit noir sur blanc —
« la suppression est locale **et** serveur, en une seule transaction ; sinon le prochain
pull les réimporte », ce qui était exactement le défaut mesuré (D4).

**États** : *vide* non applicable (un formulaire a toujours des valeurs) · *chargement* —
les valeurs arrivent en un appel, le formulaire est inerte jusqu'à réception, jamais
peint avec des valeurs par défaut fausses · *erreur* — l'écriture échoue → la valeur
revient à la précédente et la raison est affichée · *partiel* — « 4 réglages sur 5
enregistrés, le 5e n'a pas répondu » · *périmé* non applicable (un réglage n'est pas une
donnée de monde).

#### 3.5.6 `#/systeme/journal`

**Sous-onglets** : `Tâches · API · Générations · Historique`.

- **Tâches** : en cours puis les 20 dernières, avec durée, résultat, et lien vers l'objet.
  C'est ici que le journal de synchronisation atterrit — un journal n'est pas un écran, il
  appartient à la tâche qui le produit.
- **API** : l'état des services, **sans emoji ni coche en dur** (le serveur renvoyait le
  mot « Opérationnel » précédé d'une coche, telle quelle, et elle traversait l'API
  jusqu'à l'écran — le nettoyage doit porter des deux côtés).
- **Générations** : les 20 dernières, avec producteur, durée, jetons et verdict.
- **Historique** : les 50 dernières actions de l'utilisateur sur les données.

Le bouton « Actualiser » de chaque bloc est remplacé par un **rafraîchissement automatique
de 15 s quand l'onglet est visible**, avec l'heure de la dernière actualisation affichée.

**États** : *vide* — « Aucune tâche depuis le démarrage. » · *chargement* — lignes
squelettes · *erreur* — cause + « Diagnostic » · *partiel* — « 18 entrées sur 20 » ·
*périmé* — jamais : cet écran se rafraîchit seul, et s'il ne le fait plus, **c'est une
alerte**.

#### 3.5.7 `#/systeme/diagnostic` — hors onglets

**Ce que l'utilisateur voit en arrivant** : une liste de vérifications, chacune avec son
verdict, **sa cause probable** et **sa correction**. Atteignable depuis **tout** état
d'erreur de l'outil, c'est le seul écran dont l'adresse se partage (« regarde ce
diagnostic »), et il doit exister avant que l'outil ne marche, pas après.

**Les contrôles, et leur verdict doit être juste** — c'est le point où l'actuel diagnostic
criait au loup sur une installation saine (« 15 piliers seulement — version ancienne »)
et annonçait « 36 skills » :

| Contrôle | Ce qu'il vérifie |
|---|---|
| Polices | les neuf fichiers `.woff2` servis en HTTP, et l'absence de toute police par CDN |
| Playwright et Chromium | le moteur de rendu disponible, et sa version |
| Clé du fournisseur | présente, testée, **et son modèle réellement servi** |
| Chaîne visuelle | les gabarits disponibles, la cohérence des jetons avec la charte du site |
| `ffmpeg` | disponible pour la conversion vidéo |
| Version inter-modules | le moteur en exécution est bien la version annoncée, et **tous ses piliers ont une entrée de couleur** (un pilier sans entrée tombait silencieusement sur la couleur d'un autre) |
| Serveur de publication | joignabilité, authentification, **et le sens de la synchronisation** (local ↔ serveur, dans les deux sens) |
| Espace disque et fichiers d'état | le fichier d'état est inscriptible, hors du dépôt, purgé |

**Un contrôle en échec donne un bouton de correction**, pas un numéro de ligne.

**États** : *vide* impossible · *chargement* — chaque contrôle s'affiche au fur et à
mesure, avec son nom ; la page ne se bloque jamais sur le plus lent · *erreur* — un
contrôle qui ne peut pas s'exécuter est **« non exécuté »**, ce qui n'est pas « en échec »
(la distinction manquait) · *partiel* — « 7 vérifications sur 8 » · *périmé* — le rapport
porte l'heure de son exécution et se relance d'un clic.

#### 3.5.8 `#/systeme/alertes` — Centre d'alertes (nouveau)

**Ce que l'utilisateur voit en arrivant** : les alertes **ouvertes**, la plus grave en
tête, puis les acquittées des 30 derniers jours. Chaque alerte a sa carte : gravité,
source, cause exacte, diagnostic, compteur, et son action.

**Deux onglets** : `Ouvertes · Acquittées`. Une alerte acquittée n'est pas effacée : elle
garde sa cause, son compteur, l'horodatage et le motif de l'acquittement. Le cycle
complet d'une alerte est lisible, et c'est ce qui permet de dire au bout de trois
semaines « cette chaîne casse tous les lundis ».

**États** : *vide* — « Aucune alerte. Dernière vérification de toutes les chaînes il y a
2 min. » (une phrase vraie, avec l'heure) · *chargement* — squelettes · *erreur* — le
moteur d'alertes lui-même est injoignable → **c'est la seule erreur de l'outil qui
s'affiche en dur dans le bandeau**, partout, parce qu'elle prive de toutes les autres ·
*partiel* — « 4 sources sur 5 surveillées : la carte Assets n'a pas répondu » · *périmé* —
plus de 5 min → la pastille du bandeau devient neutre avec l'heure.

---

## 4. Les parcours de bout en bout

Comptage : un **clic** = un appui sur un bouton, une case ou un lien. Une **saisie** = une
frappe dans un champ. Un **dialogue** = une boîte native `prompt()` ou `confirm()`. Les
chiffres « avant » sont ceux mesurés par les audits ; les chiffres « après » sont ceux de
cette conception.

### 4.1 Produire et publier un lot de 7 publications

**Avant — 12 clics, 3 saisies, 5 dialogues, aucune preuve**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Publications » | la modale s'ouvre : 1090 × 823, **13 boutons avant le premier contenu** |
| 2 | clic « Générer 7 pubs » | `fetch` bloquant, **38 s mesurées** sans progression, retour par un toast détruit en 4,2 s |
| — | attendre | onglet fermé ici : rien ne survit, rien ne reprend |
| 3 | clic « Toutes les images » | chaîne **déclarée morte par son auteur**, hors charte : 33,4 % de noir pur, zéro pixel d'or, aucun logo |
| 4 | dialogue `confirm` | — |
| — | attendre ≈ 2 min 41 | durée réelle mesurée 23,0 s par image contre « ~10 s » annoncées |
| 5 | clic « Programmer tout » | — |
| 6 | dialogue `prompt` date | format `YYYY-MM-DD HH:MM:SS` à taper |
| 7 | saisie | mode : **taper « 3 »** dans une boîte de texte |
| 8 | dialogue `prompt` incrément | — |
| 9 | clic « Sync serveur » | **obligatoire et non signalée** : la programmation de lot n'a rien envoyé au serveur — l'interface annonçait pourtant « N publication(s) programmée(s) » |
| 10 | dialogue `confirm` | — |
| 11 | clic « Récupérer statuts serveur » | le seul moyen de savoir ce qui est sorti |
| 12 | dialogue `confirm` | — |
| — | clic « Fermer » | — |

Non comptés mais réels : il faut **croire** que les 7 publications sont bonnes sans les
avoir lues (texte tronqué à 300 caractères, 30 lignes maximum, aucun verdict de contrôle),
le calendrier Instagram porte 3 créneaux sur 7 vers une plateforme qui échoue de façon
reproductible, et rien ne prouve qu'une publication est sortie avant d'aller voir sur
Facebook.

**Après — 9 clics, 0 saisie obligatoire, 0 dialogue**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Produire » (ou `g p`) | |
| 2 | clic « Nouveau lot » | formulaire prérempli : 7 · piliers variés · demain 8 h — **durée et nombre d'appels affichés avant de lancer** |
| 3 | clic « Lancer » | la tâche apparaît **immédiatement** dans la liste, dans le bandeau de tâches et dans la file du jour |
| — | (il peut fermer l'onglet) | la génération continue côté serveur |
| 4 | clic sur la ligne de tâche « Terminé — 7 publications » | ouvre l'onglet **À valider** |
| 5 | clic sur une ligne → atelier | relecture du **texte complet** + du **rapport de contrôle** ; `Échap` ferme, le brouillon est conservé |
| — | 0 clic | le visuel s'est produit **en tâche**, sur la **seule** chaîne, et les 7 slides d'un carrousel sont notées |
| 6 | clic sur la case « tout » | la barre de sélection apparaît |
| 7 | clic « Valider » | les 7 passent en validées |
| 8 | clic « Programmer » | écran de programmation : créneaux préremplis, plafonds du serveur affichés, Instagram grisée si son test échoue |
| 9 | clic « Confirmer » | **transaction** locale + serveur, puis synchronisation en tâche |

Le compte de clics baisse peu (12 → 9) ; **la nature du parcours change sur cinq points
qui pèsent plus que trois clics** :

1. **l'étape 3 est récupérable** — onglet fermé, plantage, coupure réseau ;
2. **l'étape 5 n'existait pas** — il validait à l'aveugle, sans contrôle et sans verdict ;
3. **une seule chaîne visuelle**, contrôlée slide par slide, au lieu de deux selon le bouton ;
4. **la programmation est une transaction** : il n'y a plus de « 49 publication(s)
   programmée(s) » qui ne concernait que le poste local ;
5. **la sortie se prouve** : `Post_ID`, URL, horodatage réel et quatre compteurs sociaux,
   au lieu d'un toast.

### 4.2 Ajouter, qualifier et relancer un prospect

**Avant — le parcours n'a jamais été parcouru**

Le fait mesuré d'abord : sur 1,1 Mo de journaux et 76 fichiers, `/api/add` = **0 appel**,
`/api/send` = **0 appel**, `/api/import` = **0**, `/api/scrape/*` = **0**, `/api/sync` =
**0**. Le parcours n'est pas seulement lent, **il n'a jamais été emprunté**.

S'il l'avait été : 8 clics, 3 saisies, 3 surfaces empilées, et zéro trace.

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Prospect » (bouton d'ajout de la barre du haut) | modale à 8 champs, dont **aucun champ email ni site web** alors que les deux rapportent des points |
| 2 | saisie téléphone (+ nom facultatif) | le numéro est enregistré **non normalisé** |
| 3 | clic « Ajouter (score auto) » | le score est calculé **une fois, à la création**, et ne sera plus jamais recalculé |
| 4 | saisie de recherche | il faut **retrouver** la carte dans les 22 |
| 5 | clic « ICP » | aller-retour réseau pour **relire le score déjà affiché sur la carte** |
| 6 | clic « Fermer » | — |
| 7 | clic « Msg » | 3 variantes générées |
| 8 | clic « Copier » puis « Fermer » | **envoyer depuis ce panneau ne met pas le pipeline à jour** |
| 9 | clic « Envoyer J0 » | ouvre `wa.me` **et marque immédiatement** le prospect contacté — même si rien n'est parti |

**Après — 5 clics, 2 saisies, un seul panneau**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Acquérir » (ou `g a`) | |
| 2 | clic « Nouveau prospect » | panneau latéral ; la liste reste visible et utilisable |
| 3 | saisie téléphone + nom | le reste est facultatif ; ville, pays et secteur se déduisent ; site web et email sont **saisissables** (ils rapportent des points) |
| 4 | clic « Ajouter » | le panneau **bascule sur la fiche du prospect créé** ; la qualification se lance seule et se met en cache ; les variantes arrivent |
| 5 | clic sur la variante retenue | le **texte exact est affiché** avant l'action |
| 6 | clic « Envoyer sur WhatsApp » | ouvre `wa.me`, marque l'envoi, décrémente le quota — et l'envoi est **réversible 8 s** (`Ctrl+Z`) |

La relance J+3 est planifiée par le moteur : elle apparaîtra **dans la file du jour le
jour dit**, sans geste. **C'est le gain réel** : la relance cesse d'être une chose à
retenir, et elle n'est plus bloquée par un délai codé en dur — la cadence est réglable
dans `Séquence`, et le bouton est disponible quand l'utilisateur décide d'agir.

### 4.3 Diagnostiquer une panne de publication

**Le parcours actuel n'existe pas.** Toute la valeur est dans ce qu'on invente.

**Avant — le coût de l'absence de parcours, mesuré**

| Fait | Valeur |
|---|---|
| Erreur | Meta `#132001` — « Template name does not exist in the translation » — le 07/09 à 02 h 50 |
| Conséquence | « 3 échecs consécutifs → prospect parké en Froid » : **toute la base contactée** est parquée |
| Exécutions muettes ensuite | **1 226** lignes « Rien à envoyer (aucun prospect éligible) » sur 1 327 |
| Alerte reçue | **aucune** — le canal Telegram a un jeton vide ; `cron_state.json` affiche `sent_today: 0` |
| Où l'information existait | dans `publications_state.json` côté serveur, **lu par aucune ligne de code Python de l'application** |
| Durée avant détection | **12 jours**, et il l'a apprise en ouvrant le CSV serveur à la main |
| Gestes hors outil pour diagnostiquer | 5 à 6 (accès FTP ou SSH, ouvrir le journal, chercher le code, comprendre Meta) |

S'il avait ouvert le cockpit pendant ces douze jours, il aurait lu : « 7 publications ·
0 publiée » — alors que trois étaient sorties, dont deux portant les identifiants
réattribués à du contenu neuf. **L'écran mentait dans les deux sens.**

**Après — 3 clics, 0 saisie, et une alerte qui existait le premier jour**

| Temps | Ce qui se passe |
|---|---|
| **Jour 1, 8 h 02** | 0 clic. La file du jour porte en zone A : « La chaîne d'envoi WhatsApp est arrêtée depuis 1 jour · 22 prospects parqués · code 132001 » (règle A1 : trois exécutions sans envoi alors que des relances sont dues). L'alerte est aussi dans la pastille du bandeau et dans `Chaînes` |
| **Le jour où il la traite** | 1 clic « Ouvrir la chaîne » → `#/systeme/chaines?whatsapp` |
| | **Ce qu'il lit** : les modèles Meta avec leur état ; la cause exacte, non traduite ; ce que ça empêche ; le nombre de prospects parqués ; et **la correction**, mot pour mot : « ce modèle doit être créé à la main dans Meta Business Manager ; rien dans le dépôt ne peut le créer » |
| | 2 clic « Tester le modèle » → tâche courte, verdict en moins de 8 s. Si le modèle est bon, l'alerte **se referme toute seule** (le test est la condition de fermeture) |
| | 3 clic « Déparquer les 22 » → deux temps, puis une tâche. La file du jour perd sa ligne, les cartes reprennent une action |
| | Pour Instagram, la même carte dit : « échec reproductible, code 9004/2207052, image non récupérable depuis `assets_pubs/PUB-0005.png` », et propose « Publier un test » ou **« Retirer Instagram du calendrier »** — un correctif d'une ligne, exposé comme un réglage |
| **Le lendemain** | 4 clic « Acquitter et archiver la cause » : l'alerte quitte les ouvertes, garde sa cause et son compteur dans l'onglet Acquittées |

**Ce qui a changé, en une phrase** : la panne n'est plus quelque chose qu'on découvre par
accident en ouvrant un fichier sur un serveur, c'est une **ligne de la file du matin**
avec sa cause, sa portée, son remède et son acquittement.

### 4.4 Analyser un concurrent

**Avant — 6 clics, 3 saisies, résultat jetable**

`Concurrence` (1) → 3 champs (saisies) → `Analyser` (1) → attendre → lire la grille →
`Fermer` (1). Le résultat vit dans un `<div>` : recharger la page le détruit. Il n'existe
aucun endroit pour comparer deux concurrents, aucun suivi dans le temps, et l'« analyse »
est une grille rédigée à partir d'un nom saisi — **aucune donnée n'est collectée sur un
tiers**.

**Après — 4 clics, 2 saisies, résultat conservé et vérifiable**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic « Veiller » (ou `g v`) | |
| 2 | clic « Analyser un concurrent » | panneau : nom, niche préremplie, URL — les trois champs sobres qui fonctionnaient déjà, gardés tels quels |
| 3 | saisie du nom + `Entrée` | la tâche part ; la fiche apparaît immédiatement en « analyse en cours » |
| 4 | clic sur la fiche terminée | grille des 7 dimensions, chacune en `vide` / `hypothèse` / `vérifié`, les opportunités, et « En faire une publication » |

Puis **N clics pour N vérifications** : chaque dimension que l'outil peut réellement
contrôler (la page existe, publie, diffuse des publicités) porte un bouton « Vérifier »
qui passe la dimension de `hypothèse` à `vérifié` avec sa date, ou écrit « non
vérifiable depuis cet outil ». C'est un coût volontaire : **une hypothèse affichée comme
une hypothèse vaut mieux qu'une grille présentée comme une observation.**

Le document est adressable (`#/veiller/concurrents/longrich-burkina`), il se rouvre des
mois plus tard avec ses dates, deux fiches se comparent côte à côte, et une fiche de plus
de 90 jours est marquée périmée — elle reste lisible et propose d'être rejouée.

### 4.5 Changer de fournisseur LLM

**Avant — 5 clics, un dialogue, et un doute**

Badge du bandeau (1) → radio « Claude Sonnet 5 » (1) → `Test connexion` (1) → attendre →
`Enregistrer` (1) → `Fermer` (1). Et le doute : le réglage existe **trois fois** — la
modale écrit un registre, le sélecteur du panneau Publications en écrit un autre, et
**3 des 5 options visibles échouent en 400** (« Provider doit être 'deepseek' — la
passerelle Claude a été retirée »). Le badge du bandeau affiche « DeepSeek » en dur : il
ne reflète aucun des deux registres.

**Après — 2 clics, ou 1 par le badge**

| # | Geste | Ce qui se passe |
|---|---|---|
| 1 | clic sur le badge du bandeau (ou « Système ») | la matrice usage × fournisseur s'affiche, **avec l'état testé de chaque ligne**, testée à l'ouverture |
| 2 | clic « Choisir » sur la ligne concernée | écrit, teste et met à jour le badge du bandeau **dans le même geste** |

**Ce qui a changé** : un seul écran fait autorité ; la liste vient du serveur (les trois
options mortes ne s'affichent plus, et un fournisseur sans clé s'affiche **désactivé avec
sa raison** au lieu d'échouer en 400) ; et la matrice dit ce qu'un registre unique aurait
caché — que le toolkit est mono-fournisseur, que le noyau a une cascade à trois paliers,
et lequel des deux sert quel usage.

---

## 5. Les tâches longues

### 5.1 La règle

**Toute opération dont la durée médiane dépasse deux secondes est un objet nommé, daté,
suivi et annulable, qui vit sur le serveur.** Un toast de 4,2 s ne rend compte que d'une
action immédiate et réversible, et seulement alors il porte « Annuler ».

**Ce qui devient une tâche** : génération de lot · calendrier · génération de visuel (une
publication ou une sélection) · reproduction de visuels · post complet · batch vidéo ·
programmation d'un lot · synchronisation (montée et descente, désormais une seule
opération) · récupération des statuts · dépouillement d'un modèle Meta · scraping (les
trois sources) · import de la sélection · analyse de concurrent · vérification d'une
dimension · veille · diagnostic · déparquage · régénération d'un index · test de
fournisseur si le premier essai dépasse 2 s.

**Ce qui reste synchrone** : tout le reste — un statut, une note, un filtre, une
qualification en cache, une case cochée.

### 5.2 Le contrat

Le socle serveur **est déjà écrit** et **déjà correct** : un identifiant, un nom, une
étape, un pourcentage borné à 92 tant que la tâche court, un début, une fin, un résultat,
une erreur, une purge à 6 h, une écriture atomique, un fichier d'état hors du dépôt, et un
fichier corrompu qui ne bloque pas. Ce n'est pas onze routes à porter : c'est **onze
routes à brancher**.

Ce qui manque, et que ce document exige :

1. **Les routes longues rendent la main.** Une route qui dure des minutes répond en moins
   d'une seconde avec un identifiant de tâche et poursuit dans un fil. Un verrou
   d'écriture protège le fichier des publications (nécessaire dès aujourd'hui : deux
   générations simultanées le corrompraient).
2. **L'annulation coopérative.** « Arrêter » pose un drapeau ; la boucle le lit entre deux
   unités et s'arrête en marquant ce qui est fait. Sans drapeau, « Arrêter » ne serait
   qu'un bouton qui ferme une fenêtre pendant que le travail continue.
3. **Le journal de la tâche**, ses N dernières lignes, pour que le détail s'affiche sans
   rouvrir l'onglet qui l'a lancée.
4. **L'estimation vient du journal mesuré.** « Environ 10 s par image » devient « 19,7 s
   en moyenne sur les 16 dernières, maximum 56 s ». Une estimation écrite à la main est
   une estimation fausse dans un sens ou dans l'autre.
5. **L'interruption est un état de première classe.** Une tâche dont le serveur redémarre
   n'est ni « en cours » ni « en échec » : elle est **interrompue**, et la seule action
   proposée est « Reprendre » — qui saute les unités déjà faites.

### 5.3 Où ça s'affiche — quatre endroits, un seul objet

| Endroit | Forme |
|---|---|
| **Bandeau de tâches**, en bas du rail, permanent | une ligne par tâche : « Génération 3/7 · 47 % · 1 min 20 écoulées · 2 min 18 estimées » + « Arrêter ». À la fin, la ligne **reste** : « Terminé — 7 publications · Voir ». Elle ne disparaît qu'à l'acquittement |
| **File du jour**, zone D | une ligne par tâche, même contenu |
| **À l'endroit de l'objet** | la ligne concernée affiche sa progression **à la place de ses boutons** : on voit le lot avancer dans la liste, pas dans une bulle |
| **Tiroir de tâches** (`t`, ou clic sur la pastille) | en cours, puis les 20 dernières avec durée, résultat et lien vers l'objet. C'est là qu'atterrit le journal de synchronisation |

Le bandeau de tâches **ne se replie jamais à zéro** quand une tâche tourne, et il est
`aria-live="polite"` : la fin d'une tâche est annoncée sans interrompre la frappe.

### 5.4 Ce qui survit à quoi

| Événement | Tâche en cours | Tâche terminée non acquittée | Brouillon en cours | Filtres, recherche, tri | Alerte ouverte |
|---|---|---|---|---|---|
| **F5** (rafraîchissement) | survit — elle vit sur le serveur ; l'interface la retrouve | survit | survit, **écrit à la frappe** | survit (URL puis état serveur) | survit |
| **Onglet fermé** | survit et **continue** ; à la réouverture le bandeau s'ouvre déplié sur elle | survit | survit | survit si l'URL a été gardée | survit |
| **Plantage du navigateur** | idem — rien ne vivait dans le navigateur | idem | idem | idem | idem |
| **Coupure réseau locale** | continue côté serveur ; l'interface passe en « Reconnexion… » et rattrape son retard par sondage à 3 s | idem | les frappes se mettent en file et partent à la reconnexion | conservés | affichée depuis le dernier état connu, avec sa provenance et sa date |
| **Redémarrage du serveur** | passe à **« interrompue »** ; les unités déjà écrites sont conservées ; « Reprendre » saute ce qui est fait | conservée : le fichier d'état est hors du dépôt et l'écriture est atomique | conservé | conservés | conservée ; les règles sont réévaluées au redémarrage |
| **Coupure d'alimentation du poste** | idem redémarrage | idem | la frappe en vol de moins de 2 s peut être perdue ; le reste est écrit | conservés | conservée |

**Ce qui n'est jamais perdu** : une publication générée est écrite **au moment où elle est
produite**, pas à la fin du lot. Le lot est une commodité d'affichage, pas une
transaction.

### 5.5 Suivre, reprendre, annuler, échouer

- **Suivre** : sondage 3 s quand l'onglet est visible, 15 s quand il ne l'est pas
  (`visibilitychange`). L'étape est **nommée** : « Extraction des champs — slide 3 sur 7 »,
  jamais « Chargement… ».
- **Reprendre (démarrage)** : au chargement, l'état des tâches est relu ; s'il y en a en
  cours ou interrompues, le bandeau s'ouvre déplié sur elles. « Reprendre » = aller à
  l'écran d'origine, pas relancer.
- **Reprendre (après un échec)** : « Réessayer » ne relance **que les unités en échec**.
  Et il relance **sur la chaîne qui a échoué** — jamais une autre (le bouton actuel
  relançait en génération de citation une publication qui avait échoué sur la chaîne
  gabarits, donc avec l'autre charte).
- **Annuler** : confirmation immédiate, pas de dialogue. La tâche passe à `annule` avec
  `{ faits: 3, restants: 4 }`, et la file du jour propose « Reprendre les 4 restantes ».
  **Annuler n'est pas perdre.**
- **Échouer** : cause + « Réessayer » + « Diagnostic ». Le résultat partiel est conservé
  **et affiché comme tel** (« 4 publications générées avant l'échec ») — ce message existe
  déjà dans le code et était détruit après 4,2 s.
- **Une tâche en échec répété devient une alerte** (règle A4) : trois échecs de suite sur
  la même cause ne restent pas au niveau d'une tâche, ils remontent dans la file du jour.

---

## 6. Le clavier

Un outil utilisé tous les jours ne se pilote pas à la souris. Ce qui suit est la
spécification, pas une suggestion.

### 6.1 Ordre de tabulation

1. **Bandeau**, dans l'ordre : sélecteur de compte → recherche globale → pastille
   Alertes → pastille Tâches → bouton `?`. Le quota, le badge fournisseur et l'horloge de
   synchro **ne sont pas focalisables** : ce sont des informations, pas des commandes.
2. **Rail** : cinq destinations. **Une seule est atteignable par `Tab`** (l'active) ; les
   autres par `↑`/`↓`, comportement `tablist`. C'est ce qui évite cinq arrêts à chaque
   passage.
3. **Barre d'onglets** de la destination : mêmes règles, `←`/`→`.
4. **Barre d'actions de l'écran**, puis **le contenu**. Dans un tableau, `Tab` sort de la
   liste et va aux actions suivantes — le parcours ligne à ligne se fait au clavier avec
   `j`/`k`. Dans une grille de cartes, `Tab` parcourt les cartes.
5. **Panneau latéral** : le focus y entre à l'ouverture, y reste (`Tab` boucle : titre →
   champs → actions → fermer → titre) et **rend le focus à l'élément déclencheur** à la
   fermeture. Sans cela, un panneau qui pousse le contenu est une souricière.
6. **Bandeau de tâches** : atteignable en fin de parcours, après le contenu — jamais au
   milieu.

**Le focus visible est l'anneau or de 2 px** (8,2:1 minimum). Il ne disparaît jamais, et
après une action il revient au déclencheur, ou à la ligne suivante si la ligne a disparu.
Aujourd'hui deux règles `:focus-visible` couvrent 198 éléments interactifs : une
déclaration globale les couvre tous.

### 6.2 Échappement

- `Échap` ferme **le panneau latéral** s'il est ouvert ; sinon **le menu `⋯`** ; sinon
  **la recherche globale** ; sinon ne fait rien.
- `Échap` **ne ferme jamais** une tâche en cours. Il ne ferme pas non plus un formulaire
  contenant un brouillon : dans ce cas il ferme, et **le brouillon est déjà écrit côté
  serveur** — c'est la réponse par défaut, et il n'y a donc rien à demander.
- Un clic sur le voile ferme le panneau, sauf si une écriture est en vol : le voile
  clignote une fois au lieu de fermer.
- `Échap` **n'annule pas** une action destructive déjà confirmée.

### 6.3 Raccourcis

| Touche | Action | Portée |
|---|---|---|
| `g` puis `a` `p` `i` `v` `s` | Aujourd'hui · Produire · Acquérir · Veiller · Système | globale, deux touches |
| `/` ou `:` | focus recherche globale | globale |
| `Alt` + `1…6` | onglet n de la destination courante | destination |
| `n` | action primaire de l'écran (Nouveau lot · Nouveau prospect · Analyser un concurrent · Produire) | destination |
| `j` / `k` | ligne suivante / précédente | listes, tableaux, grilles |
| `Entrée` | ouvre l'objet de la ligne (atelier, fiche, tâche, chaîne) | listes |
| `x` / `Maj`+`x` | coche la ligne / coche tout | listes |
| `a` `p` `e` | avec une sélection : Valider · Programmer · Exporter | onglets et files |
| `t` | ouvre et ferme le tiroir de tâches | globale |
| `w` | ouvre WhatsApp pour la ligne courante | relances |
| `c` | copie le lien de l'objet courant | partout |
| `r` | rafraîchit le bloc au focus (rend le même service que « Rafraîchir ») | blocs périmés |
| `Ctrl`+`z` | annule la dernière action réversible dans les 8 s (statut, report, validation, **envoi marqué**) | globale |
| `?` | feuille des raccourcis | globale |
| `Échap` | §6.2 | globale |

**Règles de sûreté**, parce qu'un raccourci mal placé fait plus de dégâts qu'il n'en évite :

1. **Aucun raccourci à une touche pour une action destructive.** Supprimer, vider,
   déparquer en masse, recréer : uniquement au clic, avec confirmation en deux temps.
2. **`Ctrl`+`Entrée` ne couvre plus les actions à effet externe.** Il valide le formulaire
   courant — lancer une génération, ajouter un prospect — mais **publier** et **envoyer un
   message** exigent un clic sur un bouton. Une frappe mal placée ne doit pas envoyer un
   message à un prospect.
3. **Les raccourcis sont désactivés quand le focus est dans un champ**, sauf `Échap`,
   `Ctrl`+`Entrée`, `Ctrl`+`z`.
4. **Les raccourcis sont annoncés** : chaque bouton qui en a un porte son raccourci dans
   son info-bulle (« Nouveau lot — n »).
5. `Ctrl`+`z` **ne défait jamais** une action qui a eu un effet externe confirmé : il
   annule le *marquage* d'un envoi, jamais l'envoi.
6. Le bandeau des tâches porte `aria-live="polite"` ; les alertes, `aria-live="assertive"`
   une seule fois à leur ouverture, jamais en boucle.

---

## 7. Les points de rupture

Le rail ne disparaît **jamais** avant 1024 px : il se réduit. En dessous, il devient une
barre horizontale — la navigation reste accessible, et les raccourcis couvrent le reste.

| Largeur | Rail | Zone de travail | Panneau latéral | Grille de cartes | Tableaux | File du jour | Atelier | Programmation |
|---|---|---|---|---|---|---|---|---|
| **1920** | 240 px, libellés | fluide plafonnée à **1320 px**, centrée | **380 px en colonne réelle** — la seule largeur où il ne recouvre rien | **4 colonnes** si le panneau est fermé, 3 sinon | toutes les colonnes | ligne complète, 7 colonnes | 2 colonnes, la bande de slides défile dans son cadre | 7 jours côte à côte |
| **1680–1919** | 240 px | fluide | 380 px en colonne | 3 colonnes | toutes | idem | idem | idem |
| **1440–1679** | 232 px | fluide | 360 px, **superposé** avec voile | 3 colonnes | toutes | idem | idem | idem |
| **1280–1439** | 216 px | fluide | 360 px superposé | 3 colonnes | colonnes secondaires dépliables | idem | 2 colonnes serrées | 7 colonnes, libellés courts |
| **1024–1279** | **64 px, icônes seules**, libellé en info-bulle et `aria-label` | fluide, marges 20 px | 360 px superposé, plein écran au-delà de 1100 px | **2 colonnes** | liste empilée (une ligne = un bloc) | 5 colonnes, la preuve passe sous le titre | **1 colonne**, la bande de slides passe en dessous | 7 colonnes → **liste par jour** |
| **< 1024** | **masqué** : barre horizontale de 56 px en haut, défilante | pleine largeur, marges 16 px | **plein écran**, glisse par la droite, retour explicite | **1 colonne** | liste empilée | la ligne devient un bloc : titre, preuve, échéance, actions | 1 colonne | **liste verticale**, un jour par écran |

**Décisions qui vont avec.**

- **Ce qui ne rétrécit jamais** : le bandeau de tâches (ancré en bas, même sur téléphone)
  et l'indicateur de quota anti-ban (dans le bandeau haut). Ce sont les deux informations
  dont l'absence coûte de l'argent ou du travail.
- **Sous 1024 px, l'outil reste utilisable mais n'est pas optimisé** : la file du jour et
  les relances fonctionnent — ce sont les seuls gestes qui se font debout, hors du bureau.
  L'atelier, la programmation d'un lot et la suppression demandent une confirmation
  explicite avant de s'ouvrir.
- **Le passage 1280 → 1279 px ne doit pas déplacer le contenu** : le rail se réduit sans
  reflow du corps (largeur réservée constante pendant 200 ms).
- **Aucun débordement horizontal, à aucun palier.** Vérifiable :
  `scrollWidth <= innerWidth` sur les 6 paliers, dans les 33 vues. C'est ce qui coûte le
  plus cher aujourd'hui (305 px mesurés). **Une exception, nommée** : la bande de
  vignettes de la fiche visuel défile horizontalement **à l'intérieur de son cadre** ;
  la page, jamais.
- **Le contenu ne se comprime jamais pour tenir : il change de forme.** Tableau → cartes,
  4 colonnes → 3, panneau en colonne → panneau superposé, calendrier 7 jours → liste par
  jour. Une carte de 240 px de large est un échec, pas une adaptation.
- **La largeur de lecture est plafonnée** : tout texte rédigé (le texte d'une publication,
  un message généré, une note de prospect) est limité à 68 caractères par ligne, **à
  l'intérieur de son conteneur**, quel que soit le palier. La grille peut être large ; le
  bloc de texte ne l'est pas. Aujourd'hui aucun conteneur du cockpit ne plafonne son
  texte rédigé — la modale d'édition avoisine les 100 caractères par ligne.

---

## 8. Ce que le serveur doit exposer en plus

Rien de ce qui suit n'existe aujourd'hui. C'est la liste minimale pour que les écrans
soient constructibles ; elle s'ajoute aux 75 routes sans modifier leur contrat, sauf
mention contraire explicite.

| Route | Méthode | Pourquoi | Nature |
|---|---|---|---|
| `/api/aujourdhui` | GET | La file du jour en **un seul appel** (agrège état, publications, tâches, pull serveur, alertes) | nouvelle |
| `/api/alertes` · `/api/alertes/<id>/acquitter` | GET/POST | L'objet alerte, son cycle et son acquittement | nouvelle |
| `/api/chaines` | GET | L'état des cinq chaînes, dérivé de l'état d'exécution du serveur | nouvelle |
| `/api/divergence` | GET | La comparaison local / serveur, champ par champ, avec la liste des champs serveur | nouvelle |
| `/api/publications/generate-batch`, `/weekly-calendar`, `/api/quick/*`, `/api/scrape/*`, `/api/import`, `/api/analyze-competitor`, `/api/sync-pubs`, `/api/pubs-pull`, `/api/system-check`, `/api/veille`, `/api/publications/<id>/image`, `/api/publications/generate-all-images`, `/api/social/generer`, `/api/design/*` | POST/GET | **Changement de contrat** : rendent `{ ok, tache }` en moins d'une seconde au lieu de bloquer | contrat |
| `/api/etat/tache/<id>` · `/api/etat/tache/<id>/annuler` | GET/POST | Le détail d'une tâche et l'annulation coopérative | complément |
| `/api/prospects/<ID>/fiche` | GET | Fiche complète (qualification en cache, variantes, **journal des envois**) pour le panneau | nouvelle |
| `/api/prospects/<ID>/journal` | GET | Quel message, quand, par quel canal, avec quel résultat | nouvelle |
| `/api/concurrents` · `/api/concurrents/<slug>` | GET/POST | Persistance des analyses, avec l'état par dimension et sa date de vérification | nouvelle |
| `/api/concurrents/<slug>/verifier/<dimension>` | POST | La vérification d'une dimension, en tâche courte | nouvelle |
| `/api/publications/<ID>/controle` | GET | Les rapports techniques et éditoriaux, **un par slide**, avec le verdict | nouvelle |
| `/api/publications/visuels` | GET | L'état visuel de toutes les publications (existence, score, slides contrôlées, péremption) | nouvelle |
| `/api/chaines/meta-modeles` · `/api/chaines/meta-modeles/<nom>/tester` | GET/POST | L'état d'approbation des modèles Meta et leur test | nouvelle |
| `/api/publications/planifier` | POST | La programmation de lot en **une transaction** locale + serveur, avec les plafonds | nouvelle |
| `/api/config/llm-provider` | POST/GET | **Registre unique** ; la lecture devient une **matrice usage × fournisseur** alimentée par le serveur | contrat |
| `/api/ia-config` | GET | Alias de lecture : `providers_disponibles` est **la** source de la liste affichée | inchangée |
| `/api/acquerir/hygiene` | GET | Le rapport de cohérence, calculé côté serveur | nouvelle |
| `/api/provenance` | GET | Pour chaque source : dernière lecture, dernière synchronisation, fraîcheur | nouvelle |

**Quatre précisions d'implémentation qui évitent des surprises.**

1. Les routes longues tournent dans un fil ; le serveur doit servir en mode *threaded*.
   **Un verrou protège chaque fichier écrit** — publications, prospects, archive.
2. Le fichier d'état écrit déjà de façon atomique et **hors du dépôt**. Rien à changer :
   les tâches y sont prévues, il suffit de les créer.
3. **Le moteur d'alertes vit côté serveur**, dans le cron qui connaît l'état réel, pas
   dans l'écran. Le dashboard lit un résultat, il ne dérive pas une alerte qu'il serait
   seul à voir.
4. **Le pull serveur devient automatique** à l'ouverture et après chaque écriture. Le
   bouton « Récupérer les statuts » disparaît ; l'absence de cette automatisation est la
   cause directe des « 7 publications · 0 publiée » affichés alors que trois étaient
   sorties.

---

## 9. Ordre de construction

Un écran par session, vérifié isolément, dans l'ordre du déblocage. Les sept étapes de la
base sont conservées ; trois s'y insèrent, et deux changent de place.

| Étape | Contenu | Pourquoi ici |
|---|---|---|
| **0 — Débloquer** | polices servies en HTTP (les 7 `@font-face` échouent en 404 et le cockpit tourne en police système), anneaux de focus, sélecteur de fournisseur alimenté par le serveur, emojis retirés **des deux côtés** (le serveur en renvoie) | Court, visible, et cela rend le reste crédible |
| **1 — Câbler le socle mort** | brancher les composants et la persistance d'état déjà écrits, remplacer les toasts des opérations longues par des tâches | Le travail est fait et n'est utilisé nulle part : c'est le plus fort rendement du chantier |
| **2 — Rail, URL, onglets** | les 5 destinations, les 33 adresses, retour arrière, favoris | Sans lui, aucune section de ce document n'est adressable |
| **3 — Provenance, alerte, divergence** | les trois objets transverses de §1.8 à §1.11, et la règle « un champ, un écrivain » | **Avant les écrans** : c'est ce qui empêche de reconstruire un écran qui ment |
| **4 — Aujourd'hui** | la file du jour, zones A à D, les 10 règles d'alerte | La vue d'ouverture, et la seule qui change le quotidien dès le premier matin |
| **5 — Produire** | les 5 onglets, les 5 écrans annexes, les 17 dialogues remplacés | Le plus gros volume : 15 000 lignes de sortie par semaine |
| **6 — Acquérir** | Pipeline, Réponses, Séquence, Sources, Hygiène | Le module qui n'a jamais servi : c'est ici que la conception doit se prouver |
| **7 — Veiller, puis Système** | les 3 puis les 6 onglets, le diagnostic, les alertes | Les plus rares, et les plus dépendants du reste |
| **8 — Clavier** | tabulation, échappement, raccourcis | À la fin, mais **avant la mise en service** : il ne s'ajoute pas après coup |

**Les étapes 1 et 2 vont ensemble** : un socle branché sans navigation ne se vérifie pas,
une navigation sans socle se réécrit.
**L'étape 3 ne se saute pas.** Construire les écrans avant la provenance et la divergence,
c'est construire un deuxième cockpit qui affichera le contraire de la réalité — le défaut
le plus coûteux des cinq audits, et le seul qui a coûté douze jours.

---

*Document produit le 19 septembre 2026. Aucun fichier de l'outil n'a été modifié.
Aucun code n'a été écrit.*
