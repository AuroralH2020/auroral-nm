# docker pull gizmotronic/openfire:4.4.4
docker volume create openfire
docker run --name openfire -d --restart=always \
  --publish 9090:9090 --publish 5222:5222 --publish 7777:7777 \
  --volume openfire:/var/lib/openfire \
  gizmotronic/openfire:4.4.4

  # User: admin (regardless the mail used on setup)
  # Password: password