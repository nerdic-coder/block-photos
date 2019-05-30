import { Component, Prop, State } from '@stencil/core';
import { Plugins } from '@capacitor/core';
import * as Sentry from '@sentry/browser';

import AnalyticsService from '../../services/analytics-service';
import CacheService from '../../services/cache-service';
import SettingsService from '../../services/settings-service';

declare var blockstack;

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css'
})
export class AppRoot {
  @Prop({ connect: 'ion-toast-controller' })
  toastCtrl: HTMLIonToastControllerElement;

  @State() isAuthenticated: boolean;

  /**
   * Handle service worker updates correctly.
   * This code will show a toast letting the
   * user of the PWA know that there is a
   * new version available. When they click the
   * reload button it then reloads the page
   * so that the new service worker can take over
   * and serve the fresh content
   */
  // @Listen('window:swUpdate')
  // async onSWUpdate() {
  //   const toast = await this.toastCtrl.create({
  //     message: 'New version available',
  //     showCloseButton: true,
  //     closeButtonText: 'Reload'
  //   });
  //   await toast.present();
  //   await toast.onWillDismiss();
  //   window.location.reload();
  // }

  async componentWillLoad() {
    console.log('AppRoot componentWillLoad 1');
    try {
      if (await SettingsService.getAnalyticsSetting(true)) {
        console.log('AppRoot componentWillLoad 2');
        Sentry.init({
          dsn: 'https://2b0b525209b646f49e438cff86c3e117@sentry.io/1331915',
          release: 'block-photos@4.0'
        });
      }
    } catch (error) {
      console.log('AppRoot componentWillLoad 3');
      Sentry.init({
        dsn: 'https://2b0b525209b646f49e438cff86c3e117@sentry.io/1331915',
        release: 'block-photos@4.0'
      });
    }

    this.initCapacitor();

    console.log('AppRoot componentWillLoad 4');
    const userSession = new blockstack.UserSession();
    console.log('AppRoot componentWillLoad 5');
    this.isAuthenticated = userSession.isUserSignedIn();
    console.log('AppRoot componentWillLoad 6');
  }

  async componentDidLoad() {
    console.log('AppRoot componentDidLoad 1');
    const router: any = document.querySelector('ion-router');
    await router.componentOnReady();
    console.log('AppRoot componentDidLoad 2');
    router.addEventListener('ionRouteDidChange', () => {
      const userSession = new blockstack.UserSession();
      this.isAuthenticated = userSession.isUserSignedIn();
    });
  }

  async initCapacitor() {
    const { Device } = Plugins;

    const device = await Device.getInfo();
    if (device.platform !== 'web') {
      const { App, StatusBar } = Plugins;
      StatusBar.setBackgroundColor({ color: '#220631' });

      App.addListener('appUrlOpen', data => {
        if (data.url) {
          const authResponse = data.url.split(':')[1];
          if (authResponse) {
            window.location.href =
              window.location.href + '?authResponse=' + authResponse;
          }
        }
      });
    }
  }

  async handleSignOut() {
    // Clear all the users cache in localStorage
    CacheService.clear();
    // End users Blockstack session
    const userSession = new blockstack.UserSession();
    userSession.signUserOut();

    AnalyticsService.logEvent('logged-out');
  }

  render() {
    return [
      <ion-app>
        <ion-router useHash={true}>
          <ion-route url="/" component="app-signin" />
          <ion-route url="/settings/" component="app-settings" />
          <ion-route url="/photos/" component="app-photos" />
          <ion-route url="/album/:albumId" component="app-photos" />
          <ion-route url="/photo/:photoId" component="app-photo" />
          <ion-route url="/albums/" component="app-albums" />
        </ion-router>
        <ion-split-pane disabled={!this.isAuthenticated}>
          <ion-menu side="end" menuId="first">
            <ion-header>
              <ion-toolbar mode="md" color="primary">
                <ion-title>Menu</ion-title>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-list>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/photos">
                    <ion-icon slot="start" color="primary" name="photos" />
                    <ion-label>Photos</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/albums">
                    <ion-icon slot="start" color="primary" name="albums" />
                    <ion-label>Albums</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/settings">
                    <ion-icon slot="start" color="primary" name="settings" />
                    <ion-label>Settings</ion-label>
                  </ion-item>
                </ion-menu-toggle>
                <ion-menu-toggle autoHide={false}>
                  <ion-item href="/" onClick={() => this.handleSignOut()}>
                    <ion-icon slot="start" color="primary" name="lock" />
                    <ion-label>Logout</ion-label>
                  </ion-item>
                </ion-menu-toggle>
              </ion-list>
            </ion-content>
          </ion-menu>
          <ion-router-outlet animated={true} main />
        </ion-split-pane>
        <ion-alert-controller />
        <ion-action-sheet-controller />
        <ion-loading-controller />
        <ion-popover-controller />
        <ion-toast-controller />
        <ion-modal-controller />
      </ion-app>
    ];
  }
}
