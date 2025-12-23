/**
 * Icon Generation Script using Puppeteer
 * Renders SVG and generates all PWA icons
 * 
 * Usage:
 * npm install puppeteer
 * node scripts/generate-icons-puppeteer.js
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

const sourceImage = process.argv[2] || path.join(__dirname, '../public/images/store-logo.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  // Check if puppeteer is available
  try {
    require('puppeteer');
  } catch (e) {
    console.error('❌ Error: puppeteer package not found.');
    console.log('\n📦 Install it with: npm install puppeteer');
    console.log('\n💡 Alternative: Open http://localhost:3000/generate-icons.html in your browser');
    process.exit(1);
  }

  // Check if source image exists
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    console.log('\n💡 Usage: node scripts/generate-icons-puppeteer.js [path-to-image]');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}`);
  }

  console.log(`\n🎨 Generating PWA icons from: ${sourceImage}\n`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Read SVG content
    const svgContent = fs.readFileSync(sourceImage, 'utf8');
    
    // Create HTML page with SVG
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 0; background: white; }
          .container { width: 512px; height: 512px; }
          svg { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div class="container">${svgContent}</div>
      </body>
      </html>
    `;

    await page.setContent(html);
    await page.setViewport({ width: 512, height: 512 });

    // Generate each icon size
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.name);
      
      await page.setViewport({ width: icon.size, height: icon.size });
      await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: { x: 0, y: 0, width: icon.size, height: icon.size }
      });
      
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size}px)`);
    }

    console.log(`\n✨ All icons generated successfully in: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Alternative: Open http://localhost:3000/generate-icons.html in your browser');
  } finally {
    await browser.close();
  }
}

generateIcons();

