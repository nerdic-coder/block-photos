import { Component, Listen, State, h } from '@stencil/core';
import { Plugins } from '@capacitor/core';
import localForage from 'localforage';

import AnalyticsService from '../../services/analytics-service';
import CacheService from '../../services/cache-service';
import SettingsService from '../../services/settings-service';

declare var blockstack;

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css'
})
export class AppRoot {
  private toastCtrl: any;

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
  @Listen('swUpdate', { target: 'window' })
  async onSWUpdate() {
    this.toastCtrl = document.querySelector('ion-toast-controller');
    const toast = await this.toastCtrl.create({
      message: 'New version available',
      showCloseButton: true,
      closeButtonText: 'Reload'
    });
    await toast.present();
    await toast.onWillDismiss();
    window.location.reload();
  }

  async componentWillLoad() {
    localForage.config({
      name: 'BlockPhotos',
      version: 1.0,
      storeName: 'blockphotos', // Should be alphanumeric, with underscores.
      description: 'Block Photos Cache'
    });

    this.initCapacitor();

    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    this.isAuthenticated = userSession.isUserSignedIn();
  }

  async componentDidLoad() {
    const router: any = document.querySelector('ion-router');
    await router.componentOnReady();
    router.addEventListener('ionRouteDidChange', () => {
      const appConfig = SettingsService.getAppConfig();
      const userSession = new blockstack.UserSession({ appConfig });
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
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    userSession.signUserOut();

    AnalyticsService.logEvent('logged-out');
  }

  render() {
    return [
      <ion-app>
        <ion-router useHash={true}>
          <ion-route url="/" component="app-signin" />
          <ion-route url="/settings/" component="app-settings" />
          <ion-route
            url="/photos/"
            component="app-photos"
            componentProps={{ sharing: false }}
          />
          <ion-route
            url="/album/:albumId"
            component="app-photos"
            componentProps={{ sharing: false }}
          />
          <ion-route url="/photo/:photoId" component="app-photo" />
          <ion-route url="/shared/:username/:photoId" component="app-shared" />
          <ion-route
            url="/sharing/"
            component="app-photos"
            componentProps={{ sharing: true }}
          />
          <ion-route url="/albums/" component="app-albums" />
        </ion-router>
        <ion-split-pane
          disabled={!this.isAuthenticated}
          content-id="menu-content"
        >
          <ion-menu side="end" menuId="first" content-id="menu-content">
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
                  <ion-item href="/sharing">
                    <ion-icon slot="start" color="primary" name="share" />
                    <ion-label>Sharing</ion-label>
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
          <ion-router-outlet animated={true} id="menu-content" />
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
