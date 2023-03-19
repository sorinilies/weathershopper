FROM cypress/base:14.16.0

WORKDIR /app

COPY . .

RUN npm install

CMD ["npm", "run", "cypress:run"]