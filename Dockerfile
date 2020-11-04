#Set the Node version
FROM node:10

WORKDIR /var/app/

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "tools/server/server.js"]
