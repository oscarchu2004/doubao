#!/bin/bash
set -e

# Production Deployment Script for Shome Projects

echo "Starting deployment..."

cd /home/shome/ng-shomehow

# Stop existing processes
echo "Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Kill any processes that might be using the ports
echo "Cleaning up ports 8081 and 8082..."
sudo fuser -k 8081/tcp || true
sudo fuser -k 8082/tcp || true
sleep 5

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --production

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm ci --production

# Start backend
echo "Starting backend on port 8082..."
cd ../backend
pm2 start npm --name "backend" -- start
sleep 10

# Verify backend is running
if ss -tuln | grep -q ":8082 "; then
  echo "Backend started successfully on port 8082"
else
  echo "Backend failed to start on port 8082"
  pm2 logs backend --lines 20
  exit 1
fi

# Start frontend
echo "Starting frontend on port 8081..."
cd ../frontend
npm install serve --save-dev
pm2 start "npx serve -s dist -l 8081" --name "frontend"
sleep 15

# Verify frontend is running
if ss -tuln | grep -q ":8081 "; then
  echo "Frontend started successfully on port 8081"
else
  echo "Frontend failed to start on port 8081"
  echo "Checking frontend logs..."
  pm2 logs frontend --lines 20
  echo "Checking what's running on ports 808x..."
  ss -tuln | grep ":808"
  exit 1
fi

# Finalize
pm2 save
echo "Deployment completed successfully!"
pm2 status
