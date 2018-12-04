// Modules to control application life and create native browser window
const { app, BrowserWindow, protocol, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let BASE_URL = `file://${__dirname}/app/index.html`;
let SCHEME = 'blockphotosapp';
if (isDev) {
  BASE_URL = 'http://localhost:9876';
  
}

protocol.registerStandardSchemes([SCHEME]);
app.setAsDefaultProtocolClient(SCHEME);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let currentAuthResponse = '';

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow && commandLine[1]) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        
        var request = commandLine[1].split(":");

        if (request[1] && currentAuthResponse !== request[1]) {
          currentAuthResponse = request[1];
          
          mainWindow.focus();
          mainWindow.loadURL(BASE_URL + '?authResponse=' + request[1]);
          return true;
        }
    }
    dialog.showMessageBox({ 
      message: "Authentication failed, please try again!",
      buttons: ["OK"] 
    });
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 810,
    icon: path.join(__dirname, 'icons/png/64x64.png')
  });

  // and load the index.html of the app.
  mainWindow.loadURL(BASE_URL);

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

app.on('open-url', function (event, url) {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    
    var request = url.split(":");

    if (request[1] && currentAuthResponse !== request[1]) {
      currentAuthResponse = request[1];
      
      mainWindow.focus();
      mainWindow.loadURL(BASE_URL + '?authResponse=' + request[1]);
      return;
    }
  }
  dialog.showMessageBox({ 
    message: "Authentication failed, please try again!",
    buttons: ["OK"] 
  });
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
