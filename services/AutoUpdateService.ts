import { App } from '@capacitor/app';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  downloadUrl: string;
  releaseNotes: string;
  mandatory: boolean;
}

// URL GitHub Releases API untuk repository mete-dev/PosNesia
export const GITHUB_RELEASES_URL = 'https://api.github.com/repos/mete-dev/PosNesia/releases/latest';

export async function checkForAppUpdate(): Promise<AppVersionInfo | null> {
  try {
    const appInfo = await App.getInfo();
    const currentVersion = appInfo.version; // e.g. '1.0.0'

    const response = await fetch(GITHUB_RELEASES_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) return null;

    const releaseData = await response.json();
    // releaseData.tag_name e.g. "v1.0.1" atau "1.0.1"
    const latestVersion = (releaseData.tag_name || '').replace(/^v/, '');

    // Cari asset file .apk di dalam release
    const apkAsset = (releaseData.assets || []).find((asset: any) => asset.name.endsWith('.apk'));
    const downloadUrl = apkAsset ? apkAsset.browser_download_url : releaseData.html_url;

    if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
      return {
        version: latestVersion,
        buildNumber: 1,
        downloadUrl: downloadUrl,
        releaseNotes: releaseData.body || 'Pembaruan aplikasi versi baru.',
        mandatory: false
      };
    }
  } catch (error) {
    console.log('GitHub Release check skipped/failed:', error);
  }
  return null;
}

function isNewerVersion(serverVer: string, currentVer: string): boolean {
  const serverParts = serverVer.split('.').map(Number);
  const currentParts = currentVer.split('.').map(Number);

  for (let i = 0; i < Math.max(serverParts.length, currentParts.length); i++) {
    const s = serverParts[i] || 0;
    const c = currentParts[i] || 0;
    if (s > c) return true;
    if (s < c) return false;
  }
  return false;
}
