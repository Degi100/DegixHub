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
  if [ -d "public" ] && [ ! -d ".next/standalone/apps/web/public" ]; then
    cp -r public .next/standalone/apps/web/
  fi
  cd .next/standalone/apps/web
  PORT=3002 HOSTNAME=0.0.0.0 node server.js &
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

# Debug: Show what ports are actually listening
sleep 5  # Give services time to start
echo "=== Port Status ==="
netstat -tlnp 2>/dev/null | grep -E ":(3002|3003)" || ss -tlnp | grep -E ":(3002|3003)" || echo "Cannot check ports"
echo "=== Environment Check ==="
echo "PORT=$PORT"
echo "HOSTNAME=$HOSTNAME"
echo "NODE_ENV=$NODE_ENV"
echo "=== Testing Services ==="
curl -I http://localhost:3002 2>/dev/null | head -3 || echo "Frontend not responding on 3002"
curl http://localhost:3003 2>/dev/null | head -3 || echo "API not responding on 3003"
echo "=== Container Network ==="
hostname -I 2>/dev/null || echo "Cannot get IP"
echo "=== Listening Ports ==="
netstat -tln 2>/dev/null || lsof -i -P -n 2>/dev/null | grep LISTEN || echo "Cannot check listening ports"
echo "=== Coolify/Docker Info ==="
echo "Container ID: $(hostname)"
echo "All ENV vars with PORT or URL:"
env | grep -E "(PORT|URL|HOST)" || echo "No relevant env vars"
echo "==================="

# Wait for both processes
wait $API_PID $WEB_PID