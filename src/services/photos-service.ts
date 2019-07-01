import StorageService from './storage-service';
import Compressor from 'compressorjs';

import AlbumsService from './albums-service';
import { PhotoType } from '../models/photo-type';
import { Plugins } from '@capacitor/core';

export default class PhotosService {
  static async getPhotosList(
    updateCache?: boolean,
    albumId?: string
  ): Promise<any> {
    let cachedPhotosList = [];
    const errorsList = [];
    try {
      const rawCachedPhotosList = albumId
        ? await StorageService.getItem(albumId, updateCache, updateCache)
        : await StorageService.getItem(
            'picture-list.json',
            updateCache,
            updateCache
          );

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
    photoType?: PhotoType,
    returnPhototype?: boolean,
    username?: string,
    decrypt = true
  ): Promise<any> {
    const mainId = metadata.id;
    let updateCache = false;
    if (photoType === PhotoType.Thumbnail) {
      metadata.id = metadata.id + '-thumbnail';
      updateCache = true;
    } else if (photoType === PhotoType.Viewer) {
      metadata.id = metadata.id + '-viewer';
    }
    let rawPhoto = await StorageService.getItem(
      metadata.id,
      updateCache,
      false,
      username,
      decrypt
    );

    if (!rawPhoto && photoType === PhotoType.Thumbnail) {
      rawPhoto = await StorageService.getItem(
        mainId,
        false,
        false,
        username,
        decrypt
      );
      const { Device } = Plugins;
      const info = await Device.getInfo();
      if (info.model !== 'iPhone' && info.model !== 'iPad') {
        const fetchedData = await fetch(rawPhoto);
        const blob = await fetchedData.blob();
        const thumbnailData = await PhotosService.compressPhoto(
          blob,
          PhotoType.Thumbnail,
          metadata.type,
          false
        );
        await StorageService.setItem(mainId + '-thumbnail', thumbnailData);

        rawPhoto = thumbnailData;
      } else {
        photoType = PhotoType.Download;
      }
    } else if (!rawPhoto && photoType === PhotoType.Viewer) {
      rawPhoto = await StorageService.getItem(
        mainId,
        false,
        false,
        username,
        decrypt
      );
      const { Device } = Plugins;
      const info = await Device.getInfo();
      if (info.model !== 'iPhone' && info.model !== 'iPad') {
        const fetchedData = await fetch(rawPhoto);
        const blob = await fetchedData.blob();
        const viewerData = await PhotosService.compressPhoto(
          blob,
          PhotoType.Viewer,
          metadata.type
        );
        await StorageService.setItem(mainId + '-viewer', viewerData, true);
        rawPhoto = viewerData;
      } else {
        photoType = PhotoType.Download;
      }
    }

    if (!rawPhoto) {
      await PhotosService.deletePhoto(mainId);
      return false;
    }

    if (rawPhoto && !rawPhoto.match('data:image/.*')) {
      metadata.type
        ? (rawPhoto = 'data:' + metadata.type + ';base64,' + rawPhoto)
        : (rawPhoto = 'data:image/jpeg;base64,' + rawPhoto);
    }

    if (returnPhototype) {
      return { base64: rawPhoto, photoType };
    } else {
      return rawPhoto;
    }
  }

  static async uploadPhoto(
    metadata: PhotoMetadata,
    originalData: any,
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
      await StorageService.setItem(metadata.id, originalData, false);
      if (thumbnailData) {
        await StorageService.setItem(metadata.id + '-thumbnail', thumbnailData);
      }
      if (viewerData) {
        await StorageService.setItem(metadata.id + '-viewer', viewerData, true);
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

  static async uploadSharedPhoto(
    data: any,
    metadata: PhotoMetadata
  ): Promise<any> {
    const errorsList = [];
    try {
      metadata.shared = true;
      metadata.id = metadata.id + '-shared';
      const sharedResponse = await PhotosService.getPhotosList(
        true,
        'shared-list.json'
      );
      let sharedList = sharedResponse.photosList;
      if (
        (!sharedList || sharedList == null) &&
        sharedResponse.errorsList.length === 0
      ) {
        sharedList = [];
      }

      const listdata = {
        id: metadata.id,
        filename: metadata.filename
      };
      // Save raw data to a file
      await StorageService.setItem(metadata.id, data, false, false);
      // Save photos metadata to a file
      await StorageService.setItem(
        metadata.id + '-meta',
        JSON.stringify(metadata),
        false,
        false
      );
      // console.log('originalMetadata.id', originalMetadata.id);
      // // Update shared flag on original metadata
      // await StorageService.setItem(
      //   originalMetadata.id + '-meta',
      //   JSON.stringify(originalMetadata)
      // );

      sharedList.unshift(listdata);

      await StorageService.setItem(
        'shared-list.json',
        JSON.stringify(sharedList)
      );
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

    return errorsList;
  }

  static async compressPhoto(
    itemValue: any,
    photoType?: PhotoType,
    mimeType = 'image/jpeg',
    checkOrientation = false
  ) {
    try {
      return new Promise(async resolve => {
        if (photoType === PhotoType.Thumbnail) {
          const compressor = new Compressor(itemValue, {
            quality: 0.4,
            maxWidth: 500,
            mimeType,
            checkOrientation,
            success(result) {
              const reader = new FileReader();

              reader.addEventListener('loadend', () => {
                // reader.result contains the contents of blob as a DataURL
                resolve(reader.result);
              });
              reader.readAsDataURL(result);
            },
            error(err) {
              console.error(err.message);
            }
          });
          console.debug(compressor);
          return;
        } else if (photoType === PhotoType.Viewer) {
          const compressor = new Compressor(itemValue, {
            quality: 0.6,
            maxWidth: 2560,
            mimeType,
            checkOrientation,
            success(result) {
              const reader = new FileReader();

              reader.addEventListener('loadend', () => {
                // reader.result contains the contents of blob as a DataURL
                resolve(reader.result);
              });
              reader.readAsDataURL(result);
            },
            error(err) {
              console.error(err.message);
            }
          });
          console.debug(compressor);
          return;
        } else {
          const compressor = new Compressor(itemValue, {
            quality: 1,
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
              console.error(err.message);
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

  static async deletePhoto(
    photoId: string,
    skipMetadata?: boolean,
    decrypt = true
  ): Promise<boolean> {
    let returnState = false;
    let metadata = null;
    if (!skipMetadata) {
      metadata = await PhotosService.getPhotoMetaData(photoId, null, decrypt);
    }
    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId);
      returnState = true;
    } catch (error) {
      returnState = error.message.includes('DoesNotExist') ? true : false;
    }

    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId + '-meta');
      returnState = true;
    } catch (error) {
      returnState = error.message.includes('DoesNotExist') ? true : false;
    }

    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId + '-thumbnail');
      returnState = true;
    } catch (error) {
      returnState = error.message.includes('DoesNotExist') ? true : false;
    }

    try {
      // Delete photo, compressed photos and the photo metadata
      await StorageService.deleteItem(photoId + '-viewer');
      returnState = true;
    } catch (error) {
      returnState = error.message.includes('DoesNotExist') ? true : false;
    }

    if (!returnState) {
      return false;
    }

    if (decrypt) {
      // Remove photo from main list
      returnState = await PhotosService.removePhotoFromList(photoId);

      // Remove photo from albums
      if (!skipMetadata && metadata.albums && metadata.albums.length > 0) {
        for (const albumId of metadata.albums) {
          returnState = await PhotosService.removePhotoFromList(
            photoId,
            albumId
          );
          if (!returnState) {
            return false;
          }
        }
      }
    } else {
      // Remove photo from shared list
      returnState = await PhotosService.removePhotoFromList(
        photoId,
        'shared-list.json'
      );
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
      console.error(error, source);
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

  static async deletePhotos(
    photoIds: string[],
    decrypt = true
  ): Promise<boolean> {
    let returnState = false;
    try {
      for (const photoId of photoIds) {
        const result = await PhotosService.deletePhoto(photoId, false, decrypt);
        if (!result) {
          throw result;
        }
      }
      returnState = true;
    } catch (error) {
      console.error(error);
      returnState = false;
    }

    StorageService.updateTimestamp();

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

  static async getPhotoMetaData(
    photoId: string,
    username?: string,
    decrypt = true
  ): Promise<PhotoMetadata> {
    const cachedPhotoMetaData: string = await StorageService.getItem(
      photoId + '-meta',
      true,
      true,
      username,
      decrypt
    );

    if (!cachedPhotoMetaData) {
      return null;
    } else {
      return JSON.parse(cachedPhotoMetaData);
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

  static async rotatePhoto(photoId: string): Promise<number> {
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

    const setResult = await PhotosService.setPhotoMetaData(photoId, metadata);

    if (setResult) {
      return metadata.stats.exifdata.tags.Orientation;
    } else {
      return null;
    }
  }
}
