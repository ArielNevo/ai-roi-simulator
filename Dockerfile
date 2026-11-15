# Build the client, then serve client + API from one Node process.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/types ./src/types
COPY src/data ./src/data
COPY src/finance ./src/finance
EXPOSE 3001
CMD ["npx", "tsx", "server/index.ts"]
