import PictureService from './PictureService';

export default class PresentingService {

  constructor() {
    this.pictureService = new PictureService();
  }

  async loading(content, duration, enableBackdropDismiss) {
    const loadingController = document.querySelector('ion-loading-controller');
    await loadingController.componentOnReady();

    this.loadingElement = await loadingController.create({
      content: content,
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
      showCloseButton: true
    });
    return await toast.present();
  }

  async deletePicture(id, callbackComponent) {
    const actionSheetController = document.querySelector('ion-action-sheet-controller');
    await actionSheetController.componentOnReady();

    const actionSheet = await actionSheetController.create({
      header: "Delete picture?",
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: async () => {
          this.loading('Deleting picture...');
          let result = await this.pictureService.deletePicture(id);
          this.dismissLoading();
          if (result === true) {
            callbackComponent.deletePictureCallback(callbackComponent);
          } else {
            this.errorAlert('Removal failed', 'The removal of the picture failed. Please try again in a few minutes!');
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
}
