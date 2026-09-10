# Documentation : Intégration Chatbot IA Widget React

## Vue d'ensemble

Widget React 18 + Deep Chat intégré dans le site ePerformance statique (HTML/CSS/JS) pour connecter le frontend au backend chatbot IA (FastAPI + PostgreSQL + DeepSeek/Claude).

## Architecture Déployée

### Option A : Widget Autonome (Implémenté)

✅ **Choix retenu** : Build React en bundle standalone injecté via `<script>` dans les pages HTML.

**Avantages** :
- Pas de refonte du site existant
- Déploiement simple et rapide
- Widget flottant non-intrusif (coin bas-droit)
- Compatible avec toutes les pages HTML

## Structure des Fichiers

```
site-eperformance/
├── chatbot-widget/              # Projet React du widget
│   ├── src/
│   │   ├── main.jsx             # Point d'entrée
│   │   ├── ChatWidget.jsx       # Composant principal
│   │   └── styles/
│   │       └── widget.css       # Styles harmonisés avec le site
│   ├── vite.config.js           # Config build IIFE
│   ├── package.json
│   └── dist/                    # Build output
│       ├── chatbot-widget.iife.js   (1.1 MB)
│       └── chatbot-widget.css        (4.4 KB)
├── chatbot-widget.iife.js       # Bundle copié à la racine
├── chatbot-widget.css           # Styles copiés à la racine
└── index.html                   # Widget intégré (voir ci-dessous)
```

## Intégration dans les Pages HTML

### Code ajouté avant `</body>` dans index.html

```html
<!-- ============================================================
     CHATBOT WIDGET IA - React + Deep Chat
     ============================================================ -->
<div id="eperf-chat-root"></div>
<link rel="stylesheet" href="/chatbot-widget.css">
<script src="/chatbot-widget.iife.js"></script>
<script>
  // Initialiser le widget après chargement
  if (window.EperfChatWidget) {
    window.EperfChatWidget.init({
      apiUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:8000' 
        : 'https://api.eperformance.pro',
      theme: 'gold',
      position: 'bottom-right'
    });
  }
</script>
```

### À faire pour les autres pages

Répéter le même code dans :
- `formation.html`
- `ebook.html`
- `site-web.html`
- `diagnostic_eperformance.html`
- `cas-client-mlm.html`
- Toutes les autres pages où le chatbot doit être accessible

## Configuration Backend (CORS)

### Fichier modifié : `/home/ballo/OX6A/unified_ia_system/backend/api/app.py`

```python
# CORS origins - inclure les domaines du site ePerformance
DEFAULT_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "https://eperformance.pro",
    "https://www.eperformance.pro",
    "https://api.eperformance.pro",
]
CORS_ORIGINS = os.getenv("CORS_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
```

## API Backend Chatbot

### Endpoint Principal

**POST** `http://localhost:8000/api/chatbot/message`

**Request (format Deep Chat)** :
```json
{
  "messages": [
    {"role": "user", "text": "Comment augmenter mes ventes ?"}
  ],
  "site_id": "eperformance_vitrine",
  "visitor_info": {
    "user_agent": "Mozilla/5.0...",
    "referrer": "https://google.com"
  }
}
```

**Response (format Deep Chat)** :
```json
{
  "text": "Pour augmenter vos ventes de façon rentable...",
  "html": null,
  "files": null
}
```

### Autres Endpoints

- `GET /api/chatbot/conversation/{id}` - Historique conversation
- `GET /health` - Health check backend
- `GET /api/chatbot/analytics/{site_id}` - Statistiques (admin)

## Fonctionnalités du Widget

### Interface Utilisateur

1. **Bouton flottant** (coin bas-droit)
   - Icône : 💬 (fermé) / ✕ (ouvert)
   - Badge notification avec compteur messages non lus
   - Animation pulse ring dorée
   - Couleurs signature ePerformance (or #c9a96e)

2. **Panel chat** (420px × 600px desktop)
   - Header avec avatar "eP" et statut "En ligne"
   - Body avec Deep Chat intégré
   - Footer "Propulsé par ePerformance IA"
   - Responsive mobile : plein écran sur mobile

3. **Messages**
   - Bulles user : fond or (#c9a96e), texte noir
   - Bulles AI : fond sombre (#14141a), texte clair
   - Support markdown et code highlighting (Deep Chat natif)

### Comportements

- **Auto-détection environnement** : localhost → `http://localhost:8000`, production → `https://api.eperformance.pro`
- **Persistance conversation** : Deep Chat gère l'historique en session
- **Notifications** : Badge avec compteur si nouveau message reçu quand panel fermé
- **Accessibilité** : aria-labels, focus-visible, prefers-reduced-motion

## Build & Déploiement

### 1. Build du Widget (local)

```bash
cd /home/ballo/OX6A/site-eperformance/chatbot-widget
npm run build

# Copier dans site
cp dist/* ../
```

### 2. Tester Localement

**Terminal 1 : Backend chatbot**
```bash
cd /home/ballo/OX6A/unified_ia_system
python -m uvicorn backend.api.app:app --reload --port 8000
```

**Terminal 2 : Site web**
```bash
cd /home/ballo/OX6A/site-eperformance
node server.js
```

**Navigateur** : http://localhost:8080
- Cliquer sur widget chatbot en bas à droite
- Envoyer message : "Bonjour, comment augmenter mes ventes ?"
- Vérifier réponse LLM réelle (DeepSeek/Claude)

### 3. Vérifier Backend en Cours

```bash
# Health check
curl http://localhost:8000/health

# Test endpoint chatbot
curl -X POST http://localhost:8000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "text": "Test"}],
    "site_id": "eperformance_vitrine"
  }'
```

### 4. Déploiement Production

**GitHub Pages (site web)** :
```bash
cd /home/ballo/OX6A/site-eperformance

# Ajouter widget à toutes les pages HTML (TODO)
# Copier code intégration dans formation.html, ebook.html, etc.

git add .
git commit -m "feat: Ajout chatbot IA React + Deep Chat"
git push origin main

# GitHub Pages se met à jour automatiquement (~2-5 min)
```

**Backend API (production)** :
- Backend doit être déployé sur serveur avec URL `https://api.eperformance.pro`
- Variables d'env `.env` :
  ```
  ENV=production
  DEBUG=False
  CORS_ORIGINS=https://eperformance.pro,https://www.eperformance.pro
  DATABASE_URL=postgresql://user:pass@host:5432/dbname
  DEEPSEEK_API_KEY=...
  CLAUDE_API_KEY=...
  ```

## Dépendances

### Widget React (chatbot-widget/)

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "axios": "^1.20.0",
    "deep-chat-react": "^2.5.1",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "vite": "^5.4.21"
  }
}
```

### Backend FastAPI

Voir `/home/ballo/OX6A/unified_ia_system/requirements.txt` :
- fastapi
- uvicorn
- sqlalchemy
- psycopg2-binary
- python-dotenv
- httpx (pour appels LLM)

## Design System

Le widget respecte la charte graphique du site ePerformance :

- **Couleurs** :
  - Or principal : `#c9a96e`
  - Or secondaire : `#e2c07a`
  - Fond sombre : `#08080c`, `#0c0c10`
  - Texte clair : `#edeae3`
  - Bordures : `#1c1c22`

- **Typographie** :
  - Titres : `'Cormorant Garamond', serif`
  - Corps : `'DM Sans', sans-serif`

- **Effets** :
  - Glassmorphism : `backdrop-filter: blur(20px)`
  - Animations : `cubic-bezier(0.34, 1.56, 0.64, 1)` (ease-spring)
  - Ombres dorées : `box-shadow: 0 8px 32px rgba(201, 169, 110, 0.4)`

## Performance

- **Bundle size** : 1.1 MB JS + 4.4 KB CSS
- **Chargement** : Lazy (ne bloque pas le site)
- **Optimisations possibles** :
  - Code splitting (charger Deep Chat à la demande)
  - CDN pour Deep Chat (réduire bundle de ~800 KB)
  - Compression gzip (déjà activée : 324 KB gzippé)

## Analytics

Le widget track automatiquement (si configuré) :
- Ouverture widget
- Messages envoyés
- Conversations complétées
- Intent détecté par l'IA

Voir `/api/chatbot/analytics/{site_id}` pour métriques.

## Prochaines Étapes

### TODO Immédiat

1. ✅ Widget React + Deep Chat créé
2. ✅ Build réussi (1.1 MB)
3. ✅ Intégré dans index.html
4. ✅ CORS configuré sur backend
5. ⏳ **Tester localement** (backend + site)
6. ⏳ **Intégrer dans toutes les pages HTML**
7. ⏳ **Git commit + push**
8. ⏳ **Tester en production**

### Améliorations Futures

- **Persistance conversation** : localStorage pour reprendre conversation après refresh
- **Streaming SSE** : Réponses en temps réel mot par mot
- **Avatars personnalisés** : Photo des agents IA selon persona
- **Historique conversations** : Liste des conversations passées
- **Export conversation** : Télécharger en PDF/TXT
- **Bouton suggestions** : Quick replies prédéfinies
- **Mode vocal** : Speech-to-text + Text-to-speech
- **Multi-langue** : Français + Anglais

## Support

- **Documentation Deep Chat** : https://deepchat.dev/docs/connect
- **API Backend** : http://localhost:8000/docs (dev)
- **Contact** : K. STEPHANE - ePerformance

---

**Date** : 2026-09-10  
**Version** : 1.0.0  
**Status** : Widget intégré, en attente de tests
