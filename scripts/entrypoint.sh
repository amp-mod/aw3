#!/bin/sh
set -e

node ./migrate.js || echo "Failed to run database migrations!"

exec "$@"