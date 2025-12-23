/**
 * HTTPS Server for Next.js Development
 * 
 * Run: node server-https.js
 * 
 * This starts Next.js with HTTPS support for multikonnect.test
 */

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'multikonnect.test';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Certificate paths
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, `${hostname}-key.pem`);
const certPath = path.join(certDir, `${hostname}.pem`);

// Check if certificates exist
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('❌ SSL certificates not found!');
  console.log('');
  console.log('Run: node scripts/setup-https.js');
  console.log('Or manually generate certificates with mkcert');
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log('');
    console.log('🚀 Ready on https://' + hostname + ':' + port);
    console.log('');
    console.log('⚠️  You may see a security warning - this is normal for local development');
    console.log('   Click "Advanced" > "Proceed to multikonnect.test"');
    console.log('');
  });
});

