import CacheService from './cache-service';

declare var blockstack;

export default class StorageService {
  static async getItem(itemId: string, updateCache?: boolean) {
    let item = await CacheService.getItem(itemId);

    if (!item || updateCache) {
      const userSession = new blockstack.UserSession();
      item = await userSession.getFile(itemId);
      CacheService.setItem(itemId, item);
    }

    return item;
  }

  static async setItem(itemId: string, itemValue: any) {
    const userSession = new blockstack.UserSession();
    await userSession.putFile(itemId, itemValue);
    await CacheService.setItem(itemId, itemValue);
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
