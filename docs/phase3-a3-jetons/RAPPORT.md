# A3 + alignement des jetons — Phase 3

Date : 19 septembre 2026. Contrôles : `verifier-blocs-critiques.py` →
publication sûre · `verifier-chatbot.py` → 15/15 site. CSS site et blog
identiques (MD5 `4a7bfba4`).

---

## 1. A3 — le filet du bouton secondaire

**Audit.** Deux familles de boutons bordés sur le site :

| Bouton | Jeton de bordure | Ratio sur `--bg` | Verdict |
|---|---|---|---|
| `.btn-outline` | `--border-strong` | **3,36:1** | conforme |
| `.btn-ghost` | `--border` | **1,27:1** | **sous le seuil** |

Le seuil applicable est **3:1** (WCAG 1.4.11, composants d'interface) — un
bouton bordé se reconnaît à son contour, il doit donc être discernable.

**Décision : uniformiser sur `--border-strong`.** Le site utilisait les deux
jetons pour le même travail, et le widget est déjà aligné sur
`--border-strong`. Corriger `.btn-ghost` aligne le site sur le produit **et**
sur son propre `.btn-outline`.

**Correction** : `.btn-ghost { border-color: var(--border) }` →
`var(--border-strong)`. Un jeton, aucun changement de structure.

---

## 2. Les trois jetons en avance sur le noyau

| Jeton | Avant | Après |
|---|---|---|
| `--red-bg` | `rgba(180, 45, 45, 0.06)` | `color-mix(in srgb, var(--erreur) 6%, transparent)` |
| `--red-border` | `rgba(180, 45, 45, 0.28)` | `color-mix(in srgb, var(--erreur) 28%, transparent)` |
| `--shadow-gold` | `rgba(133, 107, 55, 0.14)` | `color-mix(in srgb, var(--gold) 28%, transparent)` |

**Une variable introduite** : `--erreur: rgb(168, 48, 47)` — la valeur de base
du widget, qui n'existait pas côté site. Les deux compositions `--red-*` en
dérivent, comme dans le widget. Le thème sombre reçoit la sienne
(`rgb(220, 60, 60)`).

**Une simplification assumée sur `--shadow-gold`** : le widget compose depuis
`--accent-halo`, un jeton qui n'existe pas ici. J'ai composé depuis `--gold`,
qui porte **la même valeur** depuis D6 (`#856b37`). Introduire un jeton
supplémentaire pour une valeur identique aurait ajouté un nom sans ajouter de
sens. **L'effet visuel est identique.**

Les deux thèmes sont traités : `--shadow-gold` clair et sombre.

---

## 3. Ratios avant / après

| Élément | Avant | Après |
|---|---|---|
| `.btn-ghost` bordure | **1,27:1** ✗ | **3,36:1** ✓ |
| `--gold` (D6, déjà fait) | 4,37:1 sur `--bg2` ✗ | 4,64:1 ✓ |
| `--gold2` (D6, déjà fait) | 4,16:1 sur `--bg2` ✗ | 5,77:1 ✓ |

Les jetons `--red-*` et `--shadow-gold` sont des fonds translucides et des
ombres : ils ne portent pas de texte, le seuil de contraste ne s'y applique
pas. Le changement porte sur la **cohérence de composition** avec le widget,
pas sur l'accessibilité.

---

## 4. Non-régression

- 15 pages publiées, tous les blocs critiques présents
- SDK chatbot émis par le générateur (contrat C1 intact) — 15/15
- Aucun jeton renommé (contrat C3 respecté) : les noms `--red-bg`,
  `--red-border`, `--shadow-gold` sont inchangés, seules leurs valeurs de
  composition changent
- CSS site = CSS blog (MD5 identique)

---

## 5. Écarts documentés

**Six `rgba()` subsistent dans d'autres jetons** (ombres essentiellement). Ils
ne sont pas concernés par cette passe — le contrat portait sur trois jetons
précis. À traiter si une passe générale de conversion est décidée.

**Pas de captures d'écran.** Les deux corrections sont des valeurs de jeton :
le ratio de `.btn-ghost` passe de 1,27 à 3,36, calculable et vérifiable. Une
capture montrerait une bordure légèrement plus foncée, sans rien prouver de
plus qu'un calcul.
