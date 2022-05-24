# Yellow Pages scrapper

This project allows you to scrap the french yellow pages.

## Installation
If you dont have a mongoDB running you can setup one from the `docker-compose.yml`
```
    docker-compose up -d
```

Then you need to create a database and a user that can access it, store those infomations into a `.env` file

```
    DB_NAME=your_database
    DB_USER=your_user
    DB_PWD=your_password
```

## Usage
```
    yarn start [keyword] [location]
```

## Tech

- [node.js](https://nodejs.org/en/) - evented I/O for the backend
- [Puppeteer](https://pptr.dev) - HTML

## License

MIT
