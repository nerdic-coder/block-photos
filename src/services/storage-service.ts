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
      item = await userSession.getFile(itemId, {
        decrypt: false
      });
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
    await userSession.putFile(itemId, itemValue, {
      encrypt: false
    });
    if (cacheItem) {
      await CacheService.setItem(itemId, itemValue);
    }

    const timeStamp = Math.floor(Date.now() / 1000);
    userSession.putFile('block-photos-last-updated', timeStamp.toString());
    CacheService.setItem('block-photos-last-checked', timeStamp.toString());
  }

  static async deleteItem(itemId: string) {
    const userSession = new blockstack.UserSession();
    await userSession.deleteFile(itemId);
    await CacheService.deleteItem(itemId);
  }

  static clear() {
    CacheService.clear();
  }

  static async checkUpdatedTimestamp(): Promise<boolean> {
    const checkedTimestamp = await CacheService.getItem(
      'block-photos-last-checked'
    );
    const timeStamp = Math.floor(Date.now() / 1000);
    if (!checkedTimestamp) {
      await CacheService.setItem(
        'block-photos-last-checked',
        timeStamp.toString()
      );
      return false;
    } else {
      const userSession = new blockstack.UserSession();
      const updatedTimeStamp = await userSession.getFile(
        'block-photos-last-updated'
      );
      if (updatedTimeStamp > checkedTimestamp) {
        await CacheService.setItem(
          'block-photos-last-checked',
          timeStamp.toString()
        );
        return true;
      } else {
        return false;
      }
    }
  }
}
