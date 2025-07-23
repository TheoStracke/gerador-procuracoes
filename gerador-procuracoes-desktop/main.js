const { app, BrowserWindow } = require('electron');
const path = require('path');

let splash;
let mainWindow;

app.disableHardwareAcceleration();

function createWindow() {
  splash = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    resizable: false,
    center: true
  });

  splash.loadFile(path.join(__dirname, 'frontend', 'splash.html'));

  mainWindow = new BrowserWindow({
    fullscreen: true,
    show: false, // 👈 importante
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));

  // Mostra o mainWindow só quando estiver pronto
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => { // 👈 pequena pausa opcional
      splash.close();
      mainWindow.show();
    }, 8000); // espera 1 segundo antes de mostrar o app
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
