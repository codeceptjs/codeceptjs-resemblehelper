FROM node:lts-slim

RUN  \
    apt-get update \
    && apt-get install -y python3 make g++ python build-essential libcairo2-dev

# Copy app
COPY . /home/node/app/

WORKDIR /home/node/app/

# Download the dependecies
RUN npm install

CMD /bin/bash -c "npm run conf:prepareBaseImage_undefined; npm run conf:prepareBaseImage_true; npm run conf:prepareBaseImage_false"
