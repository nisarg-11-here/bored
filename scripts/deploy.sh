#!/bin/bash

echo "🚀 Starting deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Make sure to set environment variables in your deployment platform."
fi

# Run tests
echo "🧪 Running tests..."
npm test -- --passWithNoTests

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Your app is ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push your code to GitHub:"
    echo "   git add ."
    echo "   git commit -m 'Ready for deployment'"
    echo "   git push origin main"
    echo ""
    echo "2. Deploy to Vercel:"
    echo "   - Go to vercel.com"
    echo "   - Import your repository"
    echo "   - Add environment variables:"
    echo "     - MONGODB_URI"
    echo "     - OPENAI_API_KEY"
    echo "   - Deploy!"
    echo ""
    echo "3. Or deploy to other platforms:"
    echo "   - Netlify: Connect GitHub repo"
    echo "   - Railway: Connect GitHub repo"
    echo "   - Render: Connect GitHub repo"
else
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi
