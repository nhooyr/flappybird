#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
npx prettier@2.8.4 \
  --print-width=90 \
  --single-quote \
  --arrow-parens=avoid \
  --no-bracket-spacing \
  --write .
