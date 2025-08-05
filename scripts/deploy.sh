#!/bin/bash

# CollabNest Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${GREEN}🚀 Starting CollabNest Production Deployment${NC}"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE file not found!${NC}"
    echo -e "${YELLOW}Please copy env.example to .env and configure your environment variables.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=(
    "MONGO_ROOT_USERNAME"
    "MONGO_ROOT_PASSWORD"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "EMAIL_USER"
    "EMAIL_PASS"
    "DOMAIN"
    "SSL_EMAIL"
)

echo -e "${YELLOW}🔍 Validating environment variables...${NC}"
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p ssl

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE down --remove-orphans

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE pull

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}🏥 Checking service health...${NC}"
if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "unhealthy"; then
    echo -e "${RED}❌ Some services are unhealthy. Check logs:${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE logs
    exit 1
fi

echo -e "${GREEN}✅ All services are healthy!${NC}"

# Setup SSL certificates (first time only)
if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
    echo -e "${YELLOW}🔒 Setting up SSL certificates...${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE run --rm certbot
fi

# Restart nginx to load SSL certificates
echo -e "${YELLOW}🔄 Restarting nginx to load SSL certificates...${NC}"
docker-compose -f $DOCKER_COMPOSE_FILE restart nginx

# Final health check
echo -e "${YELLOW}🔍 Final health check...${NC}"
sleep 10

if curl -f -s "https://$DOMAIN" > /dev/null; then
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Your application is available at: https://$DOMAIN${NC}"
    echo -e "${GREEN}🔌 API is available at: https://api.$DOMAIN${NC}"
else
    echo -e "${RED}❌ Health check failed. Please check the logs:${NC}"
    docker-compose -f $DOCKER_COMPOSE_FILE logs nginx
    exit 1
fi

echo -e "${GREEN}✨ Deployment completed successfully!${NC}" 