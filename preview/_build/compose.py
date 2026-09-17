#!/usr/bin/env python3
"""
ePerformance — Composeur de pages statiques
preview/_build/compose.py

Assemble les pages du site à partir d'un layout unique et de fragments de
contenu. Produit du HTML statique, prêt pour GitHub Pages.

Pourquoi un script plutôt qu'un framework : voir docs/adr/ADR-0002. Le
générateur agent-ia-web émet du HTML/CSS vanilla via un moteur de template
maison ; ce script joue le même rôle, sans ajouter de dépendance à
l'exécution ni de workflow de build.

Usage :
    python3 preview/_build/compose.py            # génère dans preview/
    python3 preview/_build/compose.py --check     # vérifie sans écrire

Le HTML produit est versionné. Le script n'est PAS nécessaire au
déploiement — GitHub Pages publie les fichiers déjà composés.
"""

import argparse
import html
import json
import os
import re
import sys

# ---------------------------------------------------------------------------
# CHEMINS
# ---------------------------------------------------------------------------

BUILD_DIR = os.path.dirname(os.path.abspath(__file__))
PREVIEW = os.path.dirname(BUILD_DIR)
CONTENT = os.path.join(PREVIEW, "_content")
ROOT = os.path.dirname(PREVIEW)

BASE_URL = "https://eperformance.pro"
SITE_NAME = "ePerformance"
SITE_DESC = ("Stratégie d'acquisition, IA générative, automatisation et "
             "développement web premium. Basé en Côte d'Ivoire, 100 % en ligne.")
WHATSAPP = "https://wa.me/2250151170666"
WHATSAPP_LABEL = "+225 01 51 17 06 66"
EMAIL = "bonjour@eperformance.pro"

YEAR = "2026"

# ---------------------------------------------------------------------------
# NAVIGATION — une seule définition, utilisée par toutes les pages
# ---------------------------------------------------------------------------

NAV = [
    ("Services",     "index.html#piliers",   "services"),
    ("Automatisation", "automatisation.html", "automatisation"),
    ("IA",           "ia.html",     "ia"),
    ("Site web",     "site-web.html", "site-web"),
    ("Formation",    "formation.html", "formation"),
    ("Blog",         "https://blog.eperformance.pro/", "blog"),
]

FOOTER_COLS = [
    ("Services", [
        ("stratégie d'acquisition", "index.html#methode"),
        ("IA générative",           "ia.html"),
        ("Automatisation",          "automatisation.html"),
        ("Création de site web",    "site-web.html"),
    ]),
    ("Ressources", [
        ("Diagnostic gratuit", "diagnostic_eperformance.html"),
        ("Formations",         "formation.html"),
        ("Ebooks",             "ebook.html"),
        ("Blog",               "https://blog.eperformance.pro/"),
    ]),
    ("Contact", [
        (WHATSAPP_LABEL,        WHATSAPP),
        (EMAIL,                 "mailto:" + EMAIL),
        ("Espace client",       "https://api.eperformance.pro/connexion.php"),
    ]),
]

LEGAL_LINKS = [
    ("Mentions légales",           "mentions-legales.html"),
    ("Confidentialité",            "politique-confidentialite.html"),
    ("Cookies",                    "cookies.html"),
    ("CGV",                        "cgv.html"),
]

# ---------------------------------------------------------------------------
# MÉTADONNÉES PAR PAGE
#   title / description : mesurés, ≤ 60 et ≤ 160 caractères
#   schema : blocs JSON-LD supplémentaires, injectés après le graphe de site
# ---------------------------------------------------------------------------

PAGES = {
    "index.html": {
        "title": "ePerformance — acquisition, IA et automatisation | Abidjan",
        "description": "Stratégie d'acquisition mesurable, IA générative, automatisation et sites web premium pour les PME et e-commerces d'Afrique de l'Ouest.",
        "h1": 'Vos chiffres d\'acquisition, enfin<br><em>lisibles et pilotables.</em>',
        "lead": ("Nous construisons le système qui rend votre acquisition mesurable : les ratios "
                 "qui comptent, l'IA qui capte les contacts, les workflows qui relancent, et le "
                 "site qui convertit. Pour les PME et e-commerces d'Afrique de l'Ouest."),
        "cta": ("Faire mon diagnostic gratuit", "diagnostic_eperformance.html"),
        "cta2": ("Voir les 4 piliers", "index.html#piliers"),
        "fragment": "index.html",
    },
    "automatisation.html": {
        "title": "Automatisation marketing et workflows n8n | ePerformance",
        "description": "Automatisez la capture, la relance et le reporting de vos prospects avec des workflows n8n sur mesure. Pour les PME d'Afrique de l'Ouest.",
        "h1": 'Automatiser, c\'est arrêter de <em>perdre ce que vous avez déjà capté.</em>',
        "eyebrow": "Pilier 03 · Automatisation",
        "lead": ("Un prospect qui écrit et qu'on oublie, un devis jamais relancé, un reporting "
                 "qui prend une journée : ce ne sont pas des problèmes de volume, ce sont des "
                 "problèmes de système. L'automatisation les supprime."),
        "cta": ("Faire mon diagnostic gratuit", "diagnostic_eperformance.html"),
        "fragment": "automatisation.html",
        "breadcrumb": [("Automatisation", "automatisation.html")],
    },
    "ia.html": {
        "title": "IA générative appliquée à votre business | ePerformance",
        "description": "Contenu, service client, analyse et préparation commerciale : l'IA générative appliquée à des livrables mesurables. Abidjan, Côte d'Ivoire.",
        "h1": 'L\'IA qui produit un livrable, <em>pas une démonstration.</em>',
        "eyebrow": "Pilier 02 · IA générative",
        "lead": ("L'IA générative n'a de valeur que si elle sort quelque chose que vous pouvez "
                 "vendre, publier ou décider. Le reste est une démonstration. Voici ce que nous "
                 "en faisons concrètement."),
        "cta": ("Faire mon diagnostic gratuit", "diagnostic_eperformance.html"),
        "fragment": "ia.html",
        "breadcrumb": [("IA générative", "ia.html")],
    },
    "site-web.html": {
        "title": "Création de site web en Côte d'Ivoire | ePerformance",
        "description": "Site web sur mesure avec agent IA qui capte vos contacts. À partir de 100 000 FCFA, nom de domaine inclus, livré en sept jours ouvrés.",
        "h1": 'Un site qui vous appartient, <em>et qui travaille pour vous.</em>',
        "eyebrow": "Pilier 04 · Développement web premium",
        "lead": ("Pas un template recyclé. Votre site est pensé pour votre secteur, vos couleurs "
                 "et votre image. Il capte les contacts, il est rapide, et il vous appartient."),
        "cta": ("Voir les trois formules", "#offres"),
        "fragment": "site-web.html",
        "breadcrumb": [("Création de site web", "site-web.html")],
    },
    "formation.html": {
        "title": "Formations acquisition et publicité digitale | ePerformance",
        "description": "Deux formations en visio individuelle : publicité Facebook et Instagram, et structuration de votre acquisition. Dès 10 000 FCFA.",
        "h1": 'Deux formations. Un seul objectif : <em>vous rendre autonome.</em>',
        "lead": ("L'une vous apprend à faire de la publicité. L'autre à savoir si vous devez en "
                 "faire. Ou les deux, ensemble."),
        "cta": ("Demander une place", "#inscription"),
        "fragment": "formation.html",
        "breadcrumb": [("Formations", "formation.html")],
    },
    "ebook.html": {
        "title": "Ebooks acquisition et publicité Meta | ePerformance",
        "description": "Deux guides : Facebook et Instagram Ads version 2026, et pourquoi votre publicité n'est pas rentable. Duo à 15 000 FCFA.",
        "h1": 'Deux guides pour <em>maîtriser votre acquisition.</em>',
        "lead": ("Un guide technique sur Meta Ads, un guide stratégique sur les chiffres. "
                 "Concrets, sans jargon, à jour des évolutions de 2026."),
        "cta": ("Voir les deux guides", "#guides"),
        "fragment": "ebook.html",
        "breadcrumb": [("Ebooks", "ebook.html")],
    },
    "diagnostic_eperformance.html": {
        "title": "Diagnostic acquisition gratuit — CAC, LTV | ePerformance",
        "description": "Cinq minutes pour connaître votre vrai coût d'acquisition, votre LTV, votre Payback et un score sur 100. Résultat immédiat, sans engagement.",
        "h1": 'Votre situation réelle.<br><em>En chiffres. En cinq minutes.</em>',
        "lead": ("Répondez à quelques questions et recevez immédiatement vos quatre ratios, "
                 "vos principales failles et un score sur 100. Aucun engagement."),
        "fragment": "diagnostic_eperformance.html",
        "breadcrumb": [("Diagnostic", "diagnostic_eperformance.html")],
        "noindex": False,
        "extra_css": "form",
    },
    "cas-client-mlm.html": {
        "title": "Cas client : système d'acquisition MLM | ePerformance",
        "description": "Seize mois de données Search Console pour un distributeur au Burkina Faso : 15 666 clics organiques, 10,4 % de CTR, zéro publicité Google.",
        "h1": 'Un distributeur MLM. Un système complet. <em>Une preuve chiffrée.</em>',
        "eyebrow": "Étude de cas · Longrich Santé Bio",
        "lead": ("Seize mois de données Search Console, aucune publicité Google achetée. "
                 "Voici ce qui a été construit et ce que cela a produit."),
        "cta": ("Voir les formules de site", "site-web.html#offres"),
        "fragment": "cas-client-mlm.html",
        "breadcrumb": [("Cas client MLM", "cas-client-mlm.html")],
    },
    "kstephane.html": {
        "title": "K. Stéphane — fondateur d'ePerformance | Abidjan",
        "description": "K. Stéphane accompagne les entrepreneurs d'Afrique de l'Ouest sur leur acquisition digitale depuis 2017. Sites web, IA, automatisation, formation.",
        "h1": 'K. Stéphane<br><em>fondateur d\'ePerformance.</em>',
        "lead": ("Je travaille avec des entrepreneurs qui vendent déjà et qui veulent savoir "
                 "ce que chaque client leur coûte vraiment. Basé en Côte d'Ivoire, 100 % en ligne."),
        "fragment": "kstephane.html",
        "breadcrumb": [("À propos", "kstephane.html")],
    },
    "mentions-legales.html": {
        "title": "Mentions légales | ePerformance",
        "description": "Éditeur, directeur de la publication, hébergeur et propriété intellectuelle du site eperformance.pro.",
        "h1": "Mentions légales",
        "fragment": "mentions-legales.html",
        "noindex": False,
    },
    "politique-confidentialite.html": {
        "title": "Politique de confidentialité | ePerformance",
        "description": "Données collectées, finalités, sous-traitants, durées de conservation et exercice de vos droits. Loi ivoirienne 2013-450 et RGPD.",
        "h1": "Politique de confidentialité",
        "fragment": "politique-confidentialite.html",
    },
    "cookies.html": {
        "title": "Cookies et traceurs | ePerformance",
        "description": "Quels cookies nous utilisons, pourquoi, et comment accepter ou refuser les traceurs de mesure d'audience et de publicité.",
        "h1": "Cookies et traceurs",
        "fragment": "cookies.html",
    },
    "cgv.html": {
        "title": "Conditions générales de vente | ePerformance",
        "description": "Commande, prix en FCFA, paiement, délais, rétractation et garanties applicables aux prestations ePerformance.",
        "h1": "Conditions générales de vente",
        "fragment": "cgv.html",
    },
    "404.html": {
        "title": "Page introuvable | ePerformance",
        "description": "Cette page n'existe pas ou a été déplacée.",
        "h1": "Cette page n'existe pas.",
        "lead": ("Le lien est peut-être obsolète, ou l'adresse mal orthographiée. "
                 "Voici par où continuer."),
        "fragment": "404.html",
        "noindex": True,
    },
}

# ---------------------------------------------------------------------------
# GABARIT — <head>
# ---------------------------------------------------------------------------

# Le thème est appliqué AVANT le premier rendu : aucun FOUC.
THEME_SCRIPT = """<script>
(function(){try{var t=localStorage.getItem('eperf-theme');
if(t!=='dark'&&t!=='light'){t='light';}
document.documentElement.setAttribute('data-theme',t);}catch(e){}})();
</script>"""


# Polices peintes au premier écran, auto-hébergées dans assets/fonts/.
# Les précharger garantit que le texte est peint dans la bonne police dès le
# premier rendu : sans cela le navigateur affiche d'abord le repli puis
# recompose — c'est ce qui produisait un CLS de 0,13 à la première visite.
FONT_PRELOADS = [
    'assets/fonts/cormorant-garamond-700.woff2',
    'assets/fonts/dm-sans-400.woff2',
]

# Les polices sont servies localement (assets/fonts/) : plus de requête tierce.


def head(page_key, meta):
    """Construit le <head> complet pour une page."""
    title = html.escape(meta["title"])
    desc = html.escape(meta.get("description", SITE_DESC), quote=True)
    canonical = f"{BASE_URL}/{page_key}" if page_key != "index.html" else f"{BASE_URL}/"
    og_type = "website"

    robots = ('<meta name="robots" content="noindex,follow">'
              if meta.get("noindex") else
              '<meta name="robots" content="index,follow,max-image-preview:large">')

    parts = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        THEME_SCRIPT,
        f"<title>{title}</title>",
        f'<meta name="description" content="{desc}">',
        robots,
        f'<link rel="canonical" href="{canonical}">',
        '<meta name="theme-color" content="#fdfcfa">',
        f'<meta name="author" content="K. Stéphane">',
        "",
        '<!-- Icônes -->',
        '<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32">',
        '<link rel="icon" href="assets/img/favicon-16.png" sizes="16x16">',
        '<link rel="apple-touch-icon" href="assets/img/icon-192.png">',
        "",
        '<!-- Open Graph -->',
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        f'<meta property="og:locale" content="fr_CI">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{canonical}">',
        f'<meta property="og:image" content="{BASE_URL}/assets/img/og-image.jpg">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="ePerformance — {html.escape(SITE_NAME)}">',
        "",
        '<!-- Twitter -->',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{title}">',
        f'<meta name="twitter:description" content="{desc}">',
        f'<meta name="twitter:image" content="{BASE_URL}/assets/img/og-image.jpg">',
        f'<meta name="twitter:creator" content="@eperformancepro">',
        "",
        '<!-- Polices : préconnexion, préchargement des deux polices critiques,',
        '     puis chargement non bloquant de la feuille complète -->',
        '<!-- Polices : auto-hébergées, déclarées dans eperf.css.',
        '     On précharge les deux graisses du premier écran pour que le',
        '     texte soit peint dans la bonne police dès le premier rendu. -->',
    ] + [
        f'<link rel="preload" as="font" type="font/woff2" crossorigin href="{u}">'
        for u in FONT_PRELOADS
    ] + [
        '',
        '<!-- Design system : une seule feuille externe pour tout le site. -->',
        '<link rel="stylesheet" href="assets/css/eperf.css">',
    ]

    return "\n".join("  " + p if p else "" for p in parts)


# ---------------------------------------------------------------------------
# EN-TÊTE — une seule définition pour tout le site
#   (remplace les 7 variantes divergentes de l'ancien site)
# ---------------------------------------------------------------------------

def header(active=""):
    links = []
    for label, href, key in NAV:
        attrs = []
        if key == active:
            attrs.append('aria-current="page"')
        if href.startswith("http"):
            attrs.append('rel="noopener"')
        a = " ".join(attrs)
        cls = ' class="text-gold"' if key == "blog" else ""
        links.append(f'      <a href="{href}"{cls}{(" " + a) if a else ""}>{label}</a>')
    nav = "\n".join(links)

    return f"""<a class="skip-link" href="#main">Aller au contenu</a>

<header class="site-header">
  <div class="container header-inner">

    <a class="logo" href="index.html" aria-label="ePerformance — accueil">
      <img class="logo-img-light" src="assets/img/logo-light.webp"
           srcset="assets/img/logo-light.webp 1x, assets/img/logo-light@2x.webp 2x"
           width="182" height="30" alt="ePerformance" fetchpriority="high">
      <img class="logo-img-dark" src="assets/img/logo-dark.webp"
           srcset="assets/img/logo-dark.webp 1x, assets/img/logo-dark@2x.webp 2x"
           width="188" height="30" alt="" aria-hidden="true">
    </a>

    <nav class="nav" id="primary-nav" aria-label="Navigation principale">
{nav}
    </nav>

    <div class="header-actions">
      <button class="theme-toggle" type="button" data-theme-toggle
              aria-pressed="false" aria-label="Activer le thème sombre">
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
        </svg>
      </button>

      <a class="btn btn-outline btn-desktop" href="{WHATSAPP}" data-cta="whatsapp"
         target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 11.6a8.4 8.4 0 0 1-12.5 7.4L3.6 20.4l1.4-4.3A8.4 8.4 0 1 1 20.4 11.6z"/><path d="M9.4 9.2a4.6 4.6 0 0 0 5.4 5.4"/></svg> WhatsApp</a>

      <a class="btn btn-gold btn-desktop" href="diagnostic_eperformance.html">Diagnostic gratuit</a>

      <button class="nav-toggle" type="button" aria-expanded="false"
              aria-controls="primary-nav" aria-label="Ouvrir le menu">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18"/>
        </svg>
      </button>
    </div>

  </div>
</header>"""


# ---------------------------------------------------------------------------
# PIED DE PAGE — une seule définition
# ---------------------------------------------------------------------------

def footer():
    cols = []
    for title, links in FOOTER_COLS:
        items = "\n".join(
            f'          <li><a href="{href}"{" rel=\"noopener\"" if href.startswith("http") else ""}>{html.escape(label)}</a></li>'
            for label, href in links
        )
        cols.append(f"""      <div class="footer-col">
        <h2>{title}</h2>
        <ul>
{items}
        </ul>
      </div>""")

    legal = " · ".join(
        f'<a href="{href}">{label}</a>' for label, href in LEGAL_LINKS
    )

    return f"""<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">

      <div class="footer-col">
        <img class="footer-logo logo-img-light" src="assets/img/logo-light.webp"
             srcset="assets/img/logo-light.webp 1x, assets/img/logo-light@2x.webp 2x"
             width="152" height="25" alt="ePerformance" loading="lazy">
        <img class="footer-logo logo-img-dark" src="assets/img/logo-dark.webp"
             srcset="assets/img/logo-dark.webp 1x, assets/img/logo-dark@2x.webp 2x"
             width="157" height="25" alt="" aria-hidden="true" loading="lazy">
        <p class="card-text mt-3" style="max-width:34ch">{html.escape(SITE_DESC)}</p>
      </div>

{chr(10).join(cols)}

    </div>

    <div class="footer-bottom">
      <p>© {YEAR} ePerformance — par K. Stéphane. Tous droits réservés.</p>
      <p>{legal}</p>
    </div>
  </div>
</footer>

<div class="sticky-cta">
  <a class="btn btn-gold" href="diagnostic_eperformance.html">Diagnostic gratuit</a>
  <a class="btn btn-wa" href="{WHATSAPP}" style="flex:0 0 auto" rel="noopener"
     data-cta="whatsapp" aria-label="Écrire sur WhatsApp"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 11.6a8.4 8.4 0 0 1-12.5 7.4L3.6 20.4l1.4-4.3A8.4 8.4 0 1 1 20.4 11.6z"/><path d="M9.4 9.2a4.6 4.6 0 0 0 5.4 5.4"/></svg> WhatsApp</a>
</div>

<!-- Bouton WhatsApp flottant — desktop uniquement. Voir .wa-float dans eperf.css :
     sur mobile la barre ci-dessus fait déjà le travail, et le bas à droite est
     réservé au widget chatbot. -->
<a class="wa-float" href="{WHATSAPP}" data-cta="whatsapp" target="_blank" rel="noopener"
   aria-label="Écrire sur WhatsApp">
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 11.6a8.4 8.4 0 0 1-12.5 7.4L3.6 20.4l1.4-4.3A8.4 8.4 0 1 1 20.4 11.6z"/><path d="M9.4 9.2a4.6 4.6 0 0 0 5.4 5.4"/></svg>
</a>"""


# ---------------------------------------------------------------------------
# BANDEAU DE CONSENTEMENT
#   Les traceurs ne se chargent QU'APRÈS consentement explicite.
# ---------------------------------------------------------------------------

CONSENT_BANNER = """<div class="consent" id="consent-banner" hidden>
  <div class="consent-inner">
    <div class="consent-text">
      <p><strong>Vous choisissez ce que nous mesurons.</strong></p>
      <p>Nous utilisons des traceurs pour comprendre comment le site est utilisé et pour
         mesurer nos campagnes. Aucun ne se déclenche avant votre accord.
         <a href="politique-confidentialite.html">Politique de confidentialité</a> ·
         <a href="cookies.html">En savoir plus</a></p>
    </div>
    <div class="consent-actions">
      <button type="button" class="btn btn-ghost" data-consent="refuse">Tout refuser</button>
      <button type="button" class="btn btn-outline" data-consent="customize">Paramétrer</button>
      <button type="button" class="btn btn-gold" data-consent="accept">Tout accepter</button>
    </div>
  </div>

  <div class="consent-detail" id="consent-detail" hidden>
    <fieldset class="fieldset">
      <legend>Vos préférences</legend>

      <label class="consent-row consent-row-locked">
        <input type="checkbox" checked disabled>
        <span>
          <strong>Nécessaires</strong>
          <span class="field-hint">Mémorisation de votre choix de thème et de vos préférences.
            Toujours actifs : le site ne peut pas fonctionner sans.</span>
        </span>
      </label>

      <label class="consent-row">
        <input type="checkbox" id="consent-analytics">
        <span>
          <strong>Mesure d'audience</strong>
          <span class="field-hint">Google Analytics 4 et Microsoft Clarity. Nous aide à voir
            quelles pages sont utiles et où les visiteurs abandonnent.</span>
        </span>
      </label>

      <label class="consent-row">
        <input type="checkbox" id="consent-ads">
        <span>
          <strong>Publicité</strong>
          <span class="field-hint">Meta Pixel. Mesure l'efficacité de nos campagnes
            Facebook et Instagram.</span>
        </span>
      </label>
    </fieldset>

    <div class="consent-actions">
      <button type="button" class="btn btn-outline" data-consent="back">Retour</button>
      <button type="button" class="btn btn-gold" data-consent="save">Enregistrer mes choix</button>
    </div>
  </div>
</div>"""


# ---------------------------------------------------------------------------
# GRAPHE DE DONNÉES STRUCTURÉES — Organization + WebSite, une fois par page
#   Les entités sont reliées par @id pour que Google et les moteurs IA
#   comprennent qu'il s'agit de la même organisation.
# ---------------------------------------------------------------------------

def site_graph(page_key, meta):
    canonical = f"{BASE_URL}/{page_key}" if page_key != "index.html" else f"{BASE_URL}/"

    org = {
        "@type": "Organization",
        "@id": f"{BASE_URL}/#organization",
        "name": "ePerformance",
        "alternateName": "ePerformance par K. Stéphane",
        "url": BASE_URL,
        "email": EMAIL,
        "telephone": "+2250151170666",
        "founder": {
            "@type": "Person",
            "@id": f"{BASE_URL}/#founder",
            "name": "K. Stéphane",
            "jobTitle": "Fondateur, stratège acquisition",
            "url": f"{BASE_URL}/kstephane.html",
        },
        "areaServed": [
            {"@type": "Country", "name": "Côte d'Ivoire"},
            {"@type": "Country", "name": "Burkina Faso"},
            {"@type": "Place", "name": "Afrique de l'Ouest"},
        ],
        "knowsLanguage": "fr",
        "sameAs": ["https://blog.eperformance.pro/"],
    }

    # LocalBusiness : le ciblage Abidjan est explicite dans le contenu, il
    # manquait totalement du balisage. Il porte l'adresse de service.
    local = {
        "@type": "ProfessionalService",
        "@id": f"{BASE_URL}/#localbusiness",
        "name": "ePerformance",
        "description": SITE_DESC,
        "url": BASE_URL,
        "email": EMAIL,
        "telephone": "+2250151170666",
        "parentOrganization": {"@id": f"{BASE_URL}/#organization"},
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Abidjan",
            "addressCountry": "CI",
        },
        "areaServed": {"@type": "Country", "name": "Côte d'Ivoire"},
        "priceRange": "100000-350000 XOF",
        "currenciesAccepted": "XOF",
        "paymentAccepted": "Orange Money, Wave, MTN MoMo, Moov Money, Visa, Mastercard",
        "availableLanguage": "fr",
    }

    website = {
        "@type": "WebSite",
        "@id": f"{BASE_URL}/#website",
        "url": BASE_URL,
        "name": "ePerformance",
        "description": SITE_DESC,
        "publisher": {"@id": f"{BASE_URL}/#organization"},
        "inLanguage": "fr-CI",
    }

    page = {
        "@type": "WebPage",
        "@id": f"{canonical}#webpage",
        "url": canonical,
        "name": meta["title"],
        "description": meta.get("description", SITE_DESC),
        "isPartOf": {"@id": f"{BASE_URL}/#website"},
        "about": {"@id": f"{BASE_URL}/#organization"},
        "inLanguage": "fr-CI",
    }

    graph = [org, local, website, page]

    if meta.get("breadcrumb"):
        items = [{"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{BASE_URL}/"}]
        for i, (name, href) in enumerate(meta["breadcrumb"], start=2):
            items.append({"@type": "ListItem", "position": i, "name": name,
                          "item": f"{BASE_URL}/{href}"})
        graph.append({
            "@type": "BreadcrumbList",
            "@id": f"{canonical}#breadcrumb",
            "itemListElement": items,
        })

    return {"@context": "https://schema.org", "@graph": graph}


def page_schema_blocks(page_key, meta):
    """Blocs JSON-LD additionnels fournis par le fragment de contenu."""
    frag_path = os.path.join(CONTENT, meta["fragment"])
    if not os.path.exists(frag_path):
        return [], ""
    raw = open(frag_path, encoding="utf-8").read()
    blocks = re.findall(
        r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', raw, re.S
    )
    return blocks, raw


def strip_schema(raw):
    """Retire les blocs JSON-LD du fragment : ils sont remontés dans le <head>."""
    return re.sub(
        r'\s*<script[^>]*type="application/ld\+json"[^>]*>.*?</script>\s*', "\n", raw, flags=re.S
    ).strip()


# ---------------------------------------------------------------------------
# BREADCRUMB VISIBLE
# ---------------------------------------------------------------------------

def breadcrumb_html(meta):
    if not meta.get("breadcrumb"):
        return ""
    items = ['<li><a href="index.html">Accueil</a></li>']
    for i, (name, href) in enumerate(meta["breadcrumb"]):
        last = i == len(meta["breadcrumb"]) - 1
        if last:
            items.append(f'<li aria-current="page">{html.escape(name)}</li>')
        else:
            items.append(f'<li><a href="{href}">{html.escape(name)}</a></li>')
    return ('<nav class="breadcrumb container" aria-label="Fil d\'Ariane">\n'
            '  <ol>\n    ' + "\n    ".join(items) + "\n  </ol>\n</nav>")


# ---------------------------------------------------------------------------
# HÉROS DE PAGE — titre + chapô + CTA
# ---------------------------------------------------------------------------

def hero(meta):
    if not meta.get("h1"):
        return ""

    eyebrow = (f'      <span class="eyebrow">{html.escape(meta["eyebrow"])}</span>\n'
               if meta.get("eyebrow") else "")
    lead = (f'      <p class="lead mt-3">{html.escape(meta["lead"])}</p>\n'
            if meta.get("lead") else "")

    ctas = []
    if meta.get("cta"):
        label, href = meta["cta"]
        ctas.append(f'        <a class="btn btn-gold" href="{href}">{html.escape(label)}\n'
                    '          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" '
                    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
                    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>\n'
                    '        </a>')
    if meta.get("cta2"):
        label, href = meta["cta2"]
        ctas.append(f'        <a class="btn btn-outline" href="{href}">{html.escape(label)}</a>')

    cta_block = ""
    if ctas:
        cta_block = ('      <div class="row mt-4" style="gap:12px;flex-wrap:wrap">\n'
                     + "\n".join(ctas) + "\n      </div>\n")

    return f"""  <section class="hero">
    <div class="container">
{eyebrow}      <h1 class="mt-3">{meta["h1"]}</h1>
{lead}{cta_block}    </div>
  </section>"""


# ---------------------------------------------------------------------------
# ASSEMBLAGE D'UNE PAGE
# ---------------------------------------------------------------------------

def compose_page(page_key, meta):
    frag_path = os.path.join(CONTENT, meta["fragment"])
    if not os.path.exists(frag_path):
        raise FileNotFoundError(f"fragment manquant : {frag_path}")

    schema_blocks, raw = page_schema_blocks(page_key, meta)
    body = strip_schema(raw)

    # JSON-LD : graphe de site + blocs propres à la page
    ld = [json.dumps(site_graph(page_key, meta), ensure_ascii=False, indent=2)]
    for b in schema_blocks:
        try:
            json.loads(b)                      # validation
            ld.append(b.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"JSON-LD invalide dans {meta['fragment']} : {e}")

    ld_html = "\n".join(
        f'  <script type="application/ld+json">\n{b}\n  </script>' for b in ld
    )

    return f"""<!DOCTYPE html>
<html lang="fr" class="no-js" data-theme="light">
<head>
{head(page_key, meta)}
{ld_html}
</head>
<body>

{header(meta.get("nav_active", ""))}

{breadcrumb_html(meta)}

<main id="main">
{hero(meta)}

{body}
</main>

{footer()}

{CONSENT_BANNER}

<script src="assets/js/consent.js" defer></script>
<script src="assets/js/eperf.js" defer></script>
<script src="assets/js/tracking.js" defer></script>
</body>
</html>
"""



# ---------------------------------------------------------------------------
# CONTRÔLE DE COMPOSITION
#   Ce contrôle existe à cause d'un bug réel : la balise
#   <link rel="stylesheet" href="assets/css/eperf.css"> a disparu du gabarit
#   lors d'une réécriture du <head>, et les 14 pages ont été régénérées sans
#   design system. Aucun test ne l'a vu, parce qu'aucun test ne vérifiait que
#   la page produite contenait réellement ses ressources.
#   Une page sans feuille de style reste du HTML parfaitement valide : seule
#   une vérification explicite peut l'attraper.
# ---------------------------------------------------------------------------

RESSOURCES_CRITIQUES = [
    ('assets/css/eperf.css',
     'la feuille du design system — sans elle la page n\'est pas stylée',
     '<link rel="stylesheet" href="assets/css/eperf.css">'),
    ('assets/js/consent.js',
     'le consentement — sans lui les traceurs ne se chargent pas du tout',
     'assets/js/consent.js'),
    ('assets/js/eperf.js',
     'le thème et les interactions',
     'assets/js/eperf.js'),
    ('assets/js/tracking.js',
     'les événements de mesure — sans lui aucune conversion ne remonte',
     'assets/js/tracking.js'),
]


def controler(page_key, html_produit):
    """Vérifie qu'une page contient bien ses ressources. Renvoie une liste
    de problèmes, vide si tout va bien."""
    problemes = []
    for chemin, role, motif in RESSOURCES_CRITIQUES:
        if motif not in html_produit:
            problemes.append(f"balise absente du HTML : {role}")
        if not os.path.exists(os.path.join(PREVIEW, chemin)):
            problemes.append(f"fichier introuvable sur disque : {chemin}")
    for police in FONT_PRELOADS:
        if police not in html_produit:
            problemes.append(f"police non préchargée : {police}")
        if not os.path.exists(os.path.join(PREVIEW, police)):
            problemes.append(f"fichier de police introuvable : {police}")
    if '<link rel="stylesheet"' not in html_produit:
        problemes.append("aucune feuille de style liée dans le <head>")
    return problemes


# ---------------------------------------------------------------------------
# PROGRAMME
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description="Compose les pages statiques ePerformance.")
    ap.add_argument("--check", action="store_true", help="vérifie sans écrire")
    ap.add_argument("--only", help="ne composer qu'une page (nom de fichier)")
    args = ap.parse_args()

    os.makedirs(PREVIEW, exist_ok=True)

    written, skipped, errors = 0, [], []

    for page_key, meta in PAGES.items():
        if args.only and page_key != args.only:
            continue
        frag = os.path.join(CONTENT, meta["fragment"])
        if not os.path.exists(frag):
            skipped.append((page_key, meta["fragment"]))
            continue
        try:
            out = compose_page(page_key, meta)
        except Exception as e:
            errors.append((page_key, str(e)))
            continue
        problemes = controler(page_key, out)
        if problemes:
            errors.append((page_key, " ; ".join(problemes)))
            continue

        if not args.check:
            with open(os.path.join(PREVIEW, page_key), "w", encoding="utf-8") as f:
                f.write(out)
        written += 1

    label = "vérifiées" if args.check else "écrites"
    print(f"  {written} page(s) {label}")
    if written and not errors:
        print(f"  ressources vérifiées : feuille de style, JS, polices")

    if skipped:
        print(f"\n  Fragments absents ({len(skipped)}) :")
        for k, f in skipped:
            print(f"    {k:34} ← _content/{f}")

    if errors:
        print(f"\n  ERREURS ({len(errors)}) :")
        for k, e in errors:
            print(f"    {k} : {e}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
