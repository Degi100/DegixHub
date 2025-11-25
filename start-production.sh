#!/bin/bash
# Production start script that ensures API runs from source

echo "Starting production services..."

# Make absolutely sure no dist folder exists
rm -rf /app/apps/api/dist

# Set custom ports
export PORT=3003  # API port

# Start API directly with Bun on port 3003
cd /app/apps/api
echo "Starting API on port 3003..."
PORT=3003 bun src/index.ts &
API_PID=$!

# Start Web with Next.js on port 3002
cd /app/apps/web

# Check for standalone build
if [ -f ".next/standalone/server.js" ]; then
  echo "Found standalone server.js - starting Next.js standalone on port 3002..."
  cd .next/standalone
  PORT=3002 HOSTNAME=0.0.0.0 node server.js &
elif [ -d ".next" ]; then
  echo "No standalone build found, using regular Next.js start on port 3002..."
  # Use pnpm to run next start (already configured with port 3002 in package.json)
  if [ -f "package.json" ]; then
    if command -v pnpm &> /dev/null; then
      pnpm start &
    else
      npm run start &
    fi
  else
    echo "ERROR: No package.json found!"
    exit 1
  fi
else
  echo "ERROR: No .next build directory found!"
  exit 1
fi
WEB_PID=$!

echo "Services started - API PID: $API_PID, Web PID: $WEB_PID"

# Wait for both processes
wait $API_PID $WEB_PID