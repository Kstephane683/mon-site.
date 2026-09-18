#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Garde-fou : le bloc SDK du chatbot Mia doit être présent
  1. dans le layout du générateur `preview/_build/compose.py` (source de vérité) ;
  2. dans CHAQUE page HTML déployée à la racine.

POURQUOI : le 18/09/2026, un commit a retiré le bloc SDK de 14 pages sur 16
(le générateur ne l'émettait pas) — le chatbot a disparu du site en production
sans qu'aucun contrôle ne le signale. Ce script est ce contrôle.

USAGE : python3 scripts/verifier-chatbot.py   → code 0 si conforme, 1 sinon.
Il est exécuté par le workflow .github/workflows/verifier-chatbot.yml à chaque
push, et disponible en pre-commit local.
"""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
GENERATEUR = RACINE / "preview" / "_build" / "compose.py"
MARQUEUR_SDK = "eperformance-sdk.js"
MARQUEUR_CONFIG = "window.ePerformanceConfig"

# Pages exclues du contrôle (gabarits, redirections)
EXCLUES = {"preview"}


def pages_deployees():
    return sorted(
        p for p in RACINE.glob("*.html") if p.parent.name not in EXCLUES
    )


def main() -> int:
    erreurs = []

    # 1. Le générateur doit émettre le bloc (sinon toute regénération l'efface)
    if not GENERATEUR.exists():
        erreurs.append(f"générateur introuvable : {GENERATEUR}")
    else:
        source = GENERATEUR.read_text(encoding="utf-8")
        if MARQUEUR_SDK not in source:
            erreurs.append(
                "le layout du GÉNÉRATEUR (preview/_build/compose.py) n'émet pas "
                "le bloc SDK → toute regénération effacera le chatbot"
            )
        # Les accolades doivent être échappées ({{ }}) dans le f-string
        if re.search(r"window\.ePerformanceConfig = \{(\s|\n)", source):
            erreurs.append(
                "accolades NON échappées dans le layout : utiliser {{ }} "
                "(le layout est un f-string)"
            )

    # 2. Chaque page déployée doit porter le bloc
    manquantes = []
    for page in pages_deployees():
        contenu = page.read_text(encoding="utf-8")
        if MARQUEUR_SDK not in contenu or MARQUEUR_CONFIG not in contenu:
            manquantes.append(page.name)

    if manquantes:
        erreurs.append(
            f"{len(manquantes)} page(s) sans bloc SDK : {', '.join(manquantes)}"
        )

    total = len(pages_deployees())
    if erreurs:
        print("❌ CONTRÔLE CHATBOT EN ÉCHEC")
        for e in erreurs:
            print(f"   • {e}")
        print("\n   → Le bloc est injecté par preview/_build/compose.py : "
              "régénérez (python3 preview/_build/compose.py) au lieu de "
              "retirer le bloc des pages.")
        return 1

    # 3. Le document de coordination doit exister (c'est le point de synchro
    #    entre les deux agents — il ne doit jamais disparaître du dépôt)
    coordination = RACINE / "COORDINATION-AGENTS.md"
    if not coordination.exists():
        erreurs.append(
            "COORDINATION-AGENTS.md absent : c'est le point de synchronisation "
            "entre l'agent SITE et l'agent CHATBOT"
        )

    if erreurs:
        print("❌ CONTRÔLE EN ÉCHEC")
        for e in erreurs:
            print(f"   • {e}")
        return 1

    print(f"✅ Contrôle chatbot : {total}/{total} page(s) avec SDK "
          f"+ générateur conforme + coordination en place")
    print()
    print("📋 RAPPEL DE COORDINATION")
    print("   Avant toute tâche : lire COORDINATION-AGENTS.md (sections 1 à 3)")
    print("   Après toute tâche : y consigner une entrée dans le journal partagé")
    print("   → COORDINATION-AGENTS.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
