#!/bin/bash
# Script zum Prüfen der Port-Konfiguration auf dem Server

echo "=== Checking Port 3003 Configuration ==="
echo ""

echo "1. UFW Status:"
sudo ufw status | grep 3003

echo ""
echo "2. IPTables Rules:"
sudo iptables -L -n | grep 3003

echo ""
echo "3. Listening Ports:"
sudo netstat -tlnp | grep 3003 || sudo ss -tlnp | grep 3003

echo ""
echo "4. Docker Container Ports:"
sudo docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E "(3002|3003)"

echo ""
echo "5. Testing from inside container:"
# Finde den Container
CONTAINER=$(sudo docker ps | grep -E "(degixhub|3002)" | awk '{print $1}' | head -1)
if [ ! -z "$CONTAINER" ]; then
    echo "Container ID: $CONTAINER"
    sudo docker exec $CONTAINER curl -I http://localhost:3003 2>&1 | head -3
else
    echo "Container not found"
fi

echo ""
echo "6. Testing from host:"
curl -I http://localhost:3003 2>&1 | head -3

echo ""
echo "7. Container network inspection:"
if [ ! -z "$CONTAINER" ]; then
    sudo docker inspect $CONTAINER | grep -A 10 "Ports"
fi