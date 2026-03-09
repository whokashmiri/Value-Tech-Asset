const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const sizes = [192, 256, 384, 512];

async function downloadIcons() {
  for (const size of sizes) {
    const url = `https://placehold.co/${size}x${size}/2962FF/FFFFFF/png?text=V`;
    const dest = path.join(dir, `icon-${size}x${size}.png`);
    
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(resolve);
        });
      }).on('error', function(err) {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
    console.log(`Downloaded ${size}x${size} icon`);
  }
}

downloadIcons().catch(console.error);
