# Données légales à compléter — rappel

**Créé le 19 septembre 2026, à la demande du propriétaire.**

Les pages légales ont été publiées **sans leurs données d'identification** : les
marqueurs `[À COMPLÉTER : …]` étaient visibles en production sur trois pages —
mentions légales, politique de confidentialité et CGV. Ils ont été retirés le
19 septembre. **Les pages sont désormais publiées avec des informations
incomplètes, ce qui est un état temporaire assumé, pas un état correct.**

## Ce qui manque, et où

| Donnée | Pages concernées | Pourquoi c'est obligatoire |
|---|---|---|
| Raison sociale complète | mentions légales, CGV, politique de confidentialité | Identification de l'éditeur — obligation de la loi ivoirienne 2013-450 et des CGV |
| Numéro RCCM | mentions légales, CGV | Immatriculation au registre du commerce |
| Identifiant fiscal (DGI) | mentions légales, CGV | Identification fiscale de l'entreprise |
| Adresse physique | mentions légales, politique de confidentialité | Établissement de l'éditeur |
| Délégué à la protection des données — nom, ou mention explicite qu'aucun n'est désigné | politique de confidentialité | Loi 2013-450 et RGPD : le lecteur doit savoir à qui s'adresser |
| Numéro de déclaration ARTCI | politique de confidentialité | Déclaration des traitements auprès de l'autorité ivoirienne |

## Comment procéder

1. Réunir les six informations ci-dessus.
2. Les poser dans les fragments sources — `preview/_content/mentions-legales.html`,
   `politique-confidentialite.html`, `cgv.html` — **jamais dans les pages de la
   racine**, qui sont écrasées à la composition suivante.
3. Recomposer : `python3 preview/_build/compose.py`, puis copier vers la racine.
4. Contrôler avant de copier : `python3 scripts/verifier-blocs-critiques.py`.
5. Vérifier en production que les six valeurs apparaissent.

## Ce qui a été retiré, et pourquoi ce n'était pas anodin

Quatre lignes en liste sur les mentions légales et les CGV, quatre sur la
politique de confidentialité, plus un marqueur dans une phrase invitant à
ajouter un bouton « Gérer mes cookies ».

Ce dernier mérite une précision : **le bouton existe déjà**, en bas de chaque
page. Le marqueur demandait de l'ajouter alors qu'il était là. La phrase a été
réécrite pour le mentionner, pas pour le promettre.

## La leçon

Le rappel de validation disait : « NE PAS publier les pages légales en l'état ».
Elles l'ont été. Rien dans la chaîne de vérification ne contrôlait la présence
de marqueurs `[À COMPLÉTER]` dans les pages publiées — les contrôles portaient
sur les blocs techniques, pas sur le contenu rédactionnel.

**Un contrôle à ajouter** : chercher `[À COMPLÉTER` et les marqueurs de gabarit
dans les fichiers de la racine, au même titre que les blocs critiques.
