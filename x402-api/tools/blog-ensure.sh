#!/bin/bash
# blog-ensure.sh v2 - auto-reparation blog depuis l'HISTOIRE GIT LOCALE
# (v1 a prouve que origin/main n'a que 4 fichiers: RESTORED_FROM_GIT=0).
# Pour chaque episode 1..10: dernier commit local touchant ce chemin -> git show.
set -u
cd "$(dirname "$0")/.." || exit 1
RESTORED=0
for i in $(seq 1 10); do
  EXISTS=$(ls public/blog/episode-${i}-*.md 2>/dev/null | head -1)
  [ -n "$EXISTS" ] && continue
  C=$(git rev-list -1 --all -- "public/blog/episode-${i}-*.md" 2>/dev/null)
  [ -z "$C" ] && continue
  P=$(git ls-tree --name-only "$C" public/blog/ | grep "episode-${i}-" | head -1)
  [ -z "$P" ] && continue
  mkdir -p "$(dirname "$P")"; git show "$C:$P" > "$P" && RESTORED=$((RESTORED+1))
done
bash tools/gen-blog-index.sh >/dev/null 2>&1
bash tools/gen-blog-feed.sh  >/dev/null 2>&1
sleep 1
echo "RESTORED_FROM_LOCAL_HISTORY=$RESTORED"
bash tools/selftest.sh
