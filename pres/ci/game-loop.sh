#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
d2 --theme 1 --sketch "$@" game-loop.d2
