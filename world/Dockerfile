FROM node:22-bookworm-slim
WORKDIR /app
COPY schedule-service/package.json ./schedule-service/package.json
COPY schedule-service/server.mjs schedule-service/providers.mjs schedule-service/live-server.mjs ./schedule-service/
COPY gameplay/rail-stations.mjs ./gameplay/rail-stations.mjs
ENV NODE_ENV=production
ENV PORT=8080
USER node
EXPOSE 8080
CMD ["node","schedule-service/live-server.mjs"]
