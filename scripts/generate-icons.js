const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcIcon = path.join(__dirname, '..', 'public', 'app-icon.png');

const sizes = {
  'mipmap-mdpi': { icon: 48, fg: 108 },
  'mipmap-hdpi': { icon: 72, fg: 162 },
  'mipmap-xhdpi': { icon: 96, fg: 216 },
  'mipmap-xxhdpi': { icon: 144, fg: 324 },
  'mipmap-xxxhdpi': { icon: 192, fg: 432 }
};

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function run() {
  for (const [folder, dims] of Object.entries(sizes)) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 1. ic_launcher.png
    await sharp(srcIcon)
      .resize(dims.icon, dims.icon, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // 2. ic_launcher_round.png
    await sharp(srcIcon)
      .resize(dims.icon, dims.icon, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // 3. ic_launcher_foreground.png (with slight safe padding so adaptive icon doesn't crop edges)
    const fgPadding = Math.round(dims.fg * 0.15);
    const innerSize = dims.fg - (fgPadding * 2);
    const innerBuffer = await sharp(srcIcon)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: dims.fg,
        height: dims.fg,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerBuffer, top: fgPadding, left: fgPadding }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${folder}`);
  }

  // Also update web favicon & apple touch icon
  await sharp(srcIcon).resize(192, 192).toFile(path.join(__dirname, '..', 'public', 'icon.png'));
  await sharp(srcIcon).resize(180, 180).toFile(path.join(__dirname, '..', 'public', 'apple-icon.png'));
  console.log('All icons generated successfully!');
}

run().catch(console.error);
