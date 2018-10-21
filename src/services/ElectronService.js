import isElectron from 'is-electron';

export default class ElectronService {

  static send(method, data) {
    if (isElectron()) {
      let electron = window['require']("electron");
      let ipcRenderer = electron.ipcRenderer;
      ipcRenderer.send(method, data);
    }
  }

  static on(method, data) {
    if (isElectron()) {
      let electron = window['require']("electron");
      let ipcRenderer = electron.ipcRenderer;
      ipcRenderer.on(method, data);
    }
  }

  static removeAllListeners(method) {
    if (isElectron()) {
      let electron = window['require']("electron");
      let ipcRenderer = electron.ipcRenderer;
      ipcRenderer.removeAllListeners(method);
    }
  }
}
