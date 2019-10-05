import {
  actionSheetController,
  alertController,
  loadingController,
  toastController
} from '@ionic/core';

import PhotosService from './photos-service';
import isElectron from 'is-electron';

export default class PresentingService {
  private loadingElement: HTMLIonLoadingElement;

  async loading(message: string, duration?: number): Promise<void> {
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

  async presentToolbarLoader(message: string): Promise<void> {
    const loadingToolbar = document.querySelector('.loadingToolbar');

    if (loadingToolbar) {
      const loadingTitle = loadingToolbar.querySelector('ion-title');
      loadingTitle.innerText = message;
      loadingToolbar.classList.add('show');
    }
  }

  toolbarLoaderIsPresent(): boolean {
    const loadingToolbar = document.querySelector('.loadingToolbar');

    if (loadingToolbar) {
      return loadingToolbar.classList.contains('show');
    } else {
      return false;
    }
  }

  async dismissToolbarLoader(): Promise<void> {
    const loadingToolbar = document.querySelector('.loadingToolbar');

    if (loadingToolbar) {
      const loadingTitle = loadingToolbar.querySelector('ion-title');
      loadingTitle.innerText = '';
      loadingToolbar.classList.remove('show');
    }
  }

  async toast(message: string): Promise<void> {
    const toast = await toastController.create({
      message,
      showCloseButton: true,
      color: 'primary'
    });
    return toast.present();
  }

  async deletePhotos(
    ids: string[],
    endCallback: any,
    albumId?: string,
    startCallback?: any
  ): Promise<void> {
    if (!ids || ids.length < 1) {
      return;
    }

    let header = 'Delete ' + ids.length + ' photos?';
    if (ids.length === 1) {
      header = 'Delete ' + ids.length + ' photo?';
    }

    let buttons = [
      {
        text: 'Delete from app',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          if (startCallback) {
            startCallback();
          }

          PhotosService.deletePhotos(ids).then(async result => {
            if (result === true) {
              endCallback();
            } else {
              this.errorAlert(
                'Removal failed',
                'The removal of some photos failed. Please try again in a few minutes!'
              );
              endCallback();
            }
          });
        }
      }
    ];

    if (albumId && albumId === 'shared-list.json') {
      buttons = [
        {
          text: 'Remove from shared photos',
          role: 'destructive',
          icon: 'remove-circle',
          handler: () => {
            if (startCallback) {
              startCallback();
            }

            PhotosService.deletePhotos(ids, false).then(async result => {
              if (result === true) {
                endCallback();
              } else {
                this.errorAlert(
                  'Removal failed',
                  'The removal of some photos failed. Please try again in a few minutes!'
                );
                endCallback();
              }
            });
          }
        }
      ];
    } else if (albumId) {
      buttons.push({
        text: 'Remove from album',
        role: 'destructive',
        icon: 'remove-circle',
        handler: () => {
          if (startCallback) {
            startCallback();
          }
          PhotosService.removePhotosFromList(ids, albumId).then(
            async result => {
              if (result === true) {
                endCallback();
              } else {
                this.errorAlert(
                  'Removal failed',
                  'The removal of some photos failed. Please try again in a few minutes!'
                );
                endCallback();
              }
            }
          );
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
    const alert = await alertController.create({
      header,
      subHeader: '',
      message,
      buttons: ['OK']
    });
    return alert.present();
  }

  openLink(url: string, target?: string): void {
    if (isElectron()) {
      const electron = window['require']('electron');
      electron.shell.openExternal(url);
    } else {
      window.open(url, target);
    }
  }
}
