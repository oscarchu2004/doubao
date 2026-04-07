#!/bin/bash
set -e

# Unified Deployment Script for Shome Projects

echo "Starting deployment..."

PROJECT_ROOT="/home/shome/ng-shomehow"


# Stop all running processes

echo "Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Clean up all used ports
echo "Cleaning up ports 8081, 8082, 8091, 8092..."
for port in 8081 8082 8091 8092; do
  sudo fuser -k "${port}/tcp" || true
done
sleep 5


# Deploy backend-dev/frontend-dev (ports 8092/8091)

echo "Deploying backend-dev/fronten-devg..."

# Backend-dev
echo "Installing backend-dev dependencies..."
cd "$PROJECT_ROOT/backend-dev"
npm ci --production

echo "Starting backend-dev on port 8092..."
pm2 start npm --name "backend-dev" -- start
sleep 10

if ss -tuln | grep -q ":8092 "; then
  echo "Backend-dev started successfully on port 8092"
else
  echo "Backend-dev failed to start on port 8092"
  pm2 logs backend-dev --lines 20
  exit 1
fi

# Frontend-dev
echo "Installing frontend-dev dependencies..."
cd "$PROJECT_ROOT/frontend-dev"
npm ci --production

echo "Starting frontend-dev on port 8091..."
npm install serve --save-dev
pm2 start "npx serve -s dist -l 8091" --name "frontend-dev"
sleep 15

if ss -tuln | grep -q ":8091 "; then
  echo "Frontend-dev started successfully on port 8091"
else
  echo "Frontend-dev failed to start on port 8091"
  pm2 logs frontend-dev --lines 20
  ss -tuln | grep ":809"
  exit 1
fi


# Deploy backend/frontend (ports 8082/8081)

echo "Deploying backend/frontend..."

# Backend
echo "Installing backend dependencies..."
cd "$PROJECT_ROOT/backend"
npm ci --production

echo "Starting backend on port 8082..."
pm2 start npm --name "backend" -- start
sleep 10

if ss -tuln | grep -q ":8082 "; then
  echo "Backend started successfully on port 8082"
else
  echo "Backend failed to start on port 8082"
  pm2 logs backend --lines 20
  exit 1
fi

# Frontend
echo "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm ci --production

echo "Starting frontend on port 8081..."
npm install serve --save-dev
pm2 start "npx serve -s dist -l 8081" --name "frontend"
sleep 15

if ss -tuln | grep -q ":8081 "; then
  echo "Frontend started successfully on port 8081"
else
  echo "Frontend failed to start on port 8081"
  pm2 logs frontend --lines 20
  ss -tuln | grep ":808"
  exit 1
fi


# Finalize

pm2 save
echo "Deployment completed successfully!"
pm2 status
