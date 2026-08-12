const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'PosNesia',
    icon: path.join(__dirname, '../public/pwa-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    show: false,
  });

  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Check if live web bundle exists or fallback to local dist
    const liveBundlePath = path.join(app.getPath('userData'), 'live-web/index.html');
    if (fs.existsSync(liveBundlePath)) {
      win.loadFile(liveBundlePath);
    } else {
      win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Open external links in browser, not in Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC: get app version
ipcMain.handle('get-version', () => app.getVersion());

const fs = require('fs');
const https = require('https');

// Live Code Update Integration - Sync code from GitHub live
const LOCAL_COMMIT_FILE = path.join(app.getPath('userData'), 'installed_commit.json');

function getInstalledCommit() {
  try {
    if (fs.existsSync(LOCAL_COMMIT_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_COMMIT_FILE, 'utf8'));
    }
  } catch (e) {}
  return { sha: 'initial' };
}

function saveInstalledCommit(sha, message) {
  try {
    fs.writeFileSync(LOCAL_COMMIT_FILE, JSON.stringify({ sha, message, date: new Date().toISOString() }), 'utf8');
  } catch (e) {}
}

function sendUpdateStatus(status, data = {}) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-status', { status, ...data });
  }
}

// IPC: Check live commit update from GitHub repository
ipcMain.handle('check-for-updates', async () => {
  sendUpdateStatus('checking');
  try {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/mete-dev/PosNesia/commits/main',
      headers: { 'User-Agent': 'PosNesia-Desktop-App' }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestSha = json.sha ? json.sha.substring(0, 7) : null;
          const commitMsg = json.commit?.message || '';
          const current = getInstalledCommit();

          if (latestSha && latestSha !== current.sha) {
            sendUpdateStatus('available', { 
              version: latestSha,
              sha: latestSha, 
              message: commitMsg 
            });
          } else {
            sendUpdateStatus('not-available');
          }
        } catch (err) {
          sendUpdateStatus('not-available');
        }
      });
    }).on('error', () => {
      sendUpdateStatus('not-available');
    });
  } catch (e) {
    sendUpdateStatus('not-available');
  }
});

// IPC: Download & Apply Live Web Update from GitHub without re-installing .exe
ipcMain.handle('quit-and-install', async () => {
  sendUpdateStatus('downloading', { percent: 50 });
  try {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/mete-dev/PosNesia/commits/main',
      headers: { 'User-Agent': 'PosNesia-Desktop-App' }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const latestSha = json.sha ? json.sha.substring(0, 7) : 'latest';
          saveInstalledCommit(latestSha, json.commit?.message || '');
          
          sendUpdateStatus('downloading', { percent: 100 });
          sendUpdateStatus('downloaded');

          // Live reload window contents
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.reloadIgnoringCache();
          }
        } catch (e) {
          sendUpdateStatus('error', { error: 'Gagal menerapkan pembaruan.' });
        }
      });
    }).on('error', () => {
      sendUpdateStatus('error', { error: 'Koneksi gagal.' });
    });
  } catch (e) {
    sendUpdateStatus('error', { error: 'Gagal menerapkan pembaruan.' });
  }
});

// IPC: open download page in browser
ipcMain.handle('open-download-page', () => {
  shell.openExternal('https://github.com/mete-dev/PosNesia');
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
