import { Component, Prop, State, Watch, h } from '@stencil/core';
import loadImage from 'blueimp-load-image';

import PhotosService from '../services/photos-service';
import { PhotoType } from '../models/photo-type';

@Component({
  tag: 'block-img'
})
export class BlockImg {
  @Prop() photoId: string;
  @Prop() rotate: boolean;
  @Prop() refresh: number;
  @Prop() phototType: PhotoType = PhotoType.Download;
  @Prop() decrypt = true;

  @State() source: string;
  @State() isLoaded: boolean;
  @State() rotation: number;

  constructor() {
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
  refreshDidUpdate(newValue: number, oldValue: number): void {
    if (newValue !== oldValue) {
      this.getPhoto(newValue);
    }
  }

  async getPhoto(newRotation?: number): Promise<void> {
    const { photoId, rotate } = this;
    let rotation = 1;

    if (photoId === null) {
      this.source =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
      return;
    }

    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      photoId,
      null,
      this.decrypt
    );
    const photo = await PhotosService.loadPhoto(
      metadata,
      this.phototType,
      true,
      null,
      this.decrypt
    );
    let base64: string;
    if (photo) {
      base64 = photo.base64;
    }
    if (newRotation) {
      rotation = newRotation;
    } else if (
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      rotation = metadata.stats.exifdata.tags.Orientation;
      // Handle correct orientation for iOS
      if (
        this.iOS() &&
        photo.phototType === PhotoType.Download &&
        metadata.stats.exifdata.tags.OriginalOrientation
      ) {
        const originalOrientation =
          metadata.stats.exifdata.tags.OriginalOrientation;
        // If the orientation is unchanged don't rotate at all with CSS, iOS handles it automatic
        if (rotation === originalOrientation) {
          rotation = 1;
        } else if (rotation === 1 && originalOrientation === 6) {
          rotation = 8;
        } else if (rotation === 1) {
          rotation = originalOrientation;
        } else if (rotation === 3 && originalOrientation === 6) {
          rotation = 6;
        } else if (rotation === 8 && originalOrientation === 6) {
          rotation = 3;
        } else if (rotation === 3 && originalOrientation === 8) {
          rotation = 6;
        } else if (rotation === 6 && originalOrientation === 8) {
          rotation = 3;
        } else if (rotation === 8 && originalOrientation === 3) {
          rotation = 6;
        } else if (rotation === 6 && originalOrientation === 3) {
          rotation = 8;
        }
      }
    }

    // Set photo orientation from exif
    if (rotate) {
      const imageOptions = {
        orientation: rotation
      };
      loadImage(
        base64,
        processedPhoto => {
          this.handleProcessedPhoto(processedPhoto);
        },
        imageOptions
      );
    } else {
      this.rotation = rotation;
      this.source = base64;
    }
  }

  handleProcessedPhoto(processedPhoto: any): void {
    if (processedPhoto.type === 'error') {
      // TODO: show error message
    } else if (processedPhoto.tagName === 'CANVAS') {
      this.source = processedPhoto.toDataURL();
    } else {
      this.source = processedPhoto.src;
    }
  }

  iOS(): boolean {
    const iDevices = [
      'iPad Simulator',
      'iPhone Simulator',
      'iPod Simulator',
      'iPad',
      'iPhone',
      'iPod'
    ];

    if (navigator.platform) {
      while (iDevices.length) {
        if (navigator.platform === iDevices.pop()) {
          return true;
        }
      }
    }

    return false;
  }

  preventDrag(event: any): boolean {
    event.preventDefault();
    return false;
  }

  photoLoaded() {
    this.isLoaded = true;
  }

  render() {
    const { isLoaded, source, rotation } = this;

    return [
      <ion-img
        no-padding
        draggable={false}
        src={source}
        class={'rotation-' + rotation + ' ' + (isLoaded ? '' : 'hidden')}
        onDragStart={event => this.preventDrag(event)}
        onIonImgDidLoad={() => this.photoLoaded()}
      />,
      <ion-spinner
        name="circles"
        color="tertiary"
        class={isLoaded ? 'hidden' : ''}
      />
    ];
  }
}
