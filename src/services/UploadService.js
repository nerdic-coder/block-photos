import * as loadImage from 'blueimp-load-image';

import PictureService from './PictureService';
import PresentingService from './PresentingService';

export default class UploadService {

  root = document.getElementById('root');

  constructor(callback) {
    this.pictureService = new PictureService();
    this.present = new PresentingService();
    this.callback = callback;
    this.dropEventBinding = this.dropEvent.bind(this);
    this.handleFileSelectEventBinding = this.handleFileSelectEvent.bind(this);
  }

  addEventListeners(fileDialog) {
    this.root.addEventListener('dragover', this.dragoverEvent);
    this.root.addEventListener('drop', this.dropEventBinding);
    if (fileDialog && document.getElementById('file-upload')) {
      document.getElementById('file-upload').addEventListener('change', this.handleFileSelectEventBinding, false);
    }
  }

  removeEventListeners(fileDialog) {
    this.root.removeEventListener('dragover', this.dragoverEvent);
    this.root.removeEventListener('drop', this.dropEventBinding);
    if (fileDialog && document.getElementById('file-upload')) {
      document.getElementById('file-upload').removeEventListener('change', this.handleFileSelectEventBinding);
    }
  }

  dragoverEvent(event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  dropEvent(event) {
    event.stopPropagation();
    event.preventDefault();

    if (event.dataTransfer.items) {
      const picturesToUpload = [];
      for (var i = 0; i < event.dataTransfer.items.length; i++) {
        let item = {
          kind: event.dataTransfer.items[i].kind,
          file: event.dataTransfer.items[i].getAsFile()
        };
        picturesToUpload.push(item);
      }
      this.processUpload(picturesToUpload, 0);

      event.dataTransfer.items.clear();
    }
  }

  handleFileSelectEvent(event) {
    event.stopPropagation();
    event.preventDefault();

    const files = event.target.files;

    if (files) {
      const picturesToUpload = [];
      for (var i = 0; i < files.length; i++) {
        let item = {
          kind: 'file',
          file: files[i]
        };
        picturesToUpload.push(item);
      }
      this.processUpload(picturesToUpload, 0);
    }
  }

  async processUpload(list, currentIndex) {
    if (currentIndex === 0) {
      await this.present.loading('Pictures uploading...');
    }
    // If dropped items aren't files, reject them
    if (list[currentIndex]) {
      const file = list[currentIndex].file;
      if (list[currentIndex].kind === 'file') {
        if (file.type.indexOf('image') !== -1) {

          loadImage.parseMetaData(
            file,
            (data) => {
              const reader = new FileReader();

              const orientation = data.exif.get('Orientation');

              // Closure to capture the file information.
              reader.onload = ((loadedFile, loadedList, orientation) => {
                return async (e) => {
                  e.target.result;
                  if (orientation) {
                    loadedFile.exifdata = { tags: { Orientation: orientation } };
                    loadedFile.exifdata = { tags: { OriginalOrientation: orientation } };
                  }
                  const photosData = {
                    "filename": loadedFile.name,
                    "stats": loadedFile,
                    "data": e.target.result
                  };
                  await this.uploadFiles(event, [photosData]);
                  if (loadedList[currentIndex + 1]) {
                    this.processUpload(loadedList, currentIndex + 1);
                  } else {
                    this.uploadFilesDone();
                  }
                };
              })(file, list, orientation);
              // Read in the image file as a data URL.
              reader.readAsDataURL(file);
            },
            {
                maxMetaDataSize: 262144,
                disableImageHead: false
            }
          );
        } else {
          this.present.toast('The file "' + file.name + '" could not be uploaded, are you sure it\'s a picture?');
          if (list[currentIndex + 1]) {
            this.processUpload(list, currentIndex + 1);
          } else {
            this.uploadFilesDone();
          }
        }
      } else {
        this.present.toast('The file "' + file.name + '" could not be uploaded, are you sure it\'s a picture?');
        if (list[currentIndex + 1]) {
          this.processUpload(list, currentIndex + 1);
        } else {
          this.uploadFilesDone();
        }
      }
    } else {
      this.present.toast('The file could not be uploaded, are you sure it\'s a picture?');
      if (list[currentIndex + 1]) {
        this.processUpload(list, currentIndex + 1);
      } else {
        this.uploadFilesDone();
      }
    }
  }

  async uploadFiles(event, filesData) {
    if (filesData && filesData.length > 0) {
      const response = await this.pictureService.uploadPictures(filesData);
      if (response.errorsList && response.errorsList.length > 0) {
        for (let error of response.errorsList) {
          if (error.errorCode === 'err_filesize') {
            this.present.toast('Failed to upload "' + error.id + '", picture exceeds file size limit of 5MB.');
          } else {
            this.present.toast('Failed to upload "' + error.id + '".');
          }
        }
      }
    }
  }

  uploadFilesDone() {
    this.present.dismissLoading();
    if (this.callback && typeof (this.callback) === "function") {
      // execute the callback, passing parameters as necessary
      this.callback();
    }
  }
}
