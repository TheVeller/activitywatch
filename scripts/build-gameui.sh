#!/bin/bash
# Build script for aw-gameui integration

set -e

echo "Building aw-gameui..."

cd "$(dirname "$0")/.."

# Check if aw-gameui exists
if [ ! -d "aw-gameui" ]; then
    echo "Error: aw-gameui directory not found"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "aw-gameui/node_modules" ]; then
    echo "Installing dependencies..."
    cd aw-gameui
    npm install
    cd ..
fi

# Build
echo "Building..."
cd aw-gameui
npm run build
cd ..

# Copy to aw-server if it exists
if [ -d "aw-server/aw_server/static" ]; then
    echo "Copying to aw-server..."
    mkdir -p aw-server/aw_server/static/gameui
    cp -r aw-gameui/dist/* aw-server/aw_server/static/gameui/
    echo "✓ Build complete and copied to aw-server"
else
    echo "⚠ Warning: aw-server submodule not found. Build output is in aw-gameui/dist/"
    echo "  To integrate, initialize submodules and run this script again."
fi
