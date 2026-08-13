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
    icon: path.join(__dirname, '../../public/pwa-icon.png'),
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
    win.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
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

// Auto-Updater Integration
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(status, data = {}) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-status', { status, ...data });
  }
}

autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
autoUpdater.on('update-available', (info) => sendUpdateStatus('available', { version: info.version }));
autoUpdater.on('update-not-available', () => sendUpdateStatus('not-available'));
autoUpdater.on('error', (err) => {
  // If no release exists yet or network issue, treat as "not available" gracefully
  const msg = err.message || '';
  const isNotFound = msg.includes('404') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('net::');
  if (isNotFound) {
    sendUpdateStatus('not-available');
  } else {
    sendUpdateStatus('error', { error: msg });
  }
});
autoUpdater.on('download-progress', (progressObj) => sendUpdateStatus('downloading', { percent: Math.round(progressObj.percent) }));
autoUpdater.on('update-downloaded', () => sendUpdateStatus('downloaded'));

ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    sendUpdateStatus('not-available');
    return;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (e) {
    // Gracefully handle missing release or network errors
    const msg = e.message || '';
    const isNotFound = msg.includes('404') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('net::');
    if (isNotFound) {
      sendUpdateStatus('not-available');
    } else {
      sendUpdateStatus('error', { error: msg });
    }
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
