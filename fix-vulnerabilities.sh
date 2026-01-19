#!/bin/bash

# Script to fix npm vulnerabilities
# Run: bash fix-vulnerabilities.sh

echo "🔒 Fixing npm vulnerabilities..."
echo ""

# Step 1: Remove node_modules and package-lock.json
echo "Step 1: Cleaning up old dependencies..."
rm -rf node_modules
rm -f package-lock.json
echo "✅ Cleaned up"

# Step 2: Update npm to latest version
echo ""
echo "Step 2: Updating npm..."
npm install -g npm@latest

# Step 3: Install dependencies
echo ""
echo "Step 3: Installing dependencies..."
npm install

# Step 4: Run audit fix
echo ""
echo "Step 4: Running npm audit fix..."
npm audit fix

# Step 5: Check remaining vulnerabilities
echo ""
echo "Step 5: Checking remaining vulnerabilities..."
npm audit

echo ""
echo "✅ Done! If vulnerabilities remain, check the output above."
echo "💡 For critical vulnerabilities, you may need to run: npm audit fix --force"
echo "⚠️  Warning: --force can break things, so test your app after using it!"
