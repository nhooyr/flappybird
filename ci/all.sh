#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
set -x
./ci/fmt.sh
./ci/favicon.sh
./pres/ci/game-loop.sh
