import { putFile, getFile } from 'blockstack';
import uniqid from 'uniqid';

import CacheService from './CacheService';

export default class PhotosService {

  constructor() {
    this.cache = new CacheService();
  }

  async getPhotosList(sync) {
    let cachedPhotosList = [];
    const errorsList = [];
    try {
      const rawCachedPhotosList = await this.cache.getItem('cachedPhotosList');
      if (rawCachedPhotosList) {
        cachedPhotosList = JSON.parse(rawCachedPhotosList);
      }
    } catch (error) {
      errorsList.push('err_cache');
    }

    if (sync || !cachedPhotosList || cachedPhotosList.length === 0) {
      try {
        // Get the contents of the file picture-list.json
        let rawPhotosList = await getFile("picture-list.json");
        if (rawPhotosList) {
          const photosList = JSON.parse(rawPhotosList);
          cachedPhotosList = photosList;
          await this.cache.setItem('cachedPhotosList', rawPhotosList);
        }
      } catch (error) {
        errorsList.push('err_list');
      }
    }

    return { 
      photosList: cachedPhotosList, 
      errorsList: errorsList
    };

  }

  async loadPhoto(id) {

    let cachedPhoto = await this.cache.getItem(id);
    
    if (!cachedPhoto) {
      cachedPhoto = await getFile(id);
      this.cache.setItem(id, cachedPhoto);
    }

    if (cachedPhoto && !cachedPhoto.match('data:image/.*') ) {
      cachedPhoto = 'data:image/png;base64,' + cachedPhoto;
    }
    return cachedPhoto;
  }

  async uploadPhoto(file, event) {
    const photosListResponse = await this.getPhotosList(true);
    let photosList = photosListResponse.photosList;
    if ((!photosList || photosList == null) && photosListResponse.errorsList.length === 0) {
      photosList = [];
    }

    const errorsList = [];
    let id = uniqid() + file.filename.replace(".", "");
    let metadata = {
      "id": id,
      "filename": file.filename,
      "uploadedDate": new Date(),
      "stats": file.stats
    };
    try {
      await putFile(id, event.target.result);
      await this.cache.setItem(id, event.target.result);

      photosList.unshift(metadata);
    } catch (error) {
      const fileSizeInMegabytes = file.stats.size / 1000000;
      if (fileSizeInMegabytes >= 5) {
        errorsList.push({
          "id": file.filename,
          "errorCode": "err_filesize"
        });
      } else {
        errorsList.push({
          "id": file.filename,
          "errorCode": "err_failed"
        });
      }
    }

    await this.cache.setItem('cachedPhotosList', JSON.stringify(photosList));
    await putFile("picture-list.json", JSON.stringify(photosList));
    return { photosList: photosList, errorsList: errorsList };
  }

  async deletePhoto(id) {
    let returnState = false;
    try {
      // Put empty file, since deleteFile is yet not supported
      await putFile(id, '');
      // TODO: add back when available.
      // await deleteFile(id);
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    let photosListResponse = await this.getPhotosList(true);
    const photosList = photosListResponse.photosList;
    
    let index = 0;
    for (let photo of photosList) {
      if (id === photo.id) {
        photosList.splice(index, 1);
        await this.cache.setItem('cachedPhotosList', JSON.stringify(photosList));
        await putFile("picture-list.json", JSON.stringify(photosList));
        return true;
      }
      index++;
    }
    return false;
  }

  async getNextAndPreviousPhoto(id) {
    const response = { "previousId": null, "nextId": null };
    const photosListResponse = await this.getPhotosList(true);
    const photosList = photosListResponse.photosList;

    let index = 0;
    for (let photo of photosList) {
      // Current photo
      if (photo.id === id) {
        if (photosList[index-1]) {
          response.previousId = photosList[index-1].id;
        }
        if (photosList[index+1]) {
          response.nextId = photosList[index+1].id;
        }
        break;
      }
      index++;
    }
    
    return response;
  }

  async getPhotoMetaData(id) {
    let response = { };
    const photosListResponse = await this.getPhotosList();
    const photosList = photosListResponse.photosList;

    let index = 0;
    for (let photo of photosList) {
      // Current photo
      if (photo.id === id) {
        response = photosList[index];
        break;
      }
      index++;
    }

    return response;
  }

  async setPhotoMetaData(id, metadata) {

    // id and metadata is required
    if (!id || !metadata) {
      return false;
    }
    const photosListResponse = await this.getPhotosList();
    const photosList = photosListResponse.photosList;
    let photoFound = false;
    let index = 0;
    for (let photo of photosList) {
      // Current photo
      if (photo.id === id) {
        photosList[index] = metadata;
        photoFound = true;
        break;
      }
      index++;
    }

    // Don't update if photo don't exist
    if (!photoFound) {
      return false;
    }

    await this.cache.setItem('cachedPhotosList', JSON.stringify(photosList));
    await putFile("picture-list.json", JSON.stringify(photosList));

    return photosList;
  }

  async rotatePhoto(id) {
    const metadata = await this.getPhotoMetaData(id);

    let currentOrientation = 1;

    if (metadata && metadata.stats && metadata.stats.exifdata 
      && metadata.stats.exifdata.tags.Orientation) {
        currentOrientation = metadata.stats.exifdata.tags.Orientation;
    }

    if (!metadata.stats) {
      metadata.stats = { exifdata: { tags: { }}};
    }

    if (!metadata.stats.exifdata) {
      metadata.stats.exifdata = { tags: { }};
    }

    if (!metadata.stats.exifdata.tags) {
      metadata.stats.exifdata.tags = { };
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

    return await this.setPhotoMetaData(id, metadata);
  }
}
