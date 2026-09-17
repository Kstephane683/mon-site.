/* ==========================================================================
   ePerformance — événements de mesure
   assets/js/tracking.js

   Écouteurs d'événements GA4 et Meta. Ce fichier ne fait rien tant que le
   consentement n'a pas été donné : window.gtag et window.fbq n'existent
   qu'après le choix du visiteur.

   Un seul écouteur délégué sur le document attrape tous les liens WhatsApp,
   présents et futurs — le site en compte 115 aujourd'hui, et chaque nouvel
   article en ajoute. Annoncer les liens un par un serait à refaire sans fin.

   Aucune donnée personnelle ne transite ici. Les conversions qui en portent
   (e-mail, téléphone) passent par le CAPI côté serveur, hachées.
   ========================================================================== */

(function () {
  'use strict';

  /* Lit le choix mémorisé. Retourne null si le visiteur n'a pas encore
     répondu — dans ce cas aucun traceur n'est chargé et rien ne part. */
  function consentement() {
    return (window.eperfConsent && window.eperfConsent.get()) || null;
  }

  /* Envoie un événement aux outils effectivement chargés.
     Chaque outil est vérifié séparément : le visiteur peut avoir accepté la
     mesure d'audience et refusé la publicité. */
  function envoyer(nom, params, metaEvenement) {
    var c = consentement();
    if (!c) return false;

    if (c.analytics && typeof window.gtag === 'function') {
      window.gtag('event', nom, params || {});
    }
    if (c.ads && typeof window.fbq === 'function' && metaEvenement) {
      window.fbq('track', metaEvenement, params || {});
    }
    return true;
  }

  /* Exposé pour les autres scripts : le formulaire de diagnostic en a besoin
     pour émettre generate_lead sur la réponse du serveur. */
  window.eperfTrack = envoyer;

  /* --- Clics sortants : WhatsApp, e-mail, téléphone ---------------------- */
  document.addEventListener('click', function (event) {
    var lien = event.target.closest ? event.target.closest('a[href]') : null;
    if (!lien) return;

    var href = lien.getAttribute('href') || '';

    if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
      envoyer('clic_whatsapp', {
        lien_origine: lien.getAttribute('data-cta') || 'lien',
        page: window.location.pathname
      }, 'Contact');
      return;
    }

    if (href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
      envoyer('clic_contact', {
        type: href.indexOf('mailto:') === 0 ? 'email' : 'telephone',
        page: window.location.pathname
      });
    }
  }, true);

  /* --- Début de diagnostic ---------------------------------------------- */
  /* Déclenché une seule fois, au premier champ touché. On mesure l'entrée
     dans le formulaire, pas sa progression : l'écart avec generate_lead
     donne le taux d'abandon, et c'est là qu'est l'information utile. */
  (function () {
    var form = document.getElementById('diagForm');
    if (!form) return;
    var declenche = false;
    form.addEventListener('input', function () {
      if (declenche) return;
      declenche = true;
      envoyer('diagnostic_debut', { form_id: 'diagnostic' }, 'InitiateCheckout');
    });
  })();

  /* --- Vue d'une page d'offre ------------------------------------------- */
  if (window.location.pathname.indexOf('site-web') !== -1) {
    envoyer('contenu_offre_vu', { page: window.location.pathname }, 'ViewContent');
  }

})();
