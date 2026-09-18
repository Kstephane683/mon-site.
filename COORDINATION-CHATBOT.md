# 🤝 CONTRAT DE COEXISTENCE — Chatbot Mia

**Date :** 18 septembre 2026
**Objet :** éviter qu'une évolution du site ou du blog ne fasse disparaître le chatbot
**Incident de référence :** le 18/09/2026, le commit `c7a1406` (tracking GA4 + mention cookies) a **retiré le bloc SDK de 14 pages sur 16** — le chatbot a disparu de `eperformance.pro` en production. Cause : le bloc était injecté dans les pages **générées**, pas dans le **générateur**.

---

## 1. Règle unique

> **Le bloc SDK du chatbot appartient au GÉNÉRATEUR, jamais aux pages.**

| Dépôt | Générer avec | Le bloc est émis par |
|---|---|---|
| Site (`mon-site.`) | `python3 preview/_build/compose.py` | le layout de `preview/_build/compose.py` (avant `</body>`) |
| Blog (`blog-eperformance`) | `python3 _build/compose.py` | le layout de `_build/compose.py` |

**Ne JAMAIS retirer le bloc `<script src=".../eperformance-sdk.js">` des pages générées.** Toute modification se fait dans le générateur, puis regénération.

## 2. Ce que le bloc contient (contrat)

```html
<script>
  window.ePerformanceConfig = {
    widgetUrl: 'https://kstephane683.github.io/eperformance-widget/',
    apiUrl: 'https://web-production-4ab53.up.railway.app',
    siteId: '<eperformance_vitrine | blog_eperformance>',
    position: 'right'
  };
</script>
<script src="https://kstephane683.github.io/eperformance-widget/eperformance-sdk.js" defer></script>
```

- Dans le layout (f-string Python) : **échapper les accolades** → `{{` et `}}`
- `siteId` : `eperformance_vitrine` (site) · `blog_eperformance` (blog)
- Le SDK est **géré par le dépôt `eperformance-widget`** — ne pas le copier localement

## 3. Garde-fous en place

| Garde-fou | Où | Effet |
|---|---|---|
| Script de vérification | `scripts/verifier-chatbot.py` | Code 1 si le bloc manque dans une page **ou** dans le générateur |
| CI (bloquante) | `.github/workflows/verifier-chatbot.yml` | Échoue à chaque push/PR si régression |
| Vérification locale | `python3 scripts/verifier-chatbot.py` | À lancer avant tout commit touchant les pages |

## 4. En cas de doute

```bash
python3 scripts/verifier-chatbot.py    # 16/16 attendu côté site, 88/88 côté blog
```

Si le contrôle échoue : **regénérer** (`python3 preview/_build/compose.py`) puis recopier dans les pages racine — ne jamais réinjecter le bloc à la main page par page (c'est ce qui a créé la divergence).

## 5. Périmètre de chaque agent

| Sujet | Propriétaire |
|---|---|
| Contenu des pages, design system, composition, tracking, cookies | **agent dev du site** |
| Widget, SDK, dashboard admin, backend FastAPI, base de connaissances | **agent ePerformance (chatbot)** |
| Le **bloc SDK dans le layout** | **commun** : le bloc est la propriété du chatbot, son emplacement appartient au générateur |

**Règle de courtoisie :** avant de toucher `preview/_build/compose.py` (ou `_build/compose.py` du blog), lancer `scripts/verifier-chatbot.py` après modification — le contrôle CI le fera de toute façon.

---

*Ce document vit dans le dépôt du site (`mon-site.`) pour être lu par l'agent dev qui y travaille. Copie : `/home/ballo/OX6A/COORDINATION-CHATBOT.md`.*
