#!/bin/bash

# Deploy latest changes on server
# Access using SSH key

## Variables
SERVER=auroral.dev.bavenir.eu
USER=jorge
CONN=${USER}@${SERVER}
FOLDER='/opt/auroral_dev_cloud'
APP='registry.bavenir.eu/auroral_nm_api' # Container to be reloaded

## Steps
echo "--- Accessing server ${SERVER} and restarting Docker infrastructure"
ssh ${CONN} "cd ${FOLDER} && docker-compose -f docker-compose-cloud.yml down"
IMG_ID=$(ssh ${CONN} "docker images | grep ${APP} | awk '{ print \$3 }'") # Get image ID
echo "--- Removing image ${APP} with ID ${IMG_ID}"
ssh ${CONN} "docker rmi ${IMG_ID}"
echo "--- Containers restarting ..."
ssh ${CONN} "cd ${FOLDER} && docker-compose -f docker-compose-cloud.yml up -d"
sleep 15 # Give some time so containers are fully running
echo "--- Checking logs to validate success"
ssh ${CONN} "docker ps"
ssh ${CONN} "cd ${FOLDER} && docker logs vicinity-api-one"
ssh ${CONN} "cd ${FOLDER} && docker logs vicinity-api-two"
echo "--- End of the process. Bye!"
