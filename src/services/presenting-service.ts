import PhotosService from './photos-service';
import isElectron from 'is-electron';

export default class PresentingService {
  private photosService: PhotosService;
  private loadingElement: HTMLIonLoadingElement;

  constructor() {
    this.photosService = new PhotosService();
  }

  async loading(message: string, duration?: number): Promise<void> {
    const loadingController = document.querySelector('ion-loading-controller');
    await loadingController.componentOnReady();

    this.loadingElement = await loadingController.create({
      message,
      spinner: 'circles',
      duration
    });
    return this.loadingElement.present();
  }

  async dismissLoading(): Promise<void> {
    if (this.loadingElement) {
      await this.loadingElement.dismiss();
    }
  }

  async toast(message: string): Promise<void> {
    const toastController = document.querySelector('ion-toast-controller');
    await toastController.componentOnReady();

    const toast = await toastController.create({
      message,
      showCloseButton: true,
      color: 'primary'
    });
    return toast.present();
  }

  async deletePhotos(
    ids: string[],
    callback: any,
    albumId?: string
  ): Promise<void> {
    if (!ids || ids.length < 1) {
      return;
    }

    let header = 'Delete ' + ids.length + ' photos?';
    if (ids.length === 1) {
      header = 'Delete ' + ids.length + ' photo?';
    }
    const actionSheetController = document.querySelector(
      'ion-action-sheet-controller'
    );
    await actionSheetController.componentOnReady();

    const buttons = [
      {
        text: 'Delete from app',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.loading('Deleting photos...');
          this.photosService.deletePhotos(ids).then(async result => {
            await this.dismissLoading();
            if (result === true) {
              callback();
            } else {
              this.errorAlert(
                'Removal failed',
                'The removal of some photos failed. Please try again in a few minutes!'
              );
            }
          });
        }
      }
    ];

    if (albumId) {
      buttons.push({
        text: 'Remove from album',
        role: 'destructive',
        icon: 'remove-circle',
        handler: () => {
          this.loading('Removing photos...');
          this.photosService
            .removePhotosFromList(ids, albumId)
            .then(async result => {
              await this.dismissLoading();
              if (result === true) {
                callback();
              } else {
                this.errorAlert(
                  'Removal failed',
                  'The removal of some photos failed. Please try again in a few minutes!'
                );
              }
            });
        }
      });
    }

    buttons.push({
      text: 'Cancel',
      icon: 'close',
      role: 'cancel',
      handler: null
    });

    const actionSheet = await actionSheetController.create({
      header,
      buttons
    });
    await actionSheet.present();
  }

  async errorAlert(header: string, message: string): Promise<void> {
    const alertController = document.querySelector('ion-alert-controller');
    await alertController.componentOnReady();

    const alert = await alertController.create({
      header,
      subHeader: '',
      message,
      buttons: ['OK']
    });
    return alert.present();
  }

  openLink(url: string, target: string): void {
    if (isElectron()) {
      const electron = window['require']('electron');
      electron.shell.openExternal(url);
    } else {
      window.open(url, target);
    }
  }
}
