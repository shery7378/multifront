/**
 * Icon Generation Script for PWA
 * 
 * This script helps generate PWA icons from a source image.
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node scripts/generate-icons.js [source-image-path]
 * 
 * Example:
 * node scripts/generate-icons.js public/images/store-logo.svg
 */

const fs = require('fs');
const path = require('path');

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

const sourceImage = process.argv[2] || 'public/images/store-logo.svg';
const outputDir = path.join(__dirname, '../public/icons');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp package not found.');
  console.log('\n📦 Install it with: npm install sharp');
  console.log('\n📝 Or use an online tool: https://www.pwabuilder.com/imageGenerator');
  process.exit(1);
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Source image not found: ${sourceImage}`);
  console.log('\n💡 Usage: node scripts/generate-icons.js [path-to-image]');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created directory: ${outputDir}`);
}

async function generateIcons() {
  console.log(`\n🎨 Generating PWA icons from: ${sourceImage}\n`);

  try {
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.name);
      
      await sharp(sourceImage)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size}px)`);
    }

    console.log(`\n✨ All icons generated successfully in: ${outputDir}`);
    console.log('\n📱 Next steps:');
    console.log('   1. Test your PWA on different devices');
    console.log('   2. Verify icons appear correctly');
    console.log('   3. Check manifest.json references');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Alternative: Use an online tool like https://www.pwabuilder.com/imageGenerator');
    process.exit(1);
  }
}

generateIcons();

