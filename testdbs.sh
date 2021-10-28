docker run -d -p 27017:27017 -v auroralmongo:/data/db mongo
docker run -d --publish 9090:9090 --publish 5222:5222 -v openfire:/var/lib/openfire gizmotronic/openfire:4.4.4