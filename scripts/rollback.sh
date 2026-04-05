#!/bin/sh

set -eu

if [ "${1:-}" = "" ]; then
  echo "Usage: ./scripts/rollback.sh <image-tag>"
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

"$SCRIPT_DIR/deploy.sh" "$1"
