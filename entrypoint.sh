set -e

echo "Executing database migrations..."
node ./migrate.js
exec "$@"