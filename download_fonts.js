const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = {
  'NotoSansKannada-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf',
  'NotoSansDevanagari-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf',
  'NotoSansTelugu-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf',
  'NotoSansMalayalam-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf',
  'NotoSansTamil-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf',
  'NotoSans-Regular.ttf': 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
};

const dir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      } else {
        fs.unlink(dest, () => reject(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const [name, url] of Object.entries(fonts)) {
    console.log(`Downloading ${name}...`);
    try {
      await downloadFile(url, path.join(dir, name));
      console.log(`Downloaded ${name}`);
    } catch (e) {
      console.error(e);
    }
  }
}

run();
