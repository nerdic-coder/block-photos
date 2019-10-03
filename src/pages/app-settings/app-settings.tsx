import { Component, h } from '@stencil/core';
import PresentingService from '../../services/presenting-service';
import AnalyticsService from '../../services/analytics-service';
// import SettingsService from '../../services/settings-service';
import CacheService from '../../services/cache-service';

@Component({
  tag: 'app-settings'
})
export class AppSettings {
  private present: PresentingService;

  // @State() allowAnalytics: boolean;

  constructor() {
    this.present = new PresentingService();
  }

  async componentWillLoad() {
    // this.allowAnalytics = await SettingsService.getAnalyticsSetting();
    AnalyticsService.logEvent('settings-page');
  }

  visitBlockstackProfile(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink('https://browser.blockstack.org/profiles', '_blank');

    AnalyticsService.logEvent('blockstack-profile-link');
  }

  reportIssue(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink(
      'https://github.com/nerdic-coder/block-photos/issues/new',
      '_blank'
    );

    AnalyticsService.logEvent('report-issue-link');
  }

  donateCrypto(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink(
      'https://commerce.coinbase.com/checkout/9d35f08b-bd51-40b0-a502-b88250cffc6b',
      '_blank'
    );

    AnalyticsService.logEvent('donate-crypto-link');
  }

  upvoteProductHunt(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink(
      'https://www.producthunt.com/posts/block-photos',
      '_blank'
    );

    AnalyticsService.logEvent('product-hunt-link');
  }

  twitter(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink('https://twitter.com/Block_Photos', '_blank');

    AnalyticsService.logEvent('twitter-link');
  }

  github(event: any): void {
    if (event) {
      event.preventDefault();
    }

    this.present.openLink(
      'https://github.com/nerdic-coder/block-photos',
      '_blank'
    );

    AnalyticsService.logEvent('github-link');
  }

  sendEmail(event: any): void {
    if (event) {
      event.preventDefault();
    }
    this.present.openLink(
      'mailto:johan@block-photos.com?subject=Block Photos Feedback'
    );

    AnalyticsService.logEvent('send-email-link');
  }

  // changeAnalyticsSetting() {
  //   SettingsService.setAnalyticsSetting(!this.allowAnalytics);
  // }

  async clearCache(event) {
    if (event) {
      event.preventDefault();
    }
    const actionSheetController: any = document.querySelector(
      'ion-action-sheet-controller'
    );

    const buttons = [
      {
        text: 'Clear cache',
        role: 'destructive',
        icon: 'reverse-camera',
        handler: () => {
          CacheService.clear();
        }
      }
    ];

    buttons.push({
      text: 'Cancel',
      icon: 'close',
      role: 'cancel',
      handler: null
    });

    const actionSheet = await actionSheetController.create({
      header: 'Are you sure you want to clear the cache?',
      buttons
    });
    await actionSheet.present();
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar mode="md" color="primary">
          <ion-title>Settings</ion-title>
          <ion-buttons slot="end">
            <ion-menu-toggle>
              <ion-button fill="outline" color="secondary">
                <ion-label color="light">Menu</ion-label>
              </ion-button>
            </ion-menu-toggle>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>,

      <ion-content>
        {/* <ion-card>
          <ion-item>
            <ion-label>Share Analytics Data</ion-label>
            <ion-toggle
              slot="end"
              value="analytics"
              checked={this.allowAnalytics}
              onIonChange={() => this.changeAnalyticsSetting()}
            />
          </ion-item>
          <ion-item>
            <p>
              Help Block Photos improve the app by automatically share daily
              diagnostic and usage data. None of your photos or personal
              information will be tracked.
            </p>
          </ion-item>
        </ion-card> */}
        <ion-card>
          <ion-item
            class="pointer"
            onClick={event => this.clearCache(event)}
            detail={false}
          >
            <ion-icon name="reverse-camera" slot="end" color="primary" />
            <ion-label>Clear photos cache</ion-label>
          </ion-item>
          <ion-item>
            <p>
              Photos starting to take up too much space? Empty the photos cache
              here to clear up some space on your device.
            </p>
          </ion-item>
        </ion-card>

        <ion-card>
          <ion-item
            detail
            class="pointer"
            onClick={event => this.visitBlockstackProfile(event)}
          >
            <ion-icon name="person" slot="start" color="primary" />
            <ion-label>Go to profile on Blockstack</ion-label>
          </ion-item>

          <ion-item
            detail
            class="pointer"
            onClick={event => this.sendEmail(event)}
          >
            <ion-icon name="mail" slot="start" color="primary" />
            <ion-label text-wrap>Email johan@block-photos.com</ion-label>
          </ion-item>

          <ion-item
            detail
            class="pointer"
            onClick={event => this.reportIssue(event)}
          >
            <ion-icon name="bug" slot="start" color="danger" />
            <ion-label>Report issue</ion-label>
          </ion-item>
        </ion-card>
        <ion-card>
          <ion-item
            detail
            class="pointer"
            onClick={event => this.donateCrypto(event)}
          >
            <ion-icon name="logo-bitcoin" slot="start" color="primary" />
            <ion-label>Donate with Crypto</ion-label>
          </ion-item>
          <ion-item
            detail
            class="pointer"
            onClick={event => this.upvoteProductHunt(event)}
          >
            <ion-icon name="thumbs-up" slot="start" color="primary" />
            <ion-label>Upvote on Product Hunt</ion-label>
          </ion-item>
          <ion-item
            detail
            class="pointer"
            onClick={event => this.twitter(event)}
          >
            <ion-icon name="logo-twitter" slot="start" color="primary" />
            <ion-label>Follow us on Twitter</ion-label>
          </ion-item>
          <ion-item
            detail
            class="pointer"
            onClick={event => this.github(event)}
          >
            <ion-icon name="logo-github" slot="start" color="primary" />
            <ion-label>Read our source code</ion-label>
          </ion-item>
        </ion-card>
        <p text-center="true">Block Photos - Version 5.0</p>
      </ion-content>
    ];
  }
}
