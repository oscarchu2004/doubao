#!/bin/bash
set -e

# Development Deployment Script for Shome Projects

echo "Starting deployment..."

cd /home/shome/ng-shomehow

echo "Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Kill any processes that might be using our ports
echo "Cleaning up ports 8091 and 8092..."
sudo fuser -k 8091/tcp || true
sudo fuser -k 8092/tcp || true
sleep 5

# -------------------------------
# Backend
# -------------------------------
echo "Installing backend-dev dependencies..."
cd backend-dev && npm ci --production

echo "Starting backend-dev on port 8092..."
pm2 start npm --name "backend-dev" -- start
sleep 10

# Verify backend-dev is running
if ss -tuln | grep -q ":8092 "; then
  echo "Backend-dev started successfully on port 8092"
else
  echo "Backend-dev failed to start on port 8092"
  pm2 logs backend-dev --lines 20
  exit 1
fi

# -------------------------------
# Frontend
# -------------------------------
echo "Installing frontend-dev dependencies..."
cd ../frontend-dev
npm ci       # installs devDependencies too so Vite is available

echo "Building frontend-dev..."
npm run build

echo "Starting frontend-dev on port 8091..."
# Install serve locally if needed
npm install serve --save-dev
pm2 start "npx serve -s dist -l 8091" --name "frontend-dev"
sleep 15

# Verify frontend-dev is running
if ss -tuln | grep -q ":8091 "; then
  echo "Frontend-dev started successfully on port 8091"
else
  echo "Frontend-dev failed to start on port 8091"
  pm2 logs frontend-dev --lines 20
  ss -tuln | grep ":809"
  exit 1
fi

pm2 save
echo "Deployment completed successfully!"
pm2 status
