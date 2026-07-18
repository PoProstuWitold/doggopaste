#!/bin/sh
set -eu

echo "Welcome to DoggoPaste!"

echo "Applying database migrations..."
(
    cd /app/apps/api
    ./node_modules/.bin/drizzle-kit migrate
)

echo "Starting Proxy..."
exec node /app/apps/proxy/build/index.js