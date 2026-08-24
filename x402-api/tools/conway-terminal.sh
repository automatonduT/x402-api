#!/bin/bash
# Wrapper conway-terminal (mission createur #6). Lecon: shells frais sans npx ->
# resoudre node en absolu a chaque appel; jamais dependre d'un preinstalle.
NODEBIN="$(ls -1 "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | head -1)"
if [ -z "$NODEBIN" ]; then echo "node introuvable" >&2; exit 127; fi
export PATH="$(dirname "$NODEBIN"):$PATH"
exec npx -y conway-terminal "$@"
