#!/usr/bin/env python3
"""
ePerformance — Injection des illustrations dans les fragments de contenu
preview/_build/injecter_illustrations.py

Remplace, dans preview/_content/, les pastilles d'icône ciblées par
l'illustration correspondante de illustrations.py.

Deux règles d'application (ADR-0003) :
  - cartes larges (ratios, piliers, méthode, cas d'usage, cas client) :
    illustration seule, l'icône est retirée ;
  - cartes compactes (formules, article-card, pilier-card) :
    illustration en bandeau, l'icône est conservée.

Les cibles sont désignées par le TITRE de la carte — ou par son numéro
lorsqu'elle en porte un (les ratios) — jamais par position : un titre qui
bouge ne casse pas l'injection, un titre qui change se voit tout de suite.

Le script est idempotent : une carte qui porte déjà la bonne illustration est
laissée intacte, et une carte dont l'illustration a changé est remise à jour
sur place. Il ne double jamais une figure, quel que soit le nombre de passes.

Usage :
    python3 preview/_build/injecter_illustrations.py            # injecte
    python3 preview/_build/injecter_illustrations.py --check    # vérifie
"""

import argparse
import html
import os
import re
import sys

BUILD = os.path.dirname(os.path.abspath(__file__))
if BUILD not in sys.path:
    sys.path.insert(0, BUILD)

from illustrations import ILLUSTRATIONS, controler   # noqa: E402

CONTENT = os.path.join(os.path.dirname(BUILD), "_content")

# Classes qui identifient une carte de contenu (comparaison sur le jeton
# exact : « article-card-thumb » n'est pas une carte).
CLASSES_CARTE = {"card", "pilier-card", "article-card"}

# ---------------------------------------------------------------------------
# RÈGLES D'INJECTION
#   (fragment, cible, valeur, illustration, mode)
#   cible  : card-num | card-title | titre | carte
#   valeur : le texte du titre (ou du numéro), ou le nom de classe pour
#            « carte » — auquel cas toutes les cartes de cette classe sont
#            traitées : c'est l'ornement de section, identique partout.
#   mode   : large (icône retirée) | bandeau (icône conservée)
# ---------------------------------------------------------------------------

REGLES = [
    # --- Accueil : les 4 ratios (repérés par leur numéro) ------------------
    ("index.html", "card-num", "Ratio 01", "ratio_cac", "large"),
    ("index.html", "card-num", "Ratio 02", "ratio_ltv", "large"),
    ("index.html", "card-num", "Ratio 03", "ratio_payback", "large"),
    ("index.html", "card-num", "Ratio 04", "ratio_marge", "large"),

    # --- Accueil : les 4 piliers ------------------------------------------
    ("index.html", "card-title", "Stratégie et acquisition", "pilier_strategie", "large"),
    ("index.html", "card-title", "IA générative", "pilier_ia", "large"),
    ("index.html", "card-title", "Automatisation", "pilier_automatisation", "large"),
    ("index.html", "card-title", "Web premium", "pilier_web", "large"),

    # --- Accueil : la méthode, complexité croissante ----------------------
    ("index.html", "card-title", "Poser les vrais chiffres", "methode_1", "large"),
    ("index.html", "card-title", "Rendre l'offre évidente", "methode_2", "large"),
    ("index.html", "card-title", "Installer un suivi propre", "methode_3", "large"),
    ("index.html", "card-title", "Accélérer sur des seuils validés", "methode_4", "large"),

    # --- Accueil : les 3 formules (cartes compactes) ----------------------
    ("index.html", "card-title", "Découverte", "formule_1", "bandeau"),
    ("index.html", "card-title", "Professionnel", "formule_2", "bandeau"),
    ("index.html", "card-title", "Croissance", "formule_3", "bandeau"),

    # --- Cas client -------------------------------------------------------
    ("cas-client-mlm.html", "card-num", "819 clics", "cas_client", "large"),

    # --- Automatisation : 4 cas d'usage -----------------------------------
    ("automatisation.html", "card-title",
     "Capture et qualification des demandes entrantes", "auto_capture", "large"),
    ("automatisation.html", "card-title",
     "Relance automatique des prospects tièdes", "auto_relance", "large"),
    ("automatisation.html", "card-title",
     "Reporting qui se remplit seul", "auto_reporting", "large"),
    ("automatisation.html", "card-title",
     "Synchronisation site, WhatsApp et suivi commercial", "auto_sync", "large"),

    # --- IA : 4 cas d'usage -----------------------------------------------
    ("ia.html", "card-title", "Contenu et publication", "ia_contenu", "large"),
    ("ia.html", "card-title", "Service client", "ia_service", "large"),
    ("ia.html", "card-title", "Analyse et reporting", "ia_analyse", "large"),
    ("ia.html", "card-title", "Préparation commerciale", "ia_prepa", "large"),

    # --- Site web : réemplois, aucun doublon ------------------------------
    ("site-web.html", "card-title", "Un site construit sur mesure", "pilier_web", "large"),
    ("site-web.html", "card-title", "Découverte", "formule_1", "bandeau"),
    ("site-web.html", "card-title", "Professionnel", "formule_2", "bandeau"),
    ("site-web.html", "card-title", "Croissance", "formule_3", "bandeau"),
    ("site-web.html", "card-title", "Le suivi des demandes", "cas_client", "large"),
]


# ---------------------------------------------------------------------------
# LECTURE DU HTML
# ---------------------------------------------------------------------------

BALISE = re.compile(r"<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>")
ATTR = re.compile(r'([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"')
ICONE = re.compile(r"[ \t]*<div\b[^>]*class=\"card-icon\"[^>]*>.*?</div>\n?", re.S)
FIGURE = re.compile(r'[ \t]*<div class="card-figure[^"]*">\s*<svg\b.*?</svg>\s*</div>\n?', re.S)


def _classes(attributs):
    valeur = attributs.get("class", "")
    return {c for c in valeur.split() if c}


def _fin_bloc(texte, debut, nom):
    """Index de fin du bloc ouvert en `debut` (balises imbriquées gérées)."""
    motif = re.compile(rf"<(/?){re.escape(nom)}\b[^>]*?(/?)>", re.I)
    profondeur = 0
    for m in motif.finditer(texte, debut):
        if m.group(1):
            profondeur -= 1
            if profondeur == 0:
                return m.end()
        elif not m.group(2):
            profondeur += 1
    return len(texte)


def cartes(texte, classe=None):
    """Rend [(debut, fin, nom, attributs)] pour chaque carte du fragment."""
    trouvees = []
    for m in BALISE.finditer(texte):
        nom = m.group(1).lower()
        if nom in ("svg", "path", "br", "img", "input", "meta", "link"):
            continue
        attributs = dict(ATTR.findall(m.group(2)))
        jetons = _classes(attributs)
        if not jetons & CLASSES_CARTE:
            continue
        if classe and classe not in jetons:
            continue
        fin = _fin_bloc(texte, m.start(), m.group(1))
        trouvees.append((m.start(), fin, nom, attributs))
    return trouvees


def _texte_interne(morceau):
    """Texte visible d'un fragment de balise, normalisé pour comparaison."""
    sans_balises = re.sub(r"<[^>]+>", "", morceau)
    return " ".join(html.unescape(sans_balises).split())


def _motif_cible(cible):
    if cible == "card-num":
        return re.compile(r'<(?:div|span|p)\b[^>]*class="card-num"[^>]*>.*?</(?:div|span|p)>', re.S)
    if cible == "card-title":
        return re.compile(r'<h[1-6]\b[^>]*class="card-title"[^>]*>.*?</h[1-6]>', re.S)
    if cible == "titre":
        return re.compile(r"<h[2-4]\b[^>]*>.*?</h[2-4]>", re.S)
    raise ValueError(f"cible inconnue : {cible}")


def _ancre(texte, debut, fin, cible, valeur):
    """Position de l'élément qui porte le sens de la carte."""
    for m in _motif_cible(cible).finditer(texte, debut, fin):
        if m.end() > fin:
            continue
        if valeur is None or _texte_interne(m.group(0)) == valeur:
            return m.start()
    return None


def _indentation(texte, position):
    debut_ligne = texte.rfind("\n", 0, position) + 1
    return re.match(r"[ \t]*", texte[debut_ligne:]).group(0)


def _point(texte, position):
    """(début de ligne, indentation) du point d'insertion.

    L'ancre ouvre sa ligne dans tous les fragments : on remplace alors son
    indentation par la figure, qui la restitue telle quelle.
    """
    debut_ligne = texte.rfind("\n", 0, position) + 1
    avant = texte[debut_ligne:position]
    if avant.strip() == "":
        return debut_ligne, avant
    return position, _indentation(texte, position)


def _figure(svg, bandeau, indentation):
    classes = "card-figure card-figure--bandeau" if bandeau else "card-figure"
    corps = "\n".join(indentation + "  " + ligne for ligne in svg.splitlines())
    return (f'{indentation}<div class="{classes}">\n{corps}\n{indentation}</div>\n')


# ---------------------------------------------------------------------------
# INJECTION
# ---------------------------------------------------------------------------

def _candidats(texte, cible, valeur):
    """Cartes du fragment qui portent la cible : [(debut, fin, ancre)]."""
    trouvees = []
    for debut, fin, nom, attributs in cartes(texte):
        if cible == "carte":
            if valeur not in _classes(attributs):
                continue
            ancre = _ancre(texte, debut, fin, "titre", None)
        else:
            ancre = _ancre(texte, debut, fin, cible, valeur)
        if ancre is None:
            continue
        trouvees.append((debut, fin, ancre))
    return trouvees


def _appliquer(texte, debut, fin, ancre, svg, bandeau):
    """Pose l'illustration dans la carte. Rend (texte, statut).

    statut : « ajout » (première pose), « maj » (l'illustration a changé),
    « inchange » (déjà en place, à l'identique). Aucun cas ne double la
    figure : c'est ce qui rend le script rejouable.
    """
    possee = FIGURE.search(texte, debut, fin)
    if possee:
        figure = _figure(svg, bandeau, _indentation(texte, possee.start()))
        if figure == possee.group(0):
            return texte, "inchange"
        return texte[:possee.start()] + figure + texte[possee.end():], "maj"

    if bandeau:
        point, retrait = _point(texte, ancre)
        return texte[:point] + _figure(svg, True, retrait) + texte[point:], "ajout"

    icone = ICONE.search(texte, debut, fin)
    if icone:                       # illustration seule : la pastille s'efface
        point, retrait = icone.start(), _indentation(texte, icone.start())
        return texte[:point] + _figure(svg, False, retrait) + texte[icone.end():], "ajout"

    point, retrait = _point(texte, ancre)
    return texte[:point] + _figure(svg, False, retrait) + texte[point:], "ajout"


def injecter_fragment(chemin, regles, journal):
    """Applique les règles d'un fichier. Rend le nombre d'insertions."""
    with open(chemin, encoding="utf-8") as f:
        texte = f.read()
    original = texte
    nom_fichier = os.path.basename(chemin)
    insertions = 0

    for cible, valeur, illustration, mode in regles:
        svg = ILLUSTRATIONS[illustration]
        bandeau = mode == "bandeau"

        # De la dernière carte vers la première : les positions relevées
        # restent valides pendant que le texte est réécrit.
        for debut, fin, ancre in reversed(_candidats(texte, cible, valeur)):
            texte, statut = _appliquer(texte, debut, fin, ancre, svg, bandeau)
            if statut == "inchange":
                journal["deja"].append(f"{nom_fichier} · {illustration}")
            else:
                insertions += 1
                journal["faits"].append(f"{nom_fichier} · {illustration} · {statut}")

    if texte != original:
        journal["fichiers"][nom_fichier] = insertions
        if not journal["check"]:
            with open(chemin, "w", encoding="utf-8") as f:
                f.write(texte)
    return insertions


def main():
    ap = argparse.ArgumentParser(
        description="Injecte les illustrations SVG dans les fragments de contenu.")
    ap.add_argument("--check", action="store_true",
                    help="contrôle et simule, sans écrire")
    args = ap.parse_args()

    # Le contrôle passe d'abord : rien ne s'injecte si une illustration
    # viole la direction artistique.
    for cle in sorted(ILLUSTRATIONS):
        controler(ILLUSTRATIONS[cle], cle)

    par_fichier = {}
    for fragment, cible, valeur, illustration, mode in REGLES:
        par_fichier.setdefault(fragment, []).append((cible, valeur, illustration, mode))

    journal = {"faits": [], "deja": [], "fichiers": {}, "check": args.check}
    total = 0

    for fragment in sorted(par_fichier):
        chemin = os.path.join(CONTENT, fragment)
        if not os.path.exists(chemin):
            print(f"  fragment absent : {fragment}")
            continue
        total += injecter_fragment(chemin, par_fichier[fragment], journal)

    verbe = "à poser" if args.check else "posées"
    print(f"  {len(ILLUSTRATIONS)} illustrations conformes (5 règles contrôlées)")
    print(f"  {total} illustration(s) {verbe} dans {len(journal['fichiers'])} fichier(s)")
    for nom in sorted(journal["fichiers"]):
        print(f"    {nom:26} {journal['fichiers'][nom]:2} carte(s)")
    if journal["deja"]:
        print(f"  {len(journal['deja'])} déjà en place à l'identique "
              f"(script idempotent, aucun doublon)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
