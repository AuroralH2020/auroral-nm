docker volume create auroralmongo
docker run -d -p 27017:27017 -v auroralmongo:/data/db --name mongo mongo:latest