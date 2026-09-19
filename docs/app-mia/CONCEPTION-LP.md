# CONCEPTION LP — Mia (`mia.eperformance.pro`)

**Date** : 19 septembre 2026 · **Agent** : SITE · **Cadre** : `CONSIGNE-SITE.md` §3 de CHATBOT (fait foi), contenu sectoriel réel exporté du noyau.

**Livrable démontrable** : `docs/app-mia/maquettes/lp-mia.html` — la LP entière en un fichier statique, jetons du noyau, indexable sans JavaScript, clair et sombre. La conception n'est pas une promesse : elle se règle dans le navigateur.

---

## 1. La stratégie de conversion

Deux visiteurs, deux chemins, une seule page :

| Profil | Chemin | Preuve mesurée |
|---|---|---|
| **Découvre** (le propriétaire qui cherche) | Sélecteur de secteur → accroche de SON métier → capacités réelles → démonstration → installation | le sélecteur est le premier élément du hero, avant le titre |
| **Déjà client** | Lien « Vous avez déjà Mia ? **Gérez-la** » en haut à droite → l'application | jamais enfoui sous le pli, jamais un onglet de plus |

La décision de structure : **le sélecteur de secteur avant le titre**. La promesse de Mia change du tout au tout selon le métier — un restaurateur et un agent immobilier n'entendent pas la même phrase. Le titre du hero est donc généré par le secteur (`L'assistante qui répond pour votre restaurant / pour votre immobilier…`), avec l'accroche **réelle** du noyau (l'`intention_reformulee`, mot pour mot — jamais réécrite).

**Ce qui est mesuré** : clic par secteur sur le CTA « Installer Mia », taux de changement de secteur avant clic, scroll jusqu'à la démonstration, clic « Gérez-la ».

## 2. Le sélecteur de secteur — l'élément structurant

- **Position** : au-dessus du titre (S1) et en miroir dans le CTA final (S8). Deux instances, un seul état.
- **Comportement** : cliquer un secteur change, instantanément — le titre du hero, l'accroche (donnée réelle), les cartes de capacités (S2), et l'exemple de conversation suggéré en S4 (à venir). Vérifié au navigateur : sélection « Immobilier » → accroche réelle du secteur + thèmes `visite, financement, frais et notaire, estimation` + miroir synchronisé.
- **Défaut** : Restauration (premier secteur du noyau), rendu **en balisage** — la page est complète et indexable sans JavaScript.
- **Accessibilité** : `role="group"` avec libellé, `aria-pressed` sur chaque bouton, ordre de tabulation naturel, focus visible or.
- **Persistance** : choix mémorisé (localStorage) — à l'ouverture suivante, la page parle le métier du visiteur.

## 3. Les sections — l'intention de chacune

| # | Section | L'intention | Ce qui n'y est PAS |
|---|---|---|---|
| S1 | **Hero** | titre par métier, promesse réelle, double CTA, note d'installation | aucun chiffre inventé, aucune capture générique |
| S2 | **Ce que Mia sait faire** | les `faq_themes` réels du secteur, badge « Mia répond » | toute capacité « bientôt » tant qu'elle n'est pas branchée (C2) |
| S3 | **Comment ça marche** | 3 étapes côté client, aucune étape technique | — |
| S4 | **Démonstration** | un échange qui illustre les thèmes réels ; l'encart dit précisément ce qu'il est : **une illustration**, la démo interactive arrive avec le domaine de démonstration | la prétention que l'échange est « réel » — corrigée en cours de route, c'était un défaut C6 de ma part |
| S5 | **L'application** | trois mini-téléphones dessinés en CSS (accueil, conversations, compétences — les écrans de la maquette validée), 6 fonctionnalités, CTA | captures de l'ancienne app ePerformance (interdites par la mission) |
| S6 | **Preuves** | trois preuves mesurables : 12 métiers / 11 contrôles automatiques par secteur (banc), 359 tests backend (pytest), la prise en main toujours possible | témoignages (aucun client réel), tout chiffre non mesuré |
| S7 | **FAQ** | prix (tarification non arrêtée, dite franchement), **« qui voit les conversations ? »** (RGPD — obligation, pas argument), ce que Mia fait/ne fait pas (C2), installation, langues | — |
| S8 | **CTA final** | miroir du sélecteur + les deux boutons | — |

**Zéro nom d'agent, zéro emoji, zéro hexadécimal hors primitives** — vérifié par script.

## 4. La performance — budget

- **Poids total visé** : ≤ 60 Ko HTML+CSS+JS avant polices (la maquette actuelle : 32 Ko tout compris) ; polices `.woff2` auto-hébergées, `font-display:swap`.
- **Zéro requête externe** : vérifié par script — aucune URL `http(s)` dans le fichier.
- **Vidéo hero** (quand la chaîne existe) : `muted playsinline autoplay loop`, `preload="none"`, affichée seulement au-delà de 768 px et hors `prefers-reduced-motion`, repli = dégradé accent-trace. **Ne bloque jamais la mise en ligne** (C7).
- **LCP** : le titre est du texte — aucun média critique bloquant. **CLS** : nul par construction (aucun contenu injecté qui décale — le sélecteur modifie des tailles fixes). **JS** : un seul bloc (~2 Ko) qui ne fait que le sélecteur et le thème — la page est lisible et complète sans lui.

## 5. Clair et sombre

`[data-theme='dark']` — les mêmes jetons que la maquette app validée (l'identité or `#c9a96e` sur `#08080c` en sombre, papier `#fdfcfa` en clair). Bascule manuelle visible + `meta theme-color` suit `--fond`. Persistance locale, `prefers-color-scheme` en défaut si aucun choix.

## 6. Ce que cette LP n'est pas (vs la LP v1 archivée)

- **Pas de contenu sectoriel réécrit à la main** : le v1 inventait des formulations ; celle-ci affiche les intentions réelles du noyau, mot pour mot.
- **Pas de promesse opérationnelle** : le v1 vendait réservation et commandes ; celle-ci applique C2 ligne par ligne.
- **Pas de page d'app marketing** : une LP, un objectif — présenter, prouver, faire installer. Le reste (docs, tarification détaillée) viendra quand il sera réel.

## 7. Contrat de structure pour le garde-fou (à traduire par CHATBOT)

Le contrôle actuel impose le DOM de la LP v1 (ids, classes, un nom de restaurant en dur) — il bloquera cette conception. Le contrôle d'intention à écrire, sur la base de ce qui précède :

**Sections obligatoires, dans cet ordre** : `header` (marque + accès « Gérez-la ») · `main` contenant 8 sections : hero (avec sélecteur de secteur), capacités, comment-ça-marche, démonstration, application, preuves, FAQ, CTA final · `footer`.

**Éléments obligatoires** :
- hero : un `h1`, un groupe `role="group"` de sélection de secteur, **deux** CTA (installer + voir en action) ;
- capacités : au moins 4 cartes avec un état « Mia répond » explicite ;
- FAQ : au minimum la question RGPD (« qui voit les conversations ») et la question prix ;
- CTA final : les deux CTA.

**Éléments variables libres** : les libellés des secteurs et des capacités (ils viennent du contenu sectoriel généré), le nombre exact de cartes, la formulation des FAQ.

**Interdits inchangés** : zéro emoji · zéro nom d'agent (agent, modèle, compteur) · zéro hexadécimal en dur hors le bloc de primitives · zéro référence externe au chargement · les mentions « bientôt » ne décrivent jamais une capacité comme disponible.

**C2 en contrôle automatique** : toute occurrence de « réserve », « commande », « paie » comme capacité présente doit coexister avec un badge « bientôt » dans la même carte — sinon le push échoue.
