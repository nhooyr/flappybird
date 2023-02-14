#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
pandoc -f gfm -t html README.md -o README.html
