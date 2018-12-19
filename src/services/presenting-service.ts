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
      message: message,
      spinner: 'circles',
      duration: duration
    });
    return await this.loadingElement.present();
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
      message: message,
      showCloseButton: true,
      color: 'primary'
    });
    return await toast.present();
  }

  async deletePhoto(id: string, callback: any): Promise<void> {
    const actionSheetController = document.querySelector('ion-action-sheet-controller');
    await actionSheetController.componentOnReady();

    const actionSheet = await actionSheetController.create({
      header: "Delete photo?",
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.loading('Deleting photo...');
          this.photosService.deletePhoto(id).then(async (result) => {
            await this.dismissLoading();
            if (result === true) {
              callback();
            } else {
              this.errorAlert('Removal failed', 'The removal of the photo failed. Please try again in a few minutes!');
            }
          });
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel'
      }]
    });
    await actionSheet.present();

  }

  async deletePhotos(ids: Array<string>, callback: any): Promise<void> {

    if (!ids || ids.length < 1) {
      return;
    }

    let header = "Delete " + ids.length + " photos?";
    if (ids.length === 1) {
      header = "Delete " + ids.length + " photo?";
    }
    const actionSheetController = document.querySelector('ion-action-sheet-controller');
    await actionSheetController.componentOnReady();

    const actionSheet = await actionSheetController.create({
      header: header,
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.loading('Deleting photos...');
          this.photosService.deletePhotos(ids).then(async (result) => {
            if (result === true) {
              await this.dismissLoading();
              callback();
            } else {
              this.errorAlert('Removal failed', 'The removal of some photos failed. Please try again in a few minutes!');
            }
          });
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel'
      }]
    });
    await actionSheet.present();

  }

  async errorAlert(header: string, message: string): Promise<void> {
    const alertController = document.querySelector('ion-alert-controller');
    await alertController.componentOnReady();

    const alert = await alertController.create({
      header: header,
      subHeader: '',
      message: message,
      buttons: ['OK']
    });
    return await alert.present();
  }

  openLink(url: string, target: string): void {
    if (isElectron()) {
      let electron = window['require']("electron");
      electron.shell.openExternal(url);
    } else {
      window.open(url, target);
    }
  }

}
