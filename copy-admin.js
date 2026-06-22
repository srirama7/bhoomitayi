const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'admin-app');
const destDir = path.join(__dirname, 'public', 'admin-app');

function copyFolderRecursive(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name !== 'admin-app') {
        copyFolderRecursive(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log(`Copying ${srcDir} to ${destDir}...`);
  copyFolderRecursive(srcDir, destDir);
  console.log('Copy completed successfully!');
} catch (err) {
  console.error('Error copying admin-app folder:', err);
  process.exit(1);
}
