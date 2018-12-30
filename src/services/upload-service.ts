import loadImage from 'blueimp-load-image';

import PhotosService from './photos-service';
import PresentingService from './presenting-service';

export default class UploadService {
  private root: any;
  private photosService: PhotosService;
  private present: PresentingService;
  private callback: any;
  private dropEventBinding: any;
  private handleFileSelectEventBinding: any;
  private albumId: string;

  constructor(callback: any, albumId?: string) {
    this.photosService = new PhotosService();
    this.present = new PresentingService();
    this.callback = callback;
    this.dropEventBinding = this.dropEvent.bind(this);
    this.handleFileSelectEventBinding = this.handleFileSelectEvent.bind(this);
    this.root = document.getElementById('photos-list');
    this.albumId = albumId;
  }

  addEventListeners(fileDialog: boolean): void {
    this.root = document.getElementById('photos-list');
    this.root.addEventListener('dragover', this.dragoverEvent);
    this.root.addEventListener('drop', this.dropEventBinding);
    if (fileDialog && document.getElementById('file-upload')) {
      document
        .getElementById('file-upload')
        .addEventListener('change', this.handleFileSelectEventBinding, false);
    }
  }

  removeEventListeners(fileDialog: boolean): void {
    this.root.removeEventListener('dragover', this.dragoverEvent);
    this.root.removeEventListener('drop', this.dropEventBinding);
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
    if (currentIndex !== 0) {
      await this.present.dismissLoading();
    }
    await this.present.loading(
      'Uploading photo ' + (currentIndex + 1) + '/' + list.length + '.'
    );
    // If dropped items aren't files, reject them
    if (list[currentIndex]) {
      const file = list[currentIndex].file;
      if (list[currentIndex].kind === 'file') {
        if (file.type.indexOf('image') !== -1) {
          loadImage(
            file,
            async data => {
              const metadata = {
                filename: file.name,
                stats: file
              };

              await this.uploadPhoto(metadata, data.toDataURL());
              if (list[currentIndex + 1]) {
                this.processUpload(list, currentIndex + 1);
              } else {
                this.uploadFilesDone();
              }
            },
            {
              orientation: true
            }
          );
        } else {
          this.present.toast(
            'The file "' +
              file.name +
              '" could not be uploaded, are you sure it\'s a photo?'
          );
          if (list[currentIndex + 1]) {
            this.processUpload(list, currentIndex + 1);
          } else {
            this.uploadFilesDone();
          }
        }
      } else {
        if (file && file.name) {
          this.present.toast(
            'The file "' +
              file.name +
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

  async uploadPhoto(metadata: any, data: any): Promise<void> {
    if (metadata && data) {
      const response = await this.photosService.uploadPhoto(
        metadata,
        data,
        this.albumId
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
    this.present.dismissLoading();
    if (this.callback && typeof this.callback === 'function') {
      // execute the callback, passing parameters as necessary
      this.callback();
    }
  }
}
