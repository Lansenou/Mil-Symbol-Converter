#!/usr/bin/env bash
# Fetch the pinned upstream datasets used by scripts/build-data.mjs into .sources/.
# The raw upstream files are not committed; only the derived tables in src/data/ are.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .sources

# Upstream commits are pinned in scripts/sources.json (updated by .github/workflows/data-update.yml).
pin() { node -p "require('./scripts/sources.json')['$1'].$2"; }

fetch() {
  local name="$1" url="$2" sha="$3"; shift 3
  if [ ! -d ".sources/$name/.git" ]; then
    git clone --filter=blob:none --no-checkout "$url" ".sources/$name"
  fi
  git -C ".sources/$name" sparse-checkout set --no-cone "$@"
  git -C ".sources/$name" fetch --depth 1 origin "$sha"
  git -C ".sources/$name" checkout --quiet "$sha"
}

# Esri Joint Military Symbology XML (Apache-2.0): MIL-STD-2525D catalog + 2525C legacy mappings.
fetch jmsml "$(pin jmsml url)" "$(pin jmsml commit)" '/instance/*.xml' '/license.txt'

# US Army C5ISR mil-sym-ts renderer (Apache-2.0): 2525C->2525Dch1 table and per-edition catalogs.
fetch mil-sym-ts "$(pin mil-sym-ts url)" "$(pin mil-sym-ts commit)" \
  '/src/main/ts/armyc2/c5isr/data/c2d.json' '/src/main/ts/armyc2/c5isr/data/msd.json' \
  '/src/main/ts/armyc2/c5isr/data/mse.json' '/src/main/ts/armyc2/c5isr/data/smd.json' \
  '/src/main/ts/armyc2/c5isr/data/sme.json' '/LICENSE'

# MIL-STD-2525C (17 Nov 2008, Distribution A: approved for public release) and MIL-STD-2525D
# (10 Jun 2014). Used to extract the normative 2525C SIDC catalog and for manual fixture review.
mkdir -p .sources/standards
fetch_pdf() {
  local out="$1" url="$2" sha="$3"
  if [ ! -f "$out" ]; then curl -sSL -o "$out" "$url"; fi
  echo "$sha  $out" | sha256sum -c -
}
fetch_pdf .sources/standards/MIL-STD-2525C.pdf http://www.mapsymbs.com/ms2525c.pdf \
  701a34c9476a7a1e9957329f8a01bb7ec1cc83f3a994509a9dbc266960f0c612
fetch_pdf .sources/standards/MIL-STD-2525D.pdf http://www.mapsymbs.com/MilStd2525D.pdf \
  07ef84eaf286205c98714fae3373b786dfbac1219443118618ac3c69073883ce
pdftotext -layout .sources/standards/MIL-STD-2525C.pdf .sources/standards/MIL-STD-2525C.txt
pdftotext -layout .sources/standards/MIL-STD-2525D.pdf .sources/standards/MIL-STD-2525D.txt
echo "Sources ready in .sources/"
