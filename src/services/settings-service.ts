import StorageService from './storage-service';

declare var blockstack;

export default class SettingsService {
  static async getAnalyticsSetting(updateCache?: boolean): Promise<boolean> {
    const appConfig = SettingsService.getAppConfig();
    const userSession = new blockstack.UserSession({ appConfig });
    if (userSession.isUserSignedIn()) {
      return (
        (await StorageService.getItem('analytics-settings', updateCache)) ===
        'true'
      );
    } else {
      return false;
    }
  }

  static async setAnalyticsSetting(allowAnalytics: boolean): Promise<any> {
    return StorageService.setItem(
      'analytics-settings',
      allowAnalytics.toString()
    );
  }

  static getAppConfig() {
    return new blockstack.AppConfig(['store_write', 'publish_data']);
  }
}
