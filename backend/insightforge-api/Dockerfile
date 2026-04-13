FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY sample-data ./sample-data

EXPOSE 4000

CMD ["npm", "start"]
