FROM node:8.1.2-slim
WORKDIR /opt/momoweb/src/push

ADD package.json /tmp/package.json

RUN cd /tmp/ && npm install -g

VOLUME ["/opt/momoweb/", ]

EXPOSE 9010

CMD ["node", "worker.js"]