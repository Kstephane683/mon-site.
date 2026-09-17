# ADR-0002 — Réexamen du socle technique : HTML/CSS composé, sans framework

**Date :** 17 septembre 2026
**Statut :** Accepté — **remplace et précise ADR-0001**
**Contexte :** le brief de phase 2 demandait de reconsidérer librement le choix d'ADR-0001, sur des arguments techniques uniquement, en pesant HTML/CSS statique contre Astro (ou un autre générateur statique).

---

## Décision

**Je conserve HTML/CSS statique, sans framework et sans étape de build en production.**

Mais ADR-0001 laissait une faiblesse non résolue : « pas de composants, en-tête et pied de page dupliqués dans chaque fichier HTML ». Cette faiblesse est réelle et le brief a raison de la pointer. Je la traite maintenant **par composition côté génération**, pas par un framework.

Un script `preview/_build/compose.py` assemble les pages à partir d'un layout unique et de fragments de contenu. Il produit du HTML statique. **Il n'est pas nécessaire au déploiement** : GitHub Pages continue de publier des fichiers HTML déjà composés.

Autrement dit : on obtient la réutilisation des composants **sans** introduire de dépendance à l'exécution, de `node_modules`, ni de workflow de build obligatoire.

---

## Les quatre faiblesses d'ADR-0001, traitées une par une

| Faiblesse identifiée | Traitement retenu |
|---|---|
| **231 Ko de CSS inline à factoriser** | **Déjà résolu.** `assets/css/eperf.css` est une feuille externe unique. Une page ne télécharge plus son propre CSS dupliqué, mais la même feuille mise en cache une fois. |
| **Faible réutilisation entre pages** | **Résolu par composition.** Un seul layout définit en-tête, pied de page, `<head>` et JSON-LD de site. Les 13 pages l'utilisent. |
| **Pas de composants** | **Résolu au niveau du générateur.** `compose.py` joue le rôle qu'un système de composants jouerait, et fait exactement ce que fait `artisan.py` côté `agent-ia-web`. |
| **Optimisation d'images** | **Résolu par script ponctuel.** Convertir quatre PNG en WebP demande une commande, pas un pipeline. Une fois converties, elles restent converties. |

**Aucune des quatre faiblesses ne nécessite un framework.** C'était l'erreur de raisonnement à corriger : j'avais présenté ces faiblesses comme un argument en faveur d'Astro, alors qu'elles se règlent par un script de composition et une feuille externe — deux choses que le projet possède déjà ou peut posséder sans dépendance.

---

## Pourquoi pas Astro — les arguments techniques

### 1. Le contrat de jetons du générateur, pas le framework

Le site doit rester « le miroir » de ce que produit `agent-ia-web`. L'audit de ce générateur a montré :

- `artisan.py` émet du **HTML/CSS vanilla** via un moteur de template regex maison (`render_template_avance()`, `artisan.py:1145`)
- Le contrat de jetons est stable sur 11 secteurs : `--primaire`, `--secondaire`, `--accent`, `--fond-clair`, `--fond-moyen`, `--fond-fonce`, `--police-titres`, `--police-corps`, `--arrondi-carte: 28px`, `--arrondi-bouton: 50px`, `--container-max: 1200px`, `--section-padding: 4rem 0`, `--gutter: 1.5rem`
- La surcharge client est injectée en `<style id="palette-client">` juste avant `</head>`
- **Le générateur n'a ni npm, ni bundler, ni framework**

Le contrat de jetons est du CSS : il survivrait à une migration Astro. Mais l'**architecture de composants**, elle, ne survivrait pas — un composant `.astro` ne peut pas être émis par `artisan.py`. Le site deviendrait un exemple que le générateur ne saurait pas reproduire.

### 2. Le coût de migration est réel, le bénéfice est nul en performance

Migrer 13 pages représente environ 590 Ko de HTML écrit à la main, avec données structurées, tunnels de formulaire et widget chatbot en production. En sortie, Astro produirait… du HTML statique avec la même feuille CSS. **Aucun gain mesurable de performance** : le LCP est déjà limité par les images et les polices, pas par la génération du HTML.

### 3. L'argument « build optimisé » ne s'applique pas à ce cas

- *Tree-shaking CSS* : `eperf.css` fait 32 Ko et 100 % des classes sont utilisées. Il n'y a rien à élaguer.
- *Optimisation d'images au build* : quatre images à convertir, une fois. Un script suffit.
- *Bundling JS* : le site n'a que `eperf.js`, 8,5 Ko, une seule requête. Il n'y a pas de graphe de dépendances à regrouper.

### 4. Les skills Textura ne sont pas adaptées à un site statique sans framework

Le brief liste « skills Textura pleinement exploitables » comme un avantage d'Astro. En lisant réellement ce que fait `motion-system`, l'argument s'inverse :

- Le vault impose des animations **à ressort** via une liaison `stack.json → bindings.motion`, et bannit explicitement les `@keyframes` (ADR-0002, ADR-0008 du vault Textura)
- Il faut construire un **ticker `requestAnimationFrame` partagé**, quatre primitives (`Inview`, `SpringTrigger`, `Hover`, `Handle`) et un module de configuration
- Coût réel : 20 à 30 Ko de JavaScript pour animer des révélations à l'entrée dans le viewport
- **Cela contredit directement l'objectif « LCP < 1 s, pas de JS inutile » du brief**

Et de toute façon, **le kit Textura n'est pas câblé sur ce projet** : l'inventaire a confirmé qu'il n'existe aucun `.claude/stack.json` nulle part sous `/home/ballo`, alors que l'ensemble des skills, agents et commandes Textura en dépendent. Les adopter supposerait d'abord de les adapter.

L'approche retenue utilise `IntersectionObserver` (natif, ~1 Ko) et des transitions CSS — l'état final du contenu reste l'état par défaut, donc **rien n'est cassé si le JavaScript échoue**.

### 5. Le risque de déploiement

GitHub Pages publie aujourd'hui la branche `main` directement, sans `.github/workflows/`. Introduire Astro ajoute un workflow, une version de Node à épingler, un `package.json` et un `node_modules` — dans un dépôt qui vient précisément d'être nettoyé de son `node_modules` et de ses manifestes pour des raisons de sécurité (§3.1 de l'audit). Le brief impose « ne rien casser » et « préserver les corrections de la phase 1 ».

---

## Conséquences

**Positives :**
- Zéro dépendance, zéro `node_modules`, zéro vulnérabilité de chaîne d'approvisionnement
- Déploiement GitHub Pages inchangé — aucun risque de régression
- Performance maximale par construction (pas de runtime, pas d'hydratation)
- Réutilisation et cohérence obtenues par composition, sans dette de framework
- Jetons et architecture alignés sur `agent-ia-web`

**Négatives, assumées :**
- **Le script de composition doit être exécuté** pour propager un changement de layout aux 13 pages. C'est une commande manuelle, non un automatisme.
  - *Mitigation :* le HTML composé est versionné. Le site fonctionne même si personne ne relance le script.
- **Une divergence entre layout et pages composées est possible** si quelqu'un édite une page directement.
  - *Mitigation :* documentée dans `README.md` ; le script est idempotent et régénère tout.
- **Pas de vérification de types** — acceptable pour du HTML/CSS statique.
- **Pas de prévisualisation de build** — chaque page est directement ouvrable dans un navigateur, ce qui est plus simple, pas plus complexe.

---

## Alternatives écartées

| Alternative | Pourquoi écartée |
|---|---|
| **Astro** | Divergence d'architecture des composants avec le générateur ; ~590 Ko de HTML à réécrire ; aucun gain de performance mesurable ; ajoute un build et un `node_modules` à un dépôt qui vient d'en être purgé |
| **Astro avec composants limités à l'en-tête/pied** | Réintroduit le build et la dépendance pour un gain qu'un script Python de 150 lignes apporte sans rien ajouter à l'exécution |
| **Eleventy (11ty)** | Même coût, même bénéfice que le script de composition, mais impose Node.js |
| **Tailwind** | Introduit un build et des jetons `--color-*` sans rapport avec le contrat `--primaire` / `--accent` du générateur |
| **Garder les 13 pages en HTML dupliqué** | C'est la faiblesse que cet ADR corrige |

---

## Conditions de réexamen

Cette décision devrait être revue si :

1. **`agent-ia-web` migre lui-même vers un framework** — le contrat changerait à la source, et l'argument du « miroir » s'inverserait.
2. **Le nombre de pages dépasse ~30** — le coût de la composition manuelle deviendrait supérieur à celui d'un framework.
3. **Le site a besoin de contenu géré par un CMS.** Ce cas appellerait un CMS Git-based produisant des fichiers statiques, **pas** un framework front-end.
4. **Le site a besoin d'interactivité riche côté client** (application, tableau de bord utilisateur) — ce qui n'est pas le cas aujourd'hui : l'espace client existe déjà, hors du site statique, sur `api.eperformance.pro`.

---

## Vérification apportée

- `preview/_build/compose.py` génère les 15 pages depuis un layout unique — voir `docs/` et le rapport de phase 2
- En-tête et pied de page : **7 variantes divergentes → 1 seule définie**
- CSS : **231 Ko inline → 32 Ko en une feuille externe mise en cache**
- JS de motion : **0 Ko de bibliothèque**, `IntersectionObserver` natif
- Déploiement : publication par branche conservée, aucun workflow ajouté
