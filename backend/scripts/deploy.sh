#!/bin/bash

# TradeBitco.in Deployment Script

set -e

echo "🚀 Starting TradeBitco.in deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Build and deploy based on environment
if [ "$NODE_ENV" = "production" ]; then
    echo "📦 Building for production..."
    
    # Install dependencies
    npm ci --only=production
    
    # Run database migrations
    npm run migrate
    
    # Build Docker images
    docker-compose -f docker-compose.prod.yml build
    
    # Deploy with zero downtime
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "✅ Production deployment completed!"
    
elif [ "$NODE_ENV" = "staging" ]; then
    echo "🧪 Deploying to staging..."
    
    # Install all dependencies (including dev)
    npm install
    
    # Run tests
    npm test
    
    # Run migrations
    npm run migrate
    
    # Start staging environment
    docker-compose -f docker-compose.staging.yml up -d
    
    echo "✅ Staging deployment completed!"
    
else
    echo "🔧 Starting development environment..."
    
    # Install all dependencies
    npm install
    
    # Start development environment
    docker-compose up -d
    
    # Run migrations
    npm run migrate
    
    echo "✅ Development environment ready!"
fi

# Health check
echo "🏥 Running health checks..."
sleep 10

if curl -f http://localhost:5000/health; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"