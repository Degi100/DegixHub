#!/bin/bash
# Start script for API - runs source directly with Bun
echo "Starting API server with Bun..."
cd /app/apps/api
bun src/index.ts