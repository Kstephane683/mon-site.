# ePerformance — dépôt du site

Site statique d'`eperformance.pro` : HTML/CSS/JS, sans framework et sans étape
de build. GitHub Pages publie directement la branche `main`.

Le blog vit dans un dépôt séparé : `Kstephane683/blog-eperformance`
(→ `blog.eperformance.pro`).

---

## ⚠️ Avant tout : deux choses à ne pas faire

**1. Ne jamais ajouter de fichier `.pdf` à ce dépôt.**
Les deux formations sont des produits payants (10 000 et 15 000 FCFA). Ils étaient
téléchargeables librement sur le site public jusqu'au 17 septembre 2026. Ils sont
désormais archivés hors du dépôt, dans
`/home/ballo/OX6A/_eperformance-prive/produits-payants/`. Pour les livrer aux
acheteurs, il faut un stockage privé ou un envoi par email — jamais le dépôt.

**2. Ne pas ajouter de `.nojekyll` sans vérifier `node_modules`.**
GitHub Pages exécute Jekyll par défaut, et l'exclusion de `node_modules` par Jekyll
était le seul mécanisme qui empêchait sa publication. Ce dossier n'est plus suivi
(608 fichiers retirés) ni présent sur le disque, et `.gitignore` le couvre — mais
un `.nojekyll` désactiverait ce filet pour tout le reste.

Ces deux règles sont vérifiées automatiquement : voir « Garde-fous » plus bas.

---

## Structure

```
├── index.html                    Accueil
├── automatisation.html           Pilier 03 — workflows n8n
├── ia.html                       Pilier 02 — IA générative
├── site-web.html                 Pilier 04 — création de site, 3 formules
├── formation.html                2 formations + pack
├── ebook.html                    2 ebooks + duo
├── diagnostic_eperformance.html  Tunnel de diagnostic (convertisseur principal)
├── cas-client-mlm.html           Étude de cas chiffrée
├── kstephane.html                À propos
├── mentions-legales.html  politique-confidentialite.html
├── cookies.html  cgv.html         Documents légaux
├── 404.html
├── robots.txt  sitemap.xml  llms.txt
├── assets/
│   ├── css/eperf.css             Design system clair/sombre (une seule feuille)
│   ├── js/eperf.js               Thème, révélations, menu, décomptes
│   ├── js/consent.js             Consentement, charge les traceurs après accord
│   └── img/                      Logos thématisables, favicons, image OG
├── photos/                       Images WebP
├── preview/                      Preview de refonte (voir plus bas)
├── docs/                         Audit, stratégie, ADR, rapport
├── .githooks/pre-commit          Garde-fou local
└── .github/workflows/            Garde-fou côté serveur
```

---

## Développement local

Aucune installation, aucune dépendance. Un serveur statique suffit :

```bash
cd /home/ballo/OX6A/site-eperformance
python3 -m http.server 8000
# → http://localhost:8000
```

> Si le port 8000 est occupé (c'est le cas si votre API « ePerformance API Flow »
> tourne), utilisez-en un autre : `python3 -m http.server 8010`.
> Puis ouvrez `http://localhost:8010/` pour le site, `http://localhost:8010/preview/`
> pour la refonte.

---

## Preview de la refonte

`preview/` contient la refonte complète, **non déployée** : 14 pages migrées vers
le design system, les deux nouvelles pages de pilier, le consentement cookies, les
documents légaux, les images WebP et les données structurées.

```bash
python3 -m http.server 8000
# → http://localhost:8000/preview/
```

Le preview est composé à partir de fragments. Pour modifier une page, éditez le
fragment dans `preview/_content/`, puis relancez la composition :

```bash
python3 preview/_build/compose.py           # régénère les 14 pages
python3 preview/_build/compose.py --check   # vérifie sans écrire
python3 preview/_build/compose.py --only index.html
```

**Pourquoi un script plutôt qu'un framework** : le générateur `agent-ia-web` émet
du HTML/CSS vanilla via un moteur de template maison (`artisan.py`). Un framework
aurait introduit des composants que ce générateur ne sait pas produire, éloignant
le site de son rôle de « miroir ». Le raisonnement complet est en
`docs/adr/ADR-0002-socle-technique-phase2.md`.

Le HTML composé est versionné : **le script n'est pas nécessaire au déploiement.**

---

## Déploiement

GitHub Pages publie la branche `main`, dossier racine. Aucun workflow de build.

```bash
git add -A
git commit -m "…"
git push origin main
```

Le site est servi en une à dix minutes (cache Fastly de 600 s).

### Déployer la refonte

Quand `preview/` est validé, les pages composées doivent être copiées vers la
racine du dépôt — le preview n'est pas servi en production :

```bash
# 1. Les pages composées prennent la place des anciennes
cp preview/*.html .
cp preview/robots.txt preview/sitemap.xml preview/llms.txt .

# 2. Les ressources partagées
cp -r preview/assets/. assets/
cp -r preview/photos/. photos/

# 3. Contrôler avant de committer
python3 -c "
import glob, re, os
manquants = []
for f in glob.glob('*.html'):
    for src in re.findall(r'(?:src|href)=\"((?!http|#|mailto|tel)[^\"]+)\"', open(f, encoding='utf-8').read()):
        if not os.path.exists(src) and not src.endswith('/'):
            manquants.append((f, src))
print('Ressources manquantes :', len(manquants))
for f, s in manquants[:20]:
    print(' ', f, '→', s)
"

# 4. Déployer
git add -A
git commit -m "feat: refonte — design system, pages de pilier, consentement"
git push origin main
```

Les quatre images converties en WebP (5,7 Mo économisés) sont dans `preview/photos/`.
Elles sont référencées en `.webp` par les pages composées : **conserver les anciens
PNG n'est pas nécessaire**, mais ne pas les supprimer avant d'avoir vérifié que
plus aucune page ne les référence.

Les anciennes URL restent valides : `/formation/`, `/kstephane/`, `/merci-*`
redirigent déjà vers leur équivalent `.html`, et `/cookies/`, `/mentions-legales/`,
`/politique-confidentialite/` servent le bon contenu.

---

## Garde-fous

Deux mécanismes empêchent la réintroduction des fuites fermées le 17/09/2026 :

**Hook local** — refuse PDF, `.backup`, `node_modules` et code serveur :

```bash
git config core.hooksPath .githooks   # à faire une fois par clone
```

**Workflow CI** — `.github/workflows/check-no-leaks.yml` scanne les fichiers
versionnés à chaque push sur `main` et vérifie aussi qu'aucune URL du sitemap ne
pointe vers un fichier absent.

Le second est le vrai filet : le hook local ne protège que la machine sur laquelle
il est configuré, alors qu'un commit peut arriver par l'interface web de GitHub.

---

## Design system

Une seule feuille : `assets/css/eperf.css`. Trois couches de jetons :

```css
/* A — contrat du générateur agent-ia-web (compatibilité miroir) */
--primaire  --secondaire  --accent  --fond-clair  --police-titres  --arrondi-carte

/* B — noms ePerformance, conservés pour ne rien casser */
--bg  --bg2  --card  --text  --muted  --gold  --border  --border-strong

/* C — thème, ce que le bouton bascule */
:root { /* clair */ }   [data-theme="dark"] { /* sombre */ }
```

Des alias relient A et B, donc un composant écrit selon le contrat du générateur
fonctionne ici, et réciproquement.

**Thème** : clair par défaut, sombre via `data-theme` sur `<html>`, persisté dans
`localStorage` (`eperf-theme`). Le script inline en `<head>` l'applique avant le
premier rendu — aucun FOUC. **Ne pas déplacer ce script** : il doit rester bloquant.

**Contrastes** : les 200 paires texte/fond ont été mesurées dans un navigateur réel
sur les 14 pages dans les deux thèmes. Toute nouvelle couleur doit être validée de
la même façon avant d'être ajoutée.

**Logo** : deux `<img>` échangées en CSS sur `[data-theme="dark"]`. Ne pas revenir
à un `<picture media="(prefers-color-scheme: dark)">` : ce media réagit à la
préférence système, pas au bouton, et les deux se désynchronisent.

---

## Consentement et traceurs

`assets/js/consent.js` est le **seul** endroit qui charge GA4, Microsoft Clarity et
Meta Pixel. Aucun traceur tiers ne part avant un choix explicite.

- Nécessaires (toujours actifs) : thème, choix de consentement — `localStorage`
- Mesure d'audience (consentement) : GA4 `G-Z7QW8BCYQ1`, Clarity `w2e89n0biv`
- Publicité (consentement) : Meta Pixel `1592627695615531`

**Ne pas réintroduire de script de mesure en dur dans une page.** Pour rouvrir le
bandeau depuis un autre endroit du site : `window.eperfConsent.open()`.

Pour redemander le consentement à tous les visiteurs, incrémenter `VERSION` dans
`consent.js` — l'ancien choix devient invalide et le bandeau réapparaît.

---

## Documents de référence

| Fichier | Contenu |
|---|---|
| `docs/audit-initial.md` | Audit complet : fuites, SEO, performance, accessibilité, contenu |
| `docs/strategie-refonte.md` | Stratégie de contenu, identité visuelle, ordre d'exécution |
| `docs/adr/ADR-0001-socle-technique.md` | Premier choix d'architecture |
| `docs/adr/ADR-0002-socle-technique-phase2.md` | Réexamen : pourquoi pas Astro |
| `RAPPORT_REFONTE_EPERFORMANCE.md` | Rapport de phase 1 |
| `RAPPORT_PHASE2.md` | Rapport de phase 2 |

---

## Points en attente

1. **Compléter les documents légaux.** Les mentions légales, la politique de
   confidentialité et les CGV contiennent des marqueurs
   `<span class="legal-todo">[À COMPLÉTER : …]</span>` : RCCM, raison sociale,
   adresse physique, identifiant fiscal, déclaration ARTCI, DPO. **Ne pas mettre
   ces pages en ligne avant de les avoir renseignées** — un faux numéro RCCM est
   pire que pas de numéro.
2. **Confirmer le prix du pack de formation** (25 000 FCFA = somme des deux
   formations). L'ancien affichage facturait 150 000, soit six fois la somme.
3. **Trancher sur la note « 4,9/5 ».** Elle a été retirée faute de source
   vérifiable. Si elle est rétablie, il faut publier la source et le nombre d'avis.
4. **Décider du sort de la formule à 350 000 FCFA** sur `cas-client-mlm.html`,
   qui ne présente que deux paliers sur trois.
