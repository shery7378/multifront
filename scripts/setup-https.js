/**
 * HTTPS Setup Script for multikonnect.test
 * 
 * This script helps set up HTTPS for local development
 * 
 * Requirements:
 * - mkcert installed (https://github.com/FiloSottile/mkcert)
 * 
 * Steps:
 * 1. Install mkcert: choco install mkcert (Windows) or brew install mkcert (Mac)
 * 2. Run: mkcert -install
 * 3. Run: node scripts/setup-https.js
 * 4. Update your dev server to use HTTPS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const domain = 'multikonnect.test';
const certDir = path.join(__dirname, '../certs');

console.log('🔐 Setting up HTTPS for', domain);
console.log('');

// Check if mkcert is installed
try {
  execSync('mkcert --version', { stdio: 'ignore' });
  console.log('✅ mkcert is installed');
} catch (e) {
  console.error('❌ mkcert is not installed!');
  console.log('');
  console.log('Install mkcert:');
  console.log('  Windows: choco install mkcert');
  console.log('  Mac: brew install mkcert');
  console.log('  Linux: See https://github.com/FiloSottile/mkcert');
  console.log('');
  console.log('Then run: mkcert -install');
  process.exit(1);
}

// Create certs directory
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('✅ Created certs directory');
}

// Generate certificates
const keyPath = path.join(certDir, `${domain}-key.pem`);
const certPath = path.join(certDir, `${domain}.pem`);

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Certificates already exist');
  console.log('   Key:', keyPath);
  console.log('   Cert:', certPath);
} else {
  console.log('📝 Generating certificates...');
  try {
    execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" ${domain} localhost 127.0.0.1`, {
      stdio: 'inherit',
      cwd: certDir
    });
    console.log('✅ Certificates generated successfully!');
  } catch (e) {
    console.error('❌ Failed to generate certificates');
    process.exit(1);
  }
}

console.log('');
console.log('✅ HTTPS setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Update your dev server to use HTTPS (see next.config.js or custom server)');
console.log('2. Access your app at: https://multikonnect.test:3000');
console.log('3. Accept the security warning (it\'s a self-signed certificate)');

