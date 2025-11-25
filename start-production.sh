#!/bin/bash
# Production start script that ensures API runs from source

echo "Starting production services..."

# Make absolutely sure no dist folder exists
rm -rf /app/apps/api/dist

# Start API directly with Bun
cd /app/apps/api
bun src/index.ts &
API_PID=$!

# Start Web with Next.js
cd /app/apps/web
npm run start &
WEB_PID=$!

# Wait for both processes
wait $API_PID $WEB_PID