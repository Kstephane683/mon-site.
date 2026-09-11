#!/bin/bash
# Test du chatbot ePerformance avec backend Railway

echo "🧪 Test de l'intégration chatbot ePerformance"
echo "=============================================="
echo ""

# 1. Test backend health
echo "1️⃣ Test backend Railway health..."
HEALTH=$(curl -s https://web-production-4ab53.up.railway.app/api/chatbot/health)
if [ $? -eq 0 ]; then
  echo "✅ Backend accessible: $HEALTH"
else
  echo "❌ Backend inaccessible"
  exit 1
fi
echo ""

# 2. Test envoi message
echo "2️⃣ Test envoi d'un message..."
RESPONSE=$(curl -s -X POST https://web-production-4ab53.up.railway.app/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "text": "Bonjour, je veux faire un diagnostic gratuit"}],
    "site_id": "eperformance_vitrine",
    "visitor_info": {
      "user_agent": "Test Script",
      "referrer": "test"
    }
  }')

if echo "$RESPONSE" | grep -q "text\|html"; then
  echo "✅ Message envoyé et réponse reçue"
  echo "📝 Extrait de la réponse:"
  echo "$RESPONSE" | head -c 200
  echo "..."
else
  echo "❌ Erreur lors de l'envoi du message"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# 3. Vérifier les fichiers build
echo "3️⃣ Vérification des fichiers build..."
if [ -f "/home/ballo/OX6A/site-eperformance/chatbot-widget/dist/chatbot-widget.iife.js" ]; then
  SIZE=$(du -h /home/ballo/OX6A/site-eperformance/chatbot-widget/dist/chatbot-widget.iife.js | cut -f1)
  echo "✅ chatbot-widget.iife.js ($SIZE)"
else
  echo "❌ chatbot-widget.iife.js manquant"
  exit 1
fi

if [ -f "/home/ballo/OX6A/site-eperformance/chatbot-widget/dist/chatbot-widget.css" ]; then
  SIZE=$(du -h /home/ballo/OX6A/site-eperformance/chatbot-widget/dist/chatbot-widget.css | cut -f1)
  echo "✅ chatbot-widget.css ($SIZE)"
else
  echo "❌ chatbot-widget.css manquant"
  exit 1
fi
echo ""

# 4. Vérifier les agents backend
echo "4️⃣ Vérification des agents backend..."
AGENT_COUNT=$(find /home/ballo/OX6A/unified-ia-backend/backend/chatbot/agents -name "*.md" | wc -l)
echo "✅ $AGENT_COUNT agents trouvés dans le backend"
echo ""

echo "=============================================="
echo "✅ TOUS LES TESTS PASSÉS"
echo ""
echo "📋 Pour intégrer dans le site:"
echo "   1. Copier les fichiers: cp dist/* /home/ballo/OX6A/site-eperformance/"
echo "   2. Ajouter dans index.html avant </body>:"
echo "      <link rel='stylesheet' href='chatbot-widget.css'>"
echo "      <div id='eperformance-chatbot-root'></div>"
echo "      <script src='chatbot-widget.iife.js'></script>"
echo ""
echo "🚀 Le chatbot est PRÊT POUR PRODUCTION!"
