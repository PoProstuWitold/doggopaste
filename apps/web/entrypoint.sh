#!/bin/sh

# Start the Web with PM2
echo "Starting with PM2 Runtime..."
pm2-runtime start apps/web/server.js --name doggopaste_web
echo "Started DoggoPaste Web"
