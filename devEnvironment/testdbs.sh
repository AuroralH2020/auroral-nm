docker volume create auroralmongo
docker volume create openfire
docker run -d --rm -p 27017:27017 -v auroralmongo:/data/db mongo
# docker run -d --publish 9090:9090 --publish 5222:5222 -v openfire:/var/lib/openfire gizmotronic/openfire:4.4.4
docker run -d --rm --publish 9090:9090 --publish 5222:5222 -v openfire:/var/lib/openfire fishbowler/openfire:v4.7.0
docker run -d --rm --publish 6379:6379 redis:6.2.6-alpine