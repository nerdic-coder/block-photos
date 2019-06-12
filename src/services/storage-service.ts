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
    console.log('getFileUrl', await userSession.getFileUrl(itemId));
    if (cacheItem) {
      await CacheService.setItem(itemId, itemValue);
    }

    const timeStamp = Math.floor(Date.now() / 1000);
    // TODO: Can be stored decrypted and only when an update flag is given
    userSession.putFile('block-photos-last-updated', timeStamp.toString());
    CacheService.setItem('block-photos-last-checked', timeStamp.toString());
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
