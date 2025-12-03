#!/bin/bash

# Script untuk setup ngrok untuk Xendit webhook development

echo "🚀 Setting up ngrok for Xendit webhook..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo "📥 Please install ngrok:"
    echo "   - Download from: https://ngrok.com/download"
    echo "   - Or install via npm: npm install -g ngrok"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""
echo "🌐 Starting ngrok tunnel on port 3000..."
echo ""

# Start ngrok
ngrok http 3000

# Note: User needs to manually copy the ngrok URL and update:
# 1. Xendit webhook URL in dashboard
# 2. NEXT_PUBLIC_BASE_URL in .env file

