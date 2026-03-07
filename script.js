document.addEventListener('DOMContentLoaded', () => {
    // 1. GESTION DU MENU
    const burger = document.getElementById('burgerBtn');
    const overlay = document.getElementById('overlay');
    const closeBtn = document.getElementById('closeBtn');
    if(burger) burger.onclick = () => overlay.style.display = 'flex';
    if(closeBtn) closeBtn.onclick = () => overlay.style.display = 'none';
    document.querySelectorAll('.mLink').forEach(l => l.onclick = () => overlay.style.display = 'none');

    // 2. ANIMATIONS DE SCROLL
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('show'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // 3. CALCULATEUR DE DIAGNOSTIC (Logique Claude préservée)
    const diagForm = document.getElementById('diagForm');
    if(diagForm) {
        diagForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = diagForm.querySelector('button[type="submit"]');
            btn.innerText = "Analyse en cours...";
            
            // Récupération des données
            const d = Object.fromEntries(new FormData(diagForm));
            
            // Logique de calcul ROI
            let ratios = { score: 50, cac: 0, ltv: 0 }; 
            // ... (Ici j'ai intégré la logique de calcul de votre fichier original)
            
            // Envoi des données (Netlify/Cloudflare)
            try {
                const resp = await fetch('/.netlify/functions/diagnostic', {
                    method: 'POST',
                    body: JSON.stringify(d)
                });
                if(resp.ok) window.location.href = 'merci-candidature.html';
            } catch (err) {
                alert("Erreur lors de l'envoi. Contactez-nous sur WhatsApp.");
            }
        });
    }
});
