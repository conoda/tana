#!/bin/bash
set -e

echo "Setting up Tana Playground..."

echo "Copying TypeScript compiler..."
cp ../typescript.js public/js/typescript.js

echo "Setup complete!"
echo "Run 'npm run dev' to start the development server."
