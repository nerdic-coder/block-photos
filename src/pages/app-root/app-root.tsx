import { Component, Prop, Listen } from '@stencil/core';
import { Plugins } from '@capacitor/core';
import * as Sentry from '@sentry/browser';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css'
})
export class AppRoot {

  @Prop({ connect: 'ion-toast-controller' }) toastCtrl: HTMLIonToastControllerElement;

  /**
   * Handle service worker updates correctly.
   * This code will show a toast letting the
   * user of the PWA know that there is a
   * new version available. When they click the
   * reload button it then reloads the page
   * so that the new service worker can take over
   * and serve the fresh content
   */
  @Listen('window:swUpdate')
  async onSWUpdate() {
    const toast = await this.toastCtrl.create({
      message: 'New version available',
      showCloseButton: true,
      closeButtonText: 'Reload'
    });
    await toast.present();
    await toast.onWillDismiss();
    window.location.reload();
  }

  componentWillLoad() {

    Sentry.init({
      dsn: "https://2b0b525209b646f49e438cff86c3e117@sentry.io/1331915",
      release: "block-photos@2.0"
    });

    this.initCapacitor();

  }

  async initCapacitor() {

    const { Device } = Plugins;

    const device = await Device.getInfo();
    if (device.platform !== 'web') {
      const { App, StatusBar } = Plugins;
      StatusBar.setBackgroundColor({ color: '#220631' });

      App.addListener('appUrlOpen', (data) => {
        if (data.url) {
          let authResponse = data.url.split(":")[1];
          if (authResponse) {
            window.location.href = window.location.href + '?authResponse=' + authResponse;
          }
        }
      });
    }
  }

  render() {
    return (
      <ion-app>
        <ion-router useHash={false}>
          <ion-route url="/" component="app-signin" />
          <ion-route url="/profile/" component="app-profile" />
          <ion-route url="/photos/" component="app-photos" />
          <ion-route url="/photos/photo/:photoId" component="app-photos" />
          <ion-route url="/photo/:photoId" component="app-photo" />
        </ion-router>
        <ion-nav />
        <ion-alert-controller />
        <ion-action-sheet-controller />
        <ion-loading-controller />
        <ion-toast-controller />
        <ion-modal-controller />
      </ion-app>
    );
  }
}
