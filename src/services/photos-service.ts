import StorageService from './storage-service';
import uuidv4 from 'uuid/v4';

import AlbumsService from './albums-service';

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

  static async loadPhoto(id: string): Promise<any> {
    let cachedPhoto = await StorageService.getItem(id);

    if (!cachedPhoto) {
      return false;
    }

    if (cachedPhoto && !cachedPhoto.match('data:image/.*')) {
      cachedPhoto = 'data:image/png;base64,' + cachedPhoto;
    }
    return cachedPhoto;
  }

  static async uploadPhoto(
    file: any,
    data: any,
    albumId?: string
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
    const photoId = uuidv4() + file.filename.replace('.', '').replace(' ', '');
    const listdata = {
      id: photoId,
      filename: file.filename
    };
    const metadata = {
      id: photoId,
      filename: file.filename,
      uploadedDate: new Date(),
      stats: file.stats,
      albums: [albumId]
    };
    try {
      // Save raw data to a file
      await StorageService.setItem(photoId, data);

      // Save photos metadata to a file
      await StorageService.setItem(photoId + '-meta', JSON.stringify(metadata));

      photosList.unshift(listdata);
      if (albumId) {
        await AlbumsService.updateAlbumThumbnail(albumId, photoId);

        album.unshift(listdata);
      }
    } catch (error) {
      const fileSizeInMegabytes = file.stats.size / 1000000;
      if (fileSizeInMegabytes >= 5) {
        errorsList.push({
          id: file.filename,
          errorCode: 'err_filesize'
        });
      } else {
        errorsList.push({
          id: file.filename,
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
      // Delete photo and the photo metadata
      await StorageService.deleteItem(photoId);
      await StorageService.deleteItem(photoId + '-meta');
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

        await AlbumsService.updateAlbumThumbnail(albumId, photosList[0].id);
        break;
      }
      index++;
    }

    const metadata = await PhotosService.getPhotoMetaData(photoId);
    if (metadata && metadata !== 'deleted') {
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
    const photosListResponse = await PhotosService.getPhotosList(true, albumId);
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

  static async getPhotoMetaData(photoId: string): Promise<any> {
    let cachedPhotoMetaData = await StorageService.getItem(photoId + '-meta');

    if (!cachedPhotoMetaData) {
      const photosListResponse = await PhotosService.getPhotosList();
      const photosList = photosListResponse.photosList;

      let index = 0;
      for (const photo of photosList) {
        // Current photo
        if (photo.id === photoId) {
          cachedPhotoMetaData = photosList[index];
          PhotosService.setPhotoMetaData(photoId, cachedPhotoMetaData);
          break;
        }
        index++;
      }
      return cachedPhotoMetaData;
    } else if (cachedPhotoMetaData !== 'deleted') {
      return JSON.parse(cachedPhotoMetaData);
    } else {
      return false;
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

    if (!metadata.stats) {
      metadata.stats = { exifdata: { tags: {} } };
    }

    if (!metadata.stats.exifdata) {
      metadata.stats.exifdata = { tags: {} };
    }

    if (!metadata.stats.exifdata.tags) {
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
