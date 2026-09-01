const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  console.log('Optimizing heavy public assets...');

  // 1. Unused duplicates to remove
  const duplicatesToRemove = [
    'public/categories/houses.png',
    'public/categories/land.png',
    'public/categories/vehicles.png',
  ];

  for (const file of duplicatesToRemove) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted duplicate: ${file}`);
    }
  }

  // Helper to shrink file in place
  async function shrink(filePath, options = {}) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) return;

    const statsBefore = fs.statSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const tempPath = fullPath + '.tmp';

    let pipeline = sharp(fullPath);
    if (options.maxWidth) {
      pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true });
    }

    if (ext === '.png') {
      pipeline = pipeline.png({ quality: options.quality || 80, compressionLevel: 9 });
    } else if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: options.quality || 80, mozjpeg: true });
    } else if (ext === '.avif') {
      pipeline = pipeline.avif({ quality: options.quality || 75 });
    } else if (ext === '.webp') {
      pipeline = pipeline.webp({ quality: options.quality || 80 });
    }

    await pipeline.toFile(tempPath);
    fs.renameSync(tempPath, fullPath);
    const statsAfter = fs.statSync(fullPath);

    console.log(
      `Optimized ${filePath}: ${(statsBefore.size / 1024 / 1024).toFixed(2)}MB -> ${(
        statsAfter.size / 1024
      ).toFixed(0)}KB`
    );
  }

  // 2. Shrink category images
  const catDir = 'public/categories';
  if (fs.existsSync(catDir)) {
    const files = fs.readdirSync(catDir);
    for (const f of files) {
      await shrink(path.join(catDir, f), { maxWidth: 800, quality: 75 });
    }
  }

  // 3. Shrink top level heavy images
  await shrink('public/tommy-avatar.avif', { maxWidth: 400, quality: 75 });
  await shrink('public/token_icon.png', { maxWidth: 512, quality: 80 });
  await shrink('public/contact_icon.png', { maxWidth: 512, quality: 80 });
  await shrink('public/logo.png', { maxWidth: 256, quality: 80 });
  await shrink('public/logo-v2.png', { maxWidth: 256, quality: 80 });

  console.log('Image optimization complete!');
}

optimizeImages().catch(console.error);
