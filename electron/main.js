// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const serverProcess = require('child_process');
const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');
const path = require('path');
const exif = require('exif-parser');

// Start process to serve manifest file
const server = serverProcess.fork(__dirname + '/server.js');
let currentAuthResponse = '';

// Quit server process if main app will quit
app.on('will-quit', () => {
  server.send('quit');
});

server.on('message', (m) => {
  authCallback(m.authResponse);
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icons/png/64x64.png')
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/app/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function authCallback(authResponse) {
  // Bring app window to front
  if (currentAuthResponse !== authResponse) {
    currentAuthResponse = authResponse;
    mainWindow.loadURL(`file://${__dirname}/app/index.html?authResponse=` + authResponse);
    mainWindow.focus();
  }

}

ipc.on('open-file-dialog', function () {
  let files = dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] }
    ]
  });

  let filesData = [];
  if (files) {
    for (let file of files) {
      var data = fs.readFileSync(file);
      var filename = path.basename(file);
      const stats = fs.statSync(file);

      const exifParser = exif.create(data);
      stats.exifdata = exifParser.parse();

      filesData.push({ "filename": filename, "data": Buffer.from(data).toString('base64'), "stats": stats });
    }

    mainWindow.webContents.send('upload-files', filesData);
  }
});

ipc.on('drop', (event, rawFiles) => {
  const files = JSON.parse(rawFiles);
  let filesData = [];
  if (files) {
    for (let file of files) {
      var data = fs.readFileSync(file.path);
      var filename = path.basename(file.path);
      const stats = fs.statSync(file.path);
      stats.type = file.type;

      const exifParser = exif.create(data);
      stats.exifdata = exifParser.parse();

      filesData.push({ "filename": filename, "data": Buffer.from(data).toString('base64'), "stats": stats });
    }

    mainWindow.webContents.send('upload-files', filesData);
  }
});
