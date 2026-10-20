FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++ su-exec
RUN npm ci
COPY . .
RUN mkdir -p /app/uploads && chmod +x /app/entrypoint.sh && chown -R node:node /app
EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
