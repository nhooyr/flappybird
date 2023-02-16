#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
d2 --theme 1 --sketch "$@" game-loop.d2 game-loop.svg
if [ "$#" -eq 0 ]; then
  d2 --theme 1 --sketch "$@" game-loop.d2 game-loop.png
fi
