#!/bin/sh
set -eu

cd -- "$(dirname "$0")/.."
convert favicon.jpg -define icon:auto-resize=256,64,48,32,16 favicon.ico
