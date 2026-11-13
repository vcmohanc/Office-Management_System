FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++
RUN npm ci --omit=dev

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache su-exec
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/uploads && chmod +x /app/entrypoint.sh && chown -R node:node /app
EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
