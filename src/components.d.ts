/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */


import '@stencil/core';

import '@ionic/core';
import 'ionicons';
import {
  PhotoType,
} from './models/photo-type';


export namespace Components {

  interface BlockImg {
    'decrypt': boolean;
    'photoId': string;
    'phototType': PhotoType;
    'refresh': number;
    'rotate': boolean;
  }
  interface BlockImgAttributes extends StencilHTMLAttributes {
    'decrypt'?: boolean;
    'photoId'?: string;
    'phototType'?: PhotoType;
    'refresh'?: number;
    'rotate'?: boolean;
  }

  interface FilterPopover {
    'selectedPhotos': any[];
  }
  interface FilterPopoverAttributes extends StencilHTMLAttributes {
    'selectedPhotos'?: any[];
  }

  interface SelectAlbum {
    'endCallback': any;
    'selectedPhotos': any[];
    'startCallback': any;
  }
  interface SelectAlbumAttributes extends StencilHTMLAttributes {
    'endCallback'?: any;
    'selectedPhotos'?: any[];
    'startCallback'?: any;
  }

  interface AppAlbums {}
  interface AppAlbumsAttributes extends StencilHTMLAttributes {}

  interface AppPhoto {
    'albumId': string;
    'decrypt': boolean;
    'photoId': string;
    'updateCallback': any;
  }
  interface AppPhotoAttributes extends StencilHTMLAttributes {
    'albumId'?: string;
    'decrypt'?: boolean;
    'photoId'?: string;
    'updateCallback'?: any;
  }

  interface AppPhotos {
    'albumId': string;
    'photoId': string;
    'sharing': boolean;
  }
  interface AppPhotosAttributes extends StencilHTMLAttributes {
    'albumId'?: string;
    'photoId'?: string;
    'sharing'?: boolean;
  }

  interface AppRoot {}
  interface AppRootAttributes extends StencilHTMLAttributes {}

  interface AppSettings {}
  interface AppSettingsAttributes extends StencilHTMLAttributes {}

  interface AppShared {
    'photoId': string;
    'username': string;
  }
  interface AppSharedAttributes extends StencilHTMLAttributes {
    'photoId'?: string;
    'username'?: string;
  }

  interface AppSignin {}
  interface AppSigninAttributes extends StencilHTMLAttributes {}
}

declare global {
  interface StencilElementInterfaces {
    'BlockImg': Components.BlockImg;
    'FilterPopover': Components.FilterPopover;
    'SelectAlbum': Components.SelectAlbum;
    'AppAlbums': Components.AppAlbums;
    'AppPhoto': Components.AppPhoto;
    'AppPhotos': Components.AppPhotos;
    'AppRoot': Components.AppRoot;
    'AppSettings': Components.AppSettings;
    'AppShared': Components.AppShared;
    'AppSignin': Components.AppSignin;
  }

  interface StencilIntrinsicElements {
    'block-img': Components.BlockImgAttributes;
    'filter-popover': Components.FilterPopoverAttributes;
    'select-album': Components.SelectAlbumAttributes;
    'app-albums': Components.AppAlbumsAttributes;
    'app-photo': Components.AppPhotoAttributes;
    'app-photos': Components.AppPhotosAttributes;
    'app-root': Components.AppRootAttributes;
    'app-settings': Components.AppSettingsAttributes;
    'app-shared': Components.AppSharedAttributes;
    'app-signin': Components.AppSigninAttributes;
  }


  interface HTMLBlockImgElement extends Components.BlockImg, HTMLStencilElement {}
  var HTMLBlockImgElement: {
    prototype: HTMLBlockImgElement;
    new (): HTMLBlockImgElement;
  };

  interface HTMLFilterPopoverElement extends Components.FilterPopover, HTMLStencilElement {}
  var HTMLFilterPopoverElement: {
    prototype: HTMLFilterPopoverElement;
    new (): HTMLFilterPopoverElement;
  };

  interface HTMLSelectAlbumElement extends Components.SelectAlbum, HTMLStencilElement {}
  var HTMLSelectAlbumElement: {
    prototype: HTMLSelectAlbumElement;
    new (): HTMLSelectAlbumElement;
  };

  interface HTMLAppAlbumsElement extends Components.AppAlbums, HTMLStencilElement {}
  var HTMLAppAlbumsElement: {
    prototype: HTMLAppAlbumsElement;
    new (): HTMLAppAlbumsElement;
  };

  interface HTMLAppPhotoElement extends Components.AppPhoto, HTMLStencilElement {}
  var HTMLAppPhotoElement: {
    prototype: HTMLAppPhotoElement;
    new (): HTMLAppPhotoElement;
  };

  interface HTMLAppPhotosElement extends Components.AppPhotos, HTMLStencilElement {}
  var HTMLAppPhotosElement: {
    prototype: HTMLAppPhotosElement;
    new (): HTMLAppPhotosElement;
  };

  interface HTMLAppRootElement extends Components.AppRoot, HTMLStencilElement {}
  var HTMLAppRootElement: {
    prototype: HTMLAppRootElement;
    new (): HTMLAppRootElement;
  };

  interface HTMLAppSettingsElement extends Components.AppSettings, HTMLStencilElement {}
  var HTMLAppSettingsElement: {
    prototype: HTMLAppSettingsElement;
    new (): HTMLAppSettingsElement;
  };

  interface HTMLAppSharedElement extends Components.AppShared, HTMLStencilElement {}
  var HTMLAppSharedElement: {
    prototype: HTMLAppSharedElement;
    new (): HTMLAppSharedElement;
  };

  interface HTMLAppSigninElement extends Components.AppSignin, HTMLStencilElement {}
  var HTMLAppSigninElement: {
    prototype: HTMLAppSigninElement;
    new (): HTMLAppSigninElement;
  };

  interface HTMLElementTagNameMap {
    'block-img': HTMLBlockImgElement
    'filter-popover': HTMLFilterPopoverElement
    'select-album': HTMLSelectAlbumElement
    'app-albums': HTMLAppAlbumsElement
    'app-photo': HTMLAppPhotoElement
    'app-photos': HTMLAppPhotosElement
    'app-root': HTMLAppRootElement
    'app-settings': HTMLAppSettingsElement
    'app-shared': HTMLAppSharedElement
    'app-signin': HTMLAppSigninElement
  }

  interface ElementTagNameMap {
    'block-img': HTMLBlockImgElement;
    'filter-popover': HTMLFilterPopoverElement;
    'select-album': HTMLSelectAlbumElement;
    'app-albums': HTMLAppAlbumsElement;
    'app-photo': HTMLAppPhotoElement;
    'app-photos': HTMLAppPhotosElement;
    'app-root': HTMLAppRootElement;
    'app-settings': HTMLAppSettingsElement;
    'app-shared': HTMLAppSharedElement;
    'app-signin': HTMLAppSigninElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
