import { putFile, getFile, deleteFile } from 'blockstack';
import uniqid from 'uniqid';

import CacheService from './CacheService';

export default class PictureService {

  constructor() {
    this.cache = new CacheService();
  }

  async getPicturesList(sync) {
    let cachedPicturesList = [];
    const errorsList = [];
    try {
      const rawCachedPicturesList = await this.cache.getItem('cachedPicturesList');
      cachedPicturesList = JSON.parse(rawCachedPicturesList);
    } catch (error) {
      errorsList.push('err_cache');
    }

    if (sync || !cachedPicturesList || cachedPicturesList.length === 0) {
      try {
        // Get the contents of the file picture-list.json
        let rawPicturesList = await getFile("picture-list.json");
        if (rawPicturesList) {
          const picturesList = JSON.parse(rawPicturesList);
          cachedPicturesList = picturesList;
          await this.cache.setItem('cachedPicturesList', rawPicturesList);
        }
      } catch (error) {
        errorsList.push('err_list');
      }
    }

    return { 
      picturesList: cachedPicturesList, 
      errorsList: [errorsList] 
    };

  }

  async loadPicture(id) {

    let cachedPicture = await this.cache.getItem(id);
    
    if (!cachedPicture) {
      cachedPicture = await getFile(id);
      this.cache.setItem(id, cachedPicture);
    }
    return cachedPicture;
  }

  async uploadPictures(filesData) {
    const picturesListResponse = await this.getPicturesList(true);
    const picturesList = picturesListResponse.picturesList;
    const errorsList = [];
    for (let file of filesData) {
      let id = uniqid() + file.filename;
      let metadata = {
        "id": id,
        "uploadedDate": new Date(),
        "stats": file.stats
      };
      try {
        await putFile(id, file.data);
        await this.cache.setItem(id, file.data);
        picturesList.unshift(metadata);
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
    }

    await this.cache.setItem('cachedPicturesList', JSON.stringify(picturesList));
    await putFile("picture-list.json", JSON.stringify(picturesList));
    return { picturesList: picturesList, errorsList: errorsList };
  }

  async deletePicture(id) {
    let returnState = false;
    try {
      // put empty file, since deleteFile is yet not supported
      await putFile(id, '');
      await deleteFile(id);
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    let picturesListResponse = await this.getPicturesList(true);
    const picturesList = picturesListResponse.picturesList;
    
    let index = 0;
    for (let picture of picturesList) {
      if (id === picture.id) {
        picturesList.splice(index, 1);
        await this.cache.setItem('cachedPicturesList', JSON.stringify(picturesList));
        await putFile("picture-list.json", JSON.stringify(picturesList));
        return true;
      }
      index++;
    }
    return false;
  }

  async getNextAndPreviousPicture(id) {
    const response = { "previousId": null, "nextId": null };
    const picturesListResponse = await this.getPicturesList(true);
    const picturesList = picturesListResponse.picturesList;

    let index = 0;
    for (let picture of picturesList) {
      // Current picture
      if (picture.id === id) {
        if (picturesList[index-1]) {
          response.previousId = picturesList[index-1].id;
        }
        if (picturesList[index+1]) {
          response.nextId = picturesList[index+1].id;
        }
        break;
      }
      index++;
    }
    
    return response;
  }

  async getPictureMetaData(id) {
    let response = { };
    const picturesListResponse = await this.getPicturesList();
    const picturesList = picturesListResponse.picturesList;

    let index = 0;
    for (let picture of picturesList) {
      // Current picture
      if (picture.id === id) {
        response = picturesList[index];
        break;
      }
      index++;
    }

    return response;
  }
}
