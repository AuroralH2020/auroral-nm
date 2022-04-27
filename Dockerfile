FROM node:12-slim as base
EXPOSE 4000
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node
COPY --chown=node:node package*.json tsconfig.json ./
RUN npm ci && npm cache clean --force

FROM base as build
ARG BUILD_DATE
LABEL version="1.0"
LABEL maintaner="jorge.almela@bavenir.eu"
LABEL release-date=$BUILD_DATE
COPY --chown=node:node dist ./dist
CMD ["node", "./dist/src/server.js"]