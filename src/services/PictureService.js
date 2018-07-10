
import { putFile, getFile } from 'blockstack';
import uniqid from 'uniqid';

export default class PictureService {

  constructor() {
    this.storage = window.localStorage;
  }

  async getPicturesList(sync) {
    let cachedPicturesList = null;
    try {
      cachedPicturesList = JSON.parse(this.storage.getItem('cachedPicturesList'));
    } catch (error) {
      // TODO: Deal with error
    }

    if (sync || !cachedPicturesList || cachedPicturesList.length === 0) {
      try {
        // Get the contents of the file picture-list.json
        let rawPicturesList = await getFile("picture-list.json");
        if (rawPicturesList) {
          const picturesList = JSON.parse(rawPicturesList);
          cachedPicturesList = picturesList;
          this.storage.setItem('cachedPicturesList', rawPicturesList);
        }
      } catch (error) {
        // TODO: Deal with error
      }
    }
    return cachedPicturesList;
  }

  async loadPicture(id) {
    let cachedPicture = this.storage.getItem(id);
    if (!cachedPicture) {
      cachedPicture = await getFile(id);
      this.storage.setItem(id, cachedPicture);
    }
    return cachedPicture;
  }

  async uploadPictures(filesData) {
    let picturesList = await this.getPicturesList(true);
    for (let file of filesData) {
      let id = uniqid() + file.filename;
      let metadata = {
        "id": id,
        "uploadedDate": new Date()
      };
      await putFile(id, file.data);
      picturesList.unshift(metadata);
    }

    this.storage.setItem('cachedPicturesList', JSON.stringify(picturesList));
    await putFile("picture-list.json", JSON.stringify(picturesList));
    return picturesList;
  }

  async deletePicture(id) {
    let returnState = false;
    try {
      // put empty file, since deleteFile is yet not supported
      await putFile(id, '');
      returnState = true;
    } catch (error) {
      returnState = false;
    }

    if (!returnState) {
      return false;
    }

    let picturesList = await this.getPicturesList(true);
    let index = 0;
    for (let picture of picturesList) {
      if (id === picture.id) {
        picturesList.splice(index, 1);
        this.storage.setItem('cachedPicturesList', JSON.stringify(picturesList));
        await putFile("picture-list.json", JSON.stringify(picturesList));
        return true;
      }
      index++;
    }
    return false;
  }
}
