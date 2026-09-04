#!/bin/bash
set -e

echo "Installing docker-compose..."
sudo apt-get update -y
sudo apt-get install -y docker-compose docker-compose-plugin

echo "Creating docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  client:
    image: mohanc35/oms-client
    ports:
      - "80:80"
    depends_on:
      - server
    environment:
      - VITE_API_URL=http://13.196.191.114:5000

  server:
    image: mohanc35/oms-server
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongo:27017/office_manage_system
      - JWT_SECRET=your_super_secret_jwt_key
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
EOF

echo "Pulling images..."
sudo docker-compose pull

echo "Starting application..."
sudo docker-compose up -d

echo "Deployment successful!"
