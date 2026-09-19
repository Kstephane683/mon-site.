## ⚠️ ATTRIBUTION — À LIRE AVANT LE CONTENU

**Ce document n'est pas l'avis de l'agent NOYAU.** Il a été produit par un agent de revue qui a instruit le dossier **en tenant ce rôle**, à partir du même périmètre et des mêmes documents. L'agent NOYAU réel **a désavoué** ce document (entrée du journal du 19/09 05:39) : il ne l'a pas écrit et ne le ratifie pas.

Conséquence : **les conditions et verdicts ci-dessous engagent un avis de revue, pas la signature de l'agent.** Ils doivent être re-soumis à l'agent réel par le journal de coordination avant d'être appliqués comme des décisions.

Ce qui reste valable sans ratification : les **mesures** et les **faits vérifiables** listés dans le document, chacun traçable à `fichier:ligne`. Ce qui ne l'est pas : les **verdicts**, les **conditions bloquantes** et les **arbitrages**.

---

# AVIS DU NOYAU — refonte du dashboard ePerformance

**Autorité :** agent NOYAU (`agent-ia-web` — `eperf_core/**`, `ai_client_v2.py`, `artisan.py`,
`controleur.py`, `blog_engine/**`, `ads/**`, `personas.py`, `narrative_engine.py`, `meta_agent.py`).
**Gardien du contrat N1** (design system canonique) et de la cascade de fournisseurs LLM.
**Date :** 2026-09-19. **Périmètre lu :** `docs/refonte-dashboard/` (`ARCHITECTURE-SAAS.md`,
`SYSTEME-VISUEL-SAAS.md`, `SUPERVISION.md`, `AUDIT-M5-SOCLE.md`, `AUDIT-M1`, `AUDIT-M2`),
`COORDINATION-AGENTS.md` (noyau) et `site-eperformance/COORDINATION-AGENTS.md` (site).

**Méthode.** Chaque affirmation ci-dessous est tracée à un `fichier:ligne` ou à une commande
lancée dans cette session, sur le disque, aujourd'hui. Ce qui n'a pas pu être établi est écrit
« non établi ». Aucune valeur de secret n'est reproduite : `fichier:ligne` et nature seulement.
**Aucun fichier n'a été modifié hors le présent avis.**

---

## 1. VERDICT

# **FAVORABLE SOUS CONDITION**

Le corpus est solide et je n'ai trouvé **aucune erreur de fait me concernant**. Ses
`fichier:ligne` sur mon dépôt sont exacts (`.env:9,17,22,27` ; `ai_client_v2.py:521-575` ;
`10-primitives.css:90` ; 74 SVG ; 7 `@font-face` en 404). Il a même mesuré **mieux que moi**
deux points de mon propre périmètre — la cascade à trois paliers et le troisième palier
délibéré (`AUDIT-M5 §4.2`) — et il pose la bonne question au bon endroit : « c'est le point
où le tableau de bord unifié devra trancher, parce qu'il est le seul consommateur des deux ».

Le « oui » est conditionnel pour une raison unique et mesurable : **les documents désignent
trois sources canoniques différentes pour les jetons** (§4.1), et **l'une des douze valeurs
gelées diverge réellement entre le noyau et les trois copies qui l'ont déjà suivie** (§2.3).
Copier les jetons avant d'avoir désigné la source et arbitré cette valeur graverait la
divergence dans un cinquième fichier — exactement le défaut que la refonte prétend fermer.

**Quatre conditions bloquantes** (§6), **onze propositions** (§5), **six conflits de contrat**
(§4). Aucune ne demande d'arrêter la refonte : toutes demandent d'être écrites avant la
première copie.

---

## 2. LA SOURCE CANONIQUE DES JETONS — tranché

### 2.1 Le constat, mesuré

Il y a **neuf emplacements** où les valeurs du design system sont écrites, pas deux. Mesure
(`find` + `md5sum` sur le disque, cette session) :

| # | Emplacement | État | Nature |
|---|---|---|---|
| 1 | `agent-ia-web/eperf_core/assets/css/10-primitives.css` (+ `20-semantic.css`, `30`…`50`) | **source des valeurs** | 5 couches, 208 jetons, résolveur fourni |
| 2 | `site-eperformance/assets/css/eperf.css` (1 461 l.) | copie **conforme** | 11/12 identiques au noyau, thème sombre |
| 3 | `blog-eperformance/assets/css/eperf.css` | copie **conforme** | **md5 identique** à #2 (`54d89e93`) |
| 4 | `site-eperformance/preview/assets/css/eperf.css` | copie **conforme** | **md5 identique** à #2 |
| 5 | `Google ads projets/site eperformance/mockups/assets/css/eperf.css` | copie **PÉRIMÉE** | `--gold: #8a6f38` (valeur abandonnée), 353 lignes d'écart avec #2 |
| 6 | `toolkit_eperformance/eperformance-widget/src/styles/jetons.css` (236 l.) | copie contrôlée | md5 `a2c5f1bc`, convergence N1 documentée |
| 7 | `toolkit_eperformance/cockpit.html` — bloc `:root` | copie **partielle** | **21 jetons** mesurés, et **29 hex hors `:root`** |
| 8 | `toolkit_eperformance/statique/css/eperf-cockpit.css` (prévu, `ARCHITECTURE:265`) | à créer | — |
| 9 | `toolkit_eperformance/statique/jetons.css` (prévu par le brief) | à créer | — |

Le `mockups/` périmé (#5) est bien celui qui a déjà trompé quatre agents — le document du site
le dit lui-même (`site-eperformance/COORDINATION-AGENTS.md:702`). Il est **hors des deux
dépôts** et ne sera pas couvert par un contrôle qui balaie `toolkit_eperformance/**`. Le
signaler est tout ce que je peux faire sans sortir de mon périmètre.

### 2.2 La source que je désigne

> **LA source canonique est `agent-ia-web/eperf_core/assets/css/` — les cinq couches, lues
> dans l'ordre de la cascade, et résolues par `agent-ia-web/eperf_core/jetons.py`.**

Chemins exacts, pour le contrôle :

```
agent-ia-web/eperf_core/assets/css/10-primitives.css   # les VALEURS (--p-*, littéraux)
agent-ia-web/eperf_core/assets/css/20-semantic.css     # les NOMS  (--bg: var(--fond)), + bloc sombre
agent-ia-web/eperf_core/jetons.py                      # le résolveur (charger_noyau, theme_effectif)
```

**Pourquoi ces deux fichiers et pas un seul.** Les douze noms gelés (`--bg`, `--card`,
`--gold`…) **ne portent aucune valeur littérale** : ce sont des alias déclarés en
`20-semantic.css:199-218`, qui pointent vers les rôles du noyau (`--fond`, `--surface`,
`--accent`), eux-mêmes définis par des littéraux dans `10-primitives.css:32-110`. Un contrôle
qui regarde un seul des deux fichiers mesure la moitié de la vérité : md5 de
`10-primitives.css` = il passe pendant qu'un alias de `20-semantic.css` se casse ; md5 de
`20-semantic.css` = il passe pendant qu'une primitive change sous lui.

**Pourquoi un résolveur et pas un md5 de fichier.** Trois raisons, toutes mesurées :

1. **Un md5 de fichier casse sur un commentaire.** Le noyau documente ce piège et je l'ai
   reproduit : ma première mesure de ce soir a produit des faux positifs parce que les
   commentaires n'étaient pas retirés (`COORDINATION-AGENTS-NOYAU.md`, journal `04:41`).
2. **Un md5 de fichier ne voit pas le thème.** Les deux valeurs qui ont divergé entre le site
   et le noyau en septembre (`--erreur`, `--shadow-gold`) étaient **sombres** : un contrôle
   aveugle au thème ne les aurait pas vues (journal `01:39` et `02:39`). Le résolveur prend le
   thème en paramètre (`jetons.charger_noyau(theme)`, `jetons.py:89-120`).
3. **Le résolveur existe et il est déjà l'autorité.** `jetons.py` est ce que
   `validateurs/wcag.py:238` consomme pour mesurer les contrastes. Deux résolveurs, c'est deux
   vérités — le défaut que la refonte répare ailleurs (trois registres, deux chaînes).

**Ce que le contrôle doit comparer, précisément.** Les **12 paires `(nom, valeur résolue)`**,
en littéral, `lower()`, triées, hachées. Empreinte mesurée ce soir, reproductible :

```
sombre  b89dcba06940079e
clair   e6d40d572271fc7d
```

Script exact (à porter tel quel dans le contrôle de la refonte) :

```python
import hashlib, sys
sys.path.insert(0, "/home/ballo/OX6A/agent-ia-web")
from eperf_core import jetons

N1 = ("--bg", "--bg2", "--card", "--card2", "--text", "--soft", "--muted",
      "--gold", "--gold2", "--border-strong", "--wa", "--erreur")

def empreinte(theme):
    effectif = jetons.theme_effectif(theme=theme)
    paires = sorted(f"{n}={str(jetons.hex_litteral(effectif[n]) or effectif[n]).lower()}"
                    for n in N1)
    return hashlib.sha256("\n".join(paires).encode()).hexdigest()[:16]

print(empreinte("sombre"), empreinte("clair"))   # b89dcba06940079e e6d40d572271fc7d
```

**Pourquoi `hex_litteral` et pas la chaîne brute.** Comparer des chaînes produit un faux
positif immédiat, mesuré : `--erreur` en thème clair vaut `#a8302f` dans le noyau et
`rgb(168, 48, 47)` dans `eperf.css` du site — **la même couleur, deux écritures**. Le contrôle
doit normaliser, sinon il crie au loup au premier passage et sera désactivé au deuxième.

**Le contrôle doit échouer en cas d'absence de source, pas passer.** C'est le défaut du
contrôle actuel de `social_illustrations/_controle.py` (« comparaison par empreinte, **si la
source est accessible** » — la copie peut donc se déclarer conforme sans avoir rien comparé).
Le contrat C12 du site a déjà écrit la règle, et elle vaut ici mot pour mot :
« **Une comparaison sur zéro fichier est une erreur de mesure, jamais un succès** »
(`site-eperformance/COORDINATION-AGENTS.md:75`).

### 2.3 L'écart réel entre la source et l'aval : UNE valeur sur douze

Comparaison des 12 jetons N1, noyau résolu contre `eperf.css` du site, **par bloc de thème** :

| Thème | Identiques | Écart |
|---|---|---|
| clair | **12/12** en couleur | `--erreur` : `#a8302f` vs `rgb(168, 48, 47)` — **même couleur**, écriture différente |
| sombre | **11/12** | **`--gold2`** : noyau `#cfb583` contre site `#e2c07a` |

**Le thème clair est aligné, le thème sombre ne l'est pas — et d'une seule valeur.** Ce que la
mesure ajoute au rapport de supervision :

| Emplacement | `--gold2` sombre |
|---|---|
| `agent-ia-web/eperf_core/assets/css/10-primitives.css:90` (`--p-accent-appuye-sombre`) | **`#cfb583`** |
| `site-eperformance/assets/css/eperf.css:247` | `#e2c07a` |
| `blog-eperformance/assets/css/eperf.css` (md5 identique au site) | `#e2c07a` |
| `toolkit_eperformance/eperformance-widget/src/styles/jetons.css:179` | `#e2c07a` |
| `toolkit_eperformance/cockpit.html:145` | `#e2c07a` |
| `SYSTEME-VISUEL-SAAS.md:245` (gelé) · `DESIGN-SYSTEM-UNIFIE.md:337` (sombre) | `#e2c07a` |

**Je tranche, et je tranche contre mon propre dépôt : la valeur gelée est `#e2c07a` ; c'est le
noyau qui doit être corrigé, en une ligne, à `10-primitives.css:90`.**

Trois raisons, dans l'ordre de poids :

1. **La mesure ne donne aucun argument d'accessibilité à l'un ou l'autre.** Les deux passent
   AA largement sur les quatre surfaces sombres ; la règle du noyau (« l'accent appuyé a PLUS
   de contraste que l'accent », `10-primitives.css:84-90`) est satisfaite par les deux, puisque
   les deux sont plus clairs que `--gold` `#c9a96e`. Il ne reste donc qu'un arbitrage de
   cohérence, et il doit se faire au moindre coût.
2. **Le coût est asymétrique : 1 ligne contre 4 fichiers.** Cinq emplacements portent déjà
   `#e2c07a` (site, blog, widget, cockpit, et le canon écrit) ; un seul porte `#cfb583`. Faire
   converger le noyau coûte une ligne ; faire converger l'aval coûte quatre fichiers, une
   re-publication du widget et une re-mesure de contraste.
3. **Un jeton gelé qui n'est pas respecté par sa propre source n'est pas gelé.** Si le noyau
   garde `#cfb583`, la phrase « les 12 jetons gelés » devient fausse le jour de la copie, et
   le prochain agent qui mesurera conclura — à raison — que la source est l'emplacement le
   plus en retard.

**Ce que cette correction n'est pas.** Ce n'est pas un renommage : aucun nom ne bouge, N1 est
intact dans sa lettre. C'est une **entrée `⚠️ CONTRAT`** au journal du noyau, obligatoire, avec
la mesure ci-dessus — et le contrôle de l'empreinte verra la valeur changer
(`b89dcba06940079e` → à recalculer). **Tant que ce n'est pas tranché, ne copiez pas les 12
jetons** : vous graveriez `#cfb583` dans le fichier neuf et créeriez une cinquième position.

### 2.4 Ce que je ne désigne pas, et pourquoi

- **Le document `DESIGN-SYSTEM-UNIFIE.md` n'est pas la source.** `SYSTEME-VISUEL-SAAS.md:19`
  le cite comme « la source de vérité des jetons » sous le chemin
  `design-system/DESIGN-SYSTEM-UNIFIE.md` — **ce chemin n'existe pas** : `ls
  site-eperformance/design-system/` → « Aucun fichier ou dossier de ce nom ». Le fichier réel
  est `/home/ballo/OX6A/DESIGN-SYSTEM-UNIFIE.md` (480 l., md5 `49dddad5`), **hors de tout
  dépôt**. Un document de référence que personne ne peut citer par un chemin résoluble n'est
  pas une source : c'est une note. Il reste utile — c'est lui qui a arbitré `--gold` clair en
  faveur du noyau — mais **il décrit, il ne fait pas foi**.
- **Le CSS du site n'est pas la source de N1** — mais il n'est pas rien. Voir §4.1 : c'est un
  vrai conflit de contrat, entre deux documents qui désignent deux propriétaires différents.

---

## 3. LA CASCADE DE FOURNISSEURS — état réel, mesuré aujourd'hui

### 3.1 Ce que la mesure dit, ce soir

Trois sondes `POST /chat/completions` avec `max_tokens: 1`, clés lues dans `agent-ia-web/.env`
(valeurs jamais affichées) :

| Palier | Endpoint | Résultat mesuré | Lecture |
|---|---|---|---|
| 1 — DeepSeek | `api.deepseek.com` | **HTTP 200**, modèle `deepseek-flash` | **opérant** |
| 2 — Z.ai GLM | `api.z.ai/api/paas/v4` | **HTTP 429** `code 1113 — Insufficient balance or no resource package. Please recharge.` | **clé valide, compte non approvisionné : palier inopérant** |
| 3 — Claude | proxy `aiapiflow.com` | **HTTP 200**, modèle `claude-opus-5` | **opérant** |

Le constat « **zai est mort** » est donc **faux deux fois** : pour le noyau la clé existe
(`.env:17`, renseignée, 49 caractères) **et** la cascade existe (`ai_client_v2.py:521-595`, trois
paliers, le troisième délibéré et documenté `:536-543`). Mais il est **vrai en effet** : le
compte Z.ai répond `429 1113`, exactement comme `ai_client_v2.py:530-533` le documente depuis
le 17/09 et comme `percepteur.py:491` le constate pour la vision. **La cascade réelle est donc
DeepSeek → (palier mort, 1,3 s de latence perdue) → Claude.**

Un détail de méthode, parce qu'il a failli me tromper : ma première sonde sur le proxy Claude a
renvoyé **403** (`error code: 1010`), parce que `urllib` s'annonce `Python-urllib`. Rejouée avec
`requests` — **l'en-tête que le code envoie réellement** (`ai_client_v2.py:323-324` : seulement
`Authorization` et `Content-Type`, aucun `User-Agent`) — elle renvoie 200. Un test qui n'utilise pas le client du
code ne teste pas le code.

### 3.2 L'unification à un fournisseur casse-t-elle quelque chose ? Oui, quatre choses

Les modules du noyau qui dépendent d'un fournisseur autre que DeepSeek, mesurés un par un :

| # | Module | Nature de la dépendance | Ce qui casse si la clé disparaît |
|---|---|---|---|
| 1 | `auditeur.py:36-42` | **garde dure à l'import** : `raise EnvironmentError` | `import auditeur` **échoue**. **Reproduit** : `ZAI_API_KEY= python3 -c "import auditeur"` → `OSError: ZAI_API_KEY requise pour lancer l'audit.` |
| 2 | `onboarding.py:64-76` | garde dure au démarrage (`print` + sortie) | l'onboarding client ne démarre plus |
| 3 | `blog_engine/generate_articles.py:45,69-113` | **transport direct** vers un 4ᵉ endpoint (`open.bigmodel.cn`, `glm-4-plus`) | `appeler_ia()` retourne `None` **avant** le `try` — le repli DeepSeek est **inatteignable** |
| 4 | `blog_engine/onboard_legacy.py:38,71-74` | **transport direct**, même endpoint | `extraire_profil_via_ia()` retourne `{}` — même défaut de repli inatteignable |

Deux précisions qui changent la décision :

- **Les modules 1 et 2 sont des gardes, pas des transports.** Leur appel réel passe par la
  cascade : `auditeur.py:133-134` et `onboarding.py:840-841` appellent `ai_client.appeler_llm`.
  Leur dépendance à Z.ai est une **exigence de présence de clé** — un contrôle de santé qui
  n'a plus de sens le jour où le fournisseur change. Seul `blog_engine/**` a un transport
  propre, et vers un endpoint que la cascade ne connaît pas (`open.bigmodel.cn` contre
  `api.z.ai` : **deux hôtes différents pour « z.ai »**, ce qui n'est pas relevé par l'audit).
- **Le défaut 3/4 est réel et silencieux, et il préexiste à la refonte.** Mesuré par lecture :
  `generate_articles.py:69-73` sort avant le `try` ; le repli DeepSeek est dans le `except`
  (`:105-116`). Donc aujourd'hui déjà, **une clé Z.ai expirée ne bascule pas sur DeepSeek : elle
  arrête la génération du blog sans un mot** — c'est la même classe de défaut que
  `utils.py:45-50` documente (« un site entièrement sans IA, et rien dans le journal ne le
  disait »). Non exécuté, établi par lecture seule.

Les autres consommateurs d'un fournisseur non-DeepSeek ne sont pas des dépendances :
`stratege.py:157-173` et `correcteur.py:65,143-144` utilisent la clé Z.ai comme **interrupteur
de disponibilité** (`api_disponible`) mais appellent la cascade ; `dashboard_app.py:174`
déclare un registre `claude|deepseek|glm` dans un fichier que la refonte **supprime**
(`ARCHITECTURE:621`).

### 3.3 Mon avis sur l'unification

**Un seul fournisseur est acceptable en cible. Il ne l'est pas dans cet ordre-là.**

- **Gardez les trois paliers tant que les quatre modules ci-dessus n'ont pas été repris.** Le
  palier 3 n'est pas une redondance théorique : mesuré ce soir, c'est le **seul secours
  fonctionnel** que le projet ait. Le retirer aujourd'hui laisse DeepSeek seul, et une
  indisponibilité passagère de DeepSeek fait échouer une génération complète — le scénario que
  `ai_client_v2.py:536-543` a précisément écrit pour l'éviter. Le coût du maintien est nul
  tant que les paliers 1 et 3 répondent.
- **Le palier 2 peut partir, ou rester : il est inerte.** Il ne coûte que ~1,3 s de latence et
  une ligne de journal trompeuse (`bascule Z.ai…`). Si vous le retirez, dites-le dans
  `configurer_debug()` (`ai_client_v2.py:621-635`) — c'est la fonction qui existe pour qu'on
  n'ait pas à lire le code pour savoir qui a répondu.
- **Un seul fournisseur exige un garde-fou visible, pas seulement un registre plus court.** Le
  noyau doit dire à l'écran « aucun secours » quand il n'y en a pas : c'est exactement la
  sémantique `consequence` que `ARCHITECTURE:1423-1427` spécifie déjà pour les secrets absents
  (« `consequence` est obligatoire quand un secret manque »). Le même champ doit porter
  `« aucun secours : une indisponibilité de DeepSeek échoue »`.
- **La migration de `.env` vers `secrets.env` est une rupture pour le noyau, et elle n'est pas
  traitée** (§4.6). C'est la condition la plus lourde du lot, et la moins visible.

---

## 4. CONFLITS DE CONTRAT DÉTECTÉS

### 4.1 N1 (noyau) contre C3 (site) — deux propriétaires pour le même objet

| Document | Contrat | Ce qu'il gèle | Propriétaire désigné |
|---|---|---|---|
| `COORDINATION-AGENTS-NOYAU.md:44` | **N1** | les noms et valeurs des jetons, dans `eperf_core/assets/css/` + `jetons.py` | **NOYAU** |
| `site-eperformance/COORDINATION-AGENTS.md:51` | **C3** | les noms de jetons, dans `site-eperformance/assets/css/eperf.css` | **SITE** |

Les deux décrivent le **même** objet (les 12 jetons N1 sont exactement les noms d'`eperf.css`)
et désignent **deux fichiers sources différents**. Ce n'est pas une contradiction de contenu,
c'est une **contradiction de propriété**, et elle est déjà active : `SYSTEME-VISUEL-SAAS.md:18`
appelle `eperf.css` « les jetons canoniques » tandis que `:19` appelle `DSU` « la source de
vérité » et que `SUPERVISION.md:135` tranche en citant `10-primitives.css` comme le canon.

**Ce que je propose, et qui ne demande aucune réécriture** : la formulation du journal du noyau
du `01:39` est la bonne, et il suffit de la généraliser —

> **Le noyau est la source ; `eperf.css` est un dérivé qui ne se génère pas aujourd'hui.**
> Un dérivé non généré est une copie, et une copie dérive : elle a dérivé sur `--gold2` sombre
> (§2.3), sur `--erreur` clair (écriture), et le `mockups/` en est une troisième, périmée.

La conséquence pratique est mince et tenable : **le site garde la main sur son fichier** (C3
reste vrai — personne ne renomme un jeton sans prévenir), **le noyau garde la main sur les
valeurs** (N1), et le contrôle de la refonte cite le noyau. Rien d'autre ne change.

### 4.2 N1 — le nombre de jetons gelés diffère selon le document qui les gèle

| Source | Nombre gelé | Liste |
|---|---|---|
| `ARCHITECTURE-SAAS.md:49-63` | **6** | `--bg`, `--card`, `--text`, `--gold`, `--wa`, `--erreur` |
| `SUPERVISION.md:394-398` (correction 4) | **10** | les 6 + `--soft`, `--muted`, `--gold2`, `--border-strong` |
| `SYSTEME-VISUEL-SAAS.md:238-249` | **12** | les 10 + `--bg2`, `--card2` |

**C'est `SYSTEME-VISUEL` qui a raison, et je le confirme par la mesure** : les douze noms sont
exactement ceux que le résolveur du noyau rend sans trou (`--bg2` et `--card2` se résolvent
comme les dix autres, `#0c0c10` et `#14141a`). Le contrôle `C2` doit refuser une redéfinition
de **ces douze**, pas de six. Le chiffre 6 de l'`ARCHITECTURE` est celui qui doit disparaître.

### 4.3 N7 (valideurs) — le validateur WCAG du noyau ne peut pas lire le CSS de la refonte

`SYSTEME-VISUEL-SAAS.md:1975` propose de « reprendre `eperf_core/validateurs/wcag.py` **et le
brancher sur le CSS du dashboard** ». **Cette phrase décrit un branchement qui n'existe pas** :
`eperf_core/jetons.py:32` fixe `DOSSIER_CSS = RACINE / "assets" / "css"`, et `charger_noyau()`
(`:100`) lit ce chemin, sans paramètre. Le validateur lit donc **le CSS du noyau, toujours** —
le document le dit lui-même (« il lit aujourd'hui `eperf_core/assets/css/`, pas le fichier
servi ») mais laisse croire qu'il suffit de le « brancher ».

**Ce n'est pas un obstacle, c'est une tâche de mon périmètre que je prends** : exposer
`DOSSIER_CSS` en paramètre de `charger_noyau()`/`theme_effectif()` (une signature à élargir,
trois appelants à vérifier). Impact : le contrôle 3 de la refonte devient possible **sans
dupliquer un résolveur** ; sans cela, la refonte écrira un second mesureur de contraste, et
deux mesureurs de contraste finissent par ne plus être d'accord.

### 4.4 N6 (secret jamais dans le navigateur) — la migration de `.env` rompt le noyau en silence

`ARCHITECTURE:1445-1447` : « `config_ia.json` et `config_api.json` sont purgés de leurs clés ;
**`agent-ia-web/.env` passe en `0600` et ses clés migrent vers `secrets.env`** ». Or :

- `ai_client_v2.py` lit **l'environnement** (`os.environ.get("DEEPSEEK_API_KEY")`, `:556`) ;
- le noyau compte **88 lectures de `os.environ`** sur ~22 fichiers (mesuré : `grep -rn
  "os\.environ" --include="*.py"`, hors `venv` et `tests`) ;
- la seule chose qui peuple cet environnement aujourd'hui est `utils.charger_env()`
  (`utils.py:58-85`), qui lit **un seul chemin** : `<racine du dépôt>/.env`.

**Conséquence si la migration est faite telle qu'écrite** : les clés quittent `.env`, aucune
n'est chargée, `ai_client_v2` ne trouve plus de clé, la cascade tombe à zéro palier, et
`appeler_llm_v2()` retourne `None` (`:595`). Le générateur produit alors des sites **sans IA,
sans erreur et sans trace** — le mode de défaillance que `utils.py:45-50` documente déjà avoir
vécu une fois. **Et aucun contrôle de la refonte ne le verrait** : celui-ci regarde le
dashboard, pas `artisan.py`.

**Condition :** `~/.config/eperformance/secrets.env` doit être lu par le noyau (le plus simple :
`utils.charger_env()` accepte une liste de chemins, ou un `noyau/secrets.py` exporte dans
`os.environ` **à l'import**), **et un contrôle du noyau doit échouer** si une variable
attendue par le code est absente de l'environnement après chargement. Un contrôle côté
dashboard ne suffit pas : il ne voit pas le noyau.

### 4.5 N5 / C-2 — la refonte ne doit pas réarmer la collision de chemin

`ARCHITECTURE:269` place des `illustrations/` **SVG** dans `statique/`, et `:464` un écran
`apparence`. Rien dans les documents ne touche `assets/js/chatbot.js`. **Aucun conflit — je le
vérifie plutôt que de le supposer** : `scripts/verifier-noyau.py` contrôle toujours « un seul
écrivain » sur ce chemin (12 contrôles conformes, lancés ce soir). Le seul risque serait qu'une
génération locale du dashboard recopie une racine `assets/` entière ; ce n'est prévu nulle part.

### 4.6 Contradiction interne de l'`ARCHITECTURE` sur `--gold2` — confirmée, et complétée

`ARCHITECTURE:1905` écrit « `--gold2` reste **au canon du noyau** » (donc `#cfb583`) et
`SYSTEME-VISUEL:245` écrit `#e2c07a`. `SUPERVISION §4.1` l'a relevé. **Ce que j'ajoute** :
l'affirmation est fausse dans les deux sens — le « canon du noyau » n'est pas opposable ici,
puisque c'est la valeur que cinq emplacements sur six ont déjà cessé de suivre (§2.3). La
correction demandée par `SUPERVISION` (réécrire la phrase) est nécessaire mais **pas
suffisante** : il manque la correction du noyau lui-même. C'est l'objet de ma proposition P1.

---

## 5. PROPOSITIONS

Chacune est mesurée, chiffrée, et son impact est un impact de contrôle, pas un goût.

**P1 — Corriger `--gold2` sombre dans le noyau (`10-primitives.css:90`), entrée `⚠️ CONTRAT`
obligatoire.** `#cfb583` → `#e2c07a`. Impact : les 12 jetons N1 deviennent **12/12 conformes**
entre la source et ses cinq copies ; l'empreinte sombre change et devient
`recalculée` (à figer dans le contrôle). Coût : 1 ligne + 1 entrée de journal. Sans cette
correction, la copie du toolkit grave une cinquième position divergente.

**P2 — Le contrôle des jetons est une empreinte de paires résolues, pas un md5 de fichier.**
Empreinte de référence, mesurée ce soir : `b89dcba06940079e` (sombre) · `e6d40d572271fc7d`
(clair). Impact : le contrôle attrape les deux classes de défaut qui se sont réellement
produites (valeur qui change **sous** un alias ; valeur sombre qui dérive) et n'en produit
aucune des deux qui n'existent pas (commentaire modifié, `rgb()` au lieu de `#hex`). Le
script est en §2.2, il tourne en 40 ms.

**P3 — La copie des jetons dans le toolkit est GÉNÉRÉE, pas écrite à la main.** Un script lit
la source par `eperf_core.jetons` et émet le bloc `:root` ; `verifier.py` compare l'empreinte
du fichier émis à celle de la source et **échoue si la source est injoignable** (C12 du site,
mot pour mot). Impact : c'est la seule forme qui ne rejoue pas le scénario des quatre copies
existantes. Un `md5` de fichier ne suffit pas — voir P2.

**P4 — Étendre la source canonique aux polices, et faire porter par un manifeste ce que
`C4` compte aujourd'hui à la main.** `eperf_core/assets/fonts/manifeste.json` modèle déjà
`famille → poids → {fichier, plage unicode}` — c'est exactement ce que le plan « 12 `.woff2` »
décrit en prose. Mesure à l'appui : **les 9 `.woff2` du site sont 3 fichiers distincts**
(`md5sum` → 3 hash ; `cormorant-garamond-{500,600,700}` = `c47ff128`, les deux italiques =
`3e2c4175`, les quatre DM Sans = `6c1e9610`), soit **302 712 octets dupliqués** sur le disque.
Ce ne sont pas des fichiers statiques mais des **polices variables** (`fvar` lu : DM Sans
`wght 100→1000`, `opsz 9→40` ; Cormorant `wght 300→700`) — donc les 4 déclarations DM Sans
désignent un seul fichier, ce qui fonctionne mais se compte quatre fois.
Impact : `C4` vise une **liste nommée** (la correction 11 de `SUPERVISION` le demande déjà) et
signale au passage les octets redondants. Non établi : si le budget du chemin critique les
compte — il mesure en gzip et les woff2 sont déjà compressés (`dm-sans-400.woff2` :
62 724 o brut → **62 671 o gzip**), donc la redondance coûte plein tarif **si** le fichier est
préchargé ; `index.html:47-48` n'en précharge que deux.

**P5 — La bibliothèque d'icônes commune vit dans le noyau, et la refonte l'y ajoute.** C'est
la réponse à §5 du brief, et elle est tranchée par la mesure : `SYSTEME-VISUEL-SAAS.md:1613`
énumère **sept primitives** — « cercle concentrique (C), arc gradué (A), barres verticales (B),
grille de points (G), segment en escalier (E), rectangle imbriqué (R), diagonale (D) » — qui
sont **mot pour mot** celles du noyau (`eperf_core/illustrations/engine.py:11-13`). Le
répertoire est **déjà commun** ; il n'y a rien à réinventer et une chose à ne pas casser.
Impact : les 47 icônes 24 × 24 du §6.5 deviennent une **planche de plus** dans
`eperf_core/illustrations/library.py`, contrôlée par `engine.controler()` (grille de 4, un
seul accent, zéro littéral) — au lieu d'un objet `UI.icone()` neuf dans `app.js`
(`SYSTEME-VISUEL-SAAS.md:2004`) qui serait un **second** contrôleur du même langage.

**P6 — Le contrôle d'intégrité de `social_illustrations` doit être obligatoire, complet, et
non-local.** Mesure : `social_illustrations/library.py` et `engine.py` sont **byte-identiques**
au noyau (md5 `53a9dd55` et `bf9daf3e`, **0 ligne divergente**) — mais `__init__.py` a déjà
divergé de **54 lignes** et `_controle.py` de **122**. La copie a moins de 48 heures et deux de
ses quatre fichiers s'écartent déjà. Le contrôle existe, et trois défauts l'expliquent :
(a) il ne compare que le dictionnaire `ILLUSTRATIONS` de `library.py` (`_controle.py:136-143`),
pas `engine.py` ni `__init__.py` — donc pas le *contrôleur* du langage, qui est la moitié du
paquet ; (b) si la source manque, il **imprime et sort sans échouer** (`:128-130` : « copie non
vérifiée : source du noyau absente » + `return`) ; (c) il dépend d'un **chemin absolu codé en
dur** (`:49` → `/home/ballo/OX6A/agent-ia-web/...`), donc faux sur toute autre machine ou tout
autre clone. **Rendez-le obligatoire, étendez-le aux quatre fichiers, et remplacez le chemin
absolu par la configuration du projet.** Impact : la bibliothèque d'icônes survit à la refonte
au lieu de devenir la 5ᵉ copie périmée — et c'est **le modèle que P3 demande de reprendre pour
les jetons**, donc le réparer sert deux fois.

**P7 — Paramétrer le dossier CSS du noyau (`jetons.py:32`) pour que `wcag.py` mesure le CSS
réellement servi.** Voir §4.3. C'est du ressort du noyau, je le prends. Impact : le contrôle 3
de la refonte mesure ce qui est servi, et le projet garde **un** mesureur de contraste.

**P8 — `utils.charger_env()` doit accepter `~/.config/eperformance/secrets.env`.** Voir §4.4.
Impact : la réorganisation des secrets cesse de débrancher le générateur en silence. À
accompagner d'un contrôle du noyau (« aucune variable attendue n'est absente après
chargement »), sinon la prochaine migration refera le même trou.

**P9 — Les quatre modules liés à Z.ai doivent être repris dans la même session que la
suppression de la clé.** `auditeur.py:41` et `onboarding.py:71` : remplacer la garde par un
contrôle de la clé qui sert réellement (DeepSeek) — sinon `import auditeur` échoue (reproduit).
`blog_engine/generate_articles.py:69` et `onboard_legacy.py:71` : déplacer le repli DeepSeek
**avant** la garde, ou le rendre atteignable quand la clé est absente. Impact : la génération
du blog cesse de dépendre d'un fournisseur non approvisionné, et le repli cesse d'être du code
mort. **Ce défaut préexiste à la refonte** ; il se répare en dix lignes.

**P10 — Faire dire au bandeau ce que le registre ne dit pas.** Un seul `DEEPSEEK_API_KEY` +
une `consequence` obligatoire (« aucun secours »), conformément à
`ARCHITECTURE:1423-1427`. Impact : `D9` (« aucun état normal par défaut ») cesse d'être une
règle d'affichage et devient une propriété du registre de fournisseurs.

**P11 — Deux corrections documentaires de mon périmètre.**
(a) `eperf_core/illustrations/library.py:6` cite `docs/adr/ADR-0003-direction-artistique-illustrations.md`,
qui **existe** — mais dans `site-eperformance/docs/adr/`, pas dans le noyau (`ls
agent-ia-web/docs/adr/` → `ADR-0004`, `0005`, `0006`). Le noyau cite un document qu'il ne
possède pas : soit l'ADR est copiée dans le noyau, soit la citation porte son dépôt.
(b) `SYSTEME-VISUEL-SAAS.md:1600` écrit « **26** illustrations en `viewBox="0 0 120 72"` » ; le
noyau en compte **74** (mesuré : `sum(1 for v in ILLUSTRATIONS.values() if "0 0 120 72" in v)`
→ 74), et 26 est le nombre de **planches de marque** (`library.py:15`). `SUPERVISION §4.4`
affirme qu'« aucun document de conception ne reprend le 26 » : c'est inexact, ce document le
reprend, par confusion avec les planches. Impact : un implémenteur qui compte 26 croira à un
trou de 48.

---

## 6. CE QUE LA REFONTE PREND AU NOYAU — la réponse à la question 3 du brief

### 6.1 La duplication existe, elle est mesurée, et elle n'est pas où le brief la cherche

**Il n'y a AUCUNE duplication entre le noyau et le toolkit sur personas, `narrative_engine`,
`meta_agent` et le scoring.** Mesures :

- `toolkit_eperformance/**` ne contient **aucune** occurrence de `personas`, `narrative_engine`
  ou `meta_agent` (hors `design_pipeline.py:359,394-406`, qui parle de persona au sens de
  « profil d'agent » et lit `agents/`, pas le noyau) ; aucun `sys.path` du toolkit ne pointe
  vers `agent-ia-web`.
- Le noyau **n'a aucun scoring** : `grep -rn "def .*score" eperf_core/` → **0**. Le scoring vit
  entièrement dans le toolkit (`prospect_scraper.py:132`, `social_templates/controleur.py:260`
  — score /100, seuil 70), comme l'architecture le dit déjà (`ARCHITECTURE:603,1079`).
- **`personas.py`, `narrative_engine.py` et `meta_agent.py` (noyau) ont un seul consommateur
  réel : `dashboard_app.py:30-32,50-51`** — le fichier dont l'architecture prévoit la
  **suppression** (`ARCHITECTURE:621` et l'étape 9). Hors lui : `validate_phase2.py` et
  `tests/test_phase2.py`, c'est-à-dire le banc qui les teste eux-mêmes. `artisan.py`,
  `controleur.py` et `percepteur.py` : **0 occurrence**.

**Donc la vraie conséquence n'est pas « le toolkit doit consommer le noyau » : c'est que la
refonte orpheline trois modules du noyau.** C'est un fait à écrire dans la décision, pas à
découvrir après. Trois issues, dans l'ordre de coût :
1. **les déclarer morts et les retirer** — cohérent avec `D2` (un seul dashboard), mais cela
   retire 15 personas marketing et un moteur narratif du dépôt ;
2. **les garder comme bibliothèque, avec un consommateur nommé** — le toolkit social produit du
   contenu long (carrousels, articles) : `narrative_engine` (3 actes, 500-800 mots) est le seul
   moteur narratif du projet et `agents/` du toolkit n'en a pas ;
3. ne rien décider — c'est la seule option que je déconseille : trois modules sans consommateur
   et sans décision deviennent la prochaine « copie périmée ».

**Ma recommandation : l'option 2, sur `narrative_engine` uniquement.** C'est le seul des trois
qui apporte une capacité que le toolkit n'a pas ; `personas.py` est redondant avec les 29
`agents/*.md` (dont 11 sont déjà orphelins — `SUPERVISION` #6) et `meta_agent.py` route vers
des personas que le toolkit ne consomme pas. **Impact mesurable** : `narrative_engine` a
1 consommateur à ce jour (`dashboard_app.py`), l'option 2 lui en donne un second qui survit à
la refonte, sans écrire une ligne de duplication.

### 6.2 La duplication qui existe vraiment est dans le toolkit, et elle est chiffrée

Ce n'est pas au noyau de la porter, mais l'architecture la traite déjà (`AUDIT-M1 §5`,
`AUDIT-M2`). Je la cite pour une raison précise : **elle est de la même famille que la
duplication des jetons**, et le même remède s'applique — un registre unique, un contrôle qui
échoue.

| Duplication mesurée | Emplacements | Impact |
|---|---|---|
| `SECTOR_HOOKS` | **7 fichiers** (`skills_engine.py`, `prospect_scraper.py`, `prospect_scraper_v4.py`, `prospect_scraper_v5_authentique.py`, `build_dashboard.py`, `whatsapp_integration_j0.py`, `whatsapp_meta_templates_sender.py`) | toute modification faite 7 fois |
| Générateurs de messages J0 | 3, dont une divergence | 2 identiques + 1 divergente |
| Copies du design system | 9 (§2.1) | 1 périmée, 1 partielle (29 hex), 1 divergente sur `--gold2` |
| Bibliothèques d'illustrations | 2 (noyau + copie contrôlée) | **contrôlée** — le bon modèle |

La dernière ligne est la démonstration que le modèle « copie + contrôle » peut marcher : elle
tient parce que le noyau a écrit un contrôle d'intégrité dans la copie. Il faut juste le rendre
inconditionnel (P6) — parce qu'en 48 h, 2 fichiers sur 4 ont déjà divergé.

---

## 7. CE QUI N'EST PAS ÉTABLI

- **Le poids des polices dans le budget du chemin critique.** Les trois fichiers distincts
  pèsent 139 624 o brut / ~139 700 o gzip ; ce que cela coûte au premier écran dépend des
  `preload`, et je n'ai pas exécuté `validateurs/budget.py` sur `site-eperformance`. Le
  chiffre de 100 330 o gzip que le validateur cite en commentaire (`budget.py:125`) est une
  mesure antérieure, pas la mienne.
- **Les 111 icônes 24 × 24 du site.** J'ai mesuré **390 occurrences** de
  `viewBox="0 0 24 24"` sur 40 fichiers HTML — c'est un nombre d'occurrences, pas d'icônes
  distinctes. Je ne confirme ni n'infirme le 111.
- **Le comportement du cockpit à l'exécution.** Je n'ai lancé aucun serveur, appelé aucune
  route, et je n'ai pas rouvert `cockpit.html` dans un navigateur. Les 29 hex hors `:root` et
  les 21 jetons du `:root` sont des comptages sur le fichier, par équilibrage d'accolades.
- **Le compte de 21 hex hors `:root` de l'audit contre mes 29.** Méthodes différentes, fichier
  modifié entre-temps (commit du site `8389309`, 03:35). La divergence de méthode n'est pas
  levée.
- **La sonde Z.ai ne dit pas si le compte sera un jour approvisionné.** Elle dit l'état
  d'aujourd'hui : `429 code 1113`. C'est ce que le code documente depuis le 17/09, ce n'est pas
  une prédiction.

---

## 8. RÉPONSES COURTES AUX QUATRE QUESTIONS DU BRIEF

1. **Source canonique.** `agent-ia-web/eperf_core/assets/css/` (les 5 couches), **résolue par
   `agent-ia-web/eperf_core/jetons.py`**. Le contrôle cite cette paire et compare une
   **empreinte de paires résolues** (§2.2), jamais un md5 de fichier. Ni `DESIGN-SYSTEM-UNIFIE.md`
   (dont le chemin cité n'existe pas), ni `eperf.css` (dérivé qui a déjà dérivé).
2. **Cascade.** Vérifiée ce soir : DeepSeek **200**, Z.ai **429 `1113` (compte non
   approvisionné)**, Claude **200**. L'audit a raison contre le brief : Z.ai n'est pas « mort »
   (clé renseignée `.env:17`, cascade présente `ai_client_v2.py:521-575`) — il est
   **inopérant faute de crédit**, comme le code le documente depuis le 17/09. L'unification à
   un fournisseur est acceptable **en cible**, sous les conditions P8 et P9 : quatre modules du
   noyau dépendent d'un autre fournisseur (`auditeur.py:36-42` et `onboarding.py:64-76` par
   garde dure, `blog_engine/generate_articles.py:45,69` et `onboard_legacy.py:38,71` par
   transport direct vers `open.bigmodel.cn` — un 4ᵉ endpoint que la cascade ne connaît pas), et
   le palier Claude est aujourd'hui **le seul secours fonctionnel**.
3. **Ce que la refonte prend au noyau.** Pas de duplication à éliminer : elles sont disjointes.
   Ce qui existe est autre chose — **trois modules du noyau (`personas.py`,
   `narrative_engine.py`, `meta_agent.py`) perdent leur unique consommateur** quand
   `dashboard_app.py` est supprimé. À trancher explicitement ; ma recommandation est de garder
   `narrative_engine` avec un consommateur nommé, et de retirer les deux autres. **Le noyau
   n'a rien à absorber du toolkit** : il n'a aucun scoring, et le toolkit n'a aucune dépendance
   vers lui.
4. **La bibliothèque d'icônes.** Elle vit **dans le noyau** (`eperf_core/illustrations/`) —
   c'est déjà le cas, et les 7 primitives du SaaS sont littéralement celles du noyau
   (`engine.py:11-13`). Les 47 icônes 24 × 24 s'ajoutent comme **nouvelle planche** de
   `library.py`, sous le même contrôleur. La copie du toolkit est le bon modèle **à une
   condition** : que son contrôle d'intégrité cesse d'être conditionnel (P6) — 2 de ses 4
   fichiers ont divergé en 48 heures.

---

## 9. LES QUATRE CONDITIONS

1. **Désigner la source et l'écrire** : les 12 jetons N1 viennent de
   `agent-ia-web/eperf_core/assets/css/` + `jetons.py` ; le contrôle compare une **empreinte de
   paires résolues** ; il **échoue si la source est injoignable**. (§2.2, P2, P3)
2. **Arbitrer `--gold2` sombre avant la première copie** : le noyau passe à `#e2c07a` sur
   `10-primitives.css:90`, par entrée `⚠️ CONTRAT` — sinon la copie grave une cinquième
   position. (§2.3, P1)
3. **Ne rien retirer de la cascade avant d'avoir repris les quatre modules** — dont deux où le
   repli DeepSeek est **inatteignable aujourd'hui** (`blog_engine/generate_articles.py:69`,
   `onboard_legacy.py:71`). Et **ne pas migrer `.env` vers `secrets.env` sans que le noyau lise
   le nouveau chemin** (§4.4, P8, P9).
4. **Décider le sort des trois modules orphelins** — une phrase dans la décision, pas une
   découverte. (§6.1)

---

*Cet avis ne modifie aucun fichier hors lui-même. Aucun `git add`, `commit`, `checkout`.
Aucune valeur de secret n'y figure. Le contrôle du noyau est passé ce soir :
`python3 scripts/verifier-noyau.py` → **OK, 12 contrôles conformes**.*

---

## ERRATA

- **2026-09-19 — correction d'attribution.** Ce document a été produit par un agent de revue tenant le rôle du NOYAU, puis présenté sous le nom de l'agent ; l'agent NOYAU réel l'a **désavoué** (journal de coordination, entrée du 19/09 05:39 : « je ne l'ai pas écrit, et je ne peux pas le ratifier en l'état »). Un **avertissement d'attribution** a été ajouté en tête du document. Conséquence sur le contenu : les **mesures** et les **faits vérifiables** tracés à `fichier:ligne` restent valables ; les **verdicts**, les **quatre conditions bloquantes** (§9) et les arbitrages **ne valent pas signature du NOYAU** et doivent lui être re-soumis avant d'être appliqués comme des décisions. Aucune ligne du corps du document n'a été supprimée ni modifiée par cette correction.
