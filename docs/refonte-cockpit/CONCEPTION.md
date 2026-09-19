# Cockpit — conception

Synthèse de trois travaux menés en parallèle le 19 septembre 2026 : système
visuel, architecture d'information, parcours réel. **Conception pure — rien
n'est implémenté.**

Sources : `cockpit.html` (2 289 lignes, 130 Ko), `prospect_app.py` (64 routes),
et l'état mesuré des données (`publications.csv`, `publications_archive.csv`,
`publications_states.json`, `prospects_tracking.csv`).

---

## Ce que l'audit a changé au diagnostic

Mon premier audit disait : « aucun composant, 78 boutons, 110 templates ». C'est
vrai, mais ce n'est pas le problème. La mesure du parcours réel a trouvé pire :

| Constat mesuré | Conséquence |
|---|---|
| **97 attributs `onclick`** | aucun événement délégué, aucune structure |
| **0 `pushState`, 0 hash** | aucune vue n'a d'adresse — pas de favori, pas de retour, rien à envoyer |
| **1 seule clé `localStorage`** (`fb_token`) | filtres, recherches, brouillons : tout meurt au rafraîchissement |
| **Aucun `beforeunload`** | fermer l'onglet ne prévient pas |
| **Aucun `AbortController`** | aucune tâche longue n'est annulable |
| Le toast de génération **se détruit après 4,2 s** | alors que la génération dure des minutes |
| `doSync()` **sans `try/catch`** | le réseau tombe, l'overlay reste bloqué pour toujours |
| **3 registres de statut** pour une publication | sa peur de publier deux fois est rationnelle |
| `scheduleAllModal()` : **3 `prompt()` natifs** | programmer un lot = taper « 1 », puis un nombre |
| **Aucune colonne `client`** dans les CSV | son contenu et celui de ses clients cohabitent par convention de nom |

**La conclusion qui commande tout** : le problème n'est pas que le cockpit soit
mal coloré. **C'est qu'il ne survit à rien.** Ni à un rafraîchissement, ni à une
coupure réseau, ni à une fermeture d'onglet, ni à un plantage.

---

## Les trois directions, convergées

### 1. La direction visuelle — « l'instrument, pas l'application »

Le cockpit est un poste de mesure, pas un produit. Trois engagements :

**Le fond disparaît.** `#08080c` est un vide, les cartes `#101014` sont posées
dessus. Pas de dégradé, pas d'ombre décorative — en sombre, une ombre ne lit
pas, c'est la bordure à 1 px qui sépare.

**L'or est un signal, pas une peinture.** Moins de 5 % des pixels d'un écran.
L'or dit deux choses, jamais trois : « ici tu agis » et « voilà l'état actuel ».

**La densité est une politesse.** Pas de 4 px. Le site public respire à 96 px ;
le cockpit respire à 16 et 24. Un utilisateur quotidien : le vide n'est pas de
l'élégance, c'est du défilement.

Le test : une capture imprimée doit ressembler à un cadran, pas à une plaquette.

### 2. L'architecture — quatre familles, plus un utilitaire

L'audit du parcours a montré qu'il n'y a pas douze tâches mais **cinq moments** :

| Moment | Objet | Cadence |
|---|---|---|
| **Piloter** — décider quoi finir aujourd'hui | la file du jour | chaque matin, 15-20 min |
| **Produire** — sortir les publications | publication | 2-3×/semaine, 45-90 min |
| **Acquérir** — trouver, qualifier, relancer | prospect | 1×/semaine |
| **Veiller** — voir ce qui marche ailleurs | analyse | 1×/semaine |
| **Régler** — fournisseur, skills, templates | configuration | rare, bloquant |

Les 12 panneaux échouent parce qu'ils exposent **les verbes de l'outil** au lieu
**des moments de l'utilisateur**. Le matin, il ne navigue pas : il décide.

**Structure proposée** : un rail de 240 px, quatre familles, cinq destinations,
des onglets à l'intérieur. Le compte client est un **sélecteur du bandeau**, pas
un niveau de navigation — un compte à la fois.

```
AUJOURD'HUI   →  la file de décisions du jour
PRODUIRE      →  Publications  [À valider · Programmées · Publiées · Archives]
ACQUÉRIR      →  Prospection   [Pipeline · Sources · Messages]
VEILLER       →  Veille        [Concurrents · Performance]
SYSTÈME       →  Réglages      [Fournisseur · Compétences · Apparence · Préférences]
```

**Des URL, une pile, deux choses à la fois.** L'app est servie en local par
Flask : une URL ne coûte rien et rapporte le retour arrière, le favori, le
rechargement sans perte. Le panneau latéral permet de consulter une fiche
pendant qu'une analyse tourne, sans quitter la liste.

**Le sort des 15 modales** — une règle, quatre tests dans l'ordre :
1. Agit sur un objet **déjà visible** ? → panneau latéral
2. Liste un ensemble **homogène** ? → onglet
3. A un **cycle de vie** propre ? → page avec URL
4. N'est qu'un **état** ou un point d'entrée ? → disparaît

Aucune ne reste une modale. **Une modale est un aveu** : soit l'objet n'avait
pas d'URL, soit la page n'avait pas la place.

### 3. Le parcours — cinq principes

1. **Toute tâche de plus de deux secondes est une entité visible qui survit à
   la page.** Un nom, un début, un état, un résultat, une reprise. Jamais un
   toast. Elle continue quand il ferme l'onglet — le cron n8n le fait déjà la
   nuit, l'outil doit se comporter pareil.
2. **Un écran doit pouvoir être nommé et retrouvé.** Un pipeline filtré, un
   client, un brouillon : se gardent, se rouvrent, s'envoient.
3. **Aucun état ne vit dans le seul navigateur.** Brouillons, filtres, tâches
   en cours : écrits côté serveur. Ce qu'il tape une fois ne se retape pas.
4. **L'outil parle du monde, pas de ses clics.** Confirmation pour ce qui vient
   de l'extérieur — le post est sorti, le prospect a répondu — avec une preuve.
   Le reste passe sans commentaire.
5. **La vue d'ouverture, c'est le métier du jour.** Le pipeline n'est pas
   l'identité du cockpit : c'est l'un de ses mardis.

---

## Une correction : les polices sont déjà embarquées

Le concepteur visuel a lu `mockups/assets/css/eperf.css` — **un ancien
emplacement**, 37 Ko contre 47 Ko pour le vrai fichier. Il en a conclu que les
polices venaient de Google Fonts et que le cockpit basculerait sur Georgia hors
ligne. Il en a fait **« la correction la plus rentable de tout ce document »**.

**C'est faux, et c'est déjà fait.** Vérifié sur le vrai fichier :
- **0 référence Google Fonts** dans les pages du site
- **9 `@font-face`** dans `eperf.css`, **9 fichiers `.woff2`** auto-hébergés
- Le cockpit que j'ai aligné hier porte lui aussi ses 7 `@font-face` locaux

La leçon vaut d'être notée : **trois agents ont travaillé sur ce projet, et deux
emplacements contiennent une copie du design system.** Le second est périmé.
Un concepteur qui lit le mauvais fichier produit une recommandation fausse avec
une assurance parfaite.

---

## Le vrai risque, dit franchement

**S'il ne change pas, il contournera l'outil.** Le scraping et le pipeline, il
les garde — rien d'autre ne fait scraping + score + lien WhatsApp au même
endroit. Mais le lot de publications, il le publiera **à la main sur Facebook et
Instagram**, parce que c'est là qu'il obtient la confirmation que le cockpit ne
lui donne jamais. Et l'analyse partira dans un tableur : `publications_archive.csv`
a déjà la forme d'un export.

L'outil garderait sa valeur en **début** de chaîne — produire — et la perdrait
en **fin** : vérifier, décider. Exactement la partie qui fait tourner une
entreprise.

---

## Ce qu'il faut décider

**1. La refonte inclut-elle la persistance côté serveur ?**
Trois des cinq principes l'exigent (tâches qui survivent, états hors navigateur,
brouillons). Ce n'est plus de la surface — c'est du travail sur `prospect_app.py`.
Sans lui, la refonte visuelle améliore un outil qui perd encore le travail.

**2. La file du jour : que contient-elle ?**
Elle n'existe pas aujourd'hui. Il faut choisir ce qu'elle agrège : échecs,
validations en attente, publications programmées, relances dues, quota IA.

**3. Le compte client dans le modèle de données.**
Aucun CSV n'a de colonne `client`. L'ajouter est une migration, pas un écran.

**4. Qui fait quoi.**
Le concepteur visuel propose la phase A (composants, ~200 lignes), l'architecte
propose cinq destinations. **Ma proposition** : je conçois et pose le socle
(composants + jetons + navigation), l'agent SOCIAL reprend les écrans — c'est
mécanique une fois le socle posé.

---

## Estimation

| Phase | Contenu | Volume |
|---|---|---|
| **A — socle** | 8 composants, jetons, rail de navigation | 1 session |
| **B — cinq destinations** | Réécriture des 12 panneaux en 5 destinations | 5 sessions |
| **C — persistance** | Tâches, brouillons, filtres côté serveur | 2-3 sessions |
| **D — détails** | Emojis → icônes, états vides, progression nommée | 1 session |

**Ce que je ne recommande pas** : faire A sans C. Un cockpit élégant qui perd
encore les brouillons au rafraîchissement reste un outil auquel on ne se fie
pas. **A et C ensemble, ou rien.**
