/**
 * Simple Icon Generation Script for PWA
 * Uses jimp (pure JavaScript, no native dependencies)
 * 
 * Usage:
 * npm install jimp
 * node scripts/generate-icons-simple.js
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

const sourceImage = process.argv[2] || path.join(__dirname, '../public/images/store-logo.svg');
const outputDir = path.join(__dirname, '../public/icons');

// Check if jimp is available
let Jimp;
try {
  Jimp = require('jimp');
} catch (e) {
  console.error('❌ Error: jimp package not found.');
  console.log('\n📦 Install it with: npm install jimp');
  console.log('\n💡 Alternative: Open http://localhost:3000/generate-icons.html in your browser');
  console.log('   (After starting your dev server)');
  process.exit(1);
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Source image not found: ${sourceImage}`);
  console.log('\n💡 Usage: node scripts/generate-icons-simple.js [path-to-image]');
  console.log('💡 Or use the browser tool: http://localhost:3000/generate-icons.html');
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
    // Load source image
    let image;
    if (sourceImage.endsWith('.svg')) {
      console.log('⚠️  SVG files need conversion. Using browser tool is recommended.');
      console.log('   Open: http://localhost:3000/generate-icons.html');
      console.log('\n💡 Converting SVG to PNG first...');
      
      // For SVG, we'll need to use a different approach
      // Jimp doesn't support SVG directly, so we'll create a placeholder
      console.log('❌ Jimp cannot process SVG files directly.');
      console.log('\n📝 Solutions:');
      console.log('   1. Use the browser tool: http://localhost:3000/generate-icons.html');
      console.log('   2. Convert SVG to PNG first, then run this script');
      console.log('   3. Use an online tool: https://www.pwabuilder.com/imageGenerator');
      process.exit(1);
    } else {
      image = await Jimp.read(sourceImage);
    }

    // Generate icons
    for (const icon of iconSizes) {
      const outputPath = path.join(outputDir, icon.name);
      
      // Resize with padding (10% padding on each side = 80% of size)
      const padding = Math.floor(icon.size * 0.1);
      const contentSize = icon.size - (padding * 2);
      
      // Create new image with white background
      const iconImage = new Jimp(icon.size, icon.size, 0xFFFFFFFF);
      
      // Resize source image to fit
      const resized = image.clone().resize(contentSize, contentSize, Jimp.RESIZE_BICUBIC);
      
      // Composite onto white background
      iconImage.composite(resized, padding, padding);
      
      // Save
      await iconImage.writeAsync(outputPath);
      
      console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size}px)`);
    }

    console.log(`\n✨ All icons generated successfully in: ${outputDir}`);
    console.log('\n📱 Next steps:');
    console.log('   1. Test your PWA on different devices');
    console.log('   2. Verify icons appear correctly');
    console.log('   3. Check manifest.json references');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n💡 Alternative solutions:');
    console.log('   1. Use browser tool: http://localhost:3000/generate-icons.html');
    console.log('   2. Use online tool: https://www.pwabuilder.com/imageGenerator');
    console.log('   3. Convert SVG to PNG first, then run this script');
    process.exit(1);
  }
}

generateIcons();

