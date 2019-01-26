import CacheService from './cache-service';

declare var blockstack;

export default class StorageService {
  static async getItem(itemId: string, updateCache?: boolean) {
    let item = await CacheService.getItem(itemId);

    if (!item || updateCache) {
      item = await blockstack.getFile(itemId);
      CacheService.setItem(itemId, item);
    }

    return item;
  }

  static async setItem(itemId: string, itemValue: any) {
    await blockstack.putFile(itemId, itemValue);
    await CacheService.setItem(itemId, itemValue);
  }

  static clear() {
    CacheService.clear();
  }
}
