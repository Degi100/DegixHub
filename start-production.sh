#!/bin/bash
# Production start script that ensures API runs from source

echo "Starting production services..."

# Make absolutely sure no dist folder exists
rm -rf /app/apps/api/dist

# Set custom ports
export PORT=3003  # API port

# Start API directly with Bun on port 3003
cd /app/apps/api
PORT=3003 bun src/index.ts &
API_PID=$!

# Start Web with Next.js on port 3002
cd /app/apps/web
if [ -f ".next/standalone/server.js" ]; then
  PORT=3002 node .next/standalone/server.js &
else
  PORT=3002 npm run start &
fi
WEB_PID=$!

# Wait for both processes
wait $API_PID $WEB_PID