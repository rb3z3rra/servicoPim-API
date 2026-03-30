FROM node:20-alpine 

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 9090

CMD ["npm", "run", "dev"]