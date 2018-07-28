import * as localForage from "localforage";

export default class StorageService {

  constructor() {
    this.storage = localForage;
  }

  async getItem(itemId) {
    return await this.storage.getItem(itemId);
  }

  async setItem(itemId, itemValue) {
    await this.storage.setItem(itemId, itemValue);
  }

  clear() {
    this.storage.clear();
  }
}
