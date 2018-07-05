
import { putFile, getFile } from 'blockstack';

export default class PictureService {

  constructor() {
    this.storage = window.localStorage;
  }

  async getPictures(sync) {
    let cachedPicturesList = this.storage.getItem('cachedPicturesList');
    if (sync || !cachedPicturesList || cachedPicturesList.length === 0) {
      try {
        // Get the contents of the file picture-list.json
        let rawPictureList = await getFile("picture-list.json");
        if (rawPictureList) {
          const picturesList = JSON.parse(rawPictureList);
          cachedPicturesList = picturesList;
          this.storage.setItem('cachedPicturesList', picturesList);
        }
      } catch (error) {
        console.log('Blockstack error!');
        console.log(error);
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

  addPicture(photo) {
  }

}
