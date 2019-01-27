import StorageService from './storage-service';

export default class SettingsService {
  static async getAnalyticsSetting(updateCache?: boolean): Promise<boolean> {
    return (
      (await StorageService.getItem('analytics-settings', updateCache)) ===
      'true'
    );
  }

  static async setAnalyticsSetting(allowAnalytics: boolean): Promise<any> {
    return StorageService.setItem(
      'analytics-settings',
      allowAnalytics.toString()
    );
  }
}
