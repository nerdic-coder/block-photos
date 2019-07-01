import CacheService from './cache-service';
import SettingsService from './settings-service';

declare var blockstack;

export default class StorageService {
  static async getItem(
    itemId: string,
    updateCache?: boolean,
    forceUpdateCache?: boolean,
    username?: string,
    decrypt = true
  ) {
    try {
      let item = await CacheService.getItem(itemId);
      if (!item || forceUpdateCache || username) {
        const appConfig = SettingsService.getAppConfig();
        const userSession = new blockstack.UserSession({ appConfig });
        item = await userSession.getFile(itemId, { decrypt, username });
        if ((updateCache || forceUpdateCache) && !username) {
          CacheService.setItem(itemId, item);
        }
      }

      return item;
    } catch (error) {
      if (error.toString().includes("Cannot read property '-1' of null")) {
        StorageService.deleteItem(itemId);
      }
    }
  }

  static async setItem(
    itemId: string,
    itemValue: any,
    cacheItem = true,
    encrypt = true
  ): Promise<void> {
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    await userSession.putFile(itemId, itemValue, { encrypt });
    if (cacheItem) {
      await CacheService.setItem(itemId, itemValue);
    }
  }

  static async deleteItem(itemId: string) {
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
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
      const appConfig = SettingsService.getAppConfig();
      const userSession = new blockstack.UserSession({ appConfig });
      const updatedTimeStamp = await userSession.getFile(
        'block-photos-last-updated',
        { decrypt: false }
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

  static async updateTimestamp(updateCache = true) {
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });

    const timeStamp = Math.floor(Date.now() / 1000);
    userSession.putFile('block-photos-last-updated', timeStamp.toString(), {
      encrypt: false
    });
    if (updateCache) {
      CacheService.setItem('block-photos-last-checked', timeStamp.toString());
    }
  }
}
