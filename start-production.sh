#!/bin/bash
# Production start script that ensures API runs from source

echo "Starting production services..."

# Make absolutely sure no dist folder exists
rm -rf /app/apps/api/dist

# Set custom ports and environment
export PORT=3003  # API port
export NODE_ENV=${NODE_ENV:-production}  # Default to production if not set

# Start API directly with Bun on port 3003
cd /app/apps/api
echo "Starting API on port 3003..."
PORT=3003 bun src/index.ts &
API_PID=$!

# Start Web with Next.js on port 3002
cd /app/apps/web

# Check for different standalone locations
if [ -f ".next/standalone/apps/web/server.js" ]; then
  echo "Starting Next.js standalone server on port 3002..."
  echo "Checking for static files..."
  ls -la .next/standalone/apps/web/.next/ 2>/dev/null | head -5 || echo "No .next dir in standalone"

  # In monorepo, static files should be at the root level
  if [ ! -d ".next/standalone/apps/web/.next/static" ] && [ -d ".next/static" ]; then
    echo "Copying static files to standalone directory..."
    mkdir -p .next/standalone/apps/web/.next
    cp -r .next/static .next/standalone/apps/web/.next/
  fi

  # Copy public directory
  if [ -d "public" ] && [ ! -d ".next/standalone/apps/web/public" ]; then
    echo "Copying public directory..."
    cp -r public .next/standalone/apps/web/
  fi

  # CRITICAL: Copy app directory with API routes
  if [ -d "app" ] && [ ! -d ".next/standalone/apps/web/app" ]; then
    echo "Copying app directory (including API routes)..."
    cp -r app .next/standalone/apps/web/
  fi

  echo "Checking if API routes exist in standalone:"
  ls -la .next/standalone/apps/web/app/api/ 2>/dev/null || echo "WARNING: No API routes found in standalone!"

  cd .next/standalone/apps/web
  PORT=3002 HOSTNAME=0.0.0.0 API_URL=http://localhost:3003 node server.js &
elif [ -f ".next/standalone/server.js" ]; then
  echo "Starting Next.js standalone server on port 3002..."
  cd .next/standalone
  PORT=3002 HOSTNAME=0.0.0.0 node server.js &
elif [ -d ".next" ]; then
  echo "Warning: No standalone build found, falling back to regular start..."
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
