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

  /* --- Chatbot ----------------------------------------------------------
     Le widget expose window.ePerformance avec open/close/toggle/identify et
     un écouteur ePerformance.on('open'|'close'). On s'y branche plutôt que
     d'observer le DOM : le SDK est minifié, sans identifiant stable, et une
     observation casserait à sa première mise à jour.

     Deux événements n'ont pas d'écouteur dans l'API : les messages et les
     captures de contact. Ils sont reçus par événements personnalisés, que le
     SDK émettra (spécification dans docs/chatbot-integration-noyau.md).
     Aucune donnée personnelle ne transite : ni nom, ni e-mail, ni numéro. */
  (function () {
    var api = null, essais = 0, debut = null, messages = 0, source = null;

    function brancher() {
      api = window.ePerformance;
      if (!api || typeof api.on !== 'function') {
        if (++essais < 20) setTimeout(brancher, 500);   // le SDK arrive en defer
        return;
      }
      api.on('open', function () {
        debut = Date.now();
        messages = 0;
        envoyer('chatbot_open', { page: window.location.pathname, source: source || 'inconnue' }, 'Contact');
      });
      api.on('close', function () {
        var duree = debut ? Math.round((Date.now() - debut) / 1000) : 0;
        envoyer('chatbot_close', {
          page: window.location.pathname,
          messages_envoyes: messages,
          duree_secondes: duree
        }, 'Contact');
      });

      /* Événements à venir du SDK. Le jour où il les émettra, ils seront
         mesurés sans toucher à ce fichier. */
      document.addEventListener('eperf:chatbot:message', function (e) {
        var d = e.detail || {};
        messages++;
        envoyer('chatbot_message', {
          page: window.location.pathname,
          message_index: messages,
          intent: d.intent || 'non_detecte'
        }, 'Contact');
      });
      document.addEventListener('eperf:chatbot:lead', function (e) {
        var d = e.detail || {};
        envoyer('chatbot_lead', {
          page: window.location.pathname,
          type: d.type || 'formulaire'
        }, 'Lead');
      });
    }

    /* Source d'ouverture : mémorisée au clic sur un déclencheur connu. */
    document.addEventListener('click', function (event) {
      var el = event.target.closest ? event.target.closest('[data-chatbot-source]') : null;
      if (el) source = el.getAttribute('data-chatbot-source');
    }, true);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', brancher);
    } else {
      brancher();
    }
  })();

})();
