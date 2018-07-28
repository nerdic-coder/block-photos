export default class PresentingService {

  constructor() {}

  async loading(content) {
    const loadingController = document.querySelector('ion-loading-controller');
    await loadingController.componentOnReady();

    this.loadingElement = await loadingController.create({
      content: content,
      spinner: 'circles'
    });
    return await this.loadingElement.present();
  }

  dismissLoading() {
    this.loadingElement.dismiss();
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
}
