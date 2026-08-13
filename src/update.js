// src/update.js
// Simple update script that checks the latest release on GitHub and downloads the APK if newer.
// It stores the current installed version in 'aplikasi/version.txt' (just the tag name).

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const REPO = 'mete-dev/PosNesia';
const APK_NAME = 'PosNesia.apk';
const APK_DEST_DIR = path.resolve(__dirname, '..', 'aplikasi');
const VERSION_FILE = path.join(APK_DEST_DIR, 'version.txt');

// Helper to make HTTPS GET request and return parsed JSON
function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Antigravity-Agent' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('Checking GitHub for latest release...');
  const release = await httpsGetJson(`https://api.github.com/repos/${REPO}/releases/latest`);
  const latestTag = release.tag_name;
  console.log('Latest tag:', latestTag);

  let currentTag = null;
  if (fs.existsSync(VERSION_FILE)) {
    currentTag = fs.readFileSync(VERSION_FILE, 'utf-8').trim();
  }

  if (currentTag === latestTag) {
    console.log('Already up‑to‑date (', currentTag, ')');
    return;
  }

  const apkAsset = release.assets.find((a) => a.name.endsWith('.apk'));
  if (!apkAsset) {
    console.error('No APK asset found in the latest release.');
    process.exit(1);
  }

  const apkUrl = apkAsset.browser_download_url;
  console.log('Downloading APK from', apkUrl);

  if (!fs.existsSync(APK_DEST_DIR)) {
    fs.mkdirSync(APK_DEST_DIR, { recursive: true });
  }

  const apkPath = path.join(APK_DEST_DIR, APK_NAME);
  const file = fs.createWriteStream(apkPath);
  https.get(apkUrl, (res) => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded APK to', apkPath);
      fs.writeFileSync(VERSION_FILE, latestTag, 'utf-8');
      console.log('Updated version file.');
    });
  }).on('error', (err) => {
    if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);
    console.error('Download error:', err.message);
    process.exit(1);
  });
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
