#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
COMPOSE_FILE="$ROOT_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"
IMAGE_TAG_INPUT="${1:-${IMAGE_TAG:-main}}"
IMAGE_NAME_INPUT="${IMAGE_NAME:-}"
APP_PORT_INPUT="${APP_PORT:-6789}"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing docker-compose.prod.yml"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing .env in $ROOT_DIR"
  exit 1
fi

if [ -z "$IMAGE_NAME_INPUT" ]; then
  echo "Missing IMAGE_NAME in .env"
  exit 1
fi

mkdir -p "$ROOT_DIR/storage/uploads"

export IMAGE_NAME="$IMAGE_NAME_INPUT"
export IMAGE_TAG="$IMAGE_TAG_INPUT"
export APP_PORT="$APP_PORT_INPUT"

cd "$ROOT_DIR"

echo "Validating compose configuration"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Pulling image $IMAGE_NAME:$IMAGE_TAG"
docker compose -f "$COMPOSE_FILE" pull app

echo "Applying Prisma schema"
docker compose -f "$COMPOSE_FILE" run --rm --no-deps app node node_modules/prisma/build/index.js db push --schema prisma/schema.prisma

echo "Starting OmniDrop"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

ATTEMPT=0
until docker compose -f "$COMPOSE_FILE" exec -T app node -e "fetch('http://127.0.0.1:3000/api/v1/settings').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
do
  ATTEMPT=$((ATTEMPT + 1))

  if [ "$ATTEMPT" -ge 30 ]; then
    echo "Health check failed after $ATTEMPT attempts"
    exit 1
  fi

  sleep 2
done

echo "OmniDrop deployed successfully with image tag $IMAGE_TAG"
