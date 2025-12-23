// Custom Next.js server for environments (like Webuzo) that expect
// a single Node entry file (e.g. `node server.js`).
//
// Usage:
//   NODE_ENV=production PORT=3000 node server.js
//
// Make sure you have already run:
//   npm install
//   npm run build

const { createServer } = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';

const app = next({
  dev: process.env.NODE_ENV !== 'production',
  hostname,
  port,
});

const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, (err) => {
      if (err) {
        console.error('Error starting server:', err);
        process.exit(1);
      }
      console.log(`> Next.js server ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error during Next.js preparation:', err);
    process.exit(1);
  });


