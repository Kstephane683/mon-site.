#!/usr/bin/env python3
"""Vérifie que chaque page publiée contient tous les blocs critiques.

Né d'un incident : le 18 septembre 2026, un commit a recomposé les pages depuis
un générateur qui n'émettait pas le bloc SDK du chatbot, puis les a copiées vers
la racine. Le chatbot a disparu d'eperformance.pro en production.

La leçon : **recomposer ne met pas à jour les pages, il les régénère.** Tout ce
qui n'est pas émis par le générateur disparaît, y compris ce qui avait été
ajouté à la main dans les fichiers HTML.

Ce contrôle s'exécute sur les fichiers de la racine — ceux qui partent en
production — et non sur le preview. Il doit tourner AVANT toute copie vers la
racine, et il tourne en CI à chaque push.

Usage :
    python3 scripts/verifier-blocs-critiques.py          # contrôle
    python3 scripts/verifier-blocs-critiques.py --strict # code de sortie 1 si échec
"""
import argparse
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent

# Chaque bloc : (nom, motif à trouver, pourquoi il compte)
BLOCS = [
    ("SDK chatbot",
     r"eperformance-sdk\.js",
     "sans lui le widget ne se charge pas — incident du 18/09/2026"),
    ("Configuration chatbot",
     r"ePerformanceConfig",
     "le SDK lit sa configuration dans cet objet"),
    ("Tracking",
     r"assets/js/tracking\.js",
     "sans lui aucune conversion ne remonte à GA4"),
    ("Consentement",
     r"assets/js/consent\.js",
     "sans lui les traceurs ne se chargent pas du tout"),
    ("Comportement",
     r"assets/js/eperf\.js",
     "thème et interactions"),
    ("Feuille de style",
     r"assets/css/eperf\.css",
     "sans elle la page n'est pas stylée"),
]

# Marqueurs de gabarit qui ne doivent JAMAIS atteindre une page publiée.
# Ajouté après le 19/09/2026 : les pages légales étaient en ligne avec
# [À COMPLÉTER] visible, et aucun contrôle ne portait sur le contenu rédactionnel.
MARQUEURS = re.compile(
    r'\[À COMPLÉTER|\[A COMPLETER|\[TODO|\[XXX|\[PLACEHOLDER'
    r'|Document à compléter|doivent être renseignées par l.éditeur'
    r'|legal-warning|legal-todo')

# Blocs attendus sur toutes les pages, mais qui peuvent manquer sur certaines
BLOCS_SOUPLES = [
    ("Bouton WhatsApp", r'data-cta="whatsapp"', "les pages sans CTA n'en ont pas"),
]


def pages_publiees():
    """Les pages de la racine, hors dossiers techniques et preview."""
    ignorees = {"preview", "_build", "_content", "_templates", "scripts",
                "docs", "assets", "node_modules", "application", ".git", ".github"}
    pages = []
    for f in sorted(RACINE.rglob("*.html")):
        parties = set(f.relative_to(RACINE).parts[:-1])
        if parties & ignorees:
            continue
        # Les pages de redirection (dossier/index.html renvoyant vers la page
        # racine homonyme) ne portent ni feuille de style ni script : ce sont
        # des coquilles de réécriture d'URL, pas des pages.
        texte = f.read_text(encoding="utf-8")
        if len(texte) < 1200 and "http-equiv=\"refresh\"" in texte:
            continue
        pages.append(f)
    return pages


def controler():
    pages = pages_publiees()
    if not pages:
        return ["aucune page trouvée à la racine"], []

    manquants, souples = [], []
    for f in pages:
        s = f.read_text(encoding="utf-8")
        for nom, motif, raison in BLOCS:
            if not re.search(motif, s):
                manquants.append((str(f.relative_to(RACINE)), nom, raison))
        for nom, motif, _ in BLOCS_SOUPLES:
            if not re.search(motif, s):
                souples.append(str(f.relative_to(RACINE)))
    return manquants, souples


def controler_generateur():
    """Le générateur émet-il les blocs ? C'est la cause racine de l'incident."""
    compose = RACINE / "preview" / "_build" / "compose.py"
    if not compose.exists():
        return ["preview/_build/compose.py introuvable"]
    s = compose.read_text(encoding="utf-8")
    absents = []
    for nom, motif, _ in BLOCS:
        if not re.search(motif, s):
            absents.append(nom)
    return absents


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--strict", action="store_true",
                    help="code de sortie 1 si un bloc manque")
    args = ap.parse_args()

    manquants, souples = controler()
    gen = controler_generateur()
    pages = pages_publiees()

    print(f"  {len(pages)} page(s) publiée(s) contrôlée(s)")

    if gen:
        print(f"  ✗ GÉNÉRATEUR : bloc(s) non émis → {', '.join(gen)}")
        print("      Recommposer effacerait ces blocs des pages.")
    else:
        print("  ✓ générateur : émet tous les blocs critiques")

    # Une page ne passe pas par le composeur : merci-candidature.html. Elle date
    # d'avant la refonte et garde ses propres styles. Sa conformité a été corrigée
    # le 18/09/2026 — GA4 et le pixel Meta y étaient chargés en dur, sans
    # consentement ; ils passent désormais par consent.js et le bandeau est en
    # place. Reste à la migrer vers le composeur, ce qui n'est pas urgent : elle
    # fonctionne. `merci-ebook.html` en faisait partie ; elle a été supprimée le
    # 18/09/2026 et `/merci-ebook/` redirige maintenant vers `/ebook.html`.
    LEGACY = {"merci-candidature.html"}
    regression = [m for m in manquants if m[0] not in LEGACY]
    heritage = [m for m in manquants if m[0] in LEGACY]

    if regression:
        print(f"  ✗ {len(regression)} bloc(s) manquant(s) — RÉGRESSION :")
        for nom_page, bloc, raison in regression[:12]:
            print(f"      {nom_page} : {bloc} — {raison}")
    if heritage:
        pages_legacy = sorted({m[0] for m in heritage})
        print(f"  · {len(pages_legacy)} page(s) hors composeur, à migrer un jour : {', '.join(pages_legacy)}")
        print("      Conformité corrigée ; il reste à les passer au composeur.")
    else:
        print(f"  ✓ pages : les {len(BLOCS)} blocs critiques sont présents partout")

    if souples:
        print(f"  · {len(souples)} page(s) sans bouton WhatsApp (normal hors CTA)")

    marqueurs = []
    for f in pages:
        for m in MARQUEURS.finditer(f.read_text(encoding="utf-8")):
            marqueurs.append((str(f.relative_to(RACINE)), m.group(0)))
    if marqueurs:
        print(f"  ✗ {len(marqueurs)} marqueur(s) de gabarit dans les pages publiées :")
        for nom, motif in marqueurs[:8]:
            print(f"      {nom} : {motif}")

    echec = bool(regression or gen or marqueurs)
    if echec:
        print()
        print("  NE PAS COPIER VERS LA RACINE. Corriger le générateur d'abord,")
        print("  puis recomposer et relancer ce contrôle.")
    else:
        print()
        print("  Publication sûre : les pages contiennent tous les blocs.")

    return 1 if (echec and args.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
