import PhotosService from './PhotosService';
import isElectron from 'is-electron';

export default class PresentingService {

  constructor() {
    this.photosService = new PhotosService();
  }

  async loading(message, duration, enableBackdropDismiss) {
    const loadingController = document.querySelector('ion-loading-controller');
    await loadingController.componentOnReady();

    this.loadingElement = await loadingController.create({
      message: message,
      spinner: 'circles',
      duration: duration,
      enableBackdropDismiss: enableBackdropDismiss
    });
    return await this.loadingElement.present();
  }

  dismissLoading() {
    if (this.loadingElement) {
      this.loadingElement.dismiss();
    }
  }

  async toast(message) {
    const toastController = document.querySelector('ion-toast-controller');
    await toastController.componentOnReady();

    const toast = await toastController.create({
      message: message,
      showCloseButton: true,
      color: 'primary'
    });
    return await toast.present();
  }

  async deletePhoto(id, callbackComponent) {
    const actionSheetController = document.querySelector('ion-action-sheet-controller');
    await actionSheetController.componentOnReady();

    const actionSheet = await actionSheetController.create({
      header: "Delete photo?",
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: async () => {
          this.loading('Deleting photo...');
          let result = await this.photosService.deletePhoto(id);
          this.dismissLoading();
          if (result === true) {
            callbackComponent.deletePhotoCallback(callbackComponent);
          } else {
            this.errorAlert('Removal failed', 'The removal of the photo failed. Please try again in a few minutes!');
          }
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel'
      }]
    });
    await actionSheet.present();

  }

  async errorAlert(header, message) {
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

  openLink(url, target) {
    if (isElectron()) {
      let electron = window['require']("electron");
      electron.shell.openExternal(url);
    } else {
      window.open(url, target);
    }
  }

}
