import { Component, Prop, State, Watch } from '@stencil/core';
import loadImage from 'blueimp-load-image';

import PhotosService from '../services/photos-service';

@Component({
  tag: 'block-img'
})
export class BlockImg {

  @Prop() photoId: string;
  @Prop() rotate: boolean;
  @Prop() refresh: boolean;

  @State() base64: string;
  @State() source: string;
  @State() isLoaded: boolean;
  @State() rotation: number;

  private photosService: PhotosService;

  constructor() {

    this.photosService = new PhotosService();
    this.rotation = 1;
  }

  componentWillLoad(): void {

    this.getPhoto();
  }

  @Watch('photoId')
  photoIdDidUpdate(newValue: string, oldValue: string): void {
    if (newValue !== oldValue) {
      this.getPhoto();
    }
  }

  @Watch('refresh')
  refreshDidUpdate(newValue: string, oldValue: string): void {
    if (newValue !== oldValue) {
      this.getPhoto();
    }
  }

  async getPhoto(): Promise<void> {
    const { photoId, rotate } = this;

    if (photoId === 'loading') {
      this.source = '';
      return;
    }

    const metadata = await this.photosService.getPhotoMetaData(photoId);

    const base64 = await this.photosService.loadPhoto(photoId);

    let rotation = 1;
    if (metadata && metadata.stats && metadata.stats.exifdata
      && metadata.stats.exifdata.tags.Orientation) {
        rotation = metadata.stats.exifdata.tags.Orientation;
        // Handle correct orientation for iOS
        if (this.iOS() && metadata.stats.exifdata.tags.OriginalOrientation) {
          const originalOrientation = metadata.stats.exifdata.tags.OriginalOrientation;
          // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
          if (rotation === originalOrientation) {
            rotation = 1;
          } else if (rotation === 1
            && originalOrientation === 6) {
              rotation = 8;
          } else if (rotation === 1) {
            rotation = originalOrientation;
          } else if (rotation === 3
            && originalOrientation === 6) {
              rotation = 6;
          } else if (rotation === 8
            && originalOrientation === 6) {
              rotation = 3;
          } else if (rotation === 3
            && originalOrientation === 8) {
              rotation = 6;
          } else if (rotation === 6
            && originalOrientation === 8) {
              rotation = 3;
          } else if (rotation === 8
            && originalOrientation === 3) {
              rotation = 6;
          } else if (rotation === 6
            && originalOrientation === 3) {
              rotation = 8;
          }
        }
    }

    // Set photo orientation from exif if it exist
    if (rotate && metadata && metadata.stats && metadata.stats.exifdata
      && metadata.stats.exifdata.tags.Orientation && rotation !== 1) {
        const imageOptions = { orientation: metadata.stats.exifdata.tags.Orientation };
        loadImage(base64, (processedPhoto) => {
          this.handleProcessedPhoto(processedPhoto);
        }, imageOptions);
    } else {
      this.source = base64;
      this.isLoaded = true;
      this.rotation = rotation;
    }

  }

  handleProcessedPhoto(processedPhoto: any): void {
    if (processedPhoto.type === "error") {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS') {
      this.source = processedPhoto.toDataURL();
      this.isLoaded = true;
    } else {
      this.source = processedPhoto.src;
      this.isLoaded = true;
    }
  }

  iOS(): boolean {

    var iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()){ return true; }
      }
    }

    return false;
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
  }

  render() {
    const { isLoaded, source, rotation } = this;
    if (isLoaded && source && this.photoId !== 'loading') {
      return (
        <img alt={this.photoId} draggable={false} src={source} class={ "rotation-" + rotation } onDragStart={(event) => this.preventDrag(event)} />
      );
    } else {
      return (
        <ion-spinner name="circles" color="tertiary" />
      );
    }
  }

}
