// Download ALL face-api.js model files including ALL shards
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';
const MODELS_DIR = path.join(__dirname, 'public', 'models');

// Complete list including ALL shards
const models = [
  // SSD MobileNet (2 shards!)
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  
  // Face Landmark 68 (1 shard)
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition (2 shards!)
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

console.log('📥 Downloading ALL face-api.js model shards...\n');

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + filename;
    const dest = path.join(MODELS_DIR, filename);
    
    console.log(`Downloading: ${filename}`);
    
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (redirectResponse) => {
          const file = fs.createWriteStream(dest);
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            const stats = fs.statSync(dest);
            console.log(`✅ ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
            resolve();
          });
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(dest);
          console.log(`✅ ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAllModels() {
  try {
    for (const model of models) {
      await downloadFile(model);
    }
    console.log('\n🎉 All model files downloaded!');
    console.log('📁 Total files: 8 (3 manifests + 5 shards)\n');
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

downloadAllModels();
