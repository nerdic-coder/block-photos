import CacheService from './cache-service';

declare var blockstack;

export default class StorageService {
  static async getItem(
    itemId: string,
    updateCache?: boolean,
    forceUpdateCache?: boolean
  ) {
    let item = await CacheService.getItem(itemId);
    if (!item || forceUpdateCache) {
      const userSession = new blockstack.UserSession();
      item = await userSession.getFile(itemId);
      if (updateCache || forceUpdateCache) {
        CacheService.setItem(itemId, item);
      }
    }

    return item;
  }

  static async setItem(
    itemId: string,
    itemValue: any,
    cacheItem = true
  ): Promise<void> {
    const userSession = new blockstack.UserSession();
    await userSession.putFile(itemId, itemValue);
    if (cacheItem) {
      await CacheService.setItem(itemId, itemValue);
    }
  }

  static async deleteItem(itemId: string) {
    const userSession = new blockstack.UserSession();
    await userSession.putFile(itemId, '');
    // TODO: wait for implementation
    // await userSession.deleteFile(itemId);
    await CacheService.deleteItem(itemId);
  }

  static clear() {
    CacheService.clear();
  }
}
