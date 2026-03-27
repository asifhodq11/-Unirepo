#!/bin/bash
# ReplyIQ Monorepo Build Script

# 1. Build Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Build Backend
echo "Building Backend..."
pip install -r requirements.txt

echo "Build Complete!"
