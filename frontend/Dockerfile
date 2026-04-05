FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package.json
RUN npm install
COPY . .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build
FROM nginx:1.27-alpine
ENV PORT=80
ENV UPSTREAM_API_SCHEME=http
ENV UPSTREAM_API_HOSTPORT=backend:8000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
