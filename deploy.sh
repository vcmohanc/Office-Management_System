#!/bin/bash
set -e

echo "Creating docker-compose.yml..."
cat << 'EOF' > docker-compose.yml
services:
  client:
    image: mohanc35/oms-client
    ports:
      - "80:80"
    depends_on:
      - server

  server:
    image: mohanc35/oms-server
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://admin:SuperSecretStrongPassword123!@mongo:27017/office_manage_system?authSource=admin
      - JWT_SECRET=your_super_secret_jwt_key
      - CLIENT_URL=http://oms.vegecoop.net
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: SuperSecretStrongPassword123!
      MONGO_INITDB_DATABASE: office_manage_system
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    ports:
      - "127.0.0.1:27017:27017"

volumes:
  mongo_data:
  mongo_config:
  uploads_data:
EOF

echo "Pulling latest images..."
sudo docker compose pull

echo "Stopping old containers..."
sudo docker compose down

echo "Starting application..."
sudo docker compose up -d

echo "Waiting for services to start..."
sleep 5

echo "Deployment complete!"
sudo docker compose ps
sudo docker logs $(sudo docker compose ps -q server) --tail 20
