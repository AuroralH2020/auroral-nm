#!/bin/bash
USAGE="$(basename "$0") [ -h ] [ -e env ]
-- Build and publish image to docker registry
-- Flags:
      -h  shows help
      -e  environment [ dev (default), prod, ... ]"

# Default configuration
ENV=dev
REGISTRY=registry.bavenir.eu
IMAGE_NAME=auroral_nm_api

# Get configuration
while getopts 'hd:e:' OPTION; do
case "$OPTION" in
    h)
    echo "$USAGE"
    exit 0
    ;;
    e)
    ENV="$OPTARG"
    ;;
esac
done

echo Build and push image ${IMAGE_NAME} with tag ${ENV}

# Do login
docker login ${REGISTRY}

# Compile dist
tsc

# Multiarch builder
docker buildx use multiplatform

# Build images & push to private registry
docker buildx build --platform linux/amd64 \
                    --tag ${REGISTRY}/${IMAGE_NAME}:${ENV} \
                    --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
                    -f Dockerfile . --push
# Pull local arch version
# docker pull ${REGISTRY}/${IMAGE_NAME}:${ENV}

# Build depending on env
# docker build --tag ${IMAGE_NAME} -f Dockerfile .

# Tag the image
# docker image tag ${IMAGE_NAME} ${REGISTRY}/${IMAGE_NAME}:${ENV}

# Push image
# docker push ${REGISTRY}/${IMAGE_NAME}:${ENV}