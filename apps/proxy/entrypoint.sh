#!/bin/sh

echo "Welcome to DoggoPaste!"

echo "Generating migrations..."
pnpm --filter api run db:generate

echo "Running migrations..."
pnpm --filter api run db:migrate

# Start the API with PM2
echo "Starting with PM2 Runtime..."
pm2-runtime start apps/proxy/build/index.js --name doggopaste_proxy
echo "DoggoPaste has started successfully!"