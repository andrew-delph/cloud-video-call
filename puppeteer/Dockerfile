from yarmak/hola-proxy:latest AS proxy

from ubuntu:latest

RUN apt update
RUN apt install openvpn easy-rsa curl netcat net-tools iputils-ping dnsutils tcpdump -y

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

RUN apt-get install -y fonts-liberation gconf-service libappindicator1 libasound2 libatk1.0-0 libcairo2 libcups2 libfontconfig1 libgbm-dev libgdk-pixbuf2.0-0 libgtk-3-0 libicu-dev libjpeg-dev libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libpng-dev libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils

WORKDIR /app
COPY *.json ./
RUN npm install

COPY src src
RUN npx tsc
ENV DOCKER="true"

COPY --from=proxy / /proxy
COPY ./pia-openvpn /pia-openvpn
COPY ./startup.sh /entry/run.sh
COPY ./input.mjpeg /app/input.mjpeg

CMD ["/entry/run.sh"]