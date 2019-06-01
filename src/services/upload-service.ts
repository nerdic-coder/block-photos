import loadImage from 'blueimp-load-image';
import uuidv4 from 'uuid/v4';
import PhotosService from './photos-service';
import PresentingService from './presenting-service';
import { PhotoType } from '../models/photo-type';
import { Plugins } from '@capacitor/core';

export default class UploadService {
  private root: any;
  private present: PresentingService;
  private callback: any;
  private startedCallback: any;
  private dropEventBinding: any;
  private handleFileSelectEventBinding: any;
  private albumId: string;

  constructor(callback: any, albumId?: string, startedCallback?: any) {
    this.present = new PresentingService();
    this.callback = callback;
    this.startedCallback = startedCallback;
    this.dropEventBinding = this.dropEvent.bind(this);
    this.handleFileSelectEventBinding = this.handleFileSelectEvent.bind(this);
    this.root = document.getElementById('photos-list');
    this.albumId = albumId;
  }

  addEventListeners(fileDialog: boolean): void {
    this.root = document.getElementById('photos-list');
    if (this.root) {
      this.root.addEventListener('dragover', this.dragoverEvent);
      this.root.addEventListener('drop', this.dropEventBinding);
    }
    if (fileDialog && document.getElementById('file-upload')) {
      document
        .getElementById('file-upload')
        .addEventListener('change', this.handleFileSelectEventBinding, false);
    }
  }

  removeEventListeners(fileDialog: boolean): void {
    if (this.root) {
      this.root.removeEventListener('dragover', this.dragoverEvent);
      this.root.removeEventListener('drop', this.dropEventBinding);
    }
    if (fileDialog && document.getElementById('file-upload')) {
      document
        .getElementById('file-upload')
        .removeEventListener('change', this.handleFileSelectEventBinding);
    }
  }

  dragoverEvent(event: any): void {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  dropEvent(event: any): void {
    event.stopPropagation();
    event.preventDefault();

    if (event.dataTransfer.items) {
      const photosToUpload = [];
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const item = {
          kind: event.dataTransfer.items[i].kind,
          file: event.dataTransfer.items[i].getAsFile()
        };
        photosToUpload.push(item);
      }
      this.processUpload(photosToUpload, 0);

      event.dataTransfer.items.clear();
    }
  }

  handleFileSelectEvent(event: any): void {
    event.stopPropagation();
    event.preventDefault();

    const files = event.target.files;

    if (files) {
      const photosToUpload = [];
      for (let i = 0; i < files.length; i++) {
        const item = {
          kind: 'file',
          file: files[i]
        };
        photosToUpload.push(item);
      }
      this.processUpload(photosToUpload, 0);
    }
  }

  async processUpload(list: any, currentIndex: number): Promise<void> {
    if (currentIndex === 0) {
      if (this.startedCallback && typeof this.startedCallback === 'function') {
        // execute the callback, passing parameters as necessary
        this.startedCallback();
      }
    }
    this.present.presentToolbarLoader(
      'Uploading photo ' + (currentIndex + 1) + ' of ' + list.length + '.'
    );
    // If dropped items aren't files, reject them
    if (list[currentIndex]) {
      const tempFile = list[currentIndex].file;
      if (list[currentIndex].kind === 'file') {
        if (tempFile.type.indexOf('image') !== -1) {
          const { Device } = Plugins;
          const info = await Device.getInfo();
          let thumbnailData = null;
          let viewerData = null;
          if (info.model !== 'iPhone' && info.model !== 'iPad') {
            thumbnailData = await PhotosService.compressPhoto(
              tempFile,
              PhotoType.Thumbnail,
              tempFile.type
            );
            viewerData = await PhotosService.compressPhoto(
              tempFile,
              PhotoType.Viewer,
              tempFile.type
            );
          }
          loadImage.parseMetaData(
            tempFile,
            data => {
              const reader = new FileReader();

              let orientation = 1;
              if (data && data.exif) {
                orientation = data.exif.get('Orientation');
              }

              // Closure to capture the file information.
              reader.onload = ((loadedFile, loadedList, loadedOrientation) => {
                return async event => {
                  let originalData = event.target.result;
                  if (info.model === 'iPhone' || info.model === 'iPad') {
                    const loadedData = await loadImage(originalData, null, {
                      orientation
                    });
                    if (loadedData.type === 'error') {
                      this.present.toast(
                        'The file "' +
                          tempFile.name +
                          '" could not be uploaded, are you sure it\'s a photo?'
                      );
                      if (list[currentIndex + 1]) {
                        this.processUpload(list, currentIndex + 1);
                      } else {
                        this.uploadFilesDone();
                      }
                      return;
                    } else if (loadedData.tagName === 'CANVAS') {
                      originalData = loadedData.toDataURL();
                    } else {
                      originalData = loadedData.src;
                    }
                  }
                  if (loadedOrientation) {
                    loadedFile.exifdata = {
                      tags: {
                        Orientation: loadedOrientation,
                        OriginalOrientation: loadedOrientation
                      }
                    };
                  }
                  const photoId: string =
                    uuidv4() +
                    loadedFile.name.replace('.', '').replace(' ', '');
                  const metadata: PhotoMetadata = {
                    id: photoId,
                    filename: loadedFile.name,
                    stats: loadedFile,
                    type: tempFile.type,
                    size: tempFile.size,
                    uploadedDate: new Date(),
                    albums: [this.albumId]
                  };

                  await this.uploadPhoto(
                    metadata,
                    originalData,
                    thumbnailData,
                    viewerData
                  );
                  if (loadedList[currentIndex + 1]) {
                    this.processUpload(loadedList, currentIndex + 1);
                  } else {
                    this.uploadFilesDone();
                  }
                };
              })(tempFile, list, orientation);
              // Read in the image file as a data URL.
              reader.readAsDataURL(tempFile);
            },
            {
              maxMetaDataSize: 262144,
              disableImageHead: false
            }
          );
        } else {
          this.present.toast(
            'The file "' +
              tempFile.name +
              '" could not be uploaded, are you sure it\'s a photo?'
          );
          if (list[currentIndex + 1]) {
            this.processUpload(list, currentIndex + 1);
          } else {
            this.uploadFilesDone();
          }
        }
      } else {
        if (tempFile && tempFile.name) {
          this.present.toast(
            'The file "' +
              tempFile.name +
              '" could not be uploaded, are you sure it\'s a photo?'
          );
        } else {
          this.present.toast(
            "One of the files could not be uploaded, are you sure it's a photo?"
          );
        }
        if (list[currentIndex + 1]) {
          this.processUpload(list, currentIndex + 1);
        } else {
          this.uploadFilesDone();
        }
      }
    } else {
      this.present.toast(
        "The file could not be uploaded, are you sure it's a photo?"
      );
      if (list[currentIndex + 1]) {
        this.processUpload(list, currentIndex + 1);
      } else {
        this.uploadFilesDone();
      }
    }
  }

  async uploadPhoto(
    metadata: PhotoMetadata,
    data: any,
    thumbnailData?: any,
    viewerData?: any
  ): Promise<void> {
    if (metadata && data) {
      const response = await PhotosService.uploadPhoto(
        metadata,
        data,
        this.albumId,
        thumbnailData,
        viewerData
      );
      if (response.errorsList && response.errorsList.length > 0) {
        for (const error of response.errorsList) {
          if (error.errorCode === 'err_filesize') {
            this.present.toast(
              'Failed to upload "' +
                error.id +
                '", photo exceeds file size limit of 5MB.'
            );
          } else {
            this.present.toast('Failed to upload "' + error.id + '".');
          }
        }
      }
    } else {
      this.present.toast('Failed to upload "' + metadata.filename + '".');
    }
  }

  uploadFilesDone(): void {
    this.present.dismissToolbarLoader();
    if (this.callback && typeof this.callback === 'function') {
      // execute the callback, passing parameters as necessary
      this.callback();
    }
  }
}
