const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = false;
const app = next({ dev, dir: __dirname }); 
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    console.log(__dirname);
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (err) => {
    if (err) throw err;
    console.log('> Ready on Port ' + process.env.PORT || 3000);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});