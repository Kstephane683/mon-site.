# Stratégie du bouton WhatsApp

Décision d'emplacement, évaluation des options, et ce qui change quand le
chatbot arrivera. Appliquée sur le site et le blog.

---

## Le constat, corrigé

Le point de départ était : « les 115 liens WhatsApp existent mais aucun n'est
un bouton visible ». Vérification faite, la réalité est plus nuancée — et
c'est important, parce que la solution en dépendait.

| | Réalité constatée |
|---|---|
| Boutons stylés (`btn btn-wa`) | **27** sur 14 pages |
| Liens textuels | 23, souvent dans une phrase |
| Bouton flottant | **aucun** |
| Bouton dans le header | **aucun** |
| Barre fixe en bas, sur mobile | **existante**, avec Diagnostic + WhatsApp |

Deux conclusions :

1. **Sur mobile, le contact WhatsApp était déjà accessible en permanence.**
   La barre `.sticky-cta` contient un bouton WhatsApp depuis l'origine.
2. **Sur desktop, il n'y avait rien.** Les 27 boutons sont tous dans le flux
   du contenu, souvent en fin de page. Un visiteur qui décide d'écrire en
   arrivant doit faire défiler.

Le problème réel n'était donc pas « aucun bouton », mais « aucun bouton
persistant sur desktop ». C'est ce que la décision traite.

---

## Les options évaluées

| | Option | Verdict |
|---|---|---|
| **A** | **Bas-gauche** | **RETENUE** |
| B | Header seul | Écartée |
| C | Bandeau sticky en haut | Écartée |
| D | Apparition après scroll | Écartée |
| E | Intégré au futur chatbot | Écartée |
| F | Bas-droite, déplacé plus tard | Écartée |
| G | Combinaison contextuel + sticky | **Retenue partiellement** |

### Pourquoi A

**Le chatbot occupera le bas à droite.** C'est la contrainte qui commande tout :
c'est la position standard des widgets de conversation, personne ne s'attend à
le trouver ailleurs.

Le bas-gauche est donc **la seule position libre** qui réponde aux deux
scénarios. Ce n'est pas un compromis, c'est la conséquence directe de la
contrainte.

L'inconvénient annoncé — « symétrie parfois chargée » — se maîtrise : le bouton
WhatsApp est une pastille ronde de 56 px, le chatbot aura sa propre pastille,
et les deux seront séparés par toute la largeur de l'écran. Une symétrie
chargée viendrait de deux boutons de même poids visuel côte à côte ; ce n'est
pas le cas ici.

### Pourquoi pas F, qui était pourtant « optimal à chaque étape »

F placerait le bouton en bas-droite maintenant, et le déplacerait en bas-gauche
quand le chatbot arriverait. Sur le papier, chaque étape est optimale.

Trois raisons de refuser :

1. **Le chantier au pire moment.** Le jour de l'installation du chatbot est
   déjà chargé : tests, conversations, réglages. Y ajouter un déplacement de
   bouton et sa vérification est une source d'erreur évitable.
2. **Le changement de repère.** Un visiteur habitué au bouton en bas à droite
   ne le retrouve plus. Sur un site marchand, déplacer un point de contact
   coûte toujours quelques conversions.
3. **L'argument de F est faible.** « Optimal à chaque étape » vaut pour
   l'esthétique ; A est optimal pour l'usage, aux deux étapes. L'usage prime.

### Pourquoi les autres sont écartées

**B — header seul.** Le header porte déjà le CTA diagnostic. Deux boutons de
même rang se neutralisent : le visiteur ne sait plus lequel est l'action
principale. Le header garde un bouton WhatsApp discret, mais il ne peut pas
être le point de contact principal.

**C — bandeau sticky en haut.** Le blog a déjà une barre de progression de
lecture en haut. Deux barres superposées, et la lecture perd de la hauteur
utile sur mobile. Rédhibitoire pour un site dont 80 % du trafic est mobile.

**D — apparition après scroll.** Le premier écran est précisément le moment où
le visiteur décide de rester ou de partir. Un visiteur qui veut écrire tout de
suite ne verrait rien. Le bouton doit être là dès le premier écran.

**E — intégré au chatbot.** Ne résout pas le problème posé : il n'y a pas de
chatbot aujourd'hui. Un contact caché derrière une fonctionnalité inexistante
n'est pas un contact.

**G — combinaison.** Retenue **partiellement** : le bouton flottant couvre la
permanence, les boutons contextuels couvrent les moments de décision. Mais pas
de « sticky intelligent » qui apparaîtrait et disparaîtrait selon le contexte —
un point de contact qui bouge est un point de contact qu'on ne trouve pas.

---

## La décision

**Bouton flottant en bas à gauche, desktop uniquement** (`> 720 px`), complété
par des boutons contextuels aux moments de décision et un bouton discret dans
le header.

### Le cas du mobile

Sur mobile, le bouton flottant **ne s'affiche pas**. Ce n'est pas un oubli :
la barre `.sticky-cta` contient déjà Diagnostic + WhatsApp, en bas, toujours
visible. Ajouter un second bouton flottant aurait créé un doublon à l'écran et
mangé de la hauteur utile.

### Le cas du bandeau cookies

Le bandeau cookies occupe le bas de l'écran, pleine largeur, avec un `z-index`
supérieur. Tant qu'il est ouvert, **le bouton flottant s'efface** — règle CSS
`body:has(.consent:not([hidden])) .wa-float { display: none }`.

Le bandeau est une décision à prendre ; le bouton est une commodité. La
commodité s'efface devant la décision. Et ainsi, le bouton ne masque jamais le
bandeau.

---

## Avant et après le chatbot

### Aujourd'hui — sans chatbot

| Emplacement | Visible sur | Rôle |
|---|---|---|
| Bouton flottant bas-gauche | desktop | Contact permanent |
| Barre fixe bas | mobile | Contact permanent (Diagnostic + WhatsApp) |
| Header (outline discret) | desktop | Rappel, sans concurrencer le CTA |
| Boutons contextuels | les deux | Au moment de la décision |

### Le jour du chatbot

**Rien à déplacer.** Le chatbot prend le bas à droite, le bouton WhatsApp est
déjà à gauche. Les deux cohabitent.

Deux points d'attention le jour venu :

1. **Sur mobile, la barre fixe en bas et la pastille du chatbot se
   chevaucheraient.** Le chatbot devra être remonté au-dessus de la barre
   (`bottom: 78px`, la hauteur déjà réservée par `body { padding-bottom: 78px }`).
   C'est un réglage d'une ligne dans le CSS du widget.
2. **Ne pas fusionner les deux contacts.** Un chatbot et un humain sur WhatsApp
   ne répondent pas à la même intention. Les garder séparés est un choix, pas
   un manque d'optimisation.

---

## Ce qui a été appliqué

### Site — 5 pages

| Page | Boutons ajoutés |
|---|---|
| Accueil | après les formules · section diagnostic |
| site-web.html | 3 cartes de formule (elles n'avaient aucun CTA) · fin de page |
| automatisation.html | après les 4 cas d'usage |
| ia.html | après les 4 usages |
| diagnostic_eperformance.html | sous le formulaire, en sortie de secours |

### Blog — 88 pages

- Bouton flottant sur toutes les pages
- Bouton discret dans le header
- Bouton dans le CTA final des **81 articles**, à côté du lien de service

### Transverse

- `data-cta="whatsapp"` sur tous les boutons — le tracking déployé les compte
  déjà comme clics WhatsApp, sans modification
- `aria-label` sur chaque bouton, `:focus-visible` sur le bouton flottant
- `eperf.css` resynchronisé entre le site et le blog (MD5 identique) :
  `.wa-float` fait désormais partie du design system partagé

---

## Ce qu'il faudra vérifier

**Sur un vrai téléphone**, deux choses que je ne peux pas tester ici :

1. La barre fixe du bas ne masque pas le dernier bouton des pages longues —
   normalement non, `body { padding-bottom: 78px }` réserve la place.
2. Le bouton du header ne déborde pas entre 721 et 900 px de large, où le menu
   de navigation est encore en ligne. C'est la zone la plus serrée du header.
