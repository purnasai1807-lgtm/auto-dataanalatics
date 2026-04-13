FROM node:20-alpine
WORKDIR /app
COPY insightforge-api/package*.json ./
RUN npm ci --omit=dev
COPY insightforge-api/src ./src
COPY insightforge-api/scripts ./scripts
COPY insightforge-api/sample-data ./sample-data
EXPOSE 4000
CMD ["npm", "start"]
