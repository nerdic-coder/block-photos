import StorageService from './storage-service';

export default class SettingsService {
  static async getAnalyticsSetting(): Promise<boolean> {
    return (await StorageService.getItem('analytics-settings')) === 'true';
  }

  static async setAnalyticsSetting(allowAnalytics: boolean): Promise<any> {
    return StorageService.setItem(
      'analytics-settings',
      allowAnalytics.toString()
    );
  }
}
