#!/bin/sh

echo "Waiting for services to be ready..."

# Wait for the database to be ready
until pg_isready -h doggopaste_db_prod -p 5432 -U doggo; do
  echo "Waiting for database..."
  sleep 2
done

# Migrate the database
echo "Migrating database..."
pnpm --filter api run db:push

# Start the API with PM2
echo "Starting with PM2 Runtime..."
pm2-runtime start apps/proxy/build/index.js --name doggopaste_proxy
echo "DoggoPaste has started successfully!"