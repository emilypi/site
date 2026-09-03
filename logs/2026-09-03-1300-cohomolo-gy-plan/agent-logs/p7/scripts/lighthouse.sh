#!/bin/zsh
# chrome-launcher shells out to mktemp, so keep the system tools on PATH.
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
# Section 7: Lighthouse desktop + mobile for the homepage and the article page.
# Uses Playwright's Chromium so no system Chrome is required.
NODE=$(command -v node)
TD="${QA_TOOLS:-/tmp/qa-tools}"
OUT=/Users/emilypillmore/haskell/site/logs/2026-09-03-1300-cohomolo-gy-plan/agent-logs/p7/lighthouse
mkdir -p "$OUT"
export CHROME_PATH=$("$NODE" -e "console.log(require('$TD/node_modules/playwright').chromium.executablePath())")
echo "CHROME_PATH=$CHROME_PATH"
for spec in "home:/" "kitchen-sink:/posts/kitchen-sink/"; do
  name=${spec%%:*}
  path=${spec#*:}
  for preset in desktop mobile; do
    echo "--- $name $preset"
    if [ "$preset" = "desktop" ]; then
      "$NODE" "$TD/node_modules/lighthouse/cli/index.js" "http://127.0.0.1:4321$path" --preset=desktop --quiet --output=json --output-path="$OUT/$name-$preset.json" --chrome-flags="--headless=new --no-sandbox" || echo "FAILED $name $preset"
    else
      "$NODE" "$TD/node_modules/lighthouse/cli/index.js" "http://127.0.0.1:4321$path" --quiet --output=json --output-path="$OUT/$name-$preset.json" --chrome-flags="--headless=new --no-sandbox" || echo "FAILED $name $preset"
    fi
  done
done
echo done
