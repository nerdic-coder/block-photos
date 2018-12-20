import localForage from 'localforage';

export default class CacheService {

  private storage: any;

  constructor() {
    this.storage = localForage;
  }

  async getItem(itemId: string) {
    return this.storage.getItem(itemId);
  }

  async setItem(itemId: string, itemValue: any) {
    await this.storage.setItem(itemId, itemValue);
  }

  clear() {
    this.storage.clear();
  }
}
