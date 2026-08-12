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
    win.loadFile(path.join(__dirname, '../dist/index.html'));
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

// Repository Commit-based Updater Integration
function sendUpdateStatus(status, data = {}) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-status', { status, ...data });
  }
}

ipcMain.handle('check-for-updates', async () => {
  sendUpdateStatus('checking');
  try {
    const https = require('https');
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
          const commitDate = json.commit?.committer?.date || '';
          
          sendUpdateStatus('available', { 
            sha: latestSha, 
            message: commitMsg, 
            date: commitDate 
          });
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

// IPC: open download page in browser
ipcMain.handle('open-download-page', () => {
  shell.openExternal('https://github.com/mete-dev/PosNesia/releases');
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
