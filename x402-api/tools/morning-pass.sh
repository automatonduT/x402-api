#!/bin/bash
# morning-pass.sh v1 - UNE passe de reveil unique: toutes les sentinelles en UN exec
# sortie attribuable uniquement; aucun appel reseau superflu; verdict genese en fin
set -u
cd "$(dirname "$0")/.." || exit 1
echo "== MORNING PASS $(date -u +%FT%TZ) =="
bash tools/watch-responses.sh 2>&1 | tail -6
bash tools/pr-watch.sh
bash tools/source-attribution.sh
echo "== FIN MORNING PASS =="
