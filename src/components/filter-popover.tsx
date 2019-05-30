import { Component, Prop } from '@stencil/core';
import { RangeChangeEventDetail, RangeValue } from '@ionic/core';

declare var Caman;
// import PresentingService from '../services/presenting-service';
// import PhotosService from '../services/photos-service';

@Component({
  tag: 'filter-popover'
})
export class FilterPopover {
  @Prop() selectedPhotos: any[] = [];

  private brightness: RangeValue = 0;
  private contrast: RangeValue = 0;
  private saturation: RangeValue = 0;

  async closePopover() {
    const popoverController = document.querySelector('ion-popover-controller');
    await popoverController.componentOnReady();
    popoverController.dismiss();
    this.selectedPhotos = null;
  }

  setBrightness(event: CustomEvent<RangeChangeEventDetail>) {
    console.log(event.detail.value);
    this.brightness = event.detail.value;
    this.applyFilters();
  }

  setSaturation(event: CustomEvent<RangeChangeEventDetail>) {
    console.log(event.detail.value);
    this.saturation = event.detail.value;
    this.applyFilters();
  }

  setContrast(event: CustomEvent<RangeChangeEventDetail>) {
    console.log(event.detail.value);
    this.contrast = event.detail.value;
    this.applyFilters();
  }

  applyFilters() {
    const brightness = this.brightness;
    const contrast = this.contrast;
    const saturation = this.saturation;
    // const photoId = this.selectedPhotos[0];

    Caman('#img-' + this.selectedPhotos[0], function() {
      // this.greyscale();
      this.revert(false);
      this.brightness(brightness);
      this.contrast(contrast);
      this.saturation(saturation);
      this.render(async () => {
        // const result = await PhotosService.updatePhoto(photoId, this.toBase64());
        // console.log('Caman result ', result);
      });
    });
  }

  render() {
    return (
      <ion-list>
        <ion-list-header>
          <ion-label>Filters</ion-label>
        </ion-list-header>

        <ion-item-divider>
          <ion-label>Brightness</ion-label>
        </ion-item-divider>
        <ion-item>
          <ion-range
            onIonChange={event => this.setBrightness(event)}
            min={-100}
            max={100}
            color="secondary"
            pin={true}
          >
            <ion-label slot="start">-100</ion-label>
            <ion-label slot="end">100</ion-label>
          </ion-range>
        </ion-item>

        <ion-item-divider>
          <ion-label>Contrast</ion-label>
        </ion-item-divider>
        <ion-item>
          <ion-range
            onIonChange={event => this.setContrast(event)}
            min={-100}
            max={100}
            color="secondary"
            pin={true}
          >
            <ion-label slot="start">-100</ion-label>
            <ion-label slot="end">100</ion-label>
          </ion-range>
        </ion-item>

        <ion-item-divider>
          <ion-label>Saturation</ion-label>
        </ion-item-divider>
        <ion-item>
          <ion-range
            onIonChange={event => this.setSaturation(event)}
            min={-100}
            max={100}
            color="secondary"
            pin={true}
          >
            <ion-label slot="start">-100</ion-label>
            <ion-label slot="end">100</ion-label>
          </ion-range>
        </ion-item>
      </ion-list>
    );
  }
}
