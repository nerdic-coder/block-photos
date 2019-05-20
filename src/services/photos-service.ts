import StorageService from './storage-service';
import imageCompression from 'browser-image-compression';
import Compressor from 'compressorjs';

import AlbumsService from './albums-service';
import { PhotoType } from '../models/photo-type';

export default class PhotosService {
  static async getPhotosList(
    updateCache?: boolean,
    albumId?: string
  ): Promise<any> {
    let cachedPhotosList = [];
    const errorsList = [];
    try {
      const rawCachedPhotosList = albumId
        ? await StorageService.getItem(albumId, updateCache)
        : await StorageService.getItem('picture-list.json', updateCache);

      if (rawCachedPhotosList) {
        cachedPhotosList = JSON.parse(rawCachedPhotosList);
      } else {
        errorsList.push('err_list');
      }
    } catch (error) {
      errorsList.push('err_list');
    }

    return {
      photosList: cachedPhotosList,
      errorsList
    };
  }

  static async loadPhoto(
    metadata: PhotoMetadata,
    photoType?: PhotoType
  ): Promise<any> {
    const mainId = metadata.id;
    if (photoType === PhotoType.Thumbnail) {
      metadata.id = metadata.id + '-thumbnail';
    } else if (photoType === PhotoType.Viewer) {
      metadata.id = metadata.id + '-viewer';
    }
    let rawPhoto = await StorageService.getItem(metadata.id);
    if (!rawPhoto && photoType === PhotoType.Thumbnail) {
      rawPhoto = await StorageService.getItem(mainId);
      const thumbnailData = await PhotosService.compressPhoto(
        await imageCompression.getFilefromDataUrl(rawPhoto),
        PhotoType.Thumbnail,
        metadata.type
      );
      await StorageService.setItem(mainId + '-thumbnail', thumbnailData);
      rawPhoto = thumbnailData;
    } else if (!rawPhoto && photoType === PhotoType.Viewer) {
      rawPhoto = await StorageService.getItem(mainId);
      const viewerData = await PhotosService.compressPhoto(
        await imageCompression.getFilefromDataUrl(rawPhoto),
        PhotoType.Viewer,
        metadata.type
      );
      await StorageService.setItem(mainId + '-viewer', viewerData);
      rawPhoto = viewerData;
    }

    if (!rawPhoto) {
      return false;
    }

    if (rawPhoto && !rawPhoto.match('data:image/.*')) {
      metadata.type
        ? (rawPhoto = 'data:' + metadata.type + ';base64,' + rawPhoto)
        : (rawPhoto = 'data:image/jpeg;base64,' + rawPhoto);
    }
    return rawPhoto;
  }

  static async uploadPhoto(
    metadata: PhotoMetadata,
    data: any,
    albumId?: string,
    thumbnailData?: any,
    viewerData?: any
  ): Promise<any> {
    const photosListResponse = await PhotosService.getPhotosList(true);
    let photosList = photosListResponse.photosList;
    if (
      (!photosList || photosList == null) &&
      photosListResponse.errorsList.length === 0
    ) {
      photosList = [];
    }

    let album = [];
    if (albumId) {
      const albumsResponse = await PhotosService.getPhotosList(true, albumId);
      album = albumsResponse.photosList;
      if ((!album || album == null) && albumsResponse.errorsList.length === 0) {
        album = [];
      }
    }

    const errorsList = [];
    const listdata = {
      id: metadata.id,
      filename: metadata.filename
    };

    try {
      // Save raw data to a file
      await StorageService.setItem(metadata.id, data);
      if (thumbnailData) {
        await StorageService.setItem(metadata.id + '-thumbnail', thumbnailData);
      }
      if (viewerData) {
        await StorageService.setItem(metadata.id + '-viewer', viewerData);
      }
      // Save photos metadata to a file
      await StorageService.setItem(
        metadata.id + '-meta',
        JSON.stringify(metadata)
      );

      photosList.unshift(listdata);
      if (albumId) {
        await AlbumsService.updateAlbumThumbnail(albumId, metadata.id);

        album.unshift(listdata);
      }
    } catch (error) {
      const fileSizeInMegabytes = metadata.stats.size / 1000000;
      if (fileSizeInMegabytes >= 5) {
        errorsList.push({
          id: metadata.filename,
          errorCode: 'err_filesize'
        });
      } else {
        errorsList.push({
          id: metadata.filename,
          errorCode: 'err_failed'
        });
      }
    }

    await StorageService.setItem(
      'picture-list.json',
      JSON.stringify(photosList)
    );

    if (albumId) {
      await StorageService.setItem(albumId, JSON.stringify(album));
    }

    return { photosList, errorsList };
  }

  static async compressPhoto(
    itemValue: any,
    photoType?: PhotoType,
    mimeType = 'image/jpeg'
  ) {
    try {
      return new Promise(async resolve => {
        if (photoType === PhotoType.Thumbnail) {
          const compressor = new Compressor(itemValue, {
            quality: 0.4,
            maxWidth: 500,
            mimeType,
            checkOrientation: false,
            success(result) {
              const reader = new FileReader();

              reader.addEventListener('loadend', () => {
                // reader.result contains the contents of blob as a DataURL
                resolve(reader.result);
              });
              reader.readAsDataURL(result);
            },
            error(err) {
              console.log(err.message);
            }
          });
          console.debug(compressor);
          return;
        } else if (photoType === PhotoType.Viewer) {
          const compressor = new Compressor(itemValue, {
            quality: 0.6,
            maxWidth: 2560,
            mimeType,
            checkOrientation: false,
            success(result) {
              const reader = new FileReader();

              reader.addEventListener('loadend', () => {
                // reader.result contains the contents of blob as a DataURL
                resolve(reader.result);
              });
              reader.readAsDataURL(result);
            },
            error(err) {
              console.log(err.message);
            }
          });
          console.debug(compressor);
          return;
        }
      });
    } catch (error) {
      console.error('Compress failed', error);
      return itemValue;
    }
  }

  static async addPhotosToAlbum(
    albumId: string,
    photoIds: string[]
  ): Promise<boolean> {
    if (!photoIds || photoIds.length < 1) {
      return false;
    }
    let album = [];
    if (albumId) {
      const albumsResponse = await PhotosService.getPhotosList(true, albumId);
      album = albumsResponse.photosList;
      if ((!album || album == null) && albumsResponse.errorsList.length === 0) {
        album = [];
      }
    }
    for (const photoId of photoIds) {
      const photoMetadata = await PhotosService.getPhotoMetaData(photoId);
      if (photoMetadata && !photoMetadata.albums) {
        photoMetadata.albums = [];
      }
      if (photoMetadata && !photoMetadata.albums.includes(albumId)) {
        album.unshift({
          id: photoId,
          filename: photoMetadata.filename
        });
        photoMetadata.albums.push(albumId);
        await PhotosService.setPhotoMetaData(photoId, photoMetadata);
      }
    }

    await StorageService.setItem(albumId, JSON.stringify(album));

    await AlbumsService.updateAlbumThumbnail(albumId, photoIds[0]);

    return true;
  }

  static async deletePhoto(photoId: string): Promise<boolean> {
    let returnState = false;
    const metadata = await PhotosService.getPhotoMetaData(photoId);
    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId);
      await StorageService.deleteItem(photoId + '-meta');
      await StorageService.deleteItem(photoId + '-thumbnail');
      await StorageService.deleteItem(photoId + '-viewer');
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    // Remove photo from main list
    returnState = await PhotosService.removePhotoFromList(photoId);

    // Remove photo from albums
    if (metadata.albums && metadata.albums.length > 0) {
      for (const albumId of metadata.albums) {
        returnState = await PhotosService.removePhotoFromList(photoId, albumId);
        if (!returnState) {
          return false;
        }
      }
    }
    return returnState;
  }

  static async updatePhoto(photoId: string, source: string): Promise<boolean> {
    let returnState = false;
    try {
      await StorageService.setItem(photoId, source);
      // TODO: Update compressed
      returnState = true;
    } catch (error) {
      console.log(error, source);
      returnState = false;
    }

    return returnState;
  }

  static async removePhotoFromList(
    photoId: string,
    albumId?: string
  ): Promise<boolean> {
    const photosListResponse = await PhotosService.getPhotosList(true, albumId);
    const photosList = photosListResponse.photosList;
    const listName = albumId ? albumId : 'picture-list.json';

    let index = 0;
    for (const photo of photosList) {
      if (photoId === photo.id) {
        photosList.splice(index, 1);
        await StorageService.setItem(listName, JSON.stringify(photosList));

        if (photosList.length > 0) {
          await AlbumsService.updateAlbumThumbnail(albumId, photosList[0].id);
        }
        break;
      }
      index++;
    }

    const metadata: PhotoMetadata = await PhotosService.getPhotoMetaData(
      photoId
    );
    if (metadata) {
      metadata.albums = metadata.albums.includes(albumId)
        ? metadata.albums.filter(album => album !== albumId)
        : metadata.albums;
      await PhotosService.setPhotoMetaData(photoId, metadata);
    }

    return true;
  }

  static async deletePhotos(photoIds: string[]): Promise<boolean> {
    let returnState = false;
    try {
      for (const photoId of photoIds) {
        const result = await PhotosService.deletePhoto(photoId);
        if (!result) {
          throw result;
        }
      }
      returnState = true;
    } catch (error) {
      console.error(error);
      returnState = false;
    }

    return returnState;
  }

  static async removePhotosFromList(
    photoIds: string[],
    albumId?: string
  ): Promise<boolean> {
    let returnState = false;
    try {
      for (const photoId of photoIds) {
        const result = await PhotosService.removePhotoFromList(
          photoId,
          albumId
        );
        if (!result) {
          throw result;
        }
      }
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    return returnState;
  }

  static async getNextAndPreviousPhoto(
    id: string,
    albumId?: string
  ): Promise<any> {
    const response = { previousId: null, nextId: null };
    const photosListResponse = await PhotosService.getPhotosList(
      false,
      albumId
    );
    const photosList = photosListResponse.photosList;

    let index = 0;
    for (const photo of photosList) {
      // Current photo
      if (photo.id === id) {
        if (photosList[index - 1]) {
          response.previousId = photosList[index - 1].id;
        }
        if (photosList[index + 1]) {
          response.nextId = photosList[index + 1].id;
        }
        break;
      }
      index++;
    }

    return response;
  }

  static async getPhotoMetaData(photoId: string): Promise<PhotoMetadata> {
    const cachedPhotoMetaData: string = await StorageService.getItem(
      photoId + '-meta'
    );

    if (!cachedPhotoMetaData) {
      const photosListResponse = await PhotosService.getPhotosList();
      const photosList = photosListResponse.photosList;
      let photoMetaData: PhotoMetadata;
      let index = 0;
      for (const photo of photosList) {
        // Current photo
        if (photo.id === photoId) {
          photoMetaData = photosList[index];
          PhotosService.setPhotoMetaData(photoId, cachedPhotoMetaData);
          break;
        }
        index++;
      }
      return photoMetaData;
    } else if (cachedPhotoMetaData) {
      return JSON.parse(cachedPhotoMetaData);
    } else {
      return null;
    }
  }

  static async setPhotoMetaData(
    photoId: string,
    metadata: any
  ): Promise<boolean> {
    // id and metadata is required
    if (!photoId || !metadata) {
      return false;
    }

    // Save photos metadata to a file
    await StorageService.setItem(photoId + '-meta', JSON.stringify(metadata));

    return true;
  }

  static async rotatePhoto(photoId: string): Promise<boolean> {
    const metadata = await PhotosService.getPhotoMetaData(photoId);

    let currentOrientation = 1;

    if (
      metadata &&
      metadata.stats &&
      metadata.stats.exifdata &&
      metadata.stats.exifdata.tags.Orientation
    ) {
      currentOrientation = metadata.stats.exifdata.tags.Orientation;
    }

    if (!metadata || !metadata.stats) {
      metadata.stats = { exifdata: { tags: {} } };
    }

    if (!metadata || !metadata.stats.exifdata) {
      metadata.stats.exifdata = { tags: {} };
    }

    if (!metadata || !metadata.stats.exifdata.tags) {
      metadata.stats.exifdata.tags = {};
    }

    if (currentOrientation === 1) {
      metadata.stats.exifdata.tags.Orientation = 6;
    } else if (currentOrientation === 6) {
      metadata.stats.exifdata.tags.Orientation = 3;
    } else if (currentOrientation === 3) {
      metadata.stats.exifdata.tags.Orientation = 8;
    } else {
      metadata.stats.exifdata.tags.Orientation = 1;
    }

    return PhotosService.setPhotoMetaData(photoId, metadata);
  }
}
