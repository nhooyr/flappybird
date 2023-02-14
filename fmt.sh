#!/bin/sh
set -eu

npx prettier@2.8.4 \
  --print-width=90 \
  --single-quote \
  --arrow-parens=avoid \
  --no-bracket-spacing \
  --write .
