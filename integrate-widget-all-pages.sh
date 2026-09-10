#!/bin/bash
# Script d'intégration du widget chatbot dans toutes les pages HTML
# Usage: bash integrate-widget-all-pages.sh

WIDGET_CODE='
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
      apiUrl: window.location.hostname === '\''localhost'\'' 
        ? '\''http://localhost:8000'\'' 
        : '\''https://api.eperformance.pro'\'',
      theme: '\''gold'\'',
      position: '\''bottom-right'\''
    });
  }
</script>

</body>
</html>'

# Liste des fichiers HTML à modifier (exclure index.html déjà fait)
HTML_FILES=(
    "formation.html"
    "ebook.html"
    "site-web.html"
    "diagnostic_eperformance.html"
    "cas-client-mlm.html"
    "merci-ebook.html"
    "merci-candidature.html"
    "merci-contact.html"
    "404.html"
    "cookies.html"
    "politique-confidentialite.html"
)

cd /home/ballo/OX6A/site-eperformance

echo "🚀 Intégration du chatbot widget dans toutes les pages HTML..."
echo ""

for file in "${HTML_FILES[@]}"; do
    if [ -f "$file" ]; then
        # Vérifier si le widget n'est pas déjà présent
        if grep -q "eperf-chat-root" "$file"; then
            echo "⏭️  $file - Widget déjà présent, ignoré"
        else
            # Créer une sauvegarde
            cp "$file" "$file.backup"
            
            # Supprimer les dernières lignes </body></html> et ajouter le widget
            sed -i '/<\/body>/d' "$file"
            sed -i '/<\/html>/d' "$file"
            
            # Ajouter le code du widget
            echo "$WIDGET_CODE" >> "$file"
            
            echo "✅ $file - Widget intégré"
        fi
    else
        echo "⚠️  $file - Fichier introuvable, ignoré"
    fi
done

echo ""
echo "✨ Intégration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Vérifier visuellement quelques pages : firefox formation.html &"
echo "2. Tester le widget sur ces pages"
echo "3. git add . && git commit -m 'feat: Ajout chatbot IA sur toutes les pages'"
echo "4. git push origin main"
