![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/AuroralH2020/auroral-nm)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/AuroralH2020/auroral-nm)
![GitHub issues](https://img.shields.io/github/issues-raw/AuroralH2020/auroral-nm)
![GitHub](https://img.shields.io/github/license/AuroralH2020/auroral-nm)
[![Quality Gate Status](https://sonar.bavenir.eu/api/project_badges/measure?project=auroral-nm&metric=alert_status&token=squ_ddd71bdedfee1b2500a0215b5153c46b4a9a5d7d)](https://sonar.bavenir.eu/dashboard?id=auroral-nm)

# AURORAL NEIGHBOURHOOD MANAGER SERVER #

This README documents the business layer app of the AURORAL platform, which is funded by European Union’s Horizon 2020 Framework Programme for Research and Innovation under grant agreement no 101016854 AURORAL.

### Dependencies ###

AURORAL Neighbourhood Manager server depends on an instance of XMPP server (Openfire) and uses as persistance layer MongoDB.

### Deployment ###

Docker is the preferred deployment method, it is possible to run with Node locally.

1. Update your .env configuration file
2. Run your XMPP server and Mongo database
3. Building an image:
    docker build --tag {image_name} -f Dockerfile .
4. Run image
    docker run -p 4000:4000 --name {container_name} {image_name}

### Who do I talk to? ###

Developed by bAvenir

* jorge.almela@bavenir.eu
* peter.drahovsky@bavenir.eu