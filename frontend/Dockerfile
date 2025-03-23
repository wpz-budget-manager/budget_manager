# Frontend: React
FROM node:18

WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm install

COPY . .
CMD ["npm", "start"]