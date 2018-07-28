import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import isElectron from 'is-electron';

import './index.css';
import App from './App';

// import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root'));

document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => {
  event.preventDefault();

  const picturesToUpload = [];

  if (event.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (var i = 0; i < event.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (event.dataTransfer.items[i].kind === 'file') {
        var file = event.dataTransfer.items[i].getAsFile();
        if (file.type.indexOf('image') !== -1) {
          picturesToUpload.push({ "path":file.path, "type": file.type });
        }
      }
    }
    event.dataTransfer.items.clear();

    if (picturesToUpload.length > 0 && isElectron()) {
      ipcRenderer.send('drop', JSON.stringify(picturesToUpload));
    }
  }

});

// registerServiceWorker();
