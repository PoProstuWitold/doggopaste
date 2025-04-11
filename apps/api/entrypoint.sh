#!/bin/sh

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
pm2-runtime start apps/api/build/src/index.js --name doggopaste_api
echo "Started DoggoPaste API"